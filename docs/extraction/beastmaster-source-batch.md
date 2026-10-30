# Beastmaster source checkpoint

Source: https://finalfantasyd20.com/classes/core-classes/beastmaster/
Archived HTML SHA-256: `cae85922095326db7aadf59e8d7cebb9dd73b6a9d90748017ae3b1fa5bb3980c`, verified against the local HTML and import catalog.

The staged family definition preserves both 20-row tables, baseline class skills and proficiencies, starting wealth, six actionable level-1 features (including the two Limit Breaks), all 12 animal-aspect descriptions and the companion rules printed on the class page. The companion progression explicitly uses d10 Hit Dice and full BAB. It must not be replaced with an assumed Pathfinder druid table. Shared Senses retains its Wisdom-modifier daily-use wording without inventing a minimum.

Twenty-six later feature sections and favored rewards are retained as deferred prose, with source references. They are not canonical later-level grants, upgrades or selectable options. Twelve class archetypes are indexed without enabling them. The subsequent [companion source batch](beastmaster-companions-source-batch.md) stages all 35 species, their starting statistics and grouped restrictions; they remain unavailable for gameplay.

The source disagrees with itself about Natural Savagery: its table increments at 5/8/11/14/17/20, while its prose says every four levels after 5, yielding 5/9/13/17. Animal Focus also describes an all-day focus at 20 alongside Master of the Pack at 17; their interaction needs review. Both discrepancies are recorded without choosing a rule. They concern later levels and do not require blocking a future independently bounded first-level adapter.

Animal Focus is a changeable effect. Self duration is spent in one-minute increments; a companion's aspect has no duration limit, and a dead companion changes the available self-focus entitlement. None of the aspect bonuses is a permanent creation modifier. The external Improved Trip/Greater Trip effects, other conditional mechanics and companion skills/feats/tricks still need verified handling.

This report began as a source-only checkpoint. The subsequent [first-level integration](beastmaster-level-one-import.md) now provides a bounded adapter, while the full class remains under review. The queue records validation/deployment separately before advancing to Hume.

The archived FFd20 [animal companions](https://finalfantasyd20.com/classes/core-classes/beastmaster/animal-companions/) page is staged and the first-level adapter preserves starter-level restrictions (for example, Grizzly Bear at 2 and Orange Chocobo at 4). Bulk Pathfinder extraction remains paused.

Validation: 316 tests pass and `npm run build:cloud` passes. Regression coverage verifies the FFd20 companion progression, temporary/manual aspects, recorded source contradictions, disabled chooser entry and rejection of forged class selection. The older chooser test was updated from the unregistered Beastmaster placeholder to the staged disabled record. This checkpoint has not been deployed; current production gameplay remains at the previously verified milestone.
