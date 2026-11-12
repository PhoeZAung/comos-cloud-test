# Cosmos production: publish manually to QNAP from Termius

**This is the production deployment procedure. Do not use GitHub Actions,
Railway, or a push-to-deploy workflow to publish production Cosmos.**

The production website is hosted on a QNAP NAS and exposed through Tailscale:
https://cosmos-web.burmese-barbel.ts.net

Source of truth: GitHub **PhoeZAung/comos-cloud-test**, branch **main**.
QNAP directory: **/share/Service/Container/Cosmos**.
Running app container: **cosmos-app** (image **cosmos:staging**).
The separate **cosmos-tailscale** container should remain running.

## The already-working deployment method

The user successfully deployed with the **existing QNAP-local** script
**/share/Service/Container/Cosmos/publish-cosmos-qnap.sh** on November 11, 2026.
That script is also versioned as **scripts/publish-cosmos-qnap.sh** in this repo,
but editing the GitHub copy does not update the installed QNAP copy.

1. GPT implements changes in GitHub and merges an approved, tested PR to **main**.
   A merge alone is NOT a QNAP deployment.
2. Identify the exact **40-character** latest main commit SHA after the merge.
   Confirm the intended release and any database-migration implications.
3. On a phone/computer, connect to the QNAP with **Termius via Tailscale**.
4. Paste the **real** merged SHA (not the placeholder) in this command:

~~~sh
cd /share/Service/Container/Cosmos
sh ./publish-cosmos-qnap.sh <FULL_40_CHARACTER_MAIN_COMMIT_SHA>
~~~

5. Do not interrupt the script or rerun it blindly on an error. It downloads
   that exact commit from GitHub, builds a candidate image, tests database
   migrations on a copy, creates/verifies a backup, captures a final database
   snapshot, recreates **only cosmos-app**, checks /api/v1/health, and attempts
   code/database rollback if activation fails.
6. The script should print **COSMOS RELEASE IS LIVE: <SHA>**. Verify:

~~~sh
cat /share/Service/Container/Cosmos/current-code-sha
docker ps --filter name=cosmos-app
docker logs --tail 30 cosmos-app
~~~

7. Open the live site, hard-refresh, and test the relevant feature with a
   signed-in account. Container health is not sufficient for browser acceptance.

## Optional one-command launcher (install ONCE on QNAP)

**scripts/publish-latest-qnap.sh** is an optional Termius helper. It queries the
current GitHub main SHA, displays it, requires the user to type **DEPLOY**, then
calls the existing tested, commit-pinned NAS publisher. It does not use GitHub
Actions or trigger on a push, and does not change the deployment's backup logic.

On the QNAP, install or refresh this launcher, inspect it, then invoke it:

~~~sh
cd /share/Service/Container/Cosmos
curl -fsSL https://raw.githubusercontent.com/PhoeZAung/comos-cloud-test/main/scripts/publish-latest-qnap.sh -o publish-cosmos
chmod 700 publish-cosmos
cat publish-cosmos
sh ./publish-cosmos
~~~

If the launcher has not been installed, use the exact-SHA command above instead.
Neither a GitHub commit nor this documentation installs a launcher onto QNAP.

## Guardrails for future GPT work

- **Never** claim code is published to QNAP just because GitHub main was updated,
  tests passed, or a cloud preview was deployed. Require a successful NAS script
  output and, when possible, the recorded current-code-sha and live check.
- Use the existing manual QNAP script; **do not recreate GitHub Actions deployment**
  or ask to run obsolete SSH-receiver workflows. Keep the GitHub verify workflow
  for **tests/builds only**.
- Keep QNAP **data/**, **secrets/**, **backups/**, **.env**, compose.yaml, mounted
  volumes and the running Tailscale container intact. Do not replace the
  database or force-copy a new app tree over the existing installation.
- The local NAS script is authoritative for production behavior. Review planned
  schema migrations: backup/rollback is defensive, but a migration can still
  require specific recovery steps.
- Avoid exposing QNAP SSH to the public internet or pasting private SSH keys,
  OAuth secrets, Firebase service-account JSON, or .env contents into chat.
- Older Railway instructions in CLOUD-SETUP.md are a historical test setup,
  not permission to publish production. Owlbear has separate deployment files;
  do not delete them as part of Cosmos cleanup.

## Retired GitHub deployment path

The nonworking **.github/workflows/deploy-qnap.yml** and
**.github/workflows/test-qnap-ssh.yml** workflows, plus the obsolete
**scripts/deploy-qnap.sh** forced-command receiver source, were removed from
this repository. Any older copy of deploy-from-github.sh, SSH authorized_keys
restriction, or GitHub Actions secrets already installed on the NAS/GitHub
remain separate and are NOT removed by this repository change.
