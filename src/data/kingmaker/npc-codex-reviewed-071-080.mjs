// Kingmaker (First Edition) NPC Codex source-reviewed entries 71–80.
// Source: Bestiary.pdf printed pages 111–123, PDF pages 112–124.
// Raw automated extraction remains unchanged. Game statistics and concise mechanical rules only.
export const KINGMAKER_NPC_CODEX_REVIEWED_071_080=Object.freeze({
  "ngara": {
    "stats": {
      "str": 20,
      "dex": 24,
      "con": 24,
      "int": 10,
      "wis": 17,
      "cha": 22,
      "perception": 22,
      "cmd": 31
    },
    "text": {
      "sourceReference": "Female spirit naga sorcerer 3 (Pathfinder Bestiary, p. 213).",
      "raceClassLevels": "Female spirit naga sorcerer 3.",
      "movementDetail": "Speed 40 ft.; swim 20 ft.; space 10 ft.; reach 5 ft.",
      "acDetail": "25, touch 16, flat-footed 18 (+7 Dex, +9 natural, −1 size).",
      "hpDetail": "159 (13 HD; 3d6+10d8+104).",
      "saveDetail": "Fort +11, Ref +13, Will +13.",
      "maneuverDetail": "CMB +14; CMD 31 (cannot be tripped).",
      "attackDetail": "Bite +12 (2d6+7), plus spirit naga poison (base monster ability).",
      "specialAttacks": "Poison; charming gaze (base spirit naga), fey sorcerer bloodline.",
      "spellLikeAbilities": "Fey bloodline CL 10th, concentration +16: laughing touch 9/day.",
      "spellsKnown": "Sorcerer CL 10th, concentration +16: 5th (4/day)—cone of cold (DC 21); 4th (6/day)—cure critical wounds, dimension door; 3rd (7/day)—dispel magic, fireball (DC 19), water breathing; 2nd (8/day)—acid arrow, detect thoughts (DC 18), invisibility, whispering wind; 1st (8/day)—cure light wounds, divine favor, entangle (DC 17), mage armor, magic missile, shield of faith; 0 (at will)—bleed (DC 16), daze (DC 18), detect magic, guidance, mage hand, message, open/close (DC 16), ray of frost, read magic.",
      "feats": "Ability Focus (charming gaze), Arcane Strike, Combat Casting, Eschew Materials (bonus), Lightning Reflexes, Skill Focus (Perception), Stealthy, Toughness.",
      "skillDetail": "Bluff +18, Escape Artist +9, Knowledge (nature) +10, Perception +22, Spellcraft +11, Stealth +20, Swim +21.",
      "languages": "Abyssal, Common.",
      "qualities": "Fey bloodline arcana (+2 DC compulsion), charming gaze, woodland stride.",
      "importNotes": "Source-reviewed printed p. 111 (PDF p. 112) with following-column/page continuations checked. Raw auto-extraction retained for auditing; this review corrects combat counts and spillover fields."
    },
    "weapons": [
      {
        "name": "Bite",
        "attack_type": "melee",
        "npcAttackBonus": 12,
        "damage": "2d6+7",
        "desc": "Poison; use base spirit naga poison rules."
      }
    ],
    "npcSkills": [
      {
        "name": "Bluff",
        "bonus": 18
      },
      {
        "name": "Escape Artist",
        "bonus": 9
      },
      {
        "name": "Perception",
        "bonus": 22
      },
      {
        "name": "Spellcraft",
        "bonus": 11
      },
      {
        "name": "Stealth",
        "bonus": 20
      },
      {
        "name": "Swim",
        "bonus": 21
      },
      {
        "name": "Knowledge (nature)",
        "bonus": 10
      }
    ],
    "activeAbilities": [
      {
        "name": "Charming Gaze",
        "ability_kind": "su",
        "desc": "Base spirit naga charming gaze; apply base creature rules."
      },
      {
        "name": "Laughing Touch",
        "ability_kind": "sp",
        "desc": "9/day; fey sorcerer bloodline (CL 10th)."
      }
    ]
  },
  "nightmare-rook": {
    "stats": {
      "str": 36,
      "dex": 20,
      "con": 24,
      "int": 16,
      "wis": 20,
      "cha": 18,
      "regeneration": 5,
      "perception": 44
    },
    "text": {
      "sourceReference": "Variant awakened roc (Pathfinder Bestiary, p. 236).",
      "senses": "Darkvision 60 ft., low-light vision; Perception +44.",
      "aura": "Fear 60 ft., DC 29.",
      "defenses": "DR 10/cold iron and lawful; regeneration 5 (cold iron or lawful bypass).",
      "acDetail": "35, touch 8, flat-footed 29 (+5 Dex, +1 dodge, +27 natural, −8 size).",
      "hpDetail": "375 (30d8+240); regeneration 5 (cold iron or lawful).",
      "saveDetail": "Fort +24, Ref +24, Will +17.",
      "movementDetail": "Speed 20 ft.; fly 80 ft. (average); space 30 ft.; reach 15 ft.",
      "maneuverDetail": "CMB +43 (+45 bull rush, +47 grapple); CMD 59 (61 vs. bull rush).",
      "attackDetail": "Bite +28 (4d8+13), two talons +28 (4d6+13, 19–20 plus grab each), one wing +22 (2d6+6).",
      "spellLikeAbilities": "CL 20th, concentration +24: 3/day—phantasmal killer (DC 18); 1/day—weird (DC 23), wish.",
      "skillDetail": "Acrobatics +38, Bluff +34, Fly +30, Intimidate +34, Perception +44.",
      "languages": "Aklo, Sylvan.",
      "importNotes": "Source-reviewed printed p. 111 (PDF p. 112) with following-column/page continuations checked. Raw auto-extraction retained for auditing; this review corrects combat counts and spillover fields."
    },
    "weapons": [
      {
        "name": "Bite",
        "attack_type": "melee",
        "npcAttackBonus": 28,
        "damage": "4d8+13"
      },
      {
        "name": "Talon 1",
        "attack_type": "melee",
        "npcAttackBonus": 28,
        "damage": "4d6+13",
        "desc": "Critical 19–20; grab."
      },
      {
        "name": "Talon 2",
        "attack_type": "melee",
        "npcAttackBonus": 28,
        "damage": "4d6+13",
        "desc": "Critical 19–20; grab."
      },
      {
        "name": "Wing",
        "attack_type": "melee",
        "npcAttackBonus": 22,
        "damage": "2d6+6"
      }
    ],
    "activeAbilities": [
      {
        "name": "Fear Aura",
        "ability_kind": "su",
        "desc": "60 ft., Will DC 29; see source fear aura."
      },
      {
        "name": "Regeneration",
        "ability_kind": "ex",
        "desc": "5 HP/round; cold iron or lawful damage bypasses it."
      },
      {
        "name": "Roc Magic",
        "ability_kind": "sp",
        "desc": "Phantasmal killer DC 18 3/day; weird DC 23 and wish 1/day."
      }
    ]
  },
  "nilak": {
    "stats": {
      "str": 12,
      "dex": 10,
      "con": 14,
      "int": 8,
      "wis": 18,
      "cha": 14,
      "casterLevel": 10
    },
    "text": {
      "raceClassLevels": "Female human druid 10.",
      "senses": null,
      "immunities": "Poison; resist acid 10.",
      "defenses": "Immune poison; resist acid 10; +4 save bonus vs. fey/plant-targeted effects.",
      "acDetail": "16, touch 11, flat-footed 16 (+4 armor, +1 deflection, +1 natural).",
      "hpDetail": "88 (10d8+40).",
      "saveDetail": "Fort +10, Ref +6, Will +12 (+4 vs. fey and plant-targeted effects).",
      "specialAttacks": "Wild shape 4/day; Earth domain acid dart 7/day (1d6+5 acid).",
      "spellLikeAbilities": "Earth domain CL 10th, concentration +14: acid dart 7/day (1d6+5 acid).",
      "spellsPrepared": "Druid CL 10th, concentration +14: 5th—stoneskin, wall of fire, wall of stone [domain]; 4th—cure serious wounds (3), dispel magic, spike stones [domain] (DC 18); 3rd—call lightning (DC 17), cure moderate wounds (2), stone shape [domain], wind wall; 2nd—bear’s endurance, flaming sphere (DC 16), resist energy, lesser restoration (2), soften earth and stone [domain]; 1st—charm animal (DC 15), cure light wounds (2), longstrider, magic stone [domain], shillelagh (DC 15); 0 (at will)—create water, detect magic, light, stabilize. Domain Earth.",
      "qualities": "Earth domain nature bond, nature sense, trackless step, wild empathy +12, woodland stride.",
      "feats": "Combat Casting, Improved Initiative, Lightning Reflexes, Martial Weapon Proficiency (shortbow), Natural Spell, Toughness.",
      "gear": "+2 leather armor, +1 composite shortbow (+1 Str) with 20 arrows, masterwork club, amulet of natural armor +1 (chieftain’s necklace), cloak of resistance +1, ring of protection +1, rare candles and incense (100 gp; call spirit ritual).",
      "attackDetail": "Mwk club +9/+4 (1d6+1) OR +1 composite shortbow +8/+3 (1d6+2/×3).",
      "skillDetail": "Intimidate +12, Knowledge (nature) +9, Perception +17, Perform (sing) +7, Survival +19.",
      "importNotes": "Source-reviewed printed p. 112 (PDF p. 113) with following-column/page continuations checked. Raw auto-extraction retained for auditing; this review corrects combat counts and spillover fields."
    },
    "weapons": [
      {
        "name": "Club +9",
        "attack_type": "melee",
        "npcAttackBonus": 9,
        "damage": "1d6+1"
      },
      {
        "name": "Club +4",
        "attack_type": "melee",
        "npcAttackBonus": 4,
        "damage": "1d6+1"
      },
      {
        "name": "Composite shortbow +8",
        "attack_type": "ranged",
        "npcAttackBonus": 8,
        "damage": "1d6+2",
        "desc": "Alternative ranged, ×3 crit."
      },
      {
        "name": "Composite shortbow +3",
        "attack_type": "ranged",
        "npcAttackBonus": 3,
        "damage": "1d6+2",
        "desc": "Alternative ranged, ×3 crit."
      }
    ],
    "activeAbilities": [
      {
        "name": "Wild Shape",
        "ability_kind": "su",
        "desc": "4/day, druid 10."
      },
      {
        "name": "Acid Dart",
        "ability_kind": "sp",
        "desc": "Earth domain 7/day, 1d6+5 acid."
      }
    ]
  },
  "niodrhast": {
    "stats": {
      "str": 34,
      "dex": 11,
      "con": 28,
      "int": 20,
      "wis": 19,
      "cha": 25,
      "sr": 26
    },
    "text": {
      "sourceReference": "Variant advanced neothelid (Pathfinder Bestiary, pp. 214, 288).",
      "senses": "Blindsight 100 ft., trace teleport 60 ft.; Perception +30.",
      "defenses": "DR 10/cold iron; SR 26.",
      "movementDetail": "Speed 30 ft.; fly 60 ft. (good); space 20 ft.; reach 20 ft.",
      "maneuverDetail": "CMB +33 (+35 bull rush, +37 grapple, +35 overrun); CMD 43 (+45 vs. bull rush/overrun, cannot be tripped).",
      "attackDetail": "Four separate tongues +25 (3d6+12, crit 19–20, grab each).",
      "specialAttacks": "Breath weapon 50-ft. cone 16d10 acid, Reflex DC 30 half, usable every 1d4 rounds; mind thrust; psychic crush; swallow whole 2d6+12 bludgeoning, AC 24, 33 HP.",
      "spellLikeAbilities": "CL 20th, concentration +27: constant—fly; at will—charm monster (DC 21), clairaudience/clairvoyance, detect thoughts (DC 19), poison (DC 21), suggestion (DC 20), telekinesis (DC 22), teleport; 3/day—quickened charm monster (DC 21), quickened suggestion (DC 20).",
      "languages": "Aboleth, Aklo, Undercommon; telepathy 100 ft.",
      "hpDetail": "333 (23d8+230).",
      "importNotes": "Source-reviewed printed p. 113 (PDF p. 114) with following-column/page continuations checked. Raw auto-extraction retained for auditing; this review corrects combat counts and spillover fields."
    },
    "weapons": [
      {
        "name": "Tongue 1",
        "attack_type": "melee",
        "npcAttackBonus": 25,
        "damage": "3d6+12",
        "desc": "19–20 critical; grab."
      },
      {
        "name": "Tongue 2",
        "attack_type": "melee",
        "npcAttackBonus": 25,
        "damage": "3d6+12",
        "desc": "19–20 critical; grab."
      },
      {
        "name": "Tongue 3",
        "attack_type": "melee",
        "npcAttackBonus": 25,
        "damage": "3d6+12",
        "desc": "19–20 critical; grab."
      },
      {
        "name": "Tongue 4",
        "attack_type": "melee",
        "npcAttackBonus": 25,
        "damage": "3d6+12",
        "desc": "19–20 critical; grab."
      }
    ],
    "activeAbilities": [
      {
        "name": "Acid Breath",
        "ability_kind": "su",
        "desc": "50-ft. cone, 16d10 acid, Reflex DC 30 half; recharge 1d4 rounds."
      },
      {
        "name": "Swallow Whole",
        "ability_kind": "ex",
        "desc": "2d6+12 bludgeoning, interior AC 24, 33 HP; requires grab/grapple."
      },
      {
        "name": "Psychic Assault",
        "ability_kind": "su",
        "desc": "Mind thrust and psychic crush; apply original neothelid rules."
      }
    ]
  },
  "nishkiv-the-knife": {
    "stats": {
      "str": 10,
      "dex": 16,
      "con": 15,
      "int": 13,
      "wis": 8,
      "cha": 12
    },
    "text": {
      "senses": "Perception +4.",
      "acDetail": "13, touch 13, flat-footed 10 (+3 Dex).",
      "defenses": "Evasion.",
      "saveDetail": "Fort +2, Ref +6, Will −1.",
      "attackDetail": "Two masterwork daggers +4 and +4 (1d4/19–20 each) as a two-weapon full attack, OR one masterwork dagger +6 (1d4/19–20), OR thrown dagger +5 (1d4/19–20). Never stack alternative routines.",
      "specialAttacks": "Sneak attack +1d6.",
      "qualities": "Rogue talent combat trick, trapfinding +1.",
      "feats": "Two-weapon Fighting, Weapon Finesse, Weapon Focus (dagger).",
      "combatGear": "Three potions of cure light wounds.",
      "gear": "Leather armor, two masterwork daggers, four ordinary daggers.",
      "languages": "Common, Giant.",
      "importNotes": "Source-reviewed printed p. 113 (PDF p. 114) with following-column/page continuations checked. Raw auto-extraction retained for auditing; this review corrects combat counts and spillover fields."
    },
    "weapons": [
      {
        "name": "Main-hand dagger",
        "attack_type": "melee",
        "npcAttackBonus": 4,
        "damage": "1d4",
        "desc": "Two-weapon routine, crit 19–20."
      },
      {
        "name": "Off-hand dagger",
        "attack_type": "melee",
        "npcAttackBonus": 4,
        "damage": "1d4",
        "desc": "Two-weapon routine, crit 19–20."
      },
      {
        "name": "Single dagger",
        "attack_type": "melee",
        "npcAttackBonus": 6,
        "damage": "1d4",
        "desc": "Alternative single melee, crit 19–20."
      },
      {
        "name": "Thrown dagger",
        "attack_type": "ranged",
        "npcAttackBonus": 5,
        "damage": "1d4",
        "desc": "Ranged alternative, crit 19–20."
      }
    ],
    "activeAbilities": [
      {
        "name": "Sneak Attack",
        "ability_kind": "ex",
        "desc": "+1d6 precision damage when target is vulnerable."
      }
    ]
  },
  "ntavi": {
    "stats": {
      "str": 18,
      "dex": 13,
      "con": 14,
      "int": 8,
      "wis": 10,
      "cha": 12
    },
    "text": {
      "raceClassLevels": "Human fighter 7.",
      "senses": "Perception +0.",
      "hpDetail": "64 (7d10+21).",
      "acDetail": "18, touch 11, flat-footed 17 (+7 armor, +1 Dex).",
      "saveDetail": "Fort +7, Ref +3, Will +4 (+2 vs. fear).",
      "maneuverDetail": "CMB +11 (+15 sunder); CMD 22 (24 vs. sunder).",
      "specialAttacks": "Weapon training (hammers +1).",
      "feats": "Cleave, Greater Sunder, Improved Initiative, Improved Sunder, Intimidating Prowess, Iron Will, Power Attack, Weapon Focus (earth breaker), Weapon Specialization (earth breaker).",
      "attackDetail": "+1 earth breaker +14/+9 (2d6+10/×3) OR mwk composite longbow +9/+4 (1d8+4/×3).",
      "skillDetail": "Climb +8, Intimidate +11, Knowledge (local) +1, Survival +6, Swim +8.",
      "qualities": "Armor training 2.",
      "combatGear": "Two potions of cure serious wounds.",
      "gear": "+1 chainmail, +1 earth breaker, masterwork composite longbow (+4 Str) with 20 arrows, 10 gp.",
      "importNotes": "Source-reviewed printed p. 113 (PDF p. 114) with following-column/page continuations checked. Raw auto-extraction retained for auditing; this review corrects combat counts and spillover fields."
    },
    "weapons": [
      {
        "name": "Earth breaker +14",
        "attack_type": "melee",
        "npcAttackBonus": 14,
        "damage": "2d6+10",
        "desc": "Critical ×3."
      },
      {
        "name": "Earth breaker +9",
        "attack_type": "melee",
        "npcAttackBonus": 9,
        "damage": "2d6+10",
        "desc": "Critical ×3."
      },
      {
        "name": "Composite longbow +9",
        "attack_type": "ranged",
        "npcAttackBonus": 9,
        "damage": "1d8+4",
        "desc": "Ranged alternate, critical ×3."
      },
      {
        "name": "Composite longbow +4",
        "attack_type": "ranged",
        "npcAttackBonus": 4,
        "damage": "1d8+4",
        "desc": "Ranged alternate, critical ×3."
      }
    ]
  },
  "nugrah": {
    "stats": {
      "str": 11,
      "dex": 9,
      "con": 10,
      "int": 12,
      "wis": 20,
      "cha": 10,
      "casterLevel": 6
    },
    "text": {
      "raceClassLevels": "Male old human druid 6.",
      "senses": "Perception +14.",
      "acDetail": "9, touch 9, flat-footed 9 (−1 Dex).",
      "hpDetail": "42 (6d8+12).",
      "saveDetail": "Fort +5, Ref +1, Will +12 (+4 vs. fey and plant-targeted effects).",
      "defenses": "Resist nature’s lure; resist acid 10.",
      "specialAttacks": "Wild shape 2/day; Earth domain acid dart 8/day, 1d6+3 acid.",
      "spellLikeAbilities": "Earth domain CL 6th, concentration +11: acid dart 8/day (1d6+3 acid).",
      "spellsPrepared": "Druid CL 6th, concentration +11: 3rd—cure moderate wounds (2), meld into stone, stone shape [domain]; 2nd—barkskin, gust of wind (DC 17), soften earth and stone [domain], spider climb, summon swarm; 1st—cure light wounds (4), longstrider, magic stone [domain]; 0 (at will)—create water, detect magic, light, mending. Domain Earth.",
      "qualities": "Nature bond Earth domain, nature sense, trackless step, wild empathy +6, woodland stride.",
      "gear": "Club only (printed wounded, unarmored character).",
      "attackDetail": "Club +4 (1d6).",
      "skillDetail": "Bluff +6, Intimidate +6, Knowledge (nature) +12, Perception +14, Stealth +5, Survival +16.",
      "importNotes": "Source-reviewed printed p. 114 (PDF p. 115) with following-column/page continuations checked. Raw auto-extraction retained for auditing; this review corrects combat counts and spillover fields."
    },
    "weapons": [
      {
        "name": "Club",
        "attack_type": "melee",
        "npcAttackBonus": 4,
        "damage": "1d6"
      }
    ],
    "activeAbilities": [
      {
        "name": "Wild Shape",
        "ability_kind": "su",
        "desc": "2/day, druid 6."
      },
      {
        "name": "Acid Dart",
        "ability_kind": "sp",
        "desc": "Earth domain 8/day, 1d6+3 acid."
      }
    ]
  },
  "nyrissa": {
    "stats": {
      "str": 14,
      "dex": 30,
      "con": 33,
      "int": 22,
      "wis": 32,
      "cha": 36,
      "sr": 20,
      "casterLevel": null
    },
    "text": {
      "raceClassLevels": "Female nymph sorcerer 9/mystic theurge 10 (Pathfinder Bestiary, p. 217).",
      "sourceReference": "Nymph sorcerer 9/mystic theurge 10 (Pathfinder Bestiary 217).",
      "senses": "Low-light vision; Perception +42.",
      "aura": "Blinding beauty, 30 ft., DC 29.",
      "defenses": "Evasion, freedom of movement, protection from decapitation; DR 10/cold iron; SR 20; immune energy drain and negative energy; +4 morale vs. death effects.",
      "immunities": "Energy drain, negative energy.",
      "weaknesses": "Shame (−2 status penalty against certain foes; forgiveness checks DC 40 Diplomacy then DC 50 Will).",
      "acDetail": "51, touch 34, flat-footed 40 (+8 armor, +13 deflection, +10 Dex, +1 dodge, +5 natural, +4 shield).",
      "hpDetail": "427 (27d6+333).",
      "saveDetail": "Fort +33, Ref +38, Will +42 (+4 morale vs. death effects).",
      "movementDetail": "Speed 30 ft.; fly 60 ft. (average); swim 20 ft.",
      "attackDetail": "Flame blade +12/+7/+2 (1d8+10 fire) while pre-buffed; iteratives only on full attack.",
      "specialAttacks": "Spell synthesis, stunning glance, switch fables; blinding beauty aura (DC 29).",
      "spellLikeAbilities": "Nymph CL 8th, concentration +21: dimension door 1/day. Fey sorcerer bloodline CL 19th, concentration +32: fleeting glance at will (9 rounds/day), laughing touch 16/day.",
      "spellsKnown": "Sorcerer CL 20th, concentration +33: 9th (6/day)—mage’s disjunction (DC 32), wish; 8th (8/day)—horrid wilting (DC 31), maze, scintillating pattern; 7th (8/day)—power word blind, prismatic spray (DC 30), greater teleport; 6th (8/day)—chain lightning (DC 29), contingency, greater dispel magic; 5th (9/day)—dismissal (DC 28), dominate person (DC 30), sending, telekinesis (DC 28); 4th (9/day)—bestow curse (DC 27), charm monster (DC 27), dimension door, greater invisibility, poison (DC 27); 3rd (9/day)—deep slumber (DC 28), displacement, haste, lightning bolt (DC 26), suggestion (DC 28); 2nd (9/day)—detect thoughts (DC 25), glitterdust (DC 25), hideous laughter (DC 27), resist energy, scorching ray, spectral hand; 1st (10/day)—charm person (DC 24), disguise self, entangle (DC 24), magic missile, ray of enfeeblement (DC 24), shield; 0—acid splash, dancing lights, detect magic, ghost sound (DC 23), mage hand, mending, message, prestidigitation, read magic.",
      "spellsPrepared": "Druid CL 18th, concentration +29: 9th—quickened cure critical wounds, quickened death ward; 8th—quickened cure serious wounds, finger of death (DC 29), reverse gravity; 7th—quickened cure moderate wounds, fire storm (DC 28), maximized flame strike (2, DC 25), heal; 6th—antilife shell, greater dispel magic (2), summon nature’s ally VI, wall of stone (2); 5th—cure critical wounds, quickened cure light wounds (4), wall of thorns; 4th—cure serious wounds (4), flame strike (DC 25), rusting grasp; 3rd—cure moderate wounds (5), poison (DC 24), speak with plants; 2nd—barkskin, flame blade, gust of wind (DC 23), lesser restoration (4); 1st—cure light wounds (5), produce flame, speak with animals; 0—create water, guidance, light, stabilize.",
      "tactics": "Pre-combat barkskin, death ward, flame blade and shield; printed AC and attacks already assume these spells.",
      "qualities": "Combined spells, contingency, inherent bonuses, inspiration, unearthly grace, fey bloodline arcana (+2 DC compulsion), wild empathy +27, woodland stride.",
      "combatGear": "Maximize metamagic rod.",
      "gear": "Belt of physical perfection +6; bracers of armor +8; headband of mental superiority +6 (Acrobatics/Fly/Swim); orange prism and pale green prism ioun stones; ring of evasion; ring of freedom of movement; scarab of protection; wings of flying; anklet with two 25,000-gp diamonds for wish (anklet +10,000 gp).",
      "specialAbilities": "Contingency: at less than 0 HP, cure critical wounds heals 4d8+18. Protection from Decapitation: a wish prevents first beheading effect; a second before renewal can kill normally. Shame (Ex): when targeting Briar’s wielder or a kingdom ruler, −2 status to attacks/ability save DC; a DC 40 Diplomacy forgiveness attempt can spread penalty to all foes 1 round and force DC 50 Will save or truce. Switch Fables (Su): 1/min as move action while inside a Fable central 20-ft. diameter, move at least 10 ft. then shift to a central square of a different Fable.",
      "importNotes": "Source-reviewed printed p. 115 (PDF p. 116) with following-column/page continuations checked. Raw auto-extraction retained for auditing; this review corrects combat counts and spillover fields."
    },
    "weapons": [
      {
        "name": "Flame blade +12",
        "attack_type": "melee",
        "npcAttackBonus": 12,
        "damage": "1d8+10",
        "desc": "Fire; printed pre-combat spell."
      },
      {
        "name": "Flame blade +7",
        "attack_type": "melee",
        "npcAttackBonus": 7,
        "damage": "1d8+10",
        "desc": "Fire; second iterative."
      },
      {
        "name": "Flame blade +2",
        "attack_type": "melee",
        "npcAttackBonus": 2,
        "damage": "1d8+10",
        "desc": "Fire; third iterative."
      }
    ],
    "activeAbilities": [
      {
        "name": "Contingency",
        "ability_kind": "sp",
        "desc": "At below 0 HP cure critical wounds restores 4d8+18; pre-set spell."
      },
      {
        "name": "Protection from Decapitation",
        "ability_kind": "su",
        "desc": "First beheading effect negated; second before a new wish protection can kill normally."
      },
      {
        "name": "Shame",
        "ability_kind": "ex",
        "desc": "Against Briar wielder or kingdom ruler, −2 to attacks/DCs; DC 40 Diplomacy forgiveness, then DC 50 Will for truce."
      },
      {
        "name": "Switch Fables",
        "ability_kind": "su",
        "desc": "1/min move action, cross at least 10 ft., teleport central square in a different Fable."
      },
      {
        "name": "Blinding Beauty",
        "ability_kind": "su",
        "desc": "30-ft. aura DC 29; nymph power."
      },
      {
        "name": "Spell Synthesis",
        "ability_kind": "su",
        "desc": "Mystic theurge ability; separate sorcerer-known and druid-prepared lists."
      }
    ]
  },
  "oleg-leveton": {
    "stats": {
      "str": 13,
      "dex": 8,
      "con": 14,
      "int": 10,
      "wis": 9,
      "cha": 11
    },
    "text": {
      "raceClassLevels": "Male human expert 3.",
      "senses": "Perception +5.",
      "acDetail": "10, touch 9, flat-footed 10 (+1 armor, −1 Dex).",
      "hpDetail": "22 (3d8+9).",
      "saveDetail": "Fort +3, Ref +0, Will +4.",
      "feats": "Iron Will, Martial Weapon Proficiency (light hammer), Skill Focus (Profession [merchant]).",
      "skillDetail": "Appraise +6, Craft (carpentry) +8, Intimidate +6, Knowledge (local) +6, Perception +5, Profession (merchant) +8, Sense Motive +5.",
      "gear": "Padded armor, light hammer, masterwork carpentry tools.",
      "attackDetail": "Light hammer +3 (1d4+1).",
      "importNotes": "Source-reviewed printed p. 116 (PDF p. 117) with following-column/page continuations checked. Raw auto-extraction retained for auditing; this review corrects combat counts and spillover fields."
    },
    "weapons": [
      {
        "name": "Light hammer",
        "attack_type": "melee",
        "npcAttackBonus": 3,
        "damage": "1d4+1"
      }
    ]
  },
  "pavetta-stroon-drelev": {
    "stats": {
      "str": 8,
      "dex": 10,
      "con": 10,
      "int": 12,
      "wis": 11,
      "cha": 16
    },
    "text": {
      "raceClassLevels": "Human aristocrat 11.",
      "senses": "Perception +18.",
      "acDetail": "10, touch 10, flat-footed 10.",
      "hpDetail": "49 (11d8).",
      "saveDetail": "Fort +3, Ref +3, Will +9.",
      "attackDetail": "Mwk dagger +8/+3 (1d4−1, 19–20) OR thrown object +8 (1d6−1).",
      "specialAttacks": "Intimidating scream, release Jewel, stabbing fit (listed; detailed rules not included in the printed special-ability section), vengeful rage.",
      "specialAbilities": "Intimidating Scream (Ex): standard action Intimidate to demoralize all foes in 30 ft.; calls allies within hearing 100 ft.; once every other round. Release Jewel (Ex): move-equivalent command activates Jewel at initiative immediately after Pavetta; immediate action command on Jewel turn to attack or yip; swift action retrieve from her square without provoking. Vengeful Rage (Ex): if Jewel dies or becomes unconscious, Pavetta gets +20 temporary HP, +4 circumstance on attacks, +4d6 melee damage, bonus Whirlwind Strike and becomes confused. Duration 1 minute or until confusion ends, then fatigued.",
      "gear": "Masterwork dagger, stone of alarm, diamond crown (1,500 gp), diamond necklace (500 gp), emerald ring (250 gp), royal outfit (300 gp), sapphire earring (400 gp), signet ring (300 gp).",
      "importNotes": "Source-reviewed printed pp. 117–118 (PDF pp. 118–119). Source names stabbing fit but does not explain it in the special-ability section; kept as unresolved instead of fabricating mechanics. Jewel is separately listed NPC #81 and has unranked CR."
    },
    "weapons": [
      {
        "name": "Dagger +8",
        "attack_type": "melee",
        "npcAttackBonus": 8,
        "damage": "1d4-1",
        "desc": "19–20 critical."
      },
      {
        "name": "Dagger +3",
        "attack_type": "melee",
        "npcAttackBonus": 3,
        "damage": "1d4-1",
        "desc": "19–20 critical."
      },
      {
        "name": "Thrown object",
        "attack_type": "ranged",
        "npcAttackBonus": 8,
        "damage": "1d6-1",
        "desc": "Ranged alternative."
      }
    ],
    "activeAbilities": [
      {
        "name": "Intimidating Scream",
        "ability_kind": "ex",
        "desc": "Standard action; Intimidate demoralizes all enemies within 30 ft., alerts allies within 100 ft.; once every other round."
      },
      {
        "name": "Release Jewel",
        "ability_kind": "ex",
        "desc": "Move-equivalent command; Jewel acts immediately after Pavetta, direct with immediate action or retrieve with swift action."
      },
      {
        "name": "Vengeful Rage",
        "ability_kind": "ex",
        "desc": "If Jewel is defeated, +20 temp HP, +4 attack, +4d6 melee, bonus Whirlwind Strike, confused for up to 1 minute then fatigued."
      },
      {
        "name": "Stabbing Fit",
        "ability_kind": "other",
        "desc": "Named by printed special attacks but mechanics not specified in its special abilities; GM must adjudicate."
      }
    ]
  }
});