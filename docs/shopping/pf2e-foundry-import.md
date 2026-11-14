# Pathfinder 2e Foundry equipment -> Cosmos shop

This feature adds a Pathfinder 2e tab to the Cosmos shop, separate from Pathfinder 1e, FFd20, and Cosmos. It uses the public Foundry PF2e 8.7.0 equipment compendium, pinned to commit 52dfeee703b887237f5e454747bcae45b136f9af. No Foundry app or license key is needed to run Cosmos. Source: https://github.com/foundryvtt/pf2e

The PF2e item records are NOT committed to the public Cosmos repository. Installation builds a private compressed catalog in the Cosmos persistent /data mount from upstream JSON. The converter does not copy image assets, and stores a source link to the original Foundry JSON for every item. Upstream content has rights distinct from the code license: confirm applicable Paizo/Foundry licensing and attribution before publicly redistributing descriptions or a converted catalog.

## Contents and behavior

- Converts source HTML descriptions to readable plain text (not Foundry rolls/chat automation).
- Maps weapon damage and range, armor bonus, Dex cap, check penalty, healing-potion effects, item category, item level, PF2e Bulk, rarity, traits, usage, and original gp/sp/cp/pp price where provided.
- Keeps PF2e Bulk distinct from weight in pounds.
- Original coin prices are shown as text; priceGil stays null. There is NO automatic gp-to-Gil conversion or paid purchase until GM sets a fixed Gil price.
- Game mechanics are informational-only; they are never automatically equipped or applied to stats.
- Stores a separate source_id, pathfinder-2e-shopping. SQL insertion does not overwrite existing item IDs, GM-edited items, PF1e, FFd20 or Cosmos items. A checksum receipt makes the import idempotent.

## QNAP install: deploy code, then download data

1. Deploy the approved merged Cosmos commit with the existing commit-pinned publish-cosmos-qnap.sh script. Confirm HTTP 200. The importer is optional and does nothing until its data file is installed.
2. On QNAP, after publishing the code, run:

    cd /share/Service/Container/Cosmos
    sh ./scripts/install-pf2e-foundry-qnap.sh

   The script downloads the pinned upstream source into a new releases directory, extracts ONLY its equipment JSON pack, and builds /data/pf2e-foundry-8.7.0.json.gz with the deployed Cosmos image. This step does not restart Cosmos or write SQLite.
3. Review output: converted item count, categories and checksum. Restart only the app with the existing Compose config:

    export PATH="/share/CACHEDEV1_DATA/.qpkg/container-station/bin:$PATH"
    HOME="$PWD/.home" DOCKER_CONFIG="$PWD/.docker" \
      docker compose --env-file .env -f compose.yaml up -d --no-deps --force-recreate app

4. Confirm docker logs --tail 40 cosmos-app shows Foundry Pathfinder 2e equipment imported, and check HTTP 200 at /api/v1/health. In the new shop tab, search Healing Potion (Lesser), 2d8+5 HP, 12 gp, level 3.

The first import is transactional. Do not delete import receipts or replace live database files. Test on a SQLite copy if re-running.

PF1e item description enrichment and removal of repeated Source metadata are separate follow-up changes.
