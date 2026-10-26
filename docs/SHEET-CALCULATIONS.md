# Ability, spell and fixed-skill calculations

## Calculation boundary

This update adds the sheet-level arithmetic supported by saved records and explicit formula fields. It does not interpret arbitrary rule prose or regenerate all race/class/archetype/feat mechanics. Class-derived base HP/MP, the bonus-MP table, progression tables, replacement features, conditional stacking, spell failure, critical confirmation/multiplication and GM adjudication remain separate rules-adapter work. Existing base values and source metadata are preserved. Existing legacy Rest behavior remains unchanged except that explicitly configured ability-use formulas now supply the refill maximum.

Official checks used https://finalfantasyd20.com/magic/mp-system/ , https://finalfantasyd20.com/magic/ and https://finalfantasyd20.com/classes/core-classes/black-mage/ . The old Mount Aetheria source supplies the selected attack-mode mapping and the 46 predefined skill slots.

## Spells

- Save DC = 10 + spell level + selected casting ability modifier + explicit DC adjustment. The per-spell casting ability falls back to the sheet's configured spell ability.
- MP cost = spell level + explicit MP adjustment, floored at zero. This follows standard spell-level MP cost; exceptional reductions/increases must be entered explicitly.
- Cast spends MP through a revision-checked transaction. Temporary MP is consumed before base MP. Insufficient MP, a known casting score below 10 + spell level, or a spell/cost above the configured maximum spell level is rejected. Unknown maximums are not invented. Cost spending and rolling are separate labeled actions, so rolling damage or an attack does not double-charge MP.
- Caster level comes from an explicit override, an exact source-class match, or the only class on a single-class sheet. It is not assumed to be total level for an ambiguous multiclass caster. An empty override restores source inference.
- Concentration = caster level + casting modifier. Caster-level checks use caster level. These roll controls appear when caster level is known.
- Close/Medium/Long range computes 25 + 5 per two caster levels, 100 + 10 per caster level, or 400 + 40 per caster level. Other ranges and durations retain their saved text.
- Melee/ranged/touch/ranged-touch/CMB use the corresponding sheet attack bonus plus the entry's explicit attack adjustment. Unsupported/no attack types do not silently create attack rolls.

## Abilities, passives, racial features and feats

Expanded entries show their configured attack and damage calculations. Optional save-DC and maximum-use formulas accept numbers, parentheses, +, -, *, /, and numeric placeholders. {STR}, {DEX}, {CON}, {INT}, {WIS}, {CHA} are modifiers, not scores; {LEVEL} is total character level; {CL} is the known source/caster level. Fractional arithmetic results round down. Missing inputs are flagged, not substituted with fabricated values.

Examples: `10 + {LEVEL}/2 + {INT}` for a specifically agreed DC, or `{INT} + {CL}/2` for a specifically agreed use maximum. These formulas are not assigned automatically to unrelated abilities. Active-ability Use spends one remaining use on the server; zero uses is rejected. Rest respects each entry's rest preference and configured maximum.

Damage supports bounded explicit dice and typed segments such as `2d6 fire + 1d4 cold + 3`, `{CL}d6 + {INT}` and `({CL}/2)d6`. Dice count expressions resolve before rolling. Damage expressions are not a general prose or JavaScript engine. Maximum 16 terms, 50 dice total and 1,000 sides; invalid/excessive expressions fail before rolls are generated. Arithmetic uses a hand-written parser, never eval. Typed subtotals accompany server roll results and continue through the existing Discord relay workflow. Existing roll idempotency/rate limits remain.

## Skills and category layout

The extra Active/Passive/Racial/Feats button row is replaced by one native category selector with counts. Only the selected category renders/searches. Open entries use the full card width for readable math.

Skills has no Add/Delete controls. The old sheet's 46 predefined slots are supplied for empty/new sheets; existing names, specializations, ranks and unknown source fields are preserved. Missing standard slots are appended deterministically, avoiding index changes to existing rows. Craft, Perform and Profession retain three specialization slots each. Imported extra rows are preserved rather than deleted.

Only rank, misc, class-skill and specialization fields can be edited through the skill endpoint. Name/stat changes, add/remove operations and invalid ranks are rejected. Rank maximum is character level. Skill totals remain ability modifier + ranks + misc + 3 when a ranked class skill. Automatic class/racial/equipment bonus discovery, trained-only situational rulings and class skill-point budgeting are not inferred by this update.

## Verification

125 tests pass. New tests cover modifiers vs scores, multiclass caster ambiguity, source overrides, DC/use formulas, arithmetic safety and flooring, typed dice bounds, fixed skills and metadata preservation, cast/use spending, temporary-MP priority, insufficient resources, stale cast rejection through HTTP, and the category selector. Existing saved records were checked locally: all 20 characters and 654 spell/ability/feat entries render with these helpers. No saved private data was published.

Synthetic browser QA checked category selection, expanded spell DC 16 with INT 18 and spell level 2, 40ft Close range at caster level 6, damage resolving to 6d6 + 4, concentration +10, casting reducing 12 MP to 10, and the fixed skill list. The final ability card layout has no horizontal page overflow at 390px. Real Discord receipt and actual Owlbear room integration remain unverified as previously documented.

Phone checks: refresh → sword → Abilities → choose a category → expand an entry. Edit a specific formula and verify its result changes with the relevant score/level. Open Spells, expand a known spell and inspect DC/cost/range; Cast on a test character and confirm MP changes once. Roll attack/damage separately. Open Skills and confirm the standard list, editable ranks/misc, and absence of Add/Delete controls.
