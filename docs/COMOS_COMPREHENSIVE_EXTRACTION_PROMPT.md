# Comos comprehensive class/race extraction prompt

Use this in ChatGPT chat mode with **Comos-Comprehensive-Extraction-v2.zip** attached. The ZIP contains the current JSON schema, blank templates, detailed contract and validator. Request **one class family or one race per job**. A class family includes its base class, every linked archetype, talent/option catalogs and spell references; it may take several continuations to finish. Never confuse one class per job with one short response per class.

## Copy this task into ChatGPT

Extract **[CLASS OR RACE NAME]** for Comos from **[OFFICIAL PAGE URL]** using the attached `comos.rules.v1` schema and `DATA_CONTRACT.md`. Follow every instruction below. Replace both placeholders before starting.

### Deliverables and evidence

1. Browse the current official FFd20 pages. Do not rely on memory, search snippets, a prior AI synopsis or the old website's parser as mechanical authority. An uploaded old catalog is comparison evidence only.
2. Create downloadable UTF-8 JSON files, not just text in code fences. Give the base class its own `[class].class.json`, each archetype its own `[class]--[archetype].archetype.json`, and a race its own `[race].race.json`. Put shared spell, spell-list, option-catalog and MP-system definitions in separate support files with stable IDs; include each shared record once. Also supply one final `[name]_bundle.json` containing the same schema-valid definitions as an array, plus a ZIP of all files. The bundle is a convenient import unit; it does not replace the requested individual class/archetype/race files.
3. Also create `[name]_coverage.md`: all expected pages/sections/entities; which were actually read; counts expected/emitted; unresolved references; source dates; tests/calculation examples; what remains manual. A JSON record count is not a completeness claim.
4. Every definition stays `review.state: needs_review`. Use coverage `complete` only when every included source section and required dependency has been checked; otherwise `partial`. AI extraction is not independent rules approval. Do not clear blocking issues merely to pass a validator.
5. Preserve full mechanical meaning in descriptions: prerequisites, action/trigger, targets, range, duration, all numbers, levels, exceptions, stacking, choice limits, recovery and replacement clauses. Do not abbreviate a talent or spell into a one-line summary. Faithful paraphrases are acceptable; obey source licensing and quotation limits. Never copy website navigation, unrelated art, marketing text or campaign/private data.
6. Keep source URLs, dates and exact section/row locators for every mechanical object. A URL alone is not evidence that its page was read. Content hashes and word counts must be null/unknown unless actually computed from obtained content.

### Completeness and output-limit protocol — mandatory

- First inventory the base page and every relevant linked subpage. List **all** archetype names/URLs, talent pools, advanced pools, subchoices, spell lists and rule-system dependencies before extracting the family.
- Read the gameplay body, excluding menus/footers. Check for progression-table headers and final rows, final feature headings, archetype replacement paragraphs, table footnotes, and linked continuation pages. Confirm the last expected source section is present.
- A page's word count alone cannot prove that it was read completely. A tool response/quote budget is not the page's actual length; a response ending at a limit is a warning, not proof of a complete page. Never invent a browser/model token limit or a total word count.
- If a page is cut off, a required table is absent, a source fetch fails, the extracted text ends abruptly, or the available response budget cannot hold a full entity, mark that entity incomplete and keep it out of the import-ready set. Put its URL and next section in the continuation queue. Do not fill its missing mechanics with guesses or claim it has no more features.
- Fetch smaller sections or follow the next source page when supported. If completeness still cannot be established, stop that entity and explain exactly what is missing. Do not bypass access restrictions.
- Work in batches: base class; shared talents/options; individual archetypes; class spell-list membership; canonical spell descriptions; system tables. Save completed work before continuing. At each pause give exact filenames, entity IDs, last completed section, remaining URLs and unresolved IDs. A continuation must resume from these records rather than restart or overwrite completed data.
- It is acceptable to deliver several staging JSON files and a manifest during extraction. Merge them into the requested final bundle only after checking duplicate IDs, missing dependencies and counts. Never output an invalid/truncated final JSON file to keep a one-file promise.
- Report which archetypes/classes are deferred. Do not add an incomplete archetype/class to the ready set just because its name appears in the index. Discovery-only references are allowed and must remain unavailable for automatic application.

### Class extraction

Extract the full class category, actual maximum level, parent relationships, entry requirements, alignment restrictions if any, Hit Die, starting wealth, starting equipment allowance, class skills, skill-rank formula, proficiencies, every level-table row and every feature description.

