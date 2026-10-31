# Thief family: local source-backed sheet support

Thief and all 25 archived archetypes are defined through levels 1–20: Agent,
Assassin, Bounty Hunter, Burglar, Combatant, Deadly Courtesan, Festivalist,
Filcher, Keyblade Master, Knife Master, Merchant, Prowler, Raptor, Rogue,
Saboteur, Skulking Slayer, Sky Pirate, Solid Snake, Spellthief, Street Magician,
Streetrat, Thug, Time Bandit, Treasure Hunter and Trickster.

These definitions are local work for the shared `sheet-family-progression`
adapter. Availability in a local manifest is not a publication claim. This
source extraction is not independent full rule review or combat automation.

The parent has 28 canonical features, 17 scalar SET upgrades, 208 distinct real
source talents, and all 20 source progression rows. Talent table headers and
asterisk explanations are excluded from options. Normal and advanced talent
acquisitions remain separate; advanced choices start at12. Finesse weapon and
Thief’s Edge skill choices use explicit manual-selection entitlement slots and
existing ability/weapon/skill rows for exact names.

Native pools include 15 Burglar Tricks, 20 Combatant finishers, 20 Rogue tree
talents, 9 Temporal Talents, 7 Merchant blessings, 31 selectable Saboteur traps
plus its automatic Snare Trap, and 11 Pirate Tricks. Where the source permits
ordinary talents as alternatives, the choices share one acquisition slot.
Knife Master's optional Sword Saint talent selections leave ordinary Thief
Talent slots intact. Street Magician spell-like selections and cross-class
Sword Saint choices use source-described manual selections. Exact subchoices,
prerequisites, weapon/feat selections and duplicate manual names remain GM/player
checks on existing sheet entries.

The Combatant uses source d10/full BAB and 4 skill ranks per level. Merchant,
Street Magician and Skulking Slayer use6. Class skill/proficiency overrides are
source-specific. Spellthief has its exact source MP table (33 base MP/cap4 at20),
INT casting ability, and manual black-mage spell learning on existing spell rows;
spell stealing, temporary excess MP and caster-level exceptions remain manual.
Resources reuse existing counters for Ki, Stamina, Motes, Magic Pool, Performance,
Burglar Touch and Go, Saboteur Traps, Merchant abilities and Solid Snake abilities.
Optional talent resource increases and sustained-mode reductions are manual.
Deadly Courtesan performance is level−1 + CHA rounds, per its own source.

Conditional damage, marks, trap triggers, companion/familiar/cohort handling,
Sneak Attack conditions, feats/equipment, temporary effects and crafting remain
on source reference cards. No new global combat stat variables are invented.

The source audit retains manual modifications and the Sky Pirate schedule note:
Sailor’s Step body grants at11 but consumes the12 talent slot. This sheet follows
the body and withholds that12 trick/talent slot; the card discloses the timing
for GM reconciliation. Saboteur Ranged Setup similarly explicitly grants at11
and consumes12. Exact event replacements preserve earlier unaffected choices.
Festivalist removes the ordinary Sneak Attack card at1 and acquires its alternate
progression at2. Merchant conservatively hides talent options mentioning sneak
attack, because its source prohibits talents enhancing that ability; exceptions
require manual source review.

Each main/support/archetype page retains its source URL and archive SHA256.
Raw archived Markdown stays outside application commits. Regenerate with:

```sh
python3 scripts/imports/thief-family.py /absolute/archive/pages
```

Seven source/contract regression tests pass in
`tests/thief-family-source.test.mjs`, including exact Agent slots, optional
Knife Master alternatives, class chassis, Spellthief MP, native choice tracks
and Festivalist acquisition. Whole-family create/level-up/save/reopen integration
is validated by the parent batch and must not be inferred from source tests.

Six additional runtime adversarial tests pass in
`tests/thief-family-runtime.test.mjs`: native level/prerequisite gating, legal
saved-choice edit and level-up forgery rejection, unaffected Agent talent
preservation, Spellthief INT-based MP/manual spell rows/no spell-learning step,
spent Deadly Courtesan performance uses, and Sky Pirate future-slot handling.
These checks caught and corrected an extractor ambiguity: the class noun in
“the time bandit must…” is not a prerequisite for the separately named Time
Bandit talent. Named Time After Time prerequisites remain enforced.
