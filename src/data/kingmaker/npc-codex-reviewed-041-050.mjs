// Kingmaker Bestiary (First Edition), NPC Codex #41-50.
// Reviewed printed pages 93-99 (PDF pages 94-100) against both page columns.
const melee=(name,npcAttackBonus,damage,desc='')=>({name,attack_type:'melee',npcAttackBonus,damage,...(desc?{desc}:{})});
const ranged=(name,npcAttackBonus,damage,desc='')=>({name,attack_type:'ranged',npcAttackBonus,damage,...(desc?{desc}:{})});
const ability=(name,ability_kind,desc)=>({name,ability_kind,desc});
export const KINGMAKER_NPC_CODEX_REVIEWED_041_050=Object.freeze({
 'hargulka':{
  stats:{str:26,regeneration:5},
  text:{
   acDetail:'20, touch 10, flat-footed 19 (+5 armor, +1 Dex, +5 natural, −1 size).',
   hpDetail:'109 (9 HD; 6d8+3d10+66); regeneration 5 (acid or fire).',
   saveDetail:'Fort +15, Ref +4, Will +5; +1 vs. fear.',
   movementDetail:'Speed 30 ft.; space 10 ft., reach 10 ft.',
   attackDetail:'One weapon/natural routine: +1 darkwood morningstar +16/+11 (2d6+9 each), bite +12 (1d8+4), and one claw +12 (1d6+4). Only one claw is listed in the printed morningstar routine; do not invent a second claw to trigger rend.',
   specialAttacks:'Rend (two claws, 1d6+12)—available only if two claws actually hit; normally impossible in the printed morningstar + bite + one-claw routine.',
   qualities:'Armor training 1; bravery +1.',
   combatGear:'Necklace of fireballs: one 8d6 bead, two 4d6 beads, three 2d6 beads.',
   gear:'+1 hide armor, +1 darkwood thundering morningstar (attack lists darkwood morningstar), rusty treasure-chest key concealed in bracelet skull (Perception DC 20).',
   importNotes:'Source-reviewed printed p. 93 (PDF p. 94). Removed chapter headings from attacks, saves and AC; split morningstar iteratives and single claw. Rend requires two claw hits even though base listed routine has only one.'
  },
  weapons:[melee('Darkwood morningstar +16',16,'2d6+9','First iterative; weapon is thundering (applies on critical hit).'),melee('Darkwood morningstar +11',11,'2d6+9','Second iterative; weapon is thundering (applies on critical hit).'),melee('Bite',12,'1d8+4'),melee('Claw (one)',12,'1d6+4')],
  activeAbilities:[ability('Regeneration','ex','5 HP/round; acid or fire prevents regeneration.'),ability('Rend (conditional)','ex','Requires two claw hits for additional 1d6+12; printed full-attack routine has only one claw.')]
 },
 'the-hateful-hermit':{
  stats:{str:10,space:5,reach:5},
  text:{
   raceClassLevels:'Old human rogue 7.',
   acDetail:'17, touch 14, flat-footed 14 (+3 armor, +1 deflection, +2 Dex, +1 dodge).',
   hpDetail:'49 (7d8+14).',
   saveDetail:'Fort +3, Ref +7, Will +3.',
   defenses:'Evasion, trap sense +2, uncanny dodge.',
   movementDetail:'Speed 30 ft. Space 5 ft., reach 5 ft., or reach 10 ft. with +1 whip.',
   attackDetail:'Alternative melee: +1 whip +8 (1d3+1 nonlethal, 10-ft. reach) OR masterwork short sword +8 (1d6/19–20); not simultaneous.',
   specialAttacks:'Sneak attack +4d6.',
   feats:'Combat Expertise, Dodge, Exotic Weapon Proficiency (whip), Improved Initiative, Improved Trip, Skill Focus (Handle Animal), Weapon Finesse.',
   qualities:'Rogue talents (combat trick, finesse rogue, surprise attacks), trapfinding +3.',
   gear:'+1 leather armor, +1 whip, masterwork short sword, ring of protection +1.',
   importNotes:'Source-reviewed printed pp. 93–94 (PDF pp. 94–95). Reassembled split whip proficiency feat and removed Hillstomper narrative from equipment. Whip and sword remain alternate attacks.'
  },
  weapons:[melee('+1 whip',8,'1d3+1','Nonlethal; reach 10 ft.'),melee('Mwk short sword',8,'1d6','Alternate weapon, critical 19–20.')],
  activeAbilities:[ability('Sneak Attack','ex','+4d6 precision damage.'),ability('Improved Trip','ex','CMB +7 trip, CMD 21 vs trip.')]
 },
 'hillstomper':{
  stats:{str:33},
  text:{
   raceClassLevels:'Awakened mammoth (Pathfinder Bestiary p. 128).',
   sourceReference:'Awakened mammoth (Pathfinder Bestiary p. 128).',
   acDetail:'21, touch 8, flat-footed 21 (+13 natural, −2 size).',
   hpDetail:'172 (15d8+105).',
   saveDetail:'Fort +15, Ref +9, Will +8.',
   movementDetail:'Speed 40 ft.; space 15 ft., reach 10 ft.',
   maneuverDetail:'CMB +24 (+26 bull rush); CMD 34 (36 vs. bull rush).',
   attackDetail:'Gore +21 (2d6+11), slam +21 (1d8+11), and two stamps +19 (2d6+5 each).',
   specialAttacks:'Trample (1d8+16, Reflex DC 28).',
   languages:'Common.',
   importNotes:'Source-reviewed printed p. 94 (PDF p. 95). Four natural attacks rolled separately, original trample damage/save retained, removed Hooktongue narrative from language field.'
  },
  weapons:[melee('Gore',21,'2d6+11'),melee('Slam',21,'1d8+11'),melee('Stamp 1',19,'2d6+5'),melee('Stamp 2',19,'2d6+5')],
  activeAbilities:[ability('Trample','ex','1d8+16 damage; Reflex DC 28.')]
 },
 'hooktongue':{
  stats:{str:26},
  text:{
   raceClassLevels:'Variant water orm (Pathfinder Bestiary 2, p. 280).',
   sourceReference:'Variant water orm (Pathfinder Bestiary 2, p. 280).',
   senses:'Darkvision 120 ft., low-light vision.',
   acDetail:'28, touch 11, flat-footed 25 (+3 Dex, +17 natural, −2 size).',
   hpDetail:'195 (17d10+102).',
   saveDetail:'Fort +16, Ref +15, Will +12.',
   defenses:'Elusive; immunity to cold; resistance to fire 20.',
   immunities:'Cold.',
   energyResistances:'Fire 20.',
   movementDetail:'Speed 20 ft., swim 50 ft.; space 15 ft., reach 20 ft.',
   maneuverDetail:'CMB +27 (+31 grapple); CMD 40 (44 vs. trip).',
   attackDetail:'Bite +23 (6d6+8/19–20 plus grab) and primary piercing tongue +23 (3d8+8 plus poison).',
   specialAttacks:'Swallow whole (3d6+12 bludgeoning, interior AC 18 and 19 HP); venomous spray (80-ft. line, 15d6, DC 24 Reflex half, every 1d4 rounds).',
   specialAbilities:'Tongue poison (Su): injury, Fort DC 24; 1/round for 6 rounds; 1d4 Dex damage and confused for 1 round; cure two consecutive successful saves. Confusion is mind-affecting. Venomous Spray (Su): 80-ft. line, 15d6 damage, DC 24 Reflex half, once every 1d4 rounds; creatures damaged are also exposed to tongue poison.',
   qualities:'Water travel; tongue is a primary piercing natural attack.',
   importNotes:'Source-reviewed printed pp. 94–95 (PDF pp. 95–96). Recovered venomous spray 15d6/80 ft. line and poison DC 24 across page break; never treat spray as a rolled melee attack.'
  },
  weapons:[melee('Bite',23,'6d6+8','Critical 19–20, plus grab.'),melee('Tongue',23,'3d8+8','Primary piercing attack; poison Fort DC 24.')],
  activeAbilities:[ability('Venomous Spray','su','Every 1d4 rounds: 80-ft. line for 15d6, Reflex DC 24 half; damage also exposes victim to tongue poison.'),ability('Tongue Poison','su','Fort DC 24, 1/round up to 6 rounds, 1d4 Dex and confused 1 round; 2 consecutive saves cure.'),ability('Swallow Whole','ex','3d6+12 bludgeoning; interior AC 18, 19 HP.')]
 },
 'the-horned-hunter':{
  stats:{str:18},
  text:{
   raceClassLevels:'Male satyr ranger 14 (Pathfinder Bestiary p. 241).',
   acDetail:'32, touch 17, flat-footed 25 (+6 armor, +6 Dex, +1 dodge, +9 natural).',
   hpDetail:'251 (22 HD; 8d6+14d10+146).',
   saveDetail:'Fort +16, Ref +22, Will +15.',
   defenses:'Evasion; DR 5/cold iron.',
   movementDetail:'Speed 40 ft.',
   attackDetail:'Horns +27 (1d6+8); or +4 seeking composite longbow +32/+27/+22/+17 (1d8+9, 19–20/×3).',
   specialAttacks:'Combat style (archery), favored enemies (elves +2, gnomes +2, humans +6), pipes, quarry.',
   spellLikeAbilities:'Satyr spell-like abilities (CL 8th; concentration +12): at will—charm person (DC 15), dancing lights, ghost sound (DC 14), sleep (DC 15), suggestion (DC 17); 1/day—fear (DC 18), summon nature’s ally III.',
   spellsPrepared:'Ranger (CL 11th; concentration +14): 4th—cure serious wounds; 3rd—cure moderate wounds, greater magic fang; 2nd—barkskin, cat’s grace, protection from energy; 1st—charm animal (DC 14), entangle (DC 14), longstrider, pass without trace.',
   tactics:'Greater magic fang on horns daily; barkskin and cat’s grace cast before battle; printed stats include these preparations.',
   qualities:'Camouflage, favored terrains (forest +4, plains +4, swamp +2), hunter’s bond (companions), swift tracker, track +7, wild empathy +18, woodland stride.',
   combatGear:'Helm of teleportation.',
   gear:'+4 leather armor, +4 seeking composite longbow (+4 Str) with 20 arrows, greater bracers of archery.',
   importNotes:'Source-reviewed printed pp. 95–96 (PDF pp. 96–97). Split satyr spell-like abilities from ranger preparations, restored three terrains, four bow attacks and clean gear.'
  },
  weapons:[melee('Horns',27,'1d6+8'),...([32,27,22,17].map(x=>ranged('Seeking longbow +'+x,x,'1d8+9','Critical 19–20/×3.')))],
  activeAbilities:[ability('Pipes','su','Satyr pipes special attack; use satyr rules.'),ability('Quarry','ex','Ranger quarry.'),ability('Favored Enemies','ex','Humans +6; elves +2; gnomes +2.')]
 },
 'ilthuliak':{
  stats:{str:37,casterLevel:26},
  text:{
   raceClassLevels:'Variant female great wyrm black dragon (Pathfinder Bestiary p. 92).',
   sourceReference:'Variant female great wyrm black dragon (Pathfinder Bestiary p. 92).',
   senses:'Dragon senses; Perception +39.',
   aura:'Frightful presence (360 ft., DC 29).',
   acDetail:'45, touch 5, flat-footed 45 (+4 armor, −1 Dex, +36 natural, −4 size).',
   hpDetail:'406 (28d12+224).',
   saveDetail:'Fort +24, Ref +15, Will +22.',
   defenses:'Evasion (ring of evasion); DR 20/magic; immunity to acid, paralysis and sleep; SR 32.',
   immunities:'Acid, paralysis and sleep.',
   movementDetail:'Speed 60 ft., fly 250 ft. (clumsy), swim 60 ft.; space 20 ft., reach 15 ft. (bite reach 20 ft.).',
   maneuverDetail:'CMB +45; CMD 54 (58 vs. trip).',
   attackDetail:'Bite +38 (4d6+19, 19–20, plus 6d6 acid), two claws +37 (2d8+13 each), tail slap +35 (2d8+19), two wings +35 (2d6+6 each).',
   specialAttacks:'Acid pool (60-ft. radius, 24d6 acid), acidic bite, 120-ft. line acid breath (24d6, Reflex DC 32 half), crush (Medium or smaller, 4d6+19, DC 32), tail sweep (30 ft., 2d6+19, DC 32).',
   spellLikeAbilities:'Dragon innate magic (CL 26th; concentration +31): constant—speak with animals (reptiles only); at will—darkness (120-ft. radius), insect plague, plant growth; 3/day—charm monster (reptiles only, DC 21); 1/day—corrupt water.',
   spellsKnown:'Sorcerer spells (CL 15th; concentration +20): 7th (4/day)—finger of death (DC 22), power word blind; 6th (6/day)—acid fog, greater dispel magic, flesh to stone (DC 21); 5th (7/day)—feeblemind (DC 20), teleport, transmute rock to mud, wall of force; 4th (7/day)—dimension door, enervation, hallucinatory terrain (DC 19), mass reduce person (DC 19); 3rd (7/day)—clairaudience/clairvoyance, dispel magic, haste, suggestion (DC 18); 2nd (7/day)—acid arrow, detect thoughts (DC 17), invisibility, resist energy, scorching ray; 1st (8/day)—charm person (DC 16), grease, mage armor, ray of enfeeblement (DC 16), shield; 0 (at will)—acid splash, bleed (DC 15), dancing lights, detect magic, mage hand, message, prestidigitation, read magic, resistance.',
   tactics:'Mage armor cast beforehand; printed AC includes +4 armor.',
   qualities:'Speak with reptiles, swamp stride, water breathing.',
   gear:'Ring of evasion.',
   importNotes:'Source-reviewed printed pp. 96–97 (PDF pp. 97–98). Critical: CL 26 for spell-like magic versus sorcerer spells CL 15, separate 6 natural attacks, and distinct 24d6 breath/acid pool and 6d6 bite bonus.'
  },
  weapons:[melee('Bite',38,'4d6+19','Crit 19–20; plus 6d6 acid, reach 20 ft.'),melee('Claw 1',37,'2d8+13'),melee('Claw 2',37,'2d8+13'),melee('Tail slap',35,'2d8+19'),melee('Wing 1',35,'2d6+6'),melee('Wing 2',35,'2d6+6')],
  activeAbilities:[ability('Acid Breath','su','120-ft. line, 24d6 acid, Reflex DC 32 half.'),ability('Acid Pool','su','60-ft. radius, 24d6 acid; distinct from line breath.'),ability('Crush','ex','4d6+19 against Medium or smaller, Reflex DC 32.'),ability('Tail Sweep','ex','30-ft. area, 2d6+19, DC 32.'),ability('Frightful Presence','ex','360 ft., DC 29.'),ability('Acidic Bite','ex','Plus 6d6 acid on bite hit.')]
 },
 'ilora-nuski':{
  stats:{str:16},
  text:{
   acDetail:'23, touch 16, flat-footed 19 (+5 armor, +2 deflection, +3 Dex, +1 dodge, +1 natural, +1 shield).',
   hpDetail:'128 (13d10+52).',
   saveDetail:'Fort +10, Ref +11, Will +5.',
   defenses:'Evasion.',
   movementDetail:'Speed 40 ft.',
   attackDetail:'Two distinct +1 short sword series, main-hand +16/+11/+6 (1d6+4, 17–20) and off-hand +16/+11/+6 (same). Alternative ranged dagger +16 (1d4+3, 19–20).',
   specialAttacks:'Combat style (two-weapon combat), favored enemies (fey +2, giants +4, humans +4), quarry.',
   spellsPrepared:'Ranger (CL 10th; concentration +11): 3rd—cure moderate wounds; 2nd—barkskin, cure light wounds; 1st—alarm, animal messenger, endure elements, entangle (DC 12).',
   feats:'Dodge, Double Slice, Endurance, Greater Two-weapon Fighting, Improved Critical (short sword), Improved Two-weapon Fighting, Toughness, Two-weapon Defense, Two-weapon Fighting, Two-weapon Rend, Vital Strike, Weapon Focus (short sword).',
   qualities:'Camouflage, favored terrains (forest +2, mountainous +2, urban +6), hunter’s bond (companions), swift tracker, track +6, wild empathy +12, woodland stride.',
   gear:'+2 studded leather, two +1 short swords, dagger, amulet of natural armor +1, belt of incredible dexterity +2, boots of striding and springing, ring of protection +2, 5 gp.',
   skillDetail:'Climb +19, Handle Animal +15, Intimidate +15, Perception +17, Stealth +19, Survival +17, Swim +19.',
   importNotes:'Source-reviewed printed p. 97 (PDF p. 98). Restored 1st-level ranger spells, complete feat/skill lists and 6 separately rolled two-weapon short sword attacks; removed neighboring Imeckus text.'
  },
  weapons:[...([16,11,6].map(x=>melee('Main short sword +'+x,x,'1d6+4','Crit 17–20.'))),...([16,11,6].map(x=>melee('Off-hand short sword +'+x,x,'1d6+4','Crit 17–20.'))),ranged('Dagger',16,'1d4+3','Alternate ranged attack, crit 19–20.')],
  npcSkills:[{name:'Climb',bonus:19},{name:'Handle Animal',bonus:15},{name:'Intimidate',bonus:15},{name:'Perception',bonus:17},{name:'Stealth',bonus:19},{name:'Survival',bonus:17},{name:'Swim',bonus:19}],
  activeAbilities:[ability('Two-Weapon Rend','ex','Use when main and offhand sword attacks both hit the same foe.'),ability('Favored Enemies','ex','Fey +2; giants +4; humans +4.')]
 },
 'imeckus-stroon':{
  stats:{str:10},
  text:{
   acDetail:'18, touch 14, flat-footed 16 (+4 armor, +2 deflection, +2 Dex).',
   hpDetail:'115 (13d6+67).',
   saveDetail:'Fort +8, Ref +10, Will +13.',
   defenses:'Contingency: if he fails a save against a debilitating non-instantaneous spell, dispel magic attempts to end the effect.',
   attackDetail:'Melee dagger +6/+1 (1d4, crit 19–20).',
   specialAttacks:'Intense spells (+6 evocation damage).',
   spellLikeAbilities:'Evoker school (CL 13th; concentration +17): elemental wall at will (13 rounds/day); force missile 7/day (1d4+6).',
   spellsPrepared:'Evoker (CL 13th; concentration +17): 7th—delayed blast fireball (DC 22), prismatic spray (DC 22); 6th—chain lightning (DC 21), disintegrate (DC 20), greater dispel magic; 5th—empowered lightning bolt (DC 18), sending, teleport, wall of force; 4th—enervation (2), fire shield, ice storm, resilient sphere (DC 19), scrying (DC 18); 3rd—extended false life, fly, gaseous form, lightning bolt (DC 18), protection from energy, slow (DC 17); 2nd—alter self, detect thoughts (DC 16), levitate, extended mage armor, pyrotechnics (DC 16), scorching ray; 1st—burning hands (DC 16), magic missile (3), ray of enfeeblement (DC 15), shield; 0 (at will)—arcane mark, dancing lights, detect magic, mage hand. Opposition schools: Enchantment and Illusion.',
   tactics:'Extended mage armor and extended false life cast before combat; printed AC/HP include these.',
   qualities:'Arcane bond: improved familiar Lintwerth.',
   combatGear:'Staff of fire.',
   gear:'Dagger, cloak of resistance +2, ring of protection +2, spellbook containing prepared spells plus contingency and six additional spells per level 1st–6th.',
   specialAbilities:'Contingency: on failing a saving throw against a debilitating spell with duration greater than instantaneous, dispel magic attempts to remove the spell effect.',
   importNotes:'Source-reviewed printed pp. 97–98 (PDF pp. 98–99). Extracted all prepared wizard spell levels from spillover, kept force missile as school magic, completed spellbook details and contingent dispel trigger.'
  },
  weapons:[melee('Dagger +6',6,'1d4','Crit 19–20.'),melee('Dagger +1',1,'1d4','Crit 19–20.')],
  activeAbilities:[ability('Contingency (Dispel Magic)','sp','On failed save against debilitating non-instantaneous-duration spell, cast dispel magic to end it.'),ability('Force Missile','sp','7/day, 1d4+6 force damage.'),ability('Elemental Wall','sp','At will, up to 13 rounds/day.'),ability('Intense Spells','ex','+6 damage to applicable evocation spells.')]
 },
 'irahkatu':{
  stats:{str:26},
  text:{
   raceClassLevels:'Variant ahuizotl (Pathfinder Bestiary 3, p. 10).',
   sourceReference:'Variant ahuizotl (Pathfinder Bestiary 3, p. 10).',
   acDetail:'27, touch 13, flat-footed 23 (+4 Dex, +14 natural, −1 size).',
   hpDetail:'187 (15d10+105).',
   saveDetail:'Fort +15, Ref +13, Will +11.',
   movementDetail:'Speed 30 ft.; swim 50 ft.; space 10 ft., reach 10 ft.',
   maneuverDetail:'CMB +24 (+28 grapple); CMD 38 (42 vs. trip).',
   attackDetail:'Base: bite +22 (3d6+8), one claw +22 (2d6+8, 19–20, plus grab). Conditional rake: two more claws +22 (1d6+8 plus grab each) only when rake is available.',
   specialAttacks:'Rake (two claws +22, 1d6+8 each plus grab); sneak attack +2d6.',
   qualities:'Amphibious, tenacious grapple, voice mimicry.',
   importNotes:'Source-reviewed printed p. 98 (PDF p. 99). Split one normal claw from two conditional rake claws; restored grapple modifiers and excluded next NPC narration.'
  },
  weapons:[melee('Bite',22,'3d6+8'),melee('Claw',22,'2d6+8','Critical 19–20, plus grab.'),melee('Rake claw 1 (conditional)',22,'1d6+8','Only when rake qualifies; plus grab.'),melee('Rake claw 2 (conditional)',22,'1d6+8','Only when rake qualifies; plus grab.')],
  activeAbilities:[ability('Rake','ex','Two additional claws +22, 1d6+8 each plus grab, conditional on rake eligibility.'),ability('Sneak Attack','ex','+2d6 precision damage.'),ability('Tenacious Grapple','ex','Ahuizotl grappling trait; CMB +28 grapple.')]
 },
 'irovetti-s-fetch':{
  stats:{str:28,regeneration:5},
  text:{
   acDetail:'36, touch 20, flat-footed 26 (+9 Dex, +1 dodge, +16 natural).',
   hpDetail:'364 (27d6+270); regeneration 5 (fire or negative energy).',
   saveDetail:'Fort +19, Ref +24, Will +21.',
   defenses:'DR 15/cold iron; SR 31; regeneration 5 (fire or negative energy).',
   movementDetail:'Speed 40 ft.; constant air walk.',
   attackDetail:'+5 fetch weapon +28/+23/+18 (6d6+14 each, critical 15–20).',
   specialAttacks:'Fetch weapon; see source/specific fetch rules.',
   spellLikeAbilities:'CL 18th; concentration +27: constant—air walk and tongues; at will—arcane sight, scorching ray, veil (self only); 3/day—quickened scorching ray; 1/day—disjunction, finger of death (DC 26), greater shadow conjuration, plane shift (First World only).',
   languages:'Common, Sylvan; constant tongues.',
   importNotes:'Source-reviewed printed p. 99 (PDF p. 100). Recovered full 15–20 critical range, three iterative fetch-weapon attacks, precise regeneration bypass and constant air walk/tongues; removed next Jaggedbriar Hag narrative.'
  },
  weapons:[melee('Fetch weapon +28',28,'6d6+14','Crit 15–20.'),melee('Fetch weapon +23',23,'6d6+14','Crit 15–20.'),melee('Fetch weapon +18',18,'6d6+14','Crit 15–20.')],
  activeAbilities:[ability('Regeneration','ex','5 HP/round; stopped by fire or negative energy.'),ability('Fetch Weapon','su','Conjured +5 fetch weapon, 6d6+14, critical 15–20; source-specific ability.'),ability('Quickened Scorching Ray','sp','3/day, quickened; ordinary scorching ray available at will.')]
 }
});