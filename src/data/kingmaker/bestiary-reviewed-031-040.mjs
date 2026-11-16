// Kingmaker Bestiary First Edition, source-reviewed records 31–40.
// Compared to the owner's original PDF: printed pp. 24–30 / PDF pp. 25–31.
// Keep the original 95-entry automated extraction unchanged; these are
// gameplay-oriented overlays and abbreviated source-rules notes.
const melee=(name,npcAttackBonus,damage,props={})=>({name,attack_type:'melee',npcAttackBonus,damage,...props});
const ranged=(name,npcAttackBonus,damage,props={})=>({name,attack_type:'ranged',npcAttackBonus,damage,...props});
const ability=(name,ability_kind,desc)=>({name,ability_kind,desc});
export const KINGMAKER_BESTIARY_REVIEWED_031_040=Object.freeze({
 'drainberry-bush':{
  text:{
   specialAttacks:'Blood drain (1d2 Constitution); two grabbing vines.',
   qualities:'Blood berries, consume berries, wild empathy +11.',
   specialAbilities:'Blood berries (Su): blood drain produces berry clusters; typical encountered clusters 1d6+3, each lasting 1 day. Eating one heals 2d8+10 HP; plucking a berry in combat uses a touch attack or DC 20 Sleight of Hand check, with attack-of-opportunity conditions. Consume Berries (Ex): swift action to consume a berry and heal 2d8+10 HP. Wild Empathy (Ex): druid-like wild empathy at an effective druid level equal to Hit Dice.',
   maneuverDetail:'CMB +13; CMD 26.',
   movementDetail:'Land 30 ft.; climb 20 ft.; 20-ft. vine reach.',
   importNotes:'Source-checked printed p. 24 (PDF p. 25). Two separate vine attacks; blood berry healing and swift consume recorded. See original source for full grappling and berry-picking rules.'
  },
  weapons:[
   melee('Vine 1',12,'2d6+6',{desc:'First of two primary vines, plus grab; triggers blood drain on applicable grapple.'}),
   melee('Vine 2',12,'2d6+6',{desc:'Second of two primary vines, plus grab; triggers blood drain on applicable grapple.'})
  ],
  activeAbilities:[
   ability('Blood Berries','su','Blood drain yields clusters (typically 1d6+3 on encounter); each lasts 1 day and restores 2d8+10 HP when eaten.'),
   ability('Consume Berries','ex','Swift action to consume own blood berries, healing 2d8+10 HP.'),
   ability('Wild Empathy','ex','Wild empathy +11; effective druid level equals the creature’s HD.'),
   ability('Blood Drain','ex','Drain 1d2 Constitution as indicated in the printed special attack; use grapple rule reference.')
  ]
 },
 'enormous-flame-drake':{
  text:{
   movementDetail:'Land 20 ft.; fly 60 ft. (average).',
   specialAttacks:'Fireball breath: 180-ft. range, 20-ft.-radius burst, 8d6 fire, Reflex DC 17 half; recharge 1d4 rounds.',
   specialAbilities:'Fireball Breath (Su): standard action; ball of flame explodes as fireball at a point within 180 ft.; 8d6 fire in a 20-ft.-radius spread, Reflex DC 17 half; unavailable for 1d4 rounds afterward.',
   qualities:'Speed surge (see Pathfinder Bestiary 2).',
   importNotes:'Source-checked printed p. 25 (PDF p. 26). Fireball breath full DC, area, range and recharge captured; speed surge still uses the cited core rule.'
  },
  activeAbilities:[
   ability('Fireball Breath','su','Standard action, range 180 ft., radius 20 ft., fire 8d6, Reflex DC 17 half; recharge 1d4 rounds.'),
   ability('Speed Surge','ex','Special drake movement feature; consult cited Pathfinder Bestiary 2 rule.')
  ]
 },
 'dweomercat':{
  stats:{sr:19},
  text:{
   raceClassLevels:'',sourceReference:'Dweomercat (Kingmaker Bestiary, printed pp. 25–26).',
   drBypass:'Magic',
   defenses:'DR 5/magic; SR 19.',
   hpDetail:'85 (10d10+30)',
   acDetail:'23, touch 17, flat-footed 16 (+6 Dex, +1 dodge, +6 natural)',
   maneuverDetail:'CMB +12; CMD 29 (33 vs. trip).',
   attackDetail:'Melee bite +16 (1d6+2), 2 claws +16 (1d4+2); on pounce, rake with two additional claws +16 (1d4+2).',
   specialAttacks:'Dweomer leap, pounce, rake (2 claws +16, 1d4+2).',
   spellLikeAbilities:'CL 10th, concentration +13: constant detect magic; at-will dispel magic; 3/day lesser globe of invulnerability and dimension door (self only).',
   specialAbilities:'Dweomer Leap (Su): with an active spell link and an available dimension door spell-like use, swift-action teleport adjacent to the caster who triggered the link; ends link without ending the dweomercat’s actions that turn. Spell Link (Su): immediate action when targeted by or inside a spell, effect based on the school; persists at most 1 minute and ends if another link/leap replaces it; original spell still affects the cat. School effects: abjuration resistance 10 to one energy; conjuration +2 deflection AC; divination detect one alignment; enchantment +2 morale on attacks, saves and skill checks; evocation bite +1d6 chosen energy; illusion invisibility until hostile action; necromancy heals 1d10+10 with excess as temporary HP; transmutation +2 enhancement to bite and claw attacks.',
   importNotes:'Source-checked printed pp. 25–26 (PDF pp. 26–27). Removed corrupt neighboring creature identity; kept two normal claw attacks plus two conditional rake attacks, SR 19 and complete school-dependent spell link effects.'
  },
  weapons:[
   melee('Bite',16,'1d6+2'),
   melee('Claw 1',16,'1d4+2'),
   melee('Claw 2',16,'1d4+2'),
   melee('Rake claw 1 (pounce only)',16,'1d4+2',{desc:'Only in applicable pounce/rake situations.'}),
   melee('Rake claw 2 (pounce only)',16,'1d4+2',{desc:'Only in applicable pounce/rake situations.'})
  ],
  activeAbilities:[
   ability('Dweomer Leap','su','With active spell link and dimension door available, swift action to teleport adjacent to the originating caster; may act normally afterward.'),
   ability('Spell Link','su','Immediate action when affected by a spell: 1-minute school-dependent benefit; abjuration energy resistance 10, conjuration +2 AC, divination detect alignment, enchantment +2 to attacks/saves/skills, evocation bite +1d6 energy, illusion invisibility, necromancy 1d10+10 healing, transmutation +2 bite/claw attacks.'),
   ability('Pounce','ex','Full attack at end of an eligible charge; rake claws only when the pounce/rake rule permits.')
  ]
 },
 'river-elasmosaurus':{
  text:{
   sourceReference:'Variant elasmosaurus (Pathfinder Bestiary p. 84).',
   raceClassLevels:'Variant elasmosaurus.',
   skillDetail:'Perception +19, Swim +22.',
   maneuverDetail:'CMB +21; CMD 35 (39 vs. trip).',
   movementDetail:'Land 20 ft.; swim 50 ft.',
   importNotes:'Source-checked printed pp. 26–27 (PDF pp. 27–28). Restored lost Swim +22, corrected complete external source reference, and recorded conditional trip defense.'
  },
  npcSkills:[{name:'Perception',bonus:19},{name:'Swim',bonus:22}]
 },
 'elder-elemental-tsunami':{
  text:{
   drBypass:'— (unbypassable)',
   immunities:'Elemental traits.',
   specialAttacks:'Blinding sickness on both slams; drench, vortex (10–60 ft. deep, 30 ft. wide, 2d10+10 damage, DC 29), water mastery.',
   specialAbilities:'Blinding Sickness (Ex): slam injury, Fortitude DC 23, 1/day, 1d4 Strength damage. When more than 2 Strength damage is taken, another failed Fortitude save causes permanent blindness; cure 2 consecutive saves. Vortex, drench and water mastery: use the cited water elemental rules; printed vortex damage 2d10+10, DC 29.',
   skillDetail:'Acrobatics +28, Escape Artist +28, Knowledge (planes) +22, Perception +26, Stealth +20, Swim +40.',
   feats:'Cleave, Dodge, Great Cleave, Improved Bull Rush, Improved Critical (slam), Improved Natural Attack (slam), Improved Sunder, Iron Will, Lightning Reflexes, Power Attack.',
   maneuverDetail:'CMB +31 (+33 bull rush, +33 sunder); CMD 48 (50 vs. bull rush, 50 vs. sunder).',
   importNotes:'Source-checked printed pp. 27–28 (PDF pp. 28–29). Removed sidebar contamination in feats/skills, restored conditional maneuvers and both slams; captured custom blinding sickness and left core elemental powers source-referenced.'
  },
  weapons:[
   melee('Slam 1',27,'4d8+10',{crit_range:'19-20',desc:'Also inflicts blinding sickness, Fortitude DC 23.'}),
   melee('Slam 2',27,'4d8+10',{crit_range:'19-20',desc:'Also inflicts blinding sickness, Fortitude DC 23.'})
  ],
  npcSkills:[
   {name:'Acrobatics',bonus:28},{name:'Escape Artist',bonus:28},{name:'Knowledge (planes)',bonus:22},
   {name:'Perception',bonus:26},{name:'Stealth',bonus:20},{name:'Swim',bonus:40}
  ],
  activeAbilities:[
   ability('Blinding Sickness','ex','Slam injury, Fort DC 23, frequency 1/day, 1d4 Str damage; after >2 Str damage additional failed Fortitude save blinds permanently; cure 2 consecutive saves.'),
   ability('Vortex','su','Water elemental vortex, 10–60 ft. deep, 30 ft. wide, 2d10+10 damage, DC 29; consult core water elemental rules.'),
   ability('Water Mastery','ex','Use water elemental source rule for modifiers based on location.'),
   ability('Drench','ex','Use water elemental source rule for extinguishing flames.')
  ]
 },
 'fetch-stalker':{
  stats:{sr:29,regeneration:5},
  text:{
   drBypass:'Cold iron',
   defenses:'DR 15/cold iron; SR 29; regeneration 5 (fire or negative energy).',
   hpDetail:'300 (24d6+216); regeneration 5 (fire or negative energy).',
   movementDetail:'Land 40 ft.; air walk (constant spell-like ability).',
   specialAbilities:'Manifest Fetch Weapon (Su): swift action to create a +5 weapon dealing base 5d6 damage; its appearance is chosen by the fetch but it does not inherit the depicted weapon’s special abilities. Disappears when no longer held.',
   importNotes:'Source-checked printed pp. 27–28 (PDF pp. 28–29). Restore SR 29, regeneration 5 and manifest weapon behavior; preserve three iterative weapon attacks.'
  },
  weapons:[
   melee('+5 fetch weapon attack 1',24,'5d6+11',{crit_range:'19-20'}),
   melee('+5 fetch weapon attack 2',19,'5d6+11',{crit_range:'19-20'}),
   melee('+5 fetch weapon attack 3',14,'5d6+11',{crit_range:'19-20'})
  ],
  activeAbilities:[ability('Manifest Fetch Weapon','su','Swift action conjures +5 weapon (5d6 base damage), chosen visual appearance but not depicted special properties; vanishes when no longer held.')]
 },
 'fetch-behemoth':{
  stats:{sr:31,dr:15,regeneration:5},
  text:{
   drBypass:'Cold iron',
   defenses:'Rock catching; DR 15/cold iron; SR 31; regeneration 5 (fire or negative energy).',
   hpDetail:'378 (28d6+280); regeneration 5 (fire or negative energy).',
   maneuverDetail:'CMB +25 (+29 sunder); CMD 41 (43 vs. sunder).',
   movementDetail:'Land 40 ft.; air walk (constant spell-like ability).',
   specialAbilities:'Magic Fists (Su): fist attacks already include +5 enhancement to attack and damage; they count as magic for damage reduction.',
   importNotes:'Source-checked printed pp. 28–29 (PDF pp. 29–30). Restored dual fist attacks, SR 31, conditional sunder, regeneration and existing +5 fist enhancement (do not add enhancement twice).'
  },
  weapons:[
   melee('+5 fist 1',29,'10d6+15',{crit_range:'19-20',desc:'First magical fist; printed bonus already includes +5 enhancement.'}),
   melee('+5 fist 2',29,'10d6+15',{crit_range:'19-20',desc:'Second magical fist; printed bonus already includes +5 enhancement.'}),
   ranged('Rock',19,'1d8+10',{desc:'Rock throwing up to 120-ft. range; use printed source for increments.'})
  ],
  activeAbilities:[
   ability('Magic Fists','su','Both fists count as +5 magical weapons; enhancement bonuses already included in printed +29 and 10d6+15.'),
   ability('Rock Catching','ex','Can catch eligible thrown rocks under giant-style rock catching rules.')
  ]
 },
 'risen-fetch':{
  stats:{sr:33,regeneration:5},
  text:{
   drBypass:'Cold iron',
   defenses:'DR 15/cold iron; SR 33; regeneration 5 (fire or negative energy).',
   hpDetail:'432 (32d6+320); regeneration 5 (fire or negative energy).',
   maneuverDetail:'CMB +24 (+28 sunder); CMD 51 (53 vs. sunder).',
   movementDetail:'Land 40 ft.; air walk (constant spell-like ability).',
   spellLikeAbilities:'CL 18th, concentration +27. Constant: air walk, tongues, true seeing. At will: arcane sight, telekinesis (DC 24), veil (self only). 3/day: mass suggestion (DC 25), quickened phantasmal killer (DC 23). 1/day: demand (DC 27), plane shift (self only, to or from First World), weird (DC 28), wish.',
   specialAbilities:'Duplicate Victim (Su): 3/day when scoring a critical hit with a fetch weapon, attempt to create a mirror-of-opposition duplicate of the victim, Will DC 35 negates. Fey Insight (Ex): Charisma modifier (+9) insight bonus to AC, already reflected in printed total. Manifest Fetch Weapon (Su): see fetch stalker; +5 weapon, base damage for this variant 6d6.',
   importNotes:'Source-checked printed pp. 28–29 (PDF pp. 29–30). Restored SR 33, regen and conditional sunder; removed trailing PDF navigation; duplicated victim trigger and DC 35 added.'
  },
  activeAbilities:[
   ability('Duplicate Victim','su','3/day on confirmed fetch-weapon critical hit; Will DC 35 negates mirror-of-opposition duplicate.'),
   ability('Fey Insight','ex','+9 insight AC from Charisma; already included in AC 39 and touch AC 27.'),
   ability('Manifest Fetch Weapon','su','Swift action to manifest +5 fetch weapon; this variant deals base 6d6.')
  ]
 },
 'gnome-explorer':{
  text:{
   specialAttacks:'Hatred (gnome racial ability).',
   gear:'Padded armor, dagger.',
   qualities:'Gnome magic.',
   attackDetail:'Melee dagger +0 (1d3–1/19–20).',
   skillDetail:'Escape Artist +5, Handle Animal +4, Heal +3, Knowledge (nature) +8, Perception +5, Ride +5, Survival +3.',
   saveDetail:'Fort +1, Ref +1, Will +1; +2 vs. illusions.',
   importNotes:'Source-checked printed pp. 29–30 (PDF pp. 30–31). Removed adjacent hunter prose and navigation; restored missing Knowledge (nature) and Survival skill bonuses.'
  },
  npcSkills:[
   {name:'Escape Artist',bonus:5},{name:'Handle Animal',bonus:4},{name:'Heal',bonus:3},
   {name:'Knowledge (nature)',bonus:8},{name:'Perception',bonus:5},{name:'Ride',bonus:5},{name:'Survival',bonus:3}
  ]
 },
 'hunter':{
  text:{
   gear:'+1 leather armor, +1 composite longbow (+2 Str), +1 short sword, cloak of resistance +1, 13 pp.',
   combatGear:'Potions of cure moderate wounds (2).',
   importNotes:'Source-checked printed p. 30 (PDF p. 31). Combat/other gear split correctly, preserving archery and short-sword iterative attack routines, ranger spells and favored enemies.'
  },
  weapons:[
   melee('+1 short sword attack 1',11,'1d6+3',{crit_range:'19-20'}),
   melee('+1 short sword attack 2',6,'1d6+3',{crit_range:'19-20'}),
   ranged('+1 composite longbow attack 1',14,'1d8+3',{crit_mult:'x3'}),
   ranged('+1 composite longbow attack 2',9,'1d8+3',{crit_mult:'x3'})
  ]
 }
});
