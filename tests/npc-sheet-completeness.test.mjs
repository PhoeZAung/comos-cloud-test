import test from 'node:test';
import assert from 'node:assert/strict';
import {npcStatGroups,npcTextGroups,npcStatLabels,npcTextLabels,normalizeNpcSheet,parseNpcStatBlock} from '../src/features/characters/npc-stat-block.mjs';
import {renderSheetFrame,renderNpcCombatDetails,entryDetail} from '../src/features/sheet/view.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';

const character=data=>({id:'npc-id',name:'Unknown Guard',kind:'npc',data});
test('every supported NPC stat and detail is grouped, labelled, and nullable by default',()=>{
 const data=normalizeNpcSheet({});
 for(const key of npcStatGroups.flatMap(g=>g.keys)){
  assert.equal(typeof npcStatLabels[key],'string',key+' is labelled');
  assert.equal(data.npcStats[key],null,key+' is explicitly unset');
 }
 for(const key of npcTextGroups.flatMap(g=>g.keys)){
  assert.equal(typeof npcTextLabels[key],'string',key+' is labelled');
  assert.equal(data.npcText[key],null,key+' is explicitly unset');
 }
 for(const key of ['hp_curr','hp_max','hp_temp','mp_curr','mp_max'])assert.equal(data[key],null,key);
 assert.equal(data.npcStats.ac,null);assert.equal(data.npcStats.sr,null);
});
test('NPC record preserves manually entered defense values and clearing them stores null, not zero',()=>{
 let data=normalizeNpcSheet({});
 data=mergeSheetData(data,{action:'npcStats',fields:{ac:'21',touch:'11',fort:'8',sr:'19',dr:'5',spellDC:'24',reach:'10'}},{npc:true});
 assert.deepEqual([data.npcStats.ac,data.npcStats.fort,data.npcStats.dr,data.npcStats.sr,data.npcStats.spellDC],[21,8,5,19,24]);
 data=mergeSheetData(data,{action:'npcStats',fields:{sr:'',fort:'',reach:''}},{npc:true});
 assert.equal(data.npcStats.sr,null);
 assert.equal(data.npcStats.fort,null);
 assert.equal(data.npcStats.reach,null);
 assert.equal(data.npcStats.dr,5);
 data=mergeSheetData(data,{action:'npcText',fields:{immunities:'fire, poison',drBypass:'silver'}},{npc:true});
 assert.equal(data.npcText.immunities,'fire, poison');
 data=mergeSheetData(data,{action:'npcText',fields:{immunities:''}},{npc:true});
 assert.equal(data.npcText.immunities,null);
});
test('NPC health fields can be genuinely unset',()=>{
 let data=normalizeNpcSheet({});
 data=mergeSheetData(data,{action:'fields',fields:{hp_curr:20,hp_max:30,hp_temp:5}},{npc:true});
 data=mergeSheetData(data,{action:'fields',fields:{hp_curr:null,hp_max:null,hp_temp:null}},{npc:true});
 assert.equal(data.hp_curr,null);assert.equal(data.hp_max,null);assert.equal(data.hp_temp,null);
});
test('NPC import keeps absent fields null and parses explicit existing defenses',()=>{
 const result=parseNpcStatBlock('# Goblin Captain\n| AC | 17, touch 13, flat-footed 14 |\n| HP | 26 |\n| SR | 15 |\n| Fort | +7 |\n| Speed | 30 ft, fly 40 ft |').data;
 assert.equal(result.npcStats.ac,17);
 assert.equal(result.npcStats.fort,7);
 assert.equal(result.npcStats.sr,15);
 assert.equal(result.npcStats.flySpeed,40);
 assert.equal(result.npcStats.dr,null);
 assert.equal(result.npcStats.will,null);
 assert.equal(result.npcText.immunities,null);
});
test('NPC sheet omits unknown values, source fields, summary bar and shared HP',()=>{
 const html=renderSheetFrame(character(normalizeNpcSheet({hp_curr:23,hp_max:31})),'overview',{admin:true});
 for(const label of ['Damage reduction (DR)','Spell resistance (SR)','Fortitude','Reflex','Will','Save modifiers','Special save rules']){
  assert.equal(html.includes('<span>'+label+'</span>'),false,label+' stat hidden');
  assert.equal(html.includes('<dt>'+label+'</dt>'),false,label+' detail hidden');
 }
 assert.doesNotMatch(html,/cs-metric-unset|cs-score-unset|cs-npc-empty|cs-npc-glance|cs-resource-hp/);
 assert.doesNotMatch(html,/data-edit-stats="npcHealth"|data-resource="hp_curr"/);
 assert.doesNotMatch(html,/>XP<|>CR<|>Current HP<|>Max HP</);
 assert.match(html,/data-edit-stats="npcAbilityScores"/);
 assert.match(html,/data-edit-stats="npcCoreStats"/);
 assert.doesNotMatch(html,/data-roll="Fortitude"/,'unset save may not be rolled as +0');
 assert.doesNotMatch(html,/cs-npc-citation|Source &amp; import review|Source page/);
});
test('NPC Core contains known scores, movement, senses and gear; Abilities contains skills, special abilities and feats',()=>{
 const data=normalizeNpcSheet({
  npcStats:{xp:3200,ac:19,sourcePage:11,str:16,dex:14,speed:30,perception:6},
  npcText:{source:'Bestiary',sourceReference:'p. 11',alignment:'LG',senses:'darkvision 60 ft',gear:'sword and potion',feats:'Power Attack'},
  npcSkills:[{name:'Stealth',bonus:7}],
  activeAbilities:[{name:'Aura of courage',desc:'Resist fear'}],
  weapons:[{name:'Sword',attack_type:'melee',npcAttackBonus:4},{name:'Bow',attack_type:'ranged',npcAttackBonus:3}]
 });
 const html=renderSheetFrame(character(data),'overview',{admin:true});
 assert.match(html,/data-npc-panel="core"/);
 assert.match(html,/Ability scores/);
 assert.match(html,/STR/);
 assert.match(html,/30 ft/);
 assert.match(html,/darkvision 60 ft/);
 assert.match(html,/sword and potion/);
 assert.match(html,/data-npc-panel="abilities"/);
 assert.match(html,/Stealth/);
 assert.match(html,/Aura of courage/);
 assert.match(html,/Power Attack/);
 assert.match(html,/Sword/);
 assert.match(html,/Bow/);
 assert.doesNotMatch(html,/data-weapon-view=/);
 assert.doesNotMatch(html,/>XP<|>3200|Source &amp; import review|Source page/);
});
test('NPC sword and shield dialogs show only entered attack, defense and save values',()=>{
 const data=normalizeNpcSheet({
  npcStats:{ac:22,touch:13,fort:8,ref:6,will:4,meleeAttack:9,bab:7},
  npcText:{saveDetail:'+2 vs fear',immunities:'poison',attackDetail:'bite +9 (1d6+4)'}
 });
 const defense=renderNpcCombatDetails(data,'defense');
 const attack=renderNpcCombatDetails(data,'attack');
 assert.match(defense,/Armor class/);
 assert.match(defense,/Saving throws/);
 for(const bonus of ['Fortitude','Reflex','Will'])assert.match(defense,new RegExp('data-roll="'+bonus+'"'));
 assert.match(defense,/22/);
 assert.match(defense,/poison/);
 assert.match(defense,/data-edit-stats="npcCombatDefense"/);
 assert.doesNotMatch(defense,/Spell resistance \(SR\)|Source page/);
 assert.match(attack,/Attack rolls/);
 assert.match(attack,/Melee attack bonus/);
 assert.ok(attack.includes('bite +9'));
 assert.match(attack,/data-edit-stats="npcCombatAttack"/);
 assert.doesNotMatch(attack,/data-roll="Reflex"/);
 const unknown=renderNpcCombatDetails(normalizeNpcSheet({}),'defense');
 assert.doesNotMatch(unknown,/data-roll="Fortitude"|>—</);
});

test('NPC shield shows only populated fast healing and regeneration with their existing defensive notes',()=>{
 const data=normalizeNpcSheet({npcStats:{ac:17,fastHealing:5,regeneration:8},npcText:{defenses:'Regeneration stops after fire damage.'}});
 const shield=renderNpcCombatDetails(data,'defense');
 assert.match(shield,/Healing & recovery/);
 assert.match(shield,/Fast healing per round/);
 assert.match(shield,/Regeneration per round/);
 assert.match(shield,/Regeneration stops after fire damage/);
 assert.match(shield,/data-edit-stats="npcCombatDefense"/);
 const empty=renderNpcCombatDetails(normalizeNpcSheet({npcStats:{ac:17}}),'defense');
 assert.doesNotMatch(empty,/Healing & recovery|Fast healing per round|Regeneration per round/);
});

test('Core shows hit dice or printed dice formula but not reusable current or maximum HP',()=>{
 const withFormula=normalizeNpcSheet({hp_curr:74,hp_max:74,npcStats:{hitDice:8},npcText:{hpDetail:'74 (8d10+20)'}});
 const html=renderSheetFrame(character(withFormula),'overview',{admin:true});
 assert.match(html,/data-npc-panel="core"/);
 assert.match(html,/8d10\+20/);
 assert.match(html,/data-edit-stats="npcHitDiceStats"/);
 assert.match(html,/data-edit-stats="npcHitDiceText"/);
 assert.doesNotMatch(html,/Current HP|Max HP|data-resource="hp_curr"|>74</);
 const countOnly=renderSheetFrame(character(normalizeNpcSheet({npcStats:{hitDice:4}})),'overview',{admin:true});
 assert.match(countOnly,/4 HD/);
 const unknown=renderSheetFrame(character(normalizeNpcSheet({})),'overview',{admin:true});
 assert.doesNotMatch(unknown,/cs-npc-hit-dice|data-edit-stats="npcHitDiceStats"/);
});

