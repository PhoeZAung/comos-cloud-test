# FFd20 race files: available for live wizard testing

50 extracted races through batch 16 are kept as individual `.race.json` files. Every definition is still `needs_review` with `coverage: partial` and `importReady: false`. These files are explicitly listed in `rules/manifest.json` for **live user testing**, not for rules approval. The normal three races (Dwarf, Elvaan, Galka) are preserved.

The race dropdown shows staged races with “(testing)” and the wizard displays a review warning. The existing runtime projection applies only its supported unconditional effects. Unsupported effects remain manual; alternates with unresolved replacement mapping stay disabled. Heritage and race-dependent choices, cross-race Half-Breed inheritance, and favored-class bonuses still need review. Test character totals against official source pages before play; a saved character is not evidence of rule correctness.

**Beastkin remains excluded** because its complete source rules were unavailable. Class extraction for Astrologian and Berserker remains separate and not enabled. No Railway API or Railway connection is used.

## Batch 07: Immortal, Lambkin, Mandragora

These are visible for testing but still need manual review. **Immortal Magic Ineptitude prohibits a magic pool**, conflicting with Black Mage's MP calculation. The character builder blocks completing an Immortal/Black Mage character until the conflict is resolved. Lambkin's Float/status restrictions and Mandragora's five heritage spell substitutions are not automatically applied. See `docs/extraction/race-batch-07-coverage.md` and the per-race review issues.

## Batch 08 — Moomba, Mutant, Nu Mou

Moomba's spoken-language and vocal-component restrictions require manual checks. Mutant's 100-entry mutation table and 100-entry optional physical-feature table are kept as separate manual selection pools; its ability advancement overrides standard fourth-level bonuses and cannot be saved through the current Black Mage automation. Nu Mou's two selected Knowledge skill bonuses and three chosen 0-level spell-like abilities remain manual. All three are visible for testing, but none is independently reviewed. See `docs/extraction/race-batch-08-coverage.md`.

## Batch 09 — Palico, PuPu, Qu

Palico has 11 alternate traits and two heritage rows (Cait Sith and Felyne), even though the source introduction says one; those heritage mappings remain manual. PuPu has three alternates and Hiso heritage; its summary and detailed body differ on aberration subtype, and Knowledge (Technology OR Engineering) is one selection. Qu has three alternates, including two conflicting replacements of Weapon Familiarity; its favored-class Paladin reward is either-or. These remain `needs_review` and appear as **testing** choices. See `docs/extraction/race-batch-09-coverage.md`.

## Batch 10 — Roegadyn, Ronso, Seeq

Roegadyn (4 alternates, 3 heritages), Ronso (5 alternates, 4 heritages), and Seeq (6 alternates, no heritages) are available for testing after the normal GitHub-backed build. Ronso source introduction says two heritages, while its table contains four. Unresolved heritage replacement maps and situational bonuses are manual, `needs_review` and not import-ready. See `docs/extraction/race-batch-10-coverage.md`.

## Batch 11 — Seto Lion, Shindroid, Tonkin

Seto Lion has 8 alternates and Frost Wolf heritage; 50-ft base speed already includes both Fast and Quadruped so speed-changing alternates stay blocked. Shindroid has 15 alternate traits and **4 heritages**, although its introduction says 3. Shindroid cannot gain MP under Magic Ineptitude; the Black Mage wizard requires selecting Magitek Unit. Tonkin has 5 alternates and 2 heritages; its mute vocal-component rule blocks saving an unsupported Black Mage. Dancing Lantern modifies only the spell-like component of Lantern Bearer, therefore its replacement is marked unresolved. All remain testing-only, `needs_review`, and not import-ready. See `docs/extraction/race-batch-11-coverage.md`.

## Batch 12 — Varg and Viera

Varg: 11 alternates, 2 heritages (Gnoll, Kitsune), 11 favored class options. Feral adds -2 INT; Light Build and Savant substitute the same ability vector and conflict. Viera: 7 alternates, 4 heritages (Fanow, Feol, Mist-Frenzied, Rava), 15 favored class options. Two distinct racial selection pools exist (6-element subtype selection and 3-spell Mist Sight), but wizard choices remain manual. Both races are testing-only and `needs_review`, not independently approved. See `docs/extraction/race-batch-12-coverage.md`.

## Batch 13 — Beastman Tribes: Amalj'aa, Antica, Forgiven

First three Beastman Tribes now appear in the wizard as **testing** races; all are `needs_review`/`partial`. Amalj'aa has 3 heritages with unresolved Stalker class-skill substitutions. Antica has a 15-foot burrow speed, understands rather than speaks its starting languages, and cannot cast normally without Silent Spell or Telepathic Spellcaster; current Black Mage builder refuses to save until feat support exists. Forgiven has 9 alternate traits, several source-wording `skilled`/`Skill Bonus` aliases, a partial Celestial-language replacement, and a one-of-two natural attack choice; unresolved alternates stay disabled. Favored class options remain manual. See `docs/extraction/race-batch-13-coverage.md`.

## Beastman Batch 13 continuation — Gnath

Gnath has 12 standard traits, 9 alternate racial traits, 8 favored class rewards, and no listed heritage. Distinct 20-ft land and burrowing speeds; Day Raider removes both darkvision and light sensitivity; Carrion Sense is restricted. All are testing-only, manual condition mechanics and `needs_review`. See `docs/extraction/race-batch-13-gnath-coverage.md`.

## Beastman Batch 14 — Goblin, Ixal, Kindred, Kobold

Added 4 race testing definitions, with Goblin Moblin and Red Cap heritages and six alternates, Ixal five alternates plus two required race choice pools, Kindred five alternates plus required language and Maw/Claw choice pools, Kobold five alternates and 20 ft burrow speed. Mandatory Ixal and Kindred choices are guarded in the Black Mage build validator. Unclear conditional mechanical effects remain manual; Moblin/Red Cap replacement unresolved. See `docs/extraction/race-batch-14-beastman-coverage.md`.

## Beastman batch 15 — Kojin, Lamia, Loporrit, Matanga

Added 4 source-based testing JSONs with full standard/alternate, heritage tables and favored class options. Kojin has underwater and shell movement with no water breathing; Lamia has 20-ft land, 40-ft swim, and two required terrain/resistance choices; Loporrit starts Small with 40-ft speed and skill choice needs; Matanga has Powerful Build and a mandatory Knowledge choice. All mandatory unsupported selections are guarded in the builder. Source index discrepancies and unresolved alternate/heritage mechanics are documented in `docs/extraction/race-batch-15-beastman-coverage.md`.

## Beastman Batch 16 — Namazu, Orc, Qiqirn, Quadav

Added four one-per-race testing JSONs: Namazu has 4 alternates, Orc has 8, Qiqirn has 3 and three heritages (table overrides two-heritage intro), and Quadav has 3 alternates. Orc Skill Bonus and Quadav Bond to the Land require unresolved choices and block character saving. Namazu Fast / Focused Study and Quadav Water Tribe are unresolved substitutions. See `docs/extraction/race-batch-16-beastman-coverage.md`. No Railway activity.
