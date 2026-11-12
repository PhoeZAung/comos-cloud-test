# Cosmos for Owlbear

The extension action popover now has four tabs: Character, Admin (verified GM and
Cosmos administrator only), Initiative, and Settings. Roll history is a disclosure
under Settings rather than a separate tab. Connect account, refresh characters,
open Cosmos, and roll visibility settings are also under Settings.

For production, publish the tested main SHA manually from Termius over Tailscale
using /share/Service/Container/Cosmos/publish-cosmos-qnap.sh, as described in
QNAP_PHONE_DEPLOY.md. A GitHub merge does not update the QNAP container.

## Update an existing room

1. Remove the old Cosmos Party Status extension from the room and My Extensions.
2. Remove/re-add the old Cosmos Character Sheets entry so Owlbear reads the new
   manifest with its background page. The extension is now named Cosmos.
3. Install https://cosmos-web.burmese-barbel.ts.net/owlbear/manifest.json and enable
   Cosmos in the room. Leave Dice+ installed/enabled separately.
4. Everyone refreshes the room. The GM opens Cosmos and connects their Cosmos
   administrator account. Players connect their own account to open their sheet.

Removing an extension does not delete Cosmos accounts, sheets, or Party choices.
The retired /owlbear/party/manifest.json is no longer an install URL.

If Brave/Chrome reports a denied request to the local address space, allow Local
network access in the site settings for https://www.owlbear.rodeo, then refresh.
Tailscale DNS can resolve Cosmos to its private 100.x address on connected PCs.
Do not disable browser protections globally.

## Party

The status-card icon in Cosmos Admin selects published site characters. The
public read-only feed contains their names, character portraits, current/max HP
and MP, AC, Touch, Flat-footed, and CMD. Unselected/archived characters, accounts,
full sheets, notes, inventories, and credentials are excluded.

Every browser reads the same committed server feed directly. One live stream per
browser serves all Cosmos panels; it reconnects with snapshot fallback. Portraits
are small, versioned thumbnails. Players need no Cosmos login to view Party.

GM + Cosmos administrator controls are in the Admin tab: Show Party,
Party position (Top/Bottom/Left/Right), and Show token HP bars. The separate
floating Initiative tracker has moved into the Initiative tab of the action
popover. Party display and token-bar settings are shared through room metadata;
Party placement adapts to each viewport. There
is no free dragging. Party takes no space while no characters are selected.
Dimensions are checked every 750 ms because the background frame may not receive
the parent browser's resize events. Dock coordinates are recalculated only when
screen dimensions change, keeping top/bottom centered and side docks 12 px from
the edge after browser zoom, fullscreen, or resizing. Map transforms do not move
these screen-space panels. Party cards include a thin live HP meter: green for
remaining health, a muted red section for missing health, and the deficit in its
tooltip. Token HP meters use the same visible missing-health track.
Compact cards show the character portrait, name, current HP/MP, and clickable AC
details. The administrator can click current HP/MP to save to the original sheet.
Players who connect their own Cosmos account can click the pencil-marked HP or
MP value on **their own** published Party card and enter an updated value.
Only an authorized GM/administrator may edit another member's values; the
backend independently enforces ownership and revision checks. Other players'
Party resources remain read-only. Enter/blur saves;
Escape cancels. Maximum HP/MP cannot be edited from the trackers.

## Initiative

Right-click one CHARACTER-layer image token. A single context-menu action changes
between Add to battle and Remove from battle according to its current membership.
It is visible only to GMs; using it also requires the connected Cosmos admin.

A token whose name/label uniquely matches a published Party character links to
that live sheet automatically. Linked current HP/MP edits write through the
existing authenticated, revision-checked sheet API; AC and maxima remain sourced
from the sheet. If sharing stops, linked stats are disabled until shared again.
When no published Party character matches, Add to battle first looks for one
uniquely named saved NPC in the connected Cosmos administrator's NPC library.
A unique, complete NPC match auto-fills AC, defenses, MP and initiative and rolls
starting HP from the original imported hit-dice expression, such as
`94 (11d10+33)`. The rolled starting HP becomes the token's current and maximum
HP, and the dice and result are stored with its battle metadata. If no dice
formula exists, the printed NPC HP is used instead. These NPC combatant values
are a snapshot; editing the token's resources does not edit the NPC library.
If no unique NPC matches or required NPC stats are missing, Add to battle opens
the normal manual form for starting HP, MP, AC, and initiative. HP is optional: leave it blank (or zero) for an untracked monster.
It still sorts and takes turns in battle, with a dash in HP and no token HP bar.
Positive starting resources establish their fixed maximum values. Subsequent
tracker edits change only current HP/MP. Other AC values default to AC (CMD 10)
for these local combatants; detailed defenses for linked characters come from
their sheets. No arbitrary token portrait is downloaded by the server.

