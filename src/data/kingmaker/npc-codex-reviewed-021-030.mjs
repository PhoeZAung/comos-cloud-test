// Pathfinder Kingmaker Bestiary (First Edition), NPC Codex 21–30.
// Manually checked against printed pp. 80–86 (PDF pp. 81–87).
// Game-rule summaries only; leave raw PDF extraction files unchanged.
const melee=(name,npcAttackBonus,damage,desc='')=>({name,attack_type:'melee',npcAttackBonus,damage,...(desc?{desc}:{})});
const ranged=(name,npcAttackBonus,damage,desc='')=>({name,attack_type:'ranged',npcAttackBonus,damage,...(desc?{desc}:{})});
const ability=(name,ability_kind,desc)=>({name,ability_kind,desc});
export const KINGMAKER_NPC_CODEX_REVIEWED_021_030=Object.freeze({
 'davik-nettles':{
  stats:{str:19,con:null,fastHealing:5},
  text:{
   acDetail:'17, touch 11, flat-footed 16 (+1 Dex, +6 natural).',
   hpDetail:'42 (5d8+20); fast healing 5.',
   saveDetail:'Fort +5, Ref +2, Will +6.',
   aura:'Stench 30 ft. (DC 16; printed duration unspecified).',
   defenses:'Rejuvenation; fast healing 5; immune to fire and undead traits.',
   immunities:'Fire and undead traits.',
   attackDetail:'Alternative attacks: +1 ranseur +8 (2d4+7/×3) with 10-ft. reach, OR slam +7 (1d6+4) at 5-ft. reach.',
   movementDetail:'Speed 30 ft., swim 30 ft.; constant water walk.',
   spellLikeAbilities:'CL 5th; concentration +9: constant—water walk; 1/day—nightmare (DC 19).',
   specialAttacks:'Fear gaze (Will DC 18).',
   specialAbilities:'Fear gaze: 30-ft. range, Will DC 18 or shaken 1 round (does not stack with itself). Ranseur: weapon dissolves if dropped/disarmed; can be recovered from water as a move-equivalent action provoking attacks of opportunity. Rejuvenation: at 0 HP dissolves and reforms the next night fully healed, until the plot condition resolving the Stag Lord’s remains is met; nightmare can threaten a destroyer, and dispel magic can temporarily sever that link.',
   importNotes:'Source-reviewed printed pp. 80–81 (PDF pp. 81–82). Recovered undead Constitution dash, fast healing and separate weapon routines, concise fear gaze/rejuvenation rules; stench duration is not specified in print.'
  },
  weapons:[melee('+1 ranseur',8,'2d4+7','Alternative attack, 10-ft. reach, critical ×3.'),melee('Slam',7,'1d6+4','Alternative natural attack, 5-ft. reach.')],
  activeAbilities:[ability('Fear Gaze','su','30 ft., Will DC 18 or shaken 1 round; nonstacking.'),ability('Rejuvenation','su','Reforms the next night at full HP after reaching 0 until special story condition is resolved.'),ability('Water-Bound Ranseur','su','Dropped +1 ranseur becomes water and can be retrieved from water as a provoking move-equivalent action.')]
 },
 'dingetooth-and-uurch':{
  stats:{str:12},
  text:{
   raceClassLevels:'Mite fighter 3 (Pathfinder Bestiary, p. 207); same block applies to both NPCs.',
   acDetail:'14, touch 14, flat-footed 11 (+3 Dex, +1 size).',
   hpDetail:'18 (4 HD; 1d6+3d10−1) each.',
   saveDetail:'Fort +4, Ref +6, Will +5 (+1 vs. fear).',
   defenses:'DR 2/cold iron.',
   weaknesses:'Light sensitivity.',
   attackDetail:'Short sword +8 (1d4+1/19–20). Marble launcher is a standard-action special ability, not a weapon attack roll.',
   specialAttacks:'Hatred, launch marbles (Reflex DC 13).',
   spellLikeAbilities:'CL 1st; concentration +1: prestidigitation at will; doom (DC 11) 1/day.',
   qualities:'Armor training 1; vermin empathy.',
   specialAbilities:'Launch marbles (Ex): standard action, fire all six marbles at one target within 15 ft.; Reflex DC 13 or take 1d6 bludgeoning damage and fall prone. No attack roll.',
   importNotes:'Source-reviewed printed pp. 80–81 (PDF pp. 81–82). Corrected race/class overwritten by column spill, clean spell-like abilities, special launcher without fictitious attack roll, and shared two-NPC stat block.'
  },
  activeAbilities:[ability('Launch Marbles','ex','Standard action; one target within 15 ft., Reflex DC 13 or 1d6 bludgeoning and knocked prone; all six marbles used.'),ability('Hatred','ex','Use mite creature rules for listed hatred ability.')]
 },
 'dovan':{
  stats:{str:14},
  text:{
   acDetail:'17, touch 14, flat-footed 13 (+3 armor, +3 Dex, +1 dodge).',
   hpDetail:'23 (3d8+6).',
   saveDetail:'Fort +2, Ref +6, Will +0.',
   attackDetail:'+1 rapier +6 (1d6+3, crit 18–20), or thrown dagger +5 (1d4+2, crit 19–20).',
   specialAttacks:'Sneak attack +2d6.',
   feats:'Combat Reflexes, Dodge, Mobility, Weapon Finesse.',
   skillDetail:'Acrobatics +9, Bluff +7, Diplomacy +7, Escape Artist +9, Intimidate +7, Knowledge (local) +6, Perception +5, Sleight of Hand +9, Stealth +9.',
   qualities:'Rogue talent (finesse rogue); trapfinding +1.',
   gear:'Masterwork studded leather, +1 rapier, dagger, Stag Lord amulet (20 gp), two turquoise earrings (130 gp each), 2 pp, 28 gp.',
   importNotes:'Source-reviewed printed p. 81 (PDF p. 82). Recovered complete skills from right column, removed Hazards/Index headings from skills and gear, and restored alternate thrown dagger.'
  },
  npcSkills:[{name:'Acrobatics',bonus:9},{name:'Bluff',bonus:7},{name:'Diplomacy',bonus:7},{name:'Escape Artist',bonus:9},{name:'Intimidate',bonus:7},{name:'Knowledge (local)',bonus:6},{name:'Perception',bonus:5},{name:'Sleight of Hand',bonus:9},{name:'Stealth',bonus:9}],
  activeAbilities:[ability('Sneak Attack','ex','+2d6 when target is vulnerable to precision damage.')]
 },
 'elga-verniex':{
  stats:{str:5},
  text:{
   raceClassLevels:'Old human sorcerer 7.',
   acDetail:'13, touch 9, flat-footed 13 (+4 armor, −1 Dex).',
   hpDetail:'46 (7d6+19).',
   saveDetail:'Fort +3, Ref +4, Will +9.',
   attackDetail:'+1 spell storing quarterstaff +1 (1d6−2), spell storing currently contains touch of idiocy.',
   spellLikeAbilities:'Fey bloodline (CL 7th; concentration +12): laughing touch 8/day.',
   spellsKnown:'Sorcerer (CL 7th; concentration +12): 3rd (5/day)—beast shape I, deep slumber (DC 20), slow (DC 18); 2nd (7/day)—false life, hideous laughter (DC 19), scare (DC 17), touch of idiocy; 1st (8/day)—charm person (DC 16), entangle (DC 16), mage armor, obscuring mist, ray of enfeeblement (DC 16), shield; 0—acid splash, detect magic, detect poison, light, mending, read magic, touch of fatigue (DC 15).',
   tactics:'Before combat casts false life and mage armor. The +4 armor in printed AC comes from mage armor; any temporary HP from false life is tracked separately.',
   qualities:'Fey bloodline arcana (+2 DC for compulsion spells); woodland stride.',
   combatGear:'Wand of burning hands (CL 5th; 10 charges).',
   gear:'+1 spell storing quarterstaff (contains touch of idiocy), cloak of resistance +1, hand of the mage.',
   importNotes:'Source-reviewed printed p. 82 (PDF p. 83). Split bloodline power from sorcerer spells and removed spell names from her staff attack. Preserved pre-combat spell effects.'
  },
  activeAbilities:[ability('Laughing Touch','sp','Fey bloodline power 8/day.'),ability('Precast Spells','sp','False life and mage armor are cast before the encounter.')]
 },
 'engelidis':{
  stats:{str:22},
  text:{
   raceClassLevels:'Female spirit naga sorcerer 7 (Pathfinder Bestiary, p. 213).',
   acDetail:'27, touch 14, flat-footed 22 (+4 armor, +4 Dex, +1 dodge, +9 natural, −1 size).',
   hpDetail:'195 (17 HD; 7d6+10d8+126).',
   saveDetail:'Fort +12, Ref +11, Will +17; +4 morale bonus vs. death effects.',
   attackDetail:'Bite +16 (2d6+10, crit 19–20); spirit naga poison also applies as described by the base creature.',
   immunities:'Energy drain and negative energy.',
   specialAttacks:'Poison; charming gaze (creature ability).',
   spellLikeAbilities:'Fey bloodline (CL 14th; concentration +20): laughing touch 9/day.',
   spellsKnown:'Sorcerer (CL 14th; concentration +20): 7th (3/day)—finger of death (DC 23); 6th (6/day)—chain lightning (DC 22), mass suggestion (DC 24); 5th (7/day)—breath of life (DC 21), hold monster (DC 23), telekinesis (DC 21); 4th (7/day)—cure critical wounds, death ward, dimension door, ice storm; 3rd (7/day)—clairaudience/clairvoyance, deep slumber (DC 21), dispel magic, fly, lightning bolt (DC 19); 2nd (8/day)—alter self, cure moderate wounds, hideous laughter (DC 20), invisibility, misdirection, silence (DC 18); 1st (8/day)—entangle (DC 17), mage armor, ray of enfeeblement (DC 17), shield, shield of faith, shocking grasp; 0—arcane mark, create water, dancing lights, detect magic, ghost sound (DC 16), mage hand, message, open/close (DC 16), stabilize.',
   tactics:'Before combat casts mage armor, death ward and fly.',
   feats:'Ability Focus (charming gaze), Arcane Strike, Combat Casting, Dodge, Eschew Materials (bonus), Extend Spell, Improved Critical (bite), Lightning Reflexes, Quicken Spell, Skill Focus (Perception), Stealthy.',
   gear:'+1 spell storing amulet of mighty fists.',
   importNotes:'Source-reviewed printed pp. 82–83 (PDF pp. 83–84). Separated Fey spell-like power from sorcerer slots and recovered complete feats, gear and 7th-level spell across page break.'
  },
  activeAbilities:[ability('Laughing Touch','sp','Fey bloodline power 9/day.'),ability('Charming Gaze','su','Listed as spirit naga special quality; refer to base creature rules for activation/save.'),ability('Poison Bite','ex','Listed as spirit naga poison; use base creature rules for exact poison DC/duration.')]
 },
 'eobald':{
  stats:{str:8},
  hpCurrent:1,
  text:{
   acDetail:'10, touch 10, flat-footed 10.',
   hpDetail:'Maximum/current stat block lists 11 HP, currently only 1 HP (6d6−12), with 8 points of Constitution damage.',
   saveDetail:'Fort +0, Ref +4, Will +6.',
   specialAttacks:'Hand of the apprentice 6/day.',
   weaknesses:'Badly wounded: 8 points of Constitution damage, current HP 1, arcane bond and spellbook missing.',
   spellsPrepared:'Wizard (CL 6th; concentration +9), currently remaining: 3rd—secret page; 0—light, mage hand, prestidigitation, read magic. Almost all other spells already cast.',
   qualities:'Arcane bond was a ring of protection +1 but is now lost; spellbook unavailable.',
   specialAbilities:'Badly Wounded: 8 Constitution damage (printed Constitution 14 before damage), 1 current HP. Lost all possessions apart from robes, plus bond and spellbook. Prepared list represents only spells remaining.',
   gear:'Ragged robes only; lost ring of protection +1 and spellbook are not currently equipped.',
   importNotes:'Source-reviewed printed pp. 83–84 (PDF pp. 84–85). Preserved vital distinction between 11 nominal HP and 1 current HP, Constitution damage, and missing equipment; requires hpCurrent support in local catalog integration.'
  },
  activeAbilities:[ability('Hand of the Apprentice','su','6/day; presently no bonded item in possession.'),ability('Badly Wounded','other','Current HP 1 (not 11); 8 Con damage. Arcane ring and spellbook are gone.')]
 },
 'evindra':{
  stats:{str:11},
  text:{
   raceClassLevels:'Variant female nereid (Pathfinder Bestiary 2, p. 198).',
   aura:'Beguiling aura (DC 25).',
   acDetail:'26, touch 26, flat-footed 16 (+6 deflection, +9 Dex, +1 dodge).',
   hpDetail:'157 (15d6+105).',
   saveDetail:'Fort +14, Ref +18, Will +15.',
   defenses:'Transparency; DR 10/cold iron; SR 21.',
   immunities:'Cold and poison.',
   weaknesses:'Shawl (base nereid special weakness; consult base creature).',
   specialAttacks:'Drowning kiss; poison (refer to base nereid rules).',
   spellLikeAbilities:'CL 12th; concentration +18: at will—control water, suggestion (DC 19 only against creatures affected by beguiling aura); 3/day—restoration; 1/day—heal, summon monster VI (water elementals only).',
   qualities:'Change shape (medium water elemental via elemental body II); unearthly grace.',
   importNotes:'Source-reviewed printed pp. 83–84 (PDF pp. 84–85). Cleared neighboring Engelidis/Fredero heading from aura and qualities; separated nereid spell uses and base creature-reference abilities.'
  },
  activeAbilities:[ability('Beguiling Aura','su','Save DC 25 as printed; refer to base nereid rules for range and full effect.'),ability('Drowning Kiss','su','Special attack from base nereid creature; use linked creature rules for full damage/conditions.'),ability('Change Shape','su','Medium water elemental form via elemental body II.')]
 },
 'fredero-sinnet':{
  stats:{str:14},
  text:{
   raceClassLevels:'Human ex-paladin 10.',
   acDetail:'25, touch 11, flat-footed 24 (+10 armor, +1 Dex, +4 shield).',
   hpDetail:'109 (10d10+50).',
   saveDetail:'Fort +11, Ref +4, Will +9.',
   movementDetail:'Speed 30 ft. base; 20 ft. in armor.',
   attackDetail:'Melee +1 thundering longsword +14/+9 (1d8+3, crit 19–20); or ranged mwk composite shortbow +12/+7 (1d6+2, crit ×3).',
   immunities:'Charm, disease, fear.',
   gear:'+1 full plate, +1 heavy steel shield, +1 thundering longsword, mwk composite shortbow (+2 Str) with 20 arrows, 90 gp.',
   importNotes:'Source-reviewed printed p. 84 (PDF p. 85). Removed following Fionn narrative from gear; recovered armor-reduced speed, complete weapon options and 90 gp.'
  }
 },
 'fionn':{
  stats:{str:null,con:null},
  text:{
   sourceReference:'Variant fey frost giant ghost (Pathfinder Bestiary pp. 144, 149; Bestiary 3 p. 116).',
   raceClassLevels:'Variant fey frost giant ghost (Pathfinder Bestiary pp. 144, 149; Bestiary 3 p. 116).',
   creatureType:'undead',
   subtypes:'augmented humanoid, cold, giant, incorporeal',
   senses:'Darkvision 60 ft., low-light vision.',
   acDetail:'26, touch 22, flat-footed 22 (+4 armor, +6 deflection, +3 Dex, +1 dodge, +3 profane, −1 size).',
   hpDetail:'161 (14d8+98).',
   saveDetail:'Fort +15, Ref +12, Will +9 (+4 vs. mind-affecting effects).',
   defenses:'Channel resistance +4, incorporeal, rejuvenation; DR 10/cold iron; resistance electricity 10.',
   immunities:'Cold and undead traits.',
   weaknesses:'Bound to the mortal night; vulnerability to fire.',
   attackDetail:'Ghostly battleaxe +12: 13d6 incorporeal damaging touch plus 2d6 cold; Fort DC 23 halves 13d6 damage only, not cold.',
   specialAttacks:'Exile’s curse, fearsome blizzard (8d8 cold, DC 23).',
   spellLikeAbilities:'CL 14th; concentration +20: constant—mage armor; at will—bestow curse (DC 20), command undead (DC 18); 1/day—cone of cold (DC 21), confusion (DC 20), dispel magic, slow (DC 19), speak with dead (DC 19), wall of ice (DC 20).',
   specialAbilities:'Bound to Mortal Night: can wander at night, but by day remains within 30 ft. of position at sunrise; attempted interplanar travel instead stuns him 1 round. Exile’s Curse: swift action changes bestow curse to 30-ft. ranged touch and imposes additional −2 to highest of Int/Wis/Cha (unless redundant). Fearsome Blizzard: standard action once/1d4 rounds, 60-ft. burst around Fionn deals 8d8 cold (Ref DC 23 half); damage triggers Will DC 23 or frightened 1 round, then shaken 1d4 rounds. Ghostly Battleaxe: 13d6 plus 2d6 cold, Fort DC 23 halves only the 13d6. Profane insight: profane AC and Reflex bonus equal to Wisdom modifier.',
   languages:'Aklo, Common, Giant, Sylvan.',
   importNotes:'Source-reviewed printed pp. 84–85 (PDF pp. 85–86). Restored full creature type, undead Str/Con dashes, ghostly battleaxe cold damage and saves, fearsome blizzard DC/duration and nightbound movement limits.'
  },
  weapons:[melee('Ghostly battleaxe',12,'13d6','Plus 2d6 cold (not halved); Fort DC 23 halves 13d6 damage.')],
  activeAbilities:[ability('Fearsome Blizzard','su','Once every 1d4 rounds; 60 ft., 8d8 cold, Reflex DC 23 half; damaged victims Will DC 23 or frightened 1 round then shaken 1d4 rounds.'),ability('Exile’s Curse','su','Swift action extends bestow curse to 30-ft. ranged touch; additional −2 highest mental ability score when applicable.'),ability('Bound to the Mortal Night','su','Can roam at night; during day stays within 30 ft. of sunrise location; planar transportation stuns for 1 round instead.'),ability('Ghostly Battleaxe','su','+12 touch, 13d6 incorporeal damage and 2d6 cold; Fort DC 23 halves only 13d6.'),ability('Profane Insight','ex','Wisdom modifier as profane bonus to AC and Reflex.')]
 },
 'the-first-faithful':{
  stats:{str:18},
  text:{
   sourceReference:'Male half-fiend human cleric of Yhidothrus 11 (Pathfinder Bestiary, p. 171).',
   raceClassLevels:'Male half-fiend human cleric of Yhidothrus 11 (Pathfinder Bestiary, p. 171).',
   aura:'Ward against death, 30 ft., 11 rounds/day.',
   acDetail:'16, touch 11, flat-footed 15 (+2 armor, +1 Dex, +3 natural).',
   hpDetail:'119 (11d8+66).',
   saveDetail:'Fort +12, Ref +5, Will +15.',
   defenses:'DR 5/magic; SR 24; acid/cold/electricity/fire resistance 10.',
   immunities:'Poison.',
   energyResistances:'Acid 10, cold 10, electricity 10, fire 10.',
   attackDetail:'EITHER +2 spell storing quarterstaff +14/+9 (1d6+8) with secondary bite +12 (1d6+4), OR bite +12 (1d6+4) plus two claws +12 (1d4+4 each).',
   specialAttacks:'Channel negative energy 5/day (DC 17; 6d6); chaos blade (5 rounds, 1/day); smite good; refocus curse; release the inmost worms.',
   spellLikeAbilities:'Half-fiend (CL 11th; concentration +13): darkness and poison (DC 16) 3/day; blasphemy (DC 19), contagion (DC 15), desecrate, unholy blight (DC 16) 1/day. Domains (CL 11th; concentration +18): gentle rest and touch of chaos 10/day.',
   spellsPrepared:'Cleric (CL 11th; concentration +18), domains Chaos/Repose: 6th—animate objects [domain], harm (DC 23), quickened hold person (DC 19); 5th—breath of life ×2 (DC 22), quickened shield of faith, slay living [domain] (DC 22); 4th—air walk, chaos hammer [domain] (DC 21), cure critical wounds, greater magic weapon, tongues; 3rd—bestow curse (DC 20), blindness/deafness (DC 20), create food and water, cure serious wounds, dispel magic, magic vestment, speak with dead [domain] (DC 20); 2nd—align weapon (chaos only) [domain], cure moderate wounds ×3, darkness, silence (DC 19), spiritual weapon; 1st—command (DC 18), cure light wounds ×4, protection from law [domain], sanctuary (DC 18); 0—bleed (DC 17), create water, guidance, light.',
   tactics:'Before combat casts greater magic weapon on staff and magic vestment on vestments; printed +2 staff attack accounts for buffs.',
   combatGear:'Potion of displacement.',
   gear:'+1 spell storing quarterstaff (contains bestow curse), amulet of natural armor +2, belt of physical might +2 (Str/Con), cloak of resistance +1, headband of inspired wisdom +4, cleric’s vestments, 14 pp, 5 gp.',
   specialAbilities:'Refocus Curse: once only as a move action, selects a PC within 60 ft.; ends existing countdown and forces target Will DC 22 vs. curse. Release the Inmost Worms (Su): standard action every 1d4 rounds; targets up to two separate creatures within 30 ft.; Fort DC 19 each. Success 4d6 damage; failure 10d6 damage plus 1-round stun. This is continuous damage for spellcasting.',
   importNotes:'Source-reviewed printed pp. 85–86 (PDF pp. 86–87). Recovered the two worm targets and save outcomes, split all three attack-routine types, separated domain/half-fiend spells from cleric slots and cleaned sidebar fragments.'
  },
  weapons:[melee('Staff +14',14,'1d6+8','First iterative; may combine secondary bite; excludes claw routine.'),melee('Staff +9',9,'1d6+8','Second iterative; may combine secondary bite; excludes claw routine.'),melee('Secondary bite +12',12,'1d6+4','Only with staff routine.'),melee('Natural bite +12',12,'1d6+4','Alternative natural routine, plus two claws.'),melee('Natural claw 1',12,'1d4+4','Alternative natural routine.'),melee('Natural claw 2',12,'1d4+4','Alternative natural routine.')],
  activeAbilities:[ability('Release the Inmost Worms','su','Standard action once every 1d4 rounds, up to two different targets within 30 ft.; Fort DC 19: success 4d6 damage; failure 10d6 damage and stunned 1 round.'),ability('Refocus Curse','su','Once only, move action, one PC within 60 ft.; ends countdown and forces Will DC 22 vs. curse.'),ability('Channel Negative Energy','su','5/day, 6d6, DC 17.'),ability('Ward Against Death','su','30-ft. aura, 11 rounds/day.')]
 }
});