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

Cosmos Admin's character-card icon still selects characters to share.
The connected GM's tracker panel has three view buttons: Show Party, Show Battle,
and Off. There are no sharing counts or instructional paragraphs in the panel.
Players see connection status and cards; GM controls are hidden and role checked.
Owlbear's action API does not expose per-role hiding for the installed icon, so
its entry may remain visible to players.

- Drag the small PARTY/BATTLE strip on a card and release to place it. Positions
  and sizes are saved separately for each view on your browser.
- Right-click a card for Full, Compact, or Small display.
- GM right-click options also add a photo/icon, add to battle, link a token to a
  Cosmos character, edit an unlinked token's stats, or remove it from the view.
- Right-click/select an Owlbear image/prop for Add to Cosmos party or Add to
  Cosmos combat. Its image and name become the card. Match its character name
  or use Link character to synchronize it with a Cosmos sheet.
- Unlinked props start with zero HP/MP and AC 10. Edit stats in the card's GM
  context menu to set their HP, MP, AC, other defenses, and initiative.
- Linked character HP, MP, AC and initiative come from the saved Cosmos sheet.
  Edit the character there; tracker controls do not overwrite sheet resources.
- Battle cards sort by initiative. Next turn in a GM card menu advances the
  highlighted combatant and round. Character initiative is the sheet's modifier;
  unlinked tokens use the value set by the GM.
- Click AC to expand Touch, Flat-footed and CMD.
- Show Party restores character cards hidden from that room's party view.

Tracker photos and memberships are shared in the room. Card placement and
compactness are personal. Room metadata space is bounded; the UI reports an
error if more cards/photos would exceed it. Portraits from Cosmos are sent as
small thumbnails separately from the room metadata. Full sheets, notes,
inventories, and account profiles are not broadcast.

This release was built and reviewed in source. Automated tests and live-room
checks were not run, at the owner's request.
