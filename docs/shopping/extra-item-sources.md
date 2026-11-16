# Cosmos supplemental Pathfinder item catalogs

These are **new optional source catalogs**, not replacements for existing inventory, AoN, Foundry PF2e or the original Cosmos catalog. No external download occurs while the app starts. The QNAP server remains unchanged until the source ZIPs are staged and the approved code is manually published.

| Choose Shop name | Internal key | Pinned upstream | Suggested use |
| --- | --- | --- | --- |
| PF1e · Foundry | pf1e-foundry | [baileymh/pf1e-content](https://github.com/baileymh/pf1e-content) | **Main PF1e** item descriptions and equipment |
| PF1e · AoN | existing | User-supplied offline AoN pages | Cross-check original Pathfinder listings |
| PF1e · PF Data | pf1e-pfdata | [jasontankapps/pathfinder-data-1-e](https://github.com/jasontankapps/pathfinder-data-1-e) | Additional PF1e items |
| PF1e · Open Ref | pf1e-openref | [Nietsneflow/open-reference](https://github.com/Nietsneflow/open-reference) | Supplemental offline PF1e references |
| PF2e · Foundry | existing | [foundryvtt/pf2e](https://github.com/foundryvtt/pf2e) 8.7.0 | **Main PF2e** catalog |
| PF2e · Pf2ools | pf2e-pf2ools | [Pf2ools/pf2ools-data](https://github.com/Pf2ools/pf2ools-data) | No item files at pinned revision; not staged (retain source adapter for future coverage) |
| PF2e · ORC | pf2e-orc | [TiMarron/orc-rules-data](https://github.com/TiMarron/orc-rules-data) | Remaster catalog; text/variant coverage may be incomplete |
| PF2e · JSON | pf2e-json | [jimbarnesrtp/pf2](https://github.com/jimbarnesrtp/pf2) | Legacy comparison only; publisher warns AoN HTML extraction is broken |

## Category and value mapping (same workflow as PF2e Foundry)

The five sources with actual item content are converted into validated, compressed, backend-only JSON catalogs and imported by stable **source-specific IDs**. Extracted fields are informational and user-editable, not automatically applied as bonuses on character sheets.

| Cosmos category | Mapped information (when available in the source) |
| --- | --- |
| Weapon, Ranged Weapon, Ammunition | Damage dice, critical range/multiplier, type, range, proficiency |
| Armor | Armor bonus, max Dex, armor check penalty, spell failure, speed at 30/20 ft. |
| Consumables and Alchemical Items | Healing/damage text, save DC, duration, use/activation details |
| Magic Items, Artifacts, Enhancements | Description, caster level, source traits and explicit effects |
| Gear, Services, Vehicles | Price, PF1e pounds, description, available movement/service fields |

- PF1e Foundry uses actual system and actions values; exact sizeRoll(N, D, @size) dice are converted to NdD for readability. Unsupported formulas remain informational, never guessed.
- PF Data uses its embedded Markdown Price, Cost, Weight, Armor Bonus, and other fields rather than assuming separate JSON properties.
- Open Reference uses structured item_details and item_misc to identify armor/weapon information.
- PF2e ORC maps the explicit weapon and armor structures, original copper-piece price, and **PF2e Bulk**, which is never falsely converted to pounds.
- Legacy PF2e JSON maps weapon, ranged weapon, shield and armor groups and uses a validated original 2e AoN item link when provided.
- No item is dropped simply for matching another item's name. Players selecting two source catalogs see both records, each with its own source label and independent choice.
- No invented spell effects, missing damage dice or unsupported equipment modifiers. Source data stays distinct from each user's editable inventory copy.

**Buying versus viewing:** an original 10 gp listing is retained as source cost text, but this import deliberately does not create an unconditional Gil price for every game system. Consistent with the existing PF2e Foundry import, the shop does not assume that a gold piece equals Gil for PF2e or Pathfinder. FFd20's 1 gp = 1 Gil rule applies only to FFd20 sheets, and Gil-paid checkout must use valid explicitly resolved Gil prices.

### Real upstream conversion audit (November 16, 2026)

The first full pinned-archive run converted **6,471 PF1e Foundry**, **7,818 PF Data**, **3,883 Open Reference**, **1,211 PF2e ORC**, and **728 legacy PF2e JSON** item records. The pinned Pf2ools data contains no items and is skipped. These are **candidate source counts**, not live QNAP row counts or verified purchase prices. Source metadata and incomplete fields are retained independently; no name-based deduplication occurs. Current-run totals and coverage are in the cosmos-extra-item-real-audit GitHub Actions artifact for PR #153. Conversion and all repository tests must pass on the final commit before production staging.

## Important limitations

- The upstream datasets use **different data structures**. The converter accepts a strict subset of each, filters out feats/spells/creatures, and refuses empty archives. Review extraction counts and sample items before enabling any package. Missing data is not invented.
- The historic PF1e Foundry source is used because its **src/packs** directory contains usable JSON items. It is not the newer GitLab release's binary LevelDB pack. The archives must be pinned by commit.
- Open Reference has about 31,000 **mixed reference entries**, not 31,000 items. Only explicit `item` and `vehicle` records are eligible; all other content is excluded.
- The pinned Pf2ools revision has no item/equipment data. The installer skips this source rather than creating an empty shop. Its future potential does not justify silently adding rule entries as purchasable items.
- ORC descriptions use the upstream English translation dictionary. Auto/assistant-reviewed entries must not be presented as human-verified.
- PF2e JSON source warns its old AoN scraping can produce empty data; an empty result is **not imported**.
- d20PFSRD does **not** have a confirmed official bulk JSON export. Do not register a fake shop or scrape it automatically. The FFd20 Foundry fork largely reproduces PF1e content and is **not** registered as an independent core inventory source until genuinely new FFd20-specific items are confirmed.
- Verify source licensing, OGL/ORC/CUP and redistribution terms. Generated private source archives are deliberately not committed.
- Imported stats are **informational only**, never auto-equipped or applied to character attributes. PF2e Bulk is not converted to pounds. Original coin prices are preserved, **not treated as Gil**; player purchases need a reliable fixed Gil price or an explicit add-without-price path.
- **Do not deduplicate or hide by item name.** The importer assigns unique per-source item identities and never updates, overwrites, merges, or deletes existing records. Duplicate names across sources—and distinct versions within one source—are intentional. If a player selects two or more shops, display every matching item as its own search result with its original shop label and provenance. The player chooses the version; the system makes no automatic choice.

## Staging on QNAP (no restart)

After deploying and verifying the converter code in the staging image and reviewing licenses:

```sh
cd /share/Service/Container/Cosmos
docker cp cosmos-app:/app/scripts/install-extra-items-qnap.sh ./install-extra-items-qnap.sh
sh ./install-extra-items-qnap.sh all
```

Alternatively, stage an individual source with `sh ./install-extra-items-qnap.sh pf1e-foundry`. The script downloads upstream archives at the pinned SHA, keeps them under the NAS releases directory, runs *only Cosmos' own* converter with Docker networking disabled, and writes `/data/extra-<key>.json.gz`. It does not alter SQLite or restart the app. Already staged files are never overwritten.

**Note:** If the running image is older than the converter, publish the reviewed branch to a **staging image first**. Do not run the commands against production until the pull request has passed CI and source-format review.

After successful staging and database backup, publish an approved merged Cosmos commit by the existing [QNAP manual procedure](../QNAP_PHONE_DEPLOY.md), recreate **only the app** and inspect logs for each imported catalog. In the signed-in Choose Shop popup confirm each displayed label and count. Items from a source are not visible until the compressed package imports successfully. Failed optional packages log an error without bringing down Cosmos.

## Verification

Sample check: Abacus from PF1e Foundry, an imported AoN weapon, a PF2e Foundry healing potion, and a Remaster ORC item when present. Examine readable description, original link, category, weight (PF1e only), source-specific price and empty-price purchasing. Check the player search with multiple shops selected.

For exact counts:

```sql
SELECT source_id, source_version, COUNT(*) AS items
FROM items
WHERE source_id IN ('pf1e-foundry','pf1e-pfdata','pf1e-openref','pf2e-pf2ools','pf2e-orc','pf2e-json')
GROUP BY source_id,source_version
ORDER BY source_id;
```

**Recommendation:** PF1e Foundry for broad player shopping, AoN for original-source reference, and PF2e Foundry for 2e. Players may deliberately select any combination of sources and see all duplicates. PF Data, Open Ref, ORC and legacy JSON offer additional choices; Pf2ools remains uninstalled while it contains no items. Never bulk-merge or suppress duplicates across source catalogs.
