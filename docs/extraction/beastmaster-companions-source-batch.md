# Beastmaster companion source checkpoint

Official page: https://finalfantasyd20.com/classes/core-classes/beastmaster/animal-companions/
Archived HTML SHA-256: `09f7736b086cc40efcb6dbda752e5814c920f38e84a8dd76a410327b92a96883`.

All **35 species entries** are embedded in the existing Beastmaster family definition: 15 ordinary animals, nine magical beasts, six plants and five vermin. Their names and website order were compared with the archived article HTML. Starting size, movement, scores, printed natural armor and attack text are normalized. The original starting rules, group rules, individual prerequisites and 46 advancement/mastery source sections are retained with citations. Missing natural armor is null; absent Intelligence is null, with a separate mindless marker. Aquatic-only movement does not acquire a land speed.

There are **11 ordinary first-level source candidates**, not playable options: Cave Bat, Bear, Gray Chocobo, Flying Killer, Guard Hound, Piranha, Wild Rat, Sabertusk, Shark, Vulture and Wolf. Grizzly Bear starts at level 2; Orange/Bronze/Teal Chocobos start at 4/8/12. Those later starters are kept outside the first-level candidate list.

Magical beasts retain Beast Speaker plus their individual prerequisites. Their mastery sections additionally require Beast Speaker Mastery. Plants require Mandragora and Tree Guardian. The Tree Guardian ID matches the existing source catalog, but its runtime adapter is not enabled. Vermin retain the source's mindlessness, training and no-skill/no-feat restrictions. Corrosive Spider remains under magical beasts as the page lists it, with its absent Intelligence preserved; it is not silently reclassified or made an ordinary companion.

Special abilities and attacks remain descriptions. Later advancement/mastery powers do not enter starting rules or player feature grants. Known discrepancies are recorded for review: Bat Screech says it stuns but specifies staggered; Flying Killer's advancement lists evasion beside Improved Evasion prose; Blood Sucker prints a 20-foot ink radius in its stat block and 10 feet in prose; Killer Mantis mandible damage differs between its advancement summary and prose. No conflicting value is automated. Feat effects, companion HP policy, training, conditions and combat operation still require a bounded runtime design or explicit manual handling.

The build validates these nested source records: missing category/mastery prerequisites, duplicate IDs, invalid absent scores, wrong candidate eligibility and claims of companion automation are rejected. This validation checks source structure and retained restrictions; it does not approve mechanics. The subsequent [first-level integration](beastmaster-level-one-import.md) projects only the eleven ordinary starting records, without later advancement sections, for manual companion reference cards. Gated source records remain outside the runtime projection.

First-level selection/persistence and its explicit manual limits now have creation/edit/save/reopen tests. Later classes/races remain queued, with Hume after the Beastmaster validation/deployment milestone. Bulk Pathfinder collection stays paused.

Validation: all **319 tests pass** and `npm run build:cloud` passes. Three companion regression tests exercise later-starter exclusion, group/mastery prerequisites, mindlessness, aquatic movement, advancement separation, source discrepancies and staged runtime exclusion. No gameplay adapter changed and this checkpoint is not deployed.
