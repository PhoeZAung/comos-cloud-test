# Race extraction batch 06 — 2026-10-27

Verified official FFd20 primary gameplay pages from the first standard trait through the final Favored Class Options entry. All records retain source line/row locators. Separate Racial Feats and Racial Archetypes catalogs were deliberately excluded. No text hash is claimed. Neither validation nor extraction is independent rules approval.

| Race | Standard records | Alternate traits | Heritage rows | Favored class options | Last checked section/row |
|---|---:|---:|---:|---:|---|
| Gria | 15 (including split flight for Gria) | 7 | 4 | 12 | 6100 Warrior |
| Guado | 11 (including split flight for Gria) | 4 | 0 | 12 | 6069 White Mage |
| Hypello | 15 (including split flight for Gria) | 4 | 1 | 9 | 6089 Thief |

- Gria: https://finalfantasyd20.com/races/base-races/gria/ — standard 6025-6049; alternate 6050-6059; heritage 6060-6070 (4 rows); favored 6086-6100. Limited flight is a separate staging feature so heritage swaps can target it; this means an extra standard record beyond literal labeled bullets. Checks required: duration with zero/negative CON modifier; action/armor/load conditions; descent/glide rules for Cave Wyrm; selection of Weapon Focus only among current proficiencies; advanced choice consequences.
- Guado: https://finalfantasyd20.com/races/base-races/guado/ — standard 6023-6040; alternate 6041-6048; no heritage table; favored 6055-6069. Important ambiguity: base speed already includes +5 from Moderate Fleetness. Fast Movement replaces Moderate Fleetness and must not stack on 35 feet; needs component-level adjustment. Detect Undead spell must be separately verified.
- Hypello: https://finalfantasyd20.com/races/base-races/hypello/ — standard 6029-6055; alternate 6056-6062; Poroggo heritage table 6063-6071; favored 6078-6089. Critical: Poroggo is Small, substitutes +2 INT for +2 CON, and swaps +2 Ride for +2 Spellcraft while keeping unmodified traits. Fishy Merchant ignores Poor Communication only when trading. Land Lubber overrides base speed without removing armor/encumbrance exception by name; runtime rule must be clarified.

### Verification

- All three stage JSON files pass local Comos schema validator.
- 358 offline structural integrity assertions passed (feature IDs/replacements/heritage targets/choice pools/source locators). These checks are structural, **not game simulation**.
- Import-ready check intentionally fails for unresolved mechanics, external class IDs, and review flags. No production approval, rollout or live wizard integration executed.
- Favored rewards recorded exactly once per race, including fractions and trigger conditions, but still need class-page reconciliation. No extra class abilities are assumed.

### Continuation queue

- Retry Beastkin using its differently named traits section; remains discovery-only because full page could not be retrieved.
- Next official race index pages after Hypello need fresh inventory before extraction.
- Cross-check source replacement wording and convert conditional/unresolved effects to tested wizard adapters before moving any files from staging to `rules/races` or adding to `rules/manifest.json`.
