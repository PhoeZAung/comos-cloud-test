# Race Wizard remaining-choice patches (2026-10-31)

Scope: **Wizard setup** of requested race choices, not a blanket approval of each race's entire extracted rules. Keep `rules/staging/races/` as immutable source evidence; implement narrowly in runtime adapters, verify choice effects, conflicts, save/reopen, and prevent invalid/inactive selections. Do not bypass independent `needs_review` blockers merely because a control has been added.

## UI placement rule

Any racial trait that asks the player to **choose an ability score** belongs in **Ability Scores** after race/class selection. The Race page still explains the racial trait and hosts other racial choices. Bonuses must flow into effective scores, previews, skill/MP calculations and the compiled sheet; changing race/trait must invalidate obsolete choices. All language selections stay in the Ability Scores language area.

## Small sequential patches

| Patch | Contents | Status / dependency |
| --- | --- | --- |
| 01 · Ability-score selections | Move **Hume** +2 and **Immortal** +2 choices from Race to Ability Scores. Add **Mutant** +2 physical, +2 mental and −2 any ability controls/effects. | Implemented in this branch; **Mutant still cannot be saved** until its separate random progression is supported. Existing Hume restrictions stay. |
| 02 · Language audit | **Genome** (user also wrote Gnome), **Gria**, **Guado**, **Hypello**, **Mandragora**, **Palico**, **Kindred** starting/bonus language choices, including correct Intelligence limits and Palico/Kindred mandatory picks. | Already implemented in merged PR #55; regression audit only. **Genome**, not a separate Gnome, is the extracted official race. |
| 03A · Skill and background picks | **Orc** Skill Bonus; **Matanga** Academic; **Loporrit** Handy. | Implemented in PR for Patch 03A; chosen skill effects, validation, and compiled sheet covered by tests. |\n| 03B · Proficiency and level-based picks | **Gria** Martial Background; **Namazu** Focused Study. | Pending independent patch: Gria weapon must be proficient; Namazu grants separate Skill Focus choices at levels 1/8/16 and has unresolved partial replacement source mapping. |
| 04 · Skill and technology picks B | **Nu Mou** Sagacious Wizard; **PuPu** Technological Savant. | Queue; verify target class spell/skill and technology rules; do not grant unspecified general bonuses. |
| 05 · Elemental and terrain | **Guado**, **Viera** and **Ixal** Elemental Summoner; **Lamia** Bond to the Land; **Trollkin** Acid or Fire / healing interaction. | Queue; avoid falsely granting every element or every terrain. Trollkin source heading and healing-suppression details conflict; keep this discrepancy visible pending adjudication. |
| 06 · Yagudo choices | **Yagudo** Valiant Linguist (language choices tied to Linguistics ranks) and Zealot Devotee (source-based level/rank scaling). | Queue; dynamic chooser/validation and scaling. |
| 07 · Magic choices | **Kindred** Fiendish Magery; **Sylph** Fey Magic. | Queue; class-restricted magic and tracked daily/weekly uses. |
| 08 · Alternate replacements | **Tarutaru** Explorer (source replacement of Talented/Magick Focus, verify exact IDs and preserved traits), and **Garlean** Xenophobia Extremis score/language modification. | Garlean partial modifier **already** source-guarded in main; audit its wizard interactions. Tarutaru needs verified replacement and choice behavior. |
| 09 · Shindroid simulations | **Shindroid** Hologram Simulation and Race Simulation. | Queue separately; whole/partial replacements, shape/type/size, incompatible alternates and cross-race effects. No silent borrowing of other races' unsupported mechanics. |
| 10 · Mutant variable systems | **Mutant** Variable Mutant Abilities (d100 result table and chained rolls), random/variable ability advancement, interaction with normal ability gains and Variable Defenses. | Queue; must not unblock Mutant saving until deterministic validation and progression are complete. |
| 11 · Half-Breed (**LAST**) | Two parent races, inherited trait eligibility and RP/slot limits, replacement conflicts, saved ancestry and level-up behavior. | Deliberately last. Keep creation guard enabled until all prerequisite parent/race choice adapters are stable. |

## Acceptance checks for every patch

- Racial ability-choice dropdowns on Ability Scores; non-score choices under Race or the relevant skill/spell step; no duplicate controls.
- Explicit selections, correct amounts/targets, required counts and exclusions; no guessed default or all-options benefit.
- Trait replacements only remove the official replaced parts, preserve unrelated components and refuse incompatible combinations.
- Saved wizard state and compiled sheet agree, including after race swaps, edits and level ups when supported.
- Dedicated tests plus complete `npm test` and `npm run build:cloud` before each merge. New UI coverage is **not** by itself proof that a race is fully playable or Railway has deployed.

## Notes on names

The user supplied “gira” (Gria), “hyperllo” (Hypello), “kindried” (Kindred), “marital background” (Martial Background), “mantanga” (Matanga), “yaugudo” (Yagudo), “pupu” (PuPu), “namazy” (Namazu), and “shuindriod” (Shindroid). Verify precise source trait IDs before each implementation rather than create new race records.
