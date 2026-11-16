// Kingmaker Bestiary (First Edition): PDF-checked creatures 81–90.
// Book pp. 52–57; PDF pp. 53–58. Overlay only, without editing raw PDF extraction.
const melee=(name,npcAttackBonus,damage,props={})=>({name,attack_type:'melee',npcAttackBonus,damage,...props});
const ranged=(name,npcAttackBonus,damage,props={})=>({name,attack_type:'ranged',npcAttackBonus,damage,...props});
const ability=(name,ability_kind,desc)=>({name,ability_kind,desc});
export const KINGMAKER_BESTIARY_REVIEWED_081_090=Object.freeze({
 'scythe-tree':{
  text:{
   sourceReference:'Scythe Tree (Tome of Horrors Complete p. 528).',
   defenses:'DR 5/slashing; plant traits.',
   immunities:'Plant traits.',
   drBypass:'Slashing.',
   maneuverDetail:'CMB +15 (+17 disarm); CMD 27 (29 vs. disarm; cannot be tripped).',
   specialAttacks:'Ripping disarm, woodland ambush; two scythe branches (slashing and piercing, ×4 critical).',
   specialAbilities:'Dead Tree (Ex): may take 20 on Stealth while posing as a motionless dead tree. Ripping Disarm (Ex): immediate action disarm attempt when enemy misses scythe tree with a melee weapon. Woodland Ambush (Ex): can use full-round actions in a surprise round if it began combat concealed as a dead tree.',
   importNotes:'Source-reviewed printed p. 52 (PDF p. 53): two separate branches, unusual ×4 critical, disarm and surprise-round actions.'
  },
  weapons:[melee('Scythe branch 1',11,'1d8+7',{crit_mult:'x4',desc:'Slashing and piercing.'}),melee('Scythe branch 2',11,'1d8+7',{crit_mult:'x4',desc:'Slashing and piercing.'})],
  activeAbilities:[ability('Dead Tree','ex','May take 20 on Stealth while motionless as a dead tree.'),ability('Ripping Disarm','ex','Immediate-action disarm against missed melee weapon attack; printed CMB +17 disarm.'),ability('Woodland Ambush','ex','Full round of actions in surprise round if initially hidden as a dead tree.')]
 },
 'tree-that-weeps':{
  text:{
   defenses:'DR 15/slashing; immune mind-affecting effects, paralysis, poison, polymorph, sleep and stunning.',
   immunities:'Mind-affecting effects, paralysis, poison, polymorph, sleep, stunning.',
   drBypass:'Slashing.',
   maneuverDetail:'CMB +34 (+38 disarm); CMD 51 (53 vs. disarm, cannot be tripped).',
   specialAttacks:'Three scythe branches (×4 critical), ripping disarm, woodland ambush; weeping aura 30 ft.',
   specialAbilities:'Dead Tree (Ex): take 20 on Stealth when motionless and camouflaged as a dead tree. Ripping Disarm (Ex): immediate action disarm attempt when creature misses with a melee weapon. Weeping Aura (Su): activates on acting, ends on using dead tree; entering or beginning turn within 30 ft. Will DC 22 or paralyzed for 1 round and sickened for 1 minute. Exposed creatures immune to this aura for 24 hours. Woodland Ambush (Ex): full round in surprise round if combat started while hiding as dead tree.',
   importNotes:'Source-reviewed printed pp. 52–53 (PDF pp. 53–54): replaced combined triple attack, preserved ×4 multiplier, special defense and Will DC 22 aura.'
  },
  weapons:Array.from({length:3},(_,i)=>melee('Scythe branch '+(i+1),27,'4d8+12',{crit_range:'19-20',crit_mult:'x4',desc:'Slashing and piercing.'})),
  activeAbilities:[ability('Dead Tree','ex','May take 20 on Stealth while hiding motionless as a dead tree.'),ability('Ripping Disarm','ex','Immediate-action disarm when enemy melee weapon misses.'),ability('Weeping Aura','su','30-ft. aura, Will DC 22 or paralyzed 1 round and sickened 1 minute; 24h immunity after exposure.'),ability('Woodland Ambush','ex','Can take a full round in a surprise round after starting hidden as a dead tree.')]
 },
 'skeletal-hulk':{
  stats:{con:null,int:null},
  text:{
   defenses:'DR 5/bludgeoning; immune cold and undead traits.',
   immunities:'Cold, undead traits.',
   drBypass:'Bludgeoning.',
   feats:'Improved Initiative (bonus feat).',
   acDetail:'25, touch 10, flat-footed 23 (+2 Dex, +15 natural, –2 size).',
   saveDetail:'Fort +5, Ref +7, Will +10.',
   attackDetail:'Two claws +22 (1d8+12 each) and two slams +22 (2d6+12 each).',
   importNotes:'Source-reviewed printed p. 53 (PDF p. 54): restored absent Con/Int as null and split four separate natural attacks; removed page/sidebar text and adjacent skeletal tiger lord prose.'
  },
  weapons:[melee('Claw 1',22,'1d8+12'),melee('Claw 2',22,'1d8+12'),melee('Slam 1',22,'2d6+12'),melee('Slam 2',22,'2d6+12')]
 },
 'skeletal-tiger-lord':{
  stats:{con:null,fastHealing:6},
  text:{
   sourceReference:'Bloody human skeletal champion fighter 10 (Pathfinder Bestiary pp. 251–252).',
   raceClassLevels:'Bloody human skeletal champion fighter 10.',
   defenses:'Channel resistance +4, deathless, DR 5/bludgeoning; immune cold and undead traits.',
   immunities:'Cold, undead traits.',
   drBypass:'Bludgeoning.',
   hpDetail:'102 (2d8+10d10+34); fast healing 6.',
   feats:'Deadly Aim, Exotic Weapon Proficiency (bastard sword), Greater Weapon Focus (bastard sword), Improved Initiative, Iron Will, Point-Blank Shot, Power Attack, Precise Shot, Toughness, Vital Strike, Weapon Focus (bastard sword, longbow), Weapon Specialization (bastard sword, longbow).',
   specialAbilities:'Deathless (Su): when reduced to zero hit points, reforms after 1 hour at 1 HP and resumes fast healing. Destruction by positive energy, destruction within bless/hallow, or holy water on remains prevents return; destroying tomb runes removes the ability.',
   importNotes:'Source-reviewed printed pp. 53–54 (PDF pp. 54–55): complete feats, Constitution absence, six fast healing, undead defenses and special final-destruction methods.'
  },
  activeAbilities:[ability('Deathless','su','At zero HP returns after 1 hour at 1 HP; permanently destroyed by positive energy, zero HP in bless/hallow, or holy water on remains; special runes may disable.')]
 },
 'chew-spiders':{
  stats:{int:null,cmb:null,cmd:null},
  text:{
   defenses:'Swarm traits; immune weapon damage and mind-affecting effects.',
   immunities:'Weapon damage, mind-affecting effects.',
   attackDetail:'Swarm automatic area damage 1d6 plus bleed 1d3, distraction (DC 13), and poison; NO conventional attack roll.',
   specialAttacks:'Swarm damage 1d6; bleed 1d3; distraction Fort DC 13; poison Fort DC 13.',
   specialAbilities:'Poison (Ex): swarm injury, Fort DC 13; one dose/round up to 3 rounds, 1d2 Dexterity damage; cured with one successful save.',
   maneuverDetail:'CMB —; CMD — (swarm traits).',
   importNotes:'Source-reviewed printed p. 54 (PDF p. 55). No ordinary attack roll for a swarm; CMB/CMD do not apply, and poison/bleed are distinct from damage. Intelligence is absent, not zero.'
  },
  weapons:[],
  activeAbilities:[ability('Swarm Damage','ex','Automatic 1d6 damage to creatures in occupied area, plus bleed 1d3 and distraction.'),ability('Poison','ex','Swarm injury Fort DC 13; 1d2 Dexterity per round up to 3 rounds, cure one successful save.')]
 },
 'giant-trapdoor-spider':{
  stats:{int:null},
  text:{
   specialAttacks:'Trapdoor lunge; bite poison.',
   maneuverDetail:'CMB +5; CMD 18 (30 vs. trip).',
   specialAbilities:'Poison (Ex): bite injury, Fort DC 15, 1d2 Dexterity/round for up to 6 rounds; one save cures. Trapdoor Lunge (Ex): if combat begins just below its trapdoor in its lair, it can move up to its speed and bite during the surprise round as a standard action.',
   importNotes:'Source-reviewed printed p. 55 (PDF p. 56). Poison DC 15, lunge condition, trip defense and missing vermin Intelligence verified.'
  },
  activeAbilities:[ability('Poison','ex','Bite injury, Fort DC 15; 1d2 Dexterity each round up to 6 rounds, cure one successful save.'),ability('Trapdoor Lunge','ex','Surprise round in lair beneath its trapdoor: move up to speed and bite as one standard action.')]
 },
 'trapdoor-ogre-spider':{
  stats:{int:null},
  text:{
   specialAttacks:'Poison, trapdoor lunge.',
   qualities:'Compression.',
   skillDetail:'Climb +29, Perception +5, Stealth –2.',
   maneuverDetail:'CMB +12; CMD 24 (32 vs. trip).',
   specialAbilities:'Poison (Ex): bite injury, Fort DC 18; 1d4 Dexterity/round up to 6 rounds, one save cures. Trapdoor Lunge (Ex): in a surprise round beginning beneath its lair trapdoor, move its speed and make a bite attack as a standard action.',
   importNotes:'Source-reviewed printed p. 55 (PDF p. 56). Restored clean Stealth skill, poison DC 18, compression and conditional lunge.'
  },
  npcSkills:[{name:'Climb',bonus:29},{name:'Perception',bonus:5},{name:'Stealth',bonus:-2}],
  activeAbilities:[ability('Poison','ex','Bite injury Fort DC 18, 1d4 Dex per round for 6 rounds; one successful save cures.'),ability('Trapdoor Lunge','ex','During lair surprise round while under trapdoor: move speed and bite as one standard action.')]
 },
 'sportlebore-swarm':{
  stats:{int:null,cmb:null,cmd:null},
  text:{
   defenses:'Swarm traits; immune mind-affecting effects and weapon damage.',
   immunities:'Mind-affecting effects, weapon damage.',
   specialAttacks:'Automatic swarm damage 3d6 plus distraction (Fort DC 17); pour down throat and sportlebore infestation.',
   attackDetail:'Swarm damage 3d6 to creatures in occupied area; NO conventional melee attack roll applies. The printed block lists +8 for the swarm attack, retained here as source context only.',
   skillDetail:'No skills listed in source stat block.',
   specialAbilities:'Pour Down Throat (Ex): living creature distracted by this swarm makes Reflex DC 20; failure deals 2d6 piercing, prevents speaking for 1 round and transmits infestation. Sportlebore Infestation (Ex): Fort DC 17 disease; onset 1 day, 1/day, 1d4 Strength damage, cure two consecutive successful saves. Three consecutive failed saves cause vomiting of another swarm, dealing 4d6 piercing, while the original disease persists.',
   importNotes:'Source-reviewed printed pp. 55–56 (PDF pp. 56–57). Fixed neighboring spriggan prose incorrectly entered as skills; swarm automatic damage, missing Int/CMB/CMD and disease rules are explicit.'
  },
  weapons:[],npcSkills:[],
  activeAbilities:[ability('Swarm Damage','ex','Automatic 3d6 swarm area damage with Fort DC 17 distraction; no conventional melee attack roll.'),ability('Pour Down Throat','ex','After distraction, Reflex DC 20 or 2d6 piercing, cannot speak 1 round, and infestation.'),ability('Sportlebore Infestation','ex','Fort DC 17 disease, 1d4 Strength per day; 3 failed saves in a row spawn new swarm (4d6 piercing), 2 consecutive saves cure.')]
 },
 'spriggan-warlord':{
  text:{
   gear:'+1 leather armor, +1 light crossbow, +1 morningstar.',
   specialAttacks:'Sneak attack +2d6; spriggan size alteration.',
   qualities:'Armor training 1, size alteration, spriggan magic, spriggan skills. Enlarged form (same creature, NOT a separate entry): Large, AC 17/touch 14/flat 12; 100 HP; Fort +14, Ref +7, Will +4; initiative +5; speed 20 ft.; morningstar +15/+10 (2d6+10), crossbow +12 (2d6+1, 19–20); space/reach 10 ft.; Str 25, Dex 21, Con 23; CMB +15, CMD 30; Acrobatics +5, Climb +13, Disable Device +9, Intimidate +4, Perception +7, Sleight of Hand +11, Stealth +8.',
   importNotes:'Source-reviewed printed pp. 56–57 (PDF pp. 57–58). Source provides an ENLARGED alternate stat block; this is retained as same creature’s optional form, not a new NPC.'
  },
  activeAbilities:[ability('Size Alteration (Enlarged form)','sp','May assume the source enlarged alternative; see the qualities field for different HP, stats, defenses, reach, skills and attacks.')]
 },
 'thresholder-disciple':{
  text:{
   feats:'Dodge, Exotic Weapon Proficiency (shuriken), Great Fortitude, Greater Weapon Focus (unarmed strike), Greater Weapon Specialization (unarmed strike), Improved Critical (unarmed strike), Improved Grapple, Improved Great Fortitude, Improved Initiative, Improved Unarmed Strike, Iron Will, Mobility, Toughness, Two-Weapon Fighting, Weapon Focus (unarmed strike), Weapon Specialization (unarmed strike), Wind Stance.',
   maneuverDetail:'CMB +19 (+21 grapple); CMD 45 (47 vs. grapple).',
   specialAttacks:'Lurker style, weapon trainings (close +3, thrown +2, natural +1).',
   specialAbilities:'Lurker Style (Su): while unarmored, without melee weapons and within Yog-Sothoth influence, +10 profane AC and Reflex (already reflected in the printed block). Unarmed strike or shuriken critical hit: Will DC 21 or staggered 1d4 rounds. Unseen Sight (Su): 60-ft. darkvision and true seeing while within the area of Yog-Sothoth’s influence.',
   importNotes:'Source-reviewed printed p. 57 (PDF p. 58). Completed feats and conditional grapple; printed +10 profane armor/saves already active and must not be double-applied.'
  },
  activeAbilities:[ability('Lurker Style','su','In Yog-Sothoth-influenced area, if no armor or melee weapons: +10 profane AC/Reflex (included in base stats). Crit with unarmed or shuriken: Will DC 21 or staggered 1d4 rounds.'),ability('Unseen Sight','su','Under Yog-Sothoth influence: darkvision 60 ft. and true seeing.')]
 }
});