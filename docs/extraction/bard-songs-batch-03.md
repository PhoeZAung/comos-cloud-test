# Bard — songs and jingles extraction, batch 03 (levels 0–2)

Official current index: https://finalfantasyd20.com/magic/spells-by-class/bard/
Bard rules: https://finalfantasyd20.com/classes/core-classes/bard/
Check date: 2026-10-28

## Imported
- `rules/classes/bard-songs.json` provides 77 distinct source-indexed options: **11 level-0 jingles**, **30 level-1 songs**, **36 level-2 songs**.
- Each entry has its own stable ID, level, brief paraphrased effect summary, `normal` or `maintained` classification and source index locator.
- Every effect is marked `automation:manual`. This data does not grant passive sheet bonuses.
- Validator / choice gating in `src/features/characters/rules/song-contract.mjs`: correct 0–2 coverage, unique IDs, never claim unextracted 3–6 are complete, level and Charisma eligibility, separation of jingles versus songs, no duplicated known-song selections.
- Tests in `tests/bard-songs-extraction.test.mjs`. The class JSON points at the staged catalog, without enabling Bard in the wizard.

## Song acquisition and upgrading
- Bard begins with `3 + CHA modifier` level-1 songs; every additional Bard level grants 2 more songs of eligible levels.
- Bard begins with two level-0 jingles, then learns one extra at levels 5, 9, 13 and 17. Jingles do not cost MP and do not consume learned-song slots.
- CHA must be at least `10 + song level`; song DC is `10 + song level + CHA modifier`. Highest usable song levels by Bard class level are read from the official 20-level Bard table.
- Maintained songs need free-action upkeep and normally only one maintained song can run. Medley is a separate Bard class feature that expands this limit at later levels. Maintain/re-target/saving-throw interactions are **not** automated.
- Named higher-level variants (e.g., Army's Paeon II and III) are **separate learned songs**, not upgrades that replace the first known song. This differs from persistent class features such as Inspire Courage, which improve under one stable feature ID.

## Remaining verification blockers
1. Extract Bard song levels **3–6** and update `extractedLevels` / `review.coverage` only after verifying current source tables.
2. Read the full individual song descriptions to validate exact MP, action, duration, type, range, saves, spell resistance, interactions and any source-index ambiguities. Short index summaries are not comprehensive rules.
3. Implement Bard class-aware spell/song learning, buying Orchestrion Rolls, CHA bonus-MP, maintained-song/Medley state, MP consumption, song lists and Jingle options in the **save and level-up adapter**.
4. Implement remaining Versatile Performance option catalog and class-specific choices; keep archetypes independently staged.
5. Generate the human-readable Bard class review and resolve any ambiguous mechanics before approval.

Bard is **staged and disabled**, not approved; existing live Archer and Black Mage handling remains unchanged.
