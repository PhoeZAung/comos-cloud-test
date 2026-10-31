# Fresh-character martial reliability pass

Published in PR #39 as b4c63eb; live files and health verified. See
`class-release-publication.md` for current release evidence. The notes below
describe the earlier local implementation and fixture-validation milestone.

User priority (October 31, 2026): focus on new characters. The user plans to
replace old characters after a future site publication; this is not a request
to delete any characters. No production characters were read, changed or deleted.

Scope: Chocobo Knight/Mog Knight, Dancer/Akimbo and Gunbreaker/Doom Slayer.
Class changes remain local. Red Mage level 2 stays parked.

The actual built rules wizard was exercised in a browser against loopback
fixture sessions, real character creation/update routes and a separate temporary
SQLite database. Firebase login and the full production shell were not tested.
The fixture used a small results page to display saved records and reopen links.
The form, selection handlers, validation, requests and route persistence were
application code, not a recreated wizard.

Observed browser results:
- Newly created fixture builds for all six paths completed level 1→2 through
  Growth, Skills, talent selection, class trait review and Confirm level up.
- Mog Knight, Dancer and Akimbo advanced to level 4, including +1 Charisma.
- Dancer and Akimbo selected Mystic Dance at level 4 and completed the extra
  dance selection before saving.
- One additional Mog Knight was created entirely through browser controls:
  identity, standard Moogle Handy/specialty choice, Chocobo Knight/Mog Knight,
  all six standard-array assignments, skills, review and Save & open sheet.
  It then advanced from level 1 to 2 and saved successfully.
- A saved Mog Knight reopened in the edit wizard. Dancer's saved level-4
  choices reopened with the chosen talent and granted follow-up choice intact.
- Replacing Mystic Dance with Born Leader removed the no-longer-granted child
  choice and displayed a notice. The notice now explains that a choice no
  longer applies rather than requiring an orphaned slot to be selected again.
- After stopping the fixture server, the SQLite database was reopened read-only;
  all seven saved characters retained the expected levels and data.

The browser pass exposed additional misleading level-1→2 upgrade labels.
Changing from a short first-level description to the longer source reference
made static proficiencies look upgraded. Review comparisons now use the stable
progression reference plus explicit state/resource changes. A regression checks
that Weapon and Armor Proficiency and Mounted Combat are not mislabeled.
The dependent-choice notice was also being cleared by the generic draft-change
handler; it now survives until displayed.

Final checks: 429 tests pass, build:cloud passes, git diff --check passes.
Automated coverage includes all six paths through level 20. Browser checks
covered early advancement and selected level-4 milestones; they do not claim
all choices or all 20 levels were clicked in the browser. Spell/combat effects,
mount operation, modified equipment and externally unproved prerequisites retain
the existing manual/guarded limits. See martial-fresh-browser-validation.json
for observed saved records and the database reopen result.

Local fixture harness: work/martial-browser-fixture.mjs in this chat workspace;
its temporary authentication stub was never added to production application
code. The fixture server is stopped. Proof image:
outputs/fresh-mog-knight-level-two.png in this chat workspace.
