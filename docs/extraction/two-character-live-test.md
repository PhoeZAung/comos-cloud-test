# Moogle Mog Knight and Immortal Dancer: first-level testing

These two builds are supported for **new level-1 characters**. The normal wizard
can save and edit them through the existing authenticated character endpoints.
They are not a claim of complete Chocobo Knight, Dancer, companion, or combat
automation. Existing Black Mage and Archer progression is retained.

## Available rules

- Chocobo Knight: d10 first-level HP, BAB +1, Fortitude +2, Reflex +0, Will +0,
  4 + INT skill ranks, source class skills and proficiencies, 175 gil and starting
  outfit. Mounted Combat is a bonus feat. Companion operation is manual.
- Mog Knight: requires both Moogle and Chocobo Knight. Steady Riding and Mog
  Attack are added; Challenge is removed. Deathblow replaces Supreme Overrun;
  Fight as One and Chocobo Mount remain. The conditional extra 1d6 is not a
  permanent damage bonus and is not multiplied on a critical.
- Dancer: d8 first-level HP, BAB +0, Fortitude +2, Reflex +2, Will +0,
  4 + INT skill ranks, source class skills and proficiencies, 105 gil and outfit.
  Improved Unarmed Strike is a bonus feat. Battle Dance is 4 + CHA modifier
  rounds at level 1. Fleet and unarmored Charisma AC/CMD are manual conditional
  effects; the adapter does not permanently add them. No MP or level-2 ki pool.
- Standard Moogle: +2 DEX, +2 CHA, -2 STR, Small, 20-foot land speed, starting
  languages, low-light vision, Appraise/Perception bonuses. Handy requires one
  actual Craft/Profession row and a named specialty, and bonuses apply to only
  that row. Limited flight and situational racial effects stay on manual cards.
- Standard Immortal: Medium, 30-foot speed, Common, one chosen +2 ability,
  selected optional bonus languages within INT allowance, and up to four chosen
  Knowledge class skills without free ranks. Integrated skill bonuses are mapped.
  Magic Ineptitude, Linking, death-state mechanics, and other conditional traits
  remain visible as manual rules. Dancer does not bypass Magic Ineptitude.

Race source definitions remain `needs_review`; this adapter maps the two races'
older effect target names to the existing sheet fields without changing or
silently approving their source records. Unsupported alternate/heritage choices
remain blocked by the normal validation.

## Source records

- https://finalfantasyd20.com/races/core-races/moogle/
- https://finalfantasyd20.com/classes/base-classes/chocobo-knight/
- https://finalfantasyd20.com/classes/base-classes/chocobo-knight/archetypes/mog-knight/
- https://finalfantasyd20.com/races/base-races/immortal/
- https://finalfantasyd20.com/classes/hybrid-classes/dancer/
- https://finalfantasyd20.com/classes/core-classes/bard/#bardic-performance

Class and archetype JSONs include archived source hashes and retrieval dates.
All 20 class progression table rows were transcribed from cached official HTML;
runtime creation is capped at level 1 because later feature choices, scaling,
companion advancement, and archetype replacements are not implemented here.

Mog Knight's source summary lists `Limit Break (Deathblow)` among replacements,
but the detailed Deathblow paragraph says it replaces **Supreme Overrun**. This
integration follows the explicit detailed replacement, keeps Fight as One, and
retains this discrepancy for review. No replacement of both Limit Breaks occurs.

## Phone acceptance on the deployed site

1. Sign in and create a new test character. Choose Moogle with standard traits.
   Select a Handy row, such as Craft 1, and name its specialty.
2. Choose Chocobo Knight and Mog Knight. Other races cannot select Mog Knight.
   For a simple arithmetic check, choose manual base scores of 10 in all six
   abilities, then spend the four skill ranks.
3. Review: STR 8, DEX 12, CHA 12, HP 10, MP 0. The level-1 features include
   Deathblow and Mog Attack, with no Challenge or Supreme Overrun.
4. Save and reopen. Confirm Moogle / Chocobo Knight / Mog Knight, Small size,
   land speed 20, the Handy specialty on exactly one row, and Mounted Combat.
5. Create Immortal / Dancer with standard traits. Choose CHA for the +2 racial
   bonus; optionally choose up to four Knowledge skills. With base scores of 10,
   verify CHA 12, HP 8, MP 0, Medium size, land speed 30, and four skill ranks.
6. Save and reopen. Confirm Improved Unarmed Strike, Battle Dance (five rounds
   with CHA 12), racial restrictions, and no spellbook or ki pool.
7. Editing or reloading must not duplicate abilities, reset spent rounds,
   grant MP on INT changes, or remove manual entries. Increasing CON changes
   maximum HP without healing. Later-level creation and multiclassing are blocked.

Live provider login and real production persistence must be verified on the
deployed site; a local fixture session is not a production login test.

## Local validation

`npm test` exercises full existing regressions, racial-choice validation,
first-level calculations, restrictions, persistence, and idempotency. The focused
suite is `node --test tests/level-one-characters.test.mjs`.

A 390-pixel Chromium session completed the actual wizard for both builds and
saved them through the real character-library service backed by temporary
SQLite. That harness used a local fixture session and made no production writes.
`npm run build:cloud` validates the production build without starting Firebase or
changing Railway settings.
