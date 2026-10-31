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
| 07 · Magic choices | **Kindred** Fiendish Magery; **Sylph** Fey Magic. | Implemented for verified Black Mage casting and standard Sylph spell-like abilities: casting-only Kindred INT +2, source-bound Sylph illusion spell DC +1, independent daily/weekly SLA counters. Other mage chassis and variant Sylph heritages remain separately guarded. |
| 08A · Garlean Xenophobia Extremis | Exact component modifier: +2 CON/+2 INT/−2 CHA instead of normal −2 WIS; keep Common, suppress INT bonus languages. | **Verified already implemented** in main, with new 08A audit tests, explicit Race-wizard guidance and preservation/reopen checks. No blanket trait replacement. |
| 08B · Tarutaru Explorer source conflict | Source grants +2 Climb and one chosen Knowledge skill but says replaces Talented and **Spell Focus**. Standard racial list has **Magick Focus**, not Spell Focus. | **Blocked pending source/GM adjudication.** Existing invalid-operation guard is preserved; named replacement is NOT silently changed. UI now explains why Explorer is unavailable. Knowledge selector is not enabled until both replaced traits can be verified. |
| 09 · Shindroid simulations | **Shindroid** Hologram Simulation and Race Simulation. | Source-verified full-target replacements. Hologram core uses +4 INT/−2 WIS, Diminutive construct (technological) and nonphysical core state; 30 ft hardlight body and programmed size remain explicitly manual. Race Simulation requires one playable humanoid, grants only its size and race-specific eligibility/aging notes, not all racial powers. Conflicts and save edits rejected. |
| 10A · Mutant roll provenance | 100-entry Variant Mutant Abilities and optional Alternative Physical Features d100 (extra-roll special cases), Variable Resistance d6, level-based Variable Stats/Defenses d6 cap histories. | **Implemented roll logging/validation and source-result review UI only.** Actual table-benefit application, full score/HP/MP/save/AC projection, Blue Mage selection and Mutant level-up remain pending in 10B. Save blocker intentionally preserved. |
| 10B · Mutant automated projection | Apply verified d100 outcomes, per-level +1 score/defense results, suppress standard every-four-level score boosts, persistence and level-up. | Pending; unblock saving only after complete source-validated sheet and level-up projection, including verification of race spell choice and variable resistance. |
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

## Patch 07: Kindred Fiendish Magery and Sylph Fey Magic

- **Kindred Fiendish Magery:** official source says treat Intelligence as **2 higher only for mage-class spells and features**. The Black Mage class is the currently verified INT caster: Black Mage preview bonus MP, starting learned spell allowance and owned spell DC now use this scoped +2; displayed INT, Intelligence checks, skill budgets and non-mage classes do not change. The existing Kindred alternates Maw or Claw and Smite Good replace the feature and remove its scoped benefit. Other potential mage chassis are not automatically adjusted without source verification.
- **Sylph Fey Magic:** +1 spell save DC for verified illusion-school Black Mage spells. Four separate reference abilities/counters represent **Hidden Presence 1/day** and **Charm, Lesser Confusion, Sleep 3/week each**, all at character-level caster level with CHA-based spell DC. Each shows its recharge period, has a persisted `u_max`/`u_curr` and explicitly opts out of long-rest refill; daily/weekly resets must be handled according to source timing. These are spell-like abilities, not regular learned spells or extra MP.
- The original racial traits and staged source JSON remain unchanged. Standard Sylph Fey Magic counters appear only while the standard trait is active. Fairy/Pixie/Sprite heritages carry unresolved ability-vector replacements and remain unavailable rather than combining their different SLA lists with standard Fey Magic.
- Remaining limitations: magic effects from other INT-mage class adapters, other class spellbooks and source-dependent manual spell-like ability DC adjudication require separate integration; do not apply this casting-only adjustment to skill points or every mage type indiscriminately.

Official sources: https://finalfantasyd20.com/races/beastman-tribes/kindred/ and https://finalfantasyd20.com/races/beastman-tribes/sylph/

## Patch 08A · Garlean Xenophobia Extremis audit

Official extracted Garlean source already has a reviewed component modifier, applied only when the Xenophobia Extremis alternate is explicitly selected:
- Base remains **+2 CON and +2 INT**.
- The standard **−2 WIS** component becomes **−2 CHA**, never an additional −2 penalty.
- **Common remains a starting language**, and **high-Intelligence bonus languages are disallowed**. Language learned normally from Linguistics is not taken away.
- All unrelated Garlean traits, including Magic Ineptitude, technical Craft, weapons and other standard racial rules, retain their original behavior. Inactive previously chosen high-INT language selections are invalid on save and pruned in the wizard.
- The Race wizard now clearly displays which rules apply when the alternate is selected. Tests verify saved/edited scores, language behavior, untouched traits and tamper-proof alternate permanence. This is a confirmation of the existing implementation, not a new interpretation of the source.

## Patch 08B · Tarutaru Explorer is pending

