# Live rules wizard — 26 October 2026

The Create character routes now mount the same seven-step draft editor: Identity, Base scores, Race, Class, Choices, Spells and Review. Intermediate steps use an account/character-scoped session draft. Only the final commit writes a character. Creation is transactionally idempotent per user/request; editing retains the existing owner/admin, Origin and revision checks.

## Enabled scope

- Three supplied races: Dwarf, Elvaan and Galka. Old uncurated race picker entries and partial Hume presets were removed. Existing characters are untouched until explicitly saved through the new wizard.
- Base Black Mage, levels 1–20. All 20 supplied archetype names remain visible but disabled until their individual replacements, casting changes and dependent catalogs are checked. No incomplete archetype silently inherits base mechanics.
- Standard/alternate trait descriptions, disabled standards, full-feature replacements and heritage vectors. Overlapping replacement targets are rejected. Unresolved/component-level alternate mappings remain unavailable. Disabling a standard also suppresses its heritage replacement.
- Base scores are separate from racial contributions. Size, speed, languages, senses and weapon proficiencies map into the existing sheet. Safe unconditional fixed skill bonuses are applied as owned contributions. Conditional bonuses remain rules text.
- Black Mage class skills, level events, selectable feature pools, repeat limits, canonical grant IDs and source-owned card updates. Source-specific prerequisite/condition evaluation is not a complete general rules engine. The final review explicitly asks players to check selected options before play.
- BAB and three base saves match every supplied progression row and all legacy numeric rows. Current official class table was cross-checked as well. The original scraper's Special text includes merged MP/spell-level columns and is not used as a mechanical parser.
- Class MP comes from the checked 20-row progression. Bonus MP uses the official score-band/highest-spell-level lookup, never a sum of columns or score-modifier multiplication. Scores above the verified table range (45) are blocked rather than extrapolated. Skill ranks use 4 + INT modifier, minimum 1 per level.
- HP uses the explicitly entered d6 results, adding CON once per level (minimum one HP per level). First-level input starts at 6 and remains editable. No later HP rolls, point-buy budgets or average-HP rules are invented.
- Favored HP/skill choices are recorded once per selected level. Race-specific crafting/conditional damage rewards are retained as text choices and do not become unconditional combat bonuses. Class/race listings are not independently added twice.
- 344 Black Mage spell references restored from the old stock-spell backup, including descriptions and original source links. These are explicitly labeled backup references and are **not** a newly verified complete spell catalog. The live class spell-learning events/counts are enforced separately, including the earlier-level eligibility constraint. Spell damage/dice and conditional class modifiers are not guessed from prose. Casting still does not automatically spend MP.
- Stat edits on a managed sheet update bonus MP, CON-based HP maximum, derived saves and linked use maxima. Current HP/MP and spent ability uses remain separate; changing a maximum never heals or refills. Unverified recovery mappings do not automatically reset imported pools on Rest.

## Preservation

On first explicit adoption of a legacy character, an original-data rollback snapshot is retained in the character detail record. The original effective scores may already contain race adjustments, so the wizard requires explicit base-score entry before adopting. Legacy characters are not silently migrated in the background. Manual collections, unknown fields, equipment, favorites and current resources are retained. Source-owned rows are updated by IDs; removed owned ability cards remain disabled during synchronization. Manual numeric offsets on previously managed values are retained across wizard reapplication. Rollback is a retained snapshot for recovery, not an exposed one-click restore control.

Focused sheets do not import the wizard, race/class registry or spell catalog. The new summary lookup is a small module. Firebase authentication and the existing Railway service/data volume are unchanged; future native QNAP hosting remains the plan.

## Sources and evidence

- Black Mage: https://finalfantasyd20.com/classes/core-classes/black-mage/
- MP system: https://finalfantasyd20.com/magic/mp-system/
- Races: https://finalfantasyd20.com/races/core-races/dwarf/ , https://finalfantasyd20.com/races/core-races/elvaan/ , https://finalfantasyd20.com/races/core-races/galka/
- Current spell index identified: https://finalfantasyd20.com/magic/spells-by-class/black-mage/ . Individual backup spell descriptions still need review against current pages.
- User-uploaded `Comos_Black_Mage_All_Archetypes.json` and `Comos_First_3_Core_Races.json` are input evidence, not blanket mechanical approval. Both contained explicit partial/needs-review flags. Runtime catalog is a lean projection with unavailable mechanics gated; it is not labeled a fully reviewed `comos.rules.v1` bundle.

## Phone acceptance test

Create a NEW Dwarf Black Mage at level 2 with all original scores 10 except INT 18; keep standard traits, enter HP results 6 and 4, and choose no favored reward. Choose one Black Magery option and one mage talent, four cantrips and nine 1st-level spells.

Expected preview/sheet: STR 10, DEX 10, CON 12, INT 18, WIS 12, CHA 8; HP maximum 12; BAB +1; Fortitude +1, Reflex +0, Will +4; class MP 4 + bonus MP 1 = maximum MP 5. Hardy's conditional +2 must not increase every save. Elemental Shield maximum uses is 7.

Lower current HP/MP, spend some Shield uses, then change INT to 20 and CON to 14 on the sheet. HP maximum should increase by 2, MP maximum becomes 6, Shield maximum becomes 8, while current HP/MP and number of already spent uses are preserved. Reopen the wizard, refresh, and confirm the draft/source grants are not duplicated. Verify a heritage replaces the racial score vector and an overlapping alternate is refused.

The full automated suite includes new calculations, replacement, preservation, live stat-edit, spell-eligibility, idempotent-create, access-control and stale-revision tests. Physical phone interaction and full rules completeness remain user acceptance work.
