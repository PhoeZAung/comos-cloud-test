# Race replacement policy — batch validation

The runtime accepts a whole-feature \`replace\` operation when the source marks it \`resolved\`, or when the source marks it \`manual\` **and** it has an explicit replacement description, defined and distinct standard-feature targets, defined added-feature IDs, and no event/component replacement ambiguity. \`manual\` still means the benefit itself may require player or GM adjustment.

The only approved component mutation remains Dwarf Saltbeard's Greed condition. Every other \`modify\`, \`partial_feature\` or \`unresolved\` operation stays blocked.

Variant heritage controls are enabled only if all replacement operations pass this check, no unhandled choice pool is required, and any replacement for a racial ability-score vector has complete, automatic constant score effects in the actual race definition. Heritages with manually encoded score effects remain blocked until those scores are reconciled with the official source. Selected starting heritage/alternates are permanent after initial save; conditional modifiers and descriptive choices are player-managed on the sheet.

**Never infer** attack, AC, feat, spell, movement, skill rank, or class mechanics from free text. \`rules/races\` and \`rules/staging/races\` are not rewritten in this batch. Full test suite and cloud build are required before merge.
