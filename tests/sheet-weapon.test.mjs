import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {weaponAttackParts,weaponAttack,attackType,sheetStats} from '../src/features/sheet/model.mjs';
import {weaponRoll,criticalProfile,publishRoll,serverRoll} from '../backend/characters/rolls.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';import {formatRoll} from '../src/ui/sheet.mjs';
import {entryDetail,renderSection,renderSheetFrame} from '../src/features/sheet/view.mjs';
import {openDatabase} from '../backend/db/database.mjs';import {createUserRepository} from '../backend/repositories/users.mjs';import {createCharactersService} from '../backend/characters/service.mjs';
import {externalRollSource} from '../backend/characters/external-rolls.mjs';
import {requestSheetDice} from '../src/owlbear/rolls.mjs';
import {weaponDamageFormulas} from '../src/features/sheet/calculations.mjs';
const data={str:18,dex:14,con:12,bab:4,bab_temp:1,ar_melee_temp:2,ar_ranged_temp:3,ar_touch_temp:4,ar_ranged_touch_temp:5,cmb_temp:1,hp_curr:20,hp_max:30,mp:8,mp_class:10,speed:30,proficiencies:'Simple weapons',weapons:[{name:'Flaming sword',attack_type:'melee',ability_mod:'auto',attack_misc:1,damage:'1d8+4',extra_damage:'1d6 fire',crit_range:'19-20',crit_mult:'x3'}]};
function seeded(sequence){
 return expression=>{
  const next=sequence.shift();assert.ok(next!==undefined,'unexpected roll '+expression);
  return externalRollSource([{expression,faces:Array.isArray(next)?next:[next]}]).roll(expression);
 };
}
test('weapons use the selected sheet attack, replace ability once, and accept legacy uppercase stats',()=>{
 const s=sheetStats(data),expected={melee:s.melee,ranged:s.ranged,touch:s.touchAttack,ranged_touch:s.rangedTouch,cmb:s.cmb};
 for(const [type,total] of Object.entries(expected))assert.equal(weaponAttack({attack_type:type,ability_mod:'auto',attack_misc:2},data),total+2);
 assert.equal(weaponAttack({attack_type:'ranged',ability_mod:'STR',attack_misc:2},data),s.ranged-2+4+2);assert.equal(weaponAttack({ability_mod:'DEX'},data),s.melee-4+2);assert.equal(attackType('Ranged Touch'),'ranged_touch');assert.equal(attackType('Touch attack'),'touch');assert.equal(weaponAttackParts({attack_type:'ranged'},data).ability,'dex');
});
test('critical threats roll confirmation and reroll base damage with extra dice once',()=>{
 const r=weaponRoll(data.weapons[0],data,seeded([19,[3,2],12,[4,5,6,3]]));
 assert.equal(r.rolls[0],19);assert.equal(r.bonus,12);assert.equal(r.total,31);assert.equal(r.damage.total,9);assert.equal(r.critical.threat,true);assert.equal(r.critical.confirmation.total,24);assert.equal(r.critical.damage.total,30);assert.deepEqual(r.critical.damage.rolls,[4,5,6,3]);
 const text=formatRoll('Weapon',r);assert.match(text,/Attack Roll: 31 \(1d20\+12 · 19\)/);assert.match(text,/Critical threat/);assert.match(text,/Damage if confirmed: 30/);
 for(const n of [1,18]){const normal=weaponRoll(data.weapons[0],data,seeded([n,[2,1]]));assert.equal(normal.critical.threat,false);assert.equal(normal.critical.confirmation,undefined);}
 const cmb=weaponRoll({...data.weapons[0],attack_type:'cmb'},data,seeded([20,[1,1]]));assert.equal(cmb.critical.threat,false);
});
test('critical parsing and damage failures never invent or execute rules',()=>{
 assert.deepEqual(criticalProfile({crit_range:'18–20',crit_mult:'×4'}),{minimum:18,multiplier:4});for(const row of [{crit_range:0},{crit_range:21},{crit_range:'foo'},{crit_mult:'x99'}])assert.throws(()=>criticalProfile(row));
 const prose=weaponRoll({...data.weapons[0],damage:'see description'},data,seeded([20,3]));assert.equal(prose.damage,null);assert.equal(prose.critical.damage,undefined);assert.ok(prose.critical.damageError);
 const compound=weaponRoll({...data.weapons[0],damage:'1d8+1d6',extra_damage:''},data,seeded([20,[3,1],12,[1,2,3,1,2,3]]));assert.equal(compound.critical.damage.total,12);
 assert.ok(serverRoll('1d20+12').total>=13);
});
test('weapon damage uses the saved damage formula, independently of the attack ability, including in Dice+',async()=>{
 const row={...data.weapons[0],ability_mod:'dex',damage:'1d8',damage_ability:'auto',damage_style:'two_handed',extra_damage:'1d6 fire'};
 const character={data:{...data,weapons:[row]}},change={kind:'weapon',index:0};
 const pending=[[[19]],[[3],[2]],[[12]],[[4,5,6],[3]]],requested=[];
 const responses=await requestSheetDice(character,change,async notation=>{
  requested.push(notation);
  const sizes=[...notation.matchAll(/\d+d(\d+)/g)].map(m=>m[1]);
  return {groups:pending.shift().map((faces,i)=>({diceType:'d'+sizes[i],dice:faces.map(value=>({value}))}))};
 });
 assert.deepEqual(requested,['1d20+10','1d8+6+1d6','1d20+10','3d8+18+1d6']);
 const external=externalRollSource(responses),result=weaponRoll(row,character.data,external.roll);
 external.finish();
 assert.equal(result.damage.total,11);
 assert.equal(result.critical.damage.total,36);
 assert.equal(result.critical.damage.breakdown.at(-1).type,'fire');
});
test('damage ability defaults by weapon style, can be overridden, and preserves existing formulas',()=>{
 const automatic={damage:'1d8',damage_ability:'auto'};
 const cases=[
  [{...automatic,attack_type:'melee'},'1d8 + 4'],
  [{...automatic,attack_type:'ranged'},'1d8'],
  [{...automatic,attack_type:'ranged_touch'},'1d8'],
  [{...automatic,attack_type:'ranged',damage_style:'thrown'},'1d8 + 4'],
  [{...automatic,attack_type:'melee',damage_style:'off_hand'},'1d8 + 2'],
  [{...automatic,attack_type:'melee',two_handed:true},'1d8 + 6'],
  [{...automatic,attack_type:'ranged',two_handed:true},'1d8'],
  [{...automatic,attack_type:'ranged',damage_style:'bow'},'1d8'],
  [{...automatic,ability_mod:'str',damage_ability:'dex'},'1d8 + 2'],
  [{...automatic,damage_ability:'none'},'1d8'],
  [{attack_type:'melee',damage:'1d8+{STR_TWO_HANDED}'},'1d8+6'],
  [{attack_type:'melee',damage:'1d8+4'},'1d8+4']
 ];
 for(const [row,formula] of cases)assert.equal(weaponDamageFormulas(row,data).normal,formula);
 const weak={...data,str:8};
 assert.equal(weaponDamageFormulas({...automatic,attack_type:'ranged',damage_style:'bow'},weak).normal,'1d8 - 1');
 assert.equal(weaponDamageFormulas({...automatic,damage_style:'off_hand'},weak).normal,'1d8 - 1');
 const base={...data,weapons:[{name:'Sword',damage:'1d8',attack_type:'melee',ability_mod:'str'}]};
 const save=fields=>mergeSheetData(base,{action:'entry',collection:'weapons',mode:'update',index:0,fields});
 const edited=save({damage_ability:'dex',damage_style:'standard'});
 assert.equal(weaponAttack(edited.weapons[0],edited),weaponAttack(base.weapons[0],base));
 assert.match(entryDetail(edited.weapons[0],edited,'weapons'),/Damage Ability<\/dt><dd>DEX \+2.*1d8 \+ 2/);
 assert.throws(()=>save({damage_ability:'speed'}),/Choose a damage ability/);
 assert.throws(()=>save({damage_style:'unknown'}),/Choose a weapon damage style/);
});
test('HP and MP favorites persist, retain live controls and leave BAB out of combat',()=>{
 const favorite=mergeSheetData(data,{action:'fields',fields:{hp_favorite:true,mp_favorite:true}});assert.equal(favorite.hp_favorite,true);assert.equal(mergeSheetData(favorite,{action:'fields',fields:{hp_favorite:false}}).hp_favorite,false);assert.throws(()=>mergeSheetData(data,{action:'fields',fields:{hp_favorite:'true'}}));
 const char={id:'sample',name:'Sample',data:favorite},favorites=renderSection(char,'favorites');assert.match(favorites,/data-resource-input="hp_curr"/);assert.match(favorites,/data-resource-input="mp_curr"/);const combat=renderSection(char,'combat',{combatView:'offense'});assert.match(combat,/data-roll="Initiative"/);assert.doesNotMatch(combat,/>Actions<|>BAB<|>Speed<|>Base</);assert.match(combat,/data-weapon-roll="0"/);assert.doesNotMatch(combat,/data-damage-label="Flaming sword"/);assert.match(renderSection(char,'overview'),/Speed|Proficiencies/);const frame=renderSheetFrame(char,'abilities');assert.equal((frame.match(/data-ability-category=/g)||[]).length,4);assert.match(frame,/aria-label="Ability categories"/);
});
test('one server-derived weapon receipt sends to Discord once, preserves crit info and rejects stale or changed retries',async()=>{
 const db=await openDatabase(':memory:');try{
  const user=createUserRepository(db).create({displayName:'Tester'}),id=randomUUID();createCharactersService(db).save({op:'save',id,revision:0,name:'Tester',ownerId:user.id,sources:[]});db.prepare('UPDATE characters SET revision=3 WHERE id=?').run(id);let calls=0,body;
  const args={db,userId:user.id,origin:'https://example.test',character:{id,name:'Tester',revision:3,data},change:{kind:'weapon',index:0,revision:3,requestId:randomUUID(),discord:true},makeWeaponRoll:(row,d)=>weaponRoll(row,d,seeded([20,[3,2],12,[4,5,6,3]])),sendFetch:async(url,options)=>{calls++;body=JSON.parse(options.body);return {ok:true};}};
  const result=await publishRoll(args);assert.equal(result.discord,'sent');assert.equal(calls,1);assert.match(body.content,/Attack Roll: 20 \+ 12 = 32/);assert.match(body.content,/Critical threat/);assert.match(body.content,/Damage if confirmed: .* = 30/);assert.deepEqual(body.allowed_mentions,{parse:[]});assert.deepEqual(await publishRoll({...args,character:{...args.character,revision:4}}),result);assert.equal(calls,1);
  await assert.rejects(()=>publishRoll({...args,change:{...args.change,index:1}}),/identifier/);await assert.rejects(()=>publishRoll({...args,change:{...args.change,requestId:randomUUID(),revision:2}}),/changed/);
 }finally{db.close();}
});
test('Dice+ faces use the same Discord receipt once; disabled delivery stays off',async()=>{
 const db=await openDatabase(':memory:');try{
  const user=createUserRepository(db).create(),id=randomUUID();createCharactersService(db).save({op:'save',id,revision:0,name:'Owlbear Hero',ownerId:user.id,sources:[]});let calls=0,body;
  const args={db,userId:user.id,origin:'https://example.test',character:{id,name:'Owlbear Hero',revision:1,data:{}},change:{label:'Perception',expression:'1d20+5',requestId:randomUUID(),discord:true,owlbearRolls:[{expression:'1d20+5',faces:[17]}]},sendFetch:async(url,options)=>{calls++;body=JSON.parse(options.body);return {ok:true};}};
  const result=await publishRoll(args);assert.equal(result.roll.provider,'owlbear-dice-plus');assert.equal(result.roll.total,22);assert.deepEqual(result.roll.rolls,[17]);assert.equal(result.discord,'sent');assert.equal(calls,1);assert.match(body.content,/Dice\+ client roll/);assert.match(body.content,/17 \+ 5 = 22/);assert.deepEqual(body.allowed_mentions,{parse:[]});assert.deepEqual(await publishRoll(args),result);assert.equal(calls,1);
  db.prepare('UPDATE sheet_rolls SET created_at=0').run();
  const silent=await publishRoll({...args,change:{...args.change,requestId:randomUUID(),discord:false}});assert.equal(silent.discord,'off');assert.equal(silent.roll.total,22);assert.equal(calls,1);
 }finally{db.close();}
});

