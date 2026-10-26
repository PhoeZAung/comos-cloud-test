import test from 'node:test';import assert from 'node:assert/strict';
import {sheetStats,modifier,skillTotal,weaponAttack} from '../src/features/sheet/model.mjs';
import {mergeSheetData} from '../backend/characters/sheet-fields.mjs';
import {renderSheetFrame,renderSection,entryDetail} from '../src/features/sheet/view.mjs';
import {rollDice} from '../src/ui/sheet.mjs';
import {openDatabase} from '../backend/db/database.mjs';import {createUserRepository} from '../backend/repositories/users.mjs';import {createCharactersService} from '../backend/characters/service.mjs';import {createDirectoryRoutes} from '../backend/characters/directory.mjs';import {createApiServer} from '../backend/http/app.mjs';import {randomUUID} from 'node:crypto';
const data={str:'18',dex:'14',con:'12',int:'16',wis:'10',cha:'8',size_category:'Small',bab:'4',bab_temp:'1',ac_armor:'5',ac_natural:'1',ac_deflect:'1',ac_dodge:'1',ac_temp:'2',touch_temp:'1',flat_temp:'2',cmd_temp:'1',cmb_temp:'2',ar_melee_temp:'1',ar_ranged_temp:'2',fort_base:'3',fort_enhance:'1',ref_base:'2',will_base:'1',hp_curr:'9',hp_temp:'3',hp_max:'20',hp_max_temp:'2',mp:'5',mp_temp:'2',mp_class:'8',mp_bonus:'3',mp_max_temp:'1',classes:[{name:'Black Mage',level:4}],group_tags:['Keep'],secretLegacy:{keep:true},items:[{name:'Staff',amount:'1',sourceItemId:'original',desc:'Text'}],activeAbilities:[{name:'Power',u_curr:0,u_max:2},{name:'Once',u_curr:0,u_max:1,restoreOnLongRest:false}]};
test('sheet formulas match legacy components, score modifiers and fallback totals',()=>{
 const s=sheetStats(data);assert.equal(modifier(9),-1);assert.equal(s.ac,23);assert.equal(s.touch,16);assert.equal(s.flat,20);assert.equal(s.cmd,16);assert.equal(s.cmb,12);assert.equal(s.melee,11);assert.equal(s.ranged,10);assert.equal(s.fort,5);assert.equal(s.hpMax,22);assert.equal(s.mp,7);assert.equal(s.mpMax,12);
 assert.equal(skillTotal({stat:'int',lvl:2,temp:1,cs:true},data),9);assert.equal(skillTotal({stat:'int',lvl:0,temp:0,cs:true},data),3);assert.equal(weaponAttack({ability_mod:'dex',attack_misc:1},data),10);
 assert.equal(sheetStats({ac_total:21,mp_curr:7,mp_max:12}).ac,21);assert.equal(sheetStats({ac_total:21,mp_curr:7,mp_max:12}).mpMax,12);
});
test('sheet patches preserve legacy metadata, entry fields and tags, and validate input',()=>{
 const next=mergeSheetData(data,{action:'entry',collection:'items',index:0,mode:'update',fields:{amount:3,equipped:true}});assert.equal(next.items[0].sourceItemId,'original');assert.equal(next.items[0].desc,'Text');assert.equal(next.items[0].amount,3);assert.deepEqual(next.group_tags,['Keep']);assert.deepEqual(next.secretLegacy,{keep:true});assert.equal(data.items[0].amount,'1');
 assert.equal(mergeSheetData(data,{action:'fields',fields:{mp_curr:4}}).mp,2);
 assert.throws(()=>mergeSheetData(data,{action:'fields',fields:{group_tags:['Admin']}}));assert.throws(()=>mergeSheetData(data,{action:'fields',fields:{str:'NaN'}}));assert.throws(()=>mergeSheetData(data,{action:'entry',collection:'items',mode:'update',index:-1,fields:{amount:0}}));assert.throws(()=>mergeSheetData(data,{action:'entry',collection:'items',mode:'update',index:0,fields:JSON.parse('{"__proto__":{"admin":true}}')}));
});
test('rest and MP spending are atomic and preserve per-ability rest preference',()=>{
 const rest=mergeSheetData(data,{action:'rest'});assert.equal(rest.hp_curr,13);assert.equal(rest.mp,12);assert.equal(rest.mp_temp,0);assert.equal(rest.activeAbilities[0].u_curr,2);assert.equal(rest.activeAbilities[1].u_curr,0);
 const cast=mergeSheetData(data,{action:'spendMp',amount:3});assert.equal(cast.mp_curr,4);assert.throws(()=>mergeSheetData(data,{action:'spendMp',amount:8}));assert.throws(()=>mergeSheetData(data,{action:'spendMp',amount:-1}));
});
test('sheet rendering is minimal, escaped and only renders the selected section',()=>{
 const char={id:'sample',name:'<img onerror=x>',data:{...data,notesArea:'<script>bad</script>',items:[{name:'<svg onload=x>',desc:'private description'}]}};
 const html=renderSheetFrame(char,'overview');assert.match(html,/&lt;img onerror=x&gt;/);assert.doesNotMatch(html,/private description|<script>|<iframe|Shop|Calendar/);assert.match(html,/data-sheet-tab="combat"/);assert.doesNotMatch(renderSection(char,'items'),/private description/);assert.match(entryDetail(char.data.items[0]),/private description/);assert.match(renderSection(char,'notes'),/&lt;script&gt;bad/);
});
test('dice rolls use bounded parsed expressions without eval',()=>{
 assert.deepEqual(rollDice('2d6+3',()=>4),{expression:'2d6+3',rolls:[4,4],bonus:3,total:11});assert.equal(rollDice('1d20-2',()=>1).total,-1);for(const v of ['100d20','1d1','1d9999','alert(1)','1d20;evil()'])assert.throws(()=>rollDice(v));
});
test('sheet HTTP sync enforces owner/admin access, revision conflicts and small unchanged responses',async()=>{
 const db=await openDatabase(':memory:'),users=createUserRepository(db),owner=users.create({displayName:'Owner'}),other=users.create({displayName:'Other'}),id=randomUUID();createCharactersService(db).save({op:'save',id,revision:0,name:'Mage',ownerId:owner.id,sources:[]});db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?)').run(id,JSON.stringify(data));
 const sessions={restore:async c=>{if(!['owner','admin','other'].includes(c))throw Error();return {subject:c,user:c==='other'?other:owner};}},origin='https://example.test',server=createApiServer({db,directoryRoutes:createDirectoryRoutes({db,sessions,adminUids:['admin'],origin})});await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/api/v1/character-records/${id}`,headers=who=>({Cookie:'__Host-comos_session='+who,Origin:origin,'Content-Type':'application/json'});
 try{
  assert.equal((await fetch(url)).status,401);assert.equal((await fetch(url,{headers:headers('other')})).status,404);
  const ownerView=await(await fetch(url,{headers:headers('owner')})).json();assert.equal(ownerView.admin,false);
  const streamControl=new AbortController(),stream=await fetch(url+'?stream=1',{headers:headers('owner'),signal:streamControl.signal});assert.match(stream.headers.get('content-type'),/text\/event-stream/);const reader=stream.body.getReader();assert.match(new TextDecoder().decode((await reader.read()).value),/revision.*1/);streamControl.abort();await reader.cancel().catch(()=>{});
  const unchanged=await(await fetch(url+'?revision=1',{headers:headers('owner')})).json();assert.deepEqual(unchanged,{unchanged:true,revision:1});assert.equal((await fetch(url+'?revision=1',{headers:headers('other')})).status,404);
  let r=await fetch(url,{method:'POST',headers:headers('admin'),body:JSON.stringify({op:'sheet',action:'fields',revision:1,fields:{hp_curr:6}})});assert.equal(r.status,200);let body=await r.json();assert.equal(body.admin,true);assert.equal(body.character.revision,2);
  r=await fetch(url,{method:'POST',headers:headers('owner'),body:JSON.stringify({op:'sheet',action:'fields',revision:1,fields:{hp_curr:4}})});assert.equal(r.status,409);
  const reloaded=await(await fetch(url+'?revision=1',{headers:headers('owner')})).json();assert.equal(reloaded.character.data.hp_curr,6);
  r=await fetch(url,{method:'POST',headers:headers('owner'),body:JSON.stringify({op:'sheet',action:'fields',revision:2,fields:{group_tags:['Admin']}})});assert.equal(r.status,400);
  r=await fetch(url,{method:'POST',headers:{...headers('owner'),Origin:'https://evil.test'},body:JSON.stringify({op:'sheet',action:'rest',revision:2})});assert.equal(r.status,403);
  r=await fetch(url,{method:'POST',headers:headers('owner'),body:JSON.stringify({op:'sheet',action:'entry',revision:2,collection:'items',index:0,mode:'update',fields:{amount:3}})});assert.equal(r.status,200);body=await r.json();assert.equal(body.character.data.items[0].sourceItemId,'original');assert.deepEqual(body.character.data.group_tags,['Keep']);
  r=await fetch(url,{method:'POST',headers:headers('owner'),body:JSON.stringify({op:'sheet',action:'entry',revision:3,collection:'spells',mode:'add',fields:{name:'Fire',lvl:2}})});assert.equal(r.status,200);
  r=await fetch(url,{method:'POST',headers:headers('owner'),body:JSON.stringify({op:'sheet',action:'cast',revision:4,index:0})});assert.equal(r.status,200);body=await r.json();assert.equal(body.character.revision,5);assert.equal(body.character.data.mp_temp,0);assert.equal(body.character.data.mp,5);
  r=await fetch(url,{method:'POST',headers:headers('owner'),body:JSON.stringify({op:'sheet',action:'cast',revision:4,index:0})});assert.equal(r.status,409);
  r=await fetch(url,{method:'POST',headers:headers('owner'),body:JSON.stringify({op:'sheet',action:'entry',revision:5,collection:'weapons',mode:'add',fields:{name:'Sword',attack_type:'melee',ability_mod:'auto',damage:'1d8+4',crit_range:'20',crit_mult:'x2'}})});assert.equal(r.status,200);
  const weaponRequest={op:'roll',kind:'weapon',index:0,revision:6,requestId:randomUUID(),discord:false};
  r=await fetch(url,{method:'POST',headers:headers('other'),body:JSON.stringify(weaponRequest)});assert.equal(r.status,404);
  r=await fetch(url,{method:'POST',headers:headers('owner'),body:JSON.stringify({...weaponRequest,revision:5})});assert.equal(r.status,409);
  r=await fetch(url,{method:'POST',headers:headers('owner'),body:JSON.stringify(weaponRequest)});assert.equal(r.status,200);const receipt=await r.json();assert.equal(receipt.roll.kind,'weapon');assert.equal(receipt.roll.weaponName,'Sword');assert.ok(receipt.roll.damage.total>=5);assert.equal(receipt.discord,'off');
  r=await fetch(url,{method:'POST',headers:headers('owner'),body:JSON.stringify(weaponRequest)});assert.deepEqual(await r.json(),receipt);


 }finally{await new Promise(r=>server.close(r));db.close();}
});

test('damage consumes temp HP first; heal caps at max and rejects negative amounts',()=>{
 const damage=mergeSheetData(data,{action:'damage',amount:5});assert.equal(damage.hp_temp,0);assert.equal(damage.hp_curr,7);
 const absorbed=mergeSheetData(data,{action:'damage',amount:2});assert.equal(absorbed.hp_temp,1);assert.equal(absorbed.hp_curr,9);
 assert.equal(mergeSheetData(data,{action:'heal',amount:100}).hp_curr,22);assert.throws(()=>mergeSheetData(data,{action:'damage',amount:-1}));
 const html=renderSection({id:'sample',name:'Mage',data},'combat');assert.doesNotMatch(html,/>Base<|>BAB<|>Speed</);assert.doesNotMatch(html,/data-health=/);assert.match(html,/data-formula="AC"/);assert.match(renderSheetFrame({id:'sample',name:'Mage',data},'combat'),/aria-label="Recovery"/);
});

test('heart groups combat, abilities and spells; ability categories render only selected records',()=>{
 const c={id:'sample',name:'Mage',data:{hp_curr:5,hp_max:10,hp_temp:0,activeAbilities:[{name:'Active choice'}],passiveAbilities:[{name:'Passive choice'}],racialAbilities:[{name:'Racial choice'}],feats:[{name:'Feat choice'}]}};
 const html=renderSheetFrame(c,'abilities',{ability:'passiveAbilities'});
 assert.match(html,/aria-label="Combat, abilities and spells"/);assert.match(html,/aria-label="Combat sections"/);assert.match(html,/aria-label="Ability categories"/);
 assert.match(html,/data-ability-category="passiveAbilities" aria-pressed="true"/);assert.match(html,/Passive choice/);assert.doesNotMatch(html,/Active choice|Racial choice|Feat choice/);
 const combat=renderSection(c,'combat');assert.match(combat,/data-resource-input="hp_temp" value="0"/);assert.match(combat,/aria-label="Temporary HP"/);assert.doesNotMatch(combat,/data-health=/);
});

test('icon navigation, combat layout and persistent favorites preserve original entry metadata',()=>{
 const original={...data,weapons:[{name:'Staff',damage:'1d6',sourceItemId:'retained'}],activeAbilities:[{name:'Focus',u_curr:2,u_max:3}]};
 const next=mergeSheetData(original,{action:'entry',collection:'weapons',index:0,mode:'update',fields:{favorite:true}});assert.equal(next.weapons[0].favorite,true);assert.equal(next.weapons[0].sourceItemId,'retained');assert.equal(original.weapons[0].favorite,undefined);
 const c={id:'sample',name:'Mage',data:next};const html=renderSheetFrame(c,'combat');assert.match(html,/data-sheet-tab="favorites"/);assert.ok(html.indexOf('data-sheet-tab="favorites"')<html.indexOf('data-sheet-tab="overview"'));for(const label of ['Character','Skills','Inventory','Notes','Recovery','Send rolls to Discord'])assert.match(html,new RegExp('aria-label="'+label+'"'));
 assert.doesNotMatch(renderSection(c,'overview'),/At a glance/);const combat=renderSection(c,'combat');assert.doesNotMatch(combat,/>Base<|>BAB<|>Speed</);assert.ok(combat.indexOf('Offense and defense')<combat.indexOf('Saving throws'));
 const offense=renderSection(c,'combat',{combatView:'offense'});assert.match(offense,/data-favorite="weapons:0"/);assert.match(offense,/aria-pressed="true"/);const favorites=renderSection(c,'favorites');assert.match(favorites,/Staff/);assert.doesNotMatch(favorites,/Focus/);assert.match(favorites,/data-edit-entry="weapons:0"/);
 const removed=mergeSheetData(next,{action:'entry',collection:'weapons',index:0,mode:'update',fields:{favorite:false}});assert.doesNotMatch(renderSection({id:'sample',name:'Mage',data:removed},'favorites'),/Staff/);assert.throws(()=>mergeSheetData(original,{action:'entry',collection:'weapons',index:0,mode:'update',fields:{favorite:'true'}}));
});
