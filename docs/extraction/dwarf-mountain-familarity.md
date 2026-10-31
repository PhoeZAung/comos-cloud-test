# Dwarf: Mountain Familarity (FFd20's original spelling)

Official source: https://finalfantasyd20.com/races/core-races/dwarf/ — under Alternate Racial Traits.

The Dwarf source rule clearly allows **one** permanent landscape choice at creation: **mountains and hills**, or **coniferous/deciduous forests**. In that landscape, the dwarf gains **+2 dodge AC**. It replaces **Bond to the Land**.

Comos already had both options and a resolved whole-feature replacement in the canonical Dwarf extraction. The wizard was showing "Needs review" because its supported-pool registry did not include this exact source pool. This patch enables it, requires one choice when the alternate is active, includes the named landscape on the racial ability card, and refuses later terrain/trait changes for saved characters. The conditional +2 AC is not applied as a permanent bonus because the app has no automatic current-terrain context.

No other Dwarf alternate, race source record, class, or archetype was altered. Tests cover both choices, ownership, replacement, absence of unconditional AC, save/reopen, and permanence; CI verification required before release.
