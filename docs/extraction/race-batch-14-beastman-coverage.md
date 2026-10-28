# COSMOS race extraction — Beastman Tribes batch 14

Official index: https://finalfantasyd20.com/races/beastman-tribes/

| Race | Standard | Alternates | Heritages | Favored options | Required choice pools |
|---|---:|---:|---:|---:|---:|
| Goblin | 13 | 6 | 2 | 7 | 0 |
| Ixal | 15 | 5 | 0 | 8 | 2 |
| Kindred | 11 | 5 | 0 | 9 | 2 |
| Kobold | 13 | 5 | 0 | 6 | 0 |

## Goblin
Source: https://finalfantasyd20.com/races/beastman-tribes/goblin/

- BLOCKING: Hobgoblinoid replaces the racial ability vector AND size; must not retain Small size bonuses after switching.
- BLOCKING: Pyromaniac does not specify a replacement trait. Its CHA-dependent spell-like abilities and spell damage scaling remain manual.
- BLOCKING: Scavenger source says master tinkerer rather than Master Tinker; verify alias mapping.
- BLOCKING: Moblin and Red Cap heritage score/skill replacement should not silently drop or retain Silver Tongued's special three-step Diplomacy rule.
- BLOCKING: Craftsman, Gobby Skill Bonus and Greedilox effects require situational Craft and appraisal context, not unconditional skill mapping.

## Ixal
Source: https://finalfantasyd20.com/races/beastman-tribes/ixal/

- BLOCKING: Bond to the Ice requires one forested/icy starting terrain selection not yet bound to race choice UI.
- BLOCKING: Elemental Summoner requires exactly one of six elemental subtypes and needs race choice UI; neither selection should be invented.
- BLOCKING: Three alternates share Bond to the Ice replacement and conflict; Wind affinity and Craftsman are conditional.
- BLOCKING: Fast adds +5 feet speed but applying this addend through current runtime is unverified.
- BLOCKING: If permanent terrain choice is unresolved, block automatic character saving even with an otherwise valid class.

## Kindred
Source: https://finalfantasyd20.com/races/beastman-tribes/kindred/

- BLOCKING: Starting language is Common plus exactly one of Abyssal/Infernal. Race-specific required choice UI is missing, so do not auto-grant both.
- BLOCKING: Maw or Claw requires precisely one of two natural weapon packages; the wizard cannot resolve this choice automatically.
- BLOCKING: Fiendish Magery increases effective INT for mage spells/features only; never auto-increase ability score INT globally.
- BLOCKING: Vestigial Wings does not grant independent flight, and conditional Fly bonus requires a different flight source.
- BLOCKING: Deeper darkness 1/day and resistances await full action and resource support.

## Kobold
Source: https://finalfantasyd20.com/races/beastman-tribes/kobold/

- BLOCKING: Land and burrow speeds are distinct (30 and 20 feet) and must not overwrite one another.
- BLOCKING: Mountain-Born calls replaced trait 'master tinkerer', apparently Master Tinker; requires terminology verification.
- BLOCKING: Reckless Work, Cave Dweller, Hatred and Unnatural are conditional, not permanent generic skill/combat bonuses.
- BLOCKING: Emissary 1/day roll-twice mechanic needs a proper resource/action to automate.
- BLOCKING: Warrior favored option grants choice of weapon proficiency and can be taken at most two times.


## Review state and build guard

Definitions are `needs_review` and `partial`. Only safe unconditional ability-score and literal skill fields may auto-project. Specific choice values, conditional bonuses, action resources, and class archetype/feat rules are not assumed. Ixal and Kindred save blockers are explicit until their choices can be stored. Goblin heritages remain unresolved. Beastkin remains unextracted. No Railway connection or deployment action occurred.

## Source index versus detailed page conflicts

- **Kindred CHA penalty:** Beastman index gives -2 CHA but its detailed **Standard Racial Traits** section explicitly gives -4 CHA. The testing JSON follows detailed -4 CHA pending source owner clarification.
- **Kobold speed:** Beastman index gives 20 ft. base speed but its detailed **Standard Racial Traits** section gives land 30 ft. **and** burrow 20 ft. The testing JSON preserves separate 30-ft. land and 20-ft. burrow values pending clarification.

References: https://finalfantasyd20.com/races/beastman-tribes/ , https://finalfantasyd20.com/races/beastman-tribes/kindred/ , https://finalfantasyd20.com/races/beastman-tribes/kobold/