- **Hit Die:** store die sides as a numeric/source-dependent contract, separate from CON. Do not bake CON, favored rewards or a rolled HP total into the class. Comos creates level-1 characters with maximum first Hit Die, then uses the table's fixed `dieSides / 2 + 1` HP policy on level-up (d6 → 6,4,4…). This later fixed policy is project configuration, not a replacement for the source Hit Die or a universal PF1 rolling rule. Track each class level's HP source separately for eventual multiclassing.
- **Starting wealth:** use the optional `data.startingWealth` shape in the supplied schema: dice, multiplier, explicitly stated average, currency, outfit allowance and source refs. Preserve the original dice expression as data, never executable code. An outfit in addition to wealth is an item grant, not extra cash. Starting wealth/equipment are granted once at character creation, never again on level-up, re-save or multiclass entry. Unknown wealth is null with a blocking issue, not zero or an invented average. Black Mage's checked source is 70 gil plus an outfit worth up to 10 gil.
- **Class skills:** preserve exact names, specializations and “all” semantics. Craft (all) marks all three existing Craft rows; Knowledge (all) marks every fixed Knowledge row; Profession (all) marks all existing Profession rows. Never invent a new skill row because a specialization is mentioned. Membership does not allocate ranks. The trained class-skill +3 is applied once, only when ranks are positive, even if several classes grant membership.
- **Skill ranks:** encode the full class-base + INT-modifier formula, minimum 1 per level. Pathfinder 1e does not multiply first-level ranks by four. Black Mage uses `max(1, 4 + INT_MOD)` at level 1, after effective INT is known. Do not import D&D 3.5's ×4 rule. Keep fractional racial/favored additions and actual allocated ranks separate.
- **Progression table:** preserve every actual class level and explicit numeric BAB, iterative attacks, Fortitude, Reflex, Will, base MP and highest spell level. Keep class level, total character level, caster level and spell level distinct. Read footnotes. Compare row count to maximum level. Do not infer all classes as level 20 or all saves/MP from a generic curve.
- **Special column:** reconcile each entry against the complete feature description. Emit exact grant/choice/upgrade events at the printed levels. An existing feature improving is an update to its canonical ID, not a duplicate ability card. Preserve all threshold values, scaling tables and effective-level bindings. A table label by itself is not a complete feature description.
- **Proficiencies:** structure every weapon/armor/shield group and restriction. These populate the sheet's Proficiencies field. Multiclass grants append/union the new permissions; do not erase existing proficiencies or grant a parent class's full features by inference.
- **Active/passive:** separate active actions, passive effects and mixed components. Ex/Su/Sp does not determine active/passive. Preserve attack type, save/DC, damage dice/type, action, resource cost, trigger, targeting and recovery. An ability using a modifier needs the modifier, not the raw ability score.
- **Uses/scaling:** encode formulas and exact level tables for uses/rounds/points, minima, caps, rounding and reset conditions. Give each shared pool its own stable ID. Preserve spent amounts when maxima change; recomputation never refills. Unknown recovery is unknown, not an assumed long-rest reset.

### Every class choice and talent

Enumerate **every option** from ordinary and advanced talent pages, exploit catalogs, stances, secrets, bloodlines, schools and nested choices, wherever the class links them. Inspect each relevant linked description rather than treating the index as the entire catalog.

For each option include the full description, exact prerequisite expression/text, class/character level thresholds, ability/skill/feat requirements, required earlier options, repeat/rank limits, mutually exclusive groups, per-spell stacking limits, parameters and active loadout limits. The UI will show these in a searchable popup; a player must be able to understand the option without a vague summary.

Every selection opportunity has an exact event ID, source context, level, count formula and timing. Expanding a pool to include advanced options does not create a second pick. Do not grant all options automatically. Do not encode an empty prerequisite merely because parsing failed: preserve the source text, mark the structured requirement unresolved and block automatic eligibility approval.

### Every archetype and replacement

Read the archetype index, then each archetype's entire page and linked option pages. Pin it to the extracted parent-class ID/revision. Keep each archetype as a separate definition inside the class-family bundle.

- Create a replacement table using exact feature IDs, component IDs and/or level-event IDs. Include operation (`replace`, `modify`, `add`), consumed targets, scope, incoming feature/event IDs, effective level, conditions and full source text/locator.
- Replacing talents only at certain levels must consume only those event IDs. Do not remove every future talent because the word “talent” appears in the paragraph.
- A modification does not delete an entire feature unless the source says so. Component changes need component targets. Unknown targets are unresolved and blocking; never guess based on similar names.
- Include changed Hit Die, skills, proficiencies, casting ability, spells available/known, caster-level progression, MP progression, highest-spell-level table, recovery and prerequisites. **Some archetypes have their own MP table**: extract every row and footnote; never inherit the base MP table silently.
- Cross-class abilities require exact scoped effective-level bindings and their referenced catalogs. A parent-class relationship does not grant all parent abilities. A missing prerequisite race or external exploit/bloodline catalog is a real dependency to resolve or defer.
- Detect overlapping replacement targets for archetype combinations; do not assume two archetypes stack.

