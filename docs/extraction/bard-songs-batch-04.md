# Bard — song index completion, batch 04 (levels 3–6)

Official current song index: https://finalfantasyd20.com/magic/spells-by-class/bard/
Checked: 2026-10-28. Supersedes the *coverage status* of `bard-songs-batch-03.md`.

## Coverage
| Song level | Source-indexed entries |
|---|---:|
| 0 — Jingles | 11 |
| 1 | 30 |
| 2 | 36 |
| 3 | 33 |
| 4 | 23 |
| 5 | 24 |
| 6 | 19 |
| **Total** | **176** |

`rules/classes/bard-songs.json` now contains the complete 0–6 Bard **index**, each with a canonical distinct ID, source-index locator, short paraphrase, normal/maintained flag, and manual-only automation.

## Critical distinction: class feature upgrading vs learning songs
Persistent class abilities such as **Inspire Courage** retain one ID and apply level-based *upgrades* to that ability.
Songs such as **Army's Paeon**, **Army's Paeon II** and **Army's Paeon III**, by contrast, are distinct songs with distinct song levels. Learning the higher-tier song does **not** automatically replace or upgrade the Bard's previously selected song.

## Source-backed rules available to implement later
- Starting learned songs: `3 + CHA modifier`, all 1st-level.
- Later learned songs: two new songs per Bard level, subject to Bard max song level and CHA >= `10 + song level`.
- Jingles: two at level 1, one more at Bard 5/9/13/17; no MP cost.
- Standard maintained-song capacity is one; Bard's Medley class feature changes the cap in level-dependent steps.
- Bonus MP based on Charisma must use the official MP table. MetaSong cost, spell/song cancellation and all maintained effects still need full review.

## Still NOT playable, approved, or automatically applied
Completing the index is NOT the same as extracting full individual **song descriptions**.
The following require separate work:
1. Read each full song page and verify action, MP cost, range, target, duration, saves, spell resistance, descriptors, effect and level-based scaling.
2. Build songcasting and maintained-song state, track slots/learning and Orchestrion Rolls, implement Charisma/MP checks and integrate Bard character save + level-up.
3. Resolve special mechanics for Medley, Finale songs, Harmonic Chorus, bardic performance interactions, multiple songs, metasong talents and situational buffs.
4. Extract the remaining Versatile Performance options and verify talent prerequisites.
5. Review the text report and keep the Bard class disabled until its verified specialized adapter passes gameplay tests.

Validators and regression tests: `src/features/characters/rules/song-contract.mjs`, `tests/bard-songs-extraction.test.mjs`.
Class state remains `staged`, with `review.state = needs_review`, no live adapter. Existing Archer/Black Mage remains unaffected.
