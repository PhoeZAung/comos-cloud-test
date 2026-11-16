# Kingmaker NPC and companion source review — November 16, 2026

The Kingmaker Bestiary (First Edition) content is split into Cosmos NPC catalog tabs. It contains 105 Bestiary creatures, 105 NPC Codex characters and seven named companions; Hazards & Traps are deliberately deferred.

| Chapter | Staged | PDF-reviewed | Live QNAP records (confirmed) |
|---|---:|---:|---|
| Bestiary | 105 | 105 | 105 created earlier per GM confirmation |
| NPC Codex | 105 | 105 | Not yet imported |
| Companions | 7 | 7 (14 level progressions) | Not yet imported |
| Hazards & Traps | Deferred | Deferred | Deferred |

## Review and code integration

- The first ten NPCs were previously source-reviewed on `main`; remaining NPCs 11–105 are in the ten reviewed modules `npc-codex-reviewed-011-020.mjs` through `npc-codex-reviewed-101-105.mjs`.
- All seven companion records are in `companions-reviewed-001-007.mjs`; each preserves both printed progression stat blocks (1st and higher levels). Ekundayo's Dog animal companion remains a distinct stat note attached to his level-six progression, not an eighth top-level companion.
- `catalog.mjs` applies the reviewed overlays by stable source key without modifying the raw extraction, unrelated NPCs, or the existing Bestiary.
- All chapter-scoped import defaults remain guarded by `npcVerified`; importing an unreviewed source entry without an explicit bypass remains forbidden.
- `hpCurrent` is kept distinct from maximum HP for source-reviewed NPCs that need it; companion alternative levels carry their own HP in `npcVariants`.
- Local cumulative NPC verification: 78 tests passed. Companion overlay verification: 2 tests passed. Full Cosmos CI must run on the consolidated branch before merging.

## Publishing sequence — do not skip

1. Merge the reviewed GitHub branch only after complete repository tests and cloud build pass.
2. Deploy the **exact merged commit** to QNAP via the documented commit-pinned procedure in `docs/QNAP_PHONE_DEPLOY.md`. GitHub merges alone do not update the NAS.
3. Before importing new records, back up `/data/comos.sqlite` to a safe, verified path. Use chapter-scoped **dry runs**, `npc-codex` first and `companions` second, with the owner ID already used for the Bestiary import.
4. Stop if the preview reports `existingNameConflicts`, ambiguous records, or unreviewed entries. Preserve existing manually managed NPCs; resolve conflicts before proceeding. Do not use a blanket overwrite or an unreviewed-entry bypass.
5. Import only these two chapters after clean previews and explicit backup/confirmation, then verify counts and data in the three catalog tabs. The Bestiary 105 already on QNAP must remain unchanged.
6. Export Obsidian Markdown separately after the completed QNAP imports.

**Status:** the reviewed content exists in GitHub branch form; this documentation is not a claim that the new code or records have already been deployed to QNAP.
---

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