### Every spell and learning rule

Extract the current class spell-list membership at **all spell levels**, not just cantrips. Extract every canonical spell's complete gameplay description and metadata, including shared spells only once. A class-specific spell level belongs in list membership; the same spell may have a different level on another class list.

Separate availability, free known-spell selections, additional learned/scroll spells, daily preparation and actual casting. Use the source's exact learning counts and when they occur. Black Mage starts with **4 cantrips** and **3 + INT modifier 1st-level spells**, gains 2 spells at each later Black Mage level, and has separate New Arcana/cantrip events. INT does not add Black Mage cantrips by default. Never generalize this to every caster or use PF1 bonus spell slots as FFd20 spells known.

Encode INT/WIS/CHA modifiers, the initial entitlement fixed at creation, later learning opportunities and minimum casting ability correctly. A later INT increase must not silently recalculate all initial known-spell choices. Choices at an earlier level must have been available at that level, even if the character is now much higher level.

Preserve casting time, components, range, targets/area, duration, save, spell resistance, descriptors, attack type, DC, damage/scaling and all exceptions. Do not invent an attack roll for a save-only spell, or dice from prose that could not be parsed confidently. A complete description may remain manual while a formula is unresolved. Keep known spells distinct from the entire class list.

FFd20 bonus MP is a separate table indexed by casting ability score band and highest accessible spell level. Extract the whole relevant system table, not a guessed `level × modifier` formula or a sum of columns. Keep class MP separate from bonus MP, and base/current/max MP separate. Comos shows MP costs but does not auto-spend MP when casting.

### Race extraction

Read all gameplay sections: standard traits and their defense/offense/feat-skill/senses subsections, alternates, variant heritages, languages/choices and Favored Class Options. Exclude the separate Racial Feats and Racial Archetypes catalogs, while preserving a feat granted directly inside an included trait.

- Standard traits start on and may be disabled later; alternates start off and may be explicitly selected. Map all replacement/modify clauses exactly. Conflicting alternates cannot consume the same target without a source-supported exception.
- Extract every heritage table row, especially Variant Moogle Heritages when extracting Moogle. Heritage stat vectors replace the standard vector when specified; they do not stack. Keep unaffected traits and preserve OR-choices.
- Structure ability adjustments separately from original scores. Structural fields (type/subtypes, size, speed, armor/encumbrance exceptions, conditional movement, senses and languages) go to Identity. Conditional senses/bonuses do not become always-on combat stats.
- Preserve skill specializations and bonus types. A bonus against poison, fear, a creature type or a terrain is conditional; do not apply it to every save/attack/AC check.
- Retain and match each favored reward to exact race + class IDs. Reconcile duplicate listings from class and race pages into one canonical reward; preserve fractions and targeted selections. Comos displays the applicable description beneath Proficiencies and asks the player to apply it manually; do not auto-award both listings.

### Final verification before delivery

Validate each root definition against the supplied schema and the bundle's cross-references. Check duplicate IDs, dependency pins, formula grammar, prerequisite completeness, replacement scope, option counts, all progression rows and spell-list membership. Reconcile: expected archetypes vs emitted; expected talents vs emitted; each spell-list level's membership count vs described spells; missing source sections vs coverage report.

Include calculation vectors: low/negative ability modifiers; odd class levels; at least two MP table lookups; base saves plus exactly one modifier; max-first/later-fixed HP with CON and no favored reward; ability increases at character levels 4/8/12/16/20; multiclass class-vs-total-level context; one partial-event archetype replacement; changing maxima without restoring spent uses. Do not claim a vector was executed unless it actually was.

If validation tooling is unavailable, say so. Structural validity alone does not prove source accuracy or approve a production import. Explicitly list unsupported mechanics and every remaining blocking issue. Never return “all complete” when a spell catalog, replacement table, archetype page or required system table is missing.

## Practical cautions

- “One class” can include hundreds of spells and many archetypes. Expect continuations. Preserve partial files and coverage state between them.
- Word/token counts are not enough to detect missing content; source-section and entity reconciliation are required.
- The current live site supports base Black Mage and three races. A new JSON family is not enabled automatically; its adapters, replacements, dependencies and migration behavior still need validation.
- Rolled ability scores in the current UI are player-controlled generation, not server-audited anti-cheating rolls. A GM should choose permitted generation methods/budgets.
- Fixed half-plus-one HP is the selected Comos table policy. First-level ×4 skill ranks are not PF1. Favored rewards remain manual to avoid double application.
- Retain source/licensing information. Extraction does not establish permission to sell every source's text, art or trademarks.
