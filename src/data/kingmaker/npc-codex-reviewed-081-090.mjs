// Kingmaker (First Edition) NPC Codex source-reviewed entries 81–90.
// Source: Bestiary.pdf printed pages 111–123, PDF pages 112–124.
// Raw automated extraction remains unchanged. Game statistics and concise mechanical rules only.
export const KINGMAKER_NPC_CODEX_REVIEWED_081_090=Object.freeze({
  "jewel": {
    "stats": {
      "cr": null,
      "xp": null,
      "str": 11,
      "dex": 22,
      "con": 19,
      "int": 2,
      "wis": 12,
      "cha": 10,
      "space": 2.5,
      "reach": 0
    },
    "text": {
      "raceClassLevels": "Jewel, Pavetta’s Tiny animal companion/minion (no printed CR).",
      "sourceReference": "Jewel (unique Tiny animal; appears with Pavetta Stroon-Drelev).",
      "senses": "Low-light vision, scent; Perception +12.",
      "acDetail": "20, touch 19, flat-footed 13 (+6 Dex, +1 dodge, +1 natural, +2 size).",
      "hpDetail": "42 (5d8+20).",
      "saveDetail": "Fort +8, Ref +10, Will +2.",
      "movementDetail": "Speed 40 ft., space 2½ ft., reach 0 ft.",
      "maneuverDetail": "CMB +7; CMD 18 (22 vs. trip).",
      "attackDetail": "Bite +5 (1d3 plus ankle bite).",
      "specialAttacks": "Ankle bite; distracting yipping.",
      "qualities": "Return to Pavetta. Without her immediate-action direction, Jewel only moves to Pavetta’s square, otherwise takes no action.",
      "skillDetail": "Perception +12, Survival +1 (+5 when tracking by scent).",
      "specialAbilities": "Ankle Bite (Ex): if bite injures a Small-or-larger grounded target, target is flat-footed 1 round. Distracting Yipping (Ex): full-round action; all except Pavetta within 20 ft., Will DC 25 or −4 status to Perception and concentration and flat-footed for 1 round; sonic mind-affecting, Con based. Return to Pavetta (Ex): must return when not directed by Pavetta’s immediate action.",
      "importNotes": "Source-reviewed printed pp. 117–118 (PDF pp. 118–119). CR and XP are printed as an em dash (unranked); do not invent a CR. Jewel acts only under special Pavetta-command rules."
    },
    "weapons": [
      {
        "name": "Bite",
        "attack_type": "melee",
        "npcAttackBonus": 5,
        "damage": "1d3",
        "desc": "On hit, grounded Small-or-larger target is flat-footed for 1 round."
      }
    ],
    "activeAbilities": [
      {
        "name": "Ankle Bite",
        "ability_kind": "ex",
        "desc": "Small-or-larger grounded creature injured by bite becomes flat-footed 1 round."
      },
      {
        "name": "Distracting Yipping",
        "ability_kind": "ex",
        "desc": "Full-round, 20-ft. radius, Will DC 25 or −4 Perception/concentration and flat-footed 1 round; mind-affecting sonic."
      },
      {
        "name": "Return to Pavetta",
        "ability_kind": "ex",
        "desc": "Without immediate-action order from Pavetta, only move toward her square; at her square take no action."
      }
    ]
  },
  "phomandala": {
    "stats": {
      "str": 14,
      "dex": 22,
      "con": 28,
      "int": 14,
      "wis": 24,
      "cha": 28,
      "dr": 10
    },
    "text": {
      "sourceReference": "Variant advanced medusa sorcerer 15 (Pathfinder Bestiary, pp. 201, 288).",
      "raceClassLevels": "Variant advanced medusa sorcerer 15.",
      "senses": "Darkvision 60 ft.; Perception +37.",
      "defenses": "All-around vision; DR 10/adamantine (150-point stoneskin buffer).",
      "acDetail": "32, touch 20, flat-footed 25 (+4 armor, +3 deflection, +6 Dex, +1 dodge, +8 natural).",
      "hpDetail": "341 (23 HD; 15d6+8d10+245).",
      "saveDetail": "Fort +16, Ref +17, Will +22.",
      "movementDetail": "Speed 30 ft.; space 5 ft.; reach 5 ft., snake bites reach 10 ft.",
      "attackDetail": "Three snake bites +21 (2d6+3 plus poison each); no separate humanoid melee weapon.",
      "specialAttacks": "Petrifying gaze DC 25; snake bite poison (injury, Fort DC 23, once/round for 6 rounds, 1d3 Strength, cured by two consecutive saves).",
      "spellLikeAbilities": "Fey bloodline CL 15th, concentration +24: fleeting glance at will (15 rounds/day), laughing touch 12/day.",
      "spellsKnown": "Sorcerer CL 15th, concentration +24: 7th (5/day)—finger of death (DC 26), forcecage (DC 26), phase door; 6th (7/day)—chain lightning (DC 25), greater dispel magic, mislead (DC 25), stone to flesh (DC 25); 5th (8/day)—cone of cold (DC 24), feeblemind (DC 26), nightmare (DC 24), telekinesis (DC 24), tree stride; 4th (8/day)—bestow curse (DC 23), dimension door, phantasmal killer (DC 23), poison (DC 23), stoneskin; 3rd (8/day)—deep slumber (DC 24), displacement, lightning bolt (DC 22), major image (DC 22), vampiric touch; 2nd (8/day)—bull’s strength, cat’s grace, glitterdust (DC 21), hideous laughter (DC 23), scorching ray, spectral hand; 1st (9/day)—charm person (DC 20), disguise self, entangle (DC 20), mage armor, magic missile, shield; 0—acid splash, detect magic, ghost sound (DC 19), mage hand, message, prestidigitation, read magic, resistance, touch of fatigue (DC 19).",
      "tactics": "Pre-combat mage armor and stoneskin already included in printed AC/DR.",
      "qualities": "Fey bloodline arcana (+2 DC compulsion), fey magic, woodland stride.",
      "gear": "Amulet of natural armor +3, headband of mental prowess +4 (Wis/Cha), ring of protection +3, diamond dust worth 7,500 gp, ruby dust worth 4,000 gp.",
      "skillDetail": "Acrobatics +21, Bluff +35, Disguise +17, Intimidate +20, Perception +37, Spellcraft +28, Stealth +17.",
      "importNotes": "Source-reviewed printed p. 118 (PDF p. 119) with following-column/page continuations checked. Raw auto-extraction retained for auditing; this review corrects combat counts and spillover fields."
    },
    "weapons": [
      {
        "name": "Snake bite 1",
        "attack_type": "melee",
        "npcAttackBonus": 21,
        "damage": "2d6+3",
        "desc": "Plus Fort DC 23 Strength-damaging poison."
      },
      {
        "name": "Snake bite 2",
        "attack_type": "melee",
        "npcAttackBonus": 21,
        "damage": "2d6+3",
        "desc": "Plus Fort DC 23 Strength-damaging poison."
      },
      {
        "name": "Snake bite 3",
        "attack_type": "melee",
        "npcAttackBonus": 21,
        "damage": "2d6+3",
        "desc": "Plus Fort DC 23 Strength-damaging poison."
      }
    ],
    "npcSkills": [
      {
        "name": "Acrobatics",
        "bonus": 21
      },
      {
        "name": "Bluff",
        "bonus": 35
      },
      {
        "name": "Disguise",
        "bonus": 17
      },
      {
        "name": "Intimidate",
        "bonus": 20
      },
      {
        "name": "Perception",
        "bonus": 37
      },
      {
        "name": "Spellcraft",
        "bonus": 28
      },
      {
        "name": "Stealth",
        "bonus": 17
      }
    ],
    "activeAbilities": [
      {
        "name": "Petrifying Gaze",
        "ability_kind": "su",
        "desc": "DC 25 petrification (medusa ability)."
      },
      {
        "name": "Snake Poison",
        "ability_kind": "ex",
        "desc": "Injury Fort DC 23, 1d3 Strength/round for up to 6 rounds; cure 2 consecutive saves."
      },
      {
        "name": "Stoneskin",
        "ability_kind": "sp",
        "desc": "150 points of DR 10/adamantine pre-cast."
      }
    ]
  },
  "prazil": {
    "stats": {
      "str": 9,
      "dex": 18,
      "con": 12,
      "int": 8,
      "wis": 12,
      "cha": 10
    },
    "text": {
      "raceClassLevels": "Male kobold rogue 5/fighter 1 (Pathfinder Bestiary, p. 183).",
      "senses": "Darkvision 60 ft.; Perception +12.",
      "acDetail": "22, touch 14, flat-footed 19 (+6 armor, +3 Dex, +1 natural, +1 shield, +1 size).",
      "hpDetail": "47 (6 HD; 5d8+1d10+16).",
      "saveDetail": "Fort +4, Ref +8, Will +4.",
      "defenses": "Trap sense +1, uncanny dodge; light sensitivity.",
      "movementDetail": "Speed 30 ft. (20 ft. in armor).",
      "attackDetail": "+1 silver warhammer +6 (1d6/×3).",
      "specialAttacks": "Sneak attack +3d6.",
      "qualities": "Crafty; rogue talents fast stealth and finesse rogue, trapfinding +2.",
      "feats": "Combat Reflexes, Iron Will, Toughness, Weapon Finesse, Weapon Focus (warhammer).",
      "combatGear": "Potion of cure serious wounds.",
      "gear": "Breastplate, light steel shield, +1 silver warhammer, 89 gp.",
      "skillDetail": "Acrobatics +6, Bluff +9, Diplomacy +9, Disguise +9, Linguistics +3, Perception +12, Stealth +8, Survival +10.",
      "importNotes": "Source-reviewed printed p. 119 (PDF p. 120) with following-column/page continuations checked. Raw auto-extraction retained for auditing; this review corrects combat counts and spillover fields."
    },
    "weapons": [
      {
        "name": "Silver warhammer",
        "attack_type": "melee",
        "npcAttackBonus": 6,
        "damage": "1d6",
        "desc": "Critical ×3; +1 silver."
      }
    ],
    "activeAbilities": [
      {
        "name": "Sneak Attack",
        "ability_kind": "ex",
        "desc": "+3d6 precision damage if target vulnerable."
      }
    ]
  },
  "quintessa-maray": {
    "stats": {
      "str": 8,
      "dex": 14,
      "con": 14,
      "int": 12,
      "wis": 10,
      "cha": 19,
      "casterLevel": 12
    },
    "text": {
      "raceClassLevels": "Female human bard 12.",
      "senses": "Perception +15.",
      "acDetail": "19, touch 14, flat-footed 16 (+5 armor, +1 deflection, +2 Dex, +1 dodge).",
      "hpDetail": "93 (12d8+36).",
      "saveDetail": "Fort +7, Ref +11, Will +11 (+4 vs. bardic performances, language-dependent and sonic).",
      "movementDetail": "Speed 35 ft.",
      "attackDetail": "+1 mithral dagger +12/+7 (1d4, 19–20 critical).",
      "specialAttacks": "Bardic performance 30 rounds/day (move action): countersong, dirge of doom, distraction, fascinate (DC 20), inspire competence +4, inspire courage +3, inspire greatness, soothing performance, suggestion (DC 20).",
      "spellsKnown": "Bard CL 12th, concentration +16: 4th (4/day)—dimension door, dominate person (DC 18), modify memory (DC 18), shout (DC 18); 3rd (5/day)—confusion (DC 17), cure serious wounds, gaseous form, glibness; 2nd (6/day)—animal messenger, blindness/deafness (DC 16), detect thoughts (DC 16), invisibility, tongues; 1st (6/day)—charm person (DC 15), cure light wounds, disguise self, grease, obscure object (DC 15), vanish (DC 15); 0—dancing lights, detect magic, mage hand, mending, prestidigitation, summon instrument.",
      "qualities": "Bardic knowledge +6, jack-of-all-trades, lore master 2/day, versatile performances (dance, sing, wind).",
      "combatGear": "Deck of illusions (jokers, hearts and spades), scroll of dispel magic, scroll of locate creature, scroll of neutralize poison, scroll of speak with animals.",
      "gear": "+1 glamered mithral chain shirt; +1 mithral dagger; cloak of resistance +1; ring of protection +1; gold/mithral necklace (1,500 gp); 98 gp.",
      "skillDetail": "Bluff +19, Disguise +23, Escape Artist +17, Knowledge (local) +22, Perception +15, Perform (dance) +19, Perform (sing) +19, Perform (wind instruments) +19, Stealth +17.",
      "importNotes": "Source-reviewed printed p. 119 (PDF p. 120) with following-column/page continuations checked. Raw auto-extraction retained for auditing; this review corrects combat counts and spillover fields."
    },
    "weapons": [
      {
        "name": "Mithral dagger +12",
        "attack_type": "melee",
        "npcAttackBonus": 12,
        "damage": "1d4",
        "desc": "Critical 19–20."
      },
      {
        "name": "Mithral dagger +7",
        "attack_type": "melee",
        "npcAttackBonus": 7,
        "damage": "1d4",
        "desc": "Second iterative; critical 19–20."
      }
    ],
    "activeAbilities": [
      {
        "name": "Bardic Performance",
        "ability_kind": "su",
        "desc": "30 rounds/day, move action; inspire courage +3, inspire competence +4, fascinate/suggestion DC 20."
      },
      {
        "name": "Lore Master",
        "ability_kind": "ex",
        "desc": "Bard lore master 2/day."
      }
    ]
  },
  "rezatha": {
    "stats": {
      "str": 32,
      "dex": 18,
      "con": 26,
      "int": 9,
      "wis": 24,
      "cha": 14
    },
    "text": {
      "sourceReference": "Variant advanced remorhaz (Pathfinder Bestiary, pp. 233, 288).",
      "senses": "Darkvision 60 ft., low-light vision, tremorsense 60 ft.; Perception +34.",
      "acDetail": "26, touch 13, flat-footed 21 (+4 Dex, +1 dodge, +13 natural, −2 size).",
      "hpDetail": "261 (18d10+162).",
      "saveDetail": "Fort +19, Ref +15, Will +13.",
      "immunities": "Cold and fire.",
      "movementDetail": "Speed 30 ft., burrow 20 ft.; space 15 ft.; reach 15 ft.",
      "maneuverDetail": "CMB +31 (+33 bull rush, +35 grapple); CMD 46 (48 vs. bull rush, cannot be tripped).",
      "attackDetail": "Bite +27 (10d6+16, crit 19–20 plus 6d6 fire and grab).",
      "specialAttacks": "Heat; swallow whole (6d6+16 bludgeoning plus 12d6 fire each round; stomach AC 16, 26 HP).",
      "languages": "Giant (cannot speak).",
      "importNotes": "Source-reviewed printed p. 120 (PDF p. 121) with following-column/page continuations checked. Raw auto-extraction retained for auditing; this review corrects combat counts and spillover fields."
    },
    "weapons": [
      {
        "name": "Bite",
        "attack_type": "melee",
        "npcAttackBonus": 27,
        "damage": "10d6+16",
        "desc": "Crit 19–20; +6d6 fire and grab."
      }
    ],
    "activeAbilities": [
      {
        "name": "Body Heat",
        "ability_kind": "ex",
        "desc": "Contact heat; use remorhaz heat ability from base creature."
      },
      {
        "name": "Swallow Whole",
        "ability_kind": "ex",
        "desc": "6d6+16 bludgeoning +12d6 fire; stomach AC 16, 26 HP."
      }
    ]
  },
  "rigg-gargadilly": {
    "stats": {
      "str": 8,
      "dex": 26,
      "con": 16,
      "int": 13,
      "wis": 19,
      "cha": 20
    },
    "text": {
      "raceClassLevels": "Male quickling rogue 6 (Pathfinder Bestiary 2, p. 227).",
      "senses": "Low-light vision; Perception +17.",
      "defenses": "Evasion, improved uncanny dodge, natural invisibility, supernatural speed, trap sense +2; DR 5/cold iron; weak to slow.",
      "weaknesses": "Slow susceptibility.",
      "acDetail": "21, touch 20, flat-footed 12 (+8 Dex, +1 dodge, +1 natural, +1 size).",
      "hpDetail": "87 (10 HD; 4d6+6d8+46).",
      "saveDetail": "Fort +8, Ref +17, Will +10.",
      "movementDetail": "Speed 120 ft. (supernatural quickling).",
      "attackDetail": "+1 short sword +17/+12 (1d4, 19–20 critical).",
      "specialAttacks": "Sneak attack +4d6 plus 4 bleed (bleeding attack rogue talent).",
      "spellLikeAbilities": "CL 4th, concentration +9: 1/day—dancing lights, flare (DC 15), levitate, shatter (DC 17), ventriloquism (DC 16).",
      "qualities": "Poison use; rogue talents bleeding attack +4, surprise attacks, weapon training; trapfinding +3.",
      "skillDetail": "Acrobatics +21 (+93 jump), Bluff +18, Craft (trapmaking) +12, Escape Artist +21, Intimidate +18, Perception +17, Spellcraft +5, Stealth +25 (+65 stationary while invisible to onlookers), Survival +6, Use Magic Device +14.",
      "combatGear": "Blue whinnis (5 doses).",
      "gear": "+1 short sword.",
      "importNotes": "Source-reviewed printed p. 120 (PDF p. 121) with following-column/page continuations checked. Raw auto-extraction retained for auditing; this review corrects combat counts and spillover fields."
    },
    "weapons": [
      {
        "name": "Short sword +17",
        "attack_type": "melee",
        "npcAttackBonus": 17,
        "damage": "1d4",
        "desc": "Crit 19–20; sneak attack conditional."
      },
      {
        "name": "Short sword +12",
        "attack_type": "melee",
        "npcAttackBonus": 12,
        "damage": "1d4",
        "desc": "Second iterative; crit 19–20."
      }
    ],
    "npcSkills": [
      {
        "name": "Acrobatics",
        "bonus": 21
      },
      {
        "name": "Bluff",
        "bonus": 18
      },
      {
        "name": "Escape Artist",
        "bonus": 21
      },
      {
        "name": "Intimidate",
        "bonus": 18
      },
      {
        "name": "Perception",
        "bonus": 17
      },
      {
        "name": "Spellcraft",
        "bonus": 5
      },
      {
        "name": "Stealth",
        "bonus": 25
      },
      {
        "name": "Survival",
        "bonus": 6
      },
      {
        "name": "Use Magic Device",
        "bonus": 14
      },
      {
        "name": "Craft (trapmaking)",
        "bonus": 12
      }
    ],
    "activeAbilities": [
      {
        "name": "Natural Invisibility",
        "ability_kind": "su",
        "desc": "Quickling natural invisibility; +65 Stealth while still against foes unable to see invisible."
      },
      {
        "name": "Supernatural Speed",
        "ability_kind": "su",
        "desc": "Speed 120 ft.; Acrobatics jump +93."
      },
      {
        "name": "Bleeding Sneak Attack",
        "ability_kind": "ex",
        "desc": "+4d6 precision and +4 bleed where sneak attack applies."
      }
    ]
  },
  "satinder-morne": {
    "stats": {
      "str": 8,
      "dex": 15,
      "con": 10,
      "int": 12,
      "wis": 16,
      "cha": 14,
      "casterLevel": 6
    },
    "text": {
      "raceClassLevels": "Human cleric of Calistria 6/rogue 1.",
      "senses": "Perception +3.",
      "acDetail": "12, touch 12, flat-footed 10 (+2 Dex).",
      "hpDetail": "41 (7d8+6).",
      "saveDetail": "Fort +5, Ref +6, Will +10.",
      "attackDetail": "+1 dagger +7 (1d4, crit 19–20) OR mwk thrown dagger +7 (1d4−1, crit 19–20).",
      "specialAttacks": "Channel positive energy 5/day (DC 15, 3d6); sneak attack +1d6.",
      "spellLikeAbilities": "Charm and Trickery domains CL 6th, concentration +9: copycat (6 rounds) 6/day; dazing touch 6/day.",
      "spellsPrepared": "Cleric CL 6th, concentration +9: 3rd—bestow curse (DC 16), inflict serious wounds (DC 16), remove disease, suggestion [domain] (DC 16); 2nd—eagle’s splendor, inflict moderate wounds (DC 15), invisibility [domain], spiritual weapon, undetectable alignment (DC 15); 1st—bane (DC 14), command (DC 14), disguise self [domain], entropic shield, inflict light wounds (DC 14); 0—detect poison, light, purify food and drink (DC 13), resistance.",
      "skillDetail": "Bluff +10, Diplomacy +14, Intimidate +14, Knowledge (local) +7, Knowledge (nobility) +7, Knowledge (religion) +7, Profession (innkeeper) +8, Sense Motive +9, Stealth +6.",
      "qualities": "Trapfinding +1.",
      "combatGear": "Elixir of love; potion of aid; two potions cure light wounds; potion delay poison; potion remove disease; wand charm person (17 charges).",
      "gear": "+1 leather armor; +1 dagger; six masterwork daggers; Calistria holy symbol; spell component pouch; ruby ring (300 gp); 76 gp.",
      "importNotes": "Source-reviewed printed p. 121 (PDF p. 122) with following-column/page continuations checked. Raw auto-extraction retained for auditing; this review corrects combat counts and spillover fields."
    },
    "weapons": [
      {
        "name": "+1 dagger",
        "attack_type": "melee",
        "npcAttackBonus": 7,
        "damage": "1d4",
        "desc": "Crit 19–20."
      },
      {
        "name": "Thrown mwk dagger",
        "attack_type": "ranged",
        "npcAttackBonus": 7,
        "damage": "1d4-1",
        "desc": "Ranged alternative, crit 19–20."
      }
    ],
    "npcSkills": [
      {
        "name": "Bluff",
        "bonus": 10
      },
      {
        "name": "Diplomacy",
        "bonus": 14
      },
      {
        "name": "Intimidate",
        "bonus": 14
      },
      {
        "name": "Stealth",
        "bonus": 6
      },
      {
        "name": "Sense Motive",
        "bonus": 9
      },
      {
        "name": "Knowledge (local)",
        "bonus": 7
      },
      {
        "name": "Knowledge (nobility)",
        "bonus": 7
      },
      {
        "name": "Knowledge (religion)",
        "bonus": 7
      },
      {
        "name": "Profession (innkeeper)",
        "bonus": 8
      }
    ],
    "activeAbilities": [
      {
        "name": "Channel Positive Energy",
        "ability_kind": "su",
        "desc": "5/day, 3d6 healing/positive-energy damage, DC 15."
      },
      {
        "name": "Sneak Attack",
        "ability_kind": "ex",
        "desc": "+1d6 precision damage."
      },
      {
        "name": "Copycat",
        "ability_kind": "sp",
        "desc": "6/day, 6 rounds from Trickery domain."
      },
      {
        "name": "Dazing Touch",
        "ability_kind": "sp",
        "desc": "6/day from Charm domain."
      }
    ]
  },
  "sepoko": {
    "stats": {
      "str": 12,
      "dex": 10,
      "con": 18,
      "int": 8,
      "wis": 17,
      "cha": 13,
      "casterLevel": 10
    },
    "text": {
      "raceClassLevels": "Male boggard cleric of Gogunta 10 (Pathfinder Bestiary, p. 37).",
      "senses": "Darkvision 60 ft., low-light vision; Perception +7.",
      "acDetail": "20, touch 10, flat-footed 20 (+6 armor, +3 natural, +1 shield).",
      "hpDetail": "133 (13d8+75).",
      "saveDetail": "Fort +14, Ref +6, Will +11.",
      "defenses": "Death’s embrace; cold resistance 10.",
      "movementDetail": "Speed 20 ft. (15 ft. in armor), swim 30 ft.",
      "attackDetail": "+2 frost morningstar +13/+8 (1d8+3 plus 1d6 cold) and sticky tongue +5 touch (special, not a damage die). Tongue is conditional and uses boggard monster rule.",
      "specialAttacks": "Channel negative energy 6/day (DC 16, 5d6); terrifying croak DC 14; sticky tongue.",
      "spellLikeAbilities": "Death and Water domains CL 10th concentration +13: bleeding touch (5 rounds) 6/day; icicle (1d6+5 cold) 6/day.",
      "spellsPrepared": "Cleric CL 10th, concentration +13: 5th—flame strike (DC 18), insect plague, slay living [domain] (DC 18); 4th—control water [domain], cure critical wounds, freedom of movement, greater magic weapon; 3rd—bestow curse (DC 16), cure serious wounds (2), dispel magic, water breathing [domain]; 2nd—cure moderate wounds (2), death knell [domain] (DC 15), hold person (DC 15), resist energy, sound burst (DC 15); 1st—bane (DC 14), cure light wounds, divine favor, endure elements, obscuring mist [domain], shield of faith; 0—create water, detect poison, mending, resistance.",
      "tactics": "Pre-combat greater magic weapon on frost morningstar; printed +2 attack already includes it.",
      "qualities": "Hold breath, swamp stride.",
      "combatGear": "Three potions cure moderate wounds, potion sanctuary, wand cure moderate wounds (24 charges).",
      "gear": "+2 hide armor, masterwork light wooden shield, +1 frost morningstar, spell component pouch, wooden unholy symbol of Gogunta.",
      "skillDetail": "Handle Animal +7, Intimidate +6, Knowledge (religion) +6, Perception +7, Stealth −2 (+6 swamps), Swim +8.",
      "importNotes": "Source-reviewed printed p. 121 (PDF p. 122) with following-column/page continuations checked. Raw auto-extraction retained for auditing; this review corrects combat counts and spillover fields."
    },
    "weapons": [
      {
        "name": "Frost morningstar +13",
        "attack_type": "melee",
        "npcAttackBonus": 13,
        "damage": "1d8+3",
        "desc": "Plus 1d6 cold; prebuffed +2 from greater magic weapon."
      },
      {
        "name": "Frost morningstar +8",
        "attack_type": "melee",
        "npcAttackBonus": 8,
        "damage": "1d8+3",
        "desc": "Plus 1d6 cold; second iterative."
      }
    ],
    "activeAbilities": [
      {
        "name": "Sticky Tongue",
        "ability_kind": "ex",
        "desc": "Touch +5 special ability; no damage die; refer to boggard rules."
      },
      {
        "name": "Terrifying Croak",
        "ability_kind": "su",
        "desc": "DC 14 boggard fear effect."
      },
      {
        "name": "Channel Negative Energy",
        "ability_kind": "su",
        "desc": "6/day, 5d6 negative energy, DC 16."
      },
      {
        "name": "Icicle",
        "ability_kind": "sp",
        "desc": "6/day, 1d6+5 cold, Water domain."
      }
    ]
  },
  "speartooth": {
    "stats": {
      "str": 28,
      "dex": 19,
      "con": 19,
      "int": 2,
      "wis": 18,
      "cha": 10
    },
    "text": {
      "sourceReference": "Variant dire tiger (Pathfinder Bestiary, p. 265).",
      "senses": "Low-light vision, scent; Perception +18.",
      "acDetail": "29, touch 13, flat-footed 25 (+4 Dex, +16 natural, −1 size).",
      "hpDetail": "190 (20d8+100).",
      "saveDetail": "Fort +16, Ref +16, Will +12.",
      "movementDetail": "Speed 40 ft.; space 10 ft., reach 5 ft.",
      "maneuverDetail": "CMB +25 (+29 grapple); CMD 39 (43 vs. trip).",
      "attackDetail": "Bite +24 (3d6+9, crit 19–20 plus grab), two claws +24 (2d4+9 plus grab each), and two rake claws +24 (2d4+9 plus grab each) only when rake conditions apply.",
      "specialAttacks": "Pounce; rake (two claws +24, 2d4+9 plus grab each).",
      "skillDetail": "Acrobatics +8, Perception +18, Stealth +23 (+27 in tall grass), Swim +14.",
      "importNotes": "Source-reviewed printed p. 122 (PDF p. 123) with following-column/page continuations checked. Raw auto-extraction retained for auditing; this review corrects combat counts and spillover fields."
    },
    "weapons": [
      {
        "name": "Bite",
        "attack_type": "melee",
        "npcAttackBonus": 24,
        "damage": "3d6+9",
        "desc": "Crit 19–20; grab."
      },
      {
        "name": "Claw 1",
        "attack_type": "melee",
        "npcAttackBonus": 24,
        "damage": "2d4+9",
        "desc": "Grab."
      },
      {
        "name": "Claw 2",
        "attack_type": "melee",
        "npcAttackBonus": 24,
        "damage": "2d4+9",
        "desc": "Grab."
      },
      {
        "name": "Rake claw 1",
        "attack_type": "melee",
        "npcAttackBonus": 24,
        "damage": "2d4+9",
        "desc": "Conditional rake, plus grab."
      },
      {
        "name": "Rake claw 2",
        "attack_type": "melee",
        "npcAttackBonus": 24,
        "damage": "2d4+9",
        "desc": "Conditional rake, plus grab."
      }
    ],
    "npcSkills": [
      {
        "name": "Acrobatics",
        "bonus": 8
      },
      {
        "name": "Perception",
        "bonus": 18
      },
      {
        "name": "Stealth",
        "bonus": 23
      },
      {
        "name": "Swim",
        "bonus": 14
      }
    ],
    "activeAbilities": [
      {
        "name": "Pounce",
        "ability_kind": "ex",
        "desc": "Full natural-attack routine after a charge."
      },
      {
        "name": "Rake",
        "ability_kind": "ex",
        "desc": "Two additional claws +24, 2d4+9 + grab when rake conditions met."
      }
    ]
  },
  "spirit-of-stisshak": {
    "stats": {
      "str": 1,
      "dex": 29,
      "con": 14,
      "int": 15,
      "wis": 16,
      "cha": 14
    },
    "text": {
      "sourceReference": "Variant will-o’-wisp (Pathfinder Bestiary, p. 277).",
      "senses": "Darkvision 60 ft.; Perception +20.",
      "acDetail": "26, touch 26, flat-footed 16 (+5 deflection, +9 Dex, +1 dodge, +1 size).",
      "hpDetail": "65 (10d8+20).",
      "saveDetail": "Fort +5, Ref +12, Will +10.",
      "defenses": "Natural invisibility; immune to most magic (will-o’-wisp immunity).",
      "immunities": "Magic per will-o’-wisp ability (see exceptions in base creature rules).",
      "movementDetail": "Fly 50 ft. (perfect).",
      "attackDetail": "Shock +17 (2d8 electricity).",
      "specialAttacks": "Invoke Stisshak.",
      "spellLikeAbilities": "CL 7th, concentration +9: 1/day—detect thoughts (DC 14), fear (DC 16), modify memory (DC 16), nightmare (DC 17).",
      "qualities": "Feed on fear.",
      "specialAbilities": "Invoke Stisshak (Su): standard action projects a Medium image of a regal lizardfolk king in an empty square within 10 ft.; concentration maintains image. It can speak and move its limbs, but cannot leave that square. Gain +2 circumstance to Intimidate demoralization through image. Any damage to wisp instantly dismisses the image.",
      "languages": "Aklo, Common.",
      "skillDetail": "Acrobatics +19, Bluff +10, Fly +27, Intimidate +15, Knowledge (religion) +12, Perception +20, Sense Motive +17, Stealth +33 (+53 while immobile).",
      "importNotes": "Source-reviewed printed p. 122 (PDF p. 123) with following-column/page continuations checked. Raw auto-extraction retained for auditing; this review corrects combat counts and spillover fields."
    },
    "weapons": [
      {
        "name": "Shock",
        "attack_type": "melee",
        "npcAttackBonus": 17,
        "damage": "2d8",
        "desc": "Electricity damage."
      }
    ],
    "activeAbilities": [
      {
        "name": "Invoke Stisshak",
        "ability_kind": "su",
        "desc": "Standard action projects stationary Medium lizardfolk image within 10 ft.; +2 demoralize via image; concentration to maintain, disappears on damage."
      },
      {
        "name": "Natural Invisibility",
        "ability_kind": "su",
        "desc": "Invisibility is natural; Stealth +53 while immobile."
      },
      {
        "name": "Fear Feeding",
        "ability_kind": "su",
        "desc": "Feed on fear per will-o’-wisp base rules."
      }
    ]
  }
});