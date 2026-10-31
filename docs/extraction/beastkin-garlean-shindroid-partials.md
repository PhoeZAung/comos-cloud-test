# Three-race partial replacement batch: Beastkin, Garlean, Shindroid

Reviewed against the official FFd20 pages (2026-10-31):
- [Beastkin](https://finalfantasyd20.com/races/base-races/beastkin/)
- [Garlean](https://finalfantasyd20.com/races/base-races/garlean/)
- [Shindroid](https://finalfantasyd20.com/races/base-races/shindroid/)

This is a bounded **runtime-only** reconciliation. The staging source JSON and its independent `needs_review` status are not changed.

## Beastkin

- Alluring changes **only** the standard racial +2 WIS to +2 CHA. The +2 STR and -2 INT remain.
- Light Build changes **only** the standard racial +2 STR to +2 DEX. The +2 WIS and -2 INT remain.
- Both change distinct score components and may coexist. Base vector +2 STR, +2 WIS, -2 INT becomes +2 DEX, +2 CHA, -2 INT. No score bonus should double-stack or disappear.
- Loper replaces **Natural Armor** (+1 AC disappears), adds +10 to **base land speed** (30→40 ft), and retains the distinct **Sprinter** +10 ft bonus conditional on charge, run, or withdraw. Do not turn Sprinter into a permanent +10 to land speed or double count its action bonus.
- **Feral remains blocked:** the source lacks a defined replacement and describes the already-existing -2 INT penalty. Nothing guesses whether a second -2 INT applies.
- Magic sleep immunity, fear/enfeebling saves, some Run feat effects and conditional speed use are handled by their existing manual or bounded rules.

## Garlean

- Xenophobia Extremis modifies **both** Ability Score Adjustment and Languages, rather than removing either feature.
- Effective racial vector **+2 CON, +2 INT, -2 CHA** instead of standard +2 CON, +2 INT, -2 WIS. Starting **Common** remains.
- The standard high-INT language pool is removed from the active choice specifications. Existing stored optional bonus language selections are invalid for the alternate until the editor prunes them. Do not pre-grant, accept, or double count a bonus language.
- Replaces neither the Linguistics skill's ordinary progression nor the race's weapon and technology Craft choice pools. First-level and Magic Ineptitude restrictions are unchanged; no unsupported casting integration is enabled.
- Garlean variant heritage conflicts and class-based favored reward scaling remain separate work.

## Shindroid

- Heavy Platform **modifies Base Speed**, retaining its feature and other standard racial traits: 30→20 ft land speed. Heavy Platform's +50 lb weight and rule that armor/encumbrance does not reduce racial land speed are displayed but not applied to an unimplemented carrying-load calculation.
- Anomaly **replaces Emotionless** completely. The original -4 racial Sense Motive penalty and inability to benefit from morale bonuses are no longer active.
- Anomaly additionally modifies **Robotic Immunities**: fatigue, exhaustion and sleep immunities remain, while normal fear/emotion immunity does not. +2 class skills **Bluff** and **Sense Motive** are class-skill flags (not +2 numeric bonuses). Its -2 saves versus mind-affecting/fear/emotion are conditional/manual, never permanently deducted from all saves.
- Hologram Simulation, Race Simulation and unimplemented heritage/cross-race projections remain blocked. No Black Mage MP exception is introduced: Magitek Unit rules remain independently guarded.

## Safety and verification

Each rewritten operation requires the exact source operation ID, original scope, resolution, targets and added feature IDs. The allowlist also checks standard source score vectors / speed values; unexpected source revisions remain blocked. Other unresolved operations remain unavailable. Existing creation-only alternate permanence, incompatible replacement conflicts and manual edits must survive.

Added `tests/beastkin-garlean-shindroid-partials.test.mjs` and updated the prior unresolved-trait fixture. Run full Node 24 test suite and cloud build on the exact PR head. Signed-in production creation/save/reopen remains a separate requirement after authorized publication. **Draft PR only; do not merge/deploy without instruction.**
