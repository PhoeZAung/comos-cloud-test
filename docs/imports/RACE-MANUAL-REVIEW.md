# Comos FFd20 races — manual review checklist

Updated: 2026-10-31. Based on the existing 63 race definitions in Comos. This checklist describes **what is still manual or unresolved** after the large replacement-rule batch. It is **not** a claim that all racial abilities are automated or fully source-verified.

## 1. At the table: manually apply conditional effects

- [ ] Apply situational dodge AC, attacks, CMB/CMD, saving throws and skill bonuses **only when the condition happens**. Do not add these as permanent sheet bonuses. Dwarf Mountain Familarity: choose an applicable landscape; +2 dodge AC there. Dwarf Saltbeard: +2 dodge AC and +1 attack only versus aquatic/water subtype enemies.
- [ ] Record descriptive choices on the racial ability card or character notes (terrain, climate, environment, elemental resistance, weapon, target species). A special wizard is unnecessary unless a choice controls a value Comos must calculate.
- [ ] For bonuses against selected opponents, saves against specific spells, darkness/concealment, water/flight contexts, and once-per-day triggers, check the actual situation with the GM.
- [ ] For manually handled racial spells, special attacks, feat grants, proficiencies, resistance, swimming/climbing/flying, and resource use, reconcile the printed rule before manually entering the sheet effect.
- [ ] Check race-granted extra skill ranks **per character level**, favored class rewards, and scaling traits against the official race/class source during level-up.
- [ ] Verify one real signed-in create → save → reopen → edit cycle on production. Automated CI fixture tests and successful Railway deployment do not establish real login.

## 2. Partial/ambiguous alternate replacements — source review required

| Race | Specific items | What to resolve |
| --- | --- | --- |
| Aegyl | Wing-Clipped | Replaces Emotionless but modifies only flight speed/maneuverability; retain land speed |
| Beastkin | Alluring, Feral, Light Build, Loper | **Draft:** Alluring/Light Build independent partial ability swaps (+2 CHA instead of WIS, +2 DEX instead of STR), combinable; Loper removes Natural Armor and increases base land 30→40 ft while keeping conditional Sprinter. **Feral remains blocked**: no clear stacking or replacement target |
| Garlean | Xenophobia Extremis | **Draft:** retain +2 CON/+2 INT, replace -2 WIS with -2 CHA, keep Common but suppress INT-based bonus language pool; existing first-level and MP guards unchanged |
| Al Bhed | Xenophobic | Replaces starting languages without a complete automatic language effect; must remove Common, disallow INT bonus languages and handle Linguistics progression |
| Forgiven | Scion of Mortality | Changes language and dual-race identity/subtype rather than replacing Type/Languages as entirely removed fields |
| Lambkin | Polyglot | Modifies Magic Expert and Languages |
| Moogle | Grounded | Partial Base Speed/flight modification |
| Moomba | Climb | Climb speed 20 ft and land 30 ft but no formal old-trait replacement target |
| Namazu | Fast, Focused Study | Partial speed, skills, or feature ownership |
| Quadav | Water Tribe | Partial Full Withdrawal replacement |
| Seto Lion | Faster, Nimble Attacks | Partial Claws/Bite/Fast replacements |
| Shindroid | Anomaly, Heavy Platform, Hologram Simulation, Race Simulation | **Draft:** Anomaly replaces Emotionless and modifies only Robotic Immunities (retains fatigue/exhaustion/sleep; loses fear/emotion immunity); grants Bluff/Sense Motive class skills and leaves situational -2 saves manual. Heavy Platform modifies land speed 30→20 ft, preserves other traits; weight and encumbrance conditions manual. **Hologram/Race Simulation remain blocked** |
| Sylph | Improved Flight | Compound Camouflage/Beguiling Liar replacement; preserve correct flight mechanics |
| Syricta | Dragon Type, Evasive Maneuvers, Memories of the Forgotten, Neglected Heritage, Wing-Clipped | Conflicting or incomplete type, speed, vision, language and ability-score modifications |
| Tarutaru | Polyglot language modifier | **Implemented:** Magic Expert replaced; Languages retained; +2 Linguistics and class skill automated; required unrestricted extra language selected on Ability Scores, independently of high-INT bonus language pool. Verify signed-in save/reopen manually |
| Tonkin | Dancing Lantern | Partial Lantern Bearer change |
| Trollkin | Faster Healing | Combined Thick Skin/Fast Healing change; suppression and healing behavior |
| Half-Breed | Ancestral Arms; inherited features | Parent races, feat/skill/offense choices and racial point budget must be validated |
| Dwarf | Saltbeard | **Already fixed:** Greed is modified, not removed. Confirm underwater treasure Appraise +2 and keep other conditional bonuses manual |

