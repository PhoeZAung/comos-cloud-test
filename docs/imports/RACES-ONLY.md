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
- After shared prerequisites are published, restart race audit **Dwarf → Elvaan → Galka**, not Genome.
