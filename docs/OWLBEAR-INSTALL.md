# Install Cosmos Character Sheets in Owlbear

The extension uses your existing Cosmos accounts and player-owned characters.
It adds an embedded sheet and sends rolls to Dice+ in the current Owlbear room.
This is a first integration build; it has not been validated in a real room.
No automated tests were run for this release, at the owner's request.

## 1. Publish this source release to QNAP

The live QNAP app must contain this extension release before the install URL
will work. Merely pushing a branch or adding a manifest to Owlbear does not
update the NAS. Use the exact extension commit SHA supplied with the release.

In QNAP SSH, paste the following, replacing `EXTENSION_COMMIT_SHA`:

```sh
SHA=EXTENSION_COMMIT_SHA
BASE=/share/Service/Container/Cosmos
curl -fL "https://raw.githubusercontent.com/PhoeZAung/comos-cloud-test/$SHA/scripts/publish-owlbear-qnap.sh" -o "$BASE/publish-owlbear-$SHA.sh"
sh "$BASE/publish-owlbear-$SHA.sh" "$SHA"
```

The helper downloads that exact revision, builds a candidate image, refuses
database schema changes, creates/verifies a live database/media backup, preserves
the old image, and recreates only `cosmos-app`. It restores the previous code
image if startup fails. No test suite, other NAS services, or Tailscale settings
are changed. A health response is not proof of successful in-room integration.

Wait for `COSMOS OWLBEAR RELEASE IS LIVE` before adding the extension.

## 2. Add the extension manually

1. Sign in to Owlbear Rodeo and open your profile's Extensions area.
2. Choose **Add Extension** and paste this install link:

   https://cosmos-web.burmese-barbel.ts.net/owlbear/manifest.json

3. Open your room, then **Extras → Extensions** and enable **Cosmos Character
   Sheets**. Existing rooms need the new extension enabled explicitly.
4. Add/enable **Dice+** in the same room:

   https://dice-plus.missinglinkdev.com/manifest.json

5. The Cosmos star action appears in the room's action bar.

Official installation guide: https://extensions.owlbear.rodeo/guide
Dice+ documentation: https://dice-plus.missinglinkdev.com/learn-more#extension-integration

## 3. Connect each player's account

1. Each player opens the Cosmos star action and clicks **Connect Cosmos account**.
2. Allow the Cosmos popup. If necessary, click **Sign in to Cosmos**, sign in with
   their own existing account, then return to the connection window and click
   **Check sign-in**. Complete their Cosmos profile if requested.
3. Keep the small connection window open. It can sit behind Owlbear.
4. Back in Owlbear, select their character. Only characters owned by that Cosmos
   account are listed, including when the connected account is a Cosmos admin.
5. Click **Check Dice+**, then use the sheet's normal roll buttons.

Roll visibility can be Everyone, Only me, or Me and GM. Dice+ controls the room
dice, skins, animation, and result popup. The sheet shows the same recorded
result; Cosmos does not make a second random roll. Normal rolls on the Cosmos
website continue to use Cosmos dice themes. Discord delivery starts off for an
embedded sheet and can be enabled explicitly in Main settings.

If the connection window closes or the extension reloads, reconnect. Each
player must sign in as themselves; do not share the GM's Cosmos login.

## Panel size and separate sheet tab

The panel starts at a phone-sized 390 × 640 pixels, capped to leave space in the
Owlbear viewport. Open **Account & panel size** for **Phone**, **Wider**, or custom
width/height controls. Drag the bottom-right corner to resize; the focused corner
also supports arrow keys (Shift takes larger steps). This browser remembers the
chosen panel size. Account controls collapse when opening a character.

After selecting a character, **Open in new tab** opens its sheet in a normal
browser tab. Clicking again focuses that tab; selecting another character and
clicking the button reuses it. Dice+ rolls still go through the original Owlbear
room, so keep the room and Cosmos connection window open. Reloading the room or
extension disconnects this tab; reconnect and reopen the sheet from the panel.

## Optional: Cosmos Party Status

