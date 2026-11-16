# Kingmaker NPC Codex (First Edition) — source-review tracker

## Source and publishing boundaries

Source: user-supplied **Bestiary.pdf**, Chapter 2: NPC Codex, beginning on printed p. 66. **Only the first 10 of 105 NPC Codex entries have now been reviewed against the actual PDF.** The 105 Bestiary creatures remain source-reviewed and live in QNAP following the separate successful import. Hazards remain deferred; seven companions remain auto-staged but unreviewed.

| Category | Total | PDF reviewed | Unreviewed | Live QNAP import |
|---|---:|---:|---:|---|
| Bestiary | 105 | 105 | 0 | User confirmed 105 created |
| NPC Codex | 105 | 10 | 95 | **Do not import yet** |
| Hazards & Traps | Deferred | 0 | — | Deferred |
| Companions | 7 | 0 | 7 | **Do not import yet** |

NPC catalog progress bars now measure **source-reviewed / total**, not just raw auto-staged entries; NPC Codex shows 10/105 after the next QNAP code publication.

## Reviewed batch 001–010

| # | NPC | Printed p. | PDF p. | Source-specific correction |
|---:|---|---:|---:|---|
| 1 | Aecora Silverfire | 67 | 68 | Removed column junk from gear; restored domain spells, actual attack counts and CMD trip exception |
| 2 | Agai | 67–68 | 68–69 | Normal Small and Enlarged variants, 87/117 HP; separate weapon routines and alternate stats |
| 3 | Akiros Ismort | 68 | 69 | Rage reflected in stats, armor-adjusted movement, bow critical and clean gear |
| 4 | Akuzhail | 68–69 | 69–70 | Poison, curse, rattle, death-bloom rules, immunities, five attacks and DCs |
| 5 | Alasen | 69–70 | 70–71 | Fixed garbled AC and HP, finished rogue talents and gear, conditional rakes |
| 6 | Ameon Trask | 70 | 71 | Full feats, dual-short-sword iterative routine and alternative bow routine |
| 7 | Annamede | 71 | 72 | Separated bard spells, performances, languages and gear |
| 8 | Armag | 71–72 | 72–73 | Kept intelligent sword Ovinrbaane's artifact powers out of Armag's own magic; three alternative weapon routines |
| 9 | Auchs | 72 | 73 | Removed next character's heading from gear, confirmed stats |
| 10 | Avinash Jurrg | 72–73 | 73–74 | Split innate and bard spells, complete gear, regeneration 5 (fire/acid) |

## Technical implementation

- Raw source file: src/data/kingmaker/npc-codex-auto-batch-001.mjs (unchanged).
- Reviewed overrides: src/data/kingmaker/npc-codex-reviewed-001-010.mjs.
- Catalog merges only matching NPC Codex slugs and marks those **10** as source-reviewed, without changing the 105 Bestiary overlays, existing manually managed NPCs or companions.
- Agai's enlarged form remains in entry.variants and survives the Cosmos NPC adapter as npcVariants.
- The standard chapter-scoped importer must continue to refuse importing the 95 unreviewed NPCs. **Do not bypass source review or run a live QNAP NPC import yet.**
- Obsidian Markdown export will follow chapter imports and QNAP publication as previously planned.

## Next batch

NPC Codex 011–020, beginning with **The Beast** (printed p. 73 / PDF p. 74), will be a separate review batch. Continue to check alternate forms, abilities spanning columns and spell headings.
