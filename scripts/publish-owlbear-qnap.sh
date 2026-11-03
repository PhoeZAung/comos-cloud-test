#!/bin/sh
# Run manually over QNAP SSH: sh publish-owlbear-qnap.sh <approved-commit-sha>
# Code-only release helper. Refuses schema changes so image rollback stays valid.
set -eu
umask 077
BASE=/share/Service/Container/Cosmos
SHA=${1:-}
case "$SHA" in *[!0-9a-f]*|'') echo 'Supply the approved 40-character commit SHA.' >&2; exit 2;; esac
test "${#SHA}" -eq 40
PATH=/share/CACHEDEV1_DATA/.qpkg/container-station/bin:$PATH
export PATH
mkdir "$BASE/.github-deploy-lock"
cleanup(){ rmdir "$BASE/.github-deploy-lock" 2>/dev/null || true; }
trap cleanup EXIT HUP INT TERM
SHORT=$(printf '%s' "$SHA" | cut -c1-12)
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
WORK="$BASE/releases/owlbear-$SHORT-$STAMP-$$"
CANDIDATE="cosmos:owlbear-$SHORT"
mkdir -p "$BASE/releases"
mkdir "$WORK"
mkdir "$WORK/app"
curl -fL "https://codeload.github.com/PhoeZAung/comos-cloud-test/tar.gz/$SHA" -o "$WORK/source.tar.gz"
tar -tzf "$WORK/source.tar.gz" >/dev/null
tar -xzf "$WORK/source.tar.gz" -C "$WORK/app" --strip-components=1
test -f "$WORK/app/public/owlbear/manifest.json"
test -f "$WORK/app/src/owlbear/action.mjs"
OLD=$(docker inspect --format '{{.Image}}' cosmos-app)
OLD_SCHEMA=$(docker exec cosmos-app node -e 'fetch("http://127.0.0.1:8080/api/v1/health").then(async r=>{if(!r.ok)throw Error();console.log((await r.json()).schemaVersion)}).catch(()=>process.exit(1))')
HOME="$BASE/.home" DOCKER_CONFIG="$BASE/.docker" BUILDX_CONFIG="$BASE/.docker/buildx" docker build --build-arg COSMOS_PUBLIC_ORIGIN=https://cosmos-web.burmese-barbel.ts.net -f "$BASE/Dockerfile" -t "$CANDIDATE" "$WORK/app"
NEW_SCHEMA=$(docker run --rm --network none "$CANDIDATE" node -e 'const fs=require("fs");console.log(Math.max(...fs.readdirSync("backend/db/migrations").filter(f=>f.endsWith(".sql")).map(f=>Number(f.slice(0,3)))))')
if test "$NEW_SCHEMA" != "$OLD_SCHEMA"; then echo "STOP: schema change $OLD_SCHEMA -> $NEW_SCHEMA needs a separate migration plan." >&2; exit 1; fi
sh "$BASE/backup-cosmos.sh"
BACKUP=$(ls -1t "$BASE/backups"/cosmos-*.tar.gz | head -n 1)
test -n "$BACKUP"
(cd "$BASE/backups"; sha256sum -c "$BACKUP.sha256")
tar -tzf "$BACKUP" >/dev/null
printf '%s\n' "$OLD" > "$WORK/previous-image"
printf '%s\n' "$BACKUP" > "$WORK/pre-release-backup"
docker image tag "$OLD" "cosmos:before-owlbear-$STAMP"
activate(){ HOME="$BASE/.home" DOCKER_CONFIG="$BASE/.docker" docker compose --env-file "$BASE/.env" -f "$BASE/compose.yaml" up -d --no-deps --force-recreate app; }
healthy(){
 i=0
 while test "$i" -lt 40; do
  if docker exec cosmos-app node -e 'fetch("http://127.0.0.1:8080/api/v1/health").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))' >/dev/null 2>&1; then return 0; fi
  i=$((i+1)); sleep 3
 done
 return 1
}
docker image tag "$CANDIDATE" cosmos:staging
if ! activate || ! healthy; then
 echo 'Startup failed. Restoring the previous code image.' >&2
 docker image tag "$OLD" cosmos:staging
 activate
 healthy || { echo 'Previous image also failed. Stop and inspect Cosmos logs.' >&2; exit 1; }
 exit 1
fi
printf '%s\n' "$SHA" > "$BASE/current-code-sha"
echo "COSMOS OWLBEAR RELEASE IS LIVE: $SHA"
echo 'Install URL: https://cosmos-web.burmese-barbel.ts.net/owlbear/manifest.json'
