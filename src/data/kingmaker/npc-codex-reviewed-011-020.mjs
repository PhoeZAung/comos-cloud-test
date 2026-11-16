// Pathfinder Kingmaker Bestiary (First Edition) — NPC Codex entries 11–20.
// Manually checked against printed pp. 73–80 (PDF pp. 74–81).
// Rules-focused summaries; no adventure story prose. Raw extraction stays untouched.
const melee=(name,npcAttackBonus,damage,desc='')=>({name,attack_type:'melee',npcAttackBonus,damage,...(desc?{desc}:{})});
const ranged=(name,npcAttackBonus,damage,desc='')=>({name,attack_type:'ranged',npcAttackBonus,damage,...(desc?{desc}:{})});
const ability=(name,ability_kind,desc)=>({name,ability_kind,desc});
export const KINGMAKER_NPC_CODEX_REVIEWED_011_020=Object.freeze({
 'the-beast':{
  stats:{str:32,space:15,reach:10},
  text:{
   acDetail:'20, touch 10, flat-footed 18 (+2 Dex, +10 natural, −2 size).',
   hpDetail:'121 (9d10+72).',
   saveDetail:'Fort +14, Ref +8, Will +8.',
   maneuverDetail:'CMB +22 (+24 bull rush, +26 grapple); CMD 34 (36 vs. bull rush, 38 vs. trip).',
   attackDetail:'Bite +18 (1d8+11) and two claws +18 (1d8+11 each, plus grab).',
   skillDetail:'Perception +15.',
   importNotes:'Source-reviewed printed p. 73 (PDF p. 74). Removed cross-column chapter labels and neighboring Bloom of Lamashtu narrative; recovered Perception +15 and separate claws.'
  },
  weapons:[melee('Bite',18,'1d8+11'),melee('Claw 1',18,'1d8+11','Plus grab.'),melee('Claw 2',18,'1d8+11','Plus grab.')],
  npcSkills:[{name:'Perception',bonus:15}]
 },
 'bloom-of-lamashtu':{
  stats:{str:24,regeneration:5},
  text:{
   acDetail:'24, touch 12, flat-footed 21 (+2 Dex, +1 dodge, +12 natural, −1 size).',
   hpDetail:'133 (14d8+70); regeneration 5, suppressed by fire or good.',
   saveDetail:'Fort +14, Ref +8, Will +11.',
   defenses:'Defensive burst; DR 10/good; regeneration 5 (fire or good).',
   immunities:'Acid, curses and plant traits.',
   weaknesses:'Slashing (printed weakness); slashing attacks also trigger defensive burst.',
   attackDetail:'Two vines +17 (3d8+7, crit 19–20, plus vine venom each). Alternatively, two ranged thorns +11 (2d6+7, plus venom each). Thorns have a 50-ft. range increment.',
   specialAttacks:'Bloom curse (Fort DC 20); spew seed pod (20-ft. burst, 60-ft. range, Reflex DC 22); vine venom (Fort DC 22).',
   specialAbilities:'Bloom curse: ingestion, failed seed-pod save, or vine critical exposes a living creature; Fort DC 20 negates. Failed save produces 2 Strength drain after 24 hours; then every 8 hours, Fort DC 20 against 1d4 Strength damage and 2d6 poison damage. Three consecutive successful saves end it. Death or unconsciousness can produce a GM-chosen chaotic evil monster with equal HD. Defensive burst: first slashing hit in a round sprays one adjacent target, 9d6 acid (Ref DC 22 half), then 1d4-round cooldown. Seed pod: standard action, 60-ft. range, 20-ft. burst; 5d6 acid and 5d6 poison, Reflex DC 22 half; failed save applies the curse. Vine venom: injury, Fort DC 22; 2d6 poison damage each round up to 6 rounds; two consecutive saves cure.',
   importNotes:'Source-reviewed printed pp. 74–75 (PDF pp. 75–76). Restored all cross-column bloom rules and created two independent vine and thorn attacks, plus full effects/DCs.'
  },
  weapons:[melee('Vine 1',17,'3d8+7','Critical 19–20; vine venom Fort DC 22.'),melee('Vine 2',17,'3d8+7','Critical 19–20; vine venom Fort DC 22.'),ranged('Thorn 1',11,'2d6+7','Alternative ranged routine; 50-ft. range increment; vine venom Fort DC 22.'),ranged('Thorn 2',11,'2d6+7','Alternative ranged routine; 50-ft. range increment; vine venom Fort DC 22.')],
  activeAbilities:[
   ability('Bloom Curse','su','Fort DC 20; 2 Str drain at 24 h, then every 8 h 1d4 Str and 2d6 poison damage; 3 consecutive successful saves end; monster transformation at death/unconsciousness.'),
   ability('Defensive Burst','ex','First slashing damage in a round sprays adjacent foe for 9d6 acid; Reflex DC 22 half; cooldown 1d4 rounds.'),
   ability('Spew Seed Pod','su','Standard action, range 60 ft., 20-ft. burst, 5d6 acid + 5d6 poison, Reflex DC 22 half; failed save also exposes to bloom curse.'),
   ability('Vine Venom','ex','Injury poison on vine or thorn; Fort DC 22, 2d6 poison damage/round for 6 rounds, two consecutive saves cure.'),
   ability('Regeneration','ex','5 HP/round, deactivated by fire or good.')]
 },
 'castruccio-irovetti':{
  stats:{str:18},
  text:{
   senses:'Darkvision 60 ft. and see invisibility (permanent spell effects).',
   acDetail:'31, touch 18, flat-footed 26 (+11 armor, +3 deflection, +4 Dex, +1 dodge, +2 natural).',
   hpDetail:'199 (17 HD; 12d8+5d10+114).',
   attackDetail:'Rod of razors +23/+18/+13 (1d10+12, crit 19–20/×3); alternatively ranged flechettes +21/+16/+13 (1d8+3/×3), 5/day as a full-round action.',
   specialAttacks:'Bardic performance 39 rounds/day (move action; inspire courage +3, inspire competence +4, fascinate/suggestion DC 23); weapon training (pole arms +1).',
   spellsKnown:'Bard (CL 12th; concentration +19): 4th (4/day)—cure critical wounds, dimension door, dominate person (DC 22), greater invisibility; 3rd (6/day)—charm monster (DC 21), displacement, phantom steed, scrying (DC 20); 2nd (7/day)—cat’s grace, cure moderate wounds, detect thoughts (DC 19), glitterdust (DC 19), suggestion (DC 20); 1st (7/day)—alarm, charm person (DC 19), cure light wounds, expeditious retreat, undetectable alignment (DC 18), unseen servant; 0 (at will)—dancing lights, detect magic, light, mage hand, message, prestidigitation.',
   languages:'Common, Hallit, Skald; tongues (permanent spell).',
   qualities:'Armor training 1; bardic knowledge +6; contingency (trigger: >10 damage in one attack teleports him via dimension door to prepared quarters); improved resources; jack-of-all-trades; lore master 2/day; permanent darkvision, see invisibility and tongues; versatile performances (dance, oratory, sing).',
   combatGear:'Four potions of lesser restoration; scrolls of heal, restoration and teleport; wand of hold monster (CL 10th, 13 charges).',
   gear:'+5 mithral breastplate, rod of razors, amulet of natural armor +2, belt of physical might +4 (Str/Con), boots of speed, cloak of resistance +4, headband of alluring charisma +6, mindbender baton, ring of protection +3.',
   specialAbilities:'Rod of razors: technological item acting as +3 keen adamantine halberd, usable against adjacent foes despite reach; can launch flechettes five times/day as a full-round action. The equipment list names a mindbender baton, while the special-ability heading calls it Mindrender Baton. It acts as a nonmagical rod of rulership with 60 minutes of use remaining. Contingency: a previously cast spell, not an extra spontaneous spell slot.',
   importNotes:'Source-reviewed printed pp. 75–76 (PDF pp. 76–77). Separated technological item rules, pre-cast contingency and full equipment from bard spellcasting; removed column labels embedded in gear and skills.'
  },
  activeAbilities:[ability('Bardic Performance','su','39 rounds/day, move action. Inspire courage +3; inspire competence +4; fascinate/suggestion DC 23.'),ability('Rod of Razors','other','+3 keen adamantine halberd; five full-round flechette volleys/day; usable adjacent despite reach.'),ability('Prepared Contingency','sp','A hit dealing more than 10 damage triggers pre-cast dimension door to his quarters.'),ability('Mindrender Baton','other','Functions as rod of rulership for 60 more minutes; nonmagical technology.')]
 },
 'cephal-lorentus':{
  stats:{str:12,con:null},
  text:{
   sourceReference:'Variant human zombie lord wizard 7 (Pathfinder Bestiary 4, p. 286).',
   raceClassLevels:'Variant human zombie lord wizard 7 (Pathfinder Bestiary 4, p. 286).',
   acDetail:'18, touch 16, flat-footed 14 (+2 deflection, +3 Dex, +1 dodge, +2 natural).',
   hpDetail:'70 (9 HD; 7d6+2d8+34).',
   saveDetail:'Fort +4, Ref +7, Will +11.',
   attackDetail:'Dagger +6 (1d4+2, crit 19–20) with secondary bite +0 (1d6+1); or primary bite alone +5 (1d6+1). These are alternative routines.',
   specialAttacks:'Feasting bite; hand of the apprentice 7/day.',
   spellsPrepared:'Wizard (CL 7th; concentration +11): 4th—fear (DC 18), fire shield; 3rd—fireball (DC 17), fly, lightning bolt (DC 17); 2nd—acid arrow, glitterdust (DC 16), mirror image, scorching ray; 1st—burning hands (DC 15), mage armor, magic missile ×2, shield; 0—bleed (DC 14), dancing lights, message, touch of fatigue (DC 14).',
   tactics:'Before combat: casts mage armor. Printed AC 18 has no armor bonus; if this spell is active, add its +4 armor bonus (AC 22, barring other effects).' ,
   specialAbilities:'Feasting bite: on a critical bite hit or a bite against a helpless target, heals self for 3d6 HP (excess becomes temporary HP) and grants haste for the following round.',
   gear:'+1 dagger; ring of protection +2; spell component pouch; spellbook (all cantrips and currently prepared spells).',
   importNotes:'Source-reviewed printed p. 76 (PDF p. 77). Rebuilt complete feasting bite, corrected truncated source reference, set undead Constitution to null and made the dagger/bite attack routines mutually exclusive.'
  },
  weapons:[melee('+1 dagger',6,'1d4+2','Critical 19–20, combined with secondary bite +0.'),melee('Secondary bite',0,'1d6+1','Only when wielding dagger.'),melee('Primary bite',5,'1d6+1','Alternative bite-only attack.')],
  activeAbilities:[ability('Feasting Bite','su','Critical bite or bite on helpless foe restores 3d6 HP, overflow temp HP, and grants haste for next round.'),ability('Hand of the Apprentice','su','Wizard ability usable 7/day; linked to bonded dagger.')]
 },
 'chief-sootscale':{
  stats:{str:11},
  text:{
   acDetail:'17, touch 15, flat-footed 13 (+3 Dex, +1 dodge, +2 natural, +1 size).',
   hpDetail:'20 (3d8+3).',
   saveDetail:'Fort +1, Ref +6, Will +1.',
   attackDetail:'Masterwork club +4 (1d4).',
   gear:'Masterwork club; amulet of natural armor +1; thieves’ tools.',
   specialAttacks:'Sneak attack +2d6.',
   importNotes:'Source-reviewed printed pp. 76–77 (PDF pp. 77–78). Restored clean equipment, removed Corax’s narrative and page number from save text.'
  },
  activeAbilities:[ability('Sneak Attack','ex','+2d6 when the target is vulnerable to precision damage.')]
 },
 'corax':{
  stats:{str:14},
  text:{
   acDetail:'13, touch 10, flat-footed 13 (+3 armor).',
   hpDetail:'37 (5d8+15).',
   saveDetail:'Fort +3, Ref +1, Will +4.',
   attackDetail:'Mwk cold iron greataxe +6 (1d12+3/×3); alternatively composite shortbow +3 (1d6+2/×3).',
   combatGear:'Potion of cure light wounds; two flasks of alchemist’s fire.',
   gear:'Studded leather armor; composite shortbow (+2 Str) with 20 arrows; masterwork cold iron greataxe.',
   importNotes:'Source-reviewed printed pp. 77–78 (PDF pp. 78–79). Rejoined split gear across the facing column; corrected contaminated potion count and maintained separate melee/ranged alternatives.'
  },
  weapons:[melee('Mwk cold iron greataxe',6,'1d12+3','Critical ×3.'),ranged('Composite shortbow',3,'1d6+2','Critical ×3; +2 Str composite.')]
 },
 'cursed-guardian':{
  stats:{str:21},
  text:{
   acDetail:'17, touch 10, flat-footed 16 (+1 Dex, +7 natural, −1 size).',
   hpDetail:'42 (5d8+20).',
   saveDetail:'Fort +8, Ref +5, Will +4.',
   attackDetail:'Bite +7 (1d6+5) and two claws +7 (1d6+5, plus grab on each).',
   specialAbilities:'Deadeye’s Shame (Su): takes an extra 1d6 damage from attacks with weapons wielded by worshippers of Erastil and suffers a −2 circumstance penalty on saves against their effects. If such a worshipper critically hits it, it is staggered for one round.',
   importNotes:'Source-reviewed printed pp. 77–78 (PDF pp. 78–79). Corrected HP spillover, split claws and checked the entire Deadeye’s Shame effect.'
  },
  weapons:[melee('Bite',7,'1d6+5'),melee('Claw 1',7,'1d6+5','Plus grab.'),melee('Claw 2',7,'1d6+5','Plus grab.')],
  activeAbilities:[ability('Deadeye’s Shame','su','Weapons wielded by Erastil followers deal +1d6 damage; −2 on saves against their effects; their critical hits stagger it for 1 round.')]
 },
 'dancing-lady':{
  stats:{str:22},
  text:{
   raceClassLevels:'Baobhan sith fighter 4 (Tome of Horrors Complete, p. 46).',
   hpDetail:'109 (13 HD; 9d6+4d10+56).',
   saveDetail:'Fort +13, Ref +12, Will +11 (+1 vs. fear).',
   attackDetail:'Bite +14 (1d8+6), two claws +15 (1d8+6 each).',
   specialAttacks:'Blood drain (1d4 Str and 1d4 Con), captivating dance (Will DC 21), dying words (Will DC 21).',
   spellLikeAbilities:'CL 9th; concentration +16: at will—detect thoughts (DC 19); 1/day—entangle (DC 18), suggestion (DC 20).',
   specialAbilities:'Captivating dance (Su): move action, may move half speed and forces creatures within 30 ft. at its end to make Will DC 21 or become dazed until the start of her next turn; success grants 24-hour immunity to dance. The Lady may use blood drain on a dazed target with a standard action. Dying words (Sp): when slain, as a free action curses the killer; Will DC 21 or −6 to the target’s highest ability score.',
   importNotes:'Source-reviewed printed pp. 78–79 (PDF pp. 79–80). Restored both special-ability save DCs and activation timing, and split the two claw attack rolls.'
  },
  weapons:[melee('Bite',14,'1d8+6'),melee('Claw 1',15,'1d8+6'),melee('Claw 2',15,'1d8+6')],
  activeAbilities:[ability('Captivating Dance','su','Move action with half-speed movement; within 30 ft. at end, Will DC 21 or dazed until her next turn; success grants 24-hour immunity.'),ability('Dying Words','sp','At death: free-action curse on killer, Will DC 21 or −6 to highest ability score.'),ability('Blood Drain','ex','1d4 Strength and 1d4 Constitution drain against eligible target; can use on dazed target after dance.')]
 },
 'darg-fesl-and-urda':{
  stats:{str:25},
  text:{
   acDetail:'26, touch 12, flat-footed 23 (+5 armor, +2 Dex, +1 dodge, +9 natural, −1 size).',
   hpDetail:'152 (15 HD; 10d8+5d10+80) per giant.',
   attackDetail:'Per giant: +1 greatclub +21/+16/+11 (2d8+14); OR two slams +18 (1d8+7 each). Ranged rock +14 (1d8+10), 120-ft. range.',
   specialAttacks:'Rock throwing (120 ft.) and weapon training (hammers +1).',
   gear:'+1 hide armor, +1 greatclub, sack of five rocks (per giant).',
   importNotes:'Source-reviewed printed p. 79 (PDF p. 80). Group entry represents three hill giants with one shared stat block. Split both slams; greatclub and slams are alternative melee routines, not all simultaneous.'
  },
  weapons:[melee('Greatclub +21',21,'2d8+14','First iterative; exclusive of slams.'),melee('Greatclub +16',16,'2d8+14','Second iterative; exclusive of slams.'),melee('Greatclub +11',11,'2d8+14','Third iterative; exclusive of slams.'),melee('Slam 1',18,'1d8+7','Natural attack alternative.'),melee('Slam 2',18,'1d8+7','Natural attack alternative.'),ranged('Rock',14,'1d8+10','120-ft. range increment.')]
 },
 'darivan':{
  stats:{str:16,regeneration:null},
  text:{
   acDetail:'16, touch 11, flat-footed 15 (+3 armor, +1 Dex, +2 natural).',
   hpDetail:'63 (11d6+22), plus conditional bloom regeneration 5 for four rounds when activated.',
   attackDetail:'Melee +1 falchion +9 (2d4+5/18–20).',
   spellLikeAbilities:'Sorcerer bloodline abilities (CL 11th; concentration +16): fleeting glance at will (11 rounds/day); laughing touch 8/day.',
   spellsKnown:'Sorcerer (CL 11th; concentration +16; Fey bloodline): 5th (5/day)—passwall, tree stride, wall of stone; 4th (7/day)—contagion (DC 19), enervation, poison (DC 19), stone shape; 3rd (7/day)—deep slumber (DC 20), dispel magic, fly, lightning bolt (DC 18), slow (DC 18); 2nd (7/day)—bear’s endurance, blindness/deafness (DC 17), cat’s grace, glitterdust (DC 17), hideous laughter (DC 19), mirror image; 1st (8/day)—charm person (DC 16), entangle (DC 16), expeditious retreat, ray of enfeeblement (DC 16), shield, shocking grasp; 0—acid splash, bleed (DC 15), detect magic, ghost sound (DC 15), message, prestidigitation, ray of frost, read magic, resistance.',
   feats:'Arcane Armor Training, Cosmopolitan (APG), Craft Wondrous Item, Eschew Materials, Light Armor Proficiency, Lightning Reflexes, Persuasive, Skill Focus (Knowledge [planes]).',
   qualities:'Bloodline arcana (+2 DC for compulsion spells), orc blood, woodland stride.',
   combatGear:'Wand of tiny hut (20 charges).',
   gear:'+1 leather armor, +1 falchion, amulet of natural armor +2, belt of giant strength +2, headband of alluring charisma +2, golden unholy symbol of Lamashtu.',
   specialAbilities:'Bloom regeneration (Su): in the Cradle of Lamashtu only, once/day as a swift action heals 4d6 HP and grants regeneration 5 for the next four rounds. Damage from cold iron or good suppresses this regeneration.',
   importNotes:'Source-reviewed printed pp. 79–80 (PDF pp. 80–81). Recovered spell progression and separated it from attack routine, fixed feats across page break and ensured conditional regeneration is not a permanent stat.'
  },
  weapons:[melee('+1 falchion',9,'2d4+5','Critical 18–20.')],
  activeAbilities:[ability('Bloom Regeneration','su','Only in Cradle of Lamashtu: swift action, 1/day, heal 4d6 and gain regeneration 5 for four rounds; cold iron or good suppresses.')]
 }
});