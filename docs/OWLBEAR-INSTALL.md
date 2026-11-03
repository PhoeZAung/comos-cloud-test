# Cosmos Owlbear extensions

Publish the exact release SHA to QNAP using scripts/publish-owlbear-qnap.sh.
Refresh the Owlbear room after COSMOS OWLBEAR RELEASE IS LIVE.

Install links:

- Character Sheets: https://cosmos-web.burmese-barbel.ts.net/owlbear/manifest.json
- Party Status: https://cosmos-web.burmese-barbel.ts.net/owlbear/party/manifest.json

Enable Party Status in the room's Extensions menu. Installing it in a profile
alone does not add it to an existing room. Joining players need access to the
Cosmos website, and the extension must be enabled in that room.

## Party only

Party Status now displays only characters selected with the status-card icon in
Cosmos Admin. Name, character portrait, HP, MP and AC come from the site.
There are no Battle views, initiative tables, scene-added characters, token
context actions, token HP/MP meters, or ongoing scene/item listeners.
Upgrading removes the retired local annotations and old tracker room data;
real scene images and Cosmos character data are not deleted.

Party is a compact transparent strip of circular portraits. The empty strip
stays small and grows when characters are shared. Drag its header to move it.
Right-click for Full, Compact, or Small. AC expands Touch, Flat and CMD.
Portraits come from the character, with a person icon as the fallback.

The GM connects their Cosmos administrator account once. The login popup closes
automatically. The room remains open to publish live status; no extra login tab
is required. Players see Party automatically without signing into Cosmos or
having administrator access. Everyone can use Show Party to toggle their own
view without changing another player's visibility. GM controls stay restricted.

GM HP and MP numbers are clickable. Enter or clicking away saves; Escape cancels.
Numbers respond immediately, then synchronize with the site. Rejected/expired
saves roll back and display an error. Players have a read-only view.

## Responsiveness and joining players

Party elements remain mounted when stats change; only changed values and images
are updated. Layout dimensions are cached, unchanged metadata is not repeatedly
broadcast, portraits are decoded in small batches, and token rendering is gone.
Normal site changes sync roughly once per second. Local resource edits trigger
an immediate refresh after the save. No measured speed claim is made.

The framing policy now permits both owlbear.rodeo and owlbear.app, including their
subdomains. The old policy omitted owlbear.app, which can block extension loads
for players using that host even though the Cosmos sign-in page opens normally.
If a player still cannot load it, confirm the room extension is enabled and
refresh their Owlbear tab after deploying. No separate admin login is needed
for the Party viewer. The Character Sheets extension still requires each player
to connect their own Cosmos account to edit their own sheets.

## Character Sheets and access

Character selection, corner resizing, numeric rolls, and icon-only pop-out remain.
The pop-out requests a separate browser popup window; the browser controls chrome.
Connections are memory-only scoped grants with an eight-hour maximum. Every API
request revalidates the original Cosmos session. Grants are not stored in URLs,
room metadata, local storage or backups. Reconnect after room/server reloads or
an expired session. Sheet grants only access their account's own characters and
preferences. Party grants require a verified Cosmos administrator and only read
the shared status projection/portraits and edit current HP/MP with revision checks.

There is no public roster API, no new database migration, and no sharing of full
sheets, notes, inventories, profiles, passwords or session cookies with the room.

Build and source checks were performed. Automated tests and live-room checks
were not run, at the owner's request. The owner confirmed that joining players
can open the Cosmos sign-in page directly in a normal browser tab.
