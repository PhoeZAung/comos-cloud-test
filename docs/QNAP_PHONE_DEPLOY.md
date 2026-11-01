# Cosmos: approve-and-publish from a phone

The live site is hosted on QNAP, NOT Railway. The workflow is **manual only**
(`workflow_dispatch`). Pushing or merging code never triggers deployment.

## Installed in the GitHub repository

- `.github/workflows/deploy-qnap.yml`: Node 24 tests, tracked-source package,
  Tailscale v4 connection, signed SSH transfer.
- `scripts/deploy-qnap.sh`: QNAP-side receiver. Must be installed on the NAS
  before the workflow can be used; changing this repo file does not automatically
  update the locally installed receiver.

## One-time prerequisites

1. Tailscale policy: create `tag:cosmos-ci` with a suitable `tagOwners` entry.
   Add a grant from `tag:cosmos-ci` to the NAS Tailscale node on `tcp:22`.
   Inspect existing broad grants/ACLs too: grants are additive, not deny rules.
2. Create Tailscale OAuth client with **Auth Keys: Write** and assigned tag
   `tag:cosmos-ci`.
3. Set GitHub Actions repository secrets (never commit their values):
   `TS_OAUTH_CLIENT_ID`, `TS_OAUTH_SECRET`,
   `COSMOS_DEPLOY_SSH_KEY`, and `COSMOS_QNAP_KNOWN_HOSTS`.
4. On NAS over Tailscale SSH, install `scripts/deploy-qnap.sh` as
   `/share/Service/Container/Cosmos/deploy-from-github.sh` and `chmod 700`.
   You can fetch only that file using the existing Alpine Git container:
   
   ```sh
   BASE=/share/Service/Container/Cosmos
   docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp \
     -v "$BASE/app:/git" -w /git alpine/git:latest fetch --depth 1 origin main
   docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp \
     -v "$BASE/app:/git" -w /git alpine/git:latest \
     show FETCH_HEAD:scripts/deploy-qnap.sh > "$BASE/deploy-from-github.sh"
   chmod 700 "$BASE/deploy-from-github.sh"
   ```

5. Set up a **dedicated** Ed25519 SSH deployment key. Append to the QNAP
   account's `~/.ssh/authorized_keys` a line beginning with:
   
   ```
   restrict,command="/bin/sh /share/Service/Container/Cosmos/deploy-from-github.sh" ssh-ed25519 AAAA... cosmos-github-deploy
   ```
   
   Replace the public key placeholder with the actual key; do not copy private
   key material into the repository or a chat. Confirm QNAP's actual home
   directory and SSH public-key support before editing `authorized_keys`.
   Put the matching private key **only** into the GitHub Actions secret
   `COSMOS_DEPLOY_SSH_KEY`.
6. Record the NAS SSH **host public key**, formatted as a `known_hosts` line
   for `100.120.3.104`, in `COSMOS_QNAP_KNOWN_HOSTS`. Confirm the host-key
   fingerprint by a trusted channel, rather than blindly accepting SSH keys.

## Publish

From GitHub (works on phone): **Actions → Publish Cosmos to QNAP →
Run workflow → main → Run workflow**.

The workflow only deploys from `main`; it does not accept a branch name as
user input. The deployment receiver accepts the exact 40-character commit SHA
and a compressed `git archive` over SSH standard input, so it does not require
Git on the NAS.

The script builds a candidate image first; if it builds successfully, it calls
`backup-cosmos.sh`, switches the `cosmos:staging` tag, recreates **only**
`cosmos-app`, and checks `/api/v1/health`. On failure it attempts to restore
the previous **image**. It does **not** roll back SQLite schema migrations.
Never deploy incompatible database migrations without a separate migration plan.

## Safety

- No port forwarding, no myQNAPcloud publishing, and no public NAS SSH.
- Tailscale Funnel is for the public Cosmos WEBSITE, not the management plane.
- Preserve `/share/Service/Container/Cosmos/data`, `secrets`, and `backups`.
- A GitHub Actions secret with an SSH key is sensitive: only manually dispatch
  reviewed commits on `main`. Prefer GitHub branch protection for AI edits.
- HBS 3 remains the off-NAS backup; periodically verify restores.
