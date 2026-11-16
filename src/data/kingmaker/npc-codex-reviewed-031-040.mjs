// Kingmaker Bestiary (First Edition), NPC Codex #31-40.
// Compared against printed pages 86-93 (PDF pages 87-94), including column continuations.
// Game mechanics summarized without copying campaign adventure narration.
const melee=(name,npcAttackBonus,damage,desc='')=>({name,attack_type:'melee',npcAttackBonus,damage,...(desc?{desc}:{})});
const ranged=(name,npcAttackBonus,damage,desc='')=>({name,attack_type:'ranged',npcAttackBonus,damage,...(desc?{desc}:{})});
const ability=(name,ability_kind,desc)=>({name,ability_kind,desc});
export const KINGMAKER_NPC_CODEX_REVIEWED_031_040=Object.freeze({
 'foras':{
  stats:{str:8,perception:23},
  text:{
   aura:'Time siphon (60 ft.; Will DC 25; see special abilities).',
   senses:'Darkvision 60 ft.; true seeing while in areas influenced by Yog-Sothoth.',
   acDetail:'32, touch 24, flat-footed 25 (+8 armor, +5 deflection, +5 Dex, +2 dodge, +2 luck).',
   hpDetail:'221 (19d6+152).',
   saveDetail:'Fort +16, Ref +16, Will +19.',
   defenses:'Unusual anatomy (50%); SR 29.',
   attackDetail:'Staff of power +11/+11/+6 (1d6+1); duplicate +11 is explicitly printed, not a typo to discard.',
   specialAttacks:'Long limbs (15-ft. reach); time siphon aura 60 ft.',
   spellLikeAbilities:'Sorcerer bloodline spell-like ability (CL 19th; concentration +26): acidic ray 10/day (1d6+9 acid).',
   spellsKnown:'Sorcerer (CL 19th; concentration +26): 9th (4/day)—mass hold monster (DC 28), shapechange, time stop; 8th (6/day)—demand (DC 27), maze, mind blank, scintillating pattern; 7th (7/day)—finger of death (DC 24), insanity (DC 26), plane shift (DC 24), power word blind; 6th (7/day)—flesh to stone (DC 23), mass suggestion (DC 25), true seeing, veil (DC 23); 5th (7/day)—dominate person (DC 24), feeblemind (DC 24), hold monster (DC 24), mind fog (DC 24), wall of force; 4th (7/day)—black tentacles, charm monster (DC 23), confusion (DC 23), crushing despair (DC 23), greater invisibility; 3rd (8/day)—fly, slow (DC 20), suggestion (DC 22), tongues, vampiric touch; 2nd (8/day)—acid arrow, hideous laughter (DC 21), mirror image, resist energy, see invisibility, touch of idiocy; 1st (8/day)—charm person (DC 20), enlarge person (DC 18), grease, magic missile, ray of enfeeblement (DC 18), shield; 0 (at will)—acid splash, detect magic, light, mage hand, mending, message, prestidigitation, ray of frost, read magic. Aberrant bloodline.',
   qualities:'Accelerated existence (constant haste), bloodline arcana (+50% polymorph duration), improved resources (20-point ability build and PC gear), unseen sight.',
   combatGear:'Staff of power; wand of stoneskin (40 charges).',
   gear:'Amulet of natural armor +5, belt of physical might +6 (Dex, Con), bracers of armor +8, cloak of resistance +5, headband of mental superiority +6, ring of protection +5, religious symbol of Yog-Sothoth.',
   specialAbilities:'Accelerated Existence (Su): constant haste. Time Siphon (Su): creatures entering or ending turns in his 60-ft. aura suffer half speed and −1 to attacks, AC and Reflex for 1 round unless Will DC 25; cultists of Yog-Sothoth immune. Unseen Sight (Su): darkvision 60 ft. and true seeing in Yog-Sothoth-influenced areas.',
   importNotes:'Source-reviewed printed pp. 86–88 (PDF pp. 87–89). Separated bloodline ray from all ten levels of sorcerer spells; recovered full gear and time siphon aura across column/page boundaries. Spell +11/+11/+6 staff attack retained as printed.'
  },
  weapons:[melee('Staff of power +11 (1)',11,'1d6+1'),melee('Staff of power +11 (2)',11,'1d6+1'),melee('Staff of power +6',6,'1d6+1')],
  activeAbilities:[ability('Time Siphon','su','60-ft. aura; enter or end turn: halve speed and −1 attack/AC/Ref for 1 round unless Will DC 25; Yog-Sothoth worshippers immune.'),ability('Accelerated Existence','su','Constant haste effects.'),ability('Unseen Sight','su','Darkvision 60 ft. and true seeing in Yog-Sothoth-influenced places.'),ability('Acidic Ray','sp','10/day; 1d6+9 acid.')]
 },
 'gaetane':{
  stats:{str:15},
  text:{
   raceClassLevels:'Male human natural wererat ranger 14 (Pathfinder Bestiary p. 197).',
   sourceReference:'Male human natural wererat ranger 14 (Pathfinder Bestiary p. 197).',
   acDetail:'29, touch 15, flat-footed 24 (+6 armor, +4 Dex, +1 dodge, +6 natural, +2 shield).',
   hpDetail:'193 (14d10+112).',
   saveDetail:'Fort +17, Ref +15, Will +10.',
   defenses:'Evasion; DR 10/silver.',
   attackDetail:'Hybrid melee bite +18 (1d4+5 plus lycanthropy DC 15 and disease). Alternative +2 human-bane composite longbow +21/+16/+11 (1d8+2, 19–20/×3; additional 2d6 vs. humans).',
   specialAttacks:'Combat style (archery), curse of lycanthropy (DC 15), favored enemies (animals +2, dwarves +4, humans +4), filth fever, quarry.',
   spellsPrepared:'Ranger (CL 11th; concentration +13): 4th—cure serious wounds; 3rd—greater magic fang; 2nd—barkskin, bear’s endurance, hold animal (DC 14); 1st—charm animal (DC 13), jump, longstrider, resist energy.',
   tactics:'Regularly casts greater magic fang; before combat casts barkskin, bear’s endurance, jump, and longstrider; printed stats include preparations.',
   qualities:'Camouflage, change shape (human/hybrid/dire rat), favored terrains (mountainous +4, plains +2, urban +4), hunter’s bond (companions), lycanthropic empathy (+4 with rats/dire rats), swift tracker, track +7, wild empathy +13, woodland stride.',
   combatGear:'Potion of cure serious wounds.',
   gear:'+2 chain shirt, +1 buckler, +2 human-bane composite longbow, lesser bracers of archery, cloak of resistance +2.',
   importNotes:'Source-reviewed printed pp. 88–89 (PDF pp. 89–90). Completed right-column gear and favored terrains; protected bane bow extra damage as conditional. Printed bite and bow are alternate attack choices.'
  },
  weapons:[melee('Bite',18,'1d4+5','Plus lycanthropy DC 15 and filth fever.'),...([21,16,11].map(x=>ranged('Human-bane longbow +'+x,x,'1d8+2','Crit 19–20/×3; plus 2d6 only against humans.')))],
  activeAbilities:[ability('Lycanthropy and Disease','su','Bite can transmit lycanthropy (DC 15) and filth fever.'),ability('Favored Enemies','ex','Animals +2; dwarves +4; humans +4.')]
 },
 'the-gardener':{
  stats:{str:null,con:null},
  text:{
   raceClassLevels:'Male halfling ghost monk 4/sorcerer 11 (Pathfinder Bestiary p. 144).',
   sourceReference:'Male halfling ghost monk 4/sorcerer 11 (Pathfinder Bestiary p. 144).',
   creatureType:'undead',subtypes:'augmented humanoid, halfling, incorporeal',
   acDetail:'32, touch 28, flat-footed 26 (+4 armor, +6 deflection, +5 Dex, +1 dodge, +1 monk, +1 size, +4 Wis).',
   hpDetail:'169 (15 HD; 11d6+4d8+109).',
   saveDetail:'Fort +14, Ref +13, Will +16 (+2 vs. enchantments and fear).',
   defenses:'Channel resistance +4, evasion, incorporeal, rejuvenation, unusual anatomy (25%); undead immunities.',
   immunities:'Undead traits.',
   movementDetail:'Speed 10 ft.; fly 30 ft. (perfect).',
   attackDetail:'Incorporeal corrupting touch +14 (16d6); ability damage, gaze and spell powers are separate.',
   specialAttacks:'Corrupting gaze (DC 25), draining touch, flurry of blows, horrific appearance (DC 23), long limbs (10 ft.), stunning fist 6/day (DC 21), telekinesis (DC 23).',
   spellLikeAbilities:'Aberrant bloodline (CL 11th; concentration +17): acidic ray 9/day (1d6+5 acid).',
   spellsKnown:'Sorcerer (CL 11th; concentration +17): 5th (5/day)—baleful polymorph (DC 21), feeblemind (DC 21), hold monster (DC 21); 4th (7/day)—bestow curse (DC 20), black tentacles, confusion (DC 20), fear (DC 20); 3rd (7/day)—haste, lightning bolt (DC 19), slow (DC 19), tongues, vampiric touch; 2nd (8/day)—cat’s grace, mirror image, owl’s wisdom, scorching ray, see invisibility, touch of idiocy; 1st (8/day)—chill touch (DC 17), enlarge person (DC 17), mage armor, magic missile, silent image (DC 17), true strike; 0 (at will)—acid splash, arcane mark, dancing lights, detect magic, ghost sound (DC 16), mage hand, message, open/close (DC 16), prestidigitation.',
   tactics:'Before combat casts cat’s grace, owl’s wisdom and mage armor. Printed AC reflects these.',
   qualities:'Aberrant bloodline (+50% polymorph duration), fast movement, ki pool 6 (magic), maneuver training, slow fall 20 ft.',
   combatGear:'Lesser quicken metamagic rod.',
   specialAbilities:'Horrific Appearance (Su): standard action at will; all living creatures viewing its transformation within 30 ft. must succeed at Will DC 23 or become panicked 1d4 rounds; successful save protects for 24 hours. Mind-affecting fear effect.',
   importNotes:'Source-reviewed printed pp. 88–89 (PDF pp. 89–90). Correctly modeled incorporeal ghost with absent Str/Con, kept 16d6 corrupting touch, recovered full sorcerer spells, 25% unusual anatomy and DC 23 fear effect.'
  },
  weapons:[melee('Corrupting touch',14,'16d6','Incorporeal ghost touch; not a conventional physical attack.')],
  activeAbilities:[ability('Horrific Appearance','su','Standard action, 30-ft. radius, living viewers Will DC 23 or panic 1d4 rounds; save confers 24-hour immunity.'),ability('Corrupting Gaze','su','Gaze attack DC 25; use ghost rules.'),ability('Draining Touch','su','Incorporeal draining touch; resolve separately from corrupting touch.'),ability('Acidic Ray','sp','9/day, 1d6+5 acid.'),ability('Telekinesis','su','Ghost special attack DC 23.')]
 },
 'gedovius':{
  stats:{str:20},
  text:{
   raceClassLevels:'Gargoyle rogue 14 (Pathfinder Bestiary p. 137).',
   acDetail:'32, touch 18, flat-footed 26 (+7 armor, +2 deflection, +5 Dex, +1 dodge, +7 natural).',
   hpDetail:'256 (19 HD; 14d8+5d10+166).',
   saveDetail:'Fort +12, Ref +18, Will +10.',
   defenses:'Improved evasion, improved uncanny dodge, trap sense +4; DR 10/magic.',
   movementDetail:'Speed 40 ft.; fly 60 ft. (average).',
   attackDetail:'Melee bite +20 (1d4+5), two claws +21 (1d6+5 each, crit 19–20), gore +20 (1d4+5).',
   specialAttacks:'Sneak attack +7d6 and bleeding attack +7.',
   qualities:'Freeze; rogue talents (bleeding attack +7, combat trick, fast stealth, improved evasion, slippery mind, surprise attacks, weapon training); trapfinding +7.',
   gear:'+4 studded leather, amulet of natural armor +3, belt of mighty constitution +4, ring of protection +2, key to monster pen.',
   importNotes:'Source-reviewed printed pp. 89–90 (PDF pp. 90–91). Removed chapter banner from defenses/AC and next NPC narrative from gear; restored all four independently rolled natural attacks and the complete rogue talent list.'
  },
  weapons:[melee('Bite',20,'1d4+5'),melee('Claw 1',21,'1d6+5','Critical 19–20.'),melee('Claw 2',21,'1d6+5','Critical 19–20.'),melee('Gore',20,'1d4+5')],
  activeAbilities:[ability('Sneak Attack','ex','+7d6 precision damage; bleeding attack rogue talent adds 7 bleed.'),ability('Freeze','ex','Gargoyle freeze ability.')]
 },
 'grabbles':{
  stats:{str:14},
  text:{
   acDetail:'15, touch 13, flat-footed 13 (+2 armor, +2 Dex, +1 size).',
   hpDetail:'29 (5 HD; 1d6+4d10+4).',
   saveDetail:'Fort +6, Ref +5, Will +5 (+1 vs. fear).',
   defenses:'DR 2/cold iron.',
   weaknesses:'Light sensitivity.',
   movementDetail:'Speed 20 ft.; climb 20 ft.',
   specialAttacks:'Hatred.',
   attackDetail:'Melee masterwork trident +9 (1d6+4).',
   spellLikeAbilities:'CL 1st, concentration +2: at will—prestidigitation; 1/day—doom (DC 12).',
   qualities:'Armor training 1, vermin empathy.',
   gear:'Leather armor; masterwork trident.',
   importNotes:'Source-reviewed printed p. 90 (PDF p. 91). Removed Grigori narrative spill from gear; kept cold-iron DR, weapon bonus, climb speed and spell-like limits.'
  },
  weapons:[melee('Masterwork trident',9,'1d6+4')],
  activeAbilities:[ability('Mite Magic','sp','At will prestidigitation; doom 1/day (DC 12).')]
 },
 'grigori':{
  stats:{str:10},
  text:{
   senses:'Perception +10.',
   acDetail:'20, touch 13, flat-footed 17 (+5 armor, +2 Dex, +1 dodge, +2 shield).',
   hpDetail:'63 (8d8+24).',
   saveDetail:'Fort +3, Ref +8, Will +5; +4 vs. bardic performance, language-dependent and sonic.',
   movementDetail:'Speed 30 ft. (20 ft. in armor).',
   attackDetail:'Alternative melee +1 rapier +9/+4 (1d6+1, 18–20) or ranged +1 shortbow +9/+4 (1d6+1, ×3).',
   specialAttacks:'Bardic performance 22 rounds/day (move action): countersong, dirge of doom, distraction, fascinate (DC 18), inspire competence +3, inspire courage +2, suggestion (DC 18).',
   spellsKnown:'Bard (CL 8th; concentration +12): 3rd (3/day)—confusion (DC 17), dispel magic, glibness; 2nd (5/day)—calm emotions (DC 16), detect thoughts (DC 16), enthrall (DC 16), invisibility; 1st (5/day)—charm person (DC 15), cure light wounds, expeditious retreat, grease, hideous laughter (DC 15); 0 (at will)—dancing lights, daze (DC 14), detect magic, mage hand, prestidigitation, read magic.',
   qualities:'Bardic knowledge +4; lore master 1/day; versatile performances (comedy and oratory).',
   combatGear:'Potion of cure light wounds; potion of cure moderate wounds; potions of undetectable alignment (3); scroll of scare; scroll of sound burst; caltrops.',
   gear:'+1 chain shirt, +1 buckler, +1 rapier, +1 shortbow with 20 arrows, 132 gp.',
   importNotes:'Source-reviewed printed pp. 90–91 (PDF pp. 91–92). Separated bard spells from performance, completed gear on next page and kept alternative melee and ranged attacks distinct.'
  },
  weapons:[melee('Rapier +9',9,'1d6+1','Crit 18–20.'),melee('Rapier +4',4,'1d6+1','Crit 18–20.'),ranged('Shortbow +9',9,'1d6+1','×3 critical.'),ranged('Shortbow +4',4,'1d6+1','×3 critical.')],
  activeAbilities:[ability('Bardic Performance','su','22 rounds/day (move action); fascinate/suggestion DC 18; inspire courage +2, competence +3.')]
 },
 'gromog':{
  stats:{str:21,casterLevel:null},hpCurrent:20,
  text:{
   senses:'Darkvision 60 ft., low-light vision; Perception +5 (only +1 in opposed checks; checks reliant on sight automatically fail while blinded).',
   acDetail:'13, touch 4, flat-footed 13 (+4 armor, −4 blinded/itchy, −1 Dex, +5 natural, −1 size).',
   hpDetail:'30 maximum HP (4d8+12); currently 20 HP due to injuries.',
   saveDetail:'Fort +6, Ref −2, Will +3.',
   movementDetail:'Speed 25 ft. (15 ft. in armor).',
   weaknesses:'Blinded (will recover); itchy armor (-2 to AC, Reflex saves and weapon attack/damage rolls until cleaned).',
   attackDetail:'Broken ogre hook +1 (1d8+5), improvised one-handed weapon; printed attack/damage penalty from itchy gear included.',
   spellLikeAbilities:null,spellsKnown:null,
   specialAbilities:'Blinded (Ex): cannot see for this encounter, but sight can recover. Itchy (Ex): lice-infested hide armor gives −2 to AC, Reflex, weapon attack and damage rolls until armor is cleaned.',
   gear:'Hide armor; broken ogre hook (improvised one-handed weapon).',
   importNotes:'Source-reviewed printed p. 91 (PDF p. 92). Crucial split: 20 current vs 30 maximum HP; the Guriija spell text in auto-extracted sight/spells was removed. Preserved wounded blinded/itchy encounter state.'
  },
  weapons:[melee('Broken ogre hook',1,'1d8+5','Improvised one-handed weapon; printed itch penalties included.')],
  activeAbilities:[ability('Blinded','ex','All vision-reliant checks fail until eyesight recovers.'),ability('Itchy Armor','ex','−2 to AC, Reflex saves, attacks and weapon damage until the hide armor is cleaned.')]
 },
 'gurija':{
  stats:{str:21,regeneration:5},
  text:{
   acDetail:'17, touch 12, flat-footed 14 (+3 Dex, +5 natural, −1 size).',
   hpDetail:'66 (7 HD; 1d6+6d8+36); regeneration 5 (acid or fire).',
   saveDetail:'Fort +10, Ref +5, Will +7.',
   movementDetail:'Speed 30 ft.; space 10 ft., reach 10 ft.',
   attackDetail:'Bite +8 (1d8+5), claw +8 (1d6+5) and claw +8 (1d6+5). Rend 1d6+7 if both claws hit.',
   specialAttacks:'Rend (both claws, 1d6+7).',
   spellLikeAbilities:'Stormborn bloodline (CL 1st, concentration +1): thunderstaff 3/day.',
   spellsKnown:'Sorcerer (CL 1st, concentration +1): 1st (3/day)—ear-piercing scream (DC 12), shocking grasp; 0 (at will)—detect magic, jolt, message, prestidigitation. Stormborn bloodline.',
   qualities:'Stormborn bloodline arcana: +1 save DC for spells with electricity/sonic descriptors.',
   combatGear:'Potion of barkskin +2; wand of lightning bolt (CL 7th; 10 charges).',
   importNotes:'Source-reviewed printed pp. 91–92 (PDF pp. 92–93). Repaired bloodline magic/sorcerer spell boundary and removed neighboring character text. Separated two claw rolls and retained regeneration/acid-fire bypass.'
  },
  weapons:[melee('Bite',8,'1d8+5'),melee('Claw 1',8,'1d6+5'),melee('Claw 2',8,'1d6+5')],
  activeAbilities:[ability('Regeneration','ex','5 HP/round; stopped by acid or fire.'),ability('Rend','ex','If both claw attacks hit, deal 1d6+7 extra.'),ability('Thunderstaff','sp','Stormborn bloodline 3/day; CL 1st.')]
 },
 'hannis-drelev':{
  stats:{str:20},
  text:{
   acDetail:'27, touch 18, flat-footed 23 (+9 armor, +2 deflection, +3 Dex, +2 defending sword, +1 dodge).',
   hpDetail:'130 (12 HD; 6d8+6d10+66).',
   saveDetail:'Fort +13, Ref +12, Will +5 (+2 vs. fear).',
   defenses:'Trap sense +2, uncanny dodge.',
   movementDetail:'Speed 30 ft.',
   maneuverDetail:'CMB +15 (+19 disarm); CMD 31 (33 vs. disarm).',
   attackDetail:'+2 defending longsword +18/+13 (1d8+8, 17–20); alternative masterwork throwing axe +14 (1d6+5). Printed AC assumes +2 sword-defense bonus.',
   specialAttacks:'Sneak attack +3d6, fighter weapon training (heavy blades +1).',
   qualities:'Armor training 1, rogue talents (combat trick, surprise attacks, weapon training), trapfinding +3; exceptional resources (PC-level gear increases CR by 1).',
   combatGear:'Three potions of cure serious wounds.',
   gear:'+3 breastplate, +2 defending longsword, 3 masterwork throwing axes, belt of physical might +4 (Str, Con), cloak of resistance +2, ring of protection +2, rod of splendor, key ring to Drelev Keep.',
   specialAbilities:'Exceptional Resources (Ex): equipped with player-character rather than NPC wealth; increases CR by 1.',
   importNotes:'Source-reviewed printed pp. 92–93 (PDF pp. 93–94). Confirmed defending sword bonus included in AC, +1 CR exceptional resources, proper disarm modifiers and gear.'
  },
  weapons:[melee('Defending longsword +18',18,'1d8+8','Crit 17–20; +2 defending sword is allocated to AC.'),melee('Defending longsword +13',13,'1d8+8','Second iterative; +2 defending sword is allocated to AC.'),ranged('Mwk throwing axe',14,'1d6+5')],
  activeAbilities:[ability('Exceptional Resources','ex','PC-grade gear increases printed CR by 1.'),ability('Sneak Attack','ex','+3d6 when conditions permit.')]
 },
 'happs-bydon':{
  stats:{str:14},
  text:{
   acDetail:'14, touch 12, flat-footed 12 (+2 armor, +2 Dex).',
   hpDetail:'16 (1d10+6).',
   saveDetail:'Fort +4, Ref +4, Will +1.',
   attackDetail:'Melee dagger +3 (1d4+2, 19–20); alternative ranged composite longbow +3 (1d8+2, ×3).',
   specialAttacks:'Favored enemy elves +2.',
   qualities:'Track +1; wild empathy +1.',
   combatGear:'Two alchemist’s fires.',
   gear:'Leather armor, composite longbow (+2 Str) with 20 arrows, dagger, trail rations (2), Stag Lord amulet (20 gp), 35 gp.',
   importNotes:'Source-reviewed printed p. 93 (PDF p. 94). Removed next-person Hargulka narrative spill; kept CR 1/2 and both separate attack alternatives.'
  },
  weapons:[melee('Dagger',3,'1d4+2','Crit 19–20.'),ranged('Composite longbow',3,'1d8+2','×3 critical.')],
  activeAbilities:[ability('Favored Enemy','ex','Elves +2.')]
 }
});