# Sheet selectors, equipment and quick actions

## Selectors and favorites

The existing four ability categories now use a square. Inventory has three main square groups (Tools, Magic, Other) around a central All button, with the original category tags available below. The phrase “make 3” was interpreted as these existing three inventory groups; no ability category was removed. Spells add All Spells before Cantrip/1–9, and every spell can be starred. Favorites preserve original collection/index references, including spell dice/edit actions.

## Equipment

A single proportioned SVG body, connector endpoints and percentage-positioned labels share a 400×520 coordinate system. Head, Chest, Body, Hand 1, Hand 2, Ranged, Legs and Feet remain directly visible; Accessory opens the eight original accessory positions (headband, eyes, shoulders, necklace, belt, wrists, rings 1/2). Old slot IDs remain valid. Sixteen positions remain individually saved, so grouping accessories does not remove or merge existing rings or other gear.

The picker includes both Inventory records and the existing Weapons collection. Equipping overlays a lightweight SVG shape on the corresponding body region. A marked two-handed weapon assigned to either hand reserves both hands, replaces conflicting hand equipment, and renders one weapon marker. Removing/replacing either occupied hand clears that two-handed reservation. Ranged is a separate loadout position, not a command to automatically switch attack calculations. No AC, speed, class or rules bonuses are inferred from equipment.

Assigning one item from a stack splits off one equipped copy, preserving total quantity, source data and other metadata. A full 1,000-row collection refuses a split. Equipping, replacing, moving and clearing remain one authenticated, revision-checked transaction; no inventory data is deleted to make room.

## Ability use and rolls

Remaining uses is an ordinary number input styled like the sheet's MP value. It accepts nonnegative whole counts up to the calculated maximum and autosaves. An immediate Use/dice click waits for a pending count edit to save. A separate play/Use icon spends one use for a limited active ability; its receipt also rolls any explicitly configured attack type plus damage. Passive/racial/feat entries can send/roll their configured action without an invented use pool. A dice icon rolls the same configured attack/damage without spending a use. Formula errors and exhausted uses refuse the action before a use is spent.

Use changes and its generated receipt commit together. Repeating the same request ID returns the stored receipt and does not spend/send twice. Receipt insertion failure rolls back the resource and revision. A Discord delivery failure preserves the completed use and roll, with a visible delivery status. After a spending action the UI fetches the latest sheet; the existing live revision updates remain in place. Spells retain the display-only MP behavior from SHEET-PORT.md.

## Verification

149 tests pass, including cross-collection two-handed gear through HTTP, offhand replacement/removal, quantity preservation, accessory IDs, equipment markers, spell favorites and All Spells, filtered indices, remaining-count validation, server-derived ability attack/damage, receipt retry behavior, failed Discord delivery, transaction rollback, owner/Origin/stale-revision checks. The isolated stylesheet remains under its existing 26 KB ceiling.

Synthetic phone QA verified selecting a Greatsword from Weapons into Hand 1 also fills Hand 2, assigning Legs, opening all accessory positions, editing remaining uses to 2 then clicking Use once to reach 1 with attack/damage in one receipt, dice-only rolling without another decrement, starring Fire into Favorites, Magic-group filtering and All reset. Equipment and ability layouts had no horizontal overflow at 320 px; Equipment was also checked at 1000 px. A quick Favorites edit of HP to 27 and uses to 2 followed by Use preserved HP 27 and spent once to reach 1. Actual Discord channel delivery and Owlbear room behavior are not exercised by synthetic QA.

Phone checks after refreshing:
1. Inventory: try Tools/Magic/Other and the middle All square.
2. Equip: assign Head/Legs/Ranged; check each region changes. Mark a test weapon Two-handed in Edit Weapon, equip it in a hand, then replace/clear Hand 2 and verify both hand reservations update. Open Accessory for rings/belt/etc.
3. Abilities: edit remaining uses, click the play/Use icon, and check it decreases once. Confirm attack/damage match the saved attack type/formula. Click dice and confirm the count stays unchanged.
4. Spells: select All Spells, star a spell and open Favorites. Test its dice and edit controls. Check actual Discord delivery separately.
5. Skills: inspect the updated unused-point card and its expandable calculation.

## Equipment/category refinement — 26 October 2026
The silhouette now has broader shoulders, articulated torso/limbs and region overlays. Head remains directly selectable; all individual accessory/body slots are initially visible below the figure. Inventory category buttons now share the Item Control tile grid, with All as a two-by-two square at the right. All 16 original slot IDs and two-hand reservation behavior remain intact. See ITEM-CONTROL-CATALOG.md for catalog purchases.