This is a separate extension; keep Cosmos Character Sheets and Dice+ enabled.
After publishing this release, add the following manifest in Owlbear Extensions
and enable it in the room:

https://cosmos-web.burmese-barbel.ts.net/owlbear/party/manifest.json

1. In **Cosmos Admin**, expand a player. Click the new **status-card icon** beside
   a character. Purple means that character is shown; click again to hide it.
   New and imported characters start hidden. Up to 40 characters can be selected.
2. In the Owlbear room, the GM opens **Cosmos Party Status** (the portrait-card
   icon), then **Connect Cosmos admin**. Sign in with the Cosmos administrator
   account and keep this connection window open. This connection is separate
   from each player's character-sheet connection.
3. Cards appear for everyone with the extension enabled. They use the character's
   portrait, with a person silhouette when no portrait is saved. The user/account
   profile picture is never used. Each card shows name, current/max HP and MP,
   temporary HP when present, and AC. Click **AC** for Touch, Flat-footed, and CMD.
4. Change HP, MP, equipment, or defenses on the actual character sheet. Saved
   values flow to the cards on the next sync (normally about two seconds). The
   cards are read-only; clicking their AC only expands its details.
5. **Show cards**, **Hide cards for me**, and **Card position → Left / Right**
   control only your own overlay. The admin icon controls which characters are
   shared for the room. **Stop sharing** clears this room's cards for everyone.

Only the enabled characters' status projection and small character-portrait
thumbnails are shared with this Owlbear room. Full sheets, user profiles,
account sessions, credentials, notes, and inventories are not shared through
this extension. The feed API and portrait API require a Cosmos administrator
session; no public roster endpoint or new database migration is added. Portraits
travel separately from room metadata to avoid filling Owlbear's metadata space.

If the GM disconnects, cards disappear after a short expiry (up to 45 seconds).
After reloading the room, reconnect the GM. Admin visibility is saved in Cosmos,
so the selected characters return automatically after connecting. These
selections apply wherever this administrator connects a Party Status feed.

The sheet extension also has a new illustrated book-and-star icon. Its toolbar
action uses a transparent book silhouette, and Party Status uses a portrait-card
silhouette, so the two actions remain distinct under Owlbear's icon tinting.

## Limits and troubleshooting

- The connection window is intentional: it keeps normal Firebase/HttpOnly
  sessions on the Cosmos website, where third-party-cookie restrictions do not
  prevent login. No Firebase tokens, passwords, or session cookies are put in
  room metadata, URLs, local storage, or Dice+ broadcasts.
- If no characters appear, check that the player signed in to the right Cosmos
  account. The QNAP database is used after deploying; local development copies
  do not appear in production.
- If Dice+ is unavailable, no fallback random roll is silently committed. Enable
  Dice+, check its readiness, and retry. A timed-out Dice+ roll may still be in
  Dice+ history; the sheet reports that it has not committed resource usage.
- Only the connected player's sheets and preference API are proxied. Admin
  panels, private backups, arbitrary URLs, and account administration are blocked.
- Sheet editing and resources use the existing server ownership/revision checks.
  Build editing and other website links open the normal Cosmos website in a
  separate tab. In-frame deletion and standalone pop-out controls are hidden.
- Embedded sheets poll normally instead of opening a cookie-authenticated SSE
  stream. Leaving the room or reloading the action can require reconnection.
- Dice+ is a client-side provider, not cryptographically attested server RNG.
  Cosmos validates face counts, bounds, expressions, modifiers, criticals and
  resource costs and marks saved receipts as `owlbear-dice-plus`.

## Implementation references

- Owlbear manifest: https://docs.owlbear.rodeo/extensions/reference/manifest/
- Owlbear broadcast API: https://docs.owlbear.rodeo/extensions/apis/broadcast/
- Dice+ public protocol: https://dice-plus.missinglinkdev.com/README.md

All Owlbear SDK code is bundled locally. The extension adds no new authentication
tokens or database migrations. Framing is allowed only for the extension routes
under Owlbear and the same Cosmos origin. The connection and extension sheet pages
use an opener policy that preserves their same-origin, nonce-bound connections to
the extension.
