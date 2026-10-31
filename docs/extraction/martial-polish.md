# Local martial progression polish

Published in PR #39 as b4c63eb; live files and health verified. See
`class-release-publication.md` for current release evidence. The notes below
describe the earlier local implementation and fixture-validation milestone.

User scope: Chocobo Knight/Mog Knight, Dancer/Akimbo, Gunbreaker/Doom Slayer,
levels 1–20. Red Mage work is parked locally while these families take priority.
Work remains isolated in the class checkout and is not published.

Reported failure: Mog Knight level 1→2 returned
`Level up cannot change initialChaMod.` Older martial saves can omit this
optional casting field. The wizard fills it with null, and the former strict
comparison treated undefined→null as an illicit change.

A shared compatibility helper now supplies absent optional defaults without
changing recorded choices. The martial guard compares normalized inputs and
ignores object key insertion order while preserving meaningful array order.
It still rejects changed ability scores, entitlements, ancestry, class,
archetype, earlier selections and skipped levels. No database migration is needed.

The actual wizard and the new level 1–20 regression matrix now use the same
prepareLevelUp function for baseline, HP, skill ranks and class spell defaults.
Existing session drafts are retained. Talent changes recheck dependent later
choices and clear invalid selections, including orphaned follow-up slots; the
wizard tells the player to choose those slots again. Resource changes appear
in the class trait review with old→new maxima. Static descriptions are no
longer marked upgraded solely because their displayed level number changed.
Saved spent uses and HP remain preserved. Existing ammunition checks also pass.

Validation: Node 24.22.2, 429 tests pass and cloud build passes. The added
regressions cover the exact absent-initialChaMod Mog Knight failure, genuine
forged changes, all six paths through nineteen level-ups, Charisma milestones,
manual CHA edits, expenditure, unique owned rows, trait review maxima and
prerequisite-dependent talent replacement. Existing SQLite/route persistence,
follow-up choice/repeat-limit and ammunition suites remain green.

These are local fixtures and render checks. No real production account login,
production character changes, push, merge or deployment occurred. Conditional
combat, equipment modifications and externally unproved prerequisites retain
the documented manual/guarded limits. Full source review is not claimed.

Next: continue the requested class polish when further issues are identified;
resume Red Mage level 2 afterward. Before publication, integrate newer main,
reconcile the race chat's queue changes and rerun the final integrated checks.
