// Kingmaker Bestiary (First Edition), second source-checked batch.
// Printed pages 14–19, PDF pages 15–20. Keyed overlays intentionally leave
// the original bulk extraction untouched for auditing. Short GM notes
// paraphrase mechanics; the full source rules remain in the user's PDF.
export const KINGMAKER_BESTIARY_REVIEWED_011_020=Object.freeze({
 'boggard-warden':{
  stats:{str:18},
  text:{
   movementDetail:'Land 20 ft. (15 ft. wearing armor); swim 30 ft.',
   combatGear:'Potion of cure serious wounds (2); other gear: +1 hide armor, +1 trident, masterwork handaxe.',
   maneuverDetail:'CMB +13; CMD 25.',
   importNotes:'Source-checked against printed p. 14 (PDF p. 15). Combat gear, Strength, spell list, attack sequence and movement checked. Consult cited source for boggard special rules.'
  }
 },
 'giant-frog-companion':{
  stats:{str:16},
  text:{
   skillDetail:'Perception +7, Swim +15',
   movementDetail:'Land 30 ft.; swim 30 ft.; tongue reach 15 ft. (normal reach 5 ft.).',
   maneuverDetail:'CMB +6 (+10 grapple); CMD 20 (24 vs. trip).',
   importNotes:'Source-checked against printed p. 15 (PDF p. 16). This animal companion has CR — and no printed XP; neither is assumed.'
  },
  npcSkills:[{name:'Perception',bonus:7},{name:'Swim',bonus:15}]
 },
 'bog-strider':{
  stats:{str:14},
  text:{
   languages:'Aquan; tremor-tap communication to 120 ft.',
   qualities:'Hold breath, water sprint, water stride.',
   skillDetail:'Perception +6, Stealth +7, Survival +6, Swim +11',
   movementDetail:'Land 30 ft.; water stride 50 ft. (water-walking movement).',
   maneuverDetail:'CMB +4; CMD 17 (21 vs. trip).',
   specialAbilities:'Hold Breath (Ex): breath duration up to 4 times Constitution rounds. Tremor Tap (Ex): communicate with other bog striders through water to 120 ft.; water tremorsense 120 ft. Water Sprint (Ex): 1/hour move up to 250 ft. across water for up to 4 rounds, then fatigued for the number of accelerated rounds. Water Stride (Su): walk over water and move at 50 ft. on its surface.',
   importNotes:'Source-checked against printed pp. 15–16 (PDF pp. 16–17). Includes alternate attack routines and the missing water stride ability; full special rules in PDF.'
  },
  weapons:[
   {name:'Spear',attack_type:'melee',npcAttackBonus:4,damage:'1d8+3',crit_mult:'x3',desc:'Spear and bite option.'},
   {name:'Bite (with spear)',attack_type:'melee',npcAttackBonus:-1,damage:'1d6+1',desc:'Spear-and-bite option only.'},
   {name:'Claw 1 (alternative)',attack_type:'melee',npcAttackBonus:4,damage:'1d4-2',desc:'Claws-and-bite alternative to spear.'},
   {name:'Claw 2 (alternative)',attack_type:'melee',npcAttackBonus:4,damage:'1d4-2',desc:'Claws-and-bite alternative to spear.'},
   {name:'Bite (with claws)',attack_type:'melee',npcAttackBonus:4,damage:'1d6+2',desc:'Claws-and-bite option only.'},
   {name:'Spear (ranged)',attack_type:'ranged',npcAttackBonus:4,damage:'1d8+2',crit_mult:'x3',desc:'Alternative to throwing the masterwork net.'},
   {name:'Masterwork net (ranged touch)',attack_type:'ranged',npcAttackBonus:5,damage:'',desc:'Touch attack; entangle; alternative to ranged spear.'}
  ],
  activeAbilities:[
   {name:'Hold Breath',ability_kind:'ex',desc:'Holds breath for 4 × Con score rounds before drowning risk.'},
   {name:'Tremor Tap',ability_kind:'ex',desc:'Water-vibration communication and water-only tremorsense, 120 ft.'},
   {name:'Water Sprint',ability_kind:'ex',desc:'1/hour, speed up to 250 ft. on water for up to 4 rounds; fatigued afterward for equal rounds.'},
   {name:'Water Stride',ability_kind:'su',desc:'Cross water as under water walk; 50-ft. water movement.'}
  ]
 },
 'bugbear-tormentor':{
  stats:{str:18},
  text:{
   gear:'Daggers (6), masterwork sickles (2).',
   importNotes:'Source-checked against printed pp. 15–16 (PDF pp. 16–17). Confirmed Dexterity, Strength, two-weapon sickle routine, stealth and gear.'
  }
 },
 'cauthooj':{
  stats:{str:24},
  text:{
   energyResistances:'Sonic 10',
   specialAbilities:'Hop-Dodge (Ex): immediate movement up to 15 ft. before a melee attack roll; no opportunity attacks from that movement; an adjacent legal creature can become the attack target. Staccato Strike (Su): move action to direct one creature confused by warbling song within 120 ft. to attack a chosen target (sonic and mind-affecting). Warbling Song (Su): standard action; non-cauthooj creatures within 120 ft. must make DC 16 Will saves or become confused for 1 round (sonic and mind-affecting). Thoughtsense (Su): detect minds within 60 ft.; determine direction with a move action, pinpoint within 5 ft.; mindless creatures are not detected.',
   importNotes:'Source-checked against printed pp. 16–17 (PDF pp. 17–18). Reconciled talon count and four special abilities; full wording remains in source.'
  },
  weapons:[
   {name:'Beak',attack_type:'melee',npcAttackBonus:21,damage:'2d12+7',crit_mult:'x3',desc:'Critical multiplier ×3.'},
   {name:'Talon 1',attack_type:'melee',npcAttackBonus:20,damage:'2d6+7',desc:'First of two talons.'},
   {name:'Talon 2',attack_type:'melee',npcAttackBonus:20,damage:'2d6+7',desc:'Second of two talons.'}
  ],
  activeAbilities:[
   {name:'Hop-Dodge',ability_kind:'ex',desc:'Immediate move up to 15 ft. before incoming melee roll; may redirect to another legal adjacent target.'},
   {name:'Staccato Strike',ability_kind:'su',desc:'Move action: direct one target confused by warbling song within 120 ft. to attack a chosen creature.'},
   {name:'Warbling Song',ability_kind:'su',desc:'Standard action; all non-cauthooj within 120 ft. Will DC 16 or confused 1 round; mind-affecting sonic.'},
   {name:'Thoughtsense',ability_kind:'su',desc:'Detect thinking creatures within 60 ft., move action to locate direction; pinpoint within 5 ft.'}
  ]
 },
 'centaur-scout':{
  stats:{str:20},
  text:{
   gear:'Masterwork leather armor, +1 spear.',
   maneuverDetail:'CMB +12; CMD 26 (30 vs. trip).',
   importNotes:'Source-checked against printed p. 17 (PDF p. 18), including melee iterative spear attacks and two hoof attacks.'
  },
  weapons:[
   {name:'+1 spear attack 1',attack_type:'melee',npcAttackBonus:12,damage:'1d8+8',crit_mult:'x3'},
   {name:'+1 spear attack 2',attack_type:'melee',npcAttackBonus:7,damage:'1d8+8',crit_mult:'x3'},
   {name:'Hoof 1',attack_type:'melee',npcAttackBonus:5,damage:'1d6+2'},
   {name:'Hoof 2',attack_type:'melee',npcAttackBonus:5,damage:'1d6+2'}
  ]
 },
 'oversized-chimera':{
  stats:{str:24},
  text:{
   languages:'Draconic',
   attackDetail:'Melee bite +20 (2d6+7), bite +20 (1d8+7), 2 claws +20 (1d6+7/19–20), gore +20 (1d8+7).',
   acDetail:'27, touch 10, flat-footed 26 (+1 Dex, +17 natural, -1 size)',
   hpDetail:'161 (14d10+84)',
   maneuverDetail:'CMB +22; CMD 33 (37 vs. trip).',
   movementDetail:'Land 30 ft.; fly 50 ft. (poor maneuverability).',
   importNotes:'Source-checked against printed p. 17 (PDF p. 18). Includes full multiattack and 20-ft. fire-breath cone; source rules determine recharge.'
  },
  weapons:[
   {name:'Bite 1',attack_type:'melee',npcAttackBonus:20,damage:'2d6+7'},
   {name:'Bite 2',attack_type:'melee',npcAttackBonus:20,damage:'1d8+7'},
   {name:'Claw 1',attack_type:'melee',npcAttackBonus:20,damage:'1d6+7',crit_range:'19-20'},
   {name:'Claw 2',attack_type:'melee',npcAttackBonus:20,damage:'1d6+7',crit_range:'19-20'},
   {name:'Gore',attack_type:'melee',npcAttackBonus:20,damage:'1d8+7'}
  ],
  activeAbilities:[
   {name:'Breath Weapon',ability_kind:'su',desc:'20-ft. cone of fire; 10d8 fire damage, Reflex DC 22 half, once every 1d4 rounds.'}
  ]
 },
 'black-tear-cutthroat':{
  stats:{str:14},
  text:{
   gear:'Studded leather, dagger, hand crossbow (10 bolts).',
   saveDetail:'+1, Ref +5, Will +0',
   importNotes:'Source-checked against printed pp. 17–18 (PDF pp. 18–19). Includes both melee and ranged attacks.'
  }
 },
 'ruffian':{
  stats:{str:16},
  text:{
   gear:'+1 studded leather, masterwork club, sling with 10 bullets, 25 gp.',
   importNotes:'Source-checked against printed p. 18 (PDF p. 19). Armor, attack bonus, saves and multiclass level verified.'
  }
 },
 'stag-lord-bandit':{
  stats:{str:13},
  text:{
   combatGear:'Potion of cure light wounds; other gear: studded leather, composite longbow (+1 Str), longsword, Stag Lord amulet worth 20 gp, 4 gp.',
   importNotes:'Source-checked against printed pp. 18–19 (PDF pp. 19–20), including the cross-page gear list.'
  }
 }
});
