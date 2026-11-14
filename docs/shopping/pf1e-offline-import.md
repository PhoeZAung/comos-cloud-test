# Offline Pathfinder 1e → Cosmos shop import

## Source and scope
The ZIP supplied by the user contained **96 saved Pathfinder 1e Archives of Nethys HTML pages**.
The loss-conscious first extraction had **7,699 table data rows**, of which **7,566** were identified as item candidates.
The generated PF1e catalog contains **7,562 records** (four duplicate occurrences consolidated). It does **not** include Pathfinder 2e or webpages omitted from the offline archive.

The exported catalog `cosmos_pf1e_offline_catalog.json` preserves, per item:
- `name` and `originalName`, `category` (Cosmos), original `sourceCategoryDetail`, and `sourceSystem: pathfinder-1e`
- `sourceUrl`, `detailUrl`, `sourcePageId`, original table ID, row number, any duplicate listing references
- **all extracted table column names and their full text values** in `raw`
- source price and currency, not guessed Gil; one-column text descriptions when present
- safe recognized stat mappings (Dmg (M) → dmg; Dmg (S) → dmgS; Critical → crit; Armor Bonus → acBonus; Weight → numeric pounds where parsable, etc.)

Item page content not included in the saved archive cannot be inferred. Unsupported columns stay in `sourceFields` in every purchased/added inventory item. Mechanics are informational only, never auto-equipped or applied to character statistics.

## Deploying the catalog

The archive is shipped to the user as a separate ZIP because the original saved HTML and generated item dataset are **not tracked in GitHub**. The code/manifest is checked in. Install the ZIP's `pf1e-offline-v1.json.gz` in the QNAP persistent Cosmos data volume. It must match the manifest SHA-256 exactly.

1. Extract the provided downloadable package locally.
2. Transfer `pf1e-offline-v1.json.gz` and `install-pf1e-offline-qnap.sh` via SFTP/Termius to `/share/Service/Container/Cosmos/` on the NAS.
3. Run `cd /share/Service/Container/Cosmos && sh ./install-pf1e-offline-qnap.sh ./pf1e-offline-v1.json.gz`.
4. Publish the approved merged Cosmos commit with `sh ./publish-cosmos-qnap.sh <MERGED_SHA>`. The app's next startup validates and imports the PF1e catalog in a single SQLite transaction. Import receipts make retries idempotent.
5. Open **Pathfinder 1e** in the character shop, search **Aklys**, add a copy, and inspect its **Damage (Medium), Damage (Small), Critical, Range, Weight, Proficiency, Source link, and Original source columns**. Armor such as Scale Mail should autofill Armor Bonus, Max Dex, Check Penalty, and Spell Failure.

The importer intentionally:
- **never overwrites** base Cosmos records, FFd20 records, GM-edited PF1e items, or purchases
- deduplicates only matching older **PF1e** name/URL records
- reads from persistent `/data/pf1e-offline-v1.json.gz` on every app startup (only imports once by checksum)
- treats **gp, sp, cp, pp as original source text**. Without GM-provided Gil pricing, an item can only be **added without charging Gil**. No automatic GP/Gil conversion is made.

## Installation state vs production
The presence of this code in GitHub does **not** confirm a live import. Count items after the QNAP deployment from:
`SELECT COUNT(*) FROM items WHERE source_id='pathfinder-shopping' AND source_version='2026-11-14-offline-pf1e-v1';`.
The count can be lower than 7,562 if an identical PF1e item was already imported. A merged commit does not automatically update the private QNAP deployment.
