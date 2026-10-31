# Lambkin — Polyglot replacement, language choice and bounded standard sheet fields

FFd20 source: https://finalfantasyd20.com/races/base-races/lambkin/
(Alternate Racial Traits → Polyglot; retrieved source record under `rules/staging/races/lambkin.race.json`).

- Polyglot **replaces Magic Expert**, removing its +2 Knowledge (arcana) and Spellcraft bonuses. It gives an automatic **+2 racial Linguistics bonus**, marks Linguistics a **class skill**, and grants **no extra skill ranks**.
- Polyglot **modifies, not replaces**, the Lambkin Languages trait. Common and Lambkin stay. The player chooses **one additional freely named starting language**, independent of Intelligence, while retaining the normal high-INT bonus language list (Galkan, Giant, Goblin, Lalafellan, Orc).
- A source-specific runtime operation splits the extracted combined partial operation into a checked whole-trait replacement and a narrowly allowlisted part-of-feature modifier. The original source JSON is untouched. Other unresolved partial operations remain blocked.
- The existing Ability Scores step presents both the required Polyglot language and eligible normal high-INT slots, without adding a wizard page. Language validation forbids duplicates of Common, Lambkin, and already chosen INT-bonus languages.
- Standard Lambkin sheet projection now includes source ability scores, Small identity, 20-ft land movement, Common/Lambkin, low-light vision, +2 Magic Expert skill bonuses when active, and the explicitly listed +4 Stealth size bonus. Existing size calculations continue to own AC/attacks/CMB/CMD. Save/reopen must not double any racial contribution.
- Auto-Float, spell resistance (6 + character level), conditional casting modifiers, and favored class options remain **manual**. In particular 20-ft land movement does not imply automatic floating status during antimagic or dispel, where the source changes movement.
- A saved character cannot switch alternate racial traits. The one-language selection is retained on save/reopen and the pre-save selection is pruned on alternate deselection.

Verification targets: Node 24 automated tests and cloud build on the draft PR; signed-in production creation/save/reopen separately required after explicit publication. Draft branch does **not** authorize live deployment.
