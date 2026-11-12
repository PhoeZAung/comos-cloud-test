# Cosmos extension: Character / Admin / Initiative / Settings

Settings → Roll history combines the connected account's saved Cosmos receipts
with public Cosmos rolls shared by everyone in the current Owlbear room, newest first (100 entries).
Personal server history includes earlier website rolls. Room history collects
public extension rolls even while the action panel is closed, caches them per
room/browser, and syncs public snapshots when players join and every 30 seconds.
Old public rolls can be recovered from a connected peer or that browser's cache;
this is not a server archive of every player's private account history.

Private, GM/self and GM-only receipts are never placed in the public history
broadcast or public cache. Existing private account history remains owner-scoped.
Public sharing contains only character/player names, label, timestamp, totals,
formulas and faces. It never includes grants, cookies, character descriptions or
private account data. Snapshots are chunked below 10 KB and duplicate receipt
IDs are merged. Live remote receipts also show a short Owlbear notification.
No game roll, resource use or Discord message is repeated by history syncing.

The audience is captured once before the first die of a logical sheet roll.
Changing the dropdown during attack/damage does not change that roll's audience.
Everyone requests use Dice+'s documented ALL destination. Private requests stay
local. Result matching uses the unique roll ID, player ID and notation rather
than requiring the replying Dice+ instance to have the roller's connection ID.

Personal history refreshes every five seconds while Settings → Roll history is
expanded; incoming room receipts render there even before an account connects.
Unchanged history does not replace the list or interrupt scrolling. No database
migration was added.

Players may click current HP/MP on their own shared party characters. Both the
background and the backend enforce ownership; other characters remain read-only.
Ownership/capability lists refresh on panel open and every 30 seconds. Max HP/MP
are not edited by these controls. Initiative and display settings remain admin
controls.

The resize grip captures the pointer and previews dimensions during a drag,
then applies width and height sequentially on release. It saves the size and
reclamps to the current room viewport when it changes. Arrow keys resize too;
Shift makes larger steps. Deferring host writes avoids losing pointer capture
when the host repositions the panel. Ability/weapon pencils use an inline SVG
sized in em units with no square border or background.

Admin is hidden initially. Both Cosmos administrator capability and Owlbear GM
role must be verified before the Admin tab, display controls and battle token
menu appear. Initiative is now available inside a tab to all players, with
current HP/MP, initiative edits and turn controls restricted to authorized GMs.
Revoking access hides the tab, returns to Character, and removes
the context menu. Commands retain their existing authorization checks. Dice+
integration and roll visibility settings remain available to ordinary players in
Settings. Moving Roll history to Settings does not change its privacy rules.

Checks: tests/owlbear-history.test.mjs covers receipt correctness, ownership,
expired sessions, permission denial and battle menu lifecycle.
scripts/check-owlbear-panel-browser.mjs exercises the real action controller and
generated markup with a synthetic room/account: players, admins, revocation,
history rendering, escaping, refresh and phone/keyboard layout. It makes no
real game rolls or account changes. A real multiplayer Owlbear reconnect remains
a manual check after deployment.

# Manual QNAP refresh

The manual helper is scripts/publish-cosmos-qnap.sh. Download it from the exact
approved GitHub commit and run it over the existing password SSH connection.
It builds a candidate while the current app remains online, checks migration
history and integrity on a private database copy, verifies the regular backup,
then briefly stops only cosmos-app for a final consistent database snapshot.
It recreates only the Compose app service. Tailscale identity, secrets, media,
other NAS containers and the existing live data volume are retained.

Failed startup restores the previous image and pre-switch database. Failed
database/WAL files are retained separately for recovery. An interrupted final
snapshot phase restarts the original container. Backups and release directories
are retained. The current app must first be healthy; a NAS/network outage is
not repaired by this helper. Its shell syntax is checked locally; actual QNAP
execution and external login/character/media verification remain manual.

After success, hard-refresh Cosmos, reopen the Owlbear room, and reconnect the
Cosmos account. Existing grants intentionally expire when the backend restarts.
The extension install URL remains /owlbear/manifest.json; version is 1.6.0.

Discord rolls are enabled by default in both the website and Owlbear sheet.
The Main settings switch can disable delivery for the current sheet. Dice+
faces still use the existing server receipt and duplicate protection.
Verification: scripts/check-owlbear-discord-browser.mjs drives the real embedded
sheet and message-port bridge against synthetic dice and a captured relay; it
checks default delivery, unchanged totals, the off switch, and tab changes.
No real Discord message is sent by this check.

Current validation includes tests/owlbear-room-rolls.test.mjs (two-player public
sync/rejoin, deduplication, private-roll isolation, Dice+ routing/correlation and
viewport bounds). The three Owlbear browser helpers cover the real sheet/pencil
editors and Discord bridge, shared history/audience capture, and actual party
HP/MP saves through an isolated database and real ownership routes, plus mouse,
keyboard, restored and small-viewport resizing. Synthetic room transport does
not replace a real multiplayer Dice+ animation check after QNAP deployment.
