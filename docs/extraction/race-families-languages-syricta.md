# Race categories, language selections, and Syricta alternate-trait review

Source verified 2026-10-31:
- Official https://finalfantasyd20.com/races/base-races/genome/ (this race is **Genome**, not Gnome)
- Official https://finalfantasyd20.com/races/base-races/palico/
- Official https://finalfantasyd20.com/races/beastman-tribes/kindred/
- Official https://finalfantasyd20.com/races/monstrous-races/syricta/
- Source staging JSON in `rules/staging/races/`; no extractor data edited

## Race selection
The Race step has a new **Race category** dropdown above Race: Core Races, Base Races, Beastman Tribes, Monstrous Races. Filtered choices are drawn from the already-extracted `race.data.raceType`, not a duplicate hardcoded list. Existing characters derive the category from their selected race; changing the category clears the incompatible race and its racial settings. The selected race IDs and schema are not modified.

## Languages
Enabled stored bonus-language selection in the existing Ability Scores language wizard for Genome (open-ended languages, excluding Common), Gria, Guado, Hypello, Mandragora. The source uses "Genome"; no new Gnome race is fabricated.
Palico must select Mithran **or** Ronsaur; Kindred must select Abyssal **or** Infernal. These are separate mandatory first-level slots, with the official permitted high-Intelligence bonus-language lists projected independently. Neither duplicates the chosen starting language. Selecting an invalid number or an unlisted language rejects saving; origin languages stay included. Saved choices are creation-locked.

Other race-specific non-language blockers, such as Gria Weapon Focus, Guado Summoner Element, and certain Mandragora heritages, are not silently bypassed in this change.

## Syricta
- **Dragon Type** replaces **Elemental Resistance**, **Dragon Resistances**, and **Breath Weapon**, exactly per the official text. The existing **Type** trait remains and changes from humanoid (reptilian) to dragon: subtype removed, new type projected. No invented saving throw/AC bonus; immunity to sleep/paralysis and dragon-targeted effects remain described as a rule.
- **Evasive Maneuvers** replaces **Darkvision** and **Dragon Resistances**. Retain Low-light Vision and land/fly speed; flight maneuverability becomes average for a new sheet, preserving explicitly edited values. Siege weapon +2 dodge AC and Reflex bonuses are **situational**, never always on. Official text calls normal flight "clumsy" whereas standard Syricta Base Speed states "poor"; retain actual 40-ft standard flight and use explicit Evasive "average".
- **Memories of the Forgotten** removes **flight only** from the Base Speed feature, preserving 20-ft land speed. Exactly two distinct Knowledge skills must be selected; those get +2 racial skill bonuses and class-skill flags. No default choices.
- Conflicts over the same replaced feature (Dragon Type with Evasive Maneuvers) are refused. Incompatible multiple Base Speed modifiers stay refused. Elemental and Breath selectors become inactive when Dragon Type removes those traits.

The test suite checks source-bound replacements, language count/duplicates, race grouping, Knowledge bonuses, and saved choice permanence. A passed cloud build is not evidence of a live Railway deployment.
