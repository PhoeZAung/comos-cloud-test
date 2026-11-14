# Shopping extraction → Cosmos JSON → live QNAP: progress

This tracker covers **96 candidate gaps or provenance conflicts** found by the item extraction audit. It does **not** treat source-page visits, archived text, or existing items as proof that every AoN/FFd20 shopping item is available in the live Cosmos shop.

## Current confirmed checkpoints

| Stage | Progress | Why |
| --- | ---: | --- |
| FFd20 category URLs visited | **24/26 = 92.3%** | Two index pages still excluded from detailed extraction |
| FFd20 category URLs returning parsed/indexed rows | **20/26 = 76.9%** | Four visited pages have no parsed rows; two index pages remain unchecked |
| Review candidate records written to a Cosmos **review-only** JSON | **96/96 = 100%** | [review-queue.json](review-queue.json) exists on this branch |
| Candidates approved for runtime import | **8/96 = 8.3%** | Verified two rings and six tactical gear records against FFd20 |
| Candidates included in **runtime catalog JSON** | **96/96 = 100%** | [8 source-verified items](../../backend/items/catalog/ffd20-verified-batch-01.json) + [88 metadata-only imports](../../backend/items/catalog/shopping-bulk-02.json); original 5,604-row archive untouched |
| Candidates verified in the **live QNAP Cosmos site** | **0/96 = 0% verified** | QNAP deployment remains manual; a GitHub merge does not prove imported records are live |

**End-to-end shipped: 0% of the 96 audited candidates**, even though the project has a pre-existing 5,604-item master catalog. This does not mean the site has zero shop items.

**Reference comparison to the original 5,604-row compressed archive:** 85 candidate names do not occur there, 10 only match another game system, and 1 matches the correct system under a different source page. The 8 verified and 88 metadata-only candidates are in separately versioned JSON runtime supplements, so this comparison remains based only on the untouched historical archive. The 9 airship stat blocks remain unapproved; 10 name/provenance collisions require separate review.

AoN: 73 category/index links are inventoried. Automated access was refused via `robots.txt` HTTP 403; some older sample checks exist but a fresh full automated AoN coverage percentage is unavailable. Respect the block and use permitted, manually saved pages if needed.

Run in the Cosmos source repository after **every extraction/import update**:

```bash
node scripts/shopping-progress.mjs
node scripts/shopping-progress.mjs --json
```

The script reads the review queue and **both supplemental runtime JSON files**, verifies the checksum and 5,604-row count of the untouched `backend/items/catalog/master-items.json.gz`, compares names/source links with the actual master, and prints separate human and JSON stage percentages. GitHub Actions runs it on every push and PR and uploads a progress report artifact.

## What each stage really means

1. **Extracted/indexed:** the extractor parsed a page or linked listing. It does not prove every item on that page was captured.
2. **Review JSON staged:** candidate metadata exists in this repository as `docs/shopping/review-queue.json`. It **is not** consumed by the live app.
3. **Approved:** item price/currency, source system, name variant, source URL and mechanics have been checked. Other-system name matches must be reconciled, not duplicated automatically.
4. **Runtime JSON integrated:** a candidate is in either the 8-item source-verified supplement or the 88-item metadata-only supplement, with matching source URL, name and currency. Startup imports are transactional and idempotent. They preserve GM edits and do **not** change the 5,604-item gzip archive, auto-equip items or apply mechanics. **39 FFd20 entries in bulk have listed gil prices; 49 GP/gros entries remain unpriced in Cosmos**, not free. Eleven FFd20 name collisions are distinguished by the '(FFd20)' suffix. This stage proves deployable JSON in Git, **not** actual QNAP DB insertion.
5. **Live verified:** an approved, integrated item has been imported to the QNAP SQLite catalog and found in a signed-in Cosmos shop after the user's manual, commit-pinned QNAP deployment, with its release SHA and browser test recorded.


## Fast bulk catalog addition (November 14, 2026)

- **88 pending candidates** were included in a metadata-only runtime JSON batch, in addition to the prior **8 verified candidates**. All **96/96** can be found in source-controlled runtime JSON.
- The 88 contain **47 Pathfinder and 41 FFd20** items. **39 FFd20 prices** are numerically usable in gil; **47 Pathfinder gp** plus **2 FFd20 gros** prices stay **unpriced** in the gil-purchase flow. Their listed original prices remain visible in metadata.
- The import runs on server startup after the legacy catalog and approved batch, skips exact duplicate displayed names and never overwrites character inventories, GM edits, archived rows or existing IDs. Character mechanics are **not** automatically implemented by this metadata import.
- All 96 source-candidate rows are in deployable JSON, but **the exact number that will be newly inserted in the production database is unknown until a QNAP deployment and query**. In addition, this source audit does not establish extraction completeness across all AoN/FFd20 catalog pages, especially AoN pages blocked for automated crawling.
- This bulk change deliberately skips the **extended test suite**, per request. It does not turn unverified metadata into verified full gameplay rules.

## Deployment constraint

Production is `https://cosmos-web.burmese-barbel.ts.net`, sourced from **PhoeZAung/comos-cloud-test** main, but hosted on QNAP. GitHub merges **are not deployments**. Follow [QNAP manual publishing](../QNAP_PHONE_DEPLOY.md) after reviewed code changes; don't claim a live percentage from a green GitHub Actions check alone.

Historical source archive count: 5,604. Historical October Firestore comparison count: 5,609. These are distinct snapshots and are **not interchangeable** as a denominator.

For each future update, report the page extraction percentage, review-JSON staging, approved count, runtime JSON integration and **verified** live QNAP percentage. The user should be able to see exactly which stage changed.
