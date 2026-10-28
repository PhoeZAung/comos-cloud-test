# COSMOS Beastman extraction — Batch 16

Official index: https://finalfantasyd20.com/races/beastman-tribes/

| Race | Standard | Alternates | Heritages | Favored reward records | Choice pools |
|---|---:|---:|---:|---:|---:|
| Namazu | 11 | 4 | 0 | 8 | 1 |
| Orc | 11 | 8 | 0 | 11 | 1 |
| Qiqirn | 11 | 3 | 3 | 6 | 0 |
| Quadav | 15 | 3 | 0 | 8 | 1 |

## Namazu
Source: https://finalfantasyd20.com/races/beastman-tribes/namazu/

- BLOCKING: Source summary calls feats Silver Tongued, Skill Bonus x3 and Skill Training, while detailed page splits them into Craftsman Knowledge, Festive Culture and Skilled Traders; detailed listing governs staging.
- BLOCKING: Base land and swim speeds are both 30 ft, but swim speed does NOT grant water breathing. Water Sense only works in the same water body.
- BLOCKING: Fast modifies Base Speed and removes Skilled Traders; speed replacement not supported and is kept unresolved until movement projection review.
- BLOCKING: Focused Study requires skill choices at levels 1, 8 and 16, not one unconditional Skill Focus or all possible skills.
- BLOCKING: Festive Culture Perform applies to specialties and Craftsman materials restrict bonus; do not auto apply to generic skill group.

## Orc
Source: https://finalfantasyd20.com/races/beastman-tribes/orc/

- BLOCKING: Standard Skill Bonus presents two alternative bonuses (+2 Acrobatics versus +1 Climb and Jump). A racial choice must be recorded, and 'Jump' is not a distinct fixed sheet skill.
- BLOCKING: Orc Lord replaces BOTH Ability Score Racial Traits and Skill Bonus; do not retain the baseline +4 STR/-2 INT/-2 CHA if selected.
- BLOCKING: Ferocity, Feral negative-HP bonuses and Warcry duration/resource depend on dynamic hit point and action state; keep manual.
- BLOCKING: Several alternates replace Skill Bonus and mutually conflict; several replace Throw Anything, so conflicts must be detected.

## Qiqirn
Source: https://finalfantasyd20.com/races/beastman-tribes/qiqirn/

- BLOCKING: Heritage intro says two Qiqirn bloodlines, but table lists three: Leaf-Eater, Meat-Eater and Qitari. Preserve all three pending review.
- BLOCKING: Heritage skill replacements affect Silver Tongued's Bluff/Diplomacy bonuses; additional three-step Diplomacy mechanic may need independent handling. Heritages unresolved.
- BLOCKING: Source spells Qiqirn starting language as 'Q iqirn'; normalized to Qiqirn, requires confirmation.
- BLOCKING: Curiosity offers class skills unless class already has them, then +2 racial instead. Current Black Mage class-dependent resolution needs review; avoid unconditional duplicate benefits.
- BLOCKING: Sociable retries are situational, Sprinter applies only to certain actions and Scavenger situational checks remain manual.

## Quadav
Source: https://finalfantasyd20.com/races/beastman-tribes/quadav/

- BLOCKING: Bond to the Land requires one of swamp or underground terrain. Wizard lacks a persisted racial terrain choice; block saving until recorded.
- BLOCKING: Water Tribe adds +20 swim movement to original 30 and allows breathing air/water, and removes Full Withdrawal. Current movement calculation is not verified, keep replacement unresolved.
- BLOCKING: Full Withdrawal requires active state, prone/drop items, spellcasting ban, duration, DR and concealment; should be displayed manually, not always-on.
- BLOCKING: Armor Non-Proficiency text actually states double armor cost unless self-crafted; do not revoke armor proficiencies.
- BLOCKING: Source repeatedly calls protection DR/5 Bludgeoning; interpretation as DR 5/bludgeoning needs verification.

## Integrity, runtime and deferred work

All new races remain `needs_review`, `partial`, `importReady: false`, available only for wizard testing. Source line locators included. Unconditional automatic racial stats and fixed skill bonuses can flow through projection; conditional abilities, time-limited actions, equipment, swimming breathing, and optional class favored rewards require manual tracking or later runtime integration. Mandatory unsupported choices are guarded. Beastkin remains unextracted; full Markdown report explicitly deferred. No Railway connection or deployment activity.
