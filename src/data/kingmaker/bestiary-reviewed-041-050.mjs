// Kingmaker First Edition Bestiary PDF source-checked creatures 41–50.
// Printed pp. 30–34 (PDF pp. 31–35). Source bulk data remains unchanged.
const melee=(name,npcAttackBonus,damage,props={})=>({name,attack_type:'melee',npcAttackBonus,damage,...props});
const ranged=(name,npcAttackBonus,damage,props={})=>({name,attack_type:'ranged',npcAttackBonus,damage,...props});
const ability=(name,ability_kind,desc)=>({name,ability_kind,desc});
export const KINGMAKER_BESTIARY_REVIEWED_041_050=Object.freeze({
 'logger':{
  text:{
   gear:'Padded armor, battleaxe.',
   importNotes:'Checked printed p. 30 (PDF p. 31), including expert level, skills, AC, equipment and battleaxe damage.'
  },
  weapons:[melee('Battleaxe',2,'1d8+1',{crit_mult:'x3'})]
 },
 'poacher':{
  text:{
   combatGear:'Potions of cure moderate wounds (2).',
   gear:'Padded armor, masterwork club, masterwork composite longbow (+1 Str) with 20 arrows, masterwork trapmaking tools, 20 gp.',
   specialAttacks:'Archery combat style; favored enemy (animals +2).',
   qualities:'Favored terrain (forest +2), track +1, wild empathy +3.',
   importNotes:'Checked printed p. 30 (PDF p. 31); combat and other gear separated and ranger abilities confirmed.'
  },
  weapons:[
   melee('Masterwork club',5,'1d6+1'),
   ranged('Masterwork composite longbow',7,'1d8+1',{crit_mult:'x3'})
  ]
 },
 'snapping-flytrap':{
  text:{
   energyResistances:'Acid 5.',
   immunities:'Plant traits.',
   specialAttacks:'Constrict (1d4+1), grab with both bites.',
   skillDetail:'Perception +7, Stealth +7 (+15 in undergrowth).',
   maneuverDetail:'CMB +8 (+12 grapple); CMD 20 (cannot be tripped).',
   movementDetail:'Land 10 ft.; 10-ft. reach.',
   importNotes:'Checked printed pp. 30–31 (PDF pp. 31–32); two primary bites, grab, grapple modifier and immunity to trip captured; adjacent ghost prose removed.'
  },
  npcSkills:[{name:'Perception',bonus:7},{name:'Stealth',bonus:7}],
  weapons:[
   melee('Bite 1',6,'1d4+3',{desc:'First of two bites, plus grab; constrict 1d4+1 when applicable.'}),
   melee('Bite 2',6,'1d4+3',{desc:'Second of two bites, plus grab; constrict 1d4+1 when applicable.'})
  ],
  activeAbilities:[
   ability('Constrict','ex','Constrict deals 1d4+1 damage with appropriate successful grappling.'),
   ability('Grab','ex','Bite can initiate grapple; CMB +12 for grapple. Cannot be tripped.')
  ]
 },
 'ghostly-guard':{
  stats:{str:null,con:null,dr:null},
  text:{
   creatureType:'undead',
   subtypes:'augmented humanoid, elf, incorporeal',
   defenses:'Channel resistance +4, evasion, improved uncanny dodge, incorporeal, rejuvenation, trap sense +4; immune sleep and undead traits.',
   immunities:'Sleep, undead traits.',
   weaknesses:'Shame.',
   specialAttacks:'Corrupting gaze (DC 23), draining touch, frightful moan (DC 25), sneak attack +7d6 with bleed 7, telekinesis (DC 23).',
   attackDetail:'With +2 ghost touch rapier: +16/+11 (1d6+5, critical 15–20) and corrupting touch +8 (15d6). Alternative standalone corrupting touch +13 (15d6).',
   skillDetail:'Acrobatics +20, Bluff +23, Disable Device +25, Escape Artist +20, Fly +11, Intimidate +23, Knowledge (local) +19, Perception +28, Sense Motive +18, Sleight of Hand +20, Stealth +28.',
   saveDetail:'Fort +12, Ref +14, Will +7; +2 versus enchantments.',
   movementDetail:'Fly 30 ft. (perfect; incorporeal).',
   specialAbilities:'Shame (Ex): attacks against creatures who appear elven or worship Calistria incur a –2 penalty to attack rolls and special-ability save DCs. A character who understands the shame can attempt DC 30 Diplomacy as a standard action to make the –2 penalty apply versus all targets for 1 round; the ghost then attempts DC 14 Will or fades as its soul is released.',
   importNotes:'Checked printed pp. 31–32 (PDF pp. 32–33). Ghost has no printed Strength or Constitution; separate corrupting touch alternatives, full skill list, incorporeal rules reference, and shame special case retained.'
  },
  npcSkills:[
   {name:'Acrobatics',bonus:20},{name:'Bluff',bonus:23},{name:'Disable Device',bonus:25},
   {name:'Escape Artist',bonus:20},{name:'Fly',bonus:11},{name:'Intimidate',bonus:23},
   {name:'Knowledge (local)',bonus:19},{name:'Perception',bonus:28},{name:'Sense Motive',bonus:18},
   {name:'Sleight of Hand',bonus:20},{name:'Stealth',bonus:28}
  ],
  weapons:[
   melee('+2 ghost touch rapier attack 1',16,'1d6+5',{crit_range:'15-20',desc:'Rapier plus lower-bonus corrupting touch routine.'}),
   melee('+2 ghost touch rapier attack 2',11,'1d6+5',{crit_range:'15-20'}),
   melee('Corrupting touch with rapier',8,'15d6',{desc:'Only if also using rapier routine; ghost incorporeal touch.'}),
   melee('Corrupting touch (alternative)',13,'15d6',{desc:'Alternative to rapier attack routine; ghost incorporeal touch.'})
  ],
  activeAbilities:[
   ability('Shame','ex','Attacking apparent elves or Calistria followers: –2 attacks and ability DCs. DC 30 Diplomacy action may impose penalty versus all foes for 1 round and force Will DC 14 or ghost fades.'),
   ability('Corrupting Gaze','su','Printed save DC 23; use ghost source rules for targets and effect.'),
   ability('Frightful Moan','su','Printed save DC 25; use ghost source rules for effect.'),
   ability('Incorporeal','ex','Incorporeal defenses and movement follow Pathfinder ghost rules.')
  ]
 },
 'hill-giant-butcher':{
  text:{
   gear:'+4 hide armor, +1 keen battleaxe, +1 keen handaxe, sack of 6 rocks.',
   movementDetail:'Land 40 ft. (30 ft. in armor).',
   specialAttacks:'Two-weapon fighting, favored enemies (animals +4, humans +2), rock throwing (120 ft.).',
   attackDetail:'Battleaxe +21/+16/+11 (2d6+9, critical 19–20/×3) plus handaxe +21 (1d8+9, critical 19–20/×3); OR two slams +21 (1d8+8). Ranged rocks +11/+6/+1 (1d8+12).',
   importNotes:'Checked printed p. 32 (PDF p. 33), including separated natural-attack alternative, iterative ranged rocks, speed in armor and two-weapon attack bonuses.'
  },
  weapons:[
   melee('+1 keen battleaxe attack 1',21,'2d6+9',{crit_range:'19-20',crit_mult:'x3'}),
   melee('+1 keen battleaxe attack 2',16,'2d6+9',{crit_range:'19-20',crit_mult:'x3'}),
   melee('+1 keen battleaxe attack 3',11,'2d6+9',{crit_range:'19-20',crit_mult:'x3'}),
   melee('+1 keen handaxe',21,'1d8+9',{crit_range:'19-20',crit_mult:'x3'}),
   melee('Slam 1 (alternative)',21,'1d8+8'),
   melee('Slam 2 (alternative)',21,'1d8+8'),
   ranged('Rock attack 1',11,'1d8+12'),ranged('Rock attack 2',6,'1d8+12'),ranged('Rock attack 3',1,'1d8+12')
  ]
 },
 'kargstaad-s-giant':{
  text:{
   gear:'+3 dragonhide breastplate, +2 greataxe, sack with 8 rocks.',
   feats:'Awesome Blow, Cleave, Dodge, Great Cleave, Improved Bull Rush, Improved Critical (greataxe), Improved Overrun, Improved Sunder, Martial Weapon Proficiency (greataxe), Power Attack, Quick Draw, Skill Focus (Stealth), Weapon Focus (greataxe), Weapon Specialization (greataxe).',
   specialAttacks:'Rock throwing (120 ft.), weapon training (axes +1).',
   maneuverDetail:'CMB +27 (+29 bull rush, +29 overrun, +29 sunder); CMD 40 (42 vs. bull rush, overrun and sunder).',
   attackDetail:'+2 greataxe +29/+24/+19/+14 (3d6+20, critical 19–20/×3), or 2 slams +25 (1d8+5); ranged rocks +13/+8/+3/–2 (1d8+15).',
   importNotes:'Checked printed pp. 32–33 (PDF pp. 33–34), restoring split feats, conditional maneuvers, equipment and four throwing-rock iteratives.'
  },
  weapons:[
   ...[29,24,19,14].map((bonus,i)=>melee('+2 greataxe attack '+(i+1),bonus,'3d6+20',{crit_range:'19-20',crit_mult:'x3'})),
   melee('Slam 1 (alternative)',25,'1d8+5'),melee('Slam 2 (alternative)',25,'1d8+5'),
   ...[13,8,3,-2].map((bonus,i)=>ranged('Rock attack '+(i+1),bonus,'1d8+15'))
  ]
 },
 'goblin-commando':{
  text:{
   gear:'Leather armor, horsechopper, shortbow.',
   movementDetail:'Land 30 ft.; natural reach 5 ft., 10 ft. with horsechopper.',
   importNotes:'Checked printed p. 33 (PDF p. 34). Horsechopper reach and gear included without extending base reach.'
  },
  weapons:[
   melee('Horsechopper',5,'1d8+1',{crit_mult:'x3',desc:'10-ft. reach.'}),
   ranged('Shortbow',5,'1d4',{crit_mult:'x3'})
  ]
 },
 'goblin-pyro':{
  text:{
   languages:'Common, Goblin.',
   gear:'Torch.',
   hpDetail:'15 (2d6+6)',
   saveDetail:'Fort +2, Ref +3, Will +2.',
   attackDetail:'Melee lit torch +2 (1d2 plus 1 fire). Bloodline elemental ray is a spell-like ability, not part of the melee routine.',
   spellLikeAbilities:'Elemental fire bloodline (CL 2nd, concentration +3): elemental ray 4/day (1d6+1 fire).',
   spellsKnown:'Sorcerer CL 2nd, concentration +3: 1st (5/day)—burning hands (DC 12), grease (DC 12); 0 (at will)—acid splash, flare (DC 11), ghost sound (DC 11), mage hand, ray of frost.',
   qualities:'Elemental (fire) bloodline; bloodline arcana changes spell energy damage to match fire.',
   importNotes:'Checked printed pp. 33–34 (PDF pp. 34–35). Restored fully separated sorcerer spells, bloodline ray, clean gear and unpolluted attack and saving throw text.'
  },
  weapons:[melee('Lit torch',2,'1d2',{desc:'Plus 1 fire damage.'})],
  activeAbilities:[ability('Elemental Ray','sp','4/day, ranged spell-like elemental fire ray (1d6+1 fire) at CL 2; calculate its touch-attack roll under the bloodline rule.')]
 },
 'goblin-war-chanter':{
  text:{
   gear:'Leather armor, dogslicer, shortbow with 20 arrows.',
   specialAttacks:'Bardic performance 7 rounds/day (countersong, distraction, fascinate DC 12, inspire courage +1).',
   spellsKnown:'Bard CL 2nd, concentration +3: 1st (3/day)—cure light wounds, ear-piercing scream (DC 12), vanish (DC 12); 0 (at will)—detect magic, flare (DC 11), ghost sound (DC 11), message, prestidigitation.',
   saveDetail:'Fort –1, Ref +7, Will +4; +4 vs bardic performance, language-dependent and sonic effects.',
   importNotes:'Checked printed p. 34 (PDF p. 35). Cleaned gear and separated performance from spells known, preserving 7 rounds/day and printed saves.'
  },
  activeAbilities:[
   ability('Bardic Performance','su','Seven rounds/day total; countersong, distraction, fascinate (DC 12), inspire courage +1.')
  ],
  weapons:[
   melee('Dogslicer',1,'1d4-1',{crit_range:'19-20'}),
   ranged('Shortbow',6,'1d4-1',{crit_mult:'x3'})
  ]
 },
 'goblin-bat-dog':{
  text:{
   movementDetail:'Land 50 ft.; fly 40 ft. (average).',
   immunities:'Disease.',
   specialAttacks:'Dander dusting; bite causes allergic reaction (use goblin dog source rule).',
   specialAbilities:'Dander Dusting (Ex): standard action, 5-ft. emanation. Non-goblins and creatures other than goblin dogs or goblin bat-dogs make DC 15 Reflex saves; failure dazzles and sickens until end of the next turn. Ability cannot be used again for 1 minute.',
   importNotes:'Checked printed p. 34 (PDF p. 35). Added dander dusting area, DC, eligible targets and cooldown; inherited allergic reaction remains source-referenced.'
  },
  npcSkills:[{name:'Fly',bonus:8},{name:'Stealth',bonus:8}],
  activeAbilities:[
   ability('Dander Dusting','ex','Standard action 5-ft. emanation, Reflex DC 15 or dazzled and sickened until end of next turn; excludes goblin, goblin dog and goblin bat-dog; 1-minute cooldown.'),
   ability('Allergic Reaction','ex','Bite-triggered inherited goblin dog effect; consult cited Pathfinder Bestiary for full allergic reaction rules.')
  ]
 }
});
