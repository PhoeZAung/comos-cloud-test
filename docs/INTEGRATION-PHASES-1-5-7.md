> **Historical snapshot:** The Step 1 Home dashboard below was replaced by a feed-only layout in [INTEGRATION-PHASES-5-6.md](INTEGRATION-PHASES-5-6.md). Follow the newer guide for current testing.

# Comos GitHub integration — Home + Character Cards

Date: 2026-10-24. Target: PhoeZAung/comos-cloud-test. This update preserves the existing Firebase auth and backend administrative implementations (Steps 4.1, 4.2, 4.3). Only Home and Character list presentation and Ghost preview demos are added; no backend permissions or account data are changed.

## Phase numbers and exact tests

- **1.2 / 1.3 — Home design:** Open `/home.html`. Check the nebula header, Explore lore / My characters buttons, quick paths and a clear empty state for worlds and activity. Test navigation and refresh.
- **5.1 (UI scaffold only) — Feed:** Home says activity is coming soon. Do **not** expect real posts or memberships. `/compose.html` is still a placeholder. Confirm the + button opens it; no data should be saved.
- **4.1–4.3 — Admin regression:** From Characters > Admin Panel, a genuine admin should continue to see Character controls, Item controls, and Groups. Ordinary users must not gain access, even if they manually type an admin URL. Backend checks remain unchanged. DO NOT install our older mock Groups patch.
- **7.1 — Character cards:** Open `/preview/characters.html` (Ghost). Check 15 sample characters paged 6 per page; Next, Previous, and the create link.
- **7.2 — Card details:** Check initials, name, level/race/class summary; portrait opens sheet placeholder. Buttons should be keyboard reachable and no extra View button is present.
- **7.3 — Edit / Copy / Delete:** Rename a fixture card; Copy creates a new ID; Delete prompts confirmation. Refresh should reset all fixtures. Test loading, empty, error states. Real copy/delete is **not** implemented.
- **7 live safety:** Open `/characters.html` while signed in and signed out. It should explicitly say player cards are still being connected—not show sample characters. Admin link should be visible only after server-admin check.
- **1.1 — Phone:** Check both routes on 320px and 390px phone widths and at 200% zoom for no horizontal scrolling or clipped controls. Visual browser automation was blocked in this environment; manual review is required.

## File manifest

New: `src/features/home/dashboard.mjs`, `src/features/characters/cards.mjs`, `src/preview/home-ui.mjs`, `src/preview/characters-ui.mjs`, `tests/home-dashboard.test.mjs`, `tests/character-cards-ui.test.mjs`, `docs/INTEGRATION-PHASES-1-5-7.md`.

Updated: `src/pages/home.mjs`, `src/pages/characters.mjs`, `src/ui/shell.mjs`, `scripts/build.mjs`, `src/styles/site.css`.

Untouched: `backend/**`, `src/auth/**`, `src/account/**`, `src/ui/groups.mjs`, `src/ui/character-admin.mjs`, `src/ui/items.mjs`, all SQL migrations and the older `PhoeZAung/Mount-Aetheria` repository. Do not overwrite these from older preview ZIPs.

## Verification boundaries

Seven focused, dependency-free Node tests passed locally. The full current repository suite requires its production dependency/runtime environment and is not claimed to have run here. GitHub integration and Railway auto-deployment are distinct from backend authentication/real-service verification. No Railway connection is required for this handoff.