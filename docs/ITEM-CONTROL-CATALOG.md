# Item Control catalog and purchases — 26 October 2026

Item Control now includes all 5,604 records from the supplied website backup's `data/items.json` (11 populated categories). The saved master fields, nested `raw` data, descriptions, links and category metadata are retained. This imports item definitions only, never Firebase accounts, credentials or campaign records.

## Catalog and interface

- The complete source JSON is stored as a compressed, server-only asset under `backend/items/catalog/`. Its uncompressed checksum and original-file checksum are recorded in the manifest.
- On authenticated server startup, a checked, transactional import inserts missing deterministic item IDs. A checksum marker prevents repeat imports. Subsequent boots preserve administrator edits and archives; no existing item records are overwritten.
- Lists return 20 summaries at a time with category/group, name search and cursor filters. Full details load only when an item opens. Source properties remain available under All source fields.
- Category tiles are shared with sheet Inventory. Every category has its own small square. All occupies a larger two-by-two square at the top right. Tiles wrap at narrow phone widths.
- Admin can choose any active character through a paginated character/display-name search, review its current gil, open an item, select quantity and Buy. Name, category, description and fixed price remain editable without removing original source fields.
- All item and buyer endpoints still require a verified site administrator. These changes do not expose player purchase APIs or grant additional roles.

## Currency and purchase contract

Migration 019 adds nullable fixed prices, original catalog JSON and a purchase receipt table. Prices and arithmetic use integer hundredths of gil, supporting prices such as 0.15 gil. Unambiguous fixed costs are imported. Ranges, alternative prices, multipliers, relative costs and artifacts without a fixed price remain unavailable until an admin sets a price. An explicit fixed zero is supported; missing prices never become free.

A Buy request identifies the character, item, quantity, both expected revisions and a unique request ID. The server reads the actual price and balance; clients cannot submit prices or final balances. In one SQLite transaction it verifies revisions and funds, appends an unequipped inventory entry, deducts gil, increments the character revision and stores a receipt. A matching retry returns the same receipt; it cannot charge twice. Receipt failure rolls back all writes. Insufficient funds, archived records and stale revisions make no changes. Existing sheet live synchronization observes the new character revision.

Purchased entries preserve source details and category. Buying does not automatically equip, apply AC/stat bonuses, interpret prose rules or create an attack entry. The separate saved weapons editor remains available. Inventory and character size limits still apply.

## Verification and phone checks

- 156 automated tests pass, including full catalog counts, import retry/edit retention, bounded pagination, ambiguous prices, exact fractional prices, insufficient funds, stale revisions, receipt rollback, purchase retry, server admin checks and Origin rejection.
- Browser QA used the actual components with a synthetic character and the restored catalog. Buying two Scroll cases changed 100 to 98 gil. Category filtering and item details were checked. Equipment and catalog had no horizontal overflow at 320 and 390 px; desktop sizing was inspected at 1,000 px.
- No real character's gil was spent during verification. A physical iPhone/Android acceptance check remains for the owner.

Test on phone: Admin → item icon → choose a character → find a low-cost item → open details → Buy one → check the exact gil deduction and new inventory entry. Open its sheet in another tab to check live updates. Try an unaffordable quantity and confirm neither gil nor inventory changes. Check an item with a range price: it must require a fixed price first.
