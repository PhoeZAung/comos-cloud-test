# Cosmos Owlbear extensions

Publish the exact release SHA to QNAP using `scripts/publish-owlbear-qnap.sh`.
Refresh the Owlbear room after the helper reports `COSMOS OWLBEAR RELEASE IS LIVE`.

Install and enable these custom extensions:

- Sheets: https://cosmos-web.burmese-barbel.ts.net/owlbear/manifest.json
- Tracker: https://cosmos-web.burmese-barbel.ts.net/owlbear/party/manifest.json

## Connect

Click Connect and sign into Cosmos. The small connection window closes once the
extension has its scoped connection. Nothing needs to remain open except the
Owlbear room (and a separate sheet tab, if you choose to open one).
Both extension panels show Connected once their connection is active.
The tracker requires both the Owlbear GM role and a Cosmos administrator login.
Reloading the room/server, logging out of Cosmos, or an expired connection may
require connecting again. Connections last at most eight hours.

The browser retains only a scoped grant in memory. Its underlying HttpOnly
session stays on the server. Grants are not put in room metadata, URLs, local
storage, logs, or backups. Every request revalidates the original session.
Sheet grants only access the account's own characters and preferences. Tracker
grants only read the admin-enabled status projection and character portraits.
No database migration is added.

## Sheets

Choose a portrait/name card to open your character. Drag the lower-right corner
to resize the panel. There are no preset or dimension fields. The browser saves
the size you choose. Open in new tab reuses your separate sheet tab.
The icon follows the installed Cosmos app's C, star, and orbit design.
Extension rolls show numeric results without Cosmos or Dice+ dice animations.
Normal Cosmos website dice preferences continue to apply outside the extension.

## Tracker

Cosmos Admin's character-card icon selects characters to share.
The GM panel has two independent toggle buttons: Show Party and Show Battle.
Both can be on together. There is no Off button; toggle either view off itself.
Players see connection status and the shared views. GM controls are hidden and
role checked; Owlbear may still display the installed extension action icon.

- Party is one horizontal panel at the top, containing character portraits,
  names, HP, MP, and expandable AC details. It scrolls for larger parties.
- Battle is one compact table on the left: initiative, name, HP, MP, AC.
  It scrolls vertically for large battles, with column headings kept visible.
- Drag either panel's header and release to move the whole panel. Their personal
  positions are stored separately. Right-click for Full, Compact, or Small.
- Party and Battle memberships are independent. Adding to Battle keeps Party
  membership. Removing from one list leaves the other membership intact.
- Right-click/select an Owlbear image/prop and choose Add to Cosmos party or
  Add to Cosmos battle. Use Remove from Cosmos party / battle to remove it again.
  These menu actions are GM-only and also support multiple selected images.
- A token matching a shared Cosmos character name links to that sheet. Otherwise
  use Link character from its row/card's context menu. Linked rows track saved
  sheet HP, MP and AC. Unlinked props start at zero HP/MP and AC 10; use Edit stats.
- The GM can edit the battle table's initiative boxes, including linked characters.
  These are encounter initiative overrides, so editing them does not change the
  sheet's initiative modifier. Rows sort highest first, with stable name/ID ties.
- Current turn is highlighted in gold; the following row is marked as up next.
  Next and Back advance through the sorted order. Wrapping forward increments
  the round; wrapping backward decrements it. Back stops at the start of round 1.
  The current character stays selected if initiative values reorder the table.
- Right-click a Party card or Battle row for photo/icon, character linking,
  unlinked-token stats, or removal from that list. These controls are GM-only.
- Click AC in either view to expand Touch, Flat-footed, and CMD.

Existing single-mode tracker data is read without a database migration. New
membership edits preserve the old membership while adding the second one.

Tracker photos and memberships are shared in the room. Card placement and
compactness are personal. Room metadata space is bounded; the UI reports an
error if more cards/photos would exceed it. Portraits from Cosmos are sent as
small thumbnails separately from the room metadata. Full sheets, notes,
inventories, and account profiles are not broadcast.

This release was built and reviewed in source. Automated tests and live-room
checks were not run, at the owner's request.
