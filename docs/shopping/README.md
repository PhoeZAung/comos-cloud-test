# Shopping extraction → Cosmos JSON → live QNAP: progress

This tracker covers **87 candidate gaps or provenance conflicts** found by the item extraction audit. It does **not** treat source-page visits, archived text, or existing items as proof that every AoN/FFd20 shopping item is available in the live Cosmos shop.

## Current confirmed checkpoints

| Stage | Progress | Why |
| --- | ---: | --- |
| FFd20 category URLs visited | **24/26 = 92.3%** | Two index pages still excluded from detailed extraction |
| FFd20 category URLs returning parsed/indexed rows | **19/26 = 73.1%** | Five visited pages need special parser/rules classification |
| Review candidate records written to a Cosmos **review-only** JSON | **87/87 = 100%** | [review-queue.json](review-queue.json) exists on this branch |
| Candidates approved for runtime import | **0/87 = 0%** | Mechanics, prices, variants and cross-system duplicates not fully reviewed |
| Candidates integrated into the production **master JSON archive** | **0/87 = 0%** | The immutable 5,604-row base catalog is unchanged |
| Candidates verified in the **live QNAP Cosmos site** | **0/87 = 0% verified** | No new item import, QNAP release receipt, or authenticated verification |

**End-to-end shipped: 0% of the 87 audited candidates**, even though the project has a pre-existing 5,604-item master catalog. This does not mean the site has zero shop items.

AoN: 73 category/index links are inventoried. Automated access was refused via `robots.txt` HTTP 403; some older sample checks exist but a fresh full automated AoN coverage percentage is unavailable. Respect the block and use permitted, manually saved pages if needed.

Run in the Cosmos source repository after **every extraction/import update**:

```bash
node scripts/shopping-progress.mjs
node scripts/shopping-progress.mjs --json
```

The script reads `docs/shopping/review-queue.json`, verifies the checksum and 5,604-row count of `backend/items/catalog/master-items.json.gz`, compares names/source links with the actual compressed master and prints both human and JSON percentages. GitHub Actions runs it on every push and PR and uploads a progress report artifact.

## What each stage really means

1. **Extracted/indexed:** the extractor parsed a page or linked listing. It does not prove every item on that page was captured.
2. **Review JSON staged:** candidate metadata exists in this repository as `docs/shopping/review-queue.json`. It **is not** consumed by the live app.
3. **Approved:** item price/currency, source system, name variant, source URL and mechanics have been checked. Other-system name matches must be reconciled, not duplicated automatically.
4. **Master JSON integrated:** an approved candidate exists as a canonical distinct item in the compressed `backend/items/catalog/master-items.json.gz` source, with its manifest count/hash updated. A separate runtime DB import/migration must be planned for previously imported catalogs; the old importer skips already-applied checksums and preserves existing edits.
5. **Live verified:** an approved, integrated item has been imported to the QNAP SQLite catalog and found in a signed-in Cosmos shop after the user's manual, commit-pinned QNAP deployment, with its release SHA and browser test recorded.

## Deployment constraint

Production is `https://cosmos-web.burmese-barbel.ts.net`, sourced from **PhoeZAung/comos-cloud-test** main, but hosted on QNAP. GitHub merges **are not deployments**. Follow [QNAP manual publishing](../QNAP_PHONE_DEPLOY.md) after reviewed code changes; don't claim a live percentage from a green GitHub Actions check alone.

Historical source archive count: 5,604. Historical October Firestore comparison count: 5,609. These are distinct snapshots and are **not interchangeable** as a denominator.

For each future update, report the page extraction percentage, review-JSON staging, approved count, runtime master-JSON integration and **verified** live QNAP percentage. The user should be able to see exactly which stage changed.
