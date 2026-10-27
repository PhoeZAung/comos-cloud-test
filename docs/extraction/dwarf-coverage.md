# Dwarf — first race extraction batch

Source checked 27 October 2026: https://finalfantasyd20.com/races/core-races/dwarf/

The current gameplay body was read through **Favored Class Options → White Mage**, the final entry. Navigation, artwork and introductory setting prose were not imported. The separate Racial Feats and Racial Archetypes catalogs are excluded. Toughness granted by Unstoppable remains included in that trait.

| Included source entity | Expected | Recorded |
| --- | ---: | ---: |
| Standard traits, including all five subsections | 15 | 15 |
| Alternate traits | 26 | 26 |
| Variant heritage rows | 4 | 4 |
| Favored class options | 39 | 39 |
| Total source entities | 84 | 84 |

The four heritage rows expand to eight features: one score vector and one alternate ability per heritage. There are **49 feature records**, not 84 features. The canonical definition is `rules/races/dwarf.race.json`, revision 2. Every mechanical object retains its source section and bullet/row locator. Description hashes and word counts describe the actual emitted UTF-8 text; no whole-page content hash was invented.

This pass checks mechanical information in the user-supplied extraction against the current page. Descriptions remain mechanical paraphrases. They are explicitly `summary_legacy`, **not** `full_verified` verbatim source text. The v3 full-text/independent review gate remains blocked; `review.state` remains `needs_review`, and `review.coverage` remains `partial`. Counts prove inventory reconciliation, not independent approval or full automation.

## Corrections and source details

- Surface Survivalist does not state when the hot/cold choice is made. The earlier at-creation restriction was removed from its notes. Wind and climate remain distinct effects, and hot/cold remain alternatives.
- Saltbeard changes Greed's treasure restriction **and** replaces Defensive Training, Hatred and Stonecunning. Its component modification stays unavailable for automatic selection.
- Lorekeeper's skill bonus is racial. Chemist range increments have a five-selection threshold without a combat-only limitation. Dancer's five-selection restriction explicitly applies in combat.
- Xenophobic does not explicitly name the check receiving its anti-mind-affecting bonus. Its wording remains manual rather than inventing a global save bonus.
- Heritage vectors replace the standard vector; their alternate abilities replace Hatred. Tavern Hopper and a heritage cannot both consume the standard vector.
- Class-specific rewards retain race/class IDs, fractions, thresholds, transfer to replacement companions and targeted selections. The Black Mage reward stays descriptive/manual beneath Proficiencies. Other class listings remain in the canonical file for later reconciliation, rather than enabling those classes.

## Site integration

Each of Dwarf, Elvaan and Galka now has a separate canonical `.race.json` file. Elvaan/Galka were split from the supplied extraction without a new source-accuracy claim. `rules/manifest.json` controls the runtime projection, and the normal preview/cloud build regenerates that projection. The character sheet still loads saved contributions rather than the full extraction files.

The supported fixed score, identity, weapon and skill contributions use the existing adapter. Conditional combat rules, selected targets, SR, feats, recovery and other unsupported effects remain rules text. Identity now preserves type/subtype and the complete stored movement/language/sense rule descriptions. Saving an edited build recomputes owned contributions while preserving manual entries and current resources.

No stored character is migrated by deployment. An existing character adopts these descriptions through an explicit wizard save. The previous deployment and source commit provide rollback points.

## Validation and continuation

Run `python3 -m pip install -r tools/requirements.txt`, then `python3 tools/validate_rules.py rules/races/*.race.json`. Run `--ready` separately: rejection is expected while independent approval, full-text requirements and declared manual mappings remain unresolved. Do not remove issues merely to turn that gate green.

`npm run rules:check` detects stale generated data. Semantic tests cover replacement conflicts, heritage vectors, conditional-save isolation, identity persistence, racial skill contributions, and preservation across reapplication. The full suite and cloud build are recorded in the delivery/commit validation.

Resume at **Elvaan → Standard Racial Traits**. Then Galka, Half-Breed, Hume, Mithra, Moogle and Tarutaru in the current core navigation order. Capture the remaining category indexes before starting their races. Classes follow the race pass. The user's current packaging choice is **one file per class family containing the class and its archetypes as separate definition records**; that supersedes the earlier separate-archetype-file deliverable.
