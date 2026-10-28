# COSMOS FFd20 — Beastman Tribes Batch 18

Official category index: https://finalfantasyd20.com/races/beastman-tribes/

| Race | Standard | Alternates | Heritages | Favored options |
|---|---:|---:|---:|---:|
| Velkk | 13 | 4 | 0 | 4 |
| Yagudo | 12 | 3 | 0 | 10 |

## Velkk

Source: https://finalfantasyd20.com/races/beastman-tribes/velkk/

- REVIEW/BLOCKING: Index summary calls Water Resistant 'Elemental Resistance' and Survivalist 'Skill Bonus'; detailed page names Water Resistant and Survivalist. Use detailed names for feature IDs.
- REVIEW/BLOCKING: Feral conditional melee bonuses require negative hit points and are not always-on. Survival becomes a class skill, though runtime class skill target mapping needs checking.
- REVIEW/BLOCKING: Affinity for Magic grants +2 to spell-resistance penetration checks and dispel checks, not globally +2 caster level.
- REVIEW/BLOCKING: Can't Let Them Live and Tell adds movement only for charge, run, or withdraw; no permanent base speed increase.
- REVIEW/BLOCKING: Nature Inhabitant and Squalid both replace Survivalist; Nature Inhabitant and Can't Let Them Live and Tell both replace Stability. These alternatives are mutually exclusive.
- REVIEW/BLOCKING: Water resistance 5, senses, and conditional saving throws require independently reviewed sheet adapters.

## Yagudo

Source: https://finalfantasyd20.com/races/beastman-tribes/yagudo/

- REVIEW/BLOCKING: Summary table calls Feathers of Gale 'Natural Armor' and Valiant Linguist 'Gifted Linguist'; detailed list names are used; bite is described as 'Bite (plus upgrade)' in table but no upgrade is specified in detailed text.
- REVIEW/BLOCKING: Valiant Linguist learns TWO languages per Linguistics rank and gives +4 Linguistics. Current wizard cannot record the language additions; track manually, do not auto-grant random languages.
- REVIEW/BLOCKING: Zealot Devotee gives a static +2 Knowledge (religion) plus one additional bonus for each five ranks; rank-scaling not yet implemented, do not treat +2 as entire bonus at higher ranks.
- REVIEW/BLOCKING: Magical Linguist has CHA>=11-dependent spell-like abilities and language/glyph spell descriptor effects; may not auto-grant spells under CHA 11 or award spell DC globally.
- REVIEW/BLOCKING: All three alternates replace Valiant Linguist, and Sturdy Feathers additionally removes Zealot Devotee; never allow stacked linguist alternatives.
- REVIEW/BLOCKING: Source has racial archetype Nokizaru (Ninja); standalone archetype details remain outside race extraction.

## Category state

Beastman Tribes extraction coverage is now 22 of 22 detailed races from the official index. Base race Beastkin remains unextracted, independent of Beastman category. All staged definitions are `needs_review`, `partial`, and not approved for rules import. Race JSON includes complete listed standard/alternate/favored-class names, effects and source locators, with conditional/unsupported effects documented as manual. Racial feats and racial archetype details remain separate future catalogs.

## Validation

Static unique feature ID, replacement references, reward counts, and SHA-256 staging entry checks are performed in extraction. GitHub readback is required for each changed file. Full Node tests and live wizard integration tests were not executed via the connector; tests were authored in `tests/race-extraction.test.mjs`.

Next category: Monstrous Races — Half-Gigas, Lizardman, Syricta. A consolidated Markdown report will be written later, per request. Railway was not accessed.
