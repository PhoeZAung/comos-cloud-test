import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {weaponAttackParts,weaponAttack,attackType,sheetStats} from '../src/features/sheet/model.mjs';
import {weaponRoll,criticalProfile,publishRoll,serverRoll} from '../backend/characters/rolls.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';import {formatRoll} from '../src/ui/sheet.mjs';
import {renderSection,renderSheetFrame} from '../src/features/sheet/view.mjs';
import {openDatabase} from '../backend/db/database.mjs';import {createUserRepository} from '../backend/repositories/users.mjs';import {createCharactersService} from '../backend/characters/service.mjs';
const data={str:18,dex:14,con:12,bab:4,bab_temp:1,ar_melee_temp:2,ar_ranged_temp:3,ar_touch_temp:4,ar_ranged_touch_temp:5,cmb_temp:1,hp_curr:20,hp_max:30,mp:8,mp_class:10,speed:30,proficiencies:'Simple weapons',weapons:[{name:'Flaming sword',attack_type:'melee',ability_mod:'auto',attack_misc:1,damage:'1d8+4',extra_damage:'1d6 fire',crit_range:'19-20',crit_mult:'x3'}]};
function seeded(sequence){return expression=>{const next=sequence.shift();assert.ok(next!==undefined,'unexpected roll '+expression);return {expression,rolls:[next],bonus:Number(/([+-]\d+)$/.exec(expression)?.[1]||0),total:next+Number(/([+-]\d+)$/.exec(expression)?.[1]||0),breakdown:[]};};}
test('weapons use the selected sheet attack, replace ability once, and accept legacy uppercase stats',()=>{
 const s=sheetStats(data),expected={melee:s.melee,ranged:s.ranged,touch:s.touchAttack,ranged_touch:s.rangedTouch,cmb:s.cmb};
 for(const [type,total] of Object.entries(expected))assert.equal(weaponAttack({attack_type:type,ability_mod:'auto',attack_misc:2},data),total+2);
 assert.equal(weaponAttack({attack_type:'ranged',ability_mod:'STR',attack_misc:2},data),s.ranged-2+4+2);assert.equal(weaponAttack({ability_mod:'DEX'},data),s.melee-4+2);assert.equal(attackType('Ranged Touch'),'ranged_touch');assert.equal(attackType('Touch attack'),'touch');assert.equal(weaponAttackParts({attack_type:'ranged'},data).ability,'dex');
});
test('critical threats confirm the attack and multiply the rolled damage total',()=>{
 const r=weaponRoll(data.weapons[0],data,seeded([19,3,12]));
 assert.equal(r.rolls[0],19);assert.equal(r.bonus,12);assert.equal(r.total,31);assert.equal(r.damage.total,7);assert.equal(r.critical.threat,true);assert.equal(r.critical.confirmation.total,24);assert.equal(r.critical.damage.total,21);assert.deepEqual(r.critical.damage.rolls,[]);
 const text=formatRoll('Weapon',r);assert.match(text,/Attack Roll: 31 \(1d20\+12 · 19\)/);assert.match(text,/Crit!/);assert.match(text,/Dice Roll: 21/);
 for(const n of [1,18]){const normal=weaponRoll(data.weapons[0],data,seeded([n,2]));assert.equal(normal.critical.threat,false);assert.equal(normal.critical.confirmation,undefined);}
 const cmb=weaponRoll({...data.weapons[0],attack_type:'cmb'},data,seeded([20,1]));assert.equal(cmb.critical.threat,false);
});
test('critical parsing and damage failures never invent or execute rules',()=>{
 assert.deepEqual(criticalProfile({crit_range:'18–20',crit_mult:'×4'}),{minimum:18,multiplier:4});for(const row of [{crit_range:0},{crit_range:21},{crit_range:'foo'},{crit_mult:'x99'}])assert.throws(()=>criticalProfile(row));
 const prose=weaponRoll({...data.weapons[0],damage:'see description'},data,seeded([20,3]));assert.equal(prose.damage,null);assert.equal(prose.critical.damage,undefined);assert.ok(prose.critical.damageError);
 const compound=weaponRoll({...data.weapons[0],damage:'1d8+1d6',extra_damage:''},data,seeded([20,4,12]));assert.equal(compound.critical.damage.total,12);
 assert.ok(serverRoll('1d20+12').total>=13);
});
test('HP and MP favorites persist, retain live controls and leave BAB out of combat',()=>{
 const favorite=mergeSheetData(data,{action:'fields',fields:{hp_favorite:true,mp_favorite:true}});assert.equal(favorite.hp_favorite,true);assert.equal(mergeSheetData(favorite,{action:'fields',fields:{hp_favorite:false}}).hp_favorite,false);assert.throws(()=>mergeSheetData(data,{action:'fields',fields:{hp_favorite:'true'}}));
 const char={id:'sample',name:'Sample',data:favorite},favorites=renderSection(char,'favorites');assert.match(favorites,/data-resource-input="hp_curr"/);assert.match(favorites,/data-resource-input="mp_curr"/);const combat=renderSection(char,'combat',{combatView:'offense'});assert.match(combat,/data-roll="Initiative"/);assert.doesNotMatch(combat,/>Actions<|>BAB<|>Speed<|>Base</);assert.match(combat,/data-weapon-roll="0"/);assert.doesNotMatch(combat,/data-damage-label="Flaming sword"/);assert.match(renderSection(char,'overview'),/Speed|Proficiencies/);const frame=renderSheetFrame(char,'abilities');assert.equal((frame.match(/data-ability-category=/g)||[]).length,4);assert.match(frame,/aria-label="Ability categories"/);
});
test('one server-derived weapon receipt sends to Discord once, preserves crit info and rejects stale or changed retries',async()=>{
 const db=await openDatabase(':memory:');try{
  const user=createUserRepository(db).create({displayName:'Tester'}),id=randomUUID();createCharactersService(db).save({op:'save',id,revision:0,name:'Tester',ownerId:user.id,sources:[]});db.prepare('UPDATE characters SET revision=3 WHERE id=?').run(id);let calls=0,body;
  const args={db,userId:user.id,origin:'https://example.test',character:{id,name:'Tester',revision:3,data},change:{kind:'weapon',index:0,revision:3,requestId:randomUUID(),discord:true},makeWeaponRoll:(row,d)=>weaponRoll(row,d,seeded([20,3,12])),sendFetch:async(url,options)=>{calls++;body=JSON.parse(options.body);return {ok:true};}};
  const result=await publishRoll(args);assert.equal(result.discord,'sent');assert.equal(calls,1);assert.match(body.content,/Attack Roll: 32 \(1d20\+12 · 20\)/);assert.match(body.content,/Crit!/);assert.match(body.content,/Dice Roll: 21/);assert.deepEqual(body.allowed_mentions,{parse:[]});assert.deepEqual(await publishRoll({...args,character:{...args.character,revision:4}}),result);assert.equal(calls,1);
  await assert.rejects(()=>publishRoll({...args,change:{...args.change,index:1}}),/identifier/);await assert.rejects(()=>publishRoll({...args,change:{...args.change,requestId:randomUUID(),revision:2}}),/changed/);
 }finally{db.close();}
});
