#!/bin/sh
# Install verified PF1e AoN offline archive in Cosmos' persistent /data volume.
# Run on QNAP after uploading pf1e-offline-v1.json.gz to the NAS.
set -eu
FILE=${1:-}
EXPECTED=36bd0dc7bfa36197d52d479648f202ac1fdf3bfa7cebfadce024c5c594ca0212
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "Usage: sh scripts/install-pf1e-offline-qnap.sh /path/to/pf1e-offline-v1.json.gz" >&2
  exit 2
fi
ACTUAL=$(sha256sum "$FILE" | cut -d' ' -f1)
[ "$ACTUAL" = "$EXPECTED" ] || { echo 'STOP: PF1e offline data checksum does not match the inspected 96-page archive.' >&2;exit 1; }
gzip -t "$FILE"
PATH=/share/CACHEDEV1_DATA/.qpkg/container-station/bin:$PATH
export PATH
DATA=$(docker inspect --format '{{range .Mounts}}{{if eq .Destination "/data"}}{{.Source}}{{end}}{{end}}' cosmos-app)
case "$DATA" in /share/*) [ -d "$DATA" ];; *) echo 'STOP: unexpected Cosmos data volume.' >&2;exit 1;; esac
TARGET="$DATA/pf1e-offline-v1.json.gz"
if [ -e "$TARGET" ] && [ "$(sha256sum "$TARGET" | cut -d' ' -f1)" != "$EXPECTED" ]; then
  echo 'STOP: existing PF1e source archive differs. Preserve it and resolve this before replacing.' >&2;exit 1
fi
umask 077
cp "$FILE" "$TARGET.tmp-$$"
mv "$TARGET.tmp-$$" "$TARGET"
chmod 600 "$TARGET"
echo "Verified PF1e 7,562-item archive installed in persistent Cosmos data volume: $TARGET"
echo 'The importer runs on the NEXT Cosmos app startup after you deploy the importer code.'