Open the Initiative tab in the Cosmos extension to view the compact table of
initiative, name, current HP, current MP, and AC. The tracker no longer creates
a separate floating Initiative window. Click
AC for Touch/Flat-footed/CMD. Editing initiative re-sorts highest first; ties keep
addition order. The active combatant is highlighted in the list and outlined in gold on the map.
The map highlight now uses a tightly padded rectangle centered on Owlbear's
actual token bounds rather than a loosely centered circle. This outlines the
image boundary, not the per-pixel transparent silhouette.
Previous/Next advance turns and the round counter and pan the current GM's
Owlbear viewport to the next/previous token; they do not move every player's
camera. Hovering over a combatant name (or focusing it by keyboard) shows a
cyan outline on that token just for the local viewer. No token selection is changed.
Invisible tokens are omitted from players' displays.

Battle membership/stats are token metadata; turns/rounds are scene metadata.
Switching scenes loads that scene's battle rather than carrying old tokens over.
Published Party choices remain on Cosmos. Removing a token removes its row.
When the administrator enables Show token HP bars, tracked battle tokens have
a small HP bar and current/max number above them, rendered locally for each
viewer and attached to token motion. Bars disappear when the toggle is off or
a token leaves battle. No MP bar is
placed over tokens. Local item updates are batched and unchanged bars are skipped.

## Character tab and multiple sheets

The disconnected Character tab shows **Connect Cosmos account** instead of a
blank list. After connection, the extension selects Character and loads the
player's character roster (plus the NPC roster only for verified GMs). Account
connection has moved out of Settings; the extra **Refresh characters** and
**Open Cosmos** controls have been removed.

Player and NPC cards live in the same vertically scrollable roster; narrowing
or shortening the extension does not compress player cards underneath NPCs.

With a sheet open, its **Add Sheet (+)** and **Pop Out** controls live inside
the character sheet's titlebar beside Favorite (star) and Rest (moon), matching
the Cosmos website. The redundant top-level ← Characters, + and Pop Out row
has been removed from the Owlbear extension.

The first open sheet gets a tab bearing its **character name**, even when it
is the only sheet. As additional characters open, their named tabs share the
entire available width and gradually shrink like browser tabs. Each tab's ×
close button is only visible on hover or keyboard focus; touch devices keep
the control visible so the character can still be closed. Closing the last
sheet returns to the Character roster. Previously opened sheets retain their
own iframe, position, and internal section while switching.

NPC sheet results appear in the picker only when the user is both an Owlbear GM
and a currently verified Cosmos administrator; revoking that role clears any
open NPC picker and closes NPC sheets.

On the standalone Cosmos website, **+ Add Sheet** lives beside **Pop Out** in
the sheet titlebar. The sheet-tab strip appears only after opening a second
sheet. Admin → group/party sheet viewing uses named tabs instead of opening all
member sheets side by side; only visited tabs load an iframe.

## Manual ability editor and compact weapon modifiers

All four Ability categories (**Active**, **Passive**, **Feats**, **Racial**)
now use a single **+** button which opens the manual editor immediately;
the old two-choice Add Ability menu is gone. **+ Group** remains alongside.
On the Active page both buttons are placed **above Limit Break**, with
the separate ability entries below.

The manual editor displays **Name** first, followed by a collapsed
**Advanced Settings** disclosure for action type, targeting, mechanics,
usage and other optional fields. **Description**, **Effect** and
**At Higher Levels** stay visible as matching full-width rich-text
sections. **Add Premade** appears to the right of the Add/Edit ability
title; switching opens the rule-ability library and confirms before
discarding unsaved manual edits. Existing premade abilities and their
calculation rules are unchanged.

Weapon Attack Roll's **Ability Mod** is now **AR Mod**; Damage's
**Damage Ability** is now **DMG Mod**. Each ability selector shows the
actual ability contribution beside its label, for example bold
**STR: +4**; None shows **None: +0**. Changing attack type, ability,
or damage style immediately refreshes the corresponding bold value.
The verbose top-of-dialog STR explanation and separate attack/damage
total-preview boxes are removed. Underlying rolls and calculations
are not changed.

## Weapon defaults and special rules

New player weapons default to STR for both attack and damage when their
**Attack Type** is Melee (or Touch). Choosing Ranged or Ranged Touch defaults
the attack ability to DEX and the damage ability to **None**. The editor
updates those defaults when Attack Type changes, unless a user explicitly
chooses a different ability. Both attack and damage ability menus support
**None** (no ability bonus), as well as manual STR, DEX, CON, INT, WIS, CHA
and their existing Automatic choices.

**Damage Style** still handles two-handed STR (1.5× positive STR),
off-hand STR (half positive STR), thrown/sling STR, and bow rules. Attack
and damage ability selections remain independent; for example, a finesse
weapon can attack with DEX but add STR to damage when appropriate. The
actual chosen modifiers are shown live in the editor.

Every newly entered weapon preselects **critical range 20** and **critical
multiplier ×2**. A natural 20 produces a critical **threat**, followed by
the existing Pathfinder/FFd20 confirmation roll; it is not an automatically
confirmed critical. Custom critical ranges and multipliers can still be
chosen. Existing weapons keep their saved values. Older weapons lacking
a Damage Ability field continue to use **None** to prevent doubling damage
bonuses already included in a manually entered dice formula.

Conditional feats, class modifiers and special weapon traits may require
manual overrides; these defaults do not assume every class or weapon uses
identical rules.

## Auto connection, NPC visibility and initiative rolls

On opening or refreshing the Owlbear extension, Cosmos attempts a fresh
authenticated connection using the **existing signed-in Cosmos session**.
It does not store bearer grant tokens in localStorage or in a file. If the
user is not signed in, the extension prompts them to connect; returning
to its connection window after signing in automatically checks again.
Depending on browser third-party cookie restrictions, the first interactive
connection may still require the user to sign in through the popup.

The admin navigation and per-character administration list no longer
display the **Item Controls**/Shop icons. The player character-sheet item
catalog and Gil purchases are unaffected; legacy item management endpoints
are not removed from the backend.

The GM-only **NPC HP visible to players** switch lives in the extension's
Admin → Display settings and is stored with the Owlbear room layout.
It defaults **off** to protect nonparty combatant HP. When off, the player
initiative state does not contain current/max HP for unlinked foes or NPCs
and their local token HP bars are suppressed. Party-member HP is always
visible, while GM initiative continues to show all HP. Switching the
setting on restores the nonparty HP for players.

An Owlbear-invisible combatant stays in GM initiative and displays a
small crossed-out eye beside the name, signalling that players do not
see that combatant's entry. The player-visible battle list and current
hidden-turn ID remain redacted regardless of the HP visibility toggle.

For a uniquely matched saved NPC, Add to Battle reads its printed **Init**
modifier and rolls **1d20 + modifier** automatically. The resulting
initiative and rolled HP snapshot are stored on that battle token; the
NPC notification includes the initiative roll. Manual fallback is used if
no unique saved NPC can be matched.

## Extension tabs, camera focus and hidden combatants

Extension navigation uses the Cosmos constellation theme, including a clear
active tab and compact named tabs for additional sheets. In Initiative, the
character's name is a **Center camera** control for every Owlbear player and
the GM. It moves only the current viewer's viewport; hovering or focusing
still temporarily outlines visible tokens on that viewer's screen.

A token set to **invisible** in Owlbear may remain in the initiative order.
Its name, stats and active-turn token ID are not included in the player
initiative view, while the GM retains them. Players cannot focus a hidden
token by sending an invented ID; the controller checks token visibility.
The active-turn number still progresses normally, but a hidden active turn
is not falsely attributed to another character.

The resize grip previews dimensions as you drag and commits the Owlbear
host iframe's width/height on pointer release; host resizing mid-drag
can discard the pointer capture. Responsive layout reflows after a size is
applied. Keyboard arrow resizing updates dimensions immediately.

Catalog input fields (search and quantity) are no longer flagged as unsaved
character edits, so a normal Buy operation will not report
"Finish saving this character before buying" unless the character really
has pending unsaved edits.

## Catalog preview and purchases

In a player's Inventory, **+ Add Items** opens the searchable catalog.
Clicking an item **only opens a themed details popup**; it does not add or
charge anything. The popup displays the full item description, source fields,
quantity, fixed Gil unit price, calculated total amount, and the character's
current Gil. A purchase happens only after clicking **Buy**. The server
checks the signed-in character owner, sheet and catalog revisions, price and
available Gil, then atomically saves the item and deducts Gil. Duplicate
requests with the same purchase ID cannot charge twice.

