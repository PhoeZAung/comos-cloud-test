# Half-Breed import blockers

Source: https://finalfantasyd20.com/races/core-races/half-breed/
Archived HTML SHA-256: `308eac04a2886842ac0eedffd3a246a3f5a24f0bfefb2e1911137d301d49ee77` (matches queue catalog).

The complete archived page was read. A legal Half-Breed needs two parent races, one chosen +2 ability, one parent size, both parent subtypes, averaged land speed and source-defined inherited movement modes, Common plus one parent language, and two favored-class choices. Its inherited trait categories require eligible traits from those parents, limited to 3 RP each except the weakness category. Empty categories are permitted only when a parent has no eligible trait in that category. The source's lack of an overall RP cap does not remove those per-trait limits.

Banned parent races: Antica, Galka, Genome, Gnath, Immortal, Mandragora, PuPu, Seto Lion and Shindroid. Parent racial-effect eligibility and favored options/archetypes also need precise source-backed parent links. Ancestral Arms replaces either the feat/skill slot or the offense slot, chosen explicitly, never both automatically.

The available archived race definitions do not supply a verified RP-priced parent-trait catalog. There is no archived race-builder/race-point source in this extraction to establish those costs. Guessing prices or treating missing trait lists as empty would produce unverified characters. A parent-pair/inheritance adapter and saved-choice UI also remain to implement. This item is blocked on verified parent-trait costs and eligibility, rather than counted as imported or fully complete. Pathfinder bulk collection remains paused under the class/race-first plan.

The current wizard already guards individual unsupported choices. A server regression test now also blocks bypassing the required construction by disabling every standard trait. A clear race-step notice explains why creation is unavailable. Source review remains `needs_review`.

Resume with a source-backed parent-trait table containing parent ID, canonical feature ID, category, RP cost and cost citation. Then implement the parent exclusions, identity/movement/language rules, one eligible selection per nonempty category, ability choice and two favored classes; verify save/reopen and API rejection of invalid combinations before enabling this race.
