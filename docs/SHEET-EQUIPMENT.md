> Updated slot layout and two-handed behavior: see [SHEET-ACTIONS-EQUIPMENT.md](SHEET-ACTIONS-EQUIPMENT.md). The 13-slot layout described below is historical.

# Comos character-sheet equipment layout

The Items area has two tabs: **Equip** (default) and **Inventory**. Equip contains a stylized character silhouette with exactly thirteen clickable slots:

Head, Headband, Eyes, Shoulders, Neck, Chest, Body, Belt, Wrists, Hands, Ring 1, Ring 2, Feet.

Each slot opens an equipment picker with the character's saved inventory items. Choose an item or **Empty — unequip this slot**. Item rows in Inventory also provide a direct **Equip / Change slot** action. Equipping a second item in an occupied slot replaces the previous item. Moving one inventory row between slots frees its old slot. Different inventory rows can occupy Ring 1 and Ring 2 independently.

**Persistence:** Equipment assignments are stored in each inventory row as `equip_slot` and `equipped` inside the character's existing `character_details.data_json`. The backend's `mergeSheetData` `action:'equip'` validates the slot and inventory index, checks that quantity is positive, and updates assignments atomically through the existing revision-checked character-sheet route. No schema migration or item catalog edit is necessary.

**Backward compatibility:** Historic rows with only `equipped:true` remain in inventory and are identified as **Equipped (unassigned)** until manually assigned a slot. Other inventory fields, including `sourceItemId`, quantities and descriptions, are kept intact. Editing a slotted item's quantity down to zero clears the assignment; removing an item clears its slot. New item dialogs do not expose the legacy bare equipped checkbox.

**No invented rules:** Equip/unequip does not automatically change AC, movement, abilities or other stats. Conditional item effects can be added later using a proper rules data model.

**Offense:** Initiative uses heavier visual emphasis (both its label and roll bonus), without changing the modifier calculation or roll action.

QA: Test all thirteen slots including both rings; move and replace items, reload the sheet to verify persistence, and confirm a stale revision and unrecognized slot are rejected. On mobile, verify the silhouette, controls, and labels remain accessible.
