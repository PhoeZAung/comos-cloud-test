# Three-race speed component audit: Moomba, Namazu, Seto Lion

Official rules checked against:
- https://finalfantasyd20.com/races/base-races/moomba/
- https://finalfantasyd20.com/races/beastman-tribes/namazu/
- https://finalfantasyd20.com/races/base-races/seto-lion/

The extracted source definitions in `rules/staging/races/` remain unchanged, including their blocking/needs-review records. This is a bounded **runtime reconciliation**, not full race sign-off.

## Moomba — Climb

- Default: land speed 40 ft; no climb movement mode.
- Climb alternate: **land speed 30 ft; climb speed 20 ft; +8 racial Climb bonus** from climb movement. The source names **no replaced whole trait**, so this is a narrowly checked Base Speed **component modification**, adding Climb without deleting Base Speed.
- Other racial traits, especially Broken Language/Vocal Failure and natural weapons, remain as described and manually adjudicated as appropriate. Speech and vocal spell requirements are not automatically waived.
- Create/edit save/reopen preserves manually entered movement including explicit zero. The +8 Climb bonus applies once; there are no bonus skill ranks.

## Namazu — Fast

- Default: 30 ft land **and** 30 ft swim. A swim speed does not grant water breathing.
- Fast replaces **Skilled Traders** entirely, adds +10 ft to land speed (40 ft) and **retains 30-ft swim speed**, via an exact Base Speed component modification rather than removing all movement modes. Festive Culture and Water Sense remain.
- **Focused Study is still blocked:** choosing the Skill Focus benefit independently at levels 1, 8, 16 requires a separate structured progression implementation. Do not invent a Skill Focus choice or make all skills proficient.

## Seto Lion — Faster and Nimble Attacks

- Detailed race rule states baseline **50-ft land speed** including +10 Fast and +10 Quadruped (the separate index/table conflicts). Use the detailed rules for this bounded implementation.
- Faster replaces Claws and increases 50→**60 ft** while keeping Fast, Bite and Quadruped.
- Nimble Attacks replaces Bite and Fast, grants Weapon Finesse **as a racial ability note**, and decreases 50→**40 ft**. It does not remove Claws or Quadruped. The external Weapon Finesse feat's combat calculation remains manual rather than inventing a permanent attack bonus.
- Both alternates together affect independent standard features; apply both modifiers once to get **50 ft**. Conflicting replacements (e.g. Nimble Attacks with Jumper, which both remove Bite) remain rejected. All movement values are editable and manual changes survive save/reopen.
- The Frost Wolf heritage, jaw-weapon equipment slots, quadruped carrying and other situational mechanics remain separate, guarded reviews.

## Safeguards and verification

- Existing `replacementFor` checks each exact source operation ID, scope, resolution, target array, added feature and empty extra components. Unknown source changes remain blocked.
- `isSupportedRaceOperation` only permits the four exact speed-modifier IDs and verifies the expected source baseline constant; other unresolved partial operations remain blocked.
- The race-trait engine permits exactly the two Seto Lion speed modifiers to coexist; other attempts to modify the same trait conflict as before.
- No new wizard page or general-purpose movement rewrite. No class/archetype logic change.
- Regression tests: `tests/three-race-movement-replacements.test.mjs`; full CI Node 24 tests and cloud build required. Real signed-in create/save/reopen still requires a separate check after explicit publishing.
- Draft PR only; **no merge, no deployment**.
