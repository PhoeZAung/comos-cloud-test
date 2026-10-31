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

Latest local batch: Red Mage + all 18 archetypes, levels 1–20 sheet/manual-card
support. 460 tests and build:cloud pass; 361 route level-ups and database reopen;
four representative browser paths. See docs/extraction/red-mage-family-progress.md
and red-mage-family-validation.json for manual limits and the Animist ambiguity.
Last verified published class scope remains PR #39 / b4c63eb, Red Mage 1–2 plus
martial polish. Do not confuse a local selectable manifest entry with deployment.
Next: Thief plus all its archetypes through 20 using this family approach.

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
