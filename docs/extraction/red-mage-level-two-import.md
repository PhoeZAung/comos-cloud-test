# Red Mage local level-two milestone

User request: continue Red Mage level 2 after the fresh-character martial pass.
Work stays in the isolated classes/red-mage checkout. Nothing is published.

Source: existing Red Mage main page and Ruby Talents page in the saved FFd20
archive. The class definition records both source hashes and source references.
All 34 Ruby Talents are transcribed as reference records. The bounded level-2
picker offers 12 candidates, with Brutish Combat requiring effective STR 15.
These can be represented without an untracked mandatory subchoice. Other
candidates remain guarded: later acquisition levels; familiar operation;
external feat verification; natural attack, maneuver, weapon or cross-class
spell selection. Availability does not claim independent full rules review.

Implemented:
- Sequential advancement from level 1 to 2 using the shared wizard preparation
  and progression guards. Previous race/class/ability scores, Red Magery,
  earlier selections and learned spells cannot be changed during level up.
- Source level-2 +1 BAB, Fortitude +3, Reflex +0, Will +3, base MP 3, maximum
  spell level 1, default HP gain 5 plus CON and another 6 + INT skill ranks.
- Two additional distinct first-level Red Mage spells; two starting cantrips
  remain. Starting CHA spell entitlement is fixed rather than recalculated
  when CHA later changes. The noncasting/Black Mage initialization field is
  not introduced into the Red Mage wizard draft.
- Arcane Pool maximum half Red Mage level (minimum 1) + CHA modifier; level 2
  provides 1 + CHA. Owned counters preserve spent uses through edits and CHA
  changes. The pool is a manual tracker; source 8-hour/once-daily refresh and
  weapon enhancement conditions are not an automatic rest or combat operation.
- Spellstrike and selected Ruby Talent reference cards. Concentrate/Reach Magic
  receive one daily use; Silent Magic/Still Magic receive two. Uses are tracked
  manually; spell metamagic, attack rolls, equipment and effect resolution stay
  manual. No conditional combat modifier is applied globally.
- Casting profile advances to caster level 2 for the existing recovery system.
  Current HP and MP do not refill on advancement. Manual notes/rows survive.
  Saved talent choices stay fixed and are disabled in Edit; respec is guarded.
- Ruby Talent links point to the Ruby Talents source. The spell page explicitly
  says no new cantrips while showing the two new learned-spell slots.

Validation: Node 24.22.2, 434 tests pass, build:cloud passes. Tests cover every
bounded talent candidate, STR eligibility, guarded options, excessive/forged
changes, previous spell preservation, resource expenditure, CHA edits, unique
ownership, real route revision checks and SQLite close/reopen.

Browser: a new fixture Red Mage advanced through Growth, Skills, Ruby Talent,
Class traits, two new spell slots and final confirmation. Concentrate, Cure and
Fire were selected. The saved character reopened with its choices intact and
fixed. After stopping the loopback server, database reopen confirmed level 2,
ten total spells, Arcane Pool 4 and caster-level-2 CHA profile. Evidence:
red-mage-level-two-validation.json. Screenshot is in this chat's outputs as
red-mage-level-two.png. This used fixture sessions, not Firebase login or
production characters, and a small result page around the actual wizard/routes.

Levels 3–20, Ruby Arcana, Ruby Knowledge, archetypes, multiclassing, unsupported
subchoices, scroll learning and full independent review remain pending.
Next: Red Mage level 3, starting with source-backed Ruby Arcana choices and
conditional Ruby Knowledge handling. Keep local until explicitly told publish.
Before merging, integrate current main and reconcile the race chat's queue.
