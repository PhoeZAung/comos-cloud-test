// Source-reviewed Kingmaker NPC Codex 51–60; printed pp. 99–111.
// Overrides only: raw PDF-extracted NPC catalog and existing Bestiary remain unchanged.
export const KINGMAKER_NPC_CODEX_REVIEWED_051_060=Object.freeze({
  "jaggedbriar-hag": {
    "stats": {
      "str": 29,
      "sr": 17
    },
    "text": {
      "sourceReference": "Variant advanced annis hag (Pathfinder Bestiary 3, pp. 16, 290).",
      "languages": "Abyssal, Aklo, Common, Giant.",
      "acDetail": "24, touch 12, flat-footed 21 (+3 Dex, +12 natural, −1 size).",
      "hpDetail": "80 (7d10+42).",
      "saveDetail": "Fort +10, Ref +8, Will +8.",
      "defenses": "DR 5/bludgeoning; SR 17.",
      "attackDetail": "Bite +15 (1d6+9) and two claws +15 (1d6+9 plus grab each); rend 2d6+13 only if both claws hit.",
      "specialAttacks": "Rend (two claw hits, 2d6+13).",
      "spellLikeAbilities": "CL 7th, concentration +9: 3/day—alter self, fog cloud; 1/day—charm monster (DC 16); 1/month—lesser planar ally.",
      "movementDetail": "Speed 40 ft.; space 10 ft.; reach 10 ft.",
      "maneuverDetail": "CMB +17 (+21 grapple); CMD 30.",
      "importNotes": "Source-reviewed printed p. 99 (PDF p. 100), including adjacent column/page continuations. Stats and routines verified against source; legacy automated extraction retained unchanged."
    },
    "weapons": [
      {
        "name": "Bite",
        "attack_type": "melee",
        "npcAttackBonus": 15,
        "damage": "1d6+9"
      },
      {
        "name": "Claw 1",
        "attack_type": "melee",
        "npcAttackBonus": 15,
        "damage": "1d6+9",
        "desc": "Plus grab"
      },
      {
        "name": "Claw 2",
        "attack_type": "melee",
        "npcAttackBonus": 15,
        "damage": "1d6+9",
        "desc": "Plus grab"
      }
    ],
    "activeAbilities": [
      {
        "name": "Rend",
        "ability_kind": "ex",
        "desc": "2d6+13 extra only if both claws hit; no independent attack roll."
      },
      {
        "name": "Hag Spell-Like Abilities",
        "ability_kind": "sp",
        "desc": "Alter self and fog cloud 3/day; charm monster DC 16 1/day; lesser planar ally 1/month."
      }
    ]
  },
  "jamandi-aldori": {
    "stats": {
      "str": 11
    },
    "text": {
      "sourceReference": "Half-elf fighter 5/Aldori swordlord 9 (Pathfinder Adventurer’s Guide, p. 20).",
      "raceClassLevels": "Half-elf fighter 5/Aldori swordlord 9.",
      "defenses": "Defensive parry +2 (while full attacking with Aldori sword), greater saving slash; immune to sleep.",
      "immunities": "Sleep.",
      "specialAttacks": "Deft strike, shatter confidence; weapon training (heavy blades +1).",
      "movementDetail": "Speed 30 ft.",
      "maneuverDetail": "CMB +14 (+16 disarm); CMD 31 (33 vs. disarm).",
      "combatGear": "Three potions of cure moderate wounds.",
      "gear": "+2 breastplate; +2 Aldori dueling sword; amulet of natural armor +1; belt of physical might +2 (Dex/Con); cloak of resistance +1; ring of protection +2; 23 pp.",
      "attackDetail": "+2 Aldori dueling sword +23/+18/+13 (1d8+10, critical 17–20).",
      "specialAbilities": "Adaptive Tactics (Ex): reduce fighting defensively/Combat Expertise attack penalty by 2. When attacking the same target as the previous round, swift Sense Motive DC 10 + target BAB for +2 circumstance bonus to attacks or AC against it until next turn. Defensive Parry (Ex): +2 dodge AC during full attack with Aldori sword. Deft Strike (Ex): add Dex instead of Str to sword damage when wielding without shield/off-hand weapon; no 1.5× Dex two-handed. Dexterous Duelist (Ex): retain Dex bonus for Acrobatics/Climb with free hand and stand from prone without provoking from an enemy struck while prone this turn. Greater Saving Slash (Ex): immediate action with sword, 50% chance to downgrade a melee critical to a normal hit.",
      "acDetail": "25, touch 16, flat-footed 21 (+8 armor, +2 deflection, +4 Dex, +1 natural).",
      "hpDetail": "123 (14d10+42).",
      "importNotes": "Source-reviewed printed p. 100 (PDF p. 101), including adjacent column/page continuations. Stats and routines verified against source; legacy automated extraction retained unchanged."
    },
    "activeAbilities": [
      {
        "name": "Adaptive Tactics",
        "ability_kind": "ex",
        "desc": "Reduce fighting defensively/Combat Expertise attack penalty by 2; swift Sense Motive DC 10 + opponent BAB against repeat target grants +2 attack or AC."
      },
      {
        "name": "Defensive Parry",
        "ability_kind": "ex",
        "desc": "+2 dodge AC on full attack with Aldori dueling sword."
      },
      {
        "name": "Deft Strike",
        "ability_kind": "ex",
        "desc": "Use Dex instead of Str on Aldori sword damage; requires empty off-hand, no 1.5× for two hands."
      },
      {
        "name": "Dexterous Duelist",
        "ability_kind": "ex",
        "desc": "Free hand prevents loss of Dex on Acrobatics/Climb; conditional stand from prone without provoking."
      },
      {
        "name": "Greater Saving Slash",
        "ability_kind": "ex",
        "desc": "Immediate action with Aldori sword, 50% chance to downgrade incoming melee critical to ordinary hit."
      }
    ]
  },
  "jin-durwhimmer": {
    "stats": {
      "str": null,
      "con": null
    },
    "text": {
      "sourceReference": "Male gnome ghost ex-druid 8 (Pathfinder Bestiary 144).",
      "raceClassLevels": "Male gnome ghost ex-druid 8.",
      "qualities": "Gnome magic.",
      "movementDetail": "Fly 30 ft. (perfect); incorporeal.",
      "defenses": "Channel resistance +4, defensive training, incorporeal, rejuvenation; undead immunities.",
      "attackDetail": "Corrupting touch +9 (9d6); frightful moan DC 19; telekinesis DC 19.",
      "spellLikeAbilities": "CL 8th, concentration +13: 1/day—dancing lights, ghost sound (DC 16), prestidigitation, speak with animals.",
      "hpDetail": "95 (8d8+56).",
      "acDetail": "19, touch 19, flat-footed 16 (+5 deflection, +2 Dex, +1 dodge, +1 size).",
      "importNotes": "Source-reviewed printed p. 101 (PDF p. 102), including adjacent column/page continuations. Stats and routines verified against source; legacy automated extraction retained unchanged."
    },
    "activeAbilities": [
      {
        "name": "Corrupting Touch",
        "ability_kind": "su",
        "desc": "Melee incorporeal touch +9, 9d6 damage."
      },
      {
        "name": "Frightful Moan",
        "ability_kind": "su",
        "desc": "Area fear effect DC 19; adjudicate using printed ghost rules."
      },
      {
        "name": "Telekinesis",
        "ability_kind": "su",
        "desc": "Ghost telekinesis DC 19."
      },
      {
        "name": "Rejuvenation",
        "ability_kind": "su",
        "desc": "Ghost rejuvenation; apply published ghost rule."
      }
    ]
  },
  "jurgrindor": {
    "hpCurrent": 40,
    "stats": {
      "str": 23
    },
    "text": {
      "sourceReference": "Wounded frost giant (Pathfinder Bestiary 149).",
      "hpDetail": "133 total (14d8+70), **currently 40 HP** in printed encounter.",
      "specialAbilities": "Grievously Wounded: exhausted with 10 Strength damage already applied; cannot catch or throw rocks; after any turn with more than one move action, 50% chance to reopen wounds for 1d6 bleed damage. Printed CR 3 is for wounded state.",
      "defenses": "Rock catching ordinarily, but cannot use while grievously wounded; immune to cold; vulnerable to fire.",
      "weaknesses": "Grievously wounded, fire vulnerability.",
      "attackDetail": "Two slams +10, 1d8+1 each; no rock attacks while wounded.",
      "movementDetail": "Speed 20 ft.; space 10 ft.; reach 10 ft.",
      "maneuverDetail": "CMB +12 (+14 overrun, +14 sunder); CMD 18 (20 vs. overrun and sunder).",
      "importNotes": "Source-reviewed printed p. 101 (PDF p. 102), including adjacent column/page continuations. Stats and routines verified against source; legacy automated extraction retained unchanged."
    },
    "weapons": [
      {
        "name": "Slam 1",
        "attack_type": "melee",
        "npcAttackBonus": 10,
        "damage": "1d8+1"
      },
      {
        "name": "Slam 2",
        "attack_type": "melee",
        "npcAttackBonus": 10,
        "damage": "1d8+1"
      }
    ],
    "activeAbilities": [
      {
        "name": "Grievously Wounded",
        "ability_kind": "ex",
        "desc": "Starts 40/133 HP, exhausted with 10 Str damage. Cannot throw/catch rocks. End of any turn with more than a single move action: 50% chance to suffer 1d6 bleed."
      }
    ]
  },
  "kargstaad": {
    "stats": {
      "str": 35
    },
    "text": {
      "sourceReference": "Variant male frost giant barbarian 10 (Pathfinder Bestiary 149).",
      "raceClassLevels": "Variant male frost giant barbarian 10.",
      "attackDetail": "Primary multiweapon full attack: main +2 cold iron handaxe +32/+27/+22/+17 (1d8+14, crit 19–20/×3), three off-hand +2 cold iron handaxes +32 (1d8+8, crit 19–20/×3) each. OR four slams +26 (1d8+6) each. Alternatively rock +17 (1d8+18), range 120 ft.",
      "qualities": "Fast movement; multi-armed (four arms).",
      "movementDetail": "Speed 50 ft. (35 ft. in armor); space/reach 10 ft.",
      "maneuverDetail": "CMB +33 (+35 bull rush); CMD 49 (51 vs. bull rush).",
      "defenses": "Improved uncanny dodge, rock catching, trap sense +3; DR 2/—; immune cold.",
      "specialAttacks": "Rage 29 rounds/day; guarded stance +2, no escape, powerful blow +3, quick reflexes, swift foot +5 ft.; rock throwing 120 ft.",
      "gear": "+3 hide armor; four +2 cold iron handaxes; amulet of natural armor +3; ring of protection +3.",
      "importNotes": "Source-reviewed printed p. 102 (PDF p. 103), including adjacent column/page continuations. Stats and routines verified against source; legacy automated extraction retained unchanged."
    },
    "weapons": [
      {
        "name": "Main handaxe +32",
        "attack_type": "melee",
        "npcAttackBonus": 32,
        "damage": "1d8+14",
        "desc": "Main-hand routine only; critical 19–20/×3."
      },
      {
        "name": "Main handaxe +27",
        "attack_type": "melee",
        "npcAttackBonus": 27,
        "damage": "1d8+14",
        "desc": "Main-hand routine only; critical 19–20/×3."
      },
      {
        "name": "Main handaxe +22",
        "attack_type": "melee",
        "npcAttackBonus": 22,
        "damage": "1d8+14",
        "desc": "Main-hand routine only; critical 19–20/×3."
      },
      {
        "name": "Main handaxe +17",
        "attack_type": "melee",
        "npcAttackBonus": 17,
        "damage": "1d8+14",
        "desc": "Main-hand routine only; critical 19–20/×3."
      },
      {
        "name": "Off-hand handaxe 1",
        "attack_type": "melee",
        "npcAttackBonus": 32,
        "damage": "1d8+8",
        "desc": "Three off-hand axes in multiweapon routine; 19–20/×3."
      },
      {
        "name": "Off-hand handaxe 2",
        "attack_type": "melee",
        "npcAttackBonus": 32,
        "damage": "1d8+8",
        "desc": "Three off-hand axes in multiweapon routine; 19–20/×3."
      },
      {
        "name": "Off-hand handaxe 3",
        "attack_type": "melee",
        "npcAttackBonus": 32,
        "damage": "1d8+8",
        "desc": "Three off-hand axes in multiweapon routine; 19–20/×3."
      },
      {
        "name": "Alternative slam 1",
        "attack_type": "melee",
        "npcAttackBonus": 26,
        "damage": "1d8+6",
        "desc": "Four slams are an alternate full attack, never in handaxe routine."
      },
      {
        "name": "Alternative slam 2",
        "attack_type": "melee",
        "npcAttackBonus": 26,
        "damage": "1d8+6",
        "desc": "Four slams are an alternate full attack, never in handaxe routine."
      },
      {
        "name": "Alternative slam 3",
        "attack_type": "melee",
        "npcAttackBonus": 26,
        "damage": "1d8+6",
        "desc": "Four slams are an alternate full attack, never in handaxe routine."
      },
      {
        "name": "Alternative slam 4",
        "attack_type": "melee",
        "npcAttackBonus": 26,
        "damage": "1d8+6",
        "desc": "Four slams are an alternate full attack, never in handaxe routine."
      },
      {
        "name": "Rock",
        "attack_type": "ranged",
        "npcAttackBonus": 17,
        "damage": "1d8+18",
        "desc": "Ranged alternative; range increment 120 ft."
      }
    ],
    "activeAbilities": [
      {
        "name": "Rage",
        "ability_kind": "ex",
        "desc": "29 rounds/day; printed stats already account for rage."
      },
      {
        "name": "Four Arms",
        "ability_kind": "ex",
        "desc": "Use one main-hand iterative sequence plus three off-hand axes, OR four slams; alternatives cannot be combined."
      }
    ]
  },
  "kereek": {
    "stats": {
      "str": 6
    },
    "text": {
      "sourceReference": "Male kobold sorcerer 6 (Pathfinder Bestiary 183).",
      "specialAttacks": "Draconic bloodline claws: two 1d3 magic-weapon claws for 5 rounds/day; not part of dagger routine.",
      "spellsKnown": "Sorcerer (CL 6th, concentration +8): 3rd (3/day)—slow (DC 15); 2nd (6/day)—invisibility, resist energy, scorching ray; 1st (7/day)—burning hands (DC 13), mage armor, magic missile, obscuring mist, shield; 0 at will—acid splash, detect magic, mage hand, message, prestidigitation, ray of frost, read magic. Draconic bloodline.",
      "energyResistances": "Fire 5.",
      "weaknesses": "Light sensitivity.",
      "qualities": "Bloodline arcana: +1 damage per die for matching energy descriptor; crafty.",
      "combatGear": "Wand of burning hands, CL 5, 18 charges.",
      "gear": "Dagger, amulet of natural armor +1, 98 gp.",
      "attackDetail": "Dagger +2 (1d3−2, crit 19–20); alternative draconic bloodline two claws (1d3 each), 5 rounds/day.",
      "importNotes": "Source-reviewed printed p. 102 (PDF p. 103), including adjacent column/page continuations. Stats and routines verified against source; legacy automated extraction retained unchanged."
    },
    "activeAbilities": [
      {
        "name": "Draconic Claws",
        "ability_kind": "su",
        "desc": "Two claw natural attacks each dealing 1d3, treated as magic weapons; available 5 rounds/day."
      },
      {
        "name": "Draconic Resistance",
        "ability_kind": "ex",
        "desc": "Fire resistance 5."
      }
    ]
  },
  "the-knurly-witch": {
    "stats": {
      "str": 25,
      "casterLevel": 17,
      "sr": 20
    },
    "text": {
      "sourceReference": "Female annis hag cleric of Gyronna 17 (Pathfinder Bestiary 3, p. 16).",
      "raceClassLevels": "Female annis hag cleric of Gyronna 17.",
      "aura": "Destructive aura (30 ft., +8, 17 rounds/day); madness aura (30 ft., DC 24, 17 rounds/day).",
      "defenses": "DR 5/bludgeoning; SR 20.",
      "specialAttacks": "Channel negative energy 4/day (DC 19, 9d6); destructive smite (+8, 9/day); rend (two claws, 2d6+10).",
      "attackDetail": "Bite +25 (1d6+7); claws +26 (1d6+7, crit 19–20 plus grab) twice; rend only on two claw hits.",
      "spellLikeAbilities": "Annis: CL 7th concentration +8, alter self/fog cloud 3/day. Domains: CL 17th concentration +23, vision of madness (+8/−8) 9/day.",
      "spellsPrepared": "Cleric, CL 17th concentration +23: 9th—implosion (DC 25), weird [domain] (DC 25); 8th—fire storm (DC 24), scintillating pattern [domain], summon monster VIII; 7th—destruction (DC 23), insanity [domain] (DC 23), repulsion (DC 23), summon monster VII; 6th—blade barrier (DC 22), greater dispel magic, harm [domain] (DC 22), heal (2), word of recall; 5th—greater command (DC 21), flame strike (2, DC 21), shout [domain] (DC 21), wall of stone (2); 4th—air walk, confusion [domain] (DC 20), cure critical wounds, divine power, sending, spell immunity; 3rd—bestow curse (DC 19), contagion (DC 19), cure serious wounds (2), dispel magic, rage [domain]; 2nd—cure moderate wounds (3), hold person (2, DC 18), spiritual weapon, touch of idiocy [domain]; 1st—command (DC 17), lesser confusion [domain] (DC 17), cure light wounds (5); 0—bleed (DC 16), detect magic, mending, read magic. Domains Destruction and Madness.",
      "gear": "+5 leather armor, belt of physical might +2 (Dex, Con), ring of protection +4, scarab of protection (9 charges).",
      "combatGear": "Strand of prayer beads.",
      "skillDetail": "Intimidate +21, Knowledge (religion) +21, Perception +29, Sense Motive +8, Spellcraft +21.",
      "hpDetail": "323 (24 HD; 17d8+7d10+209).",
      "importNotes": "Source-reviewed printed p. 102 (PDF p. 103), including adjacent column/page continuations. Stats and routines verified against source; legacy automated extraction retained unchanged."
    },
    "weapons": [
      {
        "name": "Bite",
        "attack_type": "melee",
        "npcAttackBonus": 25,
        "damage": "1d6+7"
      },
      {
        "name": "Claw 1",
        "attack_type": "melee",
        "npcAttackBonus": 26,
        "damage": "1d6+7",
        "desc": "Critical 19–20; grab."
      },
      {
        "name": "Claw 2",
        "attack_type": "melee",
        "npcAttackBonus": 26,
        "damage": "1d6+7",
        "desc": "Critical 19–20; grab."
      }
    ],
    "npcSkills": [
      {
        "name": "Intimidate",
        "bonus": 21
      },
      {
        "name": "Knowledge (religion)",
        "bonus": 21
      },
      {
        "name": "Perception",
        "bonus": 29
      },
      {
        "name": "Sense Motive",
        "bonus": 8
      },
      {
        "name": "Spellcraft",
        "bonus": 21
      }
    ],
    "activeAbilities": [
      {
        "name": "Channel Negative Energy",
        "ability_kind": "su",
        "desc": "4/day, 9d6, DC 19."
      },
      {
        "name": "Destructive Aura",
        "ability_kind": "su",
        "desc": "30 ft., +8 damage, 17 rounds/day."
      },
      {
        "name": "Aura of Madness",
        "ability_kind": "su",
        "desc": "30 ft., DC 24, 17 rounds/day."
      },
      {
        "name": "Rend",
        "ability_kind": "ex",
        "desc": "2d6+10 if both claw attacks hit; no independent attack roll."
      }
    ]
  },
  "kob-moleg": {
    "stats": {
      "str": 24
    },
    "text": {
      "sourceReference": "Male hill giant fighter 9 (Pathfinder Bestiary 150).",
      "raceClassLevels": "Male hill giant fighter 9.",
      "defenses": "Fortification 25% from +4 light fortification hide armor; rock catching.",
      "attackDetail": "+3 greatclub +29/+24/+19/+14 (2d8+17/19–20); OR two slams +18 (1d8+4 each); OR ranged rock +12/+7/+2/−3 (1d8+10).",
      "specialAttacks": "Rock throwing (120 ft.); weapon training: hammers +2, natural +1.",
      "gear": "+4 light fortification hide armor, +3 greatclub.",
      "movementDetail": "Speed 40 ft.; space/reach 10 ft.",
      "importNotes": "Source-reviewed printed p. 103 (PDF p. 104), including adjacent column/page continuations. Stats and routines verified against source; legacy automated extraction retained unchanged."
    },
    "weapons": [
      {
        "name": "Greatclub +29",
        "attack_type": "melee",
        "npcAttackBonus": 29,
        "damage": "2d8+17",
        "desc": "Club full attack; crit 19–20."
      },
      {
        "name": "Greatclub +24",
        "attack_type": "melee",
        "npcAttackBonus": 24,
        "damage": "2d8+17",
        "desc": "Club full attack; crit 19–20."
      },
      {
        "name": "Greatclub +19",
        "attack_type": "melee",
        "npcAttackBonus": 19,
        "damage": "2d8+17",
        "desc": "Club full attack; crit 19–20."
      },
      {
        "name": "Greatclub +14",
        "attack_type": "melee",
        "npcAttackBonus": 14,
        "damage": "2d8+17",
        "desc": "Club full attack; crit 19–20."
      },
      {
        "name": "Slam 1",
        "attack_type": "melee",
        "npcAttackBonus": 18,
        "damage": "1d8+4",
        "desc": "Alternative only."
      },
      {
        "name": "Slam 2",
        "attack_type": "melee",
        "npcAttackBonus": 18,
        "damage": "1d8+4",
        "desc": "Alternative only."
      },
      {
        "name": "Rock +12",
        "attack_type": "ranged",
        "npcAttackBonus": 12,
        "damage": "1d8+10",
        "desc": "Alternative ranged sequence, range 120 ft."
      },
      {
        "name": "Rock +7",
        "attack_type": "ranged",
        "npcAttackBonus": 7,
        "damage": "1d8+10",
        "desc": "Alternative ranged sequence, range 120 ft."
      },
      {
        "name": "Rock +2",
        "attack_type": "ranged",
        "npcAttackBonus": 2,
        "damage": "1d8+10",
        "desc": "Alternative ranged sequence, range 120 ft."
      },
      {
        "name": "Rock +-3",
        "attack_type": "ranged",
        "npcAttackBonus": -3,
        "damage": "1d8+10",
        "desc": "Alternative ranged sequence, range 120 ft."
      }
    ],
    "activeAbilities": [
      {
        "name": "Fortification",
        "ability_kind": "ex",
        "desc": "25% chance to negate critical/precision damage from armor."
      },
      {
        "name": "Rock Throwing",
        "ability_kind": "ex",
        "desc": "120-ft. range; separate ranged attacks; cannot combine with melee routine."
      }
    ]
  },
  "korog": {
    "stats": {
      "str": 24,
      "con": null,
      "sr": 27
    },
    "text": {
      "sourceReference": "Human graveknight ranger 15 (Pathfinder Bestiary 3, p. 138).",
      "aura": "Sacrilegious aura, 30 ft., DC 23.",
      "defenses": "Channel resistance +4; evasion; rejuvenation; DR 10/magic; SR 27; immune electricity and undead traits.",
      "immunities": "Electricity, undead traits.",
      "specialAttacks": "Channel destruction (+3d6 electricity per hit with earth breaker); devastating blast 10d6 electricity DC 23, 3/day; undead mastery 75 HD DC 23; favored enemies aberrations +4, dragons +2, humans +6, undead +2.",
      "attackDetail": "+3 earth breaker +28/+23/+18 (2d6+15, crit 19–20/×3 plus 3d6 electricity), OR slam +19 (1d4+5).",
      "spellsPrepared": "Ranger spells (CL 12th, concentration +16): 4th—freedom of movement, summon nature’s ally IV; 3rd—burst of speed, instant enemy, reduce animal; 2nd—barkskin, protection from energy, spike growth (DC 16); 1st—alarm, jump, lead blades, resist energy.",
      "gear": "+3 full plate, +3 earth breaker, amulet of natural armor +1, headband of mental prowess +2 (Wis/Cha), ring of protection +1.",
      "qualities": "Camouflage, graveknight armor, hunter’s bond (companions), phantom mount, ruinous revivification (electricity), swift tracker, track +7, wild empathy +21, favored terrains (mountains +2, plains +4, underground +4).",
      "importNotes": "Source-reviewed printed p. 104 (PDF p. 105), including adjacent column/page continuations. Stats and routines verified against source; legacy automated extraction retained unchanged."
    },
    "activeAbilities": [
      {
        "name": "Channel Destruction",
        "ability_kind": "su",
        "desc": "Earth-breaker hits deal +3d6 electricity, not a separate attack roll."
      },
      {
        "name": "Devastating Blast",
        "ability_kind": "su",
        "desc": "3/day, 10d6 electricity, DC 23."
      },
      {
        "name": "Undead Mastery",
        "ability_kind": "su",
        "desc": "Control up to 75 HD undead; DC 23."
      },
      {
        "name": "Sacrilegious Aura",
        "ability_kind": "su",
        "desc": "30 ft., DC 23; see graveknight rules."
      }
    ]
  },
  "kressle": {
    "stats": {
      "str": 16
    },
    "text": {
      "combatGear": "Potion of cure light wounds.",
      "gear": "Studded leather, dagger, two masterwork handaxes, 85 gp.",
      "attackDetail": "Full two-weapon attack: one mwk handaxe +5 (1d6+3/×3) and another mwk handaxe +5 (1d6+3/×3). OR a single mwk handaxe +7 (1d6+3/×3). OR ranged dagger +3 (1d4+3/19–20).",
      "specialAttacks": "Combat style (two-weapon fighting); favored enemy humans +2.",
      "acDetail": "15, touch 12, flat-footed 13 (+3 armor, +1 Dex, +1 dodge).",
      "importNotes": "Source-reviewed printed p. 104 (PDF p. 105), including adjacent column/page continuations. Stats and routines verified against source; legacy automated extraction retained unchanged."
    },
    "weapons": [
      {
        "name": "Main handaxe",
        "attack_type": "melee",
        "npcAttackBonus": 5,
        "damage": "1d6+3",
        "desc": "Two-weapon full attack; crit ×3."
      },
      {
        "name": "Off-hand handaxe",
        "attack_type": "melee",
        "npcAttackBonus": 5,
        "damage": "1d6+3",
        "desc": "Two-weapon full attack; crit ×3."
      },
      {
        "name": "Single handaxe",
        "attack_type": "melee",
        "npcAttackBonus": 7,
        "damage": "1d6+3",
        "desc": "Single-weapon alternative; crit ×3."
      },
      {
        "name": "Dagger",
        "attack_type": "ranged",
        "npcAttackBonus": 3,
        "damage": "1d4+3",
        "desc": "Ranged alternative; critical 19–20."
      }
    ]
  }
});