# Al Bhed, Syricta, Half-Breed: bounded FFd20 racial rule review

Official references, verified October 31, 2026:
- [Al Bhed](https://finalfantasyd20.com/races/base-races/al-bhed/)
- [Syricta](https://finalfantasyd20.com/races/monstrous-races/syricta/)
- [Half-Breed](https://finalfantasyd20.com/races/core-races/half-breed/)

Extracted source JSON remains unmodified. This is a source-verified runtime reconciliation of **specific** feature behavior, not full 63-race sign-off.

## Al Bhed: Xenophobic

- The official alternate replaces Languages, but the existing extracted feature's one automatic identity effect contains **both** Common and Albhedian. Runtime rewrites that identity component to *Albhedian* alone and drops the high-Intelligence language choice pool. Keeping the original unmodified Languages feature would incorrectly grant Common/bonus languages; deleting the original outright would incorrectly grant no starting language.
- A legal Al Bhed can still learn languages normally, except Xenophobic permits one new language **per two Linguistics ranks**. This changing rank/language relationship remains a manual reference, not free languages from INT.
- The +1 against mind-affecting effects **except fear** is a conditional manual rule, not an always-on saving throw bonus.
- Existing Mechanical Genius required skill/rank, starting weapon choices, and level-one-only restrictions persist. Al Bhed Magic Resistant has an existing structurally correct whole-trait replacement but its dynamic SR remains manual; this PR does not claim that as automatic.

## Syricta: exact required choices and two alternatives

- Standard Syricta must choose one among **earth, fire, ice, lightning, water, wind** for resistance 5, and one breath-weapon shape (**15-foot cone or 20-foot line**). No defaults invented. Choices are persisted in the standard wizard; invalid or absent picks fail validation and existing saved character picks are creation-locked.
- These picks remain manual effect notes: don't invent a resistance field, damage calculation, 3/day tracker or automatic saving throw DC without a verified rules adapter.
- Normal flight: **40 ft (poor)**. Wing-Clipped flight: **20 ft (clumsy)**, DC 30 Fly check to ascend. **Land speed stays 20 ft.** The usual racial **-2 DEX penalty is removed**, while +2 STR and +2 CHA remain. Wing-Clipped gives +2 racial bonuses to **Bluff, Climb, and Diplomacy**, projected as named skill bonuses exactly once.
- Neglected Heritage removes **Draconic** from starting languages but preserves **Common**. Its +1 Diplomacy applies only on requests/gathering information, so remains a manual conditional rule (never a universal +1).
- Both reviewed alternates may coexist because they modify distinct original traits. Dragon Type, Evasive Maneuvers (source flight maneuverability contradiction) and Memories of the Forgotten (two independent Knowledge picks plus removal of flight only) remain blocked.
- Fly speed and maneuverability are seeded only if missing, preserve manual saved values including zero, and display appropriate racial rules.

## Half-Breed: Ancestral Arms slot selector, but not yet an available complete race

- The current official page permits the Ancestral Arms feat to consume **either** the inherited Feat-and-Skill trait slot **or** the inherited Offense trait slot. It must never consume both.
- The extracted source lists both as removal targets, so the runtime constructs two strict *candidate* one-slot replacements and selects exactly one based on a required wizard choice. The unsafe original two-slot operation is explicitly rejected. The actual Martial/Exotic Weapon Proficiency and selected weapon still need verified feat/weapon choices; **nothing is granted automatically**.
- All Half-Breed creation/save remains blocked with the server's existing parent-race/inherited-trait error, even after choosing the slot. This is intentional: verified parents, parent movement/type/size/language, RP-ranked inherited trait data, banned combinations and favored class/archetype compatibility are missing. No loophole permits a partially defined Half-Breed to be saved.

## CI and safety

- Exact source operation ID, original scope/resolution/targets/adds are matched before runtime reinterpretation; allowlist guards expected base identity/speed/score effects. Unexpected source edits stay blocked.
- Tests: `tests/al-bhed-syricta-half-breed-partials.test.mjs` and old Syricta extraction assertions.
- Draft PR only. Full Node 24 CI and cloud build must pass on exact head before recommending publication. Signing in and exercising deployed create/save/reopen is outside this draft's checks. Existing other draft PRs will require reconciliation before merging.
