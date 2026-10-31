# Dwarf — reopened race audit, batch 1

Authoritative source: `rules/races/dwarf.race.json`, reviewed against the official FFd20 Dwarf page. Extraction remains 15 standard traits, 26 alternates, 4 heritage rows and 39 favored rewards (original coverage record: `docs/extraction/dwarf-coverage.md`).

## What was already implemented
- Racial ability adjustments and the four source-resolved heritage score vectors. The alternate vector **replaces**, and never adds to, the standard vector. The other half of each heritage replaces Hatred.
- Identity/speed/senses, proficiencies, and source-backed flat skill effects.
- Conditional features are displayed in source-rule cards rather than added to all checks.

## Audit fix
The legacy Dwarf Languages feature did not link its existing high-Intelligence language pool in `choicePoolIds`. The wizard therefore never allowed source-listed Galkan, Giant, Goblin, Lalafellan or Orc. The racial choice adapter now activates that **existing canonical source pool** only while the standard Languages feature remains active, without editing source IDs. It is displayed only on the ability-score step after the heritage racial INT vector is applied.

## Review boundaries
- The 26 alternate traits are extracted, not all approved. Saltbeard's component-only replacement of Greed and multiple replaced traits remains blocked.
- Surface Survivalist climate choice timing is unspecified. Conditional bonuses, racial feats, and favored class rewards remain manual or guarded.
- New batch tests verify all 4 heritage vectors, save/reopen, bonuses, language limit, no duplicate widget on Race, and inactive-trait rejection.
- No class/archetype code changed. Full source review and real signed-in cloud save/reopen still require independent validation.
