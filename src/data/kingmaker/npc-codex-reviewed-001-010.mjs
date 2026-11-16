// Kingmaker Bestiary (First Edition), NPC Codex 1–10.
// Compared with source printed pp. 67–73 (PDF pp. 68–74), including
// multi-column page breaks, alternate creature forms, and artifact sidebars.
// Compact game-rule summaries only, not the adventure narrative.
const melee=(name,npcAttackBonus,damage,desc='')=>({name,attack_type:'melee',npcAttackBonus,damage,...(desc?{desc}:{})});
const ranged=(name,npcAttackBonus,damage,desc='')=>({name,attack_type:'ranged',npcAttackBonus,damage,...(desc?{desc}:{})});
const ability=(name,ability_kind,desc)=>({name,ability_kind,desc});
export const KINGMAKER_NPC_CODEX_REVIEWED_001_010=Object.freeze({
 'aecora-silverfire':{
  stats:{str:20,cmd:25,space:10,reach:5},
  text:{
   sourceReference:'Female centaur cleric of Desna 6 (Pathfinder Bestiary 42).',
   senses:'Darkvision 60 ft.',
   acDetail:'22, touch 10, flat-footed 21 (+7 armor, +1 Dex, +1 natural, +4 shield, −1 size).',
   hpDetail:'95 (10 HD; 6d8+4d10+46).',
   saveDetail:'Fort +9, Ref +7, Will +13.',
   movementDetail:'Speed 60 ft. (40 ft. in armor). Space 10 ft.; reach 5 ft.',
   maneuverDetail:'CMB +14; CMD 25 (29 vs. trip).',
   attackDetail:'Melee +1 shortspear +13/+8 (1d6+6), two hooves +7 (1d6+2 each).',
   specialAttacks:'Channel positive energy 6/day (DC 16, 3d6).',
   spellsPrepared:'Cleric (CL 6th; concentration +10): 3rd—bestow curse (DC 17), dispel magic, fly [domain], prayer; 2nd—bear’s endurance, remove paralysis [domain], lesser restoration, silence (DC 16), sound burst (DC 16); 1st—bless, command (DC 15), detect evil, longstrider [domain], sanctuary (DC 15); 0 (at will)—create water, detect magic, guidance, purify food and drink (DC 14). Domains: Liberation and Travel.',
   qualities:'Agile feet (7/day); liberation (6 rounds/day); undersized weapons.',
   gear:'+1 breastplate; +1 heavy wooden shield; +1 shortspear; silver holy symbol of Desna.',
   importNotes:'Source-reviewed printed p. 67 (PDF p. 68). Removed neighboring column headings from gear; preserved armor-adjusted speed, domain spells, and two separately rollable hooves.'
  },
  weapons:[
   melee('+1 shortspear +13',13,'1d6+6','First iterative attack.'),
   melee('+1 shortspear +8',8,'1d6+6','Second iterative attack.'),
   melee('Hoof 1',7,'1d6+2'),
   melee('Hoof 2',7,'1d6+2')
  ],
  activeAbilities:[ability('Channel Positive Energy','su','6/day; 3d6 healing or positive-energy damage; DC 16.'),ability('Liberation Domain','su','Agile feet 7/day and liberation 6 rounds/day.')]
 },
 'agai':{
  stats:{str:14,space:null,reach:null},
  text:{
   sourceReference:'Male spriggan fighter 6 (Pathfinder Bestiary 2, p. 257).',
   senses:'Low-light vision.',
   acDetail:'Small form: AC 21, touch 14, flat-footed 18 (+7 armor, +3 Dex, +1 size).',
   hpDetail:'Small form: 87 (10 HD; 4d8+6d10+36). Enlarged form: 117 (10 HD; 4d8+6d10+66).',
   saveDetail:'Small: Fort +12, Ref +7, Will +6 (+2 vs. fear). Enlarged: Fort +15, Ref +6, Will +6 (+2 vs. fear).',
   movementDetail:'Small form 20 ft. (15 ft. in armor); enlarged form 20 ft., space 10 ft., reach 10 ft.',
   maneuverDetail:'Small CMB +10, CMD 24. Enlarged CMB +18, CMD 31.',
   specialAttacks:'Small form: sneak attack +2d6, weapon training (crossbows +1). Enlarged form: weapon training (crossbows +1); sneak attack not listed.',
   spellLikeAbilities:'CL 4th, concentration +5: at will—flare (DC 11), scare (DC 13), shatter (DC 13).',
   qualities:'Armor training 1, size alteration, spriggan magic, spriggan skills. Two separate printed Small and enlarged stat blocks.',
   combatGear:'Potion of cure serious wounds.',
   gear:'+1 breastplate, +1 seeking heavy crossbow with 20 bolts, masterwork morningstar, bag of holding IV.',
   attackDetail:'Small: mwk morningstar +14/+9 (1d6+2), +1 seeking heavy crossbow +17 (1d8+4/19–20). Enlarged: mwk morningstar +18/+13 (2d6+8), crossbow +14 (2d8+4/19–20). These are alternate forms, not simultaneous attacks.',
   skillDetail:'Small: Climb +5, Disable Device +6, Intimidate +10, Perception +12, Sleight of Hand +8, Stealth +13. Enlarged: Climb +12, Disable Device +6, Intimidate +10, Perception +12, Sleight of Hand +8, Stealth +5.',
   importNotes:'Source-reviewed printed pp. 67–68 (PDF pp. 68–69). Kept Small form as base and separately preserved enlarged 117-HP variant; removed falsely inherited large-size space/reach from Small form and contaminated gear.'
  },
  variants:[
   {name:'Agai (Small)',level:10,hp:87,pdfPage:68,stats:{str:14,dex:18,con:16,int:10,wis:12,cha:12,initiative:4,ac:21,touch:14,flat:18,fort:12,ref:7,will:6,speed:20,bab:9,cmb:10,cmd:24},text:{attackDetail:'Mwk morningstar +14/+9 (1d6+2); seeking crossbow +17 (1d8+4/19–20).'}},
   {name:'Enlarged Agai',level:10,hp:117,pdfPage:69,stats:{str:26,dex:16,con:22,int:10,wis:12,cha:12,initiative:3,ac:19,touch:12,flat:16,fort:15,ref:6,will:6,speed:20,space:10,reach:10,bab:9,cmb:18,cmd:31},text:{attackDetail:'Mwk morningstar +18/+13 (2d6+8); seeking crossbow +14 (2d8+4/19–20).'}}
  ],
  weapons:[
   melee('Small: morningstar +14',14,'1d6+2','Small form only; first iterative.'),
   melee('Small: morningstar +9',9,'1d6+2','Small form only; second iterative.'),
   ranged('Small: seeking heavy crossbow',17,'1d8+4','Small form only; critical 19–20.'),
   melee('Enlarged: morningstar +18',18,'2d6+8','Alternate enlarged form only; first iterative.'),
   melee('Enlarged: morningstar +13',13,'2d6+8','Alternate enlarged form only; second iterative.'),
   ranged('Enlarged: seeking heavy crossbow',14,'2d8+4','Alternate enlarged form only; critical 19–20.')
  ],
  activeAbilities:[ability('Size Alteration','sp','Agai has complete alternate Small and enlarged printed stat blocks; select only the current form.'),ability('Spriggan Spell-Like Abilities','sp','At will: flare DC 11, scare DC 13, shatter DC 13 (CL 4th).')]
 },
 'akiros-ismort':{
  stats:{str:18,space:null,reach:null},
  text:{
   senses:null,
   raceClassLevels:'Male human ex-paladin 1/barbarian 3.',
   acDetail:'17, touch 9, flat-footed 16 (+6 armor, +1 Dex, −2 rage, +2 shield).',
   hpDetail:'50 (4 HD; 1d10+3d12+21).',
   saveDetail:'Fort +10, Ref +2, Will +6.',
   movementDetail:'Speed 40 ft. (30 ft. in armor).',
   attackDetail:'Melee +1 longsword +10 (1d8+5/19–20); ranged composite longbow +5 (1d8+2/×3).',
   defenses:'Trap sense +1 and uncanny dodge.',
   tactics:'Begins combat raging; printed AC, ability scores and attacks already include rage bonuses.',
   combatGear:'Potions of cure light wounds (2).',
   gear:'Masterwork chainmail, heavy steel shield, +1 longsword, composite longbow (+2 Str) with 20 arrows and three +1 beast-bane arrows, silver holy symbol of Erastil, Stag Lord amulet (20 gp), 80 gp.',
   importNotes:'Source-reviewed printed p. 68 (PDF p. 69). Restored Strength 18 and rage-prepared tactics; replaced garbled longbow critical notation with ×3 and separated consumables from gear.'
  },
  weapons:[melee('+1 longsword',10,'1d8+5','Critical 19–20; printed rage bonuses included.'),ranged('Composite longbow',5,'1d8+2','Critical ×3; composite (+2 Str).')],
  activeAbilities:[ability('Rage','ex','11 rounds/day; printed combat statistics already reflect rage.'),ability('Quick Reflexes','ex','Rage power: quick reflexes; use barbarian rules.')]
 },
 'akuzhail':{
  stats:{str:23},
  text:{
   sourceReference:'Variant chimera (Pathfinder Bestiary, p. 44).',
   senses:'Darkvision 60 ft.; low-light vision; scent.',
   acDetail:'23, touch 14, flat-footed 18 (+4 Dex, +1 dodge, +9 natural, −1 size).',
   hpDetail:'138 (12d10+72).',
   saveDetail:'Fort +13, Ref +12, Will +9.',
   movementDetail:'Speed 30 ft.; fly 50 ft. (poor); bloom stride. Space 10 ft.; reach 5 ft.',
   maneuverDetail:'CMB +19; CMD 34 (38 vs. trip).',
   defenses:'Life Bloom triggers on death.',
   immunities:'Acid and poison.',
   energyResistances:null,
   attackDetail:'Three separate bites +17: 2d6+6 plus poison, 1d8+6 plus 1d6 bleed, and 1d8+6 plus 1d6 acid; two claws +17 (1d6+6 each).',
   specialAttacks:'Bleed 1d6; bloom curse; breath 40-ft. line of acid, 8d8, Reflex DC 21 half, every 1d4 rounds; frightening rattle.',
   specialAbilities:'Bloom Curse (Su): a victim suffering Strength damage from its poison greater than the victim’s Strength is cursed (Fort DC 19). First failure causes 2 Str drain after 24 hours; subsequent saves every 8 hours resist 1d4 Str damage and 2d6 poison damage. Three consecutive successful saves end the curse. Death or unconsciousness from the curse produces a GM-chosen chaotic evil low-Int beast or dragon of the victim’s HD. Bloom Stride (Ex): ignores undergrowth difficult terrain in its cavern. Frightening Rattle (Su): move action, creatures within 30 ft. Will DC 19 or frightened 1d4 rounds; immunity for 24 hours after success. Life Bloom (Su): on death, living creatures within 60 ft. heal 12d6; a bloom of Lamashtu appears, inactive that round, staggered on its next turn with later 50% chance to end staggering. Poison (Su): bite injury, Fort DC 21, 1/round for 6 rounds, 1d4 Strength damage, cured by 2 consecutive successful saves.',
   skillDetail:'Fly +5, Perception +15, Stealth +7 (+11 in scrubland or brush).',
   importNotes:'Source-reviewed printed pp. 68–69 (PDF pp. 69–70). Restored all five special rules crossing page boundary; removed misfiled curse prose from energy resistance; expanded all five natural attacks.'
  },
  weapons:[
   melee('Vulture bite',17,'2d6+6','Plus poison; see Poison (Su).'),
   melee('Centipede bite',17,'1d8+6','Plus 1d6 bleed.'),
   melee('Snake bite',17,'1d8+6','Plus 1d6 acid.'),
   melee('Claw 1',17,'1d6+6'),
   melee('Claw 2',17,'1d6+6')
  ],
  activeAbilities:[
   ability('Acid Breath','su','40-ft. line, 8d8 acid; Reflex DC 21 half; usable every 1d4 rounds.'),
   ability('Bloom Curse','su','Fort DC 19. Initially 2 Str drain after 24 hours, then 1d4 Str and 2d6 poison damage every 8 hours until 3 consecutive successes; death/unconsciousness may spawn a monster.'),
   ability('Frightening Rattle','su','Move action, 30-ft. radius, Will DC 19 or frightened 1d4 rounds; 24-hour immunity after a successful save.'),
   ability('Life Bloom','su','On death, 60-ft. radius heals living creatures 12d6 and creates a bloom of Lamashtu; initial inactivity and staggering apply.'),
   ability('Poison Bite','su','Fort DC 21, 1d4 Strength damage each round for up to 6 rounds, 2 consecutive saves cure.'),
   ability('Bloom Stride','ex','Ignore undergrowth difficult terrain in its cavern.')
  ]
 },
 'alasen':{
  stats:{str:25},
  text:{
   sourceReference:'Female human natural weretiger rogue 14 (Pathfinder Bestiary 2, p. 183).',
   raceClassLevels:'Female human natural weretiger rogue 14 (Pathfinder Bestiary 2, p. 183).',
   senses:'Low-light vision; scent.',
   acDetail:'27, touch 17, flat-footed 22 (+5 armor, +3 deflection, +4 Dex, +1 dodge, +5 natural, −1 size).',
   hpDetail:'150 (14d8+84).',
   saveDetail:'Fort +8, Ref +15, Will +6.',
   movementDetail:'Speed 35 ft.; space 10 ft.; reach 10 ft.',
   maneuverDetail:'CMB +18 (+22 grapple); CMD 36.',
   defenses:'Improved evasion, improved uncanny dodge, trap sense +4; DR 10/silver.',
   attackDetail:'Bite +16 (3d6+7 plus curse of lycanthropy), two claws +16 (2d6+7 plus grab each). Two additional rake claws +16 (2d6+7 plus grab each) apply only when rake can be used.',
   specialAttacks:'Curse of lycanthropy (DC 15); pounce; rake 2 claws +16; sneak attack +7d6 plus 7 bleed or 2 Str damage.',
   qualities:'+4 Stealth in undergrowth; change shape (human/hybrid/tiger; polymorph); lycanthropic empathy (+4 with tigers and dire tigers); rogue talents: bleeding attack, combat trick, crippling strike, fast stealth, improved evasion, slippery mind, surprise attacks; trapfinding +7.',
   combatGear:'Ring of invisibility.',
   gear:'+3 leather armor; ring of protection +3.',
   importNotes:'Source-reviewed printed pp. 69–70 (PDF pp. 70–71). Recovered gear, complete rogue talents and AC; removed neighboring character narrative from gear and sidebars from HP.'
  },
  weapons:[
   melee('Bite',16,'3d6+7','Plus curse of lycanthropy, DC 15.'),
   melee('Claw 1',16,'2d6+7','Plus grab.'),
   melee('Claw 2',16,'2d6+7','Plus grab.'),
   melee('Rake claw 1 (conditional)',16,'2d6+7','Use only when rake is available; plus grab.'),
   melee('Rake claw 2 (conditional)',16,'2d6+7','Use only when rake is available; plus grab.')
  ],
  activeAbilities:[
   ability('Pounce','ex','Allows full natural-attack routine on charge.'),
   ability('Rake','ex','Two rake claws +16, 2d6+7 plus grab; conditional special attack.'),
   ability('Sneak Attack','ex','+7d6 plus 7 bleed or 2 Strength damage, per printed rogue talents.'),
   ability('Lycanthropy Curse','su','Bite transmits lycanthropy, DC 15; see lycanthropy rules.')
  ]
 },
 'ameon-trask':{
  stats:{str:14},
  text:{
   senses:null,
   acDetail:'22, touch 14, flat-footed 18 (+7 armor, +3 Dex, +1 dodge, +1 shield).',
   hpDetail:'110 (11 HD; 5d8+6d10+50).',
   saveDetail:'Fort +9, Ref +10, Will +4 (+2 vs. fear).',
   attackDetail:'Two separate +1 short swords each +14/+9 (1d6+6, critical 17–20). Alternate ranged mwk composite shortbow +14/+9 (1d6+2, critical ×3).',
   specialAttacks:'Sneak attack +3d6; weapon training (light blades +1).',
   feats:'Dazzling Display, Dodge, Double Slice, Improved Critical (short sword), Improved Two-weapon Fighting, Iron Will, Shatter Defenses, Toughness, Two-weapon Defense, Two-weapon Fighting, Weapon Finesse, Weapon Focus (short sword), Weapon Specialization (short sword).',
   qualities:'Armor training 1; rogue talents (finesse rogue, weapon training); trapfinding +2.',
   combatGear:'Two fire elemental gems, potion of barkskin +2, two potions of bear’s endurance, potion of cure serious wounds.',
   gear:'+1 chainmail; two +1 short swords; mwk composite shortbow (+2 Str) with 20 arrows; belt of incredible dexterity +2; 55 gp.',
   importNotes:'Source-reviewed printed p. 70 (PDF p. 71). Restored 13 feats and two four-attack short-sword routines, retained separate two-attack bow option.'
  },
  weapons:[
   melee('Main short sword +14',14,'1d6+6','Critical 17–20.'),
   melee('Main short sword +9',9,'1d6+6','Critical 17–20.'),
   melee('Off-hand short sword +14',14,'1d6+6','Critical 17–20.'),
   melee('Off-hand short sword +9',9,'1d6+6','Critical 17–20.'),
   ranged('Composite shortbow +14',14,'1d6+2','Ranged alternative; critical ×3.'),
   ranged('Composite shortbow +9',9,'1d6+2','Ranged alternative; critical ×3.')
  ],
  activeAbilities:[ability('Sneak Attack','ex','+3d6 precision damage when conditions permit.'),ability('Light Blade Training','ex','Fighter weapon training: light blades +1.')]
 },
 'annamede':{
  stats:{str:8},
  text:{
   senses:null,
   acDetail:'17, touch 13, flat-footed 14 (+4 armor, +2 Dex, +1 dodge).',
   hpDetail:'80 (9d8+36).',
   saveDetail:'Fort +7, Ref +8, Will +9; +4 vs. bardic performance, language-dependent, and sonic effects.',
   attackDetail:'Melee +1 dagger +6/+1 (1d4, critical 19–20).',
   specialAttacks:'Bardic performance 30 rounds/day (move action): countersong, dirge of doom, distraction, fascinate (DC 18), inspire competence +3, inspire courage +2, inspire greatness, suggestion (DC 18).',
   spellsKnown:'Bard spells (CL 9th; concentration +13): 3rd (4/day)—charm monster (DC 17), cure serious wounds, displacement, invisibility sphere; 2nd (5/day)—enthrall (DC 16), mirror image, sound burst (DC 16), suggestion (DC 16); 1st (6/day)—charm person (DC 15), comprehend languages, hideous laughter (DC 15), unseen servant, vanish (APG); 0 (at will)—dancing lights, daze (DC 14), ghost sound (DC 14), mage hand, prestidigitation, read magic.',
   languages:'Common, Hallit, Sylvan, Tien.',
   qualities:'Bardic knowledge +4; lore master 1/day; versatile performances (sing, string).',
   combatGear:'Potion of barkskin +3, three potions of cure light wounds.',
   gear:'+2 glamered leather armor; +1 dagger; masterwork lute; 38 gp.',
   importNotes:'Source-reviewed printed p. 71 (PDF p. 72). Removed bard spells mistakenly merged into special attacks and languages; separated complete known spells, gear and proper Strength 8.'
  },
  weapons:[melee('+1 dagger +6',6,'1d4','Critical 19–20.'),melee('+1 dagger +1',1,'1d4','Critical 19–20; second iterative attack.')],
  activeAbilities:[ability('Bardic Performance','su','30 rounds/day, move action; inspire courage +2, inspire competence +3, fascinate and suggestion DC 18 among listed performances.'),ability('Lore Master','ex','1/day, bardic lore master ability.')]
 },
 'armag':{
  stats:{str:22,casterLevel:null},
  text:{
   senses:null,
   aura:null,
   spellLikeAbilities:null,
   acDetail:'24, touch 13, flat-footed 21 (+9 armor, +2 deflection, +2 Dex, +1 dodge, +2 natural, −2 rage).',
   hpDetail:'208 (15 HD; 10d10+5d12+115).',
   saveDetail:'Fort +17, Ref +6, Will +8 (+3 vs. fear).',
   movementDetail:'Speed 40 ft.',
   attackDetail:'Mutually exclusive melee routines: Ovinrbaane +28/+23/+18 (2d6+16/17–20 plus 1 bleed), OR +2 keen battleaxe +24/+19/+14 (1d8+9/19–20/×3), OR mwk armor spikes +22/+17/+12 (1d6+6).',
   specialAttacks:'Rage (16 rounds/day); rage powers no escape and rolling dodge +1.',
   qualities:'Armor training 2; weapon training (heavy blades +2, axes +1). Printed AC and ability scores include rage.',
   combatGear:'Three potions of cure serious wounds.',
   gear:'+3 breastplate with masterwork armor spikes; +2 keen battleaxe; Ovinrbaane (intelligent cursed artifact greatsword); amulet of natural armor +2; belt of physical might +2 (Str/Con); ring of protection +2.',
   specialAbilities:'Ovinrbaane is a separate intelligent +3 wounding greatsword (minor artifact), not Armag’s personal spell-like ability. Sword: CN, Ego 25, senses 60 ft., Str not applicable, Int 11/Wis 12/Cha 15; aid 3/day and modify memory (DC 16; wielder only) 1/day at CL 17th; dedicated protective freedom of movement and conditional dispel magic CL 20th. Its mental influence and artifact destruction are GM-adjudicated.',
   importNotes:'Source-reviewed printed pp. 71–72 (PDF pp. 72–73). Removed Ovinrbaane artifact aura and powers from Armag’s own spells/caster level; kept them as separate gear references and separated the three alternative weapon routines.'
  },
  weapons:[
   melee('Ovinrbaane +28',28,'2d6+16','ONLY greatsword routine; 17–20 critical and +1 bleed.'),
   melee('Ovinrbaane +23',23,'2d6+16','ONLY greatsword routine; 17–20 critical and +1 bleed.'),
   melee('Ovinrbaane +18',18,'2d6+16','ONLY greatsword routine; 17–20 critical and +1 bleed.'),
   melee('Keen battleaxe +24',24,'1d8+9','Alternative axe routine; 19–20/×3.'),
   melee('Keen battleaxe +19',19,'1d8+9','Alternative axe routine; 19–20/×3.'),
   melee('Keen battleaxe +14',14,'1d8+9','Alternative axe routine; 19–20/×3.'),
   melee('Armor spikes +22',22,'1d6+6','Alternative armor spike routine.'),
   melee('Armor spikes +17',17,'1d6+6','Alternative armor spike routine.'),
   melee('Armor spikes +12',12,'1d6+6','Alternative armor spike routine.')
  ],
  activeAbilities:[ability('Rage','ex','16 rounds/day; the listed armor class and attacks already include rage.'),ability('Ovinrbaane (held artifact)','other','Intelligent cursed +3 wounding greatsword. Sword powers: aid 3/day and modify memory (wielder only) 1/day; not a personal Armag spell.')]
 },
 'auchs':{
  stats:{str:20},
  text:{
   senses:null,
   acDetail:'12, touch 10, flat-footed 12 (+2 armor).',
   hpDetail:'30 (3d10+9).',
   saveDetail:'Fort +7, Ref +1, Will +2 (+1 vs. fear).',
   attackDetail:'Melee club +9 (1d6+5).',
   feats:'Fleet, Great Fortitude, Power Attack, Skill Focus (Perception), Weapon Focus (club).',
   languages:'Common (illiterate).',
   qualities:'Armor training 1.',
   combatGear:'Two potions of cure moderate wounds; potion of lesser restoration.',
   gear:'Leather armor, club, knight and dragon toys (45 gp together), Stag Lord amulet (20 gp).',
   importNotes:'Source-reviewed printed p. 72 (PDF p. 73). Removed neighboring Avinash heading from gear, restored Strength 20 and retained illiteracy.'
  },
  weapons:[melee('Club',9,'1d6+5')]
 },
 'avinash-jurrg':{
  stats:{str:28,regeneration:5},
  text:{
   sourceReference:'Male ogre mage bard 10 (Pathfinder Bestiary, p. 221).',
   senses:'Darkvision 60 ft.; low-light vision.',
   acDetail:'28, touch 15, flat-footed 22 (+8 armor, +5 Dex, +1 dodge, +5 natural, −1 size).',
   hpDetail:'207 (18 HD; 10d8+8d10+118); regeneration 5 (fire or acid).',
   saveDetail:'Fort +17, Ref +16, Will +20; +4 vs. bardic performance, language-dependent, and sonic effects.',
   movementDetail:'Speed 40 ft.; fly 60 ft. (good); space 10 ft., reach 10 ft.',
   maneuverDetail:'CMB +25 (+29 disarm); CMD 41 (43 vs. disarm).',
   defenses:'Regeneration 5 (bypassed by fire or acid); SR 19.',
   attackDetail:'Melee +2 keen greatsword +25/+20/+15 (3d6+15/17–20); alternative ranged +1 composite longbow +20/+15/+10 (2d6+10/×3).',
   specialAttacks:'Bardic performance 28 rounds/day (move action): countersong, dirge of doom, distraction, fascinate (DC 21), inspire competence +3, inspire courage +2, inspire greatness, suggestion (DC 21).',
   spellLikeAbilities:'Ogre mage innate abilities (CL 9th, concentration +15): constant—fly; at will—darkness, invisibility; 1/day—charm monster (DC 20), cone of cold (DC 21), deep slumber (DC 19), gaseous form.',
   spellsKnown:'Bard spells (CL 10th, concentration +16): 4th (2/day)—dimension door, hold monster (DC 20); 3rd (4/day)—confusion (DC 19), dispel magic, good hope, haste; 2nd (6/day)—blur, cure moderate wounds, mirror image, rage, suggestion (DC 18); 1st (7/day)—charm person (DC 17), cure light wounds, expeditious retreat, grease, remove fear; 0 (at will)—detect magic, ghost sound (DC 16), know direction, mage hand, message, summon instrument.',
   qualities:'Bardic knowledge +5; change shape (small, medium or large humanoid; alter self or giant form I); jack-of-all-trades; lore master 1/day; versatile performances (oratory, percussion, wind).',
   gear:'+2 glamered mithral breastplate; +1 composite longbow (+9 Str) with 20 arrows; +2 keen greatsword; cloak of resistance +2.',
   importNotes:'Source-reviewed printed pp. 72–73 (PDF pp. 73–74). Restored complete gear and split innate spell-like abilities from 10th-level bard spells; confirmed fire/acid regeneration bypass and all six iterative attacks.'
  },
  weapons:[
   melee('Keen greatsword +25',25,'3d6+15','Critical 17–20.'),
   melee('Keen greatsword +20',20,'3d6+15','Critical 17–20.'),
   melee('Keen greatsword +15',15,'3d6+15','Critical 17–20.'),
   ranged('Composite longbow +20',20,'2d6+10','Alternate ranged routine; ×3 critical.'),
   ranged('Composite longbow +15',15,'2d6+10','Alternate ranged routine; ×3 critical.'),
   ranged('Composite longbow +10',10,'2d6+10','Alternate ranged routine; ×3 critical.')
  ],
  activeAbilities:[ability('Regeneration','ex','5 HP/round; fire or acid defeats regeneration.'),ability('Bardic Performance','su','28 rounds/day; inspire courage +2, inspire competence +3, fascinate/suggestion DC 21.'),ability('Change Shape','su','Small, medium or large humanoid using alter self or giant form I.'),ability('Innate Ogre Mage Magic','sp','Constant fly; darkness and invisibility at will; charm monster, cone of cold, deep slumber and gaseous form 1/day.')]
 }
});
