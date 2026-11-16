# Kingmaker Bestiary: QNAP release and optional import

The **105 / 105 Bestiary creatures** have been source-reviewed in GitHub. This file does not imply the release is live on NAS or the records have been imported.

## 1. Publish tested code to QNAP (manual)

Follow [QNAP_PHONE_DEPLOY.md](QNAP_PHONE_DEPLOY.md). Once the PR is merged to `main`, use the **actual exact 40-character merged commit SHA**, not a PR head SHA, in Termius over Tailscale:

```sh
cd /share/Service/Container/Cosmos
sh ./publish-cosmos-qnap.sh <MERGED_MAIN_SHA>
cat current-code-sha
docker logs --tail 30 cosmos-app
```

The QNAP-local script is authoritative, checks candidate database migrations on a copy, makes backups and attempts rollback on activation failure. Wait for `COSMOS RELEASE IS LIVE: <SHA>` and check the signed-in site.

## 2. Optional: import **only reviewed Bestiary creatures** into your Cosmos NPC library

Publication of the code and adding 105 NPC records are **separate actions**. The importer never runs during startup. Before importing, identify the correct Cosmos user ID to own these NPCs. Do not send user IDs or secrets in public logs.

Preview only (no new records, but the CLI opens the database and may apply routine migrations):

```sh
docker exec cosmos-app node scripts/import-kingmaker.mjs --db /data/comos.sqlite --owner '<YOUR_COSMOS_USER_ID>' --chapter bestiary
```

Review the displayed `byChapter` and `toCreate` counts and check `existingNameConflicts=[]`, `unreviewed=0`. The first import should plan **at most 105** Bestiary creations; previously imported records are automatically skipped.

Only if the preview is correct, the app is healthy, and the owner ID has been verified:

```sh
docker exec cosmos-app node scripts/import-kingmaker.mjs --db /data/comos.sqlite --owner '<YOUR_COSMOS_USER_ID>' --chapter bestiary --apply --confirm-kingmaker
```

The importer takes its own consistent SQLite backup **before** applying the insert transaction. It creates only missing Kingmaker records and stops on naming conflicts by default.

### Existing manually managed NPC with same name

For example, a pre-existing manually managed **Black Tear Cutthroat** in NPC must not be renamed or overwritten to accommodate the Bestiary import. If the default dry run reports `bestiary:black-tear-cutthroat` as a conflict, use the **explicit optional** `--rename-import-conflicts` mode:

```sh
docker exec cosmos-app node scripts/import-kingmaker.mjs --db /data/comos.sqlite --owner '<YOUR_COSMOS_USER_ID>' --chapter bestiary --rename-import-conflicts
```

Check `existingNameConflicts=[]`, `unreviewed=0`, `toCreate=105` (for a first import) and `renamedNewEntries`, which should include exactly:

```json
{"key":"bestiary:black-tear-cutthroat","from":"Black Tear Cutthroat","to":"Black Tear Cutthroat (Bestiary)"}
```

Only if that preview is correct, run:

```sh
docker exec cosmos-app node scripts/import-kingmaker.mjs --db /data/comos.sqlite --owner '<YOUR_COSMOS_USER_ID>' --chapter bestiary --rename-import-conflicts --apply --confirm-kingmaker
```

This changes **only the new Bestiary entry's display name**, not the existing manual NPC's ID, name or sheet data. The source import slug stays unchanged, so repeating the import remains idempotent. The optional mode will still refuse the import if the suffixed name is already taken. Do not add `--allow-needs-review` for this Bestiary import. The other chapters still need source review (NPC Codex 0/105, Companions 0/7); Hazards & Traps are deferred.

## 3. Confirm results

Repeat the dry run: `toCreate` should be zero when all 105 were imported, `alreadyImported` should report 105. Test the Bestiary tab, a few multiattack creatures, swarm automatic-damage entries, and GM-only NPC visibility.

Do not run import if the owner ID is unknown, the dry run reports unexpected conflicts, the NAS deployment script failed, or the production database is unhealthy. Do not hand-edit the SQLite database or stop the Tailscale container.
