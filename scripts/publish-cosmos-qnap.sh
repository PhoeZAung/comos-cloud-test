#!/bin/sh
# Manual, commit-pinned release. Only Cosmos app/data are touched.
set -eu
umask 077
BASE=/share/Service/Container/Cosmos
SHA=${1:-}
case "$SHA" in *[!0-9a-f]*|'') echo 'Supply a full approved commit SHA.' >&2; exit 2;; esac
test "${#SHA}" -eq 40
PATH=/share/CACHEDEV1_DATA/.qpkg/container-station/bin:$PATH
export PATH
test -f "$BASE/Dockerfile"
test -f "$BASE/compose.yaml"
test -f "$BASE/.env"
test -f "$BASE/backup-cosmos.sh"
mkdir "$BASE/.github-deploy-lock"
STAMP=$(date -u +%Y%m%dT%H%M%SZ)-$$
SHORT=$(printf '%s' "$SHA" | cut -c1-12)
WORK="$BASE/releases/cosmos-$SHORT-$STAMP"
CANDIDATE="cosmos:release-$SHORT"
SNAP=".cosmos-before-$STAMP.sqlite"
STOPPED=0
OLD=
DATA=
activate(){ HOME="$BASE/.home" DOCKER_CONFIG="$BASE/.docker" docker compose --env-file "$BASE/.env" -f "$BASE/compose.yaml" up -d --no-deps --force-recreate app; }
healthy(){
 i=0
 while test "$i" -lt 40; do
  if docker exec cosmos-app node -e 'fetch("http://127.0.0.1:8080/api/v1/health").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))' >/dev/null 2>&1; then return 0; fi
  i=$((i+1)); sleep 3
 done
 return 1
}
cleanup(){
 code=$?
 trap - EXIT HUP INT TERM
 if test "$STOPPED" = 2; then
  docker start cosmos-app >/dev/null || true
 fi
 if test "$STOPPED" = 1; then
  echo 'Release failed. Restoring the previous Cosmos image and consistent database snapshot.' >&2
  # Do not copy database files while an application can still write to them.
  if docker inspect cosmos-app >/dev/null 2>&1; then
   docker stop cosmos-app >/dev/null 2>&1 || true
   if test "$(docker inspect --format '{{.State.Running}}' cosmos-app)" != false; then echo 'STOP: Cosmos is still running; database restore was not attempted.' >&2; exit 1; fi
  fi
  # Retain failed database/WAL files for recovery rather than deleting them.
  if ! docker run --rm --network none -v "$DATA:/data" "$OLD" node -e '
   const fs=require("node:fs"),path=require("node:path"),name=process.argv[1];
   if(!/^\.cosmos-before-[0-9TZ-]+\.sqlite$/.test(name))throw Error("Invalid snapshot");
   const saved="/data/"+name;if(!fs.existsSync(saved))throw Error("Snapshot missing");
   const dir=saved+"-failed";fs.mkdirSync(dir);
   for(const file of ["comos.sqlite","comos.sqlite-wal","comos.sqlite-shm"])if(fs.existsSync("/data/"+file))fs.renameSync("/data/"+file,path.join(dir,file));
   fs.copyFileSync(saved,"/data/comos.sqlite");' "$SNAP"; then
   echo "STOP: snapshot restore failed. Recovery files are in $DATA/$SNAP and $WORK." >&2; exit 1
  fi
  docker image tag "$OLD" cosmos:staging
  activate && healthy || { echo 'Previous Cosmos startup needs inspection.' >&2; exit 1; }
 fi
 rmdir "$BASE/.github-deploy-lock" 2>/dev/null || true
 exit "$code"
}
trap cleanup EXIT
trap 'exit 1' HUP INT TERM
mkdir -p "$BASE/releases"
mkdir "$WORK"
mkdir "$WORK/app"
OLD=$(docker inspect --format '{{.Image}}' cosmos-app)
DATA=$(docker inspect --format '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Source}}{{end}}{{end}}' cosmos-app)
case "$DATA" in /share/*) test -f "$DATA/comos.sqlite";; *) echo 'Unexpected Cosmos data mount; nothing changed.' >&2; exit 1;; esac
healthy || { echo 'Current Cosmos app is not healthy. Restore NAS/app availability first.' >&2; exit 1; }
curl -fL "https://codeload.github.com/PhoeZAung/comos-cloud-test/tar.gz/$SHA" -o "$WORK/source.tar.gz"
tar -tzf "$WORK/source.tar.gz" >/dev/null
tar -xzf "$WORK/source.tar.gz" -C "$WORK/app" --strip-components=1
test -f "$WORK/app/src/assets/critical-fx/manifest.json"
test -f "$WORK/app/backend/characters/roll-history.mjs"
HOME="$BASE/.home" DOCKER_CONFIG="$BASE/.docker" BUILDX_CONFIG="$BASE/.docker/buildx" docker build --build-arg COSMOS_PUBLIC_ORIGIN=https://cosmos-web.burmese-barbel.ts.net -f "$BASE/Dockerfile" -t "$CANDIDATE" "$WORK/app"
# Build and migrate a private COPY first. No live database is mounted here.
docker exec cosmos-app node --input-type=module -e 'import {DatabaseSync,backup} from "node:sqlite";const db=new DatabaseSync("/data/comos.sqlite");try{await backup(db,"/data/"+process.argv[1]);}finally{db.close();}' "$SNAP"
docker cp "cosmos-app:/data/$SNAP" "$WORK/preflight.sqlite"
docker run --rm --network none -v "$WORK:/release" "$CANDIDATE" node --input-type=module -e '
 import {openDatabase} from "./backend/db/database.mjs";
 const db=await openDatabase("/release/preflight.sqlite");try{if(db.prepare("PRAGMA quick_check").get().quick_check!=="ok")throw Error("Database check failed");console.log("Candidate database migrations verified on a copy.");}finally{db.close();}
 const fs=await import("node:fs");for(const file of ["dist-live/assets/critical-fx/manifest.json","dist-live/owlbear/action.js"])if(!fs.existsSync(file))throw Error("Release asset missing: "+file);'
sh "$BASE/backup-cosmos.sh"
BACKUP=$(ls -1t "$BASE/backups"/cosmos-*.tar.gz | head -n 1)
test -n "$BACKUP"
(cd "$BASE/backups"; sha256sum -c "$BACKUP.sha256")
tar -tzf "$BACKUP" >/dev/null
printf '%s\n' "$OLD" > "$WORK/previous-image"
printf '%s\n' "$BACKUP" > "$WORK/pre-release-backup"
docker image tag "$OLD" "cosmos:before-$STAMP"
# Brief maintenance window. Capture the final database AFTER the app stops.
STOPPED=2
docker stop cosmos-app >/dev/null
docker run --rm --network none -v "$DATA:/data" "$OLD" node --input-type=module -e 'import {DatabaseSync,backup} from "node:sqlite";import fs from "node:fs";const name="/data/"+process.argv[1];fs.unlinkSync(name);const db=new DatabaseSync("/data/comos.sqlite");try{await backup(db,name);}finally{db.close();}' "$SNAP" || { docker start cosmos-app >/dev/null; exit 1; }
STOPPED=1
docker cp "cosmos-app:/data/$SNAP" "$WORK/before.sqlite"
docker image tag "$CANDIDATE" cosmos:staging
activate
healthy
STOPPED=0
printf '%s\n' "$SHA" > "$BASE/current-code-sha"
echo "COSMOS RELEASE IS LIVE: $SHA"
echo 'Reopen the Owlbear room and reconnect Cosmos. Hard-refresh the website.'