test('NPC ammo quantity stays on weapon row but is not repeated in detail popup',()=>{
 const bow={name:'Shortbow',attack_type:'ranged',damage:'1d6',npcAttackBonus:6,u_curr:4,u_max:8,ammoType:'arrows'};
 const data=normalizeNpcSheet({weapons:[bow]});
 const sheet=renderSheetFrame(character(data),'overview',{admin:true});
 assert.match(sheet,/Ammo \/ Max Ammo/);
 assert.match(sheet,/4 \/ 8/);
 const npcDetails=entryDetail(bow,data,'weapons',{npc:true});
 assert.match(npcDetails,/Ammo Type/);
 assert.match(npcDetails,/arrows/);
 assert.doesNotMatch(npcDetails,/<dt>Ammo<\/dt>|<dt>Max Ammo<\/dt>/);
 const playerDetails=entryDetail(bow,data,'weapons');
 assert.match(playerDetails,/<dt>Ammo<\/dt>/);
 assert.match(playerDetails,/<dt>Max Ammo<\/dt>/);
});

test('bestairy import preserves long special ability and spell text, plus wrapped key abilities',()=>{
 const special='A powerful magical effect. '.repeat(320)+'END-SPECIAL.';
 const spell='A 30-foot cone with a DC 18 save. '.repeat(180)+'END-SPELL.';
 const markdown='# Elder Guardian\\n| HP | 74 (8d10+20), fast healing 5 |\\n| Special Abilities | '+special+' |\\n| Spell-Like Abilities | '+spell+' |\\n**Key abilities (as printed):**\\n- **Stone Gaze:** Fort DC 18; 30 ft range.\\n    Creatures that fail the save are petrified.\\n## GM notes\\n    Do not import campaign secrets.';
 const data=parseNpcStatBlock(markdown).data;
 assert.equal(data.npcStats.fastHealing,5);
 assert.match(data.npcText.specialAbilities,/END-SPECIAL/);
 assert.match(data.npcText.spellLikeAbilities,/END-SPELL/);
 assert.match(data.activeAbilities[0].desc,/Creatures that fail the save are petrified/);
 assert.doesNotMatch(data.activeAbilities[0].desc,/campaign secrets/);
 const html=renderSheetFrame(character(data),'overview',{admin:true});
 assert.match(html,/END-SPECIAL/);
 assert.match(html,/END-SPELL/);
 assert.match(html,/Stone Gaze/);
});
