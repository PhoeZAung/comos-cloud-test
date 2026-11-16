// Kingmaker Bestiary (First Edition): source-reviewed final creatures 101-105.
// Printed pages 64-65; PDF pages 65-66. Preserve original raw auto batch for audit.
const melee=(name,npcAttackBonus,damage,props={})=>({name,attack_type:'melee',npcAttackBonus,damage,...props});
const ranged=(name,npcAttackBonus,damage,props={})=>({name,attack_type:'ranged',npcAttackBonus,damage,...props});
const ability=(name,ability_kind,desc)=>({name,ability_kind,desc});
export const KINGMAKER_BESTIARY_REVIEWED_101_105=Object.freeze({
 'ancient-will-o-wisp':{
  text:{
   qualities:'Feeds on fear.',
   defenses:'Natural invisibility; immune to magic under the will-o’-wisp rules.',
   movementDetail:'Fly 50 ft. (perfect); no land speed.',
   skillDetail:'Acrobatics +26, Bluff +16, Escape Artist +26, Fly +36, Intimidate +19, Perception +24, Sense Motive +21, Stealth +50 (+70 while immobile).',
   importNotes:'Source-reviewed printed p. 64 (PDF p. 65): verified shock 8d8 electricity, perfect flying, natural invisibility, and cleaned unrelated wyvern prose from qualities.'
  },
  weapons:[melee('Shock',21,'8d8',{desc:'Electricity damage.'})],
  activeAbilities:[ability('Natural Invisibility','ex','Naturally invisible, using the will-o’-wisp rules.'),ability('Feed on Fear','su','Special quality: see original will-o’-wisp rules for activation and details.')]
 },
 'barbtongued-wyvern':{
  text:{
   languages:'Draconic.',
   attackDetail:'Bite +26 (4d6+10, 19–20 and grab); sting +26 (2d6+10 and poison); tongue +21 (2d6+5 and grab, 30-ft. reach); two wings +21 (1d8+5 each). Conditional rake: two claws +26, 1d8+10 each.',
   maneuverDetail:'CMB +30 (+34 grapple); CMD 44.',
   movementDetail:'Land 20 ft.; fly 60 ft. (poor).',
   specialAttacks:'Pull (tongue, 30 ft.), rake (two claws +26, 1d8+10), poison on sting.',
   importNotes:'Source-reviewed printed pp. 64–65 (PDF pp. 65–66). Split five natural attacks, retained 30-ft. tongue reach and conditional rakes; removed adjacent bloom-wyvern text from languages.'
  },
  weapons:[melee('Bite',26,'4d6+10',{desc:'19–20 critical, plus grab.'}),melee('Sting',26,'2d6+10',{desc:'Plus poison; use original wyvern venom rules.'}),melee('Tongue',21,'2d6+5',{desc:'30-ft. reach, plus grab and pull.'}),melee('Wing 1',21,'1d8+5'),melee('Wing 2',21,'1d8+5')],
  activeAbilities:[ability('Rake','ex','Conditional rake attacks: two claws +26 (1d8+10 each), when rake is available under the wyvern rules.'),ability('Tongue Pull','ex','Tongue has 30-ft. reach and can pull grappled prey.'),ability('Poison','ex','Sting poison; use original wyvern poison DC, frequency, and effects (not printed in this stat block).')]
 },
 'bloom-wyvern':{
  text:{
   languages:'Draconic.',
   attackDetail:'Bite +12 (2d6+4 and grab), sting +12 (1d6+4 and poison), two wings +7 (1d6+2 each). Rake is conditional: two claws +12 (1d6+4).',
   maneuverDetail:'CMB +14 (+18 grapple); CMD 25.',
   movementDetail:'Land 20 ft.; fly 60 ft. (poor).',
   specialAttacks:'Rake (two claws +12, 1d6+4), sting poison.',
   importNotes:'Source-reviewed printed p. 65 (PDF p. 66). Split both wing attacks, kept conditional claw rakes distinct, recovered grapple modifier and removed zombie-chapter bleed from languages.'
  },
  weapons:[melee('Bite',12,'2d6+4',{desc:'Plus grab.'}),melee('Sting',12,'1d6+4',{desc:'Plus poison (see original wyvern rules).'}),melee('Wing 1',7,'1d6+2'),melee('Wing 2',7,'1d6+2')],
  activeAbilities:[ability('Rake','ex','Two conditional claw rakes at +12, each 1d6+4, when rake is available.'),ability('Poison','ex','Sting poison; refer to printed wyvern rules for DC, frequency and effects.')]
 },
 'cyclops-zombie':{
  stats:{con:null,int:null},
  text:{
   feats:'Toughness (bonus feat).',
   defenses:'DR 5/slashing; undead traits.',
   immunities:'Undead traits.',
   qualities:'Staggered (zombie limitation).',
   importNotes:'Source-reviewed printed p. 65 (PDF p. 66): Strength 24 recovered from source-order ledger, Constitution and Intelligence are absent (null), DR 5/slashing and staggered preserved.'
  },
  activeAbilities:[ability('Staggered','ex','Zombie may perform only a single move or standard action per turn under the staggered rule.')]
 },
 'zombie-hulk':{
  stats:{con:null,int:null},
  text:{
   defenses:'DR 10/slashing; undead traits.',
   immunities:'Undead traits.',
   qualities:'Staggered (zombie limitation).',
   attackDetail:'Slam +14 (4d6+10); rock +8 (2d6+7), rock throwing range increment 60 ft.',
   specialAttacks:'Rock throwing (60-ft. range increment).',
   importNotes:'Source-reviewed printed p. 65 (PDF p. 66), last entry before NPC Codex. Restored Constitution and Intelligence as null (undead), retained DR 10/slashing and staggered, clean rock throwing range.'
  },
  weapons:[melee('Slam',14,'4d6+10'),ranged('Rock',8,'2d6+7',{desc:'60-ft. range increment.'})],
  activeAbilities:[ability('Staggered','ex','Zombie may perform only one move or standard action per turn under the staggered rule.')]
 }
});