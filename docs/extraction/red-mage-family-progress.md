# Red Mage family: local levels 1–20

October 31, 2026. This batch is local and unpublished. The last verified published
class release is PR #39 / b4c63eb, covering Red Mage levels 1–2. Manifest “live”
means available in this local runtime, not that this batch has been deployed.

## Scope

Base Red Mage and all 18 archived archetypes support creation and sequential
level-up through 20: Animist, Daemonic Flayer, Elemental Knight, Generalist,
Ishgardian Heretic, Mystic Knight, Outfitter, Paradigm Shifter, Red Warrior,
Reserve Mage, Ruby Archer, Ruby Fist, Ruby Magister, Ruby Wizard, Shield Mage,
Spell Dancer, Spellblade and Vermilion Duelist.

The reusable family reducer applies exact parent feature/event replacements,
retains unaffected choice slots, merges same-named amendments into one card,
and applies scalar progression as SET values. Existing HP, MP, BAB, saves,
class skills, proficiencies, spells and resource controls are reused. Mystic
Knight/Red Warrior use their d10/full-BAB chassis; the three spellless variants
skip spell learning and have no MP pool. Animist uses its diminished MP table.
Saved archetype/earlier choices and learned spells remain fixed on level-up;
manual sheet edits and spent uses are retained. Outfitter chooses one standard
Limit Break to replace and keeps the other; its choice record is not a third
Limit Break. Ishgardian Heretic checks the existing racial resistance trait.

The archived catalog supplies 33 real Ruby Talents, 29 Ruby Arcana and 239
Red Mage spells, cantrips through sixth level. The former 34th talent record
was a Markdown table separator, not a selectable rule. Previously shipped spell
IDs remain stable. Native pickers include augmentations, Blade Magic, talent
trees, reserve feats, archery talents, garments, focuses and Spellblade choices.
Level and recorded-option prerequisites are checked where represented. External
feats, ability/weapon choices and other complex prerequisites are checked manually.

## Manual limits and source conflict

This is campaign sheet support, not complete combat automation or independently
reviewed rules. Companions, temporary effects, crafting, equipment, spell/feat
subchoices, action timing and conditional modifiers remain on source cards and
existing manual entries. Bonus spells from optional talents/archetypes are
entered as manual spell rows. Ruby Wizard cross-class talent selections are
manual named selections. Multiclassing and favored-class rewards remain guarded.

Animist's source summary replaces Ruby Talents but the Augmentation body says
Ruby Arcana. The adapter suppresses both tracks in favor of explicit even-level
augmentations. Its card discloses the conflict; the GM should choose which
parent track to restore manually before play. This unresolved interpretation
is recorded in red-mage-family-replacement-audit.json. Do not claim full review.

## Validation

460 tests pass with Node 24.22.2; build:cloud passes. The family matrix creates
all 19 paths, advances each through 20, and checks chassis, spell caps, resources,
unique rule ownership, replacement schedules and compile/reopen behavior.
The real character update routes accept 361 level-ups with fixture sessions;
all 19 level-20 records survive SQLite close/reopen.

The actual browser wizard saves Mystic Knight, Animist, Outfitter and Ruby
Archer from 1 to 2. All four records survive server stop and SQLite reopen.
The browser also verifies the 18 named menu entries, native augmentation/talent
pickers and spell learning. Screenshot: outputs/red-mage-family-local.png in the
chat deliverables. These are local fixtures, not real Firebase login or live
production character tests. See red-mage-family-validation.json and
 tests/red-mage-family.test.mjs.

## Rebuild and continue

Run python3 scripts/imports/red-mage-family.py /absolute/archive/pages to rebuild
the source data, then npm test and npm run build:cloud. The application build
needs committed definitions, not the raw archive. Source URL/hash provenance is
retained; raw Markdown stays outside application commits.

Next class priority: Thief and its complete archetype family in one local batch.
Preserve the separate race chat. Before publication, integrate its latest main
changes, reconcile shared wizard/queue files and rerun final validation. Push,
merge and publish only after an explicit user publish request in this chat.
