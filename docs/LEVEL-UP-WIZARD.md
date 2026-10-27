# Creation and level-up wizard — 26 October 2026

Creation is level 1 only. Identity → Race → Class → Class choices → Spells → Ability scores → Review. Scores are generated at the final setup step using point buy (10/15/20/25), standard array, 4d6 dropping the lowest, or manual entry. Array/rolled values are reassigned without using one result twice. Race adjustments stay a separate layer. The final ability-score screen includes any additional spell slots granted by the completed INT modifier.

The previously hidden spell problem was caused by applying the INT casting requirement before scores had been assigned. Popup browsing now uses the class's accessible spell levels; final save still validates actual ability requirements. Cantrips and spells have separate numbered slots, and a searchable popup shows each provided full description. Class choices use the same picker, including descriptions/prerequisites available in the supplied data and repeat-limit exclusions. Existing data is not magically completed by the new UI; unstructured prerequisites still require source review.

The sheet's + control beside Edit opens `create-identity.html?characterId=…&levelUp=1`. It advances exactly one level through Next level → Class choices → Spells → Ability increase → Review. A prior reviewed class build is required. Older characters are given an Edit link to establish that build first; unsupported classes must wait for their reviewed data. The enabled automated class remains base Black Mage. Other classes/multiclass progression and archetypes are not advertised as implemented.

The server enforces the prior revision, owner/admin session and Origin. Level up cannot change identity, race, original scores, previous options, known spells or previous milestone increases. It appends one class-level HP result and permits a new +1 ability increase only at levels 4/8/12/16/20. Duplicate/stale submissions cannot advance two levels. Old wizard routes cannot overwrite managed builds.

HP policy is maximum at first class Hit Die and half-plus-one afterward: Black Mage d6 gives 6,4,4… before CON. CON applies once at each level, minimum one HP per level. This fixed progression is the chosen table policy, not a claim that every PF1 game uses it. HP/MP maxima may change; current/spent resources are not refilled.

PF1 skill ranks have no first-level ×4. Black Mage uses max(1,4 + effective INT modifier) per class level. All three Craft rows, every Knowledge row and all Profession rows are class skills. Starting wealth is 70 gil plus one outfit worth up to 10 gil, granted only on creation. A level up/re-save preserves the existing bag and currency. Favored race/class descriptions appear beneath Proficiencies and explicitly require manual application; the new flow grants no automatic favored reward. Existing previously awarded choices are retained.

Initial learned-spell entitlement is pinned at creation. Later INT increases affect the appropriate derived stats, but do not retroactively grant extra starting spells. Black Mage starts with four cantrips; INT adds first-level spells, not cantrips. The class-level cantrip/New Arcana learning events stay distinct. The sheet still never automatically spends MP when casting.

## Acceptance checks

- Create a level-1 Dwarf Black Mage with manual base INT 18 and other base scores 10: HP 7, class MP 3 + bonus MP 1 = 4, BAB 0, Fort +1, Reflex 0, Will +3, skill budget 8, 70 gil and one outfit. Choose 4 cantrips and 7 first-level spells.
- Open + Level up. Level 2 adds 4 base HP plus CON and the new talent/two spell choices. Wealth is not awarded again. Existing choices are fixed; current resources do not refill.
- At level 3, base d6 HP is 6+4+4. At level 4 choose exactly one +1 ability increase; none is granted at levels 2/3. Recheck HP when CON modifier changes and MP/skill budget when INT modifier changes. Initial spell entitlement must remain fixed.
- Try generating/reassigning array and rolled scores. Point buy uses non-linear costs, budget checks and the 7–18 base range; race modifiers are applied afterward.
- Open and search spell/talent popups at 320 px and desktop; inspect full text, Close/Escape, duplicate selection limits and extra INT-based slots on the last setup step.

The extraction prompt and companion schema are in `COMOS_COMPREHENSIVE_EXTRACTION_PROMPT.md` and `COMOS_EXTRACTION_V2_SCHEMA.json`. They require complete source inventories, all linked options/spells/archetypes, exact replacement/casting tables, and explicit continuation instead of output truncation.