The official Tarutaru source says Explorer grants **+2 racial Climb** and **+2 on one Knowledge skill of the player's choice**, replacing **Talented and "spell focus"**. The Tarutaru standard trait list contains **Magick Focus** (+2 concentration when casting defensively), **not** a trait called Spell Focus. The staged extracted operation targets nonexistent `ffd20:race:tarutaru:trait:spell-focus` and has manual resolution. Comos will **not** silently rewrite this source target to `magick-focus`, remove unrelated benefits, or enable an incomplete Knowledge selector. The wizard explains the conflict and the existing guard blocks saving an ambiguous Explorer build until an authorized source/GM clarification resolves both exact replacement targets.

Official references: https://finalfantasyd20.com/races/base-races/garlean/ and https://finalfantasyd20.com/races/core-races/tarutaru/

## Patch 09 — Shindroid Hologram and Race Simulation

The original staged Shindroid operations were marked `partial_feature/unresolved`; this patch normalizes *only the two exact source-matched records* to whole replacements, without changing the source-extraction JSON.

- **Hologram Simulation** replaces **Composite Plating** and **Ability Score Racial Traits**. It replaces the standard +2 DEX/+2 INT/−2 CHA with **+4 INT/−2 WIS**; does not stack bonuses or retain +1 Composite Plating armor. A Shindroid hologram's natural core is **Diminutive, Construct (technological)**, and cannot take physical actions. Projecting a hardlight body takes a **full-round action**, remains active indefinitely even if incapacitated, can be deactivated with a **standard action** and ends automatically on death. The projected body can take physical actions, has two arms and **30 feet movement**. The source says projected size depends on programmed appearance, but does not specify a universal size or an authoritative default. Therefore **the sheet represents the natural core** (Diminutive Construct; zero physical speed), while the projected form and its size-dependent modifiers remain **manual**. No implicit permanent Medium hardlight body or automatic size/movement form-switch is invented.
- Hologram is **incompatible** with Shindroid alternate heritages, Integrated Weaponry and Race Simulation; other mutually exclusive alternates are prevented by overlapping replaced source traits.
- **Race Simulation** replaces **Immortal**, not the race's type, language, other power budget or entire racial record. On the Race wizard step the player must choose one verified **playable humanoid race**, sourced from the registered race Type and Size features. Shindroid remains the base race and also counts as the chosen race for race-specific feats, traits, spells and magic items. Adopt that race's **size category** and **aging rules**; the latter are described for GM adjudication (Comos does not automatically resolve age-category modifiers). The player's other Shindroid racial traits, score vector, class and languages remain unchanged. No borrowed special ability or class, no generic “copy race” action.
- The chosen race is a persisted, immutable creation-stage selection. Forged race IDs, missing choices, removed traits with stale selections and mutually exclusive Hologram combinations reject saves; the wizard prunes inactive selections.
- Known limitation: the hardlight-projection runtime currently has no reliable form toggle for different size, attack/defense modifiers, and projected movement. It is deliberately not misrepresented as automatic. The source does not give a universal hardlight body's programmed size.

Source: https://finalfantasyd20.com/races/base-races/shindroid/

## Patch 10A · Mutant dice provenance and review UI

- The existing three selected **racial score adjustments** remain on Ability Scores. Their separate, incomplete random progression cannot silently turn Mutant into a saveable character.
- A new source-bound roll history records the required **Variant Mutant Abilities 1d100**. First result **100** requires **two more non-100 outcome rolls**; subsequent result 100 is ignored and retried until the required outcome count is satisfied. Only corresponding outcomes from all 100 official extracted rows are displayed; no unknown effects are autogenerated.
- Optional **Alternative Physical Features d100** is tracked separately. A first **99** produces two more rolls, a first **100** produces three more rolls; further 99/100 rolls are ignored and retried. The optional appearance table never replaces the mandatory ability table.
- **Variable Resistance 1d6** maps exactly 1 Earth, 2 Fire, 3 Ice, 4 Lightning, 5 Water, 6 Wind, each **resistance 5**. If **Dual Minded** replaces Variable Resistance, recording any resistance roll is rejected.
- **Variable Stats** records one d6 at each level beyond 1: STR/DEX/CON/INT/WIS/CHA in that order. Each score is capped at **six +1 increments**, with logged rerolls required at caps. **Variable Defenses** instead uses 1 +3 HP, 2 +1 MP, 3 +1 Fort, 4 +1 Ref, 5 +1 Will, 6 +1 stackable AC, each outcome up to **five times**, with rerolls. Future-level rolls, non-die numbers, extra rolls after acceptance, forged results and malformed history are rejected.
- Mutants **do not** receive ordinary score boosts at levels 4, 8, 12, 16 and 20; the history validator rejects a nonempty standard `abilityIncreases` map for a Mutant.
- A Race-step wizard panel exposes source-result descriptions, additional-die requirements and buttons for generating/recording actual die throws (including GM-provided results). The new input survives local wizard draft saves; it is validated by `sanitizeBuild`. The published rules JSON is unchanged.
- **Safety boundary:** the existing Mutant character **save blocker remains** because source d100 abilities include heterogeneous and conditional mechanics; automated score/HP/MP/save/AC projection, Blue Mage SLA choice, initial selected resistance application, and source-accurate level-up flow are not complete. Patch 10B must cover these before enabling saved Mutant characters. Do not misrepresent a logged roll as a granted sheet effect.

Official source: https://finalfantasyd20.com/races/base-races/mutant/
