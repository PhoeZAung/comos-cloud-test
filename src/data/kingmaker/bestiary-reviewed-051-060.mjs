// Kingmaker Bestiary (First Edition), PDF-reviewed entries 51–70.
// Book pp. 34–45 / PDF pp. 35–46. Keep raw automatic arrays untouched.
// Source-backed corrections preserve attack alternatives and separate special
// ability notes; full external Bestiary rules still require GM consultation.
const melee=(name,npcAttackBonus,damage,props={})=>({name,attack_type:'melee',npcAttackBonus,damage,...props});
const ranged=(name,npcAttackBonus,damage,props={})=>({name,attack_type:'ranged',npcAttackBonus,damage,...props});
const ability=(name,ability_kind,desc)=>({name,ability_kind,desc});
export const KINGMAKER_BESTIARY_REVIEWED_051_070=Object.freeze({
 'gogiteth':{
  text:{
   specialAttacks:'Carry off prey, constrict 4d6+7, skittering assault.',
   maneuverDetail:'CMB +21 (+25 grapple); CMD 35.',
   movementDetail:'Land 40 ft., climb 30 ft.; reach 10 ft.',
   specialAbilities:'Carry Off Prey (Ex): can move its full speed while grappling a creature no larger than itself. Skittering Assault (Ex): standard action, move up to double speed and make up to three claw attacks at separate targets during movement. Skittering Reposition (Ex): immediate action, move 10 ft. when another creature enters its reach, without provoking from this movement.',
   importNotes:'PDF-reviewed printed pp. 34–35 (PDF pp. 35–36): verified main stat block, grapple modifier, two claws and custom movement abilities.'
  },
  weapons:[
   melee('Bite',20,'4d6+7',{crit_range:'19-20',desc:'Plus grab; constrict 4d6+7.'}),
   melee('Claw 1',20,'1d6+7'),
   melee('Claw 2',20,'1d6+7')
  ],
  activeAbilities:[
   ability('Carry Off Prey','ex','Move full speed while grappling target of same size or smaller.'),
   ability('Skittering Assault','ex','Standard action: move up to 2× speed; up to three claw attacks, each against a different target.'),
   ability('Skittering Reposition','ex','Immediate action: move up to 10 ft. when creature enters reach; no opportunity attacks from this move.')
  ]
 },
 'kellid-graveknight':{
  stats:{con:null,cmd:33,sr:25},
  text:{
   sourceReference:'Human graveknight fighter 13 (Pathfinder Bestiary 3 p. 138).',
   raceClassLevels:'Human graveknight fighter 13.',
   defenses:'Channel resistance +4, rejuvenation; DR 10/magic; SR 25; immune cold, electricity and undead traits.',
   immunities:'Cold, electricity, undead traits.',
   drBypass:'Magic.',
   specialAttacks:'Channel destruction (3d6 cold); devastating blast 3/day (8d6 cold, DC 20); undead mastery (65 HD, DC 20); weapon training (hammers +3, light blades +2, close +1).',
   feats:'Dodge, Double Slice, Greater Sunder, Greater Weapon Focus (warhammer), Improved Bull Rush, Improved Critical (warhammer), Improved Initiative (bonus), Improved Sunder, Lightning Reflexes, Mobility, Mounted Combat (bonus), Power Attack, Ride-By Attack (bonus), Spring Attack, Toughness (bonus), Two-Weapon Defense, Two-Weapon Fighting, Weapon Focus (warhammer), Weapon Specialization (warhammer).',
   gear:'+3 splint mail, +2 dagger, +2 warhammer.',
   attackDetail:'Melee +2 warhammer +27/+22/+17 (1d8+16, 19–20/×3, plus 3d6 cold) and +2 dagger +24 (1d4+13, 19–20, plus 3d6 cold).',
   maneuverDetail:'CMB +20 (+22 bull rush, +24 sunder); CMD 33 (35 vs. bull rush or sunder).',
   importNotes:'PDF-reviewed printed pp. 35–36 (PDF pp. 36–37). Removed sidebar text, completed cross-column feats, restored CMD 33 and SR 25; Constitution is absent for undead.'
  },
  weapons:[
   ...[27,22,17].map((bonus,i)=>melee('+2 warhammer attack '+(i+1),bonus,'1d8+16',{crit_range:'19-20',crit_mult:'x3',desc:'Plus 3d6 cold.'})),
   melee('+2 dagger',24,'1d4+13',{crit_range:'19-20',desc:'Plus 3d6 cold, same two-weapon routine.'})
  ],
  activeAbilities:[
   ability('Devastating Blast','su','3/day; 8d6 cold, printed DC 20.'),
   ability('Channel Destruction','su','Weapon attacks inflict additional 3d6 cold as printed.'),
   ability('Undead Mastery','su','65 total Hit Dice, DC 20; see graveknight rules for control limitations.')
  ]
 },
 'grimstalker':{
  text:{
   defenses:'Camouflage; DR 5/cold iron.',
   specialAttacks:'Grimstalker sap; two poisoned claw attacks.',
   specialAbilities:'Poison (Ex): injury on claw; Fortitude DC 16, each round for up to six rounds, 1d2 Dexterity damage; cured by two consecutive successful saves. Woodland Stride (Ex): moves through natural undergrowth at normal speed without hindrance, but magically changed terrain still affects it.',
   importNotes:'PDF-reviewed printed pp. 36–37 (PDF pp. 37–38). Split two claws into attack records, recorded poison DC and duration, and preserved four spell-like ability levels.'
  },
  weapons:[
   melee('Claw 1',9,'2d4+4',{desc:'Poison, Fortitude DC 16.'}),
   melee('Claw 2',9,'2d4+4',{desc:'Poison, Fortitude DC 16.'})
  ],
  activeAbilities:[
   ability('Poison','ex','Claw injury, Fort DC 16; 1d2 Dex per round up to 6 rounds; cure 2 consecutive saves.'),
   ability('Woodland Stride','ex','Move normally through ordinary natural undergrowth; enchanted undergrowth still hinders.')
  ]
 },
 'bounty-hunter':{
  text:{
   combatGear:'Potions of cure light wounds (2), potion of cure moderate wounds, potions of shield of faith +2 (2).',
   gear:'Masterwork studded leather, +1 heavy crossbow with 20 bolts, masterwork falchion, masterwork manacles.',
   spellsPrepared:'Ranger CL 2nd (concentration +4): 1st—gravity bow, resist energy.',
   importNotes:'PDF-reviewed printed p. 37 (PDF p. 38). Gear and potions split; spells, favored enemy and both attacks checked.'
  }
 },
 'drelev-guard':{
  text:{
   specialAttacks:'Weapon training (bows +2, heavy blades +1).',
   combatGear:'Potions of cure serious wounds (2), potion of shield of faith +4.',
   gear:'+1 breastplate, +1 heavy steel shield, +1 composite longbow (+3 Str) with 20 arrows, +1 longsword, 40 pp, 5 gp.',
   feats:'Alertness, Deadly Aim, Iron Will, Point-Blank Shot, Power Attack, Precise Shot, Toughness, Weapon Focus (longbow), Weapon Focus (longsword), Weapon Specialization (longbow), Weapon Specialization (longsword).',
   attackDetail:'Melee +1 longsword +15/+10 (1d8+7, 19–20); ranged +1 composite longbow +15/+10 (1d8+8, ×3).',
   hpDetail:'90 (9d10+36)',
   saveDetail:'Fort +8, Ref +5, Will +6 (+2 vs. fear).',
   importNotes:'PDF-reviewed printed p. 37 (PDF p. 38). Restored split feats, clean inventory and attack/saving throw text.'
  }
 },
 'pitax-warden':{
  text:{
   specialAttacks:'Bardic performance 15 rounds/day (countersong, distraction, fascinate DC 15, inspire competence +2, inspire courage +2); weapon training (heavy blades +1).',
   combatGear:'Potion of barkskin +2.',
   gear:'+1 mithral full plate, +1 keen greatsword, masterwork composite shortbow (+4 Str) with 20 arrows, belt of mighty constitution +2, ring of protection +1, 175 gp.',
   spellsKnown:'Bard CL 5th (concentration +8): 2nd (3/day)—cure moderate wounds, hold person (DC 15), locate object; 1st (5/day)—alarm, charm person (DC 14), cure light wounds, expeditious retreat; 0—detect magic, light, message, open/close (DC 13), prestidigitation, resistance.',
   saveDetail:'Fort +11, Ref +7, Will +8 (+2 vs. fear; +4 vs. bardic performance, language-dependent and sonic).',
   importNotes:'PDF-reviewed printed pp. 37–38 (PDF pp. 38–39). Separated full bard spell levels from special attacks and removed neighboring creature prose from gear.'
  },
  activeAbilities:[
   ability('Bardic Performance','su','15 rounds/day, with countersong, distraction, fascinate DC 15, inspire competence +2 and inspire courage +2.')
  ]
 },
 'guthallath':{
  stats:{con:null},
  text:{
   defenses:'Construct traits; DR 20/adamantine; immune to spells and spell-like abilities of level 7 or below that permit spell resistance.',
   immunities:'Construct traits; qualified magic immunity (spell level 7 or lower with SR).',
   specialAttacks:'Annihilation beams, deadly throw, powerful blows, trample 2d10+18 (DC 35).',
   specialAbilities:'Annihilation Beams (Su): standard action, two 120-ft. lines each dealing 30d6 (Fort DC 23 half); overlapping lines do not cause double damage; cooldown 1d4 rounds. Deadly Throw (Ex): Awesome Blow pushes target up to 50 ft. Erosion Aura (Su): creatures and objects within 120 ft. lose 10 hardness/resistance; at start of turn 6d6 bludgeoning, Fort DC 23 half. Powerful Blows (Ex): fists and stomp overcome DR as magical and adamantine, with ×3 critical damage.',
   maneuverDetail:'CMB +46 (+50 bull rush); CMD 58 (60 vs. bull rush).',
   importNotes:'PDF-reviewed printed p. 38 (PDF p. 39). Split fists, restored beam and aura DC/damage, conditional maneuver, and magic-immunity scope. Construct has no Constitution.'
  },
  weapons:[
   melee('Fist 1',30,'8d6+12',{crit_range:'19-20',crit_mult:'x3',desc:'Counts as magic and adamantine.'}),
   melee('Fist 2',30,'8d6+12',{crit_range:'19-20',crit_mult:'x3',desc:'Counts as magic and adamantine.'}),
   melee('Stomp',30,'2d10+12',{crit_mult:'x3',desc:'Plus trip; counts as magic and adamantine.'})
  ],
  activeAbilities:[
   ability('Annihilation Beams','su','Standard action: two 120-ft. lines, 30d6 damage each, Fort DC 23 half, no overlap stacking; cooldown 1d4 rounds.'),
   ability('Deadly Throw','ex','Awesome Blow pushes target up to 50 ft.'),
   ability('Erosion Aura','su','120-ft. aura reduces hardness/resistances by 10 and deals 6d6 bludgeoning at start of affected turns; Fort DC 23 half.'),
   ability('Powerful Blows','ex','Fists and stomp bypass DR as magic and adamantine; critical multiplier ×3.')
  ]
 },
 'hobgoblin-archer':{
  text:{
   gear:'+1 scale mail, +1 light crossbow (10 bolts), short sword.',
   acDetail:'20, touch 14, flat-footed 16 (+6 armor, +4 Dex).',
   importNotes:'PDF-reviewed printed pp. 38–39 (PDF pp. 39–40). Removed adjacent mastiff prose and page number; checked crossbow and shortsword combat bonuses.'
  }
 },
 'mastiff-of-tindalos':{
  text:{
   sourceReference:'Variant advanced hound of Tindalos (Pathfinder Bestiary 2 pp. 158, 292).',
   raceClassLevels:'Variant advanced hound of Tindalos.',
   defenses:'DR 10/magic; immune mind-affecting effects and poison.',
   immunities:'Mind-affecting effects, poison.',
   drBypass:'Magic.',
   qualities:'Angled entry, otherworldly mind (refer to hound of Tindalos rules).',
   feats:'Blind-Fight, Combat Reflexes, Dodge, Improved Initiative, Improved Natural Attack (bite), Improved Natural Attack (claw), Toughness, Vital Strike, Weapon Finesse.',
   skillDetail:'Acrobatics +27, Intimidate +25, Knowledge (arcana) +25, Knowledge (dungeoneering) +22, Knowledge (geography) +22, Knowledge (history) +22, Knowledge (planes) +25, Perception +27, Sense Motive +27, Stealth +27, Survival +27.',
   maneuverDetail:'CMB +23; CMD 41 (49 vs. trip).',
   attackDetail:'Melee bite +24 (3d6+6), four separate claws +24 (2d6+6 each); ripping gaze (DC 23, 7d6 slashing) is a special ability rather than a normal melee attack.',
   importNotes:'PDF-reviewed printed p. 39 (PDF p. 40). Restored all four claws, 11 printed skills, qualified DR and trip defense; core hound special qualities remain source-referenced.'
  },
  weapons:[
   melee('Bite',24,'3d6+6'),
   ...[1,2,3,4].map(i=>melee('Claw '+i,24,'2d6+6'))
  ],
  npcSkills:[
   {name:'Acrobatics',bonus:27},{name:'Intimidate',bonus:25},{name:'Knowledge (arcana)',bonus:25},
   {name:'Knowledge (dungeoneering)',bonus:22},{name:'Knowledge (geography)',bonus:22},{name:'Knowledge (history)',bonus:22},
   {name:'Knowledge (planes)',bonus:25},{name:'Perception',bonus:27},{name:'Sense Motive',bonus:27},
   {name:'Stealth',bonus:27},{name:'Survival',bonus:27}
  ]
 },
 'hooktongue-hydra':{
  stats:{fastHealing:12},
  text:{
   qualities:'Hydra traits; regenerate heads.',
   hpDetail:'186 (12d10+120); fast healing 12.',
   maneuverDetail:'CMB +18; CMD 32 (cannot be tripped).',
   attackDetail:'Twelve separate bite attacks +15 each (1d8+4).',
   importNotes:'PDF-reviewed printed pp. 39–40 (PDF pp. 40–41). Restored fast healing, no-trip condition and twelve distinct heads/attack entries. Head regrowth uses cited hydra rules.'
  },
  weapons:Array.from({length:12},(_,i)=>melee('Bite head '+(i+1),15,'1d8+4'))
 }
});
