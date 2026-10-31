# Race Wizard remaining-choice patches (2026-10-31)

Scope: **Wizard setup** of requested race choices, not a blanket approval of each race's entire extracted rules. Keep `rules/staging/races/` as immutable source evidence; implement narrowly in runtime adapters, verify choice effects, conflicts, save/reopen, and prevent invalid/inactive selections. Do not bypass independent `needs_review` blockers merely because a control has been added.

## UI placement rule

Any racial trait that asks the player to **choose an ability score** belongs in **Ability Scores** after race/class selection. The Race page still explains the racial trait and hosts other racial choices. Bonuses must flow into effective scores, previews, skill/MP calculations and the compiled sheet; changing race/trait must invalidate obsolete choices. All language selections stay in the Ability Scores language area.

## Small sequential patches

| Patch | Contents | Status / dependency |
| --- | --- | --- |
| 01 · Ability-score selections | Move **Hume** +2 and **Immortal** +2 choices from Race to Ability Scores. Add **Mutant** +2 physical, +2 mental and −2 any ability controls/effects. | Implemented in this branch; **Mutant still cannot be saved** until its separate random progression is supported. Existing Hume restrictions stay. |
| 02 · Language audit | **Genome** (user also wrote Gnome), **Gria**, **Guado**, **Hypello**, **Mandragora**, **Palico**, **Kindred** starting/bonus language choices, including correct Intelligence limits and Palico/Kindred mandatory picks. | Already implemented in merged PR #55; regression audit only. **Genome**, not a separate Gnome, is the extracted official race. |
| 03A · Skill and background picks | **Orc** Skill Bonus; **Matanga** Academic; **Loporrit** Handy. | Implemented in PR for Patch 03A; chosen skill effects, validation, and compiled sheet covered by tests. |\n| 03B · Proficiency and level-based picks | **Gria** Martial Background; **Namazu** Focused Study. | Implemented in Patch 03B: Gria's three source-verified racial proficiency options (class-derived additional weapons not yet enumerated), plus Focused Study choices at 1/8/16 with whole-trait replacement and separately tracked feat cards. |
| 04 · Skill and technology picks B | **Nu Mou** Sagacious (two Knowledge skills); **PuPu** Technological Savant (one Knowledge skill plus Repair). | Implemented in Patch 04 with explicit options, skill projection, inactive-choice pruning and creation-time lock. Other distinct race features are not automatically completed by this patch. |
| 05A · Elemental and terrain choices | **Guado**, **Viera**, **Ixal** Elemental Summoner; **Ixal** Bond to the Ice; **Lamia** Bond to the Land and Tempered. | Implemented in Patch 05A with mandatory source-enumerated selectors, manual conditional effect cards, permanent creation picks, and replacement-safe pruning. |
| 05B · Trollkin healing ambiguity | **Trollkin** Acid or Fire weakness and Faster Healing. | Implemented safety/UI handling: prominent contradictory source notice, sheet descriptions for Fast Healing 1 / 2 and suppression, no fabricated selection or automatic HP ticks. Element adjudication still needs GM/source clarification. |
| 06 · Yagudo rank-based choices | **Yagudo** Valiant Linguist (two chosen languages per Linguistics rank) and Zealot Devotee (+2 Religion plus +1 per five ranks). | Implemented in Patch 06, with dynamic Skills-step language picks at creation and level-up, persistent locks, scaling skill bonuses and exact alternate replacement semantics. |
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

## Patch 03B verification notes

- The Gria official rule grants Weapon Focus for any proficient weapon. The current safe dropdown offers only the **racially guaranteed** Knight sword, Longbow and Composite longbow, with Weapon Familiarity active. Other class- or equipment-granted proficiencies require a normalized, validated weapon catalog before widening the options. Do not pretend the limited list is exhaustive.
- Namazu Focused Study explicitly replaces **both** Festive Culture and Skilled Traders in the official full rule. The staged source operation calls it an unresolved partial replacement; the runtime resolver source-guards a whole-feature replacement while leaving the original extracted record unchanged.
- Skill Focus choices are separate: one required at level 1, another at level 8 and another at level 16, with distinct skill targets, creation/per-level validation and locked earlier selections. Bonuses remain on manually adjudicated feat cards; no global unconditional skill bonus is invented.
- Source pages: https://finalfantasyd20.com/races/base-races/gria/ and https://finalfantasyd20.com/races/beastman-tribes/namazu/

## Patch 04: Nu Mou and PuPu

- **Nu Mou Sagacious** is the source trait name (the request said “Sagacious Wizard”); it requires exactly two distinct Knowledge skills. Each grants a +2 racial check bonus and becomes a class skill. The official extracted pool has no enumerated options: the wizard derives only the actual Knowledge rows from `fixedSkills`. Integrated, Lorespeaker, Magic Resistant and Sociable replace Sagacious; the selection is not active if it is removed.
- **PuPu Technological Savant** chooses either Knowledge (Technology) or Knowledge (Engineering) for +2 racial checks. Repair +2 is a **separate unconditional effect already in the official staged trait** and must not be double-counted or lost. PuPu Ace Pilot and Hiso heritage can replace Technological Savant.
- Racial choices are stored and locked after creation, validated, shown on Race (not Ability Scores), and projected into the character sheet. The source staging JSON remains unchanged.
- Other source work is outside this patch: Nu Mou **Adept** independently requires three distinct 0-level black mage spells, and PuPu's exact alien subtype, Hiso inheritance and other manual/conditional rules still require review. Supporting these two selections does **not** certify all Nu Mou/PuPu rules as complete.

Sources: https://finalfantasyd20.com/races/base-races/nu-mou/ and https://finalfantasyd20.com/races/base-races/pupu/

## Patch 05A: verified elemental and terrain choices

- Guado, Viera and Ixal each choose exactly one of the six staged summoner subtypes **Earth, Fire, Ice, Lightning, Water, Wind**. Matching summoning spells last **two extra rounds**; benefits remain manual because summoning subtype and spell duration depend on the actual cast. No blanket caster level or duration increase.
- Ixal chooses **Forested or Icy** for Bond to the Ice: **+2 dodge AC only in that terrain**. It is not an unconditional sheet AC bonus.
- Lamia chooses **Desert or Water** for Bond to the Land: **+2 dodge AC only there**. Alternate Tempered chooses **Water or Wind resistance 5**, not both.
- These selections belong on the Race wizard step, not the Ability Scores step. The source data and trait replacement rules remain unchanged. An inactive/replaced racial option cannot persist or contribute effects; choices are permanent after first save.
- Viera alternate **Mist Sight** remains independently unsupported: it needs a one-of-three spell-like ability selection and 3/day counter. This patch does not imply completion of that feature or of unrelated race powers.
- Trollkin **Acid or Fire** does not actually offer a choice in the source: the heading conflicts with the detailed rule (fire or earth). It remains manual pending Patch 05B.

Sources: https://finalfantasyd20.com/races/base-races/guado/ ; https://finalfantasyd20.com/races/base-races/viera/ ; https://finalfantasyd20.com/races/beastman-tribes/ixal/ ; https://finalfantasyd20.com/races/beastman-tribes/lamia/ ; https://finalfantasyd20.com/races/beastman-tribes/trollkin/

## Patch 05B: Trollkin source conflict and manual healing

This is **not** a selectable element. The extracted official trait is titled “Acid or Fire”, but the detail says fire or earth damage suppresses Trollkin Fast Healing for one minute. The two source statements conflict; the wizard cannot determine whether acid or earth is intended. A clear notice is shown for Trollkin in the Race wizard, and a manual card is shown on the saved sheet. Do not create a fake two-option dropdown.

- Standard Fast Healing is **1 HP/round**, does not apply to starvation, thirst, suffocation or lost limbs, and works below 0 HP until death.
- The existing source-checked Faster Healing alternate replaces **both Fast Healing 1 and Thick Skin**, granting **2 HP/round**, not 1+2. No automatic HP recovery or suppression is applied.
- Source adjudication remains a GM decision; this patch cannot claim the conflicting trigger is resolved.
- Canonical staged JSON remains unchanged. Regression tests validate source warning, replacement and zero automatic healing targets.

Official source: https://finalfantasyd20.com/races/beastman-tribes/trollkin/

## Patch 06: Yagudo Valiant Linguist and Zealot Devotee

The original extraction (not changed) lists **Valiant Linguist** as +4 Linguistics and two chosen languages **per Linguistics rank**. The staged trait has no canonical choice pool, so runtime builds a dedicated free-text `ffd20:race:yagudo:pool:valiant-linguist-rank-languages` selector, shown in the **Skills** wizard step after assigning ranks. A rank grants up to two choices, not random language grants. Yagudo already starts with Common and Yagudo, which cannot be selected again. Selected rank languages can be **appended** when a saved character gains additional Linguistics ranks (or fills unselected earned slots) but earlier selections cannot be edited or removed. The existing general high-Intelligence language eligibility is separate and is not counted as a rank entitlement. A user can pick any otherwise legal game language; GM restrictions still apply.

**Zealot Devotee** already has its static +2 Knowledge (Religion) race effect. Patch 06 adds `floor(Knowledge (Religion) ranks/5)` as an **additional** automatic racial bonus, reaching +3 total at 5 ranks, +4 at 10, +5 at 15, +6 at 20. It is **not** based on character level or ability modifier.

The source-defined alternates **Magical Linguist** and **Stability** replace only Valiant Linguist; **Sturdy Feathers** replaces both Valiant Linguist and Zealot Devotee. The language picker and scaling effect are active only when the corresponding standard trait remains. Source staging JSON stays untouched. This patch does not automatically adjudicate the Magical Linguist spell-like abilities/descriptor restrictions or individual GM language restrictions.

Official source: https://finalfantasyd20.com/races/beastman-tribes/yagudo/
