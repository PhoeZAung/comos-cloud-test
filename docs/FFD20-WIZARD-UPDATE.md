# Comos FFD20 — Identity, Race, Multiclass editor

## Scope delivered (character wizard + overview)
- Removed **Sources** as a separate visible editing stage. Existing links to `create-source.html` redirect to Identity; all current edit links and Create Character lead directly to Identity. A read-only `Source: FFD20` appears above Identity.
- Identity saves character name, uploaded portrait and one of the nine standard alignment choices (plus Unaligned). Portraits are browser-resized JPEG data images (up to 160,000 text characters) and previewed before saving; no new external storage/host is needed.
- Race shows two independent lists of toggles. Standard traits default ON for indexed races; adding an alternate creates it OFF. Both can be toggled in either direction. Additional race traits can be entered manually. Verified built-in FFD20 standard/alternate labels are seeded for Hume, Dwarf and Elvaan only. **Full FFD20 race catalogs and automatic standard-replacement calculation are not implemented yet** and must not be claimed complete. Previous imported data remains preserved.
- Class stage lets players add `Class 2`, `Class 3` etc. (up to eight), change each class's level with compact +/- buttons, remove secondary classes, and choose an optional class-specific archetype or enter an unlisted one. The class dropdown includes core/base/hybrid classes from the official FFD20 class list. Known archetype suggestions are class-specific and incomplete; unlisted archetypes can be entered with **Other archetype**.
- On save, `classes: [{name,level,archetype}]`, `total_level`, `class_level`, and legacy `class`, `level`, `character_level` fields update together. Old stats, equipment, spells and other JSON are preserved (except the fields intentionally edited). The sheet overview shows each Class Lv (e.g. Black Mage 3) and a separate Total Level (5).
- New characters can be started at Identity, then proceed through Race and Classes. An existing character's revision is checked before writing; access is restricted to its owner or the verified admin. Changes are in existing SQLite character_details data, no schema migration.
- This editor **records selections only**. It does not auto-calculate racial bonuses, class abilities, HP or MP, or archetype replacements; these require complete rules data and dedicated mechanics tests.

## FFD20 reference pages
- https://www.finalfantasyd20.com/classes/
- https://www.finalfantasyd20.com/races/core-races/hume/
- https://www.finalfantasyd20.com/races/core-races/dwarf/
- https://www.finalfantasyd20.com/races/core-races/elvaan/
- https://www.finalfantasyd20.com/classes/core-classes/black-mage/archetypes/

## Acceptance tests
1. Sign in and open an existing character's **Edit** icon in Characters or Admin. It should land directly on **Identity**, not Sources.
2. Change the name/alignment; upload a JPG, PNG or WebP; confirm the preview, save and reopen. Changes should persist without changing unrelated character data.
3. Choose Hume, Dwarf or Elvaan. Standard options should start ON; add an alternate and check it starts OFF. Toggle both lists, save and reopen Race to confirm selection persistence. For races without a complete rules catalog, enter trait names manually (this is deliberate and disclosed).
4. Set Class 1 Black Mage Lv 3 with Cryomancer; click Multiclass, select Class 2 Warrior Lv 2; save, open the sheet and confirm Class 1 Lv **Black Mage 3**, Class 2 Lv **Warrior 2**, Total Level **5**. Remove Class 2 and confirm total recalculates.
5. Try a second account on another user's record; all unauthorized updates must fail. Try a stale revision from another tab and verify 409 conflict instead of data loss.
6. Confirm no changes to your existing Admin user/character hierarchy, tags, Posts or Replies. Check phone portrait preview, race toggles and class rows at narrow widths.

## Focused validation
5 pure module/layout tests passed locally. Full repository integration tests and signed-in mobile acceptance were not executed; GitHub-to-Railway deployment is automatic.