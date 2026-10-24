# Steps 3.1 and 3.2 — Account (0.4.0)

## Behavior
Display name saves on blur (leaving the field), after 1–80-character/control-character validation. Invalid/failed edits show a status; the UI does not claim a failed edit was saved. Profile photos preview on selection and upload automatically. JPEG/PNG/WebP inputs are limited to 3 MB and 16 megapixels; animated inputs and SVG/GIF/HEIC are not supported. The server checks the file signature and actual decoder format, applies orientation, crops to 512 × 512, re-encodes JPEG and strips input metadata. Remove photo saves immediately. Photos appear in the small Account icon.

The four two-colour circles are Cosmic, Ocean, Ember and Forest. A diagonal dash divides each circle, and the selected circle has a ring and aria-pressed state. Selection applies immediately and saves automatically. Splash cursor defaults off. Match effect colours to theme defaults on, applying the two-colour palette to Galaxy and Splash. Turning it off restores Galaxy's original palette and rainbow splash. Both preferences save automatically. Reduced motion disables splash and freezes Galaxy regardless of the saved switch value. Unsupported WebGL shows the static background and a concise splash availability message.

The supplied React Bits SplashCursor renderer is adapted without React. It loads only after splash is enabled. Touch devices use low quality, desktop uses medium; no intro animation is triggered. It cannot intercept taps or scrolling, pauses when hidden and releases GPU resources when disabled or replaced. Attribution/license is retained alongside Galaxy.

## Persistence and authorization
Firebase still provides identity only. Names, avatar references and user preferences are in SQLite; processed images live under MEDIA_ROOT, currently the Railway /data volume. Migration 002 adds a nullable avatar reference and a separate preferences table, preserving all existing user IDs, identity mappings and migration checksums. Legacy users.theme values remain compatible; the new four presets are stored in user_preferences.

/api/v1/account GET returns the verified session owner's current record. POST accepts revision plus displayName and/or the complete allowlisted preference object. Owner IDs and unknown fields are rejected. Updates increment the user's shared revision. Stale edits return 409 and require refreshing; no silent last-write overwrite or email merging. The client serializes name/photo/preference writes and coalesces rapid theme selections to the last choice, including a pending save when leaving Account.

/api/v1/account/avatar GET/HEAD reads only the session owner's current photo; POST accepts raw image bytes plus If-Match revision; DELETE clears the current avatar. No public media directory, arbitrary path or owner selector exists. Responses use no-store, nosniff and same-origin resource policy. Exact Origin and session checks precede writes; size/rate/concurrency limits apply. At most two image transformations run simultaneously. Replacement rolls back disk writes on revision/metadata failure and cleans up unreferenced prior avatars. Interrupted cleanup leaves metadata for later reconciliation. No API responses are cached by the service worker.

Ghost Account is a local in-memory preview, with no authentication, API writes or persistence. Names/preferences remain during same-document preview navigation; chosen photos are temporary and revoked when leaving Account. Ghost changes reset on refresh. Only UI/fixture code is copied to the portable dist; configured Firebase code is compiled only in dist-live.

## Verification
39 automated tests pass, including revision conflicts, field validation, private cross-user avatar denial, cookie/Origin checks, processed image dimensions/metadata, invalid file/size/pixel limits, avatar replacement/removal cleanup, queued client revisions and persistence after database reopen. Dependency audit reports zero vulnerabilities after pinning sharp 0.35.5.
Browser preview: two-colour controls, default-off splash, effect-colour switch, invalid/valid display-name feedback, cross-tab preference continuity, actual PNG file chooser/preview with no CSP error, and 320-pixel layout without overflow. WebGL is unavailable in this QA browser; actual splash rendering/performance and real authenticated phone edits still require device acceptance. Prior release phone login was confirmed by the user.

## What to test — 3.1 Profile
1. Sign in, open Account, change display name, then tap outside the field. Wait for Name saved.
2. Select a small JPEG/PNG/WebP. Check preview, Photo saved, and the Account icon.
3. Refresh, sign out/in, and confirm the name/photo remain. Open the installed app too.
4. Remove the photo; refresh and confirm the default icon returns.
5. Empty the name or choose an unsupported/oversized file: a clear error appears and the saved profile remains intact.

## What to test — 3.2 Theme/effects
1. Tap each circle. The colours change immediately and Saved appears without a Save button.
2. Switch tabs and refresh: the selected theme remains after your session restores. Test the focused sheet as well.
3. Splash should start off for existing accounts without prior preferences. Enable it, move/tap, disable it, and check normal scrolling/buttons still work.
4. Toggle Match effect colours to theme, then change a theme. Enabled uses the theme palette; disabled uses the original/rainbow palette.
5. Refresh and confirm both switches persist. Turn on Android reduced motion and confirm the visual effects pause.
6. If saving fails, use Retry saving for preferences. For a stale-edit message, refresh before editing again. Avoid repeated clicks after a rate-limit message.

## Integration handoff
Base: comos-cloud-test 30e171ef5a274f4749a71e7286a50f06f5167555. Adds backend/account, migration 002, src/account, shared preferences/effects manager, Splash adaptation, theme styles and account tests. Wires account routes into both cloud/local API bootstraps and account UI into the auth lifecycle. Adds sharp; retains native Node and disk media. Does not merge other-chat Home/Admin feature patches, import legacy data, change Firebase providers or alter old Mount-Aetheria/Dark Grasp projects.
