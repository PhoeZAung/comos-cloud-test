# Au Ra standard Xaela creation

Source: https://finalfantasyd20.com/races/base-races/au-ra/
Archived HTML SHA-256: `7af3d91c4259eee74690ed3d2a9b070fa2cf6a0f062e4ab9dcd21f1636419396`.

The source explicitly uses Xaela as the default; no invented mandatory clan choice is needed. Standard traits map +2 Strength, +2 Wisdom, −2 Charisma, Medium humanoid/au-ra identity, land speed 30, Common/Draconic, darkvision 60 feet and +2 Intimidate/Survival. Optional high-Intelligence languages use six source choices: Elvaan, Galkan, Goblin, Kojin, Matanga and Orc, bounded by the positive Intelligence modifier.

Scales contributes +1 natural armor to the existing natural-armor field. Its contribution is tracked separately: repeated recompilation does not accumulate it, manual adjustments survive, and disabling/restoring Scales removes/adds only its owned +1. It affects normal and flat-footed AC, not touch AC. No temporary resistance or global save bonus is inferred.

Ferocity has a one-use daily counter with manual reset and preserved expenditure. Its below-zero-HP trigger, disabled action restrictions, one-round duration and unconscious/dying transition remain manual. Spending the counter does not prevent death, heal HP or change conditions. Ice/lightning/fire resistance 5 and fear-only +2 saves also remain manual. Raen and other variant heritages, alternate traits and favored rewards await separate batches; independent full review is pending. Class progression retains each adapter's existing limits.

Validation: all 360 tests and the cloud build pass. Three regressions cover seven class adapters, natural-armor contribution/removal cycles and AC types, spent counter/rest/card restoration, conditional-defense boundaries, source languages and variant guards. Phone-sized Chromium fixtures created, edited, saved and reopened Dancer/Bard builds with Kojin, preserved a manual natural-armor adjustment and spent Ferocity, and reported no page errors. See `au-ra-browser-validation.json`. Authentication was a local fixture, not production provider login.
