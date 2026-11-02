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
under Owlbear and the same Cosmos origin. Only the connection page uses an opener
policy that preserves its same-origin, nonce-bound connection to the extension.
