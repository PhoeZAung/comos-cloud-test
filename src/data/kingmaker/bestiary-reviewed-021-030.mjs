// Kingmaker First Edition PDF source-checked Bestiary entries 21–30.
// Printed pp. 19–24 (PDF pp. 20–25). Raw auto-extracted files are untouched.
// This contains game mechanics and short GM notes, not adventure narrative.
// Refer to the underlying book / cited core Bestiary for complete external rules.
const weapon=(name,bonus,damage,other={})=>({name,attack_type:'melee',npcAttackBonus:bonus,damage,...other});
const ranged=(name,bonus,damage,other={})=>({name,attack_type:'ranged',npcAttackBonus:bonus,damage,...other});
const ability=(name,kind,desc)=>({name,ability_kind:kind,desc});
export const KINGMAKER_BESTIARY_REVIEWED_021_030=Object.freeze({
 'thorn-river-bandit':{
  text:{
   gear:'Leather armor, longbow, short sword, trail rations (2), 10 gp.',
   feats:'Improved Initiative, Toughness',
   importNotes:'Source checked: printed p. 19 (PDF p. 20). Base combat statistics, skills, feats, and complete gear checked.'
  },
  weapons:[
   weapon('Short sword',2,'1d6+1',{crit_range:'19-20'}),
   ranged('Longbow',2,'1d8',{crit_mult:'x3'})
  ]
 },
 'murder-of-crows':{
  stats:{cmb:null,cmd:null},
  text:{
   creatureType:'animal',
   subtypes:'swarm',
   senses:'Low-light vision; Perception +14',
   defenses:'Swarm traits (consult Pathfinder Bestiary swarm rules).',
   specialAttacks:'Swarm damage 3d6, blindness, distraction (Fortitude DC 16).',
   feats:'Dodge, Improved Initiative, Lightning Reflexes, Mobility, Skill Focus (Perception), Toughness',
   skillDetail:'Fly +15, Perception +14',
   attackDetail:'Swarm damage 3d6 plus distraction; no conventional melee attack roll.',
   movementDetail:'Land 10 ft.; fly 40 ft. (average).',
   hpDetail:'71 (11d8+22)',
   saveDetail:'Fort +8, Ref +12, Will +5',
   sourceReference:'Variant raven swarm (Pathfinder Bestiary 6 p. 240).',
   importNotes:'Source checked: printed p. 19 (PDF p. 20). Swarm damage must not be rolled as a single-target attack; CMB/CMD are not applicable. Blindness and distraction need reference-book adjudication.'
  },
  weapons:[],
  npcSkills:[{name:'Fly',bonus:15},{name:'Perception',bonus:14}],
  activeAbilities:[
   ability('Swarm Damage','ex','Automatically deals 3d6 swarm damage to creatures in its area; refer to swarm rules for targeting and resistance.'),
   ability('Distraction','ex','Fortitude DC 16; use Pathfinder swarm distraction rules; not an ordinary weapon attack.'),
   ability('Blindness','ex','Blindness special attack; consult source Bestiary for exact trigger and duration.')
  ]
 },
 'antipaladin':{
  stats:{casterLevel:3},
  text:{
   gear:'+1 half-plate, +1 greataxe, 10 javelins.',
   immunities:'Disease.',
   specialAttacks:'Channel negative energy 2/day (DC 14, 3d6); smite good 2/day (+1 attack and AC, +6 damage).',
   spellLikeAbilities:'CL 6th, concentration +7: detect good (at will).',
   spellsPrepared:'Antipaladin spells prepared: CL 3rd, concentration +4; 1st—death knell (DC 12), doom (DC 12).',
   qualities:'Cruelties (fatigued, staggered), fiendish boon (weapon +1, 1/day), touch of corruption 4/day (3d6).',
   movementDetail:'Land 30 ft. (20 ft. in armor).',
   importNotes:'Source checked: printed p. 19 (PDF p. 20). Spellcasting CL 3 and spell-like ability CL 6 are distinct; smite, channel, immunities, and armor speed were checked.'
  },
  weapons:[
   weapon('+1 greataxe attack 1',12,'1d12+7',{crit_mult:'x3'}),
   weapon('+1 greataxe attack 2',7,'1d12+7',{crit_mult:'x3'}),
   ranged('Javelin',7,'1d6+4')
  ],
  activeAbilities:[
   ability('Channel Negative Energy','su','2/day, 3d6 negative energy, DC 14; normal channel targeting and energy rules apply.'),
   ability('Smite Good','su','2/day; +1 attack, +1 AC and +6 damage versus eligible good target; consult class rule for scope.'),
   ability('Touch of Corruption','su','4/day; 3d6 negative energy, with available cruelties fatigue and stagger.')
  ]
 },
 'bloom-cultist':{
  stats:{casterLevel:5},
  text:{
   senses:'Perception +3',
   gear:'+1 kukri, amulet of natural armor +1.',
   specialAttacks:'Channel negative energy 5/day (DC 14, 3d6).',
   spellLikeAbilities:'Bloodline CL 1st: laughing touch 5/day. Domains CL 5th: strength surge (+2) and vision of madness (+2/–2), each 6/day.',
   spellsKnown:'Sorcerer CL 1st: 1st (4/day)—alarm, mage armor; 0—acid splash, detect magic, message, prestidigitation.',
   spellsPrepared:'Cleric CL 5th: 3rd—deeper darkness, dispel magic, rage (domain); 2nd—bull’s strength (domain), cure moderate wounds (2), spiritual weapon; 1st—command (DC 16), lesser confusion (domain, DC 16), cure light wounds (2), shield of faith; 0—bleed (DC 13), light, mending, purify food and drink.',
   qualities:'Fey bloodline, bloodline arcana (+2 DC to compulsion spells); Madness and Strength domains.',
   tactics:'Mage armor cast before combat (already included in printed AC).',
   importNotes:'Source checked: printed p. 20 (PDF p. 21). Cleric CL 5, sorcerer CL 1, domain and bloodline uses kept separate. Prepared/known spells are distinct.'
  },
  activeAbilities:[
   ability('Channel Negative Energy','su','5/day; 3d6 negative energy, DC 14.'),
   ability('Laughing Touch','sp','5/day, bloodline ability (CL 1st).'),
   ability('Strength Surge','sp','6/day; +2, domain ability (CL 5th).'),
   ability('Vision of Madness','sp','6/day; +2/–2, domain ability (CL 5th).')
  ]
 },
 'cleansed-cultist':{
  text:{
   specialAbilities:'Release the Inmost Worm (Su): once per 1d4 rounds, standard action, one creature within 30 ft., Fortitude DC 14. Successful save: 2d6 damage. Failed save: 6d6 damage and sickened 1 round; damage counts as continuous for spellcasting.',
   gear:'+1 leather armor, +1 dagger, +1 short sword, hourglass worth 100 gp.',
   importNotes:'Source checked: printed p. 21 (PDF p. 22). Two-weapon attacks are simultaneous options, not iterative attacks; inmost worm save has different damage on success versus failure.'
  },
  weapons:[
   weapon('+1 short sword',9,'1d6+3',{crit_range:'19-20',desc:'Two-weapon melee routine.'}),
   weapon('+1 dagger',9,'1d4+3',{crit_range:'19-20',desc:'Two-weapon melee routine.'})
  ],
  activeAbilities:[
   ability('Release the Inmost Worm','su','Standard action, cooldown 1d4 rounds; range 30 ft.; Fort DC 14. Success 2d6; failure 6d6 and sickened for 1 round; counts as continuous damage for spellcasting.')
  ]
 },
 'false-priestess':{
  stats:{reach:5},
  text:{
   senses:'Perception +0',
   hpDetail:'62 (8d6+32)',
   movementDetail:'Land 30 ft.; glaive reaches 10 ft. (natural reach 5 ft.).',
   spellLikeAbilities:'Fey bloodline CL 8th: laughing touch 6/day; animal messenger, enthrall (DC 15), suggestion (DC 18), each 1/day.',
   spellsKnown:'Sorcerer CL 8th: 4th (3/day)—charm monster (DC 17); 3rd (6/day)—deep slumber (DC 18), dispel magic, lightning bolt (DC 16); 2nd (7/day)—blindness/deafness (DC 15), glitterdust (DC 15), hideous laughter (DC 17), minor image (DC 15); 1st (7/day)—alarm, charm person (DC 14), entangle (DC 14), grease, mage armor, shield; 0—acid splash, detect magic, ghost sound (DC 13), light, mage hand, mending, prestidigitation, read magic.',
   qualities:'Variant fey bloodline, woodland stride; gains printed bloodline spell-like abilities but not bloodline arcana or Knowledge (nature) as a class skill.',
   combatGear:'Potion of barkskin +3, potion of cure serious wounds; other gear: +1 glaive, cloak of resistance +2, 14 pp, 2 gp.',
   tactics:'Casts mage armor before combat; its +4 armor bonus is included in printed AC.',
   importNotes:'Source checked: printed p. 21 (PDF p. 22). Spell levels, glaive reach, bloodline variant, and equipment checked; printed AC already assumes mage armor.'
  },
  weapons:[weapon('+1 glaive',6,'1d10+2',{crit_mult:'x3',desc:'10-ft. reach with glaive; natural reach 5 ft.'})],
  activeAbilities:[
   ability('Variant Fey Bloodline','ex','Uses listed fey bloodline spell-like abilities; does not receive normal bloodline arcana or Knowledge (nature) class skill.')
  ]
 },
 'sister-of-the-bloodshot-eye':{
  text:{
   gear:'+2 breastplate, +2 keen dagger, belt of mighty constitution +2, silver unholy symbol of Gyronna, spell component pouch, 318 gp.',
   movementDetail:'Land 30 ft. (20 ft. in armor).',
   aura:'Destructive aura (30 ft., +6, 13 rounds/day); aura of madness (30 ft., DC 20, 13 rounds/day).',
   specialAttacks:'Channel negative energy 6/day (DC 19, 7d6); destructive smite +6 (7/day).',
   spellLikeAbilities:'Madness domain CL 13th: vision of madness (+6/–6), 7/day.',
   spellsPrepared:'Cleric CL 13th: 7th—destruction (DC 21), insanity (domain, DC 21); 6th—greater dispel magic, harm (DC 20), phantasmal killer (domain, DC 20); 5th—flame strike (DC 19), shout (domain, DC 19), slay living (DC 19), spell resistance; 4th—air walk, chaos hammer (DC 18), confusion (domain, DC 18), cure critical wounds (3); 3rd—bestow curse (DC 17), cure serious wounds (2), dispel magic, protection from energy, rage (domain); 2nd—cure moderate wounds (2), find traps, hold person (DC 16), spiritual weapon, touch of idiocy (domain); 1st—command (DC 15), cure light wounds (2), divine favor, obscuring mist, true strike (domain); 0—bleed (DC 14), detect poison, light, resistance.',
   skillDetail:'Diplomacy +17, Knowledge (history) +9, Knowledge (religion) +9, Sense Motive +20, Spellcraft +9, Survival +15.',
   importNotes:'Source checked: printed p. 22 (PDF p. 23). Fixed combined Knowledge skill parsing, full gear, armor speed, domain caster level and all printed spell levels.'
  },
  npcSkills:[
   {name:'Diplomacy',bonus:17},{name:'Knowledge (history)',bonus:9},{name:'Knowledge (religion)',bonus:9},
   {name:'Sense Motive',bonus:20},{name:'Spellcraft',bonus:9},{name:'Survival',bonus:15}
  ],
  weapons:[
   weapon('+2 keen dagger attack 1',10,'1d4+1',{crit_range:'17-20'}),
   weapon('+2 keen dagger attack 2',5,'1d4+1',{crit_range:'17-20'})
  ],
  activeAbilities:[
   ability('Channel Negative Energy','su','6/day, 7d6 negative energy, DC 19.'),
   ability('Destructive Smite','su','7/day; +6 to designated attack damage as allowed by domain feature.'),
   ability('Vision of Madness','sp','7/day, Madness domain, +6/–6.'),
   ability('Aura of Madness','su','30-ft. aura, DC 20, up to 13 rounds/day; consult domain ability rules.')
  ]
 },
 'leng-envoy':{
  stats:{fastHealing:5,sr:29},
  text:{
   sourceReference:'Variant advanced denizen of Leng (Pathfinder Bestiary 2 pp. 82, 292).',
   defenses:'Unusual anatomy; planar fast healing 5; immune poison; cold resistance 30, electricity resistance 30; SR 29.',
   immunities:'Poison.',
   energyResistances:'Cold 30, electricity 30.',
   gear:'+4 speed kukri.',
   attackDetail:'With kukri: +29/+29/+24/+19/+14 (1d4+8, 15–20) plus claw +20 (1d4+2) and bite +20 (1d6+2 plus 1d6 Dex drain). Alternative natural routine: 2 claws +25 (1d4+4) and bite +25 (1d6+4 plus 1d6 Dex drain).',
   hpDetail:'256 (19d10+152); planar fast healing 5.',
   specialAttacks:'Sneak attack +5d6; bite inflicts 1d6 Dexterity drain, subject to hit and applicable immunities.',
   importNotes:'Source checked: printed p. 22 (PDF p. 23). Two separate melee routines, five speed-kukri attack bonuses, damage-draining bite, resistance/SR and fast healing kept distinct.'
  },
  weapons:[
   weapon('+4 speed kukri attack 1',29,'1d4+8',{crit_range:'15-20',desc:'Kukri/secondary natural attack routine.'}),
   weapon('+4 speed kukri speed attack',29,'1d4+8',{crit_range:'15-20',desc:'Extra speed attack (same bonus).'}),
   weapon('+4 speed kukri attack 3',24,'1d4+8',{crit_range:'15-20'}),
   weapon('+4 speed kukri attack 4',19,'1d4+8',{crit_range:'15-20'}),
   weapon('+4 speed kukri attack 5',14,'1d4+8',{crit_range:'15-20'}),
   weapon('Claw with kukri',20,'1d4+2',{desc:'Secondary with kukri attack routine; do not combine with no-kukri alternative.'}),
   weapon('Bite with kukri',20,'1d6+2',{desc:'Secondary with kukri; plus 1d6 Dexterity drain.'}),
   weapon('Claw 1 (natural alternative)',25,'1d4+4',{desc:'Alternative natural routine only.'}),
   weapon('Claw 2 (natural alternative)',25,'1d4+4',{desc:'Alternative natural routine only.'}),
   weapon('Bite (natural alternative)',25,'1d6+4',{desc:'Alternative natural routine only; plus 1d6 Dexterity drain.'})
  ],
  activeAbilities:[
   ability('Planar Fast Healing','su','5 HP per round while qualifying for planar fast healing; consult Pathfinder Bestiary source for restrictions.'),
   ability('Dexterity Drain (Bite)','su','Bite deals 1d6 Dexterity drain in addition to bite damage; resolve immunity and conditions manually.')
  ]
 },
 'doprillu':{
  stats:{regeneration:10},
  text:{
   defenses:'Insightful defense, mask of power; regeneration 10 (suppressed by cold); immune fire.',
   immunities:'Fire.',
   hpDetail:'200 (16d10+112); regeneration 10 (cold).',
   saveDetail:'Fort +12, Ref +20, Will +14; +2 vs. fear.',
   specialAttacks:'Body strike, whirlwind throw; volcanic veins burns creatures grappled at the start of their turn.',
   specialAbilities:'Body strike (Ex): after maintaining a grapple against a Medium or smaller creature, make a +23 melee attack at 10 ft. for 10d6 bludgeoning; the grabbed creature takes half the damage. Whirlwind throw (Ex): full-round action, grapple maintained; +23 melee versus each adjacent creature for 5d6, then +22 ranged throw (10-ft. increment) for 5d6; grabbed creature takes 10d6. Insightful defense (Ex): +4 Wisdom bonus applies as insight to AC and Reflex. Magic fists (Su): fists count as magic for DR. Volcanic veins (Su): creature beginning its turn grappled takes 4d6 fire.',
   importNotes:'Source checked: printed pp. 23–24 (PDF pp. 24–25). Added whirlwind throw omitted by auto-parser, separated grapple-dependent actions, cold-suppressed regeneration, fire immunity and the printed special abilities.'
  },
  weapons:[
   weapon('Fist attack 1',23,'1d8+7',{crit_range:'19-20',desc:'Also deals 1d6 fire; separate damage type.'}),
   weapon('Fist attack 2',18,'1d8+7',{crit_range:'19-20',desc:'Also deals 1d6 fire; separate damage type.'}),
   weapon('Fist attack 3',13,'1d8+7',{crit_range:'19-20',desc:'Also deals 1d6 fire; separate damage type.'}),
   weapon('Fist attack 4',8,'1d8+7',{crit_range:'19-20',desc:'Also deals 1d6 fire; separate damage type.'}),
   weapon('Body Strike (alternative)',23,'10d6+10',{desc:'Requires starting turn grappling a Medium-or-smaller enemy and maintaining hold; grabbed creature also suffers half hit damage; printed attack has separate reach 10 ft.'})
  ],
  activeAbilities:[
   ability('Body Strike','ex','If starting turn grappling Medium-or-smaller creature, maintain grapple then standard action +23 at 10-ft. reach; hit deals 10d6 bludgeoning; grabbed creature takes half that damage.'),
   ability('Whirlwind Throw','ex','Full-round while grappling: +23 vs each adjacent foe for 5d6; throw grappled creature via +22 ranged (10-ft. increment) for 5d6; grabbed creature takes 10d6.'),
   ability('Insightful Defense','ex','Wisdom +4 insight bonus already included in printed AC and Reflex.'),
   ability('Magic Fists','su','Unarmed fist strikes count as magic for DR.'),
   ability('Volcanic Veins','su','A creature that starts its turn grappled takes 4d6 fire.')
  ]
 },
 'enormous-dragonfly':{
  stats:{int:null},
  text:{
   sourceReference:'Variant advanced giant dragonfly (Pathfinder Bestiary 2 pp. 105, 292).',
   creatureType:'vermin',
   senses:'Darkvision 60 ft.; Perception +3.',
   immunities:'Mind-affecting effects.',
   skillDetail:'Fly +9',
   maneuverDetail:'CMB +20 (+24 grapple); CMD 33 (41 vs. trip).',
   movementDetail:'Land 20 ft.; fly 80 ft. (perfect).',
   feats:'Flyby Attack (bonus feat), Improved Natural Attack (bite; bonus feat).',
   specialAttacks:'Darting charge (consult Pathfinder Bestiary 2 for full effect); bite has grab.',
   importNotes:'Source checked: printed p. 24 (PDF p. 25). Intelligence is a printed dash, not 0; Fly +9 and conditional grapple/trip bonuses restored. Darting charge still needs the cited original Bestiary rule.'
  },
  npcSkills:[{name:'Fly',bonus:9}],
  weapons:[weapon('Bite',18,'4d8+16',{desc:'Plus grab; use CMB +24 for grapple attempt.'})],
  activeAbilities:[
   ability('Darting Charge','ex','Special attack inherited from giant dragonfly; consult Pathfinder Bestiary 2 for exact effect.'),
   ability('Grab','ex','Bite +18; the creature has CMB +24 for grapple checks.')
  ]
 }
});
