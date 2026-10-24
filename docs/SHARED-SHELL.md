# Phase 1.3 — shared shell, Galaxy and install support (0.3.0)

## Result
Home, Lore, Characters, Account, Admin and wizard views use same-document navigation. The app header remains mounted across app tabs. Only the chosen route module loads; the sheet remains a separate document for its Owlbear boundary. Direct .html URLs and refresh remain valid. Back/Forward restore the route and recorded scroll position. Focus moves to main and a status region announces navigation. The static HTML remains the fallback when JavaScript is unavailable or a route module fails.

The landing header checks the server session with a small same-origin request and shows Account in place of Sign in/Sign up when authenticated. This is presentation only; server authorization is unchanged. Auth form listeners dispose on route changes, and the Firebase client module loads only on sign-in, sign-up or Account.

The supplied React Bits Galaxy shader is adapted to the existing module architecture without adding React or a second application framework. Parameters: density 1, glowIntensity 0.3, flareIntensity 1, starSpeed 0.5, mouse repulsion and click warp. Buttons/links/inputs do not trigger warp. Narrow touch devices use two layers and lower resolution. Animation pauses when hidden, honors reduced motion and includes a Pause stars control when WebGL is available. If WebGL is unavailable or lost, a static star background remains. The shader license/attribution is retained in licenses/react-bits-LICENSE.md.

Install Comos is in the footer of live pages. It uses the browser install prompt when available, otherwise gives Android browser-menu instructions. The manifest provides Home/Lore/Characters shortcuts and regular/maskable icons. Installation always requires the device user's confirmation; this is a PWA, not a Play Store package. Some browsers may create a home-screen shortcut instead. No app is installed remotely by this code.

A service worker caches only offline.html and uses it on navigation failure. Account pages, credentials, APIs and content are never added to caches. The app still requires internet for sign-in and saved data. Ghost pages keep connect-src none, do not check real sessions or register a service worker; route modules load as same-origin scripts. Switching between live and preview roots is a full document navigation.

## Verification
35 Node tests pass, including session-aware header state, route root boundaries, API exclusion from the service worker and required icon files. The cloud build succeeds. Browser QA covers app tab navigation with stable header, Back, direct refresh, Account controller mounting, install-help modal focus/close and Characters at a 320 px iframe viewport with no horizontal overflow. The QA browser has no WebGL context, so the static fallback was exercised; actual shader rendering, phone animation performance and native installation still need Android testing. User previously confirmed real phone login in 0.2.5; this release does not claim a newly completed provider login.

## What to test — Phase 1.3
1. Refresh the website after Railway redeploys. Tap Home, Lore, Characters and Account. The header should remain and there should be no document flash.
2. Use Android Back, then refresh Lore directly. Both should open the expected view.
3. Sign in, then tap the Comos brand. The public landing header should show the Account icon. Sign out and repeat: Sign in/Sign up should return.
4. Check the Galaxy background. Move the mouse or tap empty background; links/forms must remain usable. Pause/Resume stars if the control is available. Android reduced-motion/accessibility settings should stop animation.
5. Tap Install Comos near the bottom, or use Chrome menu > Add to Home screen > Install. Confirm on the phone and launch its new icon. Where supported, long-press for Home/Lore/Characters shortcuts. Test login in the installed window too.
6. With Comos installed, disconnect briefly and navigate/reload: see the reconnect notice, not cached account details. Reconnect and Try again.
7. Open Ghost mode and the sheet. Ghost stays signed out from real data; the sheet keeps its own focused header.

## Integration handoff
This is based on comos-cloud-test main commit 925174bc027f4a843088c8c34011d4a623c6c8f6. It intentionally does not merge the separate Home or Phase 4.1 artifacts from another chat. Preserve these shell/build changes when integrating those feature patches.
Changed shared layout/build/auth lifecycle/static MIME and headers/styles. New src/ui modules, src/effects/galaxy.mjs, public manifest/icons/offline/SW, licenses, tests/shell.test.mjs and generated dist route modules. No backend schema, data migration, Firebase settings or secrets changed.
