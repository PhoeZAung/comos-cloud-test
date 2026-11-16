// Kingmaker Bestiary (First Edition), PDF-reviewed entries 61–70.
// Printed pp. 40–45 / PDF pp. 41–46. Applies only reviewed corrections.
const melee=(name,npcAttackBonus,damage,props={})=>({name,attack_type:'melee',npcAttackBonus,damage,...props});
const ranged=(name,npcAttackBonus,damage,props={})=>({name,attack_type:'ranged',npcAttackBonus,damage,...props});
const ability=(name,ability_kind,desc)=>({name,ability_kind,desc});
export const KINGMAKER_BESTIARY_REVIEWED_061_070=Object.freeze({
 'irlgaunt':{
  text:{
   defenses:'DR 10/bludgeoning; immune acid and cold.',
   immunities:'Acid, cold.',
   drBypass:'Bludgeoning.',
   maneuverDetail:'CMB +19; CMD 38 (42 vs. trip).',
   movementDetail:'Land 40 ft., climb 40 ft.',
   specialAbilities:'Gastrolith (Ex): once every 1d4 rounds, spit a stone-and-acid projectile as a thrown splash weapon (range increment 30 ft.), dealing 2d6+8 bludgeoning and 2d6 acid on direct hit; creatures within 10 ft. of impact take 1d6 acid. Can use the ranged gastrolith alongside all regular melee attacks. Stone Step (Ex): ignore natural difficult terrain while on rocky or subterranean ground; magical difficult terrain still applies.',
   importNotes:'PDF-reviewed printed p. 40 (PDF p. 41). Restored conditional CMD, two slams and gastrolith splash/cooldown without combining ranged and melee sequences.'
  },
  weapons:[
   melee('Slam 1',17,'1d8+8',{desc:'Plus 1d6 acid.'}),
   melee('Slam 2',17,'1d8+8',{desc:'Plus 1d6 acid.'}),
   melee('Bite',17,'1d8+8'),
   ranged('Gastrolith',18,'2d6+8',{desc:'Plus 2d6 acid direct hit; splash 1d6 acid within 10 ft.; reload 1d4 rounds; can accompany normal melee sequence.'})
  ],
  activeAbilities:[
   ability('Gastrolith','ex','Once every 1d4 rounds, ranged splash projectile; 30-ft. range increment; splash 1d6 acid within 10 ft. Can accompany melee routine.'),
   ability('Stone Step','ex','Ignore natural difficult terrain in rocky/subterranean areas; magical alterations still apply.')
  ]
 },
 'jabberwock-lesser':{
  stats:{fastHealing:15,sr:31},
  text:{
   drBypass:'Vorpal.',
   defenses:'DR 15/vorpal; fast healing 15; SR 31; immune fire, paralysis and sleep; resist acid/electricity/sonic 30.',
   immunities:'Fire, paralysis, sleep.',
   energyResistances:'Acid 30, electricity 30, sonic 30.',
   qualities:'Planar acclimation.',
   movementDetail:'Land 40 ft., fly 80 ft. (poor).',
   maneuverDetail:'CMB +36 (+38 bull rush, +40 grapple); CMD 52 (54 vs. bull rush).',
   attackDetail:'Bite +32 (4d8+16, 19–20/×3), two claws +32 (3d6+11, 19–20, plus grab), tail slap +27 (2d8+16), two wings +27 (1d8+5); ranged two eye rays +26 ranged touch (14d6 fire plus burn).',
   importNotes:'PDF-reviewed printed p. 41 (PDF p. 42). Restored two claws, two wings, two ranged eye rays, fast healing 15, DR/SR, resistances and conditional combat maneuvers. Burble, whiffling and vorpal fear still follow cited Jabberwock rules.'
  },
  weapons:[
   melee('Bite',32,'4d8+16',{crit_range:'19-20',crit_mult:'x3'}),
   melee('Claw 1',32,'3d6+11',{crit_range:'19-20',desc:'Plus grab.'}),
   melee('Claw 2',32,'3d6+11',{crit_range:'19-20',desc:'Plus grab.'}),
   melee('Tail slap',27,'2d8+16'),
   melee('Wing 1',27,'1d8+5'),
   melee('Wing 2',27,'1d8+5'),
   ranged('Eye ray 1 (touch)',26,'14d6',{desc:'Fire plus burn; ranged touch, not a physical attack.'}),
   ranged('Eye ray 2 (touch)',26,'14d6',{desc:'Fire plus burn; ranged touch, not a physical attack.'})
  ],
  activeAbilities:[
   ability('Eye Rays','su','Two ranged-touch rays +26, each 14d6 fire plus burn; see external jabberwock rules for targeting.'),
   ability('Burble and Whiffling','su','Use referenced Pathfinder Bestiary 2 Jabberwock rules; do not treat as ordinary weapon damage.')
  ]
 },
 'kobold-scout':{
  text:{
   defenses:'Evasion.',
   weaknesses:'Light sensitivity.',
   feats:'Improved Initiative, Weapon Focus (short sword).',
   gear:'Leather armor, masterwork light crossbow, masterwork short sword.',
   acDetail:'17, touch 14, flat-footed 14 (+2 armor, +3 Dex, +1 natural, +1 size).',
   hpDetail:'14 (2d8+2)',
   importNotes:'PDF-reviewed printed p. 41 (PDF p. 42). Removed section navigation and neighboring krooth prose, preserved small-size AC and both attack options.'
  }
 },
 'krooth':{
  text:{
   specialAttacks:'Bleed 1d6, poison tooth.',
   defenses:'Pain frenzy.',
   specialAbilities:'Pain Frenzy (Ex): after taking a critical hit, gain +2 to attack and damage rolls until end of next turn, but cannot make attacks of opportunity during frenzy. Poison Tooth (Ex): when a target takes krooth bleed, Fort DC 20 or tooth remains lodged; target takes –2 Constitution until removal. Stopping bleed or removing the tooth requires DC 25 Heal or appropriate magical healing; multiple tooth penalties do not stack.',
   importNotes:'PDF-reviewed printed pp. 41–42 (PDF pp. 42–43). Split two claws and preserve secondary tail attack; added pain frenzy and poison tooth save/removal rules.'
  },
  weapons:[
   melee('Bite',15,'1d8+6',{desc:'Plus bleed 1d6; poison tooth Fort DC 20.'}),
   melee('Claw 1',15,'1d4+6'),
   melee('Claw 2',15,'1d4+6'),
   melee('Tail slap',12,'1d6+3')
  ],
  activeAbilities:[
   ability('Pain Frenzy','ex','After critical hit against it: +2 attack and damage until end of next turn; cannot make attacks of opportunity.'),
   ability('Poison Tooth','ex','Target affected by bleed: Fort DC 20 or lodged tooth gives –2 Con; Heal DC 25 or magic to treat/remove.')
  ]
 },
 'lerritan':{
  text:{
   raceClassLevels:'',
   drBypass:'Bludgeoning.',
   maneuverDetail:'CMB +38 (+40 bull rush, +40 sunder); CMD 54 (56 vs. bull rush or sunder).',
   skillDetail:'Climb +37, Craft (weapons) +30, Intimidate +32, Knowledge (nature) +30, Knowledge (planes) +30, Knowledge (religion) +30, Perception +35, Sense Motive +35.',
   specialAbilities:'Tenacious Flames (Su): within 100 ft., burn damage continues indefinitely until actively extinguished; leaving aura starts a 1d4-round end duration, while reentry extends it. Attempts to end burn take a –4 penalty without stop-drop-roll bonus. Volcanic Eruption (Su): 30-ft.-radius blast around lerritan deals 12d12 fire, Reflex DC 32 half; affected creatures become grappled by cooling lava for 1 round on success or 1 minute on failure, escape DC 32.',
   importNotes:'PDF-reviewed printed pp. 42–43 (PDF pp. 43–44). Restored Knowledge (nature) and removed extraneous book heading used as identity; added conditional combat maneuvers and 12d12 eruption DC 32.'
  },
  npcSkills:[
   {name:'Climb',bonus:37},{name:'Craft (weapons)',bonus:30},{name:'Intimidate',bonus:32},
   {name:'Knowledge (nature)',bonus:30},{name:'Knowledge (planes)',bonus:30},{name:'Knowledge (religion)',bonus:30},
   {name:'Perception',bonus:35},{name:'Sense Motive',bonus:35}
  ],
  activeAbilities:[
   ability('Tenacious Flames','su','100-ft. aura: burn continues while inside; outside expires after 1d4 rounds. Ending fire has –4 save penalty, no rolling bonus.'),
   ability('Volcanic Eruption','su','30-ft. radius, 12d12 fire, Reflex DC 32 half; cooling lava grapples 1 round on success or 1 minute on failure; escape DC 32.')
  ]
 },
 'lizardfolk-scout':{
  text:{
   specialAttacks:'Sneak attack +1d6.',
   languages:'Common, Draconic.',
   gear:'Blowgun with five darts coated in small centipede poison.',
   feats:'Iron Will, Skill Focus (Stealth).',
   qualities:'Hold breath, trapfinding +1.',
   skillDetail:'Acrobatics +11, Diplomacy +4, Knowledge (nature) +2, Perception +7, Stealth +10, Survival +7, Swim +10.',
   attackDetail:'Melee bite +3 (1d4+2), two claws +3 (1d4+2); ranged blowgun +3 (1d2 plus small centipede poison).',
   importNotes:'PDF-reviewed printed pp. 43–44 (PDF pp. 44–45). Cleaned navigation bleed from all fields; restored two claws and correctly named Perception skill.'
  },
  weapons:[
   melee('Bite',3,'1d4+2'),
   melee('Claw 1',3,'1d4+2'),
   melee('Claw 2',3,'1d4+2'),
   ranged('Blowgun',3,'1d2',{desc:'Plus small centipede poison; five coated darts available.'})
  ],
  npcSkills:[
   {name:'Acrobatics',bonus:11},{name:'Diplomacy',bonus:4},{name:'Knowledge (nature)',bonus:2},
   {name:'Perception',bonus:7},{name:'Stealth',bonus:10},{name:'Survival',bonus:7},{name:'Swim',bonus:10}
  ]
 },
 'lizardfolk-warrior':{
  text:{
   gear:'Leather armor, javelin, masterwork longspear.',
   attackDetail:'Masterwork longspear +6 (1d8+3, ×3) OR bite +5 (1d4+2) plus two claws +5 (1d4+2); ranged javelin +3 (1d6+2).',
   movementDetail:'Land 30 ft., swim 15 ft.; natural reach 5 ft., longspear reach 10 ft.',
   importNotes:'PDF-reviewed printed p. 43 (PDF p. 44). Preserved longspear-versus-natural-attack alternatives, two separate claws and reach.'
  },
  weapons:[
   melee('Masterwork longspear',6,'1d8+3',{crit_mult:'x3',desc:'Alternative to natural melee attacks; reach 10 ft.'}),
   melee('Bite (alternative)',5,'1d4+2'),
   melee('Claw 1 (alternative)',5,'1d4+2'),
   melee('Claw 2 (alternative)',5,'1d4+2'),
   ranged('Javelin',3,'1d6+2')
  ]
 },
 'immense-mandragora':{
  text:{
   energyResistances:'Acid 10, cold 10, electricity 15.',
   immunities:'Plant traits.',
   weaknesses:'Vulnerable to supernatural darkness (slowed while in it).',
   specialAttacks:'Blood drain 1d4 Constitution, shriek.',
   specialAbilities:'Poison (Ex): vine-whip injury, Fort DC 32, 1/round for six rounds, confusion and fatigue; special cure by acting normally on confusion behavior table. Shriek (Su): once/day standard action, 30-ft. area, 20d6 sonic (Reflex DC 32 half), failed save also nauseates for 1d4 rounds. Vine Whip: primary slashing attack. Supernatural darkness slows it.',
   maneuverDetail:'CMB +37 (+39 bull rush, +41 grapple); CMD 50 (52 vs. bull rush).',
   importNotes:'PDF-reviewed printed p. 44 (PDF p. 45). Restored two vine whips, 20d6 shriek, poison save and darkness vulnerability.'
  },
  weapons:[
   melee('Bite',29,'4d6+17',{desc:'Plus grab and blood drain.'}),
   melee('Vine whip 1',29,'3d6+17',{desc:'Slashing, poison Fort DC 32.'}),
   melee('Vine whip 2',29,'3d6+17',{desc:'Slashing, poison Fort DC 32.'})
  ],
  activeAbilities:[
   ability('Poison','ex','Vine whip injury, Fort DC 32; confusion and fatigue up to six rounds, special cure through normal behavior roll.'),
   ability('Shriek','su','1/day standard action, 30-ft. radius, 20d6 sonic, Reflex DC 32 half; failed save nauseates 1d4 rounds.'),
   ability('Vulnerable to Supernatural Darkness','ex','Slowed as the spell slow while in supernatural darkness.')
  ]
 },
 'mandragora-swarm':{
  stats:{cmb:null,cmd:null,fastHealing:10},
  text:{
   defenses:'Swarm traits, plant traits; immune weapon damage; resist acid 10, cold 10, electricity 15; fast healing 10.',
   immunities:'Plant traits, weapon damage.',
   energyResistances:'Acid 10, cold 10, electricity 15.',
   weaknesses:'Darkness disables fast healing and slows the swarm.',
   specialAttacks:'Automatic swarm damage 5d6 plus blood drain, distraction (Fort DC 30), and poison; shriek (Will DC 30).',
   attackDetail:'Swarm deals 5d6 damage to creatures in occupied space; NO conventional melee attack roll; blood drain, poison and distraction apply.',
   hpDetail:'299 (26d8+182); fast healing 10.',
   specialAbilities:'Blood Drain (Ex): after swarm damage, target also takes 1d6 Strength damage. If cumulative Strength damage exceeds its Strength score, further drain deals 2d4 Constitution damage instead. Poison (Ex): injury, Fort DC 30, every round up to six rounds; confused 1 round; two consecutive saves end. Shriek (Su): once/day standard action, within 30 ft. Will DC 30 or nauseated 1d4 rounds; sonic and mind-affecting. Hive Mind (Ex): single collective mind but retains plant mind-affecting immunity. Darkness disables fast healing and slows the swarm.',
   importNotes:'PDF-reviewed printed pp. 44–45 (PDF pp. 45–46). Swarm lacks CMB/CMD and normal attack roll; fast healing, blood drain and 30 DC effects kept separate.'
  },
  weapons:[],
  activeAbilities:[
   ability('Swarm Damage','ex','Automatic 5d6 area damage plus blood drain, poison and distraction; no ordinary attack roll.'),
   ability('Blood Drain','ex','1d6 Str damage on swarm damage; after accumulated Str damage exceeds Str score, 2d4 Con damage.'),
   ability('Poison','ex','Fort DC 30, confusion 1 round, frequency each round for 6 rounds, cure 2 consecutive saves.'),
   ability('Shriek','su','1/day 30-ft. area, Will DC 30 or nauseated 1d4 rounds (sonic/mind-affecting).'),
   ability('Vulnerable to Darkness','ex','In darkness loses fast healing 10 and becomes slowed.')
  ]
 },
 'mudwretch':{
  text:{
   defenses:'DR 5/bludgeoning; elemental immunities; acid resistance 5.',
   drBypass:'Bludgeoning.',
   immunities:'Elemental traits.',
   energyResistances:'Acid 5.',
   weaknesses:'Susceptible to desiccation; fire.',
   specialAttacks:'Breath weapon: 20-ft. line, 2d6 bludgeoning (Reflex DC 13 half), once every 1d4 rounds; constrict 1d4+4; gory hydration.',
   specialAbilities:'Gory Hydration (Su): while dehydrated, constrict inflicts 1d4 bleed and removes dehydration penalties. Muddy Field (Su): 10-ft. area around it is difficult terrain for others. Mud Puddle (Ex): move action to become a 5-ft. puddle, may take 20 on Stealth to hide in plain sight. Susceptible to Desiccation (Ex): significant fire or desiccation exposure, or 24+ hours without water, makes creature sickened and staggered and prevents mud breath until rehydrated.',
   importNotes:'PDF-reviewed printed p. 45 (PDF p. 46). Added breath recharge and DC, muddy field, blood-driven recovery, puddle action and dehydration restrictions.'
  },
  activeAbilities:[
   ability('Breath Weapon','su','20-ft. line of mud, 2d6 bludgeoning, Reflex DC 13 half, 1d4-round recharge.'),
   ability('Gory Hydration','su','When dehydrated, constrict also inflicts 1d4 bleed and restores normal hydration.'),
   ability('Muddy Field','su','10-ft. area is difficult terrain for creatures other than mudwretches.'),
   ability('Mud Puddle','ex','Move action to form a 5-ft. puddle; may take 20 on Stealth to hide in plain sight.'),
   ability('Susceptible to Desiccation','ex','Severe fire/desiccation or 24 hours without water causes sickened + staggered and disables breath until rehydration.')
  ]
 }
});
