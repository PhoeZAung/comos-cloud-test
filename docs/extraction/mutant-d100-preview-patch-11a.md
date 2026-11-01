# Mutant d100 verified movement and combat preview — Patch 11A

Official FFd20 source: https://finalfantasyd20.com/races/base-races/mutant/ (Table: Variant Mutant Abilities).

This bounded patch does **not** enable Mutant saving. It leaves the staged source definition and independent `needs_review` findings unchanged.

| d100 | Official outcome | What Comos can verify now |
| --- | --- | --- |
| 19 | Swim speed 30 feet | Source-owned identity speed effect; initial movement field seeded only if missing, preserving explicit user entries including zero. |
| 20 | +2 combat maneuver checks | Numeric preview **only**, not an owned saved-sheet CMB field. |
| 50 | +1 natural armor AC | Numeric preview **only**, not automatic saved-sheet AC or a substitute for Variable Defenses. |
| 80 | +2 CMD | Numeric preview **only**, not an owned saved-sheet CMD field. |

The d100 source row descriptions must still match the trusted strings before granting their projections. Repeated row 19 does not produce a fictional 60-foot swim speed. Repeated preview-only combat bonuses are not doubled because both rolls are occurrences of the same untyped source outcome and stacking has not been independently adjudicated.

These numbers only apply when the original *Variable Mutant Abilities* racial feature is active. The wizard labels the combat numbers preview-only and still displays every unmapped/conditional roll as manual; for example row 31 grants terrain-limited burrowing, so it is **not** converted into a universal burrow speed. No other race inherits these projections.

Remaining blockers: first-level Blue Mage spell selection and once-daily use; source-complete d100 effect mapping; damage resistance and all saved-sheet AC/CMB/CMD ownership; random advancement from level 2–20 under real persistence; alternate replacements and full audit. Do not unblock the save guard or claim real signed-in QA from fixture tests. Execute complete CI tests and `build:cloud` on this branch before merging. No live production deployment is authorized by this draft.
