# Monk family: local level 1–20 sheet support

October 31, 2026. This batch is local and unpublished. It expands the previously
published first-level Monk baseline; enabling a local manifest entry does not
mean the expansion is deployed or fully reviewed.

## Source-backed scope

Monk and all 20 archived archetypes: Diminutive Adept, Elemental Fist Disciple,
Featherweight, Fist of Rhalgr, Heavyweight, Ironskin Monk, Ki Master, Life Monk,
Master of Many Styles, Meowfist, Monk of the Wild, Nimble Guardian, Peacekeeper,
Scaled Fist, Streak, Student of the Stone, Treetop Monk, Wanderer, Weapon Adept
and White Monk. Every definition retains its actual source URL and raw Markdown archive hash.
The parent also retains catalogSha256 separately for the older source inventory
hash; the two hashes describe different provenance and are not substituted.

The parent has all 20 actual BAB/save rows, 25 canonical feature cards,
23 source-table SET upgrades, 38 Monk Talents and 13 Blitz Techniques.
Talents occur at even levels 2–20; selected blitz techniques at 3/6/9/12/15/18.
Chakra is granted automatically with Ki Pool at 2, not a free extra selected
technique. The eight previously shipped first-level feature IDs and source
unarmed damage table remain stable. Improved Unarmed Strike is granted by
Martial Arts; Weapon Adept replaces that parent feature.

Exact partial replacement lists preserve unaffected choices. White Monk and
Fist of Rhalgr replace talents at 4/8/12/16/20; Master of Many Styles replaces
2/6/10/14/18. Featherweight replaces selected blitz slots 3/9/15 and keeps
6/12/18. Other single-slot replacements are declared by exact parent event ID.
A new ability can acquire later than the feature it replaces; the removed
feature is suppressed from its own original acquisition level.

Profiles reuse existing fields. Featherweight and Fist of Rhalgr use d10.
White Monk Healer Training explicitly uses d8 and three-quarter BAB, with the
source 20-row MP progression (2 through 79) and spell levels 1 through 6.
White Monk bonus MP uses Wisdom; learning and casting spells are manual via
existing spell rows. No caster-level formula is claimed where not explicit.
Source class-skill swaps are represented for Life Monk, White Monk, Monk of
the Wild, Peacekeeper, Treetop Monk and Wanderer.

Resources use existing counters: Monk Ki Pool, Boost and Formless Strikes;
source Wisdom-keyed Ki Pool variants; Life Monk/Elemental Fist Disciple's
superior Ki Pool; Monk of the Wild rage rounds; Fist of Rhalgr combo capacity.
Bodybuilding HP applies only when its exact parent feature remains. Scaled
Fist's optional Charisma substitutions remain manual, retaining the legal
Constitution-based default rather than forcing a new permanent stat choice.
Spent uses and resource refresh conditions follow the shared adapter contract.

## Choices, requirements and manual limits

Ki Master has 41 native Ki Technique candidates. Fist of Rhalgr has 18 Combo
Finisher candidates, source combo-cost level gates, two starting selections,
and one additional selection at every later odd level. Its seven new blitz
options supplement the permitted base list; the seven explicitly excluded
base options are unavailable. Elemental Fist Disciple has the exact nine
Fistskill entitlements plus Monk/Sword Saint talent alternatives. Repeatable
Monk talents carry rankMinimumLevels for their explicit rank schedules.

Monk of the Wild rage powers and tiered martial arts styles, Elemental Fist
Disciple fistskills, cross-class Sword Saint talents, and Master of Many Styles
bonus feats use explicit manual named selections and source cards. Record the
exact chosen names/effects in existing ability/feat entries. Dynamic choices
such as Style Flexibility, Practiced/Perfected Skill, combo preparation and
feat substitutions remain manual. Do not describe these as automatically
verified external rules or as implemented battle actions.

All armor/load conditions, AC/CMD modifiers, attacks, martial damage, movement,
healing, temporary effects, spells, style/feat/equipment subchoices and external
prerequisites remain reference/manual mechanics. Straightforward level, prior
recorded option and retained class-feature prerequisites are declarative data.
Unmodeled prerequisites and timing must be checked before selection/play.

Race restrictions are preserved: Diminutive Adept Small size; Meowfist Palico;
Nimble Guardian Mithra or Ronso; Scaled Fist Gria; Streak Moomba; Student of the
Stone Dwarf; Treetop Monk Viera. Race-specific unsupported choices/guards are
not implemented or relaxed by this class batch. Class-only fixture tests do
not certify real signed-in creation for those races.

## Validation and regeneration

Seven dedicated tests pass, covering all 21 data contracts, stable IDs,
exact replacement schedules, native options/resources/race requirements,
White Monk d8/three-quarter BAB/MP and source provenance. Compiled regressions
check Wisdom-keyed Ki Pool with unequal Constitution/Wisdom, retained spent
uses through level four, Bodybuilding HP, Weapon Adept feat removal and White
Monk HP/BAB/MP. The generator output is idempotent. The full integrated family
progression, save-route and browser checks are recorded by the parent batch;
these focused tests alone do not claim that broader verification.

Run with Node 24:

```sh
python3 scripts/imports/monk-family.py /absolute/archive/pages
node --test tests/monk-family-source.test.mjs
```

The raw archive remains outside application commits. Application builds use
committed definitions. monk-family-audit.json records unresolved extraction
wording (currently no unmatched replacement statements); empty extraction audit
is not an independent full rules review. Keep the definitions needs_review and
partial_manual. Publish only after the user's explicit publish request, final
integrated tests/build and reconciliation with the separate race chat.
