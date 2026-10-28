# Archer base class extraction — Batch 01
Official class: https://finalfantasyd20.com/classes/core-classes/archer/
Talent list: https://finalfantasyd20.com/classes/core-classes/archer/archery-talents/
Archetypes index: https://finalfantasyd20.com/classes/core-classes/archer/archetypes/

Archer's 20 progression rows were transcribed in their official sequence. 52 archery talents were indexed with summary descriptions, prerequisite references, level restrictions and asterisk/combat-use constraints. Eleven Targeted Shot body locations have separate attack penalties and GM-directed status rules. 15 listed archetypes remain deferred and disabled.

## Critical improvement behavior
- Aim +1 at 1, +2 at 5, +3 at 10, +4 at 15, +5 at 20; maintain 1/2/3/4/5 aimed targets; at 7 add swift action rather than an extra Aim feature.
- Hawkeye +1/5ft at 2, +2/10ft at 5, +3/15ft at 8, +4/20ft at 11, +5/25ft at 14, +6/30ft at 17, +7/35ft at 20.
- Expert Archer +1 at 4, +2 at 8, +3 at 12, +4 at 16, +5 at 20, for bow/crossbow attack and damage.
- Fast Movement +10 at 6, +20 at 9, +30 at 12, +40 at 15, +50 at 18, subject to no firing/reloading/light armor/load.
- Evasion at 3 becomes Improved Evasion at 11; Uncanny Dodge at 7 becomes Improved Uncanny Dodge at 17.
- Evasive Archer ranged-only dodge AC +2 at 13 becomes +4 at 17 (source prose, absent from level table).
- Critical Aim threat range +1 at 14 becomes +2 at 18 (source prose, absent from level table).
- Limit Break scaling repeats at Archer levels 5/9/13/17.
- Archery Style awards SEPARATE bonus feat choices at 1, 5 and 10; never replace previously selected style feat.

## Safety and integration boundary
The current COSMOS character save and level-up engine is hard-coded to Black Mage. A read-only Archer preview is included in the live wizard to inspect all 20 levels and upgrade events without using the Black Mage class calculations. This is not yet an Archer character builder. It cannot save Archer character records and deliberately does not mark the class approved. Separate integration work will implement legal feat/talent selections, HP, BAB, saves, class skills, proficiencies, and Archer character save, followed by archetypes in later batches.

Sources were read as public website references, but feature descriptions are concise paraphrases, not copies of the site's entire text; source review is still pending.

## Live class preview integration

The class step now displays a read-only Archer rules explorer with a 1–20 level selector, official BAB/save values, class talents list, every feature at the chosen level, and specific NEW/UPGRADED labels driven by stable feature IDs. Existing Black Mage character save is unchanged. No Archer class can be saved yet, because the database and sheet rules adapter have not been generalized for Archer.

To inspect Archer on the live site: sign in, open character creation, continue to Class step, and choose levels on the Archer explorer. The preview is not a selectable class for character saving.
