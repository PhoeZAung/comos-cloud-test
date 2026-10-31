# Classes and archetypes chat

Checkout: /home/phoeaung/Documents/Codex/2026-10-30/hi/work/comos-classes
Branch: classes/red-mage. The github remote is the real GitHub repository.
origin points at another local checkout: NEVER push to origin.

User priority (October 31, 2026): make large useful batches, ideally one class
through levels 1–20 plus all its archetypes at once, and more where simple.
The campaign starts in about two weeks; NAS migration is a later deployment
task, not authorization to change hosting now. Reuse existing sheet fields for
HP/MP, choices, resources, scores and progression. Complex effects, unmodeled
variables, companions and subchoices may remain on descriptions/manual rows.
Do not spend a separate coding/deployment cycle on every single class level.

This chat owns classes/archetypes; the race chat owns races in its separate
checkout. Archetypes such as Mog Knight stay with their parent class. Name the
affected class when explaining mechanics. Test meaningful family matrices and
real save/reopen routes locally, plus representative actual wizard browser flows.
Never label fixture sessions as real Firebase/production verification.

Latest local batch: Thief+25archetypes, Warrior+25archetypes and Monk+20archetypes,
all level1–20 sheet support.493tests/build:cloud pass;73paths/1387routelevel-ups;
7browserprogressions+freshWarriorcreation/reopen;8SQLitepersistedrecords. See
 docs/extraction/three-class-families-progress.md and its validation JSON for
manual limits, source conflicts and class-isolation racial fixture scope.
Earlier Red Mage+18archetypes1–20 local support remains included. Last verified
published scope stays PR39/b4c63eb (RedMage1–2 and martial polish). Local selectable
manifest entries do not imply production deployment. Next candidate batch:
White Mage family, then Knight and Dragoon families, preserving this batch approach.

Future gameplay changes stay LOCAL until the user explicitly says publish in
this chat. Preserve the race chat's latest changes when eventually integrating
main; reconcile shared source and queue files. Local commits and Git bundles
are allowed backups. Do not push checkpoints without publish authorization.
The user plans new characters but has NOT authorized deleting old characters.

Node 24.22.2: /home/phoeaung/.nvm/versions/node/v24.22.2/bin.
node_modules is a local dependency symlink; do not reinstall through it. Generated
dist/ and dist-live/ are build outputs and must not be committed. Committed
source catalogs under src/features/characters/rules are intentional runtime data.
Archive: /home/phoeaung/Downloads/Potato/ffd20-extractor/workspace/cache/pages.
