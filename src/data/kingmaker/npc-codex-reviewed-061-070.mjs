// Source-reviewed Kingmaker NPC Codex 61–70; printed pp. 99–111.
// Overrides only: raw PDF-extracted NPC catalog and existing Bestiary remain unchanged.
export const KINGMAKER_NPC_CODEX_REVIEWED_061_070=Object.freeze({
  "kundal": {
    "stats": {
      "str": 24
    },
    "text": {
      "sourceReference": "Male human afflicted werewolf barbarian 7 (Pathfinder Bestiary 198).",
      "raceClassLevels": "Male human afflicted werewolf barbarian 7.",
      "defenses": "Improved uncanny dodge, trap sense +2; DR 1/— from barbarian and 5/silver from lycanthropy. Printed defenses and stats reflect active rage.",
      "attackDetail": "+1 greataxe +15/+10 (1d12+11, crit ×3) and bite +9 (1d6+3). Ranged javelin +9 (1d6+7) as alternative.",
      "specialAttacks": "Rage 19 rounds/day; renewed vigor (1d8+5), superstition (+3 morale against spells, supernatural and spell-like effects), swift foot (+5 ft).",
      "qualities": "Change shape (human/hybrid/wolf, polymorph); fast movement; lycanthropic empathy +4 with wolves and dire wolves.",
      "movementDetail": "Speed 45 ft. (30 ft. in armor); rage included.",
      "tactics": "Printed statistics assume rage.",
      "combatGear": "Potion of cure moderate wounds; potion of remove fear.",
      "gear": "+1 hide armor, +1 greataxe, three javelins, ring of protection +1, 164 gp.",
      "importNotes": "Source-reviewed printed p. 105 (PDF p. 106), including adjacent column/page continuations. Stats and routines verified against source; legacy automated extraction retained unchanged."
    },
    "activeAbilities": [
      {
        "name": "Rage",
        "ability_kind": "ex",
        "desc": "19 rounds/day; AC and attacks printed in rage."
      },
      {
        "name": "Superstition",
        "ability_kind": "ex",
        "desc": "Rage power, +3 morale bonus against spells, supernatural and spell-like abilities."
      },
      {
        "name": "Renewed Vigor",
        "ability_kind": "ex",
        "desc": "Rage power, heals 1d8+5 when activated."
      }
    ]
  },
  "avatar-of-the-lantern-king": {
    "stats": {
      "str": 27,
      "cr": 24,
      "perception": 50
    },
    "text": {
      "raceClassLevels": null,
      "sourceReference": "Avatar of the Lantern King (unique Gargantuan fey).",
      "senses": "Darkvision 60 ft.; low-light vision; true seeing. Senses line: Perception +50; source Skills line separately prints Perception +49.",
      "aura": "Lantern King’s Glow (120 ft., bright light; ongoing magical darkness dispelled as greater dispel magic each turn).",
      "defenses": "Fortune’s Friend (immediate save reroll with 1d4-round cooldown); Mocking Laughter (30 ft., Will DC 35). DR 20/cold iron and lawful; SR 35; immune fire, bleed, magical control, paralysis, poison, sleep; resist electricity 15.",
      "weaknesses": "Vulnerability to cold.",
      "attackDetail": "Four searing runes +20 melee touch, each 4d6+8 bludgeoning plus 4d6 fire (or cold) and Drain Luck; OR four blinding beams +20 ranged touch, each 6d8 fire (or cold) and blindness. Critical 19–20. Runes and beams are different attack routines.",
      "specialAttacks": "Adjust Temperature; blindness (Fort DC 38, 1 minute with saves to recover at end of turns); Drain Luck (Will DC 35, cumulative −1 penalty up to −4); Playful Switch (Ref DC 35, two creatures within 60 ft. swap and are stunned 1 round if both fail); Prismatic Burst (DC 26).",
      "spellLikeAbilities": "CL 24th concentration +33: constant—tongues, true seeing; at will—prismatic spray (DC 26), teleport; 3/day—quickened fireball (DC 22), mirage arcana, persistent image, plane shift (DC 24), sunburst (DC 26), wall of fire; 1/day—commune with nature, disjunction, control weather, create demiplane, freedom, geas/quest (DC 25), miracle, meteor swarm (DC 28), shades.",
      "qualities": "Change shape (any fey/humanoid using alter self or fey form IV). Telepathy 300 ft.; tongues.",
      "specialAbilities": "Adjust Temperature: move action toggles attack fire to cold. Blindness: ranged beam Fort DC 38 or 1 minute blind, with a new save each turn. Drain Luck: on first searing-rune hit per round, Will DC 35 or stacking −1 luck to attacks/saves/skills (maximum −4), removed by successful critical hits or natural 20 saves. Fortune’s Friend: immediate action reroll failed save, cooldown 1d4 rounds, second result binding. Glow: 120-ft. bright light and dispels darkness each turn, free dismiss/reactivate. Mocking Laughter: creatures within 30 ft. that miss or fail a save against him must make Will DC 35 or suffer hideous laughter for 1 round, immunity 1 minute after success. Playful Switch: move action 1/round, two targets within 60 ft. Reflex DC 35 each; if both fail they swap positions and are stunned 1 round (unless spaces incompatible). Prismatic Burst: once per round on incoming critical or cold-iron hit, prismatic spray DC 26 strikes attacker.",
      "movementDetail": "Cannot walk (speed 0), fly 60 ft. perfect; space/reach 20 ft.",
      "hpDetail": "528 (32d6+416).",
      "importNotes": "Source-reviewed printed p. 106 (PDF p. 107), including adjacent column/page continuations. Stats and routines verified against source; legacy automated extraction retained unchanged."
    },
    "weapons": [
      {
        "name": "Searing rune 1",
        "attack_type": "melee",
        "npcAttackBonus": 20,
        "damage": "4d6+8",
        "desc": "Melee touch; plus 4d6 fire/cold and drain luck DC 35. Crit 19–20."
      },
      {
        "name": "Searing rune 2",
        "attack_type": "melee",
        "npcAttackBonus": 20,
        "damage": "4d6+8",
        "desc": "Melee touch; plus 4d6 fire/cold and drain luck DC 35. Crit 19–20."
      },
      {
        "name": "Searing rune 3",
        "attack_type": "melee",
        "npcAttackBonus": 20,
        "damage": "4d6+8",
        "desc": "Melee touch; plus 4d6 fire/cold and drain luck DC 35. Crit 19–20."
      },
      {
        "name": "Searing rune 4",
        "attack_type": "melee",
        "npcAttackBonus": 20,
        "damage": "4d6+8",
        "desc": "Melee touch; plus 4d6 fire/cold and drain luck DC 35. Crit 19–20."
      },
      {
        "name": "Blinding beam 1",
        "attack_type": "ranged",
        "npcAttackBonus": 20,
        "damage": "6d8",
        "desc": "Ranged touch; fire/cold, blindness Fort DC 38; crit 19–20. Alternative routine."
      },
      {
        "name": "Blinding beam 2",
        "attack_type": "ranged",
        "npcAttackBonus": 20,
        "damage": "6d8",
        "desc": "Ranged touch; fire/cold, blindness Fort DC 38; crit 19–20. Alternative routine."
      },
      {
        "name": "Blinding beam 3",
        "attack_type": "ranged",
        "npcAttackBonus": 20,
        "damage": "6d8",
        "desc": "Ranged touch; fire/cold, blindness Fort DC 38; crit 19–20. Alternative routine."
      },
      {
        "name": "Blinding beam 4",
        "attack_type": "ranged",
        "npcAttackBonus": 20,
        "damage": "6d8",
        "desc": "Ranged touch; fire/cold, blindness Fort DC 38; crit 19–20. Alternative routine."
      }
    ],
    "activeAbilities": [
      {
        "name": "Adjust Temperature",
        "ability_kind": "su",
        "desc": "Move action toggles attack elemental damage fire ↔ cold."
      },
      {
        "name": "Blindness",
        "ability_kind": "ex",
        "desc": "Beam hit: Fort DC 38 or blind for 1 minute; new save at end of each turn."
      },
      {
        "name": "Drain Luck",
        "ability_kind": "su",
        "desc": "First searing-rune damage in a round: Will DC 35 or stacking −1 luck (max −4); see removal rules."
      },
      {
        "name": "Fortune’s Friend",
        "ability_kind": "su",
        "desc": "Immediate action reroll failed save; must take new result; cooldown 1d4 rounds."
      },
      {
        "name": "Lantern King’s Glow",
        "ability_kind": "su",
        "desc": "120-ft. bright-light aura; dispels ongoing darkness as greater dispel magic at turn start."
      },
      {
        "name": "Mocking Laughter",
        "ability_kind": "su",
        "desc": "30 ft., Will DC 35 or hideous laughter 1 round on miss/failed save; successful save grants 1-min immunity."
      },
      {
        "name": "Playful Switch",
        "ability_kind": "su",
        "desc": "Move action 1/round, two targets 60 ft., Reflex DC 35 each; if both fail swap and stunned 1 round."
      },
      {
        "name": "Prismatic Burst",
        "ability_kind": "su",
        "desc": "Once per round on incoming critical or cold-iron hit: prismatic spray DC 26 against attacker."
      }
    ]
  },
  "lickweed": {
    "stats": {
      "str": 10
    },
    "text": {
      "sourceReference": "Goblin druid 5 (Pathfinder Bestiary 156).",
      "specialAttacks": "Wild shape 1/day. Fire domain fire bolt 6/day, 1d6+2 fire.",
      "spellLikeAbilities": "Fire domain CL 5th concentration +8, fire bolt (1d6+2 fire) 6/day.",
      "spellsPrepared": "Druid CL 5th concentration +8: 3rd—contagion (DC 16), fireball [domain] (DC 16), spike growth (DC 16); 2nd—barkskin, flame blade, flaming sphere (DC 15), produce flame [domain]; 1st—burning hands [domain] (DC 14), charm animal (DC 14), cure light wounds (2), entangle (DC 14); 0—detect magic, flare (DC 13), resistance, stabilize. Nature bond: Fire domain.",
      "qualities": "Nature bond (Fire domain), nature sense, trackless step, wild empathy +5, woodland stride.",
      "languages": "Common, Druidic, Goblin, Sylvan.",
      "gear": "+1 padded armor resembling thorny vines and weeds; +1 scythe.",
      "skillDetail": "Handle Animal +7, Knowledge (nature) +8, Linguistics +1, Ride +10, Stealth +10, Survival +12.",
      "attackDetail": "+1 scythe +5 (1d6+1, crit ×4).",
      "importNotes": "Source-reviewed printed p. 107 (PDF p. 108), including adjacent column/page continuations. Stats and routines verified against source; legacy automated extraction retained unchanged."
    },
    "npcSkills": [
      {
        "name": "Handle Animal",
        "bonus": 7
      },
      {
        "name": "Knowledge (nature)",
        "bonus": 8
      },
      {
        "name": "Linguistics",
        "bonus": 1
      },
      {
        "name": "Ride",
        "bonus": 10
      },
      {
        "name": "Stealth",
        "bonus": 10
      },
      {
        "name": "Survival",
        "bonus": 12
      }
    ],
    "activeAbilities": [
      {
        "name": "Wild Shape",
        "ability_kind": "su",
        "desc": "1/day using druid rules."
      },
      {
        "name": "Fire Bolt",
        "ability_kind": "sp",
        "desc": "6/day, 1d6+2 fire, Fire domain."
      }
    ]
  },
  "lintwerth": {
    "stats": {
      "cr": null,
      "xp": null,
      "str": 13,
      "fastHealing": 2
    },
    "text": {
      "sourceReference": "Male dust mephit familiar (Pathfinder Bestiary 202); CR — (familiar).",
      "raceClassLevels": "Male dust mephit familiar of Imeckus Stroon.",
      "defenses": "Improved evasion, DR 5/magic, SR 18; fast healing 2.",
      "spellLikeAbilities": "CL 6th concentration +8: 1/hour—blur; 1/day—summon one dust mephit (25% success), wind wall.",
      "specialAttacks": "Breath weapon (dust mephit); deliver touch spells for master.",
      "qualities": "Empathic link; speak with master.",
      "attackDetail": "Two claw attacks +8, each 1d3+1.",
      "skillDetail": "Bluff +8, Fly +18, Intimidate +5, Knowledge (arcana/dungeoneering/geography/history/local/nobility) +14 each, Knowledge (planes) +7, Perception +6, Sense Motive +6, Spellcraft +14, Stealth +12.",
      "hpDetail": "50 (3d10+3); fast healing 2. CR unranked, no XP in printed stat block.",
      "importNotes": "Source-reviewed printed pp. 107–108 (PDF pp. 108–109). Familiar CR unranked (—), not CR 6. Printed discussion mentions CR 6 as a hypothetical independent creature only; preserve missing CR/XP and no fake 0. Source spell-like, skill lists, and sheet HP confirmed."
    },
    "weapons": [
      {
        "name": "Claw 1",
        "attack_type": "melee",
        "npcAttackBonus": 8,
        "damage": "1d3+1"
      },
      {
        "name": "Claw 2",
        "attack_type": "melee",
        "npcAttackBonus": 8,
        "damage": "1d3+1"
      }
    ],
    "npcSkills": [
      {
        "name": "Bluff",
        "bonus": 8
      },
      {
        "name": "Fly",
        "bonus": 18
      },
      {
        "name": "Intimidate",
        "bonus": 5
      },
      {
        "name": "Knowledge (arcana)",
        "bonus": 14
      },
      {
        "name": "Knowledge (dungeoneering)",
        "bonus": 14
      },
      {
        "name": "Knowledge (geography)",
        "bonus": 14
      },
      {
        "name": "Knowledge (history)",
        "bonus": 14
      },
      {
        "name": "Knowledge (local)",
        "bonus": 14
      },
      {
        "name": "Knowledge (nobility)",
        "bonus": 14
      },
      {
        "name": "Knowledge (planes)",
        "bonus": 7
      },
      {
        "name": "Perception",
        "bonus": 6
      },
      {
        "name": "Sense Motive",
        "bonus": 6
      },
      {
        "name": "Spellcraft",
        "bonus": 14
      },
      {
        "name": "Stealth",
        "bonus": 12
      }
    ],
    "activeAbilities": [
      {
        "name": "Dust Mephit Breath Weapon",
        "ability_kind": "su",
        "desc": "Use source dust mephit breath weapon; not a normal claw attack."
      },
      {
        "name": "Familiar Link",
        "ability_kind": "su",
        "desc": "Empathic link, speak with master and deliver touch spells; not a standalone companion progression."
      }
    ]
  },
  "the-lonely-warrior": {
    "stats": {
      "str": 21,
      "con": null
    },
    "text": {
      "sourceReference": "Male cairn wight fighter 2 (Pathfinder Bestiary 276).",
      "defenses": "Undead traits; resurrection vulnerability.",
      "immunities": "Undead traits.",
      "attackDetail": "Broken +2 fey-bane bastard sword +11 (1d10+5 plus 1 negative level; bane conditional against fey), OR slam +10 (1d4+2 plus energy drain).",
      "specialAttacks": "Create spawn; energy drain 1 negative level, Fort DC 18.",
      "gear": "Broken chainmail, heavy wooden shield, broken +2 fey-bane bastard sword.",
      "hpDetail": "73 (6 HD; 4d8+2d10+44).",
      "importNotes": "Source-reviewed printed p. 108 (PDF p. 109), including adjacent column/page continuations. Stats and routines verified against source; legacy automated extraction retained unchanged."
    },
    "activeAbilities": [
      {
        "name": "Energy Drain",
        "ability_kind": "su",
        "desc": "Melee hit causes 1 negative level, Fort DC 18 for permanent loss."
      },
      {
        "name": "Create Spawn",
        "ability_kind": "su",
        "desc": "Use cairn wight spawn rules."
      },
      {
        "name": "Resurrection Vulnerability",
        "ability_kind": "ex",
        "desc": "Printed resurrection vulnerability; see published rule."
      }
    ]
  },
  "malgorzata-niska": {
    "stats": {
      "str": 12
    },
    "text": {
      "specialAttacks": "Channel negative energy 5/day (DC 15, 3d6); destructive smite +3, 6/day.",
      "spellLikeAbilities": "Domain abilities: CL 6th concentration +9, vision of madness (+3/−3) 6/day.",
      "spellsPrepared": "Cleric CL 6th concentration +9: 3rd—bestow curse (DC 16), dispel magic, prayer, rage [domain]; 2nd—cure moderate wounds, silence (DC 15), sound burst (DC 15), spiritual weapon, touch of idiocy [domain]; 1st—lesser confusion [domain] (DC 14), cure light wounds, divine favor, entropic shield, shield of faith; 0—bleed (DC 13), guidance, resistance, virtue. Domains Destruction/Madness.",
      "gear": "+1 leather armor, masterwork dagger, hag’s shabble, wooden unholy symbol of Gyronna, 89 gp.",
      "attackDetail": "Masterwork dagger +7, 1d4+1, crit 19–20.",
      "aura": null,
      "importNotes": "Source-reviewed printed p. 108 (PDF p. 109), including adjacent column/page continuations. Stats and routines verified against source; legacy automated extraction retained unchanged."
    },
    "activeAbilities": [
      {
        "name": "Channel Negative Energy",
        "ability_kind": "su",
        "desc": "5/day, 3d6, Will DC 15."
      },
      {
        "name": "Destructive Smite",
        "ability_kind": "su",
        "desc": "+3, 6/day."
      },
      {
        "name": "Vision of Madness",
        "ability_kind": "sp",
        "desc": "6/day, +3/−3 ability."
      }
    ]
  },
  "melianse": {
    "stats": {
      "str": 7,
      "sr": 12
    },
    "text": {
      "sourceReference": "Female nixie sorcerer 5 (Pathfinder Bestiary 3, p. 201).",
      "defenses": "DR 5/cold iron; cold resistance 10; SR 12.",
      "specialAttacks": "Nixie charm person 3/day (DC 18); water breathing 1/day. Elemental bloodline ray 10/day (1d6+2 cold).",
      "spellLikeAbilities": "Nixie CL 6th concentration +13: charm person (DC 18) 3/day, water breathing 1/day. Elemental bloodline CL 5th concentration +12: elemental ray 1d6+2 cold, 10/day.",
      "spellsKnown": "Sorcerer CL 5th concentration +12: 2nd (6/day)—blur, daze monster (DC 19), scorching ray (cold); 1st (8/day)—burning hands (cold, DC 18), hypnotism (DC 18), mage armor, magic missile, obscuring mist; 0—dancing lights, detect magic, ghost sound (DC 17), message, ray of frost, read magic. Elemental (water) bloodline.",
      "languages": "Aquan, Common, Sylvan.",
      "qualities": "Amphibious; elemental bloodline arcana converts energy damage spells to cold; wild empathy +15.",
      "combatGear": "Wand of grease (29 charges).",
      "gear": "Light crossbow, short sword, ring of protection +1.",
      "skillDetail": "Bluff +14, Craft (basket weaving) +9, Escape Artist +12, Handle Animal +9, Perception +9, Perform (sing) +14, Sense Motive +9, Spellcraft +9, Stealth +14, Swim +11.",
      "attackDetail": "Short sword +9, 1d4−2 (crit 19–20); light crossbow +9 ranged, 1d6 (crit 19–20).",
      "importNotes": "Source-reviewed printed p. 109 (PDF p. 110), including adjacent column/page continuations. Stats and routines verified against source; legacy automated extraction retained unchanged."
    },
    "npcSkills": [
      {
        "name": "Bluff",
        "bonus": 14
      },
      {
        "name": "Craft (basket weaving)",
        "bonus": 9
      },
      {
        "name": "Escape Artist",
        "bonus": 12
      },
      {
        "name": "Handle Animal",
        "bonus": 9
      },
      {
        "name": "Perception",
        "bonus": 9
      },
      {
        "name": "Perform (sing)",
        "bonus": 14
      },
      {
        "name": "Sense Motive",
        "bonus": 9
      },
      {
        "name": "Spellcraft",
        "bonus": 9
      },
      {
        "name": "Stealth",
        "bonus": 14
      },
      {
        "name": "Swim",
        "bonus": 11
      }
    ],
    "activeAbilities": [
      {
        "name": "Elemental Ray",
        "ability_kind": "sp",
        "desc": "10/day, 1d6+2 cold damage."
      },
      {
        "name": "Nixie Charm",
        "ability_kind": "sp",
        "desc": "Charm person DC 18, 3/day."
      },
      {
        "name": "Water Breathing",
        "ability_kind": "sp",
        "desc": "1/day, nixie spell-like ability."
      }
    ]
  },
  "minognos-ushad": {
    "stats": {
      "str": 32
    },
    "text": {
      "sourceReference": "Variant old wyvern (Pathfinder Bestiary 282).",
      "specialAttacks": "Rake: two conditional claws +29 (1d8+11 each). Poison on sting; no invented poison DC in stat block.",
      "attackDetail": "Bite +30 (4d6+11 plus grab), sting +30 (2d6+11 plus poison), two wings +27 (1d8+5 each); rake claws +29 (1d8+11 each) only when rake is available.",
      "movementDetail": "Speed 20 ft., fly 60 ft. (poor); space 15 ft.; reach 5 ft.",
      "immunities": "Paralysis, sleep.",
      "languages": "Draconic.",
      "maneuverDetail": "CMB +33 (+37 grapple); CMD 41.",
      "importNotes": "Source-reviewed printed p. 110 (PDF p. 111), including adjacent column/page continuations. Stats and routines verified against source; legacy automated extraction retained unchanged."
    },
    "weapons": [
      {
        "name": "Bite",
        "attack_type": "melee",
        "npcAttackBonus": 30,
        "damage": "4d6+11",
        "desc": "Plus grab."
      },
      {
        "name": "Sting",
        "attack_type": "melee",
        "npcAttackBonus": 30,
        "damage": "2d6+11",
        "desc": "Plus wyvern poison."
      },
      {
        "name": "Wing 1",
        "attack_type": "melee",
        "npcAttackBonus": 27,
        "damage": "1d8+5"
      },
      {
        "name": "Wing 2",
        "attack_type": "melee",
        "npcAttackBonus": 27,
        "damage": "1d8+5"
      },
      {
        "name": "Rake claw 1 (conditional)",
        "attack_type": "melee",
        "npcAttackBonus": 29,
        "damage": "1d8+11",
        "desc": "Only when rake applies."
      },
      {
        "name": "Rake claw 2 (conditional)",
        "attack_type": "melee",
        "npcAttackBonus": 29,
        "damage": "1d8+11",
        "desc": "Only when rake applies."
      }
    ],
    "activeAbilities": [
      {
        "name": "Rake",
        "ability_kind": "ex",
        "desc": "Two conditional claws +29 for 1d8+11 each. Not part of ordinary full-attack without rake condition."
      },
      {
        "name": "Sting Poison",
        "ability_kind": "ex",
        "desc": "On sting hit; adjudicate using wyvern poison rules; DC not printed in this stat block."
      }
    ]
  },
  "misbegotten-troll": {
    "stats": {
      "str": 24,
      "regeneration": 5
    },
    "text": {
      "sourceReference": "Male troll fighter 13 (Pathfinder Bestiary 268).",
      "attackDetail": "Full weapon routine: +4 vicious ranseur +32/+27/+22/+17 (2d6+21, crit 19–20/×3 plus 2d6 vicious) and bite +20 (1d8+5, crit 19–20). OR natural alternative: bite +25 (1d8+9) plus two claws +20 (1d6+9 each). Rend 1d6+12 only when both claws hit.",
      "specialAttacks": "Shake the Chain: once every 1d4 rounds, move action; opponents within 30 ft. Will DC 20 or stunned 1 round then sickened 1d4 rounds. Rend 1d6+12 if both claws hit; weapon training polearms +3, natural +2, close +1.",
      "specialAbilities": "Shake the Chain (Su): once every 1d4 rounds the troll shakes a cage of trapped sprites as a move action. Enemies within 30 ft. Will DC 20 or stunned 1 round and then sickened for 1d4 rounds; allies and self excluded. Mind-affecting, fixed DC.",
      "gear": "+5 full plate, +4 vicious ranseur.",
      "movementDetail": "Speed 30 ft.; space/reach 10 ft., 20 ft. with ranseur.",
      "defenses": "Regeneration 5, stopped by acid or fire; full plate armor.",
      "importNotes": "Source-reviewed printed p. 110 (PDF p. 111), including adjacent column/page continuations. Stats and routines verified against source; legacy automated extraction retained unchanged."
    },
    "weapons": [
      {
        "name": "Vicious ranseur +32",
        "attack_type": "melee",
        "npcAttackBonus": 32,
        "damage": "2d6+21",
        "desc": "Weapon full attack only; critical 19–20/×3; plus 2d6 vicious."
      },
      {
        "name": "Vicious ranseur +27",
        "attack_type": "melee",
        "npcAttackBonus": 27,
        "damage": "2d6+21",
        "desc": "Weapon full attack only; critical 19–20/×3; plus 2d6 vicious."
      },
      {
        "name": "Vicious ranseur +22",
        "attack_type": "melee",
        "npcAttackBonus": 22,
        "damage": "2d6+21",
        "desc": "Weapon full attack only; critical 19–20/×3; plus 2d6 vicious."
      },
      {
        "name": "Vicious ranseur +17",
        "attack_type": "melee",
        "npcAttackBonus": 17,
        "damage": "2d6+21",
        "desc": "Weapon full attack only; critical 19–20/×3; plus 2d6 vicious."
      },
      {
        "name": "Bite with ranseur",
        "attack_type": "melee",
        "npcAttackBonus": 20,
        "damage": "1d8+5",
        "desc": "Weapon routine; crit 19–20."
      },
      {
        "name": "Natural bite (alternative)",
        "attack_type": "melee",
        "npcAttackBonus": 25,
        "damage": "1d8+9",
        "desc": "Natural-only routine."
      },
      {
        "name": "Natural claw 1",
        "attack_type": "melee",
        "npcAttackBonus": 20,
        "damage": "1d6+9",
        "desc": "Natural-only routine; rend if both claws hit."
      },
      {
        "name": "Natural claw 2",
        "attack_type": "melee",
        "npcAttackBonus": 20,
        "damage": "1d6+9",
        "desc": "Natural-only routine; rend if both claws hit."
      }
    ],
    "activeAbilities": [
      {
        "name": "Shake the Chain",
        "ability_kind": "su",
        "desc": "Move action once per 1d4 rounds; 30 ft.; DC 20 Will or stunned 1 round then sickened 1d4 rounds; excludes self/allies, mind-affecting."
      },
      {
        "name": "Rend",
        "ability_kind": "ex",
        "desc": "1d6+12 only if both natural claws hit; not part of ranseur routine."
      },
      {
        "name": "Regeneration",
        "ability_kind": "ex",
        "desc": "5 HP/round, defeated by acid or fire."
      }
    ]
  },
  "nagrundi": {
    "stats": {
      "str": 22,
      "regeneration": 5
    },
    "text": {
      "sourceReference": "Variant two-headed troll (Tome of Horrors Complete 615).",
      "attackDetail": "Two bites +13 (1d8+6 each) plus two claws +13 (1d6+6 each), four attacks total. Rend 1d6+9 only if both claws hit.",
      "specialAttacks": "Rend 1d6+9 when both claws hit.",
      "defenses": "Regeneration 5 (acid or fire).",
      "gear": "Amulet of natural armor +2.",
      "hpDetail": "93 (11d8+44); regeneration 5 (acid or fire).",
      "skillDetail": "Intimidate +7, Perception +13; +2 racial Perception bonus.",
      "importNotes": "Source-reviewed printed p. 110 (PDF p. 111), including adjacent column/page continuations. Stats and routines verified against source; legacy automated extraction retained unchanged."
    },
    "weapons": [
      {
        "name": "Bite 1",
        "attack_type": "melee",
        "npcAttackBonus": 13,
        "damage": "1d8+6"
      },
      {
        "name": "Bite 2",
        "attack_type": "melee",
        "npcAttackBonus": 13,
        "damage": "1d8+6"
      },
      {
        "name": "Claw 1",
        "attack_type": "melee",
        "npcAttackBonus": 13,
        "damage": "1d6+6"
      },
      {
        "name": "Claw 2",
        "attack_type": "melee",
        "npcAttackBonus": 13,
        "damage": "1d6+6"
      }
    ],
    "activeAbilities": [
      {
        "name": "Rend",
        "ability_kind": "ex",
        "desc": "1d6+9 only when both claws hit."
      },
      {
        "name": "Regeneration",
        "ability_kind": "ex",
        "desc": "5 HP/round; acid or fire stops regeneration."
      }
    ]
  }
});