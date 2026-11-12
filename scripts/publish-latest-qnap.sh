#!/bin/sh
# Optional Termius shortcut installed as /share/Service/Container/Cosmos/publish-cosmos.
# Pulls an exact main SHA from GitHub, asks for confirmation, then calls the
# existing tested, commit-pinned NAS publisher. Does not run without user input.
set -eu

BASE=/share/Service/Container/Cosmos
PUBLISHER="$BASE/publish-cosmos-qnap.sh"
test -f "$PUBLISHER" || { echo "Missing $PUBLISHER" >&2; exit 1; }
test "$#" -eq 0 || { echo 'Usage: sh ./publish-cosmos' >&2; exit 2; }

SHA=$(curl -fsSL --max-time 20 \
  https://api.github.com/repos/PhoeZAung/comos-cloud-test/git/ref/heads/main \
  | sed -n 's/^[[:space:]]*"sha":[[:space:]]*"\([0-9a-f]\{40\}\)".*/\1/p' \
  | head -n 1)
if ! printf '%s\n' "$SHA" | grep -Eq '^[0-9a-f]{40}$'; then
  echo 'Could not obtain the full GitHub main SHA. No deployment started.' >&2
  exit 1
fi

printf '\nGitHub repository: PhoeZAung/comos-cloud-test\n'
printf 'Branch: main\nExact commit: %s\n' "$SHA"
printf 'Type DEPLOY to build, back up, and restart ONLY cosmos-app on QNAP: '
IFS= read -r CONFIRM || exit 1
if [ "$CONFIRM" != DEPLOY ]; then
  echo 'Cancelled; nothing changed.'
  exit 2
fi

exec /bin/sh "$PUBLISHER" "$SHA"
