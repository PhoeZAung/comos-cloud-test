# Source-aware Cosmos shop and scalable shared inventory (November 14, 2026)

## Shop sources (tabs)
- **Cosmos**: original `legacy-master`, GM custom sources, and non-external catalog IDs.
- **Pathfinder 1e**: `pathfinder-shopping`. This tab currently contains only source-staged items deployed via the earlier importer; importing all archived AoN tables is a **separate next step**.
- **FFd20**: `ffd20-shopping`. This tab currently contains only approved and metadata-only FFd20 shopping records; it is **not** the full FFd20 equipment catalog.

Use `source=cosmos|pathfinder-1e|ffd20|all` on item-list and category endpoints. The admin page and in-character purchase picker use tabs. Source never changes character ownership or item effects. **All three sources feed the same character inventory.** The price system is still Gil: unconverted GP/gros entries remain unpriced, not free purchases.

## Nine browse groups
1. Weapons & Ammunition: Weapon, Ranged Weapon, Ammunition
2. Armor & Shields: Armor
3. Consumables: Food, Alchemical Items, Consumables
4. Gear & Tools: Gear
5. Magic Items: Magic Items, Artifacts
6. Enhancements: Enchantment, Enhancements
7. Materials & Crafting: Materials & Crafting
8. Vehicles & Mounts: Machine, Vehicles & Mounts
9. Services & Other: Collection, Misc, Services & Other

Original category/tag values are **not rewritten** in saved characters or existing SQLite items. Older `Tools`, `Magic`, and `Other` API filters still work. These nine groups are browse filters, not source-specific item taxonomy.

## Source-specific item schema
- `shopSource` identifies Cosmos / PF1e / FFd20.
- `sourceCategory` continues to be the legacy physical item category for sheet compatibility.
- `sourceCategoryDetail` retains the website's original category or subcategory.
- `link` / catalog `sourceUrl` retains a clickable, validated HTTP(S) link.
- `sourceCatalog` retains the untouched original catalog snapshot (including `raw`, `details`, and arbitrary other columns).
- `sourceFields` contains *editable per-inventory-item overrides* for every source column, not just fixed HP/damage/armor fields.

The UI dynamically renders imported column names and contents (including `Dmg (S)`, `Dmg (M)`, `Misfire`, `Arcane Spell Failure Chance`, etc.), and allows adding/removing source fields. The server validates the map, enforces limits, and preserves the catalog snapshot. Admin catalog editing supports independent source-field JSON, source category, and source link edits.

The PF1e category suggestion list reflects the **96 HTML pages saved in the uploaded offline archive**, not a claim of complete Pathfinder 1e site coverage. Dynamic source fields accept columns from future pages and future FFd20 extraction without code changes.

## Deployment and rollout
The category/source UI can ship independently of further item extraction. This PR **does not** import the 7,699 AoN table rows; those need source-preserving cleaning and de-duplication. It does not merge Pathfinder 1e and FFd20 item records just because their names match, replace the legacy 5,604-item catalog, overwrite GM edits, or automatically apply gameplay effects. Manual QNAP deployment remains required to make a merged version live.
