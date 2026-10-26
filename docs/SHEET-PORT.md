# Changelog features transferred to the live Comos repository

The attached Mount_Aetheria_Chat_Changes_2026-10-26.md describes PRs #4–#8 in **PhoeZAung/Mount-Aetheria**. Railway's feisty-freedom service builds **PhoeZAung/comos-cloud-test main**. Those repositories are independent. The Equip silhouette, 13 slots and bold Initiative had already been adapted to Comos in commit 53d7b305046f6a3e5c0da53a49eff7241b98d4e9; this change preserves that implementation and adapts the missing category, skill-budget and spell behavior to the shared Comos sheet. The old repository and Firebase collections are not modified.

## Inventory

Original 13 categories remain distinct, with their symbols, grouped filters/counts, legacy aliases and unknown-category fallback to Misc. The Item Tag / Shop Category field is full-width above Name and previews the selected icon. A deliberately selected Misc overrides stale legacy category fields. Filter/search preserve original item indices, so editing or equipping a filtered row targets the correct item. Changing the tag preserves equipment, quantity, attributes and other saved metadata. Comos's existing Equip behavior remains as documented in SHEET-EQUIPMENT.md; it is an adaptation, not a copy of the old Firebase UI.

## Skills

Unused Skill Points is visible above the normal list with an expandable breakdown. Budget = sum(max(1, class base + current INT modifier) × class levels) + saved favored skill choices − ranks spent. As in the old v41 calculator, current INT is applied to all levels, there is no first-level ×4, and manual/legacy bonus pools are excluded. Negative unused totals remain visible with an overspending message. Favored choices are deduplicated by level, following the old map precedence. Canonical classes take precedence over legacy class/multiclass/prestige fields.

Only 52 class/prestige names and their numeric skill bases are bundled. They were extracted from the existing rule JSON, whose Git blob SHA matches the current legacy repository: 93df4b7a75482e410abf42bf5298bc5901846da9. The 45 MB catalog is not loaded by the sheet. Missing INT or unsupported/missing class metadata yields “Unavailable”, rather than an invented total. Class/racial conditional exceptions are not inferred. The calculator is a read-only derived view; saved character metadata is not erased and there is no second editable skill pool.

## Spells

Cantrip and level 1–9 tabs include counts, base DC and default MP amount. Arrow keys, Home and End work; the selected level is in the URL and scrolls into view. Search respects the selected level. Per-spell badges/detail show its MP amount; optional MP Amount overrides the default numeric level. Blank restores the level default and clears stale alias overrides. Existing mp_cost/mpCost/mp_amount/mpAmount values are read. Older Comos mp_adjustment metadata is preserved but no longer affects this display-only amount.

Cast now creates one authenticated, revision-checked, idempotent server receipt: a spell card and any configured attack/damage rolls. It does **not** save a character change or spend base/temp MP, and works at zero MP. Spend MP is removed from the spell interface. Older open clients' sheet/cast operation is also non-spending. Explicit resource editing and the older manual spend API remain separate. Existing owner/admin, Origin, receipt limits and Discord mention protections are retained. The shared sheet provides player/admin parity without maintaining separate Firebase screens.

## Validation and phone checks

141 automated tests cover category normalization and edits, stable filtered indices, class/INT/favored/ranks/overspending math, unavailable data, spell level filters, MP overrides/clearing, zero-MP casting, no revision/resource change, idempotent receipt replay, and owner/Origin/stale-revision protections. The existing equipment and weapon tests remain enabled. The isolated stylesheet budget is now 26 KB (approximately 25 KB emitted), accounting for the previously added equipment layout and these controls; the earlier 18 KB ceiling predated those features.

Synthetic phone browser checks verified editing Gear to Magic Items and filtering the correct row; the 15-unused/17-available/2-spent breakdown updating to 16 after reducing ranks; level selection and End-key navigation; and casting Fire at 0 MP while the display stays 0 / 10. Inventory and spell layouts also had no horizontal page overflow at 320 px; desktop Inventory was checked at 1000 px. No production account data was changed and no live Discord message was sent during QA.

After refreshing Comos:
1. Backpack → Inventory → Edit Item: find Item Tag / Shop Category above Name. Change a test item's category, save, reload and filter it.
2. Skills: inspect Unused Skill Points and its breakdown; change a rank and check the new count.
3. Heart → Spells: select a level, inspect the MP badge, set/clear MP Amount in Edit Spell. Cast at zero MP and confirm the balance remains unchanged. Check actual Discord delivery separately.
4. Backpack → Equip: confirm the silhouette and 13 slot controls remain present.
