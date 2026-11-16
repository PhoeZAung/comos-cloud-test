// Kingmaker Bestiary (First Edition), NPC Codex source-review 101–105.
// Source: user-supplied Bestiary.pdf, printed pages 130–133 / PDF pages 131–134.
// Includes precise rules summaries; no verbatim adventure narrative.
const melee=(name,npcAttackBonus,damage,desc='')=>({name,attack_type:'melee',npcAttackBonus,damage,...(desc?{desc}:{})});
const ranged=(name,npcAttackBonus,damage,desc='')=>({name,attack_type:'ranged',npcAttackBonus,damage,...(desc?{desc}:{})});
const ability=(name,ability_kind,desc)=>({name,ability_kind,desc});
export const KINGMAKER_NPC_CODEX_REVIEWED_101_105=Object.freeze({
 'werendegar':{
  stats:{str:21,dex:32,con:29,int:22,wis:19,cha:30,dr:15},
  text:{
   raceClassLevels:'Small fey gimmerling (shapechanger).',sourceReference:'Werendegar, gimmerling, shapechanger fey.',
   senses:'Low-light vision; hungersense 30 ft.; Perception +33.',
   aura:'Treacherous aura, 15 ft. Creates difficult terrain; source prints no numeric saving throw DC.',
   defenses:'DR 15/cold iron and lawful.',
   acDetail:'37, touch 16, flat-footed 32 (+11 armor, +4 Dex, +1 dodge, +10 natural, +1 size).',hpDetail:'351 (26d6+260).',saveDetail:'Fort +19, Ref +26, Will +19.',
   movementDetail:'Speed 30 ft. armored, 40 ft. without armor.',
   maneuverDetail:'CMB +17 (+21 disarm, +21 trip), CMD 39 (41 vs. disarm or trip).',
   specialAttacks:'Sneak attack +4d6; trip up.',
   attackDetail:'Alternative routines: +5 icy burst rapier +31/+26/+21 (1d4+10/15–20 plus 1d6 cold), single claw +20 (1d4+2), bite +20 (1d6+2); OR two claws +25 (1d4+5 each) and bite +25 (1d6+5); OR ranged +5 hand crossbow +30 (1d3+5/19–20 plus wyvern poison).',
   qualities:'Change shape (alter self, any humanoid); trickster’s step.',
   gear:'+5 mithral chainmail, +5 icy burst rapier, +5 hand crossbow and 10 wyvern-poisoned bolts.',
   specialAbilities:'Hungersense (Su): scent-like detection works only on creatures that must eat. Treacherous Aura (Su): 15 ft. of spontaneously created difficult terrain. Trickster’s Step (Su): ignore difficult terrain and do not trigger traps while moving. Trip Up (Ex): swift action to trip a foe whose melee weapon attack missed Werendegar.',
   importNotes:'Source-reviewed printed pp. 130–131 (PDF pp. 131–132). Preserved 15-ft. terrain aura with no invented DC, distinct natural/rapier/ranged attack routines, and conditional swift trip.'
  },
  weapons:[...([31,26,21].map((n,i)=>melee('Rapier '+(i+1),n,'1d4+10','Rapier routine; crit 15–20, +1d6 cold.'))),melee('Rapier-routine claw',20,'1d4+2','Use with rapier; not with alternate two-claw routine.'),melee('Rapier-routine bite',20,'1d6+2','Use with rapier.'),melee('Natural claw 1',25,'1d4+5','Alternative all-natural routine.'),melee('Natural claw 2',25,'1d4+5','Alternative all-natural routine.'),melee('Natural bite',25,'1d6+5','Alternative all-natural routine.'),ranged('Poisoned hand crossbow',30,'1d3+5','Critical 19–20; wyvern poison on bolt.')],
  activeAbilities:[ability('Hungersense','su','30-ft. scent-like sense, only for creatures that require food.'),ability('Treacherous Aura','su','15-ft. radius of difficult terrain; no numerical DC specified in source.'),ability('Trickster’s Step','su','Ignore difficult terrain and do not trigger traps by moving.'),ability('Trip Up','ex','Swift action to trip a creature that attacks and misses Werendegar with a melee weapon.')]
 },
 'windchaser':{
  stats:{str:20,dex:20,con:22,int:14,wis:17,cha:14,space:10,reach:5},
  text:{
   raceClassLevels:'Male variant awakened heavy horse (Pathfinder Bestiary, p. 177).',sourceReference:'Variant awakened heavy horse (Pathfinder Bestiary, p. 177).',
   senses:'Darkvision 60 ft., low-light vision, scent; Perception +16.',
   acDetail:'17, touch 15, flat-footed 11 (+5 Dex, +1 dodge, +2 natural, −1 size).',hpDetail:'105 (10d8+60).',saveDetail:'Fort +13, Ref +12, Will +8.',
   movementDetail:'Speed 50 ft., space 10 ft., reach 5 ft.',maneuverDetail:'CMB +13; CMD 29 (33 vs. trip).',
   attackDetail:'Bite +11 (1d4+5) and two separate hooves +6 (1d6+2 each).',
   skillDetail:'Acrobatics +18, Escape Artist +15, Perception +16, Sense Motive +13.',languages:'Common.',
   importNotes:'Source-reviewed printed p. 130 (PDF p. 131). Restored full source reference and split the two hoof attacks rather than collapsing them into one weapon.'
  },weapons:[melee('Bite',11,'1d4+5'),melee('Hoof 1',6,'1d6+2'),melee('Hoof 2',6,'1d6+2')]
 },
 'wriggling-man':{
  stats:{str:10,dex:23,con:23,int:25,wis:12,cha:12,fastHealing:21,dr:15,casterLevel:20},
  text:{
   raceClassLevels:'Male human worm that walks transmuter 20 (Pathfinder Bestiary 2, p. 286).',sourceReference:'Human worm that walks transmuter 20 (Pathfinder Bestiary 2, p. 286).',
   senses:'Blindsight 30 ft., darkvision 60 ft.; Perception +29.',
   defenses:'Worm that walks traits; DR 15/—; fast healing 21. Fort/Ref/Will gain +8 resistance versus mind-affecting effects.',
   immunities:'Critical hits, disease, flanking, paralysis, poison, sleep.',energyResistances:'Cold 30; fire 10.',
   acDetail:'29, touch 21, flat-footed 22 (+6 armor, +2 deflection, +6 Dex, +1 dodge, +2 insight, +2 natural).',
   hpDetail:'232 (20d6+160); fast healing 21.',saveDetail:'Fort +17, Ref +17, Will +20 (+8 resistance vs. mind-affecting).',
   movementDetail:'Speed 30 ft., fly 40 ft. (good).',maneuverDetail:'CMB +10 (+18 grapple); CMD 35.',
   attackDetail:'Melee slam +16 (1d4 plus grab).',
   specialAttacks:'Discorporate, grab against Large foes, squirming embrace, tenacious.',
   spellLikeAbilities:'Transmuter school powers CL 20th, concentration +27: change shape at will (beast shape III or elemental body II; 20 rounds/day); telekinetic fist 10/day (1d4+10 bludgeoning).',
   spellsPrepared:'Transmuter CL 20th, concentration +27. 9th—quickened feeblemind (DC 22), meteor swarm (DC 26), summon monster IX, time stop, weird (DC 26); 8th—quickened dimension door, quickened greater invisibility, mind blank, quickened phantasmal killer (DC 21), polymorph any object (DC 27); 7th—quickened dispel magic (2), mass hold person (2, DC 24), mage’s sword, reverse gravity; 6th—chain lightning (2, DC 23), disintegrate (DC 25), flesh to stone (DC 25), mage’s lucubration, quickened scorching ray; 5th—feeblemind (DC 22), overland flight, quickened shield, telekinesis (DC 24), telepathic bond; 4th—black tentacles, confusion (DC 21), dimension door, mnemonic enhancer, phantasmal killer (DC 21), mass reduce person (DC 23); 3rd—dispel magic (2), fireball (2, DC 20), protection from energy, slow (DC 22), stinking cloud (DC 20); 2nd—invisibility, pyrotechnics (DC 21), resist energy, scorching ray (3), web (DC 19); 1st—expeditious retreat, feather fall, grease, magic missile (3), reduce person (DC 20); 0 (at will)—acid splash, light, mage hand, prestidigitation. Opposition schools Divination and Necromancy.',
   qualities:'Arcane bond (staff of transmutation); physical enhancement +5.',
   combatGear:'Ring of invisibility; staff of transmutation.',
   gear:'+4 fire resistance leather armor; amulet of natural armor +2; cloak of resistance +5; headband of mental prowess +4 (Int, Cha); portable hole with spellbooks, library and desk; ring of protection +2; spellbook.',
   tactics:'Casts mind blank daily, and overland flight and resist energy (cold) when expecting danger.',
   specialAbilities:'Worm that walks (Su/Ex, template traits): discorporate, squirming embrace and tenacious. For full mechanical triggers refer to Bestiary 2 template; no new damage rolls or save DCs invented.',
   importNotes:'Source-reviewed printed pp. 131–132 (PDF pp. 132–133). Rebuilt every transmuter spell tier across the column break, corrected resistances and fast healing, repaired armor/equipment and separated school powers from prepared spells.'
  },
  weapons:[melee('Slam (grabbing)',16,'1d4','Grab (can grapple creatures up to Large size).')],
  activeAbilities:[ability('Discorporate','su','Worm that walks template ability; consult Pathfinder Bestiary 2 for full mechanics.'),ability('Squirming Embrace','ex','Worm that walks template damage ability; consult Pathfinder Bestiary 2; no invented dice.'),ability('Telekinetic Fist','sp','10/day, CL20, 1d4+10 bludgeoning.')]
 },
 'xae':{
  stats:{str:null,dex:12,con:null,int:11,wis:10,cha:22},
  text:{
   raceClassLevels:'Female gnome ghost expert 13 (Pathfinder Bestiary, p. 144).',
   senses:'Darkvision 60 ft., low-light vision; Perception +36.',
   acDetail:'18, touch 18, flat-footed 17 (+6 deflection, +1 Dex, +1 size).',hpDetail:'162 (13d8+104).',saveDetail:'Fort +12, Ref +7, Will +8 (+2 vs. illusions).',
   movementDetail:'Fly 30 ft. (perfect); no land speed printed.',
   defenses:'Channel resistance +4, defensive training, incorporeal, rejuvenation; undead traits.',
   attackDetail:'Melee corrupting touch +11 (13d6 plus twist time; Fort DC 22).',
   specialAttacks:'Hatred; Shyka’s Judgment.',
   spellLikeAbilities:'CL 13th, concentration +19: 1/day each—dancing lights, ghost sound (DC 17), prestidigitation, speak with animals.',
   qualities:'Gnome magic.',
   specialAbilities:'Shyka’s Judgment (Su): standard action, only in the shrine’s specified area A3. Living creatures in that area take 12d6 and are stunned for 1 round; Will DC 22 halves damage and negates stun; mind-affecting; unavailable for 1d4 rounds afterward. Twist Time (Su): if corrupting touch deals damage and Fort DC 22 fails, victim is slowed for 1d4 rounds. A creature already slowed instead suffers 2 Strength drain; drain to 0 Strength is fatal.',
   importNotes:'Source-reviewed printed pp. 132–133 (PDF pp. 133–134). Undead Strength and Constitution are null; Shyka’s Judgment (Will DC22, shrine-limited) is distinct from Twist Time (Fort DC22), with no invented general-purpose area effect.'
  },
  weapons:[melee('Corrupting touch',11,'13d6','Plus twist time, Fort DC 22; see conditional ability.')],
  activeAbilities:[ability('Shyka’s Judgment','su','Shrine area A3 only. Standard action: 12d6 and stun 1 round; Will DC 22 halves and negates stun; 1d4-round cooldown; mind-affecting.'),ability('Twist Time','su','Corrupting touch that injures: Fort DC 22 or slowed 1d4 rounds; already slowed victim takes 2 Str drain instead.')]
 },
 'zorek':{
  stats:{str:24,dex:8,con:23,int:8,wis:20,cha:16,fastHealing:5,dr:5,casterLevel:12},
  text:{
   raceClassLevels:'Male divine guardian human cleric of Gorum 12 (Pathfinder Bestiary 4, p. 60).',sourceReference:'Divine guardian human cleric of Gorum 12 (Pathfinder Bestiary 4, p. 60).',
   senses:'Darkvision 60 ft., low-light vision; Perception +20.',
   acDetail:'21, touch 12, flat-footed 21 (+7 armor, +4 deflection, −1 Dex, +2 natural, −1 size).',
   hpDetail:'153 (12d8+96); fast healing 5.',saveDetail:'Fort +16, Ref +3, Will +13.',
   defenses:'Ability healing; fortification 25%; freedom of movement; DR 5/evil; fast healing 5.',
   immunities:'Disease, mind-affecting effects, poison.',
   movementDetail:'Speed 60 ft. (50 ft. in armor), air walk; space 10 ft., reach 10 ft.',
   attackDetail:'Melee +3 anarchic spear +20/+15 (2d6+14/19–20/×3 plus 2d6 against lawful). The equipped spear is +1; greater magic weapon is pre-cast for the printed +3 attack enhancement.',
   specialAttacks:'Channel positive energy 6/day (DC 19, 6d6); might of the gods +12 (12 rounds/day); weapon master 12 rounds/day.',
   spellLikeAbilities:'Divine guardian CL 12th concentration +15: at will—dimension door (only within sacred site); 3/day—alarm, knock; 1/day—arcane lock, augury, clairaudience/clairvoyance, commune, dismissal (DC 18), guards and wards, hold portal. Domain powers CL 12th concentration +17: 8/day—battle rage (+6), strength surge (+6).',
   spellsPrepared:'Cleric CL 12th, concentration +17: 6th—antilife shell, blade barrier [domain] (DC 21), heal; 5th—greater command (DC 20), flame strike (2, DC 20), righteous might [domain], wall of stone; 4th—air walk, chaos hammer (DC 19), divine power [domain], freedom of movement, greater magic weapon; 3rd—dispel magic (2), invisibility purge, magic vestment [domain], searing light, wind wall; 2nd—bear’s endurance, bull’s strength [domain], hold person (DC 17), resist energy, sound burst (DC 17), spiritual weapon; 1st—command (DC 16), divine favor, enlarge person [domain] (DC 16), obscuring mist, protection from law, sanctuary (DC 16), shield of faith; 0 (at will)—bleed (DC 15), light, mending, stabilize. Domains Strength and War.',
   qualities:'Blessed life, divine swiftness, sacred site.',languages:'Hallit.',
   tactics:'Pre-casts magic vestment and greater magic weapon daily. Before engagement at his sacred site: freedom of movement, air walk, bear’s endurance, bull’s strength, shield of faith, righteous might, divine favor. Printed size/AC/attack statistics include these buffs.',
   skillDetail:'Knowledge (religion) +12, Perception +20, Sense Motive +10, Survival +9.',
   gear:'+1 light fortification hide armor; +1 anarchic spear (treated as +3 in printed attacks after greater magic weapon).',
   feats:'Combat Casting, Great Fortitude, Improved Critical (spear), Power Attack, Toughness, Vital Strike, Weapon Focus (spear).',
   importNotes:'Source-reviewed printed pp. 132–133 (PDF pp. 133–134). Restored complete divine guardian, domain and cleric spells; corrected sidebars/skills and kept equipped +1 spear separate from buffed +3 attack bonuses.'
  },
  weapons:[melee('Buffed anarchic spear +20',20,'2d6+14','Critical 19–20/×3; plus 2d6 vs lawful; weapon base +1, buffed to +3.'),melee('Buffed anarchic spear +15',15,'2d6+14','Second iterative; same lawful bonus; printed buffed statistics.')],
  npcSkills:[['Knowledge (religion)',12],['Perception',20],['Sense Motive',10],['Survival',9]].map(([name,bonus])=>({name,bonus})),
  activeAbilities:[ability('Channel Positive Energy','su','6/day, 6d6, DC 19.'),ability('Divine Guardian Spell-Like Abilities','sp','Sacred site only dimension door at will; alarm/knock 3/day; seven named powers 1/day.'),ability('Might of the Gods','su','+12 for 12 rounds/day.'),ability('Weapon Master','su','12 rounds/day; see divine guardian ability.')]
 }
});