#!/bin/sh
# Offline staging only. Never writes live SQLite or restarts QNAP.
# Usage (on the NAS): sh ./install-extra-items-qnap.sh [all|pf1e-foundry|pf1e-pfdata|pf1e-openref|pf2e-pf2ools|pf2e-orc|pf2e-json]
set -eu
BASE=/share/Service/Container/Cosmos
PATH=/share/CACHEDEV1_DATA/.qpkg/container-station/bin:$PATH
export PATH
cd "$BASE"
KEY="${1:-all}"
case "$KEY" in
 all) SOURCES='pf1e-foundry pf1e-pfdata pf1e-openref pf2e-pf2ools pf2e-orc pf2e-json';;
 pf1e-foundry|pf1e-pfdata|pf1e-openref|pf2e-pf2ools|pf2e-orc|pf2e-json) SOURCES="$KEY";;
 *) echo "Unknown catalog: $KEY" >&2;exit 2;;
esac
DATA=$(docker inspect --format '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Source}}{{end}}{{end}}' cosmos-app)
case "$DATA" in /share/*) [ -d "$DATA" ];; *) echo "STOP: unexpected /data mount" >&2;exit 1;; esac
docker image inspect cosmos:staging >/dev/null || { echo "STOP: cosmos:staging image missing" >&2;exit 1; }
STAMP=$(date -u +%Y%m%dT%H%M%SZ)-$$
mkdir -p "$BASE/releases"
FAILED=''
for S in $SOURCES;do
 case "$S" in
 pf1e-foundry) OWNER=baileymh;REPO=pf1e-content;REV=baf5232c5dc16af99d49ae1bf57ead6473b46bbb;;
 pf1e-pfdata) OWNER=jasontankapps;REPO=pathfinder-data-1-e;REV=08ea71f24375908d0190c822fd1fd080797667a9;;
 pf1e-openref) OWNER=Nietsneflow;REPO=open-reference;REV=725d98f4b8ccb77b3c54a0a867d6f4c7ba4ac45e;;
 pf2e-pf2ools) OWNER=Pf2ools;REPO=pf2ools-data;REV=f57b901363482fba45512dec8320682ef5083946;;
 pf2e-orc) OWNER=TiMarron;REPO=orc-rules-data;REV=52b41061785df0b6dac97a9b1ae16e3fe68c1186;;
 pf2e-json) OWNER=jimbarnesrtp;REPO=pf2;REV=c062e1ac0647d19316b756b9206b09263d1cf453;;
 esac
 OUT="$DATA/extra-$S.json.gz"
 if [ -e "$OUT" ];then echo "PRESERVED: $OUT already exists; not overwritten";continue;fi
 WORK="$BASE/releases/extra-$S-$STAMP"
 mkdir -p "$WORK/unpacked"
 echo "Downloading $S at $REV..."
 if ! curl -fL --retry 3 --connect-timeout 30 "https://codeload.github.com/$OWNER/$REPO/tar.gz/$REV" -o "$WORK/upstream.tar.gz";then
  echo "FAILED: $S download" >&2;FAILED="$FAILED $S";continue
 fi
 if ! tar -xzf "$WORK/upstream.tar.gz" -C "$WORK/unpacked";then
  echo "FAILED: $S unpack" >&2;FAILED="$FAILED $S";continue
 fi
 ROOT="$WORK/unpacked/$REPO-$REV"
 if [ ! -d "$ROOT" ];then
  echo "FAILED: $S archive root not found" >&2;FAILED="$FAILED $S";continue
 fi
 # Use the built, network-isolated Cosmos converter; no untrusted upstream scripts run.
 if ! docker run --rm --network none \
   -v "$ROOT:/source:ro" -v "$DATA:/data" --entrypoint node cosmos:staging \
   ./scripts/build-extra-item-catalog.mjs "$S" /source "$REV" "/data/extra-$S.json.gz";then
  echo "FAILED: $S converter; no database changes" >&2;FAILED="$FAILED $S";continue
 fi
 echo "STAGED: $S. Database is unchanged until Cosmos is restarted with the approved importer code."
done
if [ -n "$FAILED" ];then
 echo "Not staged:$FAILED (inspect upstream format and converter; never guess missing fields)" >&2
 exit 1
fi
echo 'All selected packages staged. Review counts, licenses and backups before restarting app.'
