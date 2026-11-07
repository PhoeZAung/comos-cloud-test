import test from 'node:test';
import assert from 'node:assert/strict';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {entryCalculations} from '../src/features/sheet/calculations.mjs';
import {collectionBlock} from '../src/features/sheet/view.mjs';
const collection='activeAbilities';
const initial=()=>({activeAbilities:[{name:'Flame',u_max:9,u_curr:7},{name:'Frost'},{name:'Limit Break',limitBreak:true}],passiveAbilities:[{name:'Aura'}]});
const change=(data,mode,extra={})=>mergeSheetData(data,{action:'abilityGroup',collection,mode,...extra});
function grouped(){let d=change(initial(),'add',{fields:{name:'Elemental arts',u_curr:2,u_max:3,restoreOnLongRest:true}});const id=d.abilityGroups[0].id;for(const index of [0,1])d=change(d,'move',{id,index});return d;}
test('members share a pool, exhaustion is enforced and rest restores the pool only',()=>{
 let d=grouped();d=mergeSheetData(d,{action:'useAbility',collection,index:0});
 assert.equal(entryCalculations(d.activeAbilities[1],d,collection).currentUses,1);
 assert.equal(d.activeAbilities[0].u_curr,7);
 d=mergeSheetData(d,{action:'useAbility',collection,index:1});
 assert.throws(()=>mergeSheetData(d,{action:'useAbility',collection,index:0}),/No uses/);
 d=mergeSheetData(d,{action:'rest'});assert.equal(d.abilityGroups[0].u_curr,3);assert.equal(d.activeAbilities[0].u_curr,7);
 assert.throws(()=>mergeSheetData(d,{action:'entry',mode:'update',collection,index:0,fields:{u_curr:2}}),/shared ability group/);
});
test('moving out and deleting groups preserves abilities and their independent usage',()=>{
 let d=grouped(),id=d.abilityGroups[0].id;
 d=change(d,'move',{index:0,id:''});assert.equal(entryCalculations(d.activeAbilities[0],d,collection).currentUses,7);
 d=change(d,'remove',{id});assert.equal(d.activeAbilities.length,3);assert.equal(d.abilityGroups.length,0);assert.equal(d.activeAbilities[1].abilityGroupId,undefined);
});
test('group boundaries reject invalid counts, categories, missing groups and Limit Break membership',()=>{
 const d=grouped(),id=d.abilityGroups[0].id;
 for(const [u_curr,u_max] of [[4,3],[-1,3],[1,1.5]])assert.throws(()=>change(d,'update',{id,fields:{name:'A',u_curr,u_max,restoreOnLongRest:true}}));
 assert.throws(()=>change(d,'move',{id,index:2}));
 assert.throws(()=>change(d,'move',{id:'missing',index:0}));
 assert.throws(()=>mergeSheetData(d,{action:'abilityGroup',mode:'move',collection:'passiveAbilities',id,index:0}));
 assert.throws(()=>change(d,'update',{id:'missing',fields:{}}));
});
test('group cards retain empty drop zones, escape titles and honor rest opt-out',()=>{
 let d=grouped(),id=d.abilityGroups[0].id;
 d=change(d,'update',{id,fields:{name:'<script>Group</script>',u_curr:1,u_max:3,restoreOnLongRest:false}});
 d=mergeSheetData(d,{action:'rest'});assert.equal(d.abilityGroups[0].u_curr,1);
 const html=collectionBlock(collection,d);assert.match(html,/&lt;script&gt;/);assert.match(html,/data-ability-group=""/);assert.doesNotMatch(html,/Move to group|Ungrouped|Drag abilities here/);assert.match(html,/data-group-drag/);
 assert.equal(JSON.parse(JSON.stringify(d)).activeAbilities[0].abilityGroupId,id);
});

test('a grouped ability use persists one shared spend and receipt retries do not spend again',async()=>{
 const [{randomUUID},{openDatabase},{createUserRepository},{createCharactersService},{publishRoll}]=await Promise.all([import('node:crypto'),import('../backend/db/database.mjs'),import('../backend/repositories/users.mjs'),import('../backend/characters/service.mjs'),import('../backend/characters/rolls.mjs')]);
 const db=await openDatabase(':memory:');
 try{
  const user=createUserRepository(db).create({displayName:'Tester'}),id=randomUUID(),data=grouped();
  createCharactersService(db).save({op:'save',id,revision:0,name:'Tester',ownerId:user.id,sources:[]});
  const revision=db.prepare('SELECT revision FROM characters WHERE id=?').get(id).revision;
  const args={db,userId:user.id,origin:'https://example.test',character:{id,name:'Tester',revision,data},change:{kind:'ability',mode:'use',collection,index:1,revision,requestId:randomUUID(),discord:false,spendUse:true}};
  const result=await publishRoll(args);assert.equal(result.roll.remainingUses,1);
  assert.deepEqual(await publishRoll(args),result);
  const saved=JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(id).data_json);
  assert.equal(saved.abilityGroups[0].u_curr,1);assert.equal(entryCalculations(saved.activeAbilities[0],saved,collection).currentUses,1);
 }finally{db.close();}
});


test('groups and standalone abilities share a stable order without changing group membership or usage',async()=>{
 const {abilityLayout}=await import('../src/features/sheet/ability-groups.mjs');
 let d=grouped(),id=d.abilityGroups[0].id;
 d=change(d,'move',{index:1,id:''});
 d=mergeSheetData(d,{action:'placeAbility',collection,source:{groupId:id},before:null,groupId:''});
 assert.deepEqual(abilityLayout(d,collection).map(e=>e.group?.name||e.row.name),['Frost','Elemental arts']);
 assert.equal(d.activeAbilities[0].abilityGroupId,id);assert.equal(d.abilityGroups[0].u_curr,2);
 d=JSON.parse(JSON.stringify(d));
 d=mergeSheetData(d,{action:'placeAbility',collection,source:{index:0},before:{index:1},groupId:''});
 assert.deepEqual(abilityLayout(d,collection).map(e=>e.group?.name||e.row.name),['Flame','Frost','Elemental arts']);
 d=mergeSheetData(d,{action:'placeAbility',collection,source:{index:1},before:null,groupId:id});
 assert.equal(d.activeAbilities.find(r=>r.name==='Frost').abilityGroupId,id);
 assert.deepEqual(abilityLayout(d,collection).map(e=>e.group?.name||e.row.name),['Flame','Elemental arts']);
 const flame=d.activeAbilities.findIndex(r=>r.name==='Flame');
 d=mergeSheetData(d,{action:'entry',mode:'remove',collection,index:flame});
 assert.deepEqual(abilityLayout(d,collection).map(e=>e.group?.name||e.row.name),['Elemental arts']);
 assert.throws(()=>mergeSheetData(d,{action:'placeAbility',collection,source:{groupId:id},before:null,groupId:id}),/nested/);
 assert.throws(()=>mergeSheetData(d,{action:'placeAbility',collection,source:{index:999},before:null,groupId:''}));
 assert.throws(()=>mergeSheetData(d,{action:'placeAbility',collection,source:{groupId:id},before:{groupId:id},groupId:''}));
});
