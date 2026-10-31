# Races-only queue

This chat owns **race integration only**. Continue here separately from the shared `docs/imports/progress.json` queue, which another chat may update for classes and archetypes. Never reset `imports/active` or modify class/archetype implementations on this branch.

1. **Garif** — merged PR #34 and Railway deployment `88631e23` now SUCCESS, public assets and health verified. Signed-in character creation/save/reopen needs a real account and remains unverified.
2. **Garlean** — source-backed standard level-one implementation on `race/garlean-standard-20261031`. Restricted to Firearms (Simple), one tech Craft specialty, non-MP class compatibility and manual conditional effects. Pending CI and publication.
3. **Genome** — next race in archived website order.
4. **Gria** — next after Genome.

Half-Breed remains source-blocked until parent race feature/RP evidence is established.

## Shared wizard prerequisite · 2026-10-31

- This branch fixes duplicated high-INT choices: languages are shown **only** on the ability-score step when effective INT grants at least one, with per-race eligible choices.
- A dedicated FFd20 language reference lists all 49 distinct entries from the official Linguistics tables, plus a note that the list is supplemental to Pathfinder languages.
- Source-resolved Hume Highlander/Lunarian heritages swap the base racial ability adjustment vector and persist the correct scores in the saved character sheet; unaffected Hume bonus feat remains. Conditional heritage effects are manual. Other heritage combinations remain guarded until reviewed.
- Shared prerequisites published via PR #36 (`e3307f0`) and Railway SUCCESS; race audit restarted with **Dwarf → Elvaan → Galka**, not Genome.

**Dwarf current batch:** The four source-resolved heritage ability score vectors already exist. Review and integration tests now verify they replace, not stack, the standard bonuses and persist on reapplication. Existing high-INT Dwarf language options are activated only when Languages is active, and appear solely on the ability-score step. Other unreviewed alternate/conditional mechanics remain manual.

## Race replacement policy · 2026-10-31

This conversation now fixes **replacement behavior first** across every race in the runtime registry. Source-resolved *whole-feature* alternate mappings remove only the named original traits and install the alternate; descriptive choices such as Dwarf Mountain Familarity's terrain remain **on the ability card**, without extra wizard controls or false permanent AC. Unresolved/component-only replacements (including Saltbeard), incompatible MP restrictions, and unsupported choices determining automatic ability scores remain guarded. Starting heritage and alternate **selections** are permanent after save; descriptive subchoices can be recorded by the player on the sheet. No class or archetype rules modified. The unused `race/dwarf-mountain-familarity-20261031` experimental picker branch must not be merged.

**Dwarf Saltbeard** — source-verified component modification: replaces Defensive Training, Hatred and Stonecunning, *modifies* (does not remove) Greed. Greed's +2 Appraise applies only for treasure found in/under water, regardless of composition; +2 AC against aquatic/water creatures and +1 attack remain descriptive/conditional. Implemented through a narrow, source-ID-checked runtime modifier. All other unresolved/partial component operations remain blocked. Source definitions unchanged; no wizard added.

## Broad race-replacement review batch (2026-10-31)

Activated precisely identified **manual** whole-feature replacements across race definitions without creating more wizards. A source record marked manual only because its new benefit is situational can now replace exact standard traits; automatic sheet effects continue to require explicit, supported data. The Dwarf Saltbeard targeted Greed modifier remains the only approved component operation.

Heritage availability now uses source-backed structure: complete replacement mappings, no unresolved choice pool, and automatic constant score effects where a base racial score vector is replaced. This expands supported variant score vectors beyond Dwarf/Hume to correctly represented race heritages, while leaving manually encoded or unresolved ability-score vectors blocked. No editing existing characters' permanent heritage/alternate choices. The review checklist lives at `docs/imports/RACE-MANUAL-REVIEW.md`.

## Aegyl Wing-Clipped and editable movement (2026-10-31)

Wing-Clipped replaces Emotionless and specifically modifies the fly portion of Base Speed: fly 20 ft (poor), upward Fly DC 30, unchanged land 30 ft. Its +2 racial Bluff, Climb and Diplomacy skill bonuses are automatic and tested against saved sheet rows. No wizard picker added. Every character's Identity edit popup offers land, burrow, climb, fly (with maneuverability), and swim speed; available speeds show beneath land speed in Identity, with manual field edits preserved across saves and rule recompile. Ordinary Aegyl start with Fly 40 ft poor; Wing-Clipped Aegyl with 20 ft poor.
