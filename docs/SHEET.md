# Focused character sheet

The owner requested the useful Mount Aetheria character sheet behavior with a minimal responsive Comos interface, shared admin/player editing, and a small future Owlbear panel. This replaces the read-only saved-data dump. It does not reintroduce Firestore, Ghost mode, the legacy iframe shop, calendar, chat, or the old layered scripts.

## Behavior

- Character, Combat, Skills, Inventory, Abilities, Spells and Notes are sections within the same page. Direct section links use `?characterId=…&section=combat`. Older sheet-inventory and sheet-abilities routes open the corresponding section.
- Character shows portrait when available, race, total and individual class levels, archetypes, ability scores/modifiers, identity details, and bio. Build edits use the existing wizard.
- Combat edits HP/current/max/temp, MP/current/class/bonus/max adjustment, base values, defense, attacks, saves, resistance text and weapons. Modifiers use floor((score−10)/2). Component formulas follow the supplied legacy sheet, including its CMB/CMD conventions; they are not a new universal rules engine.
- Skills keep imported names, specializations, ability, ranks, class-skill checkbox and misc bonus. A trained class skill receives +3. The formula is visible.
- Inventory preserves imported records and metadata, with quantity, equipment flags and currency/capacity edits. Equipped armor is not automatically converted into defense modifiers; those remain explicit sheet inputs, consistent with this migration boundary.
- Weapons, spells, active/passive/racial abilities, feats and skills support add/edit/delete. Expand an entry to render its description and relevant saved fields. Existing unknown fields survive edits. Catalog/source overrides remain retained but are not regenerated here.
- Active ability uses can be decremented. Rest confirms, recovers HP equal to total level (capped at effective max), restores MP, and refills active abilities unless their rest checkbox is off. This follows the old sheet's rest convention rather than assuming full HP.
- Spell casts can spend an explicitly entered MP cost. Automatic class progression, HP from levels, MP/bonus-MP tables and race/archetype replacement mechanics remain unported; existing/manual values are authoritative. No automatic effects are invented.
- d20 checks use the displayed bonus. Simple saved damage expressions can be rolled when expanded. Parsed dice are bounded (1–50 dice, 2–1,000 sides); no eval. Results are local to this sheet, with a `comos:sheet-roll` event for a future host adapter. They do not post to Owlbear or shared chat.
- Notes is one optional text field. The original saved notes remain; no calendar/shop/other-tools UI is loaded.

## Saving and admin sync

The owner and a server-verified Firebase administrator edit the same character record through the existing authenticated endpoint. Character tags, ownership, reserved Admin access and private unrelated fields are not writable through sheet patches. Every write validates an allowlist and executes with a revision check inside a transaction. No full client record replacement occurs.

Resource changes save on change and quick controls save immediately; dialogs and notes have Save buttons. Status shows Saving/Saved or an error. If another view saved first, the server returns 409. The dialog/input remains intact for copying; Refresh loads the newer version after discarding edits is confirmed. There is no silent last-writer-wins retry.

Foreground views check only the selected character revision every five seconds, returning a tiny `{unchanged:true,revision}` response when unchanged. Hidden views skip polling. Editors and unsaved fields pause updates; a response that overlaps local changes is not applied. Requests/timers are cancelled when leaving. Real cross-device Firebase sessions still need the owner's phone/PC check; synthetic two-view browser QA plus real HTTP session-mock tests cover this behavior without bypassing production auth.

## Lightweight panel boundary

Live sheet pages have a separate entry and stylesheet. They do not import the application shell, router, Firebase browser SDK, Galaxy/splash code, feed, Lore, or shop. Shared theme tokens remain supported. Only the active section is rendered; entry details are rendered on expansion. Saved character JSON is fetched once initially and again on revision change. There is no entire-collection subscription.

`compact=1` hides the outer header and uses the same controls at a narrow width. It remains normally authenticated. This is a standalone compact entry, not a completed Owlbear extension. An extension manifest/host adapter, room readiness, embedded authentication and token/resource authority must be implemented and verified in an actual room later. No SDK or room functionality is claimed by this delivery.

## Verification

115 automated tests pass, including formulas, preservation of imported fields, rest preferences, MP cost validation, owner/admin isolation, foreign-Origin rejection, revision conflict handling, small unchanged responses and transitive live module packaging. Stale pre-existing tests were corrected for the current route count, real control characters, native SVG avatars and SQLite row prototypes; application security assertions remain intact.

Browser QA used synthetic sample data, never a production bypass: 320px compact and desktop layout; no horizontal document overflow; HP edits; defense/quantity dialogs; two-view updates; a stale edit retained with conflict text. Final isolated stylesheet was visually checked. Actual Owlbear rooms, full FFD20 progression, physical-device touch and production-sized sheets have not been benchmarked.

Phone checks: refresh Comos → Characters → open your sheet → Combat → change HP and reload. Edit a defense value. Expand/edit an inventory item and test search. Use an active ability, roll a skill/save, and test Rest on a disposable/test character. Open the same character through Admin in another signed-in view; confirm its changes arrive within about five seconds. Open an editor in both views to confirm stale saves are blocked. Try Compact and the horizontal section navigation.

## Combat actions, live notifications and Discord update

Combat now puts HP/MP and Damage/Heal first, then weapons with Attack/Damage actions and shortcuts to spells/abilities, then defense, saves and base movement/initiative. Less-used attack/maneuver/resistance controls are collapsed. Calculation info controls show entered components. Rest moved into Recovery. Damage consumes temporary HP first; healing caps at effective maximum.

Selected character updates use an authenticated same-origin server-sent event stream carrying revision changes only. Streams reauthenticate on reconnect every 25 seconds, check owner/archive state, and are capped at four per user. Existing five-second foreground revision checks provide fallback. Unsaved edits and dialogs still pause applying remote changes; conflicts retain the input. Normal Refresh is hidden; Load latest appears for conflicts. Compact opens via an accessible ↗ icon.

Dice now execute on the authenticated server, with bounded expressions, per-user rate limiting and persistent idempotent roll IDs. The Send rolls to Discord checkbox defaults on for this user-requested behavior; off keeps the result out of Discord. Requests use the same existing worker relay from the legacy source, from the backend only, with character name, roll label, dice expression, individual results and total. No account email, UID, sheet dump or webhook secret is sent to the browser or Discord. Mentions in names/labels are neutralized. Delivery status is shown accurately; failed or ambiguous deliveries are not automatically retried. Direct channel receipt remains unverified until the owner makes a real roll. No test message was posted into the live channel.

118 tests pass, including damage/healing, initial authenticated SSE events, Discord payloads, server-side dice, failures and duplicate prevention. Local synthetic phone QA verified damage/temporary-HP behavior and AC formula dialogs. Full rules progression and Owlbear room integration remain deferred.

## Sword navigation and temporary HP

The main navigation now contains Character, a native SVG sword, Skills, Inventory and Notes. Under the sword are Combat, Abilities and Spells. Abilities has Active, Passive, Racial and Feats categories; only the selected collection renders and is searched. Existing section URLs continue working, with the selected ability category optionally stored in `ability=`. Proficiencies is retained under Feats.

Removed the redundant Damage/Heal buttons. HP keeps its existing plus/minus and direct input, with an always-visible editable Temp HP field beneath it, including when zero. Resource typing autosaves after a short pause or on change, batching pending fields so quick edits do not lose each other. Automatic selected-character sync, admin permissions and Discord rolls are retained. 119 tests pass; synthetic phone QA verified Temp HP saving and nested navigation.