Catalog entries with **no fixed price** are clearly labeled. Their button
reads **Add without a price** instead of Buy and performs the previous
no-charge Add Item operation; it does not invent or deduct Gil. A zero-Gil
fixed price uses Buy with a zero-Gil charge. Admin-controlled purchases
remain on the existing admin endpoint with independent permissions.
The same experience is available inside the Owlbear sheet.

## Sheets, permissions, and Dice+

The existing character selector, resize handle, separate sheet window, and
Dice+ roll visibility remain. Add another sheet uses the already-fetched roster;
it does not preload unopened sheets. The Check Dice+ diagnostic button is absent. Actual sheet
rolls still use Dice+ faces, with server validation of formulas/modifiers/resources
and no duplicate Cosmos dice animation.

Site writes require the original live Cosmos session and current admin status on
every resource save. Ordinary sheet grants remain limited to the user's own
characters; only a verified administrator may save the small published-resource
projection. Owlbear editing controls additionally require the GM role. Players
can open Cosmos and their own sheets, and view the same shared displays.

Grants expire within eight hours and stay in server/browser memory. The background
keeps the login while its action panel is closed. Same-origin per-room/per-browser
BroadcastChannels share it among Cosmos frames; grants never go through Owlbear
broadcasts, room/scene metadata, URLs, or persistent browser storage. Reloading the
room requires reconnecting the account. Both owlbear.rodeo and owlbear.app framing
origins remain allowed.

Build and syntax checks only; no automated tests, browser room exercise, Dice+
roll tests, or multi-client live validation, as requested. No database migration.

## Initiative target recommendations (GM-only)

The Owlbear extension has **Character**, **Initiative**, and **Settings** tabs.
The former **Admin** display controls now live inside **Settings**, above Roll
history, and remain visible only to a connected Cosmos administrator who is the
Owlbear GM.

In Settings → Admin, enable **Recommend target**. During the turn of a saved
Cosmos NPC added to battle, Cosmos draws a **red outline** around one suggested
living, linked party token. The active combatant's gold outline and hover
outline remain separate. Red outlines are local to the GM's Owlbear session,
do not select tokens, do not reveal the target to players, and never roll or
attack automatically. The toggle is remembered locally in that browser.

Recommendations use NPC Intelligence from the saved NPC stat block and party
HP, maximum HP, AC, MP availability, and map distance. Mindless creatures tend
to favor nearby party members; smarter foes may favor weakened or easier-to-hit
characters. Unlinked tokens, hidden tokens, other NPCs, downed characters and
absent party sheets cannot be recommended. Unknown Intelligence defaults to a
balanced heuristic. The system cannot know line of sight, cover, obstacles,
reach, morale, tactics specified in a stat block, or GM intent, so use it as an
optional suggestion. To clear the red ring, disable the toggle or advance to a
non-NPC turn. Existing NPCs retrieve Intelligence from their saved sheets when
possible; they do not have to be removed and re-added.

## Targeted combat rolls (initiative-only)

Abilities and spells now have a **Effect type** control under Edit → Advanced
Settings → Attack & damage: **None**, **Damage**, **Healing**, or **Temporary HP**.
The existing **Dice Roll** formula is used as the numeric amount for the
configured effect. Legacy entries retain their previous behavior until an
effect type is explicitly saved; editing a legacy entry with a damage formula
suggests **Damage**. Use **None** for buffs and dice rolls that should not
target a combatant.

In Owlbear, weapon attacks and spells/abilities with an explicitly saved HP
effect type follow a targeted flow when combatants are in initiative:

1. The acting sheet must belong to the current initiative token (a linked
   player character or an admin-opened saved NPC). A different turn is blocked.
2. Select **one** combatant token in the Owlbear scene.
3. Attacks must target an opposing combatant. Healing and Temporary HP must
   target a linked party token. Then click the weapon / spell / ability roll
   from the acting sheet. A normal/out-of-combat roll continues as before.
4. On a completed roll Cosmos compares any attack roll against regular AC,
   touch AC, or CMD as appropriate, displays **Hit**/**Miss**, and deselects
   only the selected target. A failed roll keeps the selection for retry.

The first stage intentionally **does not apply target HP**: damage, healing and
temporary HP are calculated as rolls and remain subject to GM adjustment.
This avoids unauthorized editing of other players' sheets and avoids
incorrectly stacking temporary HP from repeated identical sources. Reactions,
saving throws, non-targeted abilities and ordinary checks remain possible
outside the current character's turn. The GM should still handle cover,
range, line-of-sight, saves, resistance, immunity, and special effects.
