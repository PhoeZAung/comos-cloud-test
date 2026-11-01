#!/bin/sh
# Cosmos QNAP deployment receiver. Install outside the public website.
# Intended for a dedicated SSH key with a forced command.
set -eu
umask 077

BASE=/share/Service/Container/Cosmos
ORIGIN=https://cosmos-web.burmese-barbel.ts.net
CMD=${SSH_ORIGINAL_COMMAND:-}

# Never accept an arbitrary shell command or Git ref from SSH.
set -- $CMD
if [ "$#" -ne 2 ] || [ "$1" != "cosmos-deploy" ]; then
  echo "Denied: expected cosmos-deploy <40-character commit SHA>" >&2
  exit 2
fi
SHA=$2
case "$SHA" in *[!0-9a-f]*|'') echo "Invalid commit SHA" >&2; exit 2;; esac
if [ "${#SHA}" -ne 40 ]; then
  echo "Commit SHA must be exactly 40 hex characters" >&2
  exit 2
fi

SHORT=$(printf '%s' "$SHA" | cut -c1-12)
RELEASES="$BASE/releases"
WORK="$RELEASES/build-$SHORT-$$"
LOCK="$BASE/.github-deploy-lock"
CANDIDATE="cosmos:candidate-$SHORT"

# Avoid simultaneous deployments; failed builds never touch the live image.
if ! mkdir "$LOCK" 2>/dev/null; then
  echo "Deployment is already running (lock: $LOCK)" >&2
  exit 1
fi
cleanup() {
  rm -rf "$WORK"
  rmdir "$LOCK" 2>/dev/null || true
}
trap cleanup EXIT HUP INT TERM

test -f "$BASE/Dockerfile"
test -f "$BASE/compose.yaml"
test -f "$BASE/.env"
test -x "$BASE/backup-cosmos.sh"
test "$(docker inspect -f '{{.State.Running}}' cosmos-app)" = true
test "$(docker inspect -f '{{.State.Running}}' cosmos-tailscale)" = true
mkdir -p "$RELEASES"
mkdir -m 700 "$WORK"
mkdir -m 700 "$WORK/app"

echo "Receiving vetted GitHub commit $SHA ..."
cat > "$WORK/source.tar.gz"
test -s "$WORK/source.tar.gz"
tar -tzf "$WORK/source.tar.gz" >/dev/null
tar -xzf "$WORK/source.tar.gz" -C "$WORK/app"
test -f "$WORK/app/package.json"
test -f "$WORK/app/public-auth.json"

echo "Building candidate image (production remains online) ..."
HOME="$BASE/.home" DOCKER_CONFIG="$BASE/.docker" BUILDX_CONFIG="$BASE/.docker/buildx" \
  docker build --build-arg "COSMOS_PUBLIC_ORIGIN=$ORIGIN" \
  -f "$BASE/Dockerfile" -t "$CANDIDATE" "$WORK/app"

echo "Creating verified live database/media backup ..."
sh "$BASE/backup-cosmos.sh"

OLD_IMAGE=$(docker image inspect --format '{{.Id}}' cosmos:staging)
docker image tag "$OLD_IMAGE" cosmos:previous
docker image tag "$CANDIDATE" cosmos:staging

compose_app() {
  HOME="$BASE/.home" DOCKER_CONFIG="$BASE/.docker" \
    docker compose --env-file "$BASE/.env" -f "$BASE/compose.yaml" \
    up -d --no-deps --force-recreate app
}
health_check() {
  i=0
  while [ "$i" -lt 30 ]; do
    if docker exec cosmos-app node -e \
      'fetch("http://127.0.0.1:8080/api/v1/health").then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))' \
      >/dev/null 2>&1; then
      return 0
    fi
    i=$((i + 1))
    sleep 3
  done
  return 1
}
rollback() {
  echo "New release failed health checks. Restoring previous CODE IMAGE ..." >&2
  docker image tag "$OLD_IMAGE" cosmos:staging
  compose_app || true
  health_check || echo "WARNING: Previous image also failed health checks" >&2
}

echo "Activating tested candidate ..."
if ! compose_app; then
  rollback
  exit 1
fi
if ! health_check; then
  docker logs --tail 40 cosmos-app || true
  rollback
  exit 1
fi

printf '%s\n' "$SHA" > "$BASE/current-code-sha"
echo "COSMOS DEPLOYED: $SHA"
echo "Health check passed. Player data volumes were not replaced."
echo "NOTE: image rollback does not reverse SQLite schema migrations."
