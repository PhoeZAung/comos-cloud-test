# Comos — what to test

Current package: 0.2.0. Step 1.1 remains in review.

## Open on Android
Extract the ZIP into a fresh folder, then choose `comos-template/dist` as the root in your local HTTP server app. Open its HTTP address in your browser. Reload after replacing an older package. Do not open `index.html` through a `content://` link.

## Phone checklist
1. Open the public landing page. Expect the Comos name, cosmic image, introduction, and readable buttons.
2. Tap Ghost mode. Expect Home without a login prompt. Try Home, Lore, Characters, and the small Account control. All should open.
3. From Characters, open Character sheet. Try Overview, Inventory, Abilities, and Shop, then the Characters back link. Expect tabs to fit the phone width and the back link to return to the list. The sheet should have no Home/Lore navigation.
4. From Characters, open Create character. Try Sources → Identity → Race → Class & level, then Back. Expect page navigation only; forms and saved characters are still pending.
5. Rotate between portrait and landscape. At normal zoom, check for clipped text, overlapping controls, or a need to scroll sideways.
6. Increase browser page zoom or text size if available. Check that every control can still be reached and read. Pinch zoom is useful for readability but is not equivalent to desktop 200% layout zoom.
7. Refresh while on a sheet section or wizard page. Expect that same page to load directly without login.

The “Coming soon” messages are expected. There are no working sign-in, save, post, or character-creation forms yet.

## Keyboard and precise zoom (when available)
- Use Tab from the top of the page: “Skip to content” should appear with a visible focus outline. Press Enter to move to main content; subsequent Tab presses should reach its links.
- Tab and Shift+Tab through navigation; each link should visibly show focus. Enter should activate it.
- Set browser zoom to 200%. Verify landing, Characters, wizard, and sheet controls remain readable and reachable; reset to 100% afterward.
- At a 320 px viewport, verify all pages have no horizontal page overflow. These checks have not been completed in the current session.

## Report a problem
Tell me the page, what you tapped, what happened, and what you expected. Include a screenshot if useful. You can simply report “phone checks passed” when everything works.

## Developer checks
Run `npm test` to generate the static site and check preview isolation, local references, and HTTP routes. Automated checks do not replace the visual and keyboard review above.

## Step 2.1 update: what to test/review
This is a source-audit update, with no new functional login screen.
- Open Sign in and Sign up in Comos: both should still show their Step 2 placeholder and offer Ghost mode. No real credentials are needed.
- Ghost mode should still open Home without login.
- Review `docs/AUTH-AUDIT.md`: the planned methods are email/password and Google, with password reset and a display-name/profile setup stage.
- Report if your familiar old-site login process differs from that description. Do not send passwords or verification codes.

Next implementation slice: Step 2.2, a local API with SQLite migrations and repository interfaces. Real sign-in remains Step 2.3; phone layout/keyboard/zoom acceptance remains open.

## Step 2.2 update: what to test
On your Android static preview, Ghost mode and all page links should work as before. Sign-in/sign-up remain placeholders; this update adds backend foundations rather than new screen interactions.

On a machine with Node.js 24+: run `npm run api`, open `http://127.0.0.1:4174/api/v1/health`, and expect status `ok` and database `ready`. Open `/api/v1/users` on that same address and expect `authentication_required`. Stop and restart the API; health should still report schemaVersion 1 without errors. The Android static HTTP app does not run these API commands.

`npm test` covers restart persistence, ownership checks, stale edits, migration rollback/history checks, bounded media paths, denied unauthenticated API access, and the original preview checks. Next: Step 2.3 authentication/session integration.

## Version 0.2.1 — session boundary
On Android, open Ghost mode and visit Home, Lore, Characters and the sheet; styling and navigation should be unchanged. Sign in/Sign up remain placeholders. Do not expect real login yet. Developer: npm test runs 14 tests, with synthetic auth proofs. npm run api still reports authentication not_configured. Next pass connects real SDK/configuration and UI before phone login testing.

## Version 0.2.2 — forms on Android
Extract the new ZIP into a fresh folder and point your local server at its dist folder. Refresh the browser.
1. Sign in: submit empty fields or an invalid email. Expect field errors and focus on the first invalid field.
2. Enter sample@example.com and a sample password. Tap Show/Hide; only the visibility should change. Check sign-in form should show “Form looks good” and stay on the page without logging in.
3. Sign up: try fewer than 8 password characters, then two different passwords. Expect helpful errors. Matching sample passwords should pass the local check without creating an account.
4. Forgot password: check an invalid and then valid sample email. Nothing should be emailed.
5. Google remains disabled and labelled Coming soon. Ghost mode should still open Home; all navigation remains accessible.
6. On a narrow phone, check that fields fit, buttons are easy to tap, the keyboard does not hide the active input, and zoom remains usable.

Use sample details only. If Check form stays disabled, confirm your local server sends .mjs as JavaScript and open its http:// URL, not content://. Actual Android behavior and visual browser QA remain user checks; automated tests do not establish them.

## Version 0.2.3 — profile setup
1. Extract the new ZIP and serve its dist folder. Open Sign up, then expand Preview profile setup.
2. Submit a blank or spaces-only display name: expect an error and focus on the field.
3. Enter Star Explorer and check the form: the error should clear and a preview-only confirmation should appear.
4. Refresh: sample text should reset because preview saves nothing. Ghost mode and other routes must still work.
5. Check the expanded panel on your phone for horizontal scrolling and comfortable tapping.

Backend resume behavior was tested here with synthetic accounts and temporary SQLite storage; you cannot test real saved profiles in the static phone preview. A real login test needs the configured live environment in LIVE-AUTH.md.

## Version 0.2.4 — throttling and planning
Phone: no new visual feature; Ghost navigation and profile form checks should behave as before. Open docs/MIND-MAP.md for the work split and docs/INTEGRATION-PACKET.md for a drafting prompt. API throttling was tested here with synthetic requests and a fake clock; the static phone preview cannot exercise it. In a later configured staging environment, verify excess auth requests return 429/Retry-After, stop before another attempt, and confirm requests recover after refill. Do not load-test real Firebase accounts casually.
