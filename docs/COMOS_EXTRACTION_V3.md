# Comos final-sheet extraction instructions — v3

Use the attached Comos-Extraction-v3.zip. Work from the official Final Fantasy d20 pages in their displayed navigation order. Produce import staging data, not a summary, and never change production until the batch passes validation and an integration test. Start with races in batches of 3–5; after races, one class family at a time. An archetype is its own JSON file. Keep base-class progress separate from archetype and spell dependencies.

## Request block

Task: [FIRST THREE CORE RACES: Dwarf, Elvaan, Galka / NEXT RACE BATCH / ONE CLASS FAMILY]
Official URLs: [supply or discover from the site's actual links]
Contract revision: 2026-10-27.3; schemaVersion remains comos.rules.v1.
Resume from EXTRACTION_PROGRESS.json. Never treat an old legacy import as a verified full extraction.

## Text and coverage — mandatory

`description` is the complete authorized source text, not a mechanics summary. Preserve paragraphs, headings, lists, examples, numeric clauses, exceptions, prerequisites and upgrades. Do not invent a missing paragraph. Keep concise names/labels separately; never substitute a summary into sheet description. For each feature/talent/spell record add descriptionStatus and an automationContract.textAudit entry: source URL, section, exact UTF-8 description SHA-256, word count and applicable license/permission. If full text cannot be supplied lawfully or the page is inaccessible, mark missing, add a blocking issue and request source material; do not silently rewrite a short summary as full_verified. Existing summaries are summary_legacy until replaced.

Inventory every source section, table, talent list, archetype link, spell-list level, footnote and nested choice before extracting. Save source entity counts and table row counts. Compare expected versus emitted counts, cross-reference IDs and unresolved URLs. Detect clipped tool/page output: word count alone never proves completeness. Stop at a whole-record boundary before output limits, write a continuation manifest with exact next URL/section/row, and mark the family partial. Do not set complete while any requested dependency is unvisited.

## Race batch

Follow Core → Base and the remaining race categories in navigation order as actually shown; save the index date and URLs, do not alphabetically re-sort. Standard racial traits are enabled by default and removable by the user. Alternate traits default off; capture exact feature/component replacements and mutual exclusions. Moogle variant heritages require explicit stat-vector replacement/addition semantics. Include all standard/alternate text, ability adjustments/choices, size/type, senses, speeds/movement modes, languages, proficiencies and favored-class options. Identity effects belong in identity; usable/conditional traits belong in racial abilities. Do not include racial feats or racial archetypes in this pass. Favored rewards remain descriptions/manual application; match raceId and classId exactly. Keep unknown mappings blocked.

## Class family

Cover core/base/hybrid/prestige types in site order. Capture every actual class-level row: BAB (including iterative attacks), Fortitude/Reflex/Will, MP, highest spell level, special entries and footnotes. Capture HD, skill ranks per level, exact class-skill groups, proficiencies, starting wealth dice and listed average plus outfit allowance. Expand Knowledge(all), Craft(all), Perform(all), Profession(all) to stable fixed-skill IDs. No first-level skill ×4 in Pathfinder 1e; allocation follows effective INT and must respect rank ≤ total level. Previously confirmed ranks cannot be reduced on a later advancement.

Distinguish CHARACTER_LEVEL, CLASS_LEVEL (with class ID), CASTER_LEVEL, highest SPELL_LEVEL, ability SCORE versus ability MOD, choice rank and favored selection count. A half/partial caster does NOT automatically have ceil(class level/2) caster level. Extract the stated formula, start level, rounding, minimum and exceptions, then enumerate casterLevelByClassLevel and highestSpellLevelByClassLevel separately for every class level. Noncasters explicitly use casterMode none; omit their spell wizard. Archetypes can replace casting ability, CL, MP tables or spell lists: record exact overrides, never infer from the base class.

For reference, normal FFd20 recovery is CL + primary casting modifier after 8 hours rest plus 30 minutes meditation, independently per casting class; 24-hour complete rest doubles recovery. Bonus MP uses the table column for highest available spell level, not sum of columns. Recheck the official MP System when extracting; retain source numbers separately from Comos policies.

## Features, talents, choices and automation

Every automatic grant has a stable ID and class-level event. Every upgrade has its own level event referring to the same feature/component ID. Class choices must have complete pools, unlock levels, counts, prerequisites, repeat limits, replacements, exclusions and respec rules. Separate active, passive, mixed, racial and feat targets. Unknown activation blocks automation.

For each feature include complete source text plus structured sheetMapping: attackType (none/melee/ranged/touch/ranged_touch/cmb), diceFormula, usageResourceId, criticalRange/multiplier where defined, upgradeLevels, automatic flag and unresolvedReasons. Never parse a source paragraph at roll time. Put numeric formulas and level tables in the existing value/resource/action structures. Extract ability modifier dependencies, level scaling, caps, die sizes/types, attack/DC/range/duration, target counts, usage maxima/minima, spending units and recovery triggers. Expressions are bounded data, never JavaScript/eval. Preserve conditional effects as conditions, not unconditional stat bonuses. Keep shared usage pools shared; no duplicate counters per granted card. Preserve uses spent and manual overrides when recalculating maxima. Refreshing or editing never refills resources.

Archetypes: one file each, pinned parent class, exact replacement table (feature/component/event and level), partial versus whole replacement, altered resources/casting/progression, dependencies and compatibility checks. Do not enable an archetype with an ambiguous replacement.

Spells: complete independently identified records plus class-list membership and spell level per list. Include full description, all stat-block fields, attack type, explicit dice/DC/range/duration formulas, level caps and metamagic/resource exceptions. Do not turn every catalog spell into an automatically known spell. Cantrip learning is a separate progression; no universal INT bonus cantrips. Learned selections appear as individual slots, descriptions folded in pickers, creation cantrip/level groups expanded. A chosen option is hidden from other slots except when swapping its own slot.

## Comos runtime policies — separate from source rules

Creation is level 1. Standard array is the default, with rolled/manual/point-buy alternatives. Racial adjustments stay separate from base scores. HP currently uses maximum first HD and fixed average rounded up later, plus CON (minimum 1 per class level). Level-up restores current HP/MP to new effective maxima; ordinary rest only restores calculated recovery. Milestones 4/8/12/16/20 grant +1 ability score; feats get odd-level slots pending a curated catalog. Starting wealth/outfit apply once. Comos reserves at least three level-one known spells for its current Black Mage adapter; keep the actual source learning formula separately.

Dice/Use spends MP or configured usage once through revision-checked idempotent receipts. Discord-description send spends nothing. Default MP cost is spell level (cantrips 0); keep explicit supported exceptions. Crit UI allows Select, 20 → 1–20 and x2 → x5; Comos currently multiplies the rolled damage total and shows a confirmation attack. Store source critical rules separately. These interface defaults are not evidence that any source grants an attack or critical range.

## Output and gate

Return each race/class/archetype/spell/list/system as its own JSON; also include bundle.json, COVERAGE.md, CONTINUATION.json, updated EXTRACTION_PROGRESS.json and a ZIP. Run bundled tools/validate_rules.py against all definitions, then --ready. Templates intentionally fail readiness. Structural validity does not prove source accuracy, missing dependency coverage, runtime adapter support or legal permission. Provide semantic fixtures: representative levels 1/2/3/4/8/20 and every feature upgrade; each casting ability modifier boundary; CL vs spell-level differences; alternate trait conflict; archetype replacement; usage/damage formula before/after; multiclass pool/recovery; minimum/negative modifiers; rank cap and nondecreasing confirmed ranks. Integrate one verified batch at a time, keep a rollback, and report what is live separately from extracted and staged.
