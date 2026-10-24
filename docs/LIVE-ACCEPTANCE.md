# Live authentication acceptance — not yet run

These are the remaining evidence gates for Step 2.3/2.4. This checklist is prepared; unchecked items are not passed. Use authorized test accounts in a deliberately configured staging environment, without modifying the legacy site.

## Prerequisites
- [ ] Choose the intended Firebase project, confirm email/password and Google provider settings, and configure its authorized HTTPS domain.
- [ ] Configure Admin credentials securely on the native server; no credentials in chat, source, dist or ZIPs.
- [ ] Set the same HTTPS origin in the public build and API configuration. Serve live pages/API from that origin with the intended CSP and cookie behavior.
- [ ] Configure reverse-proxy per-client limits and request/body timeouts; verify direct clients cannot forge the trusted client address.
- [ ] Prepare two test users with no real campaign data and a documented cleanup procedure.

## Session and profile cases
- [ ] Email signup creates one provider account and one internal mapping; finishing the name enables continuation.
- [ ] Interrupt after provider signup, then sign in again: finish setup without another account or mapping.
- [ ] Refresh while profile is incomplete: setup resumes; do not expect unsaved text to persist.
- [ ] Repeat the completion request after a lost response: no duplicate or silent overwrite.
- [ ] Returning complete account restores the same identity; a second account cannot affect its profile.
- [ ] Invalid password/token, expired/revoked session, disabled provider account, wrong project and unavailable provider fail safely with appropriate feedback.
- [ ] All-device sign-out invalidates the current and copied sessions; verify provider revocation propagation rather than assuming instant completion.
- [ ] Password reset works for the intended email; nonexistent accounts receive equivalent interface messaging.
- [ ] Google popup works on Android; if blocked, feedback is actionable. Do not claim a redirect fallback until built and tested.

## Isolation and abuse cases
- [ ] Preview copy stays preview-only even if a live session cookie exists or mode/admin query flags are added.
- [ ] Preview forms make no provider/API calls, create no accounts and send no reset emails.
- [ ] Foreign-origin mutations fail; missing/duplicate cookies do not authenticate.
- [ ] Excess session/profile requests return 429 with Retry-After without invoking verification; requests recover after refill. Test this with controlled staging traffic, not a stress run against real accounts.
- [ ] Proxy users do not inadvertently share an unusably small client limit; process guard and trusted proxy behavior are measured together.
- [ ] Keyboard, screen-reader labels, phone keyboard, zoom and navigation are usable on actual devices.

Record dates, environment, expected/actual behavior and failures in VERIFICATION.md. Only then mark the corresponding acceptance items complete. This checklist does not authorize publishing, migrating real data or changing the legacy repository.