test('limited weapon rolls spend one use atomically and duplicate requests never spend twice',async()=>{
 const db=await openDatabase(':memory:');
 try{
  const user=createUserRepository(db).create(),id=randomUUID(),service=createCharactersService(db);
  service.save({op:'save',id,revision:0,name:'Limited weapon',ownerId:user.id,sources:[]});
  const limited={...data,weapons:[{...data.weapons[0],u_max:2,u_curr:2}]};
  const base={db,userId:user.id,origin:'https://example.test',sendFetch:async()=>({ok:true}),
   makeWeaponRoll:()=>({kind:'weapon',weaponName:'Flaming sword',expression:'1d20+4',rolls:[9],bonus:4,total:13,damage:{expression:'1d8+4',rolls:[5],bonus:4,total:9}})};
  const change={kind:'weapon',mode:'use',index:0,revision:1,requestId:randomUUID(),discord:false};
  const first=await publishRoll({...base,character:{id,name:'Limited weapon',revision:1,data:limited},change});
  assert.equal(first.roll.remainingUses,1);
  assert.equal(JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(id).data_json).weapons[0].u_curr,1);
  const replay=await publishRoll({...base,character:{id,name:'Limited weapon',revision:2,data:limited},change});
  assert.deepEqual(replay,first);
  assert.equal(JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(id).data_json).weapons[0].u_curr,1);
  db.prepare('UPDATE sheet_rolls SET created_at=0').run();
  let fresh=JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(id).data_json);
  const second=await publishRoll({...base,character:{id,name:'Limited weapon',revision:2,data:fresh},change:{...change,revision:2,requestId:randomUUID()}});
  assert.equal(second.roll.remainingUses,0);
  db.prepare('UPDATE sheet_rolls SET created_at=0').run();
  fresh=JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(id).data_json);
  await assert.rejects(()=>publishRoll({...base,character:{id,name:'Limited weapon',revision:3,data:fresh},change:{...change,revision:3,requestId:randomUUID()}}),/No weapon uses remaining/);
  assert.equal(fresh.weapons[0].u_curr,0);
  const view=renderSection({id,name:'Limited weapon',data:fresh},'combat');
  assert.match(view,/0 \/ 2/);
 }finally{db.close();}
});
test('inventory is first, inline values edit, and equipped items are identified',()=>{
 const char={id:'sample',name:'Sample',data:{...data,currency_gil:30,currency_moogle:8,slot_cap:22,items:[{name:'Robe',amount:1,equipped:true,equip_slot:'body'}]}};
 const frame=renderSheetFrame(char,'items');
 assert.ok(frame.indexOf('data-item-view="inventory"')<frame.indexOf('data-item-view="equip"'));
 assert.match(frame,/data-inline-currency="currency_gil"/);
 assert.match(frame,/data-inline-currency="currency_moogle"/);
 assert.doesNotMatch(frame,/data-inline-currency="slot_cap"/);
 assert.match(frame,/data-edit-stats="capacity"/);
 assert.match(frame,/cs-capacity-meter/);
 assert.match(frame,/cs-capacity-value/);
 assert.match(frame,/cs-entry cs-inventory-row is-equipped/);
 assert.doesNotMatch(frame,/Edit currency &amp; capacity/);
 assert.throws(()=>mergeSheetData(char.data,{action:'fields',fields:{slot_cap:0}}),/capacity/);
});
