# COSMOS beastman race extraction — Batch 15

Sources: https://finalfantasyd20.com/races/beastman-tribes/

| Race | Standard traits | Alternate traits | Heritages | Favored-class rewards | Racial choice pools |
|---|---:|---:|---:|---:|---:|
| Kojin | 12 | 4 | 0 | 16 | 0 |
| Lamia | 14 | 5 | 3 | 7 | 2 |
| Loporrit | 12 | 8 | 0 | 9 | 4 |
| Matanga | 13 | 3 | 2 | 5 | 1 |

## Kojin

Source: https://finalfantasyd20.com/races/beastman-tribes/kojin/

- BLOCKING: The summary says Silver Tongued/Natural Armor; detailed source calls features Skilled Traders/Shell. Preserve detailed names.
- BLOCKING: Natural Swimmers does not confer water breathing. Water Sense works only in same water body.
- BLOCKING: Hide in Shell is a temporary state that forbids casting; not a permanent defense buff.
- BLOCKING: Hard-Shelled attacks are penalized while natural armor rises; manual.
- BLOCKING: Defensive Training replaces two separate traits.

## Lamia

Source: https://finalfantasyd20.com/races/beastman-tribes/lamia/

- BLOCKING: Lamia requires selecting desert or water as Bond to the Land terrain; selection is not implemented in wizard.
- BLOCKING: Lamia Tempered requires one of two elemental resistances rather than both.
- BLOCKING: 20-ft land and 40-ft swim movement distinct and not reduced by armor/encumbrance.
- BLOCKING: Legless removes foot equipment slot while adding second neck slot; equipment adapter not supported.
- BLOCKING: Heritages replace both score vector and Tripping Tail with specific different actions, unresolved until reviewed.

## Loporrit

Source: https://finalfantasyd20.com/races/beastman-tribes/loporrit/

- BLOCKING: Handy requires one player-chosen Craft/Profession specialty and is not automatically selectable; block save while active.
- BLOCKING: Explorer, Hydaelyn’s Spark and Purpose-Driven have their own unbound skill choices; block on selection.
- BLOCKING: Race index lists Graceful Athlete and Fast +10, while detailed racial section uses Nimble and gives 40-ft base speed. Avoid double +10.
- BLOCKING: Small size effects should be applied globally once.
- BLOCKING: Nimble Climb/Swim DEX-for-STR substitution and Curiosity conditional bonuses require manual runtime handling.

## Matanga

Source: https://finalfantasyd20.com/races/beastman-tribes/matanga/

- BLOCKING: Academic requires Knowledge skill selection unavailable in current wizard; block saving until recorded.
- BLOCKING: Arkasodara/Gajasura heritages replace score vector and Craftsman, leaving Academic intact; block unresolved heritage substitutions.
- BLOCKING: Powerful Build does not make size actually Large; it is conditional, never an unconditional size category adjustment.
- BLOCKING: Stoic is stateful: accepting morale bonus removes benefit for 24 hours.
- BLOCKING: Top index names Minor Shards of the Past but detailed trait list names Academic, use detailed term.

## Runtime integration

Race definitions are `needs_review`, `partial` and visible for testing; mandatory unbound choices block saves only when their trait is active. Full dynamic actions, senses, equipment restrictions, swimming, Powerful Build, class options, spells and heritages remain manual until the sheet supports them. Standalone feats and racial archetypes remain outside race JSON. Next Beastman entries in source order: Namazu, Orc, Qiqirn, Quadav.
