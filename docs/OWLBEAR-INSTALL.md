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
Players see committed values and read-only resource controls. Enter/blur saves;
Escape cancels. Maximum HP/MP cannot be edited from the trackers.

## Initiative

Right-click one CHARACTER-layer image token. A single context-menu action changes
between Add to battle and Remove from battle according to its current membership.
It is visible only to GMs; using it also requires the connected Cosmos admin.

A token whose name/label uniquely matches a published Party character links to
that live sheet automatically. Linked current HP/MP edits write through the
existing authenticated, revision-checked sheet API; AC and maxima remain sourced
from the sheet. If sharing stops, linked stats are disabled until shared again.
For unmatched tokens, Add to battle opens a short form for starting HP, MP, AC,
and initiative. HP is optional: leave it blank (or zero) for an untracked monster.
It still sorts and takes turns in battle, with a dash in HP and no token HP bar.
Positive starting resources establish their fixed maximum values. Subsequent
tracker edits change only current HP/MP. Other AC values default to AC (CMD 10)
for these local combatants; detailed defenses for linked characters come from
their sheets. No arbitrary token portrait is downloaded by the server.

Open the Initiative tab in the Cosmos extension to view the compact table of
initiative, name, current HP, current MP, and AC. The tracker no longer creates
a separate floating Initiative window. Click
AC for Touch/Flat-footed/CMD. Editing initiative re-sorts highest first; ties keep
addition order. The active combatant is highlighted. Previous/Next advance turns
and the round counter. Invisible tokens are omitted from players' displays.

Battle membership/stats are token metadata; turns/rounds are scene metadata.
Switching scenes loads that scene's battle rather than carrying old tokens over.
Published Party choices remain on Cosmos. Removing a token removes its row.
When the administrator enables Show token HP bars, tracked battle tokens have
a small HP bar and current/max number above them, rendered locally for each
viewer and attached to token motion. Bars disappear when the toggle is off or
a token leaves battle. No MP bar is
placed over tokens. Local item updates are batched and unchanged bars are skipped.

## Sheets, permissions, and Dice+

The existing character selector, Add another character sheet (+), resize handle,
separate sheet window, and Dice+ roll visibility remain. Add another character
only fetches available sheets when clicked; it is not an automatic load request. The Check Dice+ diagnostic button is absent. Actual sheet
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
