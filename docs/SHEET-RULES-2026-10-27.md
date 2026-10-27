# Sheet and wizard update — 27 October 2026

## Behavior

Creation's Cantrip/1st-level groups open in both the slot list and picker, including after a selection. Higher-tier groups may fold. Empty class-choice/review pages are omitted. Stored draft spell groups are normalized after restoration.

Edit loads the actual saved skill ranks and permits redistribution within the total budget, resetting the confirmed floor after save. Advancement and adding a class preserve existing ranks. The API selects the operation; a client cannot enable an edit flag inside a level-up request.

Limit Break cards have one shared character-level daily pool, are displayed above other abilities, and use a server-enforced half-real-HP gate. Temporary HP does not change eligibility. Both legacy roll and Use routes spend the common pool; retries return the receipt without spending again. Sending a description is free. Rest resets the pool. Explicit limitBreak metadata is supported for future archetype replacements; current Black Mage cards and legacy Limit Break names/IDs are recognized. Combat-only, enemy-damage, sacrifice-cooldown, companion and concurrent-duration conditions still need adjudication; the application does not track those states.

The centered + library lazy-loads the rules catalog. It restores abilities granted by the character's current reviewed race, class, level and choices; it cannot grant arbitrary future talents or free choices. Feat selection awaits a curated catalog. Shared Limit Break charges survive card deletion/restoration.

Rest uses a crescent moon and a single Rest-button dialog. Level up has a growth-arrow icon and a single Level up action dialog. Escape or clicking the backdrop dismisses these quick actions. Skill rolls display a d20 icon. The shared feedback helper also handles the Discord toggle notification.

Maximum spell level is derived and cannot be changed through sheet fields. Saved verified caster profiles drive spell caster-level, dispel and concentration checks. Spell DC uses casting modifier, not caster level. The official formula reference is linked in the calculation view, and class-choice pickers link their official source family.

## Multiclass boundary

The reviewed automatic class adapter remains base Black Mage, and races remain Dwarf/Elvaan/Galka. Other classes/archetypes have not been invented or enabled. A legacy character with established stats, one of these reviewed races, a supported skill budget and no Black Mage class can use Level up to append Black Mage level 1. The server validates a snapshot of previous class contributions rather than trusting replacement stats from the client. Existing class levels, class skills, proficiencies, HP/BAB/saves/MP contributions, other class abilities and equipment/gil are retained. New class HP is the subsequent-level d6 value 4 before CON; no duplicate outfit/wealth. Subsequent Black Mage progression uses its class level, while rank caps, feats, ability milestones and Limit Break uses use total character level. Resaving a legacy multiclass through the old single-class adoption path is rejected to prevent replacement.

An existing managed Black Mage cannot yet select a different newly automated class; additional reviewed adapters are still required. Existing other class progression is carried rather than recalculated from unverified tables. Full mixed-class respec and switching which archived class to advance remain pending those adapters. This update does not migrate existing records or perform production writes during testing.

## Validation

204 automated tests pass, including shared/blocked/idempotent Limit Break actions, skill redistribution and advancement floors, caster/DC formulas, appended class preservation and subsequent total-level milestone advancement. Cloud build passes; initial sheet CSS remains below 26 KB. Phone-width browser checks use synthetic records and no real Discord delivery. At 320 px and 390 px, the sheet has no horizontal page overflow. At 390 px: first-tier spell groups stay open after selecting a replacement; ability library opens; Rest and Level up dialogs contain only their action; changing HP unlocks/re-locks Limit Break use. The actual Android device remains a user check.
