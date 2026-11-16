// Kingmaker Bestiary (First Edition), NPC Codex source review 91–100.
// User-supplied Bestiary.pdf, printed pages 123–130 / PDF pages 124–131.
// Concise game-stat transcription and rules summaries, without adventure narration.
const melee=(name,npcAttackBonus,damage,desc='')=>({name,attack_type:'melee',npcAttackBonus,damage,...(desc?{desc}:{})});
const ranged=(name,npcAttackBonus,damage,desc='')=>({name,attack_type:'ranged',npcAttackBonus,damage,...(desc?{desc}:{})});
const ability=(name,ability_kind,desc)=>({name,ability_kind,desc});
export const KINGMAKER_NPC_CODEX_REVIEWED_091_100=Object.freeze({
 'stag-lord':{
  stats:{str:14,dex:18,con:14,int:10,wis:8,cha:12,casterLevel:null},
  text:{
   senses:'Perception +10.',aura:null,
   defenses:'Evasion, trap sense +1, uncanny dodge.',weaknesses:'Drunken stupor (sickened; printed stats already reflect it).',
   acDetail:'19, touch 15, flat-footed 14 (+3 armor, +4 Dex, +1 dodge, +1 natural).',
   hpDetail:'70 (8 HD; 5d8+3d10+27).',saveDetail:'Fort +4, Ref +9, Will +1.',
   attackDetail:'Melee masterwork longsword +7/+2 (1d8, 19–20); ranged +1 composite longbow +10/+5 (1d8+1, ×3).',
   specialAttacks:'Archery combat style, favored enemy (humans +2), sneak attack +3d6.',
   skillDetail:'Acrobatics +13, Appraise +9, Climb +11, Intimidate +10, Knowledge (geography) +3, Perception +10, Stealth +13, Survival +8, Swim +11.',
   qualities:'Favored terrain (plains +2); rogue talents (combat trick, weapon training); track +1; trapfinding +2; wild empathy +4.',
   combatGear:'Two potions of cure moderate wounds.',
   gear:'+1 leather armor; +1 composite longbow (+2 Str) with 20 arrows; masterwork longsword; amulet of natural armor +1; stag’s helm.',
   specialAbilities:'Drunken Stupor: while permanently sickened, the printed combat totals already include the −2 sickened adjustments and CR is 6. When sober, add +2 to attack rolls, weapon damage, saving throws, skills and ability checks; CR becomes 7. Stag’s Helm: item grants +2 Perception; 1/day as a free action, the next ranged shot against a foe within 30 ft. treats that foe as flat-footed (expires if no shot within 1 round). A wearer devoted to Erastil gains up to 3/day.',
   importNotes:'Source-reviewed printed pp. 123–124 (PDF pp. 124–125). Removed stag-helm artifact aura from character fields, restored split-column skills/gear, and kept sobering adjustments distinct from the printed sickened attack totals.'
  },
  weapons:[melee('Masterwork longsword +7',7,'1d8','Critical 19–20; already sickened.'),melee('Masterwork longsword +2',2,'1d8','Critical 19–20; second iterative.'),ranged('+1 composite longbow +10',10,'1d8+1','Critical ×3; already sickened.'),ranged('+1 composite longbow +5',5,'1d8+1','Critical ×3; second iterative.')],
  npcSkills:[['Acrobatics',13],['Appraise',9],['Climb',11],['Intimidate',10],['Knowledge (geography)',3],['Perception',10],['Stealth',13],['Survival',8],['Swim',11]].map(([name,bonus])=>({name,bonus})),
  activeAbilities:[ability('Drunken Stupor','ex','Printed CR 6 already sickened. If sober, CR 7 and +2 to attacks, weapon damage, saves, skill checks and ability checks.'),ability('Stag’s Helm (equipment)','other','Item grants +2 Perception; insight shot 1/day (Erastil devotee 3/day), free action, flat-footed target within 30 ft., expires if unused after 1 round.')]
 },
 'svetlana-leveton':{
  stats:{str:8,dex:13,con:14,int:10,wis:9,cha:11},
  text:{
   acDetail:'13, touch 11, flat-footed 12 (+2 armor, +1 Dex).',hpDetail:'22 (3d8+9).',saveDetail:'Fort +3, Ref +4, Will +2.',
   attackDetail:'Melee dagger +1 (1d4−1/19–20).',
   skillDetail:'Diplomacy +6, Intimidate +6, Knowledge (nobility) +6, Perception +7, Profession (cook) +5, Profession (innkeeper) +8, Sense Motive +7.',
   feats:'Alertness, Lightning Reflexes, Skill Focus (Profession [innkeeper]).',languages:'Common.',gear:'Leather armor; dagger.',
   importNotes:'Source-reviewed printed pp. 124–125 (PDF pp. 125–126). Correct full skills and gear; removed neighboring Tartuccio narrative from equipment.'
  },weapons:[melee('Dagger',1,'1d4-1','Critical 19–20.')]
 },
 'tartuccio':{
  stats:{str:8,dex:14,con:10,int:12,wis:13,cha:18},
  text:{
   sourceReference:'Male gnome sorcerer 5; Arcane bloodline.',
   acDetail:'14, touch 13, flat-footed 12 (+1 armor, +2 Dex, +1 size).',hpDetail:'25 (5d6+5).',saveDetail:'Fort +1, Ref +3, Will +5 (+2 versus illusions).',
   senses:'Low-light vision; Perception +5.',defenses:'Defensive training (gnome).',specialAttacks:'Hatred (gnome racial ability).',
   spellLikeAbilities:'Gnome spell-like abilities, CL 5th concentration +9: 1/day each—dancing lights, ghost sound (DC 15), prestidigitation, speak with animals.',
   spellsKnown:'Sorcerer CL 5th, concentration +9: 2nd (5/day)—detect thoughts (DC 16), invisibility, mirror image; 1st (7/day)—cause fear (DC 15), identify, shield, silent image (DC 16), unseen servant; 0 (at will)—acid splash, daze (DC 14), light, mage hand, message, read magic. Arcane bloodline.',
   qualities:'Arcane bond (Tickbiter, raven familiar); arcane bloodline (+1 DC for level-raising metamagic); change shape (alter self into purple-scaled kobold); gnome magic; metamagic adept 1/day.',
   attackDetail:'Melee masterwork cold iron sickle +3 (1d4−1).',
   combatGear:'Wand of magic missile, CL 3rd, 28 charges.',gear:'Masterwork cold iron sickle; bracers of armor +1.',
   importNotes:'Source-reviewed printed pp. 124–125 (PDF pp. 125–126). Gnome SLAs are separate from sorcerer spells; restored familiar, form change and the second-page equipment.'
  },
  weapons:[melee('Masterwork cold iron sickle',3,'1d4-1')],
  activeAbilities:[ability('Gnome Spell-Like Abilities','sp','Each 1/day, CL 5th: dancing lights, ghost sound DC 15, prestidigitation, speak with animals.'),ability('Change Shape','su','Alter self into the printed purple-scaled kobold form.'),ability('Metamagic Adept','su','Arcane-bloodline power, 1/day.')]
 },
 'terrion-numesti':{
  stats:{str:16,dex:14,con:16,int:8,wis:10,cha:12},
  text:{
   acDetail:'13, touch 13, flat-footed 10 (+2 Dex, +1 dodge); unarmored as printed.',hpDetail:'109 (10d10+50).',saveDetail:'Fort +10, Ref +5, Will +5 (+3 vs. fear).',
   attackDetail:'Melee unarmed strike +13/+8 (1d3+3 nonlethal).',
   specialAttacks:'Weapon training (heavy blades +2, bows +1).',qualities:'Armor training 2.',
   feats:'Combat Reflexes, Dodge, Intimidating Prowess, Iron Will, Point-Blank Shot, Power Attack, Precise Shot, Shield Focus, Toughness, Weapon Focus (longbow), Weapon Focus (longsword), Weapon Specialization (longsword).',
   skillDetail:'Climb +11, Intimidate +12, Perception +5, Ride +10.',
   gear:null,combatGear:null,
   importNotes:'Source-reviewed printed p. 125 (PDF p. 126). The fighter is unarmored, carries no listed gear, and uses nonlethal unarmed iterative attacks. Removed Tulvak/Vesket text from qualities.'
  },weapons:[melee('Unarmed strike +13',13,'1d3+3','Nonlethal.'),melee('Unarmed strike +8',8,'1d3+3','Nonlethal; second iterative.')]
 },
 'tulvak':{
  stats:{str:24,dex:20,con:19,int:19,wis:19,cha:18,space:5,reach:5,sr:16,casterLevel:9},
  text:{
   sourceReference:'Female variant advanced green hag (Pathfinder Bestiary, pp. 167, 288).',raceClassLevels:'Female variant advanced green hag.',
   senses:'Darkvision 90 ft.; Perception +25.',
   acDetail:'25, touch 15, flat-footed 20 (+5 Dex, +10 natural).',hpDetail:'147 (14d10+70).',saveDetail:'Fort +10, Ref +14, Will +13.',
   movementDetail:'Speed 30 ft.; swim 30 ft.; space 5 ft., reach 5 ft. (10 ft. with glaive).',
   attackDetail:'Alternative melee routines: +1 keen vicious glaive +22/+17/+12 (1d10+11, crit 19–20/×3, plus 2d6 vicious damage), OR two claws +21 (1d4+7 plus green-hag weakness each).',
   spellLikeAbilities:'CL 9th concentration +13: constant—pass without trace, tongues, water breathing; at will—alter self, dancing lights, ghost sound (DC 14), invisibility, pyrotechnics (DC 16), tree shape, whispering wind.',
   qualities:'Mimicry.',languages:'Aklo, Common, Giant; tongues.',gear:'+1 keen vicious glaive.',
   importNotes:'Source-reviewed printed pp. 125–126 (PDF pp. 126–127). Two claws separated and kept distinct from iterative glaive attacks; removed sidebar text from gear and attack description.'
  },
  weapons:[melee('Keen vicious glaive +22',22,'1d10+11','Critical 19–20/×3; plus 2d6 vicious; alternative routine.'),melee('Keen vicious glaive +17',17,'1d10+11','Critical 19–20/×3; plus 2d6 vicious; alternative routine.'),melee('Keen vicious glaive +12',12,'1d10+11','Critical 19–20/×3; plus 2d6 vicious; alternative routine.'),melee('Claw 1',21,'1d4+7','Alternative natural attack routine; plus weakness.'),melee('Claw 2',21,'1d4+7','Alternative natural attack routine; plus weakness.')],
  activeAbilities:[ability('Green Hag Weakness','su','Each claw can inflict the green hag weakness special attack; consult the Bestiary rule for its save and duration.'),ability('Mimicry','ex','Can imitate voices and sounds as described in green hag rules.')]
 },
 'vesket':{
  stats:{str:22,dex:12,con:20,int:15,wis:14,cha:16},
  text:{
   sourceReference:'Male advanced lizardfolk fighter 4 (Pathfinder Bestiary, pp. 195, 288).',raceClassLevels:'Male advanced lizardfolk fighter 4.',
   acDetail:'21, touch 11, flat-footed 20 (+3 armor, +1 Dex, +7 natural).',hpDetail:'71 (6 HD; 2d8+4d10+40).',saveDetail:'Fort +12, Ref +2, Will +5 (+1 versus fear).',
   movementDetail:'Speed 30 ft., swim 15 ft.',
   attackDetail:'Melee +1 keen trident +13 (1d8+9/19–20) plus bite +9 (1d4+3) and one claw +9 (1d4+3); ranged javelin +6 (1d6+6).',
   qualities:'Armor training 1; hold breath.',languages:'Common, Draconic.',
   combatGear:'Potion of cure serious wounds.',gear:'+1 leather armor, +1 keen trident, five javelins, two gold armbands (100 gp each).',
   importNotes:'Source-reviewed printed p. 126 (PDF p. 127). The weapon, bite and single claw are one combined melee routine; cleaned gear spill and kept swim speed.'
  },weapons:[melee('+1 keen trident',13,'1d8+9','Critical 19–20.'),melee('Bite',9,'1d4+3'),melee('Claw',9,'1d4+3'),ranged('Javelin',6,'1d6+6','Alternative ranged action.')]
 },
 'villamor-koth':{
  stats:{str:18,dex:14,con:18,int:8,wis:12,cha:10,dr:4},
  text:{
   acDetail:'Normal (not raging) AC 25, touch 16, flat-footed 22 (+9 armor, +3 deflection, +2 Dex, +1 dodge). Raging AC 23, touch 14, flat-footed 20.',
   hpDetail:'Normal 205 (16d12+96). Greater rage variant 253 (16d12+144).',
   saveDetail:'Normal Fort +14, Ref +7, Will +8. Raging Fort +17, Ref +7, Will +11 (+4 vs. enchantment).',
   movementDetail:'Speed 40 ft., or 30 ft. in armor.',
   defenses:'Improved uncanny dodge, indomitable will, trap sense +5; DR 4/— normal, DR 7/— in greater rage.',
   specialAttacks:'Greater rage 38 rounds/day; guarded life, increase DR +3, knockback, no escape, rolling dodge +3, unexpected strike.',
   attackDetail:'Normal: +1 vicious greataxe +22/+17/+12/+7 (1d12+7/19–20/×3 plus 2d6 vicious), OR lance +20/+15/+10/+5 (1d8+6/×3). Raging: +1 vicious greataxe +25/+20/+15/+10 (1d12+11/19–20/×3 plus 2d6 vicious). Routines are alternatives; do not combine.',
   tactics:'Printed main stat block explicitly excludes rage (restrained). Alternate raging block is printed on the next page.',
   combatGear:'Two potions of barkskin +5.',gear:'+5 hide armor, +1 vicious greataxe, lance, belt of mighty constitution +2, ring of protection +3.',
   importNotes:'Source-reviewed printed pp. 126–127 (PDF pp. 127–128). Restored complete alternate greater-rage stat block (HP/AC/DR/saves/strength/attacks), without treating raging as permanent baseline.'
  },
  variants:[
   {name:'Villamor Koth (restrained)',level:16,hp:205,pdfPage:127,stats:{str:18,dex:14,con:18,int:8,wis:12,cha:10,ac:25,touch:16,flat:22,fort:14,ref:7,will:8,cmb:20,cmd:36,dr:4},text:{attackDetail:'Greataxe +22/+17/+12/+7 or lance +20/+15/+10/+5.'}},
   {name:'Villamor Koth (greater rage)',level:16,hp:253,pdfPage:128,stats:{str:24,dex:14,con:24,int:8,wis:12,cha:10,ac:23,touch:14,flat:20,fort:17,ref:7,will:11,cmb:23,cmd:37,dr:7},text:{attackDetail:'Greataxe +25/+20/+15/+10 (1d12+11 plus 2d6 vicious); Intimidate +22.'}}
  ],
  weapons:[...([22,17,12,7].map((v,i)=>melee('Normal: greataxe '+(i+1),v,'1d12+7','Normal only; critical 19–20/×3; +2d6 vicious.'))),...([20,15,10,5].map((v,i)=>melee('Normal: lance '+(i+1),v,'1d8+6','Normal alternate lance routine; ×3.'))),...([25,20,15,10].map((v,i)=>melee('Raging: greataxe '+(i+1),v,'1d12+11','Greater rage only; critical 19–20/×3; +2d6 vicious.')))],
  activeAbilities:[ability('Greater Rage','ex','38 rounds/day; alternate HP 253, AC 23, DR 7/—, Str 24, Con 24, greataxe +25/+20/+15/+10; do not add those to the normal stats.')]
 },
 'virthad':{
  stats:{str:16,dex:16,con:16,int:15,wis:20,cha:13,casterLevel:7},
  text:{
   sourceReference:'Doppelganger cleric of Lamashtu 7 (Pathfinder Bestiary, p. 89).',raceClassLevels:'Doppelganger cleric of Lamashtu 7.',
   acDetail:'20, touch 15, flat-footed 16 (+1 armor, +1 deflection, +3 Dex, +1 dodge, +4 natural).',hpDetail:'104 (11 HD; 7d8+4d10+51).',saveDetail:'Fort +11, Ref +9, Will +14.',
   senses:'Darkvision 60 ft.; Perception +15.',immunities:'Charm and sleep.',
   specialAttacks:'Channel negative energy 4/day (DC 14, 4d6).',
   spellLikeAbilities:'Doppelganger SLA CL 18th, concentration +19: at will—detect thoughts (DC 13). Domain SLAs CL 7th, concentration +12: 8/day—copycat (7 rounds), vision of madness (+3/−3).',
   spellsPrepared:'Cleric CL 7th, concentration +12: 4th—confusion [domain] (DC 19), cure critical wounds, unholy blight (DC 19); 3rd—blindness/deafness (DC 18), cure serious wounds, dispel magic, nondetection [domain]; 2nd—cure moderate wounds, ghoul hunger (DC 17), invisibility [domain], silence (DC 17), sound burst (DC 17); 1st—bane (DC 16), command (DC 16), lesser confusion [domain] (DC 16), cure light wounds (2), divine favor, sanctuary (DC 16); 0 (at will)—bleed (DC 15), detect magic, mending, read magic. Domains Madness, Trickery.',
   qualities:'Change shape (alter self), mimicry, perfect copy.',
   feats:'Combat Casting, Deceitful, Dodge, Great Fortitude, Improved Initiative, Toughness.',
   skillDetail:'Bluff +23 (+27 change shape), Diplomacy +7, Disguise +23 (+43 change shape), Knowledge (religion) +12, Perception +15, Sense Motive +15, Spellcraft +10, Stealth +7.',
   attackDetail:'Melee +1 dogslicer +13/+8 (1d6+4, critical 19–20), claw +7 (1d8+1).',
   combatGear:'Scroll of cure serious wounds.',gear:'+1 dogslicer, bracers of armor +1, ring of protection +1, 31 pp, 7 gp.',
   importNotes:'Source-reviewed printed pp. 127–128 (PDF pp. 128–129). Distinguishes doppelganger CL18 detect thoughts from cleric and domain CL7 magic; recovered all prepared spells and clean skills.'
  },
  weapons:[melee('+1 dogslicer +13',13,'1d6+4','Critical 19–20.'),melee('+1 dogslicer +8',8,'1d6+4','Critical 19–20; second iterative.'),melee('Claw',7,'1d8+1')],
  npcSkills:[['Bluff',23],['Diplomacy',7],['Disguise',23],['Knowledge (religion)',12],['Perception',15],['Sense Motive',15],['Spellcraft',10],['Stealth',7]].map(([name,bonus])=>({name,bonus})),
  activeAbilities:[ability('Doppelganger Change Shape','su','Alter self; printed +27 Bluff and +43 Disguise while shapechanged.'),ability('Channel Negative Energy','su','4/day, 4d6 negative energy, DC 14.')]
 },
 'volodmyra':{
  stats:{str:18,dex:13,con:14,int:10,wis:8,cha:12},
  text:{
   acDetail:'18, touch 11, flat-footed 17 (+7 armor, +1 Dex).',hpDetail:'38 (4d10+12).',saveDetail:'Fort +6, Ref +2, Will +2 (+1 vs. fear).',
   attackDetail:'Melee masterwork greataxe +10 (1d12+8, critical ×3).',
   feats:'Cleave, Intimidating Prowess, Iron Will, Power Attack, Weapon Focus (greataxe), Weapon Specialization (greataxe).',
   skillDetail:'Bluff +4, Intimidate +5, Knowledge (local) +3, Perception +2, Stealth +1.',
   qualities:'Armor training 1.',languages:'Common.',
   combatGear:'Two potions of cure moderate wounds.',gear:'+1 chainmail; masterwork greataxe; silver ring (30 gp); jade and pearl necklace (20 gp).',
   importNotes:'Source-reviewed printed p. 128 (PDF p. 129). Cleaned equipment following the final stat block and removed Vordakai narrative from gear.'
  },weapons:[melee('Masterwork greataxe',10,'1d12+8','Critical ×3.')]
 },
 'vordakai':{
  stats:{str:21,dex:10,con:null,int:20,wis:17,cha:16,dr:15,casterLevel:9},
  text:{
   sourceReference:'Male cyclops lich necromancer 9 (Pathfinder Bestiary, pp. 52, 188).',
   senses:'Darkvision 120 ft.; familiar farsight; life sight 10 ft., 9 rounds/day; low-light vision; Perception +31.',
   aura:'Fear aura 60 ft., DC 22.',
   defenses:'Channel resistance +4; ferocity; lich rejuvenation listed generically, but its inactive phylactery explicitly prevents return until the lich recovers level 13; DR 15/bludgeoning and magic.',
   immunities:'Cold, electricity, undead traits.',
   acDetail:'22, touch 11, flat-footed 22 (+4 armor, +2 deflection, +7 natural, −1 size).',hpDetail:'180 (19 HD; 9d6+10d8+104).',saveDetail:'Fort +18, Ref +11, Will +15.',
   attackDetail:'Melee touch +15 (1d8+9 negative energy, critical 19–20, plus paralyzing touch DC 22).',
   specialAttacks:'Paralyzing touch DC 22; turn undead 8/day DC 17.',
   spellLikeAbilities:'Necromancer school power CL 9th, concentration +14: grave touch 8/day, 4 rounds.',
   spellsPrepared:'Necromancer CL 9th, concentration +14: 5th—dominate person (DC 21), quickened shield, waves of fatigue; 4th—bestow curse (DC 19), dimension door (2), phantasmal killer (DC 19); 3rd—dispel magic, displacement, suggestion (DC 19), tongues, vampiric touch; 2nd—blindness/deafness (DC 17), detect thoughts (2, DC 17), false life, ghoul touch (DC 17), resist energy; 1st—charm person (DC 17), chill touch (DC 16), comprehend languages, grease, mage armor, ray of enfeeblement (2, DC 16); 0 (at will)—arcane mark, bleed (DC 15), detect magic, read magic. Opposition schools Evocation and Transmutation.',
   qualities:'Arcane bond: Horagnamon, raven familiar; flash of insight; haunting beckon from the separate oculus artifact.',
   tactics:'Uses false life, mage armor and tongues before combat; printed statistics include those spells.',
   gear:'Cloak of resistance +3; headband of mental prowess +2 (Int, Cha, grants Knowledge [planes] ranks); oculus of Abaddon (separate minor artifact); ring of protection +2; inactive phylactery.',
   specialAbilities:'Atrophied Lich (Ex): effective wizard level diminished from 20 to 9; these are not negative levels. Phylactery cannot function until at least level 13, so destruction before that is permanent. Oculus of Abaddon (artifact, not personal spell list): grants 120-ft. darkvision, true seeing 1/day, greater scrying 3/day, planar binding 1/week for Abaddon natives, familiar farsight at will; haunting beckon 1/year affects those within 1 mile (language-dependent charm, creatures 6+ HD get Will DC 22, SR applies). The artifact only serves neutral-evil users.',
   importNotes:'Source-reviewed printed pp. 128–130 (PDF pp. 129–131). Restored split-page magic and full artifact boundary, preserved undead Con as null and explicitly noted unusable phylactery despite generic rejuvenation listing.'
  },
  weapons:[melee('Paralyzing touch',15,'1d8+9','Negative energy; critical 19–20; paralysis DC 22.')],
  activeAbilities:[ability('Atrophied Lich','ex','Wizard effective level 9 (formerly 20). Until lich level 13, phylactery inactive and destruction permanent; not negative levels.'),ability('Paralyzing Touch','su','Touch +15, 1d8+9 negative energy and DC 22 paralysis.'),ability('Oculus of Abaddon (equipped artifact)','other','Eye artifact is equipment, not innate spellcasting. Familiar farsight; haunting beckon 1/year, 1 mile, DC 22 for 6+ HD, language-dependent and subject to spell resistance.')]
 }
});