#!/bin/sh
# Stage pinned Foundry PF2e 8.7.0 equipment for Cosmos; never touch live SQLite.
set -eu
BASE=/share/Service/Container/Cosmos
REV=52dfeee703b887237f5e454747bcae45b136f9af
TARGET=pf2e-foundry-8.7.0.json.gz
PATH=/share/CACHEDEV1_DATA/.qpkg/container-station/bin:$PATH
export PATH
cd "$BASE"
DATA=$(docker inspect --format '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Source}}{{end}}{{end}}' cosmos-app)
case "$DATA" in /share/*) [ -d "$DATA" ];; *) echo 'STOP: unexpected Cosmos /data mount' >&2;exit 1;; esac
[ ! -e "$DATA/$TARGET" ] || { echo "PF2e package already exists: $DATA/$TARGET (not overwriting)" >&2;exit 1; }
docker image inspect cosmos:staging >/dev/null
docker run --rm --network none --entrypoint node cosmos:staging --input-type=module -e '
import {access} from "node:fs/promises";
await access("./scripts/build-pf2e-catalog.mjs");
' || { echo 'Publish the PF2e import code before downloading its data.' >&2;exit 1; }
STAMP=$(date -u +%Y%m%dT%H%M%SZ)-$$
WORK="$BASE/releases/pf2e-source-$STAMP"
mkdir -p "$WORK/unpacked"
PREFIX="pf2e-$REV"
echo 'Downloading pinned Foundry PF2e 8.7.0 source...'
curl -fL --retry 3 --connect-timeout 30 "https://codeload.github.com/foundryvtt/pf2e/tar.gz/$REV" -o "$WORK/source.tar.gz"
tar -tzf "$WORK/source.tar.gz" | grep -F "$PREFIX/packs/pf2e/equipment/healing-potion-lesser.json" >/dev/null ||
 { echo 'STOP: incomplete source archive; retained downloaded source.' >&2;exit 1; }
echo 'Extracting only the equipment compendium...'
tar -xzf "$WORK/source.tar.gz" -C "$WORK/unpacked" "$PREFIX/packs/pf2e/equipment"
DIR="$WORK/unpacked/$PREFIX/packs/pf2e/equipment"
[ -f "$DIR/healing-potion-lesser.json" ] || { echo 'STOP: missing healing potion JSON' >&2;exit 1; }
echo 'Validating and building offline PF2e catalog...'
docker run --rm --network none \
 -v "$DIR:/pf2e-source:ro" \
 -v "$DATA:/data" \
 --entrypoint node cosmos:staging \
 ./scripts/build-pf2e-catalog.mjs /pf2e-source "/data/$TARGET"
echo "PF2e data staged: $DATA/$TARGET"
echo 'Next: restart Cosmos app to import once; existing inventory and PF1e items are preserved.'
