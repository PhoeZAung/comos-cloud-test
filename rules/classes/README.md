# COSMOS CLASS EXTRACTION TEMPLATE — v1

Purpose: make every new FFd20 class (and its many archetypes) extractable as reviewed source data, without rewriting the wizard manually.

## Fast workflow
1. Run `npm run rules:class:new -- bard` for a **new** class. Does not overwrite existing files.
2. Replace all placeholder rows in `rules/classes/<slug>.class.json` with actual official 1–20 table values and source locators. Extract class fundamentals (Hit Die, BAB, saves, skills, armor, MP, spells/songs, resources).
3. Each **ability** has one permanent `features[].id` and one `grant_feature` event at the level gained.
4. Each later **improvement** goes in `upgrades[]`, with `featureId` targeting the exact original ability. Include a matching `upgrade_feature` event at the improvement level. `changes` values **replace** previous values, they do not add. This prevents duplicate Aim/Inspire Courage cards or stacked tier bonuses. Do not invent source-uncertain improvements.
5. Each talent/feat/spell choice has a `choose` event with its pool ID; add the actual options in `<slug>-talents.json` (if available), with minimum level and prerequisite IDs. Never auto-select choices. Conditional effects remain manual.
6. Keep archetypes separate. `data.archetypeIndex` lists them for discovery; individual files will specify *feature replacements, modifications, granted features, and level overrides*; no archetype may enable until its rule and save adapter are verified.
7. Register the completed extraction in `rules/classes/manifest.json` with `status:"staged",adapter:null`. Run `npm run rules:class:check` and `npm test`.
8. The build will generate `src/features/characters/rules/class-catalog.mjs`, and the wizard will show staged classes disabled. To turn one on, implement and test its corresponding **class-specific save/level-up adapter**, then mark `status:"live"` and register the adapter. Flipping a JSON flag alone cannot activate a new class.

## Mandatory source and integrity checks
- 20 sequential levels, each with exact BAB, iterative attacks, Fort/Ref/Will and source references.
- One grant per feature. Every upgrade references a previously granted feature; one upgrade per ability per level; all upgrades must have matching upgrade events.
- Source links and visible `review.state` (staged ≠ approved).
- All mandatory choices, resources, scaling and spell/song lists must be handled or explicitly listed as unresolved blockers.
- Never assign a disputed conditional bonus to permanent AC, speed, attack or saving throws.
- No arbitrary placeholder values in a registered class. Do not register scaffolds.

## Example of an UPGRADE (not another grant)
```json
{
  "id":"ffd20:class:archer:upgrade:aim:5",
  "featureId":"ffd20:class:archer:feature:aim",
  "atClassLevel":5,
  "changes":{"bonus":2,"targets":2},
  "description":"Aim now provides +2 versus two aimed targets.",
  "sourceRefs":[{"sourceId":"main","section":"Class Features","locator":"verified source"}]
}
```
A separate `upgrade_feature` event points at this ID. The importer validates both links.

## Current compatibility boundary
Black Mage's existing builder is legacy. Archer has a live class adapter. Bard is the next staged extraction and is **not** a selectable/savable class until its songs, talents, choice validation and class adapter are complete. The pipeline validates, generates and inventories data; it does not certify or blindly activate gameplay rules.

## Commands
- `npm run rules:class:new -- <slug>` — generate safe unregistered template.
- `npm run rules:class:check` — validate registered classes and verify generated catalog is current.
- `npm run build:cloud` — production-like cloud build.
- `npm test` — all existing tests and class contract tests.

## Archetypes can be processed separately

Run `npm run rules:archetype:new -- bard abhorsen` to create an *unregistered* child scaffold. After extracting official archetype source details, fill its replacement records and add it to `rules/classes/archetypes/manifest.json` as `status:"staged",adapter:null`. The same class importer validates its parent and source references, then includes it in the generated catalog. It **does not** activate the archetype. Every replacement must identify the original feature IDs, whether the replacement is entire or only specified components, and any new feature IDs. If the source is ambiguous, set `resolution:"needs_review"` and keep it disabled.

Example replacement (replace exact IDs with official extracted feature IDs):

```json
{
 "id":"ffd20:archetype:bard:abhorsen:replacement:inspire-courage",
 "atClassLevel":1,
 "operation":"replace",
 "targetFeatureIds":["ffd20:class:bard:feature:inspire-courage"],
 "replacementFeatureIds":["ffd20:archetype:bard:abhorsen:feature:example-new-power"],
 "scope":"whole_feature",
 "resolution":"needs_review",
 "sourceRefs":[{"sourceId":"main","section":"Archetype Class Features","locator":"verify-source"}]
}
```

This is an **illustrative mapping only**, not a claim about the Abhorsen archetype.

## Bard Song Talents extraction

Bard has an independent `rules/classes/bard-talents.json` with **32 normal and 12 advanced talents**, class feature and talent prerequisites, explicit repeat limits, asterisk song-modifier exclusivity, and a stable three-event Bardic Inspiration die upgrade (d8 at 5, d10 at 10, d12 at 15). The generic importer now validates all those properties and provides `eligibleClassTalents` / `classTalentAtLevel` to apply level-specific changes without duplicate feat cards. Song Talents at levels 12–20 choose from both normal and advanced options, using the SAME one slot per even level; Bard stays staged until songs and adapter are implemented. See `docs/extraction/bard-song-talents-batch-02.md`.
