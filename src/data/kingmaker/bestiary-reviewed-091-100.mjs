// Kingmaker Bestiary (First Edition): reviewed creatures 91-100.
// Source printed pages 57-63; stats copied from printed stat blocks, with concise rules summaries.
const melee=(name,npcAttackBonus,damage,props={})=>({name,attack_type:'melee',npcAttackBonus,damage,...props});
const ranged=(name,npcAttackBonus,damage,props={})=>({name,attack_type:'ranged',npcAttackBonus,damage,...props});
const ability=(name,ability_kind,desc)=>({name,ability_kind,desc});
export const KINGMAKER_BESTIARY_REVIEWED_091_100=Object.freeze({
 'thresholder-hermeticist':{
  text:{
   acDetail:'34, touch 16, flat-footed 28 (+7 armor, +5 Dex, +1 dodge, +7 natural, +4 shield).',
   defenses:'Fortification 25%, freedom of movement.',
   immunities:'Poison (printed defenses).',
   specialAttacks:'Bombs 22/day (9d6+3 fire, DC 21); alternatives include acid, frost, sonic and dispelling bombs.',
   spellsPrepared:'Alchemist extracts prepared (CL 17th; concentration +20): 6th—heal, true seeing; 5th—magic jar (2, DC 18), sending, spell resistance; 4th—cure critical wounds (2), greater darkvision, freedom of movement; 3rd—cure serious wounds (4), displacement, gaseous form; 2nd—barkskin, cure moderate wounds (3), invisibility (2); 1st—cure light wounds (4), expeditious retreat, shield.',
   spellLikeAbilities:null,
   qualities:'Alchemy (crafting +17), discoveries: acid bomb, concussive bomb, dispelling bomb, explosive bomb, fast bombs, frost bomb, precise bombs (3 squares), sticky bomb; mutagen +4/−2, +2 natural armor, duration 17 hours; poison use, swift alchemy, unseen sight.',
   tactics:'Pre-combat: mutagen, freedom of movement, barkskin, shield extracts; printed AC and ability scores include these preparations.',
   skillDetail:'Acrobatics +23, Craft (alchemy) +23 (+40 creating alchemical items), Intimidate +21, Knowledge (dungeoneering) +20, Perception +21, Spellcraft +23, Stealth +23, Survival +21.',
   combatGear:'Mutagen.',
   gear:'+4 light fortification studded leather, +2 dagger, belt of physical might +4 (Dex, Con), formula book.',
   importNotes:'Source-reviewed printed pp. 57–58 (PDF pp. 58–59): complete alchemist extracts, split page skills, clean AC and equipment; five bomb varieties are alternative routines, not simultaneous attacks.'
  },
  activeAbilities:[ability('Unseen Sight','su','Darkvision 60 ft. and true seeing only in a region influenced by Yog-Sothoth.'),ability('Bombs','su','22 bombs per day, +19/+14/+9; fire/acid/cold 9d6+3, concussive 9d4+3 sonic, or dispelling bomb; DC 21 where applicable; options are mutually exclusive.')]
 },
 'thresholder-mystic':{
  text:{
   defenses:'Fortification 50%; guarded mind against mental influence.',
   acDetail:'30, touch 21, flat-footed 24 (+6 armor, +5 deflection, +5 Dex, +1 dodge, +3 natural).',
   spellLikeAbilities:'Domain spell-like abilities (CL 18th; concentration +23): 8/day—touch of darkness (9 rounds).',
   specialAttacks:'Channel negative energy 5/day (9d6, DC 21); part the veil.',
   qualities:'Eyes of darkness (9 rounds/day); unseen sight.',
   tactics:'Pre-combat magic vestment, greater magic weapon, overland flight, shield of faith are reflected in printed AC and attacks.',
   gear:'+1 moderate fortification leather armor, +2 spell storing dagger (charged with blindness/deafness), amulet of natural armor +3, belt of physical might +6 (Dex, Con), cloak of resistance +3, unholy iron symbol of Yog-Sothoth.',
   saveDetail:'Fort +19, Ref +14, Will +21; +2 insight bonus versus mind-affecting effects.',
   importNotes:'Source-reviewed printed pp. 58–59 (PDF pp. 59–60). Restored domain ability separated from prepared cleric spells; printed +4 dagger attack reflects pre-combat greater magic weapon even though owned weapon is +2.'
  },
  activeAbilities:[ability('Unseen Sight','su','Darkvision 60 ft. and true seeing while in a region influenced by Yog-Sothoth.'),ability('Channel Negative Energy','su','5/day, 9d6 negative energy, Will DC 21.'),ability('Touch of Darkness','sp','Domain spell-like ability 8/day; effect duration 9 rounds; see Darkness domain rules.')]
 },
 'brush-thylacine':{
  text:{
   raceClassLevels:null,
   senses:'Low-light vision; Perception +8.',
   attackDetail:'Bite +6 (1d8+4, critical 19–20).',
   specialAbilities:'Hunting Cry (Ex): move action to attempt to demoralize an enemy; +8 bonus to that Intimidate check (effective +9). Powerful Jaws (Ex): bite threatens a critical hit on 19–20.',
   skillDetail:'Intimidate +1 (+9 with hunting cry), Perception +8, Stealth +10.',
   importNotes:'Source-reviewed printed p. 59 (PDF p. 60). Removed unrelated chapter text in race/class; recovered low-light vision and hunting cry action/Intimidate modifier.'
  },
  activeAbilities:[ability('Hunting Cry','ex','Move action to attempt demoralization with Intimidate +9 (+8 bonus over printed +1).'),ability('Powerful Jaws','ex','Bite critical threat range 19–20.')]
 },
 'storm-struck-treant':{
  text:{
   attackDetail:'Two slams +24 (2d6+10 / 19–20 plus 6d6 electricity each); rock +18 (2d6+15), range increment 180 ft.',
   maneuverDetail:'CMB +27 (+31 sunder); CMD 41 (43 versus sunder).',
   defenses:'DR 10/slashing; electrical attacks heal the treant; plant traits.',
   immunities:'Electricity; plant traits.',
   weaknesses:'Fire vulnerability.',
   spellLikeAbilities:'CL 12th; concentration +16: lightning bolt 3/day (DC 17); chain lightning 1/day (DC 20).',
   specialAbilities:'Absorb Electricity (Ex): when affected by electricity originating from a source other than another storm-struck treant, regain 4d6 HP instead of taking the electricity damage.',
   qualities:'Animate trees; double damage against objects; treespeech.',
   importNotes:'Source-reviewed printed pp. 59–60 (PDF pp. 60–61): recovered two distinct slams, electric healing 4d6, CMB/CMD sunder modifiers and alternate ranged rock.'
  },
  weapons:[melee('Slam 1',24,'2d6+10',{desc:'Critical 19–20; plus 6d6 electricity.'}),melee('Slam 2',24,'2d6+10',{desc:'Critical 19–20; plus 6d6 electricity.'}),ranged('Rock',18,'2d6+15',{desc:'Rock throwing, 180-ft. range increment.'})],
  activeAbilities:[ability('Absorb Electricity','ex','Heals 4d6 HP from electricity not caused by a storm-struck treant.'),ability('Trample','ex','2d6+15 bludgeoning, Reflex DC 30; see trample rules.')]
 },
 'troll-guard':{
  stats:{regeneration:5},
  text:{
   acDetail:'29, touch 12, flat-footed 26 (+11 armor, +3 Dex, +5 natural, +1 shield, −1 size).',
   attackDetail:'With axes: main-hand +2 battleaxe +20/+15/+10 (2d6+11, critical 19–20/×3), off-hand +2 battleaxe +20/+15 (same), and bite +14 (1d8+3). Alternatively unarmed natural routine: bite +19 (1d8+6) and two claws +19 (1d6+6 each); rend (two claws) 1d6+8. Do not combine the two routines.',
   specialAttacks:'Rend 1d6+8 only when both claws hit; axe/natural-weapon routines are alternatives. Weapon trainings (axes +2, natural +1).',
   qualities:'Armor training 2; regeneration 5 (acid or fire bypass).',
   gear:'+2 full plate, two +2 battleaxes, 200 gp.',
   importNotes:'Source-reviewed printed pp. 60–61 (PDF pp. 61–62): separated primary/off-hand axe iteratives from natural-weapon alternative; preserved bite within axe routine and acid/fire regeneration.'
  },
  weapons:[
   melee('Axe primary 1',20,'2d6+11',{desc:'Axe routine; critical 19–20/×3.'}),melee('Axe primary 2',15,'2d6+11',{desc:'Axe routine; critical 19–20/×3.'}),melee('Axe primary 3',10,'2d6+11',{desc:'Axe routine; critical 19–20/×3.'}),
   melee('Axe offhand 1',20,'2d6+11',{desc:'Axe routine; critical 19–20/×3.'}),melee('Axe offhand 2',15,'2d6+11',{desc:'Axe routine; critical 19–20/×3.'}),melee('Bite with axes',14,'1d8+3',{desc:'Use only alongside axe routine.'}),
   melee('Bite natural alternative',19,'1d8+6',{desc:'Alternative natural routine; not combined with axes.'}),melee('Claw natural 1',19,'1d6+6',{desc:'Natural alternative; two successful claws trigger rend.'}),melee('Claw natural 2',19,'1d6+6',{desc:'Natural alternative; two successful claws trigger rend.'})
  ],
  activeAbilities:[ability('Rend','ex','1d6+8 if both claws hit using the natural attack routine, not while dual-wielding axes.'),ability('Regeneration','ex','5 HP per round; acid or fire bypasses regeneration.')]
 },
 'troll-king':{
  stats:{regeneration:10},
  text:{
   qualities:'Regeneration 10 (acid or fire).',
   specialAbilities:'Primordial Roar (Ex): move action; non-troll creatures within 100 ft. must succeed on Will DC 16 or be shaken 1 minute. A creature can be shaken by the roar of any troll king only once per 10 minutes. Mind-affecting fear effect.',
   importNotes:'Source-reviewed printed p. 61 (PDF p. 62). Preserved natural attack routine and rend 1d6+10; recovered DC 16, range, duration and immunity window for primordial roar.'
  },
  weapons:[melee('Bite',17,'1d8+10'),melee('Claw 1',17,'1d6+10',{desc:'Critical 19–20; two claws hitting triggers rend.'}),melee('Claw 2',17,'1d6+10',{desc:'Critical 19–20; two claws hitting triggers rend.'})],
  activeAbilities:[ability('Primordial Roar','ex','Move action; 100 ft., non-trolls Will DC 16 or shaken for 1 minute; affects each creature at most once per 10 minutes.'),ability('Rend','ex','1d6+10 on successful strikes from both claws.'),ability('Regeneration','ex','10 HP per round; acid or fire bypasses regeneration.')]
 },
 'vilderavn-herald':{
  text:{
   skillDetail:'Acrobatics +35, Bluff +30, Diplomacy +34, Disguise +30, Fly +20, Intimidate +31, Knowledge (history) +20, Knowledge (local) +15, Knowledge (nobility) +20, Perception +33, Profession (soldier) +15, Sense Motive +25, Stealth +30, Use Magic Device +20.',
   qualities:'Change shape (alter self or beast shape III: Small/Medium humanoid, peryton, wolf or dire wolf); raven knight.',
   attackDetail:'Natural alternative: bite +24 (1d8+11 / 15–20 plus 1d6 bleed), two claws +24 (1d6+11 plus bleed each). Armed alternative: +5 cruel keen greatsword +29/+29/+24/+19 (2d6+21 / 17–20 plus bleed); these are mutually exclusive routines.',
   importNotes:'Source-reviewed printed pp. 61–62 (PDF pp. 62–63): added missing Perception +33 in skills, removed neighboring creature text, restored exact greatsword and natural alternatives; external hex rules still require Bestiary reference.'
  },
  weapons:[melee('Bite natural',24,'1d8+11',{desc:'Natural routine; critical 15–20 plus 1d6 bleed.'}),melee('Claw natural 1',24,'1d6+11',{desc:'Natural routine; plus 1d6 bleed.'}),melee('Claw natural 2',24,'1d6+11',{desc:'Natural routine; plus 1d6 bleed.'}),...([29,29,24,19].map((b,i)=>melee('Greatsword attack '+(i+1),b,'2d6+21',{desc:'Alternative armed routine; critical 17–20 plus 1d6 bleed.'})))],
  activeAbilities:[ability('Shatter Loyalties','su','Aura DC 28; consult full vilderavn rules.'),ability('Bloodbird','su','Special attack; use the vilderavn original rules reference.'),ability('Soul Eater','su','Special attack; use the vilderavn original rules reference.')]
 },
 'overgrown-viper-vine':{
  text:{
   specialAbilities:'Grasping Roots (Ex): immediate action, a creature moving within its lair treats the current square as difficult terrain until the end of its turn; Reflex DC 25 or both entangled for 1 round and knocked prone.',
   maneuverDetail:'CMB +24 (+28 grapple); CMD 40 (cannot be tripped).',
   attackDetail:'Bite +23 (2d6+8, 19–20 critical, plus 3d6 acid); four tentacles +23 (1d6+8 and grab each).',
   importNotes:'Source-reviewed printed p. 62 (PDF p. 63): four separate tentacles, grappling modifiers, grasping roots immediate action and DC 25.'
  },
  weapons:[melee('Bite',23,'2d6+8',{desc:'Critical 19–20, plus 3d6 acid.'}),...Array.from({length:4},(_,i)=>melee('Tentacle '+(i+1),23,'1d6+8',{desc:'Plus grab.'}))],
  activeAbilities:[ability('Grasping Roots','ex','Immediate action against a moving creature in its lair; difficult terrain, Reflex DC 25 or entangled for 1 round and prone.')]
 },
 'wemmuth':{
  text:{
   maneuverDetail:'CMB +26 (+28 bull rush); CMD 41 (43 versus bull rush).',
   attackDetail:'Two slams +23 (3d10+11 / 19–20 plus grab), rock +17 (2d6+11).',
   specialAbilities:'Blood Leech (Su): first constrict damage to a living creature each round heals the wemmuth by the damage dealt, without extra damage to the victim. Thorny Mass (Ex): constriction deals piercing damage; unarmed/natural attacks against the wemmuth or tumbling through its space cause 2d6 piercing, unless Reflex DC 24 succeeds (immunity until end of turn).',
   importNotes:'Source-reviewed printed pp. 62–63 (PDF pp. 63–64): split page ability text, healing from blood leech, thorny mass DC 24, separate two slams and conditional attacks.'
  },
  weapons:[melee('Slam 1',23,'3d10+11',{desc:'19–20, plus grab and constrict 3d10+11 piercing.'}),melee('Slam 2',23,'3d10+11',{desc:'19–20, plus grab and constrict 3d10+11 piercing.'}),ranged('Rock',17,'2d6+11',{desc:'Rock throwing 120-ft. range increment.'})],
  activeAbilities:[ability('Blood Leech','su','First constriction of a living creature per round heals this creature the damage dealt by constriction.'),ability('Thorny Mass','ex','Natural/unarmed strikes against it, or tumbling through its space: 2d6 piercing, Reflex DC 24 prevents for remainder of turn.')]
 },
 'whimwyrm':{
  stats:{reach:5},
  text:{
   feats:'Combat Expertise, Combat Reflexes, Dodge, Improved Critical (bite), Improved Disarm, Improved Initiative, Improved Trip, Multiattack, Weapon Finesse.',
   skillDetail:'Acrobatics +27, Bluff +28, Escape Artist +27, Fly +34, Intimidate +28, Knowledge (nature) +26, Perception +27, Perform (comedy) +25, Sense Motive +27, Stealth +30, Survival +27.',
   languages:'Common, Draconic, Sylvan.',
   attackDetail:'Four bites +27 each (3d6+7/19–20) and one tail slap +25 (1d10+3; 10-ft. tail reach).',
   maneuverDetail:'CMB +25 (+27 disarm, +27 trip); CMD 45 (47 versus disarm, 47 versus trip).',
   specialAbilities:'Fog Vision (Ex): can see normally through fog. Meddling Tail (Ex): once per round as swift action, tail attempts disarm, reposition or trip within 10 ft. Mind-Numbing Breath (Su): 40-ft. cone every 1d4 rounds, outlines creatures as faerie fire, blinds for 1 round and inflicts 20d6 damage; Will DC 27 halves damage, makes it nonlethal and prevents blindness. Whimsical Mind (Ex): +4 saves versus mind-affecting.',
   importNotes:'Source-reviewed printed pp. 63–64 (PDF pp. 64–65): removed chapter/sidebar intrusions from feats and skills; expanded four bites, corrected tail reach, fog vision, swift-action tail and full 20d6 breath with DC 27.'
  },
  npcSkills:[{name:'Acrobatics',bonus:27},{name:'Bluff',bonus:28},{name:'Escape Artist',bonus:27},{name:'Fly',bonus:34},{name:'Intimidate',bonus:28},{name:'Knowledge (nature)',bonus:26},{name:'Perception',bonus:27},{name:'Perform (comedy)',bonus:25},{name:'Sense Motive',bonus:27},{name:'Stealth',bonus:30},{name:'Survival',bonus:27}],
  weapons:[...Array.from({length:4},(_,i)=>melee('Bite '+(i+1),27,'3d6+7',{desc:'Critical 19–20.'})),melee('Tail slap',25,'1d10+3',{desc:'10-ft. reach; special meddling tail action is separate.'})],
  activeAbilities:[ability('Fog Vision','ex','Perfect vision through fog, including magical fog.'),ability('Meddling Tail','ex','Swift action once per round to disarm, reposition or trip an enemy within 10 ft.'),ability('Mind-Numbing Breath','su','40-ft. cone, usable every 1d4 rounds; 20d6 damage, blinds 1 round, faerie-fire outline. Will DC 27 halves and converts to nonlethal, preventing blindness.'),ability('Whimsical Mind','ex','+4 bonus on saving throws versus mind-affecting effects.')]
 }
});