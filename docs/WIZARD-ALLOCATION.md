# Score and allocation wizard

Creation: Identity → Race → Class → Class choices → Ability scores → Spells → Skills → Feats → Review.

Original scores remain editable without racial adjustments baked into the box. A separate race line and total show the effective value. Standard array/rolled score tiles can be dragged or selected by tap/keyboard, followed by an ability box; moving a tile clears its previous field and returns any displaced tile to the bank; each token can fill only one field. Touch dragging follows the finger, with tap/keyboard assignment also available. Manual/point-buy modes never display stale roll tiles. All cantrip/spell choices belong on the separate Spells screen after scores. The Comos creation policy reserves at least three first-level known spells, even with a negative INT modifier; a positive modifier adds to those three. Learning a spell does not grant casting eligibility.

Skill allocations use effective INT, minimum one rank per level, the class budget, the character-level rank cap, one trained class-skill +3 and automatic unconditional racial bonuses. All points must be allocated before committing a wizard build. Level up preserves prior ranks and uses the next budget; existing unallocated legacy ranks can be distributed at that time. The server validates the final allocation. Feat slots are reserved at odd character levels, starting at 1; a curated feat catalog is still pending.

The sheet up-arrow opens a confirmation dialog. Level up starts with the last supported class, includes +1 ability score only at multiples of four, then animated before/after HP and MP totals and a separate Skills screen. Confirmed level-up refills current HP and MP to their effective maxima. The MP table matches the official FFd20 MP System. Maximum first d6 and later 4 base HP remain the selected project policy.

## Boundaries still requiring source data

Only base Black Mage currently has a validated runtime adapter. The twenty discovered archetypes remain visible for reference but unavailable for automatic application: their exact replacement events, casting overrides and dependency graphs have not been verified. No arbitrary class is represented as a functioning multiclass option. Multiclass advancement needs per-class level history, independent progression/casting/learning tables, unioned proficiencies/class skills, summed MP pools and archetype-specific replacements. Source casting-ability mappings alone do not provide this information.

Requested casting mapping for future adapters: INT — Black Mage, Blue Mage, Time Mage; WIS — Astrologian, Druid, Geomancer, Ninja, White Mage; CHA — Bard, Dark Knight, Holy Knight, Illusionist, Red Mage, Necromancer, Summoner. Learning counts must come from each class, not a universal 3 + modifier assumption.

Navigation sits above each step. Alignment uses the nine standard choices. Race descriptions are folded into compact rows. Class skills are bold immediately; rank arrows and typed input clamp to total character level. Missing historical HP results use max-first/fixed-later defaults, preserving recorded results and current HP. New drafts use a fresh version namespace to avoid stale HP arrays and step order.

## Selection and sheet controls

Standard/alternate race groups begin open and can collapse. Learned spells are grouped by spell level. Pickers hide choices already used in other slots while retaining the current selection when swapping. Full stored description strings are rendered without shortening; older imported summaries still require complete replacement source text.

The skill editor clamps both remaining budget and character-level rank caps; sheet API rank edits reject overspending. The focused Skills panel no longer displays unused-point or formula commentary. Class MP, bonus MP, base HP maximum and BAB are not editable through the managed-sheet API or resource editor. Temporary adjustments remain separate.

Growth includes all base BAB/save values, even unchanged. Milestone score selection shows all six prior scores. Odd-level feat slots remain. Confirmed level-up now refills current HP and MP to effective maxima; ordinary edits still do not refill resources.

Star visibility, current-build edit, level-up and compact-window controls sit at the top right. Discord, themed bed recovery and resource settings remain beneath navigation. Inventory entries, fixed skills, resources and major cards can be favorited. Favorites persist through the owner/admin revision-checked sheet API. Side carousel cards center on first click; clicking the center card opens its sheet. List rows open directly; separate roster edit/open-sheet buttons are removed.

## Sheet interaction update — 27 October 2026

- Discord entry action sends complete stored description/details without spending resources. Dice/Use actions spend spell MP (default spell level; explicit spell cost override retained) or one configured ability usage. No formula means Use sends description; a dice formula sends only attack/dice results. The global Discord toggle governs roll/use delivery; explicit description sends always target Discord.
- Atomic, revision-checked receipts protect resource spending and idempotent retries. Insufficient MP, exhausted usage or invalid dice do not spend resources. Delivery failure retains the spent action/receipt and reports failure; it does not refund or silently resend. Long descriptions split into Discord-sized messages. Original source wording must already exist in stored data.
- Attack type supplies attack totals. Critical threats show Crit!, a separate confirmation attack and the original rolled damage total multiplied by the saved multiplier. This multiplication convention is the requested Comos behavior; no target AC is guessed or automatic hit confirmation claimed. Legacy extra_damage fields remain stored but new receipts use the single Dice Roll formula.
- Temp HP begins as Add temp HP; adding starts at 1, exposes minus/input/plus, and returning to zero collapses the controls. Negative temporary HP is clamped to zero.
- Equipment adds an Arms slot, preserving existing IDs and individually addressable accessory slots. Shared silhouette geometry supplies boxes, connectors and equipped-region overlays.
- Admin search updates on typing/deletion with stale-response suppression. Character-name matches expand the owner and filter its rows. A shopping link carries characterId; shop no longer offers a buyer chooser. Catalog and inventory categories use compact horizontal scrolling buttons.
- Install download icon is beside the profile control when the browser emits beforeinstallprompt; unsupported platforms retain Account instructions (including iOS Share → Add to Home Screen). Installed standalone mode hides it. Account sign-out follows Profile; Continue to Home is omitted there.

Validation: automated tests cover resource spending, replay, rollback, long description chunking, exhausted zero-formula usage, and server-side directory filtering. Local browser QA uses isolated synthetic responses, never production account data or Discord messages. Physical Android/iOS installation and live Discord delivery require device/account checks.

## Final layout pass — 27 October 2026

Rest now means 8 hours of rest plus 30 minutes meditation: HP gains total character level and MP gains caster level plus casting modifier for each verified casting profile, capped at maximum. Caster level and highest spell level are independent. Black Mage and the documented White Mage recovery example are covered; unknown class/archetype profiles explicitly report no automatic MP recovery until validated. A partial caster must provide its verified caster-level progression. This does not alter the separate full resource refill on confirmed level-up.

Creation starts with Standard array, and spell-level selection groups remain open after choosing. Confirmed ranks become permanent minimums for later advancement and edits. Advancement adds a class-trait review after class choices, marking new grants and resource/effect upgrades; non-spellcasting class definitions omit the spell screen. Only the existing base Black Mage adapter is currently enabled.

All sheet utilities are together at the top. Dice result popups are optional in Account and persist server-side. Attack and dice totals have separate dice; no attack means one die. Description sends show only a delivery notice; no-dice uses show Use. Catalog purchases animate the receipt's balance and show the deduction. Critical range and multiplier controls are dropdowns; All is the first category. The MP spell card shares live resource controls and shows the casting modifier.

Extraction v3 (COMOS_EXTRACTION_V3.md / COMOS_EXTRACTION_V3_SCHEMA.json / EXTRACTION_PROGRESS.json) defines full-text verification, per-class casting progression, usage/attack/damage mappings, upgrade events, source coverage and continuation checks. Races are re-extracted in batches of 3–5 in source navigation order, then one class family per batch. Existing summarized data is explicitly marked incomplete; this layout pass does not invent missing original paragraphs or enable unsupported classes/archetypes.
