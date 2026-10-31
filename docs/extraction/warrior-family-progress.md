# Warrior family source-backed sheet data

October 31, 2026. Local and unpublished. This data batch is intended for the
shared sheet-family-progression adapter, integrated and validated by the parent
class work. It does not independently claim production availability or full
rules review.

Warrior and all 25 archived archetypes are extracted through level 20:
Airborne Ambusher, Cyberpunk Warrior, Defender, Demon Hunter, Dirty Fighter,
Draconic Warrior, Dragonwarrior, Elemental Warrior, Feral Guardian, First Shield,
Foehammer, Gladiator, Lanista, Mercenary, Monster Hunter, Nimble Striker, Sea Wolf,
ShinSect, Squire, Stormbreaker, Stylish Fighter, Swarm Fighter, Talekeeper,
Viking and Weapon Collector.

The base source provides all 20 BAB/save rows, d10 Hit Die, four skill ranks per
level, class skills, proficiencies and average starting wealth. There are 39
canonical feature/component cards, nine scalar progression upgrades, 71 real
normal/advanced talent options, eleven chosen-weapon groups and native combat
maneuver selectors. Advanced talents remain level 12+ with explicit later
source prerequisites. Prerequisites involving recorded earlier talent choices
can be checked; external feats, equipment, ability/skill requirements and
unmodeled conditions are manual.

Exact talent acquisition replacements preserve unaffected levels. Warrior
Techniques is split into its stamina pool and three named techniques, allowing
Viking, Nimble Striker, Sea Wolf, Monster Hunter and ShinSect to replace only
Overhand Chop and Increase Save while retaining stamina and Delay Fatigue.
Squire grants its own source stamina pool. First Shield removes only the named
Overhand Chop component along with Chosen Weapon/Knowledge. Weapon Collector
replaces Omnistrike and retains Critical Strikes. Finisher modification cards
are reference amendments, not extra Limit Breaks.

Profiles retain source class-skill/proficiency changes and restricted chosen
weapon groups. Swarm Fighter requires the existing Swarming racial trait;
Gnath's source alternate supplies it. Dragonwarrior's Althena worship requirement
is explicit on its prerequisite card and must be checked manually. Source
abilities that grant feats are present as named ability/reference cards; they
are not invented automatic feat/equipment records. Conditional AC, attacks,
damage, ability-score bonuses, forms, cybernetics, companion effects, traps,
style/heritage choices and combat timing remain manual on existing sheet rows.

Native mandatory style, heritage, teamwork and bonus-style acquisitions use
explicit manual-selection slots with the full source descriptions. Talekeeper,
Feral Guardian, First Shield, Viking, Airborne Ambusher and ShinSect optional
cross-class/feat choices reuse the parent talent slots. They do not grant an
extra talent. The source option name, prerequisites and any further subchoices
must be recorded manually. Limited-use abilities that fit the shared resource
formula use existing counters; conditional/per-target uses stay manual.

Twenty-two optional-replacement/modified-feature statements are retained in
warrior-family-audit.json and on source cards. They do not remove the whole
parent track. These are declared manual limits, not a full mechanical review.
The data remains review.state=needs_review / partial_manual.

Seven source/contract and runtime regression tests pass, covering all 25 archetypes, base
chassis, bounded catalogs, exact slot replacements, partial technique handling,
acquisition wording, Limit Break ownership, skills, restricted choice enforcement,
Gnath/Swarming eligibility and runtime stamina counters. The shared
full family matrix and browser/save verification are separate integration work;
consult the combined batch evidence for their final results. No real Firebase
login or production character writes were performed for this extraction.

Rebuild only Warrior-owned data with:

```sh
python3 scripts/imports/warrior-family.py /absolute/archive/pages
node --test tests/warrior-family-source.test.mjs
```

URLs and SHA-256 hashes identify all 27 archived source pages (main, talents and
25 archetypes). Raw archive files remain outside application commits. The
script does not edit manifests, shared runtime, generated catalog or queue.
