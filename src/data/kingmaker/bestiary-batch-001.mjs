// Curated PF1e Kingmaker Bestiary staging batch 001 (PDF pp. 10–15; printed pp. 9–14).
// Source-specific game statistics are transcribed; explanatory rules text is paraphrased.
// Staged in GitHub only: not automatically inserted into production NPC records.
export const KINGMAKER_BESTIARY_BATCH_001 = [
  {
    "slug": "giant-animated-statue",
    "name": "Giant Animated Statue",
    "chapter": "bestiary",
    "printedPage": 9,
    "pdfPage": 10,
    "source": "Pathfinder Kingmaker Bestiary (First Edition)",
    "hp": 78,
    "stats": {
      "cr": 7,
      "xp": 3200,
      "hitDice": 7,
      "initiative": -2,
      "ac": 15,
      "touch": 6,
      "flat": 15,
      "fort": 2,
      "ref": 0,
      "will": -3,
      "speed": 30,
      "space": 15,
      "reach": 15,
      "bab": 7,
      "cmb": 19,
      "cmd": 27,
      "perception": -5,
      "str": 30,
      "dex": 6,
      "wis": 1,
      "cha": 1
    },
    "text": {
      "summary": "Huge animated stone construct with a flaming projectile and a grapple-based fire effect.",
      "sourceReference": "Pathfinder Bestiary p. 14",
      "alignment": "N",
      "size": "Huge",
      "creatureType": "construct",
      "senses": "darkvision 60 ft.; low-light vision",
      "defenses": "hardness 8; construct immunities",
      "hpDetail": "7d10+40",
      "acDetail": "-2 Dex, +9 natural, -2 size",
      "attackDetail": "slam +15 (2d6+15 plus grab); flaming coal ranged touch +3 (2d6 bludgeoning plus 3d6 fire)",
      "specialAttacks": "grab; burn alive; flaming coal",
      "qualities": "4 construction points; stone"
    },
    "weapons": [
      {
        "name": "Slam",
        "attack_type": "melee",
        "npcAttackBonus": 15,
        "damage": "2d6+15",
        "desc": "Grab applies; GM resolves grapple."
      },
      {
        "name": "Flaming coal",
        "attack_type": "ranged",
        "npcAttackBonus": 3,
        "damage": "2d6+3d6",
        "desc": "Ranged touch attack, 80-ft. increment; split bludgeoning and fire damage manually."
      }
    ],
    "npcSkills": [],
    "activeAbilities": [
      {
        "name": "Burn Alive",
        "desc": "Creature starting its turn grappled by statue suffers 6d6 fire; Reflex DC 13 halves.",
        "ability_kind": "su"
      },
      {
        "name": "Flaming Coal",
        "desc": "Primary ranged touch attack; 2d6 bludgeoning and 3d6 fire damage, 80-ft. range increment.",
        "ability_kind": "su"
      }
    ],
    "verified": "transcribed-from-PDF",
    "needsRulesReference": true
  },
  {
    "slug": "ankou-assassin",
    "name": "Ankou Assassin",
    "chapter": "bestiary",
    "printedPage": 9,
    "pdfPage": 10,
    "source": "Pathfinder Kingmaker Bestiary (First Edition)",
    "hp": 276,
    "stats": {
      "cr": 17,
      "xp": 102400,
      "hitDice": 20,
      "initiative": 14,
      "ac": 32,
      "touch": 20,
      "flat": 21,
      "fort": 15,
      "ref": 22,
      "will": 17,
      "flySpeed": 90,
      "space": 10,
      "reach": 5,
      "bab": 11,
      "cmb": 21,
      "cmd": 42,
      "perception": 27,
      "str": 28,
      "dex": 31,
      "con": 28,
      "int": 15,
      "wis": 23,
      "cha": 25,
      "casterLevel": 15
    },
    "text": {
      "summary": "Large extraplanar fey assassin with multiple natural attacks and stealth-oriented abilities.",
      "sourceReference": "Pathfinder Bestiary 4 p. 10",
      "raceClassLevels": "Ankou assassin 6",
      "alignment": "LE",
      "size": "Large",
      "creatureType": "fey",
      "subtypes": "extraplanar",
      "senses": "blindsense 120 ft.; low-light vision",
      "defenses": "improved uncanny dodge; +3 saves vs. poison",
      "hpDetail": "20 HD; 14d6+6d8+200",
      "acDetail": "+10 Dex, +1 dodge, +12 natural, -1 size",
      "attackDetail": "2 claws +19 (1d8+9/19-20); tail slap +14 (1d8+4 plus bleed); 2 wings +14 (1d8+4 plus bleed)",
      "specialAttacks": "bleed 2d6; cold iron killer; death attack DC 18; quiet death; shadow doubles; sneak attack +6d6; true death DC 21",
      "spellLikeAbilities": "CL 15; at will: deeper darkness, ray of exhaustion (DC 20), silence (self, DC 19); 3/day: dimensional anchor, greater teleport, true seeing; 1/day: circle of death (DC 23), discern location, prismatic spray (DC 24)",
      "feats": "Blind-Fight, Combat Reflexes, Dodge, Flyby Attack, Improved Critical (claw), Improved Initiative, Improved Natural Attack (claw), Lightning Stance, Toughness, Wind Stance",
      "languages": "Aklo, Common, Sylvan (cannot speak); telepathy 100 ft.",
      "qualities": "hidden weapons; poison use"
    },
    "weapons": [
      {
        "name": "Claw 1",
        "attack_type": "melee",
        "npcAttackBonus": 19,
        "damage": "1d8+9",
        "desc": "19-20 critical threat",
        "crit_range": "19-20"
      },
      {
        "name": "Claw 2",
        "attack_type": "melee",
        "npcAttackBonus": 19,
        "damage": "1d8+9",
        "desc": "19-20 critical threat",
        "crit_range": "19-20"
      },
      {
        "name": "Tail slap",
        "attack_type": "melee",
        "npcAttackBonus": 14,
        "damage": "1d8+4",
        "desc": "Additional bleed; GM resolves."
      },
      {
        "name": "Wing 1",
        "attack_type": "melee",
        "npcAttackBonus": 14,
        "damage": "1d8+4",
        "desc": "Additional bleed."
      },
      {
        "name": "Wing 2",
        "attack_type": "melee",
        "npcAttackBonus": 14,
        "damage": "1d8+4",
        "desc": "Additional bleed."
      }
    ],
    "npcSkills": [
      {
        "name": "Acrobatics",
        "bonus": 27
      },
      {
        "name": "Bluff",
        "bonus": 24
      },
      {
        "name": "Disguise",
        "bonus": 24
      },
      {
        "name": "Fly",
        "bonus": 39
      },
      {
        "name": "Intimidate",
        "bonus": 30
      },
      {
        "name": "Knowledge (nature)",
        "bonus": 19
      },
      {
        "name": "Perception",
        "bonus": 27
      },
      {
        "name": "Sense Motive",
        "bonus": 23
      },
      {
        "name": "Stealth",
        "bonus": 29
      }
    ],
    "activeAbilities": [
      {
        "name": "Death Attack",
        "desc": "Fortitude DC 18; apply assassin rules from cited source; no automated kill effect.",
        "ability_kind": "ex"
      },
      {
        "name": "Shadow Doubles",
        "desc": "Special fey ability; consult referenced rules before use.",
        "ability_kind": "su"
      }
    ],
    "verified": "transcribed-from-PDF",
    "needsRulesReference": true
  },
  {
    "slug": "vicious-army-ant-swarm",
    "name": "Vicious Army Ant Swarm",
    "chapter": "bestiary",
    "printedPage": 10,
    "pdfPage": 11,
    "source": "Pathfinder Kingmaker Bestiary (First Edition)",
    "hp": 135,
    "stats": {
      "cr": 12,
      "xp": 19200,
      "hitDice": 18,
      "initiative": 5,
      "ac": 23,
      "touch": 23,
      "flat": 18,
      "fort": 14,
      "ref": 11,
      "will": 6,
      "speed": 30,
      "climbSpeed": 30,
      "space": 10,
      "reach": 0,
      "bab": 13,
      "perception": 4,
      "str": 1,
      "dex": 21,
      "con": 16,
      "wis": 10,
      "cha": 2
    },
    "text": {
      "summary": "Fine vermin swarm; damage and area effects require the swarm rules.",
      "sourceReference": "Pathfinder Bestiary p. 16",
      "alignment": "N",
      "size": "Fine",
      "creatureType": "vermin",
      "subtypes": "swarm",
      "senses": "darkvision 60 ft.; scent",
      "defenses": "swarm traits; immunity to weapon damage",
      "hpDetail": "18d8+54",
      "acDetail": "+5 Dex, +8 size",
      "attackDetail": "automatic swarm damage 4d6 plus distraction; no attack bonus is printed",
      "specialAttacks": "cling: 4d6 (DC 24); consume: 8d6; distraction DC 22"
    },
    "weapons": [],
    "npcSkills": [
      {
        "name": "Climb",
        "bonus": 13
      },
      {
        "name": "Perception",
        "bonus": 4
      }
    ],
    "activeAbilities": [
      {
        "name": "Swarm Damage",
        "desc": "4d6 automatic swarm damage plus distraction; resolve using swarm rules.",
        "ability_kind": "ex"
      },
      {
        "name": "Cling / Consume",
        "desc": "Cling 4d6 (DC 24); consume 8d6. Verify conditions in Pathfinder rules.",
        "ability_kind": "ex"
      }
    ],
    "verified": "transcribed-from-PDF",
    "needsRulesReference": true
  },
  {
    "slug": "bloomborn-athach",
    "name": "Bloomborn Athach",
    "chapter": "bestiary",
    "printedPage": 10,
    "pdfPage": 11,
    "source": "Pathfinder Kingmaker Bestiary (First Edition)",
    "hp": 275,
    "stats": {
      "cr": 17,
      "xp": 102400,
      "hitDice": 19,
      "initiative": 4,
      "ac": 32,
      "touch": 12,
      "flat": 28,
      "fort": 20,
      "ref": 12,
      "will": 12,
      "speed": 50,
      "space": 15,
      "reach": 15,
      "bab": 14,
      "cmb": 30,
      "cmd": 44,
      "perception": 20,
      "str": 38,
      "dex": 19,
      "con": 28,
      "int": 7,
      "wis": 18,
      "cha": 6
    },
    "text": {
      "summary": "Huge enhanced athach with a venomous bite, heavy slams, and rock throwing.",
      "sourceReference": "Pathfinder Bestiary 2 p. 33",
      "alignment": "CE",
      "size": "Huge",
      "creatureType": "humanoid",
      "subtypes": "giant",
      "senses": "darkvision 60 ft.; low-light vision",
      "energyResistances": "cold 10",
      "hpDetail": "19d8+190",
      "acDetail": "+4 Dex, +20 natural, -2 size",
      "attackDetail": "bite +26 (2d6+14/19-20 plus poison), 2 slams +26 (1d8+14); rock +17 (2d6+21)",
      "specialAttacks": "rock throwing 140 ft.; swift claw",
      "feats": "Cleave, Improved Critical (bite), Improved Iron Will, Iron Will, Lightning Reflexes, Lunge, Multiattack, Power Attack, Toughness, Vital Strike",
      "languages": "Aklo, Giant, Sylvan"
    },
    "weapons": [
      {
        "name": "Bite",
        "attack_type": "melee",
        "npcAttackBonus": 26,
        "damage": "2d6+14",
        "desc": "Poison effect; 19-20 critical threat",
        "crit_range": "19-20"
      },
      {
        "name": "Slam 1",
        "attack_type": "melee",
        "npcAttackBonus": 26,
        "damage": "1d8+14",
        "desc": ""
      },
      {
        "name": "Slam 2",
        "attack_type": "melee",
        "npcAttackBonus": 26,
        "damage": "1d8+14",
        "desc": ""
      },
      {
        "name": "Rock",
        "attack_type": "ranged",
        "npcAttackBonus": 17,
        "damage": "2d6+21",
        "desc": "Rock throwing 140 ft."
      }
    ],
    "npcSkills": [
      {
        "name": "Climb",
        "bonus": 23
      },
      {
        "name": "Perception",
        "bonus": 20
      }
    ],
    "activeAbilities": [
      {
        "name": "Swift Claw",
        "desc": "Special ability listed; use source creature rules for exact mechanics.",
        "ability_kind": "ex"
      }
    ],
    "verified": "transcribed-from-PDF",
    "needsRulesReference": true
  },
  {
    "slug": "azure-worm",
    "name": "Azure Worm",
    "chapter": "bestiary",
    "printedPage": 11,
    "pdfPage": 12,
    "source": "Pathfinder Kingmaker Bestiary (First Edition)",
    "hp": 237,
    "stats": {
      "cr": 15,
      "xp": 51200,
      "hitDice": 19,
      "initiative": 1,
      "ac": 30,
      "touch": 8,
      "flat": 28,
      "fort": 18,
      "ref": 12,
      "will": 9,
      "speed": 20,
      "burrowSpeed": 20,
      "swimSpeed": 40,
      "space": 20,
      "reach": 15,
      "bab": 19,
      "cmb": 34,
      "cmd": 46,
      "perception": 20,
      "str": 33,
      "dex": 13,
      "con": 25,
      "int": 1,
      "wis": 12,
      "cha": 8
    },
    "text": {
      "summary": "Gargantuan aquatic magical beast with poison sting and swallow-whole attack.",
      "alignment": "N",
      "size": "Gargantuan",
      "creatureType": "magical beast",
      "subtypes": "aquatic",
      "senses": "darkvision 60 ft.; low-light vision; tremorsense 60 ft.",
      "hpDetail": "19d10+133",
      "acDetail": "+1 Dex, +1 dodge, +22 natural, -4 size",
      "attackDetail": "bite +27 (4d8+11/19-20 plus grab); sting +27 (2d8+11 plus poison)",
      "specialAttacks": "regurgitate; swallow whole (4d8+16 bludgeoning, swallowed target AC 21, 23 hp)",
      "maneuverDetail": "CMB +34 (+36 bull rush, +38 grapple); CMD 46 (+48 vs. bull rush, cannot be tripped)",
      "qualities": "amphibious",
      "feats": "Awesome Blow, Critical Focus, Dodge, Improved Bull Rush, Improved Critical (bite), Iron Will, Power Attack, Staggering Critical, Weapon Focus (bite), Weapon Focus (sting)"
    },
    "weapons": [
      {
        "name": "Bite",
        "attack_type": "melee",
        "npcAttackBonus": 27,
        "damage": "4d8+11",
        "desc": "Grab; critical threat 19-20",
        "crit_range": "19-20"
      },
      {
        "name": "Sting",
        "attack_type": "melee",
        "npcAttackBonus": 27,
        "damage": "2d8+11",
        "desc": "Poison: Fort DC 26; 1d4 Dexterity damage, frequency 1/round for six rounds; three saves to cure."
      }
    ],
    "npcSkills": [
      {
        "name": "Perception",
        "bonus": 20
      },
      {
        "name": "Swim",
        "bonus": 25
      }
    ],
    "activeAbilities": [
      {
        "name": "Regurgitate",
        "desc": "Ranged attack +16, increment 60 ft. Against Tiny–Huge projectiles: 2d6+11 to 6d6+11; handle projectile size manually.",
        "ability_kind": "ex"
      },
      {
        "name": "Poison",
        "desc": "Sting injury, Fort DC 26, 1/round for 6 rounds, 1d4 Dex damage; 3 consecutive saves to cure.",
        "ability_kind": "ex"
      }
    ],
    "verified": "transcribed-from-PDF",
    "needsRulesReference": true
  },
  {
    "slug": "elder-banshee",
    "name": "Elder Banshee",
    "chapter": "bestiary",
    "printedPage": 11,
    "pdfPage": 12,
    "source": "Pathfinder Kingmaker Bestiary (First Edition)",
    "hp": 264,
    "stats": {
      "cr": 17,
      "xp": 102400,
      "hitDice": 23,
      "initiative": 16,
      "ac": 30,
      "touch": 30,
      "flat": 17,
      "fort": 16,
      "ref": 21,
      "will": 20,
      "flySpeed": 60,
      "bab": 17,
      "cmb": 29,
      "cmd": 47,
      "perception": 35,
      "dex": 34,
      "int": 5,
      "wis": 20,
      "cha": 25
    },
    "text": {
      "summary": "Incorporeal elder undead spirit with wail and damaging touch.",
      "sourceReference": "Pathfinder Bestiary 2 p. 41",
      "alignment": "CE",
      "size": "Medium",
      "creatureType": "undead",
      "subtypes": "incorporeal",
      "senses": "darkvision 60 ft.; hear heartbeat",
      "defenses": "incorporeal; undead immunities",
      "weaknesses": "sunlight powerlessness",
      "hpDetail": "23d8+161",
      "acDetail": "+7 deflection, +12 Dex, +1 dodge",
      "attackDetail": "incorporeal touch +30 (20d6 negative energy plus terror)",
      "specialAttacks": "wail",
      "feats": "Alertness, Combat Reflexes, Dodge, Great Fortitude, Improved Initiative, Iron Will, Lightning Reflexes, Mobility, Spring Attack, Step Up, Weapon Focus (touch), Wind Stance",
      "languages": "Common, Elven"
    },
    "weapons": [
      {
        "name": "Incorporeal touch",
        "attack_type": "melee",
        "npcAttackBonus": 30,
        "damage": "20d6",
        "desc": "Negative energy damage plus terror; incorporeal touch resolution."
      }
    ],
    "npcSkills": [
      {
        "name": "Fly",
        "bonus": 20
      },
      {
        "name": "Perception",
        "bonus": 35
      },
      {
        "name": "Sense Motive",
        "bonus": 7
      }
    ],
    "activeAbilities": [
      {
        "name": "Wail",
        "desc": "Wail attack; consult source for use frequency, save DC, and effect.",
        "ability_kind": "su"
      }
    ],
    "verified": "transcribed-from-PDF",
    "needsRulesReference": true
  },
  {
    "slug": "freshly-bloomed-basilisk",
    "name": "Freshly Bloomed Basilisk",
    "chapter": "bestiary",
    "printedPage": 12,
    "pdfPage": 13,
    "source": "Pathfinder Kingmaker Bestiary (First Edition)",
    "hp": 105,
    "stats": {
      "cr": 9,
      "xp": 6400,
      "hitDice": 10,
      "initiative": 1,
      "ac": 21,
      "touch": 11,
      "flat": 20,
      "fort": 13,
      "ref": 8,
      "will": 8,
      "speed": 20,
      "bab": 10,
      "cmb": 15,
      "cmd": 26,
      "perception": 14,
      "str": 20,
      "dex": 12,
      "con": 19,
      "int": 2,
      "wis": 17,
      "cha": 15
    },
    "text": {
      "summary": "Variant advanced basilisk with gaze attack.",
      "sourceReference": "Pathfinder Bestiary pp. 29, 294",
      "alignment": "N",
      "size": "Medium",
      "creatureType": "magical beast",
      "senses": "darkvision 60 ft.; low-light vision",
      "hpDetail": "10d10+50",
      "acDetail": "+1 Dex, +10 natural",
      "attackDetail": "bite +15 (1d8+7)",
      "specialAttacks": "gaze (DC 19)",
      "maneuverDetail": "CMD 26; 38 against trip",
      "feats": "Blind-Fight, Great Fortitude, Iron Will, Skill Focus (Perception), Toughness"
    },
    "weapons": [
      {
        "name": "Bite",
        "attack_type": "melee",
        "npcAttackBonus": 15,
        "damage": "1d8+7",
        "desc": ""
      }
    ],
    "npcSkills": [
      {
        "name": "Perception",
        "bonus": 14
      },
      {
        "name": "Stealth",
        "bonus": 13
      }
    ],
    "activeAbilities": [
      {
        "name": "Gaze",
        "desc": "Gaze attack DC 19; consult basilisk rules for exact condition and range.",
        "ability_kind": "su"
      }
    ],
    "verified": "transcribed-from-PDF",
    "needsRulesReference": true
  },
  {
    "slug": "blodeuwedd",
    "name": "Blodeuwedd",
    "chapter": "bestiary",
    "printedPage": 12,
    "pdfPage": 13,
    "source": "Pathfinder Kingmaker Bestiary (First Edition)",
    "hp": 66,
    "stats": {
      "cr": 6,
      "xp": 2400,
      "hitDice": 7,
      "initiative": 5,
      "ac": 20,
      "touch": 16,
      "flat": 14,
      "fort": 8,
      "ref": 10,
      "will": 8,
      "speed": 30,
      "bab": 3,
      "cmb": 7,
      "cmd": 23,
      "perception": 11,
      "str": 18,
      "dex": 21,
      "con": 23,
      "int": 14,
      "wis": 17,
      "cha": 18,
      "casterLevel": 7,
      "dr": 5
    },
    "text": {
      "summary": "Medium fey with pollen aura, plant magic, and natural attacks.",
      "alignment": "CN",
      "size": "Medium",
      "creatureType": "fey",
      "senses": "low-light vision",
      "aura": "allergen 30 ft., DC 19; sickness for 1d6 rounds",
      "drBypass": "cold iron",
      "hpDetail": "7d6+42",
      "acDetail": "+5 Dex, +1 dodge, +4 natural",
      "attackDetail": "2 claws +8 (1d8+4); masterwork sling +9 (1d4+4)",
      "spellLikeAbilities": "CL 7; constant speak with plants; at will dancing lights, entangle (DC 15), plant growth, whispering wind; 3/day deep slumber (DC 17), modify memory (DC 18), spike growth (DC 17); 1/day goodberry, hallucinatory terrain (DC 18), lesser geas (DC 17)",
      "qualities": "change shape (humanoid or owl), verdant step, wild empathy +10",
      "languages": "Aklo, Common, Sylvan; speak with plants",
      "feats": "Combat Casting, Dodge, Mobility, Weapon Finesse"
    },
    "weapons": [
      {
        "name": "Claw 1",
        "attack_type": "melee",
        "npcAttackBonus": 8,
        "damage": "1d8+4",
        "desc": ""
      },
      {
        "name": "Claw 2",
        "attack_type": "melee",
        "npcAttackBonus": 8,
        "damage": "1d8+4",
        "desc": ""
      },
      {
        "name": "Masterwork sling",
        "attack_type": "ranged",
        "npcAttackBonus": 9,
        "damage": "1d4+4",
        "desc": ""
      }
    ],
    "npcSkills": [
      {
        "name": "Diplomacy",
        "bonus": 14
      },
      {
        "name": "Escape Artist",
        "bonus": 10
      },
      {
        "name": "Handle Animal",
        "bonus": 9
      },
      {
        "name": "Heal",
        "bonus": 9
      },
      {
        "name": "Knowledge (nature)",
        "bonus": 12
      },
      {
        "name": "Perception",
        "bonus": 11
      },
      {
        "name": "Perform (wind)",
        "bonus": 12
      },
      {
        "name": "Sense Motive",
        "bonus": 11
      },
      {
        "name": "Stealth",
        "bonus": 15
      },
      {
        "name": "Survival",
        "bonus": 10
      }
    ],
    "activeAbilities": [
      {
        "name": "Allergen Aura",
        "desc": "30-ft. aura; Fort DC 19 or sickened for 1d6 rounds; immunity to this creature's aura for 24 hours after save.",
        "ability_kind": "ex"
      },
      {
        "name": "Change Shape",
        "desc": "Humanoid or prairie owl form up to 7 hours total per day.",
        "ability_kind": "su"
      },
      {
        "name": "Verdant Step",
        "desc": "Travel through connected tall grass or undergrowth, three times per day.",
        "ability_kind": "su"
      },
      {
        "name": "Nature's Infusion",
        "desc": "Once per day, false-life-like temporary HP effect for one hour.",
        "ability_kind": "su"
      }
    ],
    "verified": "transcribed-from-PDF",
    "needsRulesReference": true
  },
  {
    "slug": "boggard-cultist",
    "name": "Boggard Cultist",
    "chapter": "bestiary",
    "printedPage": 13,
    "pdfPage": 14,
    "source": "Pathfinder Kingmaker Bestiary (First Edition)",
    "hp": 101,
    "stats": {
      "cr": 8,
      "xp": 4800,
      "hitDice": 10,
      "initiative": 4,
      "ac": 19,
      "touch": 10,
      "flat": 19,
      "fort": 13,
      "ref": 6,
      "will": 10,
      "speed": 20,
      "swimSpeed": 30,
      "space": 5,
      "reach": 5,
      "bab": 7,
      "cmb": 8,
      "cmd": 18,
      "perception": 9,
      "str": 12,
      "dex": 10,
      "con": 18,
      "int": 8,
      "wis": 16,
      "cha": 13,
      "casterLevel": 7
    },
    "text": {
      "summary": "Boggard cleric of Gogunta (7 levels), with poison blowgun and negative energy channel.",
      "sourceReference": "Pathfinder Bestiary p. 37",
      "raceClassLevels": "Boggard cleric of Gogunta 7",
      "alignment": "CE",
      "size": "Medium",
      "creatureType": "humanoid",
      "subtypes": "boggard",
      "senses": "darkvision 60 ft.; low-light vision",
      "energyResistances": "cold 10",
      "hpDetail": "10d8+57",
      "acDetail": "+5 armor, +4 natural",
      "attackDetail": "+1 whip +9/+4 (1d3+2 nonlethal); sticky tongue +3 touch; masterwork blowgun +8/+3 (1d2 plus giant wasp poison)",
      "specialAttacks": "channel negative energy 4/day (DC 14, 4d6); terrifying croak DC 14",
      "spellLikeAbilities": "Domain abilities (CL 7): 6/day icicle (1d6+3 cold), touch of chaos",
      "spellsPrepared": "Cleric CL 7, concentration +10. 4th: chaos hammer (DC 17), unholy blight (DC 17); 3rd: blindness/deafness (DC 16), cure serious wounds, dispel magic, water breathing; 2nd: cure moderate wounds, darkness, fog cloud, sound burst (DC 15), spiritual weapon; 1st: command (DC 14), cure light wounds ×2, protection from law, sanctuary (DC 14), shield of faith; 0: detect magic, mending, read magic, stabilize. Domains Chaos, Water.",
      "languages": "Abyssal, Boggard, Common",
      "qualities": "hold breath, swamp stride",
      "gear": "+1 hide armor, +1 whip, masterwork blowgun with poisoned darts, cloak of resistance +1, religious symbol"
    },
    "weapons": [
      {
        "name": "+1 whip (first)",
        "attack_type": "melee",
        "npcAttackBonus": 9,
        "damage": "1d3+2",
        "desc": "Nonlethal damage."
      },
      {
        "name": "+1 whip (iterative)",
        "attack_type": "melee",
        "npcAttackBonus": 4,
        "damage": "1d3+2",
        "desc": "Nonlethal damage."
      },
      {
        "name": "Sticky tongue touch",
        "attack_type": "melee",
        "npcAttackBonus": 3,
        "damage": "",
        "desc": "Touch attack; special effect requires GM."
      },
      {
        "name": "Masterwork blowgun (first)",
        "attack_type": "ranged",
        "npcAttackBonus": 8,
        "damage": "1d2",
        "desc": "Giant wasp poison; GM handles effect."
      },
      {
        "name": "Masterwork blowgun (iterative)",
        "attack_type": "ranged",
        "npcAttackBonus": 3,
        "damage": "1d2",
        "desc": "Giant wasp poison; GM handles effect."
      }
    ],
    "npcSkills": [
      {
        "name": "Intimidate",
        "bonus": 3
      },
      {
        "name": "Knowledge (religion)",
        "bonus": 4
      },
      {
        "name": "Linguistics",
        "bonus": 4
      },
      {
        "name": "Perception",
        "bonus": 9
      },
      {
        "name": "Stealth",
        "bonus": -2
      },
      {
        "name": "Survival",
        "bonus": 8
      },
      {
        "name": "Swim",
        "bonus": 7
      }
    ],
    "activeAbilities": [
      {
        "name": "Negative Energy Channel",
        "desc": "4/day, save DC 14, 4d6 negative energy; use channel rules.",
        "ability_kind": "su"
      },
      {
        "name": "Terrifying Croak",
        "desc": "Fear-related croak effect, DC 14; consult boggard rules.",
        "ability_kind": "su"
      }
    ],
    "verified": "transcribed-from-PDF",
    "needsRulesReference": true
  },
  {
    "slug": "boggard-swampseer",
    "name": "Boggard Swampseer",
    "chapter": "bestiary",
    "printedPage": 13,
    "pdfPage": 14,
    "source": "Pathfinder Kingmaker Bestiary (First Edition)",
    "hp": 39,
    "stats": {
      "cr": 3,
      "xp": 800,
      "hitDice": 5,
      "initiative": 0,
      "ac": 19,
      "touch": 10,
      "flat": 19,
      "fort": 9,
      "ref": 3,
      "will": 6,
      "speed": 20,
      "swimSpeed": 30,
      "bab": 3,
      "cmb": 4,
      "cmd": 14,
      "perception": 7,
      "str": 12,
      "dex": 10,
      "con": 17,
      "int": 8,
      "wis": 15,
      "cha": 14,
      "casterLevel": 2
    },
    "text": {
      "summary": "Boggard cleric of Gogunta (2 levels), swamp-supporting sonic croak abilities.",
      "sourceReference": "Pathfinder Bestiary p. 37",
      "raceClassLevels": "Boggard cleric of Gogunta 2",
      "alignment": "CE",
      "size": "Medium",
      "creatureType": "humanoid",
      "subtypes": "boggard",
      "senses": "darkvision 60 ft.; low-light vision",
      "hpDetail": "5d8+17",
      "acDetail": "+5 armor, +4 natural",
      "attackDetail": "masterwork quarterstaff +5 (1d6+1) or sticky tongue -1 touch (special)",
      "specialAttacks": "channel negative energy 5/day (DC 13, 1d6); destructive croak; terrifying croak DC 15",
      "spellLikeAbilities": "Domain abilities (CL 2): 5/day bleeding touch (1 round), icicle (1d6+1 cold).",
      "spellsPrepared": "Cleric CL 2, concentration +4. 1st: command (DC 13), cure light wounds, divine favor, obscuring mist. 0: bleed (DC 12), detect magic, purify food and drink, stabilize. Domains Death, Water.",
      "languages": "Abyssal, Boggard, Common",
      "qualities": "drowning drone, hold breath, swamp stride",
      "combatGear": "potion of cure moderate wounds",
      "gear": "masterwork scale mail, masterwork quarterstaff",
      "feats": "Improved Natural Armor, Lightning Reflexes, Skill Focus (Intimidate)"
    },
    "weapons": [
      {
        "name": "Masterwork quarterstaff",
        "attack_type": "melee",
        "npcAttackBonus": 5,
        "damage": "1d6+1",
        "desc": ""
      },
      {
        "name": "Sticky tongue touch",
        "attack_type": "melee",
        "npcAttackBonus": -1,
        "damage": "",
        "desc": "Special touch attack; GM handles effect."
      }
    ],
    "npcSkills": [
      {
        "name": "Intimidate",
        "bonus": 8
      },
      {
        "name": "Knowledge (religion)",
        "bonus": 3
      },
      {
        "name": "Perception",
        "bonus": 7
      },
      {
        "name": "Stealth",
        "bonus": -3
      },
      {
        "name": "Swim",
        "bonus": 6
      }
    ],
    "activeAbilities": [
      {
        "name": "Destructive Croak",
        "desc": "Sonic burst 2d6 within 15 ft. against non-boggards; Fort DC 15 halves; 1d4 rounds before reuse.",
        "ability_kind": "su"
      },
      {
        "name": "Drowning Drone",
        "desc": "Swift action: boggard allies within 60 ft. gain +2 circumstance to saves vs. auditory or sonic effects.",
        "ability_kind": "su"
      },
      {
        "name": "Negative Energy Channel",
        "desc": "5/day, DC 13, 1d6; follow cleric channel rules.",
        "ability_kind": "su"
      }
    ],
    "verified": "transcribed-from-PDF",
    "needsRulesReference": true
  }
];
