// Kingmaker Bestiary (First Edition): PDF-checked creatures 71–80.
// Book pp. 46–51; PDF pp. 47–52. Unmodified raw extraction retained upstream.
// Derived combat summaries; consult the referenced Bestiary for full rules.
const melee=(name,npcAttackBonus,damage,props={})=>({name,attack_type:'melee',npcAttackBonus,damage,...props});
const ranged=(name,npcAttackBonus,damage,props={})=>({name,attack_type:'ranged',npcAttackBonus,damage,...props});
const ability=(name,ability_kind,desc)=>({name,ability_kind,desc});
export const KINGMAKER_BESTIARY_REVIEWED_071_080=Object.freeze({
 'bog-mummy-cultist':{
  stats:{con:null},
  text:{
   sourceReference:'Swamp mummy cleric of Urgathoa 7 (Pathfinder Bestiary 5 p. 178).',
   defenses:'DR 5/—; undead traits; resistance 10 to negative and positive energy.',
   immunities:'Undead traits.',
   energyResistances:'Negative energy 10, positive energy 10.',
   specialAttacks:'Channel negative energy 5/day (4d6, DC 15); two bog-rot slams.',
   spellLikeAbilities:'Death and Evil domain powers (CL 7th, concentration +12): 8/day bleeding touch (3 rounds), touch of evil (3 rounds).',
   spellsPrepared:'Cleric CL 7th, concentration +12: 4th—air walk, poison (DC 20), unholy blight (domain, DC 19); 3rd—bestow curse (DC 19), contagion (DC 19), dispel magic, magic circle against good (domain); 2nd—death knell (domain, DC 18), ghoul touch (DC 18), hold person (DC 17), resist energy, silence (DC 17); 1st—cause fear (domain, DC 17), command (2, DC 16), divine favor, doom (DC 17), obscuring mist, sanctuary (DC 16); 0—bleed (DC 16), detect magic, guidance, resistance.',
   gear:'+2 leather armor.',
   importNotes:'Source-reviewed printed p. 46 (PDF p. 47): restored the complete cleric spell list, separate domain powers, gear and energy resistance. Constitution is absent for undead; bog rot requires external Bestiary rules.'
  },
  weapons:[melee('Slam 1',17,'1d8+7',{desc:'Plus bog rot; use swamp mummy source.'}),melee('Slam 2',17,'1d8+7',{desc:'Plus bog rot; use swamp mummy source.'})],
  activeAbilities:[ability('Channel Negative Energy','su','5/day, 4d6 negative energy, DC 15.'),ability('Bog Rot','su','Both slams transmit bog rot, using swamp mummy rules from Bestiary 5.')]
 },
 'monster-hunter':{
  text:{
   defenses:'Improved uncanny dodge, trap sense +2; DR 1/—.',
   specialAttacks:'Rage 18 rounds/day; guarded stance +2, powerful blow +2, swift foot +5 ft.',
   movementDetail:'Land 40 ft. (30 ft. in armor).',
   combatGear:'Potions of cure moderate wounds (2).',
   gear:'Masterwork hide armor, +1 composite longbow (+4 Str) with 20 arrows, +1 greataxe.',
   importNotes:'Source-reviewed printed p. 46 (PDF p. 47): recovered clipped equipment and potion split; strength, rage duration, armored speed and existing two iterative routines checked.'
  }
 },
 'tiger-lord':{
  text:{
   specialAttacks:'Rage 22 rounds/day, clear mind, increased damage reduction +1, powerful blow +3, surprise accuracy +3.',
   tactics:'Printed stat block already includes rage adjustments (AC, HP, Strength, Constitution and attack damage). Do not apply rage twice.',
   combatGear:'Potions of cure serious wounds (3).',
   gear:'+2 hide armor, +1 heavy wooden shield, +1 battleaxe, throwing axes (6).',
   movementDetail:'Land 40 ft. (30 ft. in armor).',
   saveDetail:'Fort +10, Ref +7, Will +8.',
   importNotes:'Source-reviewed printed pp. 46–47 (PDF pp. 47–48). Restored clean gear, rage-already-applied warning and continuation of offense/saves.'
  },
  activeAbilities:[ability('Rage','ex','22 rounds/day, already applied to printed stats; do not apply again.')]
 },
 'defaced-naiad-queen':{
  text:{
   sourceReference:'Advanced broken soul nymph (Pathfinder Bestiary pp. 217, 288; Bestiary 4 p. 24).',
   raceClassLevels:'Advanced broken soul nymph.',
   defenses:'DR 10/cold iron and 5/—; acid, cold, electricity, fire and sonic resistance 5.',
   drBypass:'Cold iron (10); unbypassable (5).',
   energyResistances:'Acid 5, cold 5, electricity 5, fire 5, sonic 5.',
   weaknesses:'Shame versus nature-aligned divinity, druids and fey.',
   attackDetail:'Torturous touch +13 (2d6 plus 1d6 Dexterity damage and convulsions).',
   specialAttacks:'Agonized wail DC 24; baleful gaze DC 24; stunning glance.',
   spellLikeAbilities:'CL 8th, concentration +6: 1/day dimension door.',
   spellsPrepared:'Druid CL 7th, concentration +4: 4th—air walk, flame strike (DC 21); 3rd—call lightning (DC 20), poison (2, DC 20), spike growth (DC 20); 2nd—barkskin, flame blade, resist energy (2), tree shape; 1st—charm animal (DC 18), endure elements, entangle (DC 18), obscuring mist, produce flame (2); 0—detect magic, guidance, light, stabilize.',
   hpDetail:'214 (13d6+169).',
   saveDetail:'Fort +26, Ref +23, Will +23.',
   specialAbilities:'Shame (Ex): –2 to attack rolls and special-ability save DCs against druids, fey, and followers or divine spellcasters of nature-linked faiths. A successful DC 30 Diplomacy check can extend the penalty to all opponents for 1 round and require Will DC 28; on failure she fades to the First World and the forgiver gains +3 to Knowledge checks and fear saves for 24 hours.',
   importNotes:'Source-reviewed printed pp. 47–48 (PDF pp. 48–49). Corrected druid prepared spells vs single spell-like dimension door, five energy resistances, DR tiers, shame and page bleed.'
  },
  weapons:[melee('Torturous touch',13,'2d6',{desc:'Plus 1d6 Dex damage and convulsions; source-based effect.'})],
  activeAbilities:[ability('Shame','ex','Against specified nature-aligned opponents: –2 attack rolls and ability DCs; DC 30 Diplomacy may force Will DC 28 with special release outcome.')]
 },
 'fen-pudding':{
  stats:{int:null,cmb:22,cmd:27},
  text:{
   sourceReference:'Variant black pudding (Pathfinder Bestiary p. 35).',
   defenses:'Split on slashing or piercing attack dealing at least 10 damage; ooze traits.',
   immunities:'Ooze traits.',
   qualities:'Suction.',
   specialAttacks:'Constrict 2d6+13 plus 2d6 acid; corrosion, grab.',
   maneuverDetail:'CMB +22 (+26 grapple); CMD 27 (cannot be tripped).',
   movementDetail:'Land 20 ft.; climb 20 ft.',
   importNotes:'Source-reviewed printed p. 48 (PDF p. 49). Cleaned adjacent verdurous ooze prose, restored conditional grapple/no-trip and missing Intelligence.'
  },
  weapons:[melee('Slam',18,'2d6+13',{desc:'Plus 2d6 acid and grab; constrict 2d6+13 and 2d6 acid on applicable grapple.'})]
 },
 'verdurous-ooze':{
  stats:{int:null},
  text:{
   immunities:'Acid, fire, mind-affecting effects, ooze traits, slashing and piercing damage.',
   defenses:'Split: slashing/piercing damage 10+ creates two half-HP oozes instead of damage; cannot split at 15 HP or less.',
   aura:'Enliven 15 ft. (Ref DC 20), sleep aura 30 ft. (Will DC 20).',
   maneuverDetail:'CMB +9 (+13 grapple); CMD 14 (cannot be tripped).',
   specialAttacks:'Slam 1d6+4 plus 1d6 acid and grab; constrict same damage; enliven.',
   specialAbilities:'Acid (Ex): corrodes metal armor hit by acid and weapons striking the ooze (item Reflex DC 20); ongoing contact damages metal. Enliven (Su): after ooze acts, plants within 15 ft. ensnare non-oozes (Reflex DC 20) until end of its next turn, renewed by further activity. Sleep Aura (Su): living non-plants within 30 ft. make Will DC 20 or sleep for 9 rounds; once saved or exposed, immune to the same aura for 24 hours. Split (Ex): slashing/piercing hit of 10+ instead divides into two half-current-HP oozes; ineffective at 15 HP or less.',
   importNotes:'Source-reviewed printed p. 49 (PDF p. 50). Restored sleep aura, both DC 20 checks, split thresholds, missing Intelligence and grapple modifier.'
  },
  activeAbilities:[
   ability('Acid','ex','Metal equipment effects; item Reflex DC 20 against corrosion. Consult the full source rule for hardness and repeated exposure.'),
   ability('Enliven','su','15-ft. plant aura, Reflex DC 20 or entangled; activates on action, expires after next turn unless renewed.'),
   ability('Sleep Aura','su','30-ft. aura, living non-plants Will DC 20 or asleep 9 rounds; 24-hour immunity to this ooze on exposure.'),
   ability('Split','ex','No slash/pierce damage: hit of 10+ splits into two oozes at half current HP each; not at 15 or less HP.')
  ]
 },
 'winged-owlbear':{
  text:{
   languages:'Sylvan (understands, cannot speak).',
   movementDetail:'Land 30 ft.; fly 50 ft. (average).',
   maneuverDetail:'CMB +38 (+42 grapple); CMD 52 (56 vs. trip).',
   attackDetail:'Bite +30 (2d6+15), two claws +30 (3d6+15, critical 19–20, plus grab).',
   importNotes:'Source-reviewed printed pp. 49–50 (PDF pp. 50–51). Removed adjoining creature prose and split both claw attacks; recorded conditional maneuver bonuses.'
  },
  weapons:[melee('Bite',30,'2d6+15'),melee('Claw 1',30,'3d6+15',{crit_range:'19-20',desc:'Plus grab.'}),melee('Claw 2',30,'3d6+15',{crit_range:'19-20',desc:'Plus grab.'})]
 },
 'quelaunt':{
  text:{
   specialAttacks:'Feed on emotion, spiral of despair; three primary claw attacks.',
   specialAbilities:'Feed on Emotion (Su): move action once per round against a creature within 30 ft. affected by harmful emotion; Will DC 28 or take 4d10 damage and stunned 1 round, healing the quelaunt for damage dealt. Spiral of Despair (Su): once per round as a swift action after an enemy fails a save against its emotion spell-like ability, end one beneficial emotion effect on that enemy.',
   importNotes:'Source-reviewed printed p. 50 (PDF p. 51). Split three claws and record trigger/action/DC for feed on emotion and spiral of despair.'
  },
  weapons:[...Array.from({length:3},(_,i)=>melee('Claw '+(i+1),24,'3d6+9',{crit_range:'19-20'}))],
  activeAbilities:[ability('Feed on Emotion','su','Once per round move action, affected enemy within 30 ft.: Will DC 28 or 4d10 damage and stunned 1 round; heals equal damage.'),ability('Spiral of Despair','su','Once/round swift action after failed save versus emotion spell-like ability; removes one helpful emotion effect.')]
 },
 'radiant-warden':{
  stats:{con:null},
  text:{
   defenses:'DR 15/adamantine; construct traits, immune mind-affecting effects; cold, electricity, fire and sonic resistance 15.',
   drBypass:'Adamantine.',
   immunities:'Construct traits, mind-affecting effects.',
   energyResistances:'Cold 15, electricity 15, fire 15, sonic 15.',
   feats:'Blinding Critical, Critical Focus, Deadly Aim, Dodge, Great Fortitude, Improved Critical (slam), Improved Critical (radiant beam), Improved Initiative, Mobility, Point-Blank Shot, Power Attack, Precise Shot, Shot on the Run.',
   movementDetail:'Land 30 ft.; fly 30 ft. (good).',
   maneuverDetail:'CMB +39; CMD 56 (64 vs. trip).',
   specialAttacks:'Four slams, radiant beam (ranged primary force attack), radiant blast (50-ft. cone).',
   specialAbilities:'Gatekeeper Aura (Su): teleporter within 60 ft. Will DC 23; on failure redirected to warden-chosen point and sickened 1d4 rounds; on success reaches chosen destination but sickened 1 round. Radiant Beam (Su): ranged force attack, 15-ft. range increment. Radiant Blast (Su): 50-ft. cone, 10d12 force, Reflex DC 23 half; recharge 1d4 rounds. Radiant Blow (Su): slam triggers Will DC 23 or cannot teleport for 1 minute; if critical hit, also permanently blinded on failed save. Orrery (Ex): move action to assume orrery form; may take 20 on Stealth to hide in plain sight.',
   importNotes:'Source-reviewed printed pp. 50–51 (PDF pp. 51–52). Reconstructed cross-page feats and separated four slams, beam and area blast. Construct Constitution absent; conditional trip defense included.'
  },
  weapons:[...Array.from({length:4},(_,i)=>melee('Slam '+(i+1),31,'2d8+9',{crit_range:'19-20',desc:'Radiant blow; Will DC 23 vs teleport lock.'})),ranged('Radiant beam',28,'4d10',{crit_range:'19-20',desc:'Force, primary ranged attack, 15-ft. range increment.'})],
  activeAbilities:[
   ability('Gatekeeper Aura','su','60 ft.; teleporters Will DC 23 or destination redirected, sickened 1d4 rounds; success still sickened 1 round.'),
   ability('Radiant Beam','su','Ranged attack +28, 4d10 force, 15-ft. range increment.'),
   ability('Radiant Blast','su','50-ft. cone 10d12 force, Reflex DC 23 half; recharge 1d4 rounds.'),
   ability('Radiant Blow','su','Slam hit: Will DC 23 or teleport lock 1 minute; critical hit also blinds permanently on failed save.'),
   ability('Orrery','ex','Move action to hide as an orrery; may take 20 Stealth to hide in plain sight.')
  ]
 },
 'talon-peak-roc':{
  text:{
   feats:'Flyby Attack, Improved Critical (talon), Improved Initiative, Improved Natural Attack (bite), Iron Will, Lightning Reflexes, Power Attack, Skill Focus (Perception), Toughness, Weapon Focus (talon).',
   skillDetail:'Fly +9, Perception +18.',
   saveDetail:'Fort +14, Ref +15, Will +11.',
   hpDetail:'161 (19d8+76).',
   movementDetail:'Land 20 ft.; fly 80 ft. (average).',
   maneuverDetail:'CMB +27 (+31 grapple); CMD 39.',
   attackDetail:'Bite +19 (3d8+9), two talons +20 (2d6+9, critical 19–20, plus grab).',
   importNotes:'Source-reviewed printed pp. 51–52 (PDF pp. 52–53). Removed unrelated Scythe Tree description and page labels, restored Fly/Perception and separate talon attacks.'
  },
  npcSkills:[{name:'Fly',bonus:9},{name:'Perception',bonus:18}],
  weapons:[melee('Bite',19,'3d8+9'),melee('Talon 1',20,'2d6+9',{crit_range:'19-20',desc:'Plus grab.'}),melee('Talon 2',20,'2d6+9',{crit_range:'19-20',desc:'Plus grab.'})]
 }
});