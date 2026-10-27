# Score and allocation wizard

Creation: Identity → Race → Class → Class choices → Ability scores → Spells → Skills → Feats → Review.

Original scores remain editable without racial adjustments baked into the box. A separate race line and total show the effective value. Standard array/rolled score tiles can be dragged or selected by tap/keyboard, followed by an ability box; moving a tile clears its previous field and returns any displaced tile to the bank; each token can fill only one field. Touch dragging follows the finger, with tap/keyboard assignment also available. Manual/point-buy modes never display stale roll tiles. All cantrip/spell choices belong on the separate Spells screen after scores. The Comos creation policy reserves at least three first-level known spells, even with a negative INT modifier; a positive modifier adds to those three. Learning a spell does not grant casting eligibility.

Skill allocations use effective INT, minimum one rank per level, the class budget, the character-level rank cap, one trained class-skill +3 and automatic unconditional racial bonuses. All points must be allocated before committing a wizard build. Level up preserves prior ranks and uses the next budget; existing unallocated legacy ranks can be distributed at that time. The server validates the final allocation. Feat slots are reserved at odd character levels, starting at 1; a curated feat catalog is still pending.

The sheet up-arrow opens a confirmation dialog. Level up starts with the last supported class, includes +1 ability score only at multiples of four, then animated before/after HP and MP totals and a separate Skills screen. Current resources are not refilled. The MP table matches the official FFd20 MP System. Maximum first d6 and later 4 base HP remain the selected project policy.

## Boundaries still requiring source data

Only base Black Mage currently has a validated runtime adapter. The twenty discovered archetypes remain visible for reference but unavailable for automatic application: their exact replacement events, casting overrides and dependency graphs have not been verified. No arbitrary class is represented as a functioning multiclass option. Multiclass advancement needs per-class level history, independent progression/casting/learning tables, unioned proficiencies/class skills, summed MP pools and archetype-specific replacements. Source casting-ability mappings alone do not provide this information.

Requested casting mapping for future adapters: INT — Black Mage, Blue Mage, Time Mage; WIS — Astrologian, Druid, Geomancer, Ninja, White Mage; CHA — Bard, Dark Knight, Holy Knight, Illusionist, Red Mage, Necromancer, Summoner. Learning counts must come from each class, not a universal 3 + modifier assumption.

Navigation sits above each step. Alignment uses the nine standard choices. Race descriptions are folded into compact rows. Class skills are bold immediately; rank arrows and typed input clamp to total character level. Missing historical HP results use max-first/fixed-later defaults, preserving recorded results and current HP. New drafts use a fresh version namespace to avoid stale HP arrays and step order.

## Selection and sheet controls

Standard/alternate race groups begin open and can collapse. Learned spells are grouped by spell level. Pickers hide choices already used in other slots while retaining the current selection when swapping. Full stored description strings are rendered without shortening; older imported summaries still require complete replacement source text.

The skill editor clamps both remaining budget and character-level rank caps; sheet API rank edits reject overspending. The focused Skills panel no longer displays unused-point or formula commentary. Class MP, bonus MP, base HP maximum and BAB are not editable through the managed-sheet API or resource editor. Temporary adjustments remain separate.

Growth includes all base BAB/save values, even unchanged. Milestone score selection shows all six prior scores. Odd-level feat slots remain. Confirmed level-up now refills current HP and MP to effective maxima; ordinary edits still do not refill resources.

A shared toolbar sits beneath all navigation tabs, with star-control visibility, current-build edit, level-up, Discord and vampire recovery controls. Inventory entries, fixed skills, resources and major cards can be favorited. Favorites persist through the owner/admin revision-checked sheet API. Character cards open the sheet directly; roster edit/open-sheet action buttons are removed.
