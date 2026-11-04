# Immortal +2 choice: wizard navigation repair

Reported message: "Immortal chosen +2 score: choose 1 option(s)." Race appears
before Ability scores in the creation wizard. The +2 selector was intentionally
rendered on Ability scores, but every racial-choice error was assigned to Race,
so Next demanded a selection on a page the player could not reach.

Racial-choice validation can now return structured diagnostics with the step
containing the control. Ability-score choices and starting/bonus languages route
to Ability scores; rank-based Yagudo languages route to Skills. Other racial
choices and unknown/inactive selections remain on Race. The UI and validation
share the same ability-choice classifier. Default string diagnostics remain
compatible with existing consumers. All requirements still run before saving.

This changes wizard routing only: the Immortal +2 bonus, legal selections,
Magic Ineptitude, unsupported heritages/alternates, and saved character data are
unchanged. No source definition was reimported or marked fully reviewed. Queue
coverage/milestones are unchanged; this is not a new race integration batch.

tests/racial-score-step-mutant.test.mjs checks missing, invalid and duplicate
choices, correct UI steps, and retained inactive-choice validation. Existing
Immortal creation/persistence and race/compiler checks remain applicable.
scripts/check-immortal-wizard-browser.mjs drives the actual wizard from the
reported Race step through Class, Ability scores, Skills, Feats and Review,
verifies the missing-choice guard on the correct page, then saves and reopens
an isolated fixture character with its single selected +2 Charisma bonus.
No real Firebase login, player record or production database is used.
