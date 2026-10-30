# Mithra standard-trait creation

Source: https://finalfantasyd20.com/races/core-races/mithra/
Archived HTML SHA-256: `974e77d66d29c199bbf7efa3142bfd492809ddffdbc3d55d30fb5bfcf661b360`, matching the import catalog.

Standard Mithra map +2 Dexterity, +2 Charisma, −2 Wisdom, Medium humanoid/mithra identity, 30-foot land speed, Common/Mithran, low-light vision and Natural Hunter's +2 Perception/Stealth/Survival. Optional high-Intelligence languages use the source's six choices: Elvaan, Lupin, Goblin, Lalafellan, Orc and Vieran, bounded by the positive Intelligence modifier.

Fleet-Footed grants a separate manual Run feat card and +2 initiative. The compiler tracks its initiative contribution so repeated saves do not accumulate it, manual initiative remains intact and disabling the trait removes only its own +2. Cat's Luck has a one-use daily counter with manual reset; spending it does not roll or resolve a save. Its source rule still requires deciding before the Reflex save.

Lesser Defensive Training against yagudo, trip-only CMD, falling rules and Sprinter's charge/run/withdraw speed bonus remain manual. They do not become permanent AC, general CMD or base speed. Variants, alternates, favored rewards and independent full review remain guarded/pending. Class progression is still subject to each class adapter's own boundaries.

All 334 tests and the cloud build pass. Three Mithra regressions exercise all six class compilers, racial/class skill bonus combinations, initiative override/removal cycles, counter expenditure, restoring the card, optional language choices and guards. A 390 × 844 Chromium fixture created, edited, saved and reopened Dancer and Bard builds, retained Lupin, manual initiative and spent Cat's Luck, and saw no page errors. Evidence: `mithra-browser-validation.json`. Authentication was a local fixture, not production provider login.

Published in PR #13, merge `6cc833a8d63b9a95b10a28ef91215af501d73541`. Branch CI 41081977101 and main CI 41082225330 passed. Seven public runtime assets match the checked build and health is ready. See `mithra-deployment-validation.json`.