Do **not** unblock these by simply marking their extracted mapping “resolved”. For each, verify precisely what survives and what is replaced or modified.

## 3. Heritage score vectors or secondary abilities still needing source/implementation review

A heritage that replaces the original ability scores must **actually adjust STR/DEX/CON/INT/WIS/CHA correctly**. The batch enables only heritages with fully represented, automatic constant score effects and no pending choice pool.

| Race | Heritages / issue |
| --- | --- |
| Goblin | Moblin, Red Cap: social/skill conditions ambiguous |
| Half-Gigas | Fire, Ice, Thunder Gigas: score vector, natural armor and energy resistance |
| Hypello | Poroggo: small size, score vector and Spellcraft — vector currently manual |
| Immortal | Ancients, Unlimited: manual vector; Unlimited also requires a score choice |
| Lamia | Ananta, Medusa, Undine: score vector and Tripping Tail |
| Mandragora | Alraune, Killer Tomato, Korrigan, Pumpkin Head, Wild Onion: manually encoded scores and special effects |
| Matanga | Arkasodara, Gajasura: vector and Craftsman |
| Qiqirn | Leaf-Eater, Meat-Eater, Qitari: Silver Tongued social effect |
| Roegadyn | Lohengarde, Othardian, Sea Wolf: vector with skills/natural attacks |
| Ronso | Helion Hrothgar, Lost Hrothgar, Revgaji, Yeti: ability/secondary rules |
| Sahagin | Desert, Swamp Sahagin: vector and Water Gun |
| Seto Lion | Frost Wolf: racial scores and associated traits |
| Shindroid | Android, Allagan Automata, Machine Lifeform, Omicron: score, status and plating |
| Sylph | Fairy, Pixie, Sprite: vector and Fey Magic |
| Tonkin | Palekin, Tonkin Royalty: vector and secondary ability |
| Vanu Vanu | Gundu, Vundu, Zundu: vector and Gift of Tongues |
| Varg | Gnoll, Kitsune: vector and other traits |
| Viera | Fanow, Feol, Mist-Frenzied, Rava: vector and other traits |
| Gria | Cave Wyrm, Draconic, Ocean Wyrm, Sand Wyrm: scores marked manual; flight/movement ambiguity |
| Tarutaru | Dunesfolk, Gnome, Nymian, Pelupelu: selected skill pool currently unimplemented |
| Hume | Lufenian, Mako-Infused Super Soldier: missing required skill/ability choice |

## 4. Review items beyond replacements

- [ ] Verify source details and nonautomatic benefits of all newly enabled *whole-feature* alternate traits: replacing the correct standard feature is proven; the description may still require play-time adjudication.
- [ ] Verify secondary abilities of newly enabled heritage variants (for example special skill modifiers or situational defenses). The race's source score vector is automated only where it has complete automatic effects.
- [ ] Audit race-granted feats, class-skill flags, extra skill ranks, natural attacks, movement modes, skill specialties and proficiencies not represented by automatic effect IDs.
- [ ] Reconcile race-specific spell-like powers, level-based scaling and favored class bonuses with class-side progression separately.
- [ ] Some official source versions differ. For example, the current Au Ra HTML race page and an older Au Ra PDF describe certain replacement targets differently; choose the intended version instead of silently mixing rule editions.

## 5. Release verification

- [ ] Full Node 24 test suite and cloud build successful for the exact merged commit.
- [ ] Railway deployment of that same main-branch SHA reports SUCCESS.
- [ ] Real signed-in character creation/save/reopen verified for a representative alternate and heritage.
- [ ] The other chat's class and archetype implementation remains untouched.

Sources: Comos race definitions under rules/races/ and rules/staging/races/, plus official race pages:
https://finalfantasyd20.com/races/core-races/dwarf/
https://finalfantasyd20.com/races/core-races/elvaan/
https://finalfantasyd20.com/races/base-races/au-ra/
https://finalfantasyd20.com/races/beastman-tribes/amaljaa/

**Follow-on order:** Resolve the partial operations above by exact source clauses and tests; then reconcile the manual heritage score vectors; then handle level-specific racial/favored-class mechanics. Preserve manually editable descriptions and avoid unnecessary wizard pickers.
