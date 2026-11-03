# Cosmos Owlbear extensions

Publish the exact release SHA to QNAP using scripts/publish-owlbear-qnap.sh.
After COSMOS OWLBEAR RELEASE IS LIVE, everyone refreshes the Owlbear room.

Install and enable the room extensions:

- Character Sheets: https://cosmos-web.burmese-barbel.ts.net/owlbear/manifest.json
- Party Status: https://cosmos-web.burmese-barbel.ts.net/owlbear/party/manifest.json

## Public, shared Party data

Characters selected with the status-card icon in Cosmos Admin are now published
in a public read-only Party feed. Their names, character portraits, current/max
HP and MP, AC, Touch, Flat-footed and CMD can be viewed without a Cosmos login.
Unselected and archived characters are excluded. Account profiles, full sheets,
notes, inventories, session cookies and credentials are not part of this feed.

Public read-only routes:

- GET /api/v1/owlbear/party - current published projection.
- GET /api/v1/owlbear/party/events - server-sent updates.
- GET /api/v1/owlbear/party/portrait/CHARACTER_ID?v=PORTRAIT_HASH - small thumbnail
  of a currently published character. No original image or private file path.

There is one direct live connection per viewer's Owlbear client. Party data no
longer waits for the GM's browser to poll Cosmos, update Owlbear room metadata,
or relay portrait messages. Joining players receive the current snapshot and
load thumbnails directly, without signing in or waiting for the GM to connect.
The feed keeps updating even when the GM closes their browser.

Successful character saves, resource rolls and admin visibility changes notify
the feed immediately. A shared one-second server check catches changes made
through other APIs. All viewers see the same committed values: the GM's view no
longer displays a private optimistic HP/MP value ahead of everyone else.
Versioned snapshots reject older fallback responses. A reconnecting stream falls
back to direct snapshot reads. Local timestamps prevent different PC clocks
from hiding an otherwise current feed.

## Party controls and editing

Party remains a transparent strip of circular character portraits, HP, MP and an
AC badge, with a person silhouette for missing pictures. Click AC for its other
defenses. Drag the header to move it; right-click for Full, Compact, or Small.
Show Party controls your own visibility and does not change the published list.
Both GM and player clients start with the same default visible view in this
release; placement can differ to fit their screens.

The GM only needs Connect to edit for changing HP/MP. It opens a short sign-in
popup that closes automatically. Current resource edits retain administrator
verification, ownership-independent admin authorization for published characters,
and revision conflict checks. Enter or clicking away saves; Escape cancels.
The saving indicator ends when the common feed confirms the new revision.
Players receive the public values through the same feed with read-only controls.

No Battle, initiative tables, scene-added characters, token context actions or
token meters are included. Old tracker room data/widgets are cleaned up; real
scene images and site character data are preserved.

## Character Sheets

Each player still connects their own Cosmos account for editing their own sheet.
Dice+ is enabled in the same room and handles extension rolls, including separate
sheet popup windows. The Check Dice+ test button stays removed; readiness is
checked only when actually rolling. Cosmos records the same Dice+ faces and
validates formulas, modifiers and resource usage without a duplicate animation.

Both owlbear.rodeo and owlbear.app are allowed to embed the extension. Party must
be enabled in the room's Extensions menu, and everyone needs network access to
the Cosmos website. The owner confirmed the sign-in page opens for joining users.

Scoped edit grants remain memory-only with an eight-hour maximum. Every write
revalidates the original Cosmos login. No grants are stored in URLs, room
metadata, local storage or backups. Viewing Party requires no grant.

Build and source syntax checks were performed. Automated tests and multi-client
live-room checks were not run, at the owner's request. No measured latency claim
is made, and no database migration is added.
