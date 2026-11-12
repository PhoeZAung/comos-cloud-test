import {npcDirectory,npcDirectoryPath} from './npcs.mjs';
import {normalizeNpcSheet} from '../../src/features/characters/npc-stat-block.mjs';
import {createPublicPartyRoutes} from './public-party.mjs';
import {sheetSkills} from '../../src/features/sheet/skills.mjs';
import {publishRoll} from './rolls.mjs';
import {catalogInventoryItem} from '../items/inventory.mjs';
import {randomUUID} from 'node:crypto';
import {adminSession,adminJson} from '../auth/admin-requests.mjs';
import {mergeSheetData} from './sheet-fields.mjs';
import {mergeWizardData} from './editor-fields.mjs';
import {compileBuild,levelUpBuild,appendClassBuild} from '../../src/features/characters/rules/build.mjs';
import {LORE_ADMIN_TAG_ID} from '../lore/access.mjs';
import {statusRoster,characterPortrait,STATUS_LIMIT} from './owlbear-status.mjs';
export function createDirectoryRoutes({db,sessions,adminUids,origin,items}){
 const admins=new Set(adminUids),streams=new Map(),publicParty=createPublicPartyRoutes(db);
 const tags=()=>db.prepare('SELECT * FROM character_tags ORDER BY name,id').all();
 return async(req,res,path,send)=>{
  if(await publicParty(req,res,path,send))return true;
  const recordPath='/api/v1/character-records/',isRecord=path.startsWith(recordPath);
  if(![npcDirectoryPath,'/api/v1/admin/directory','/api/v1/admin/tags','/api/v1/admin/owlbear-status','/api/v1/admin/owlbear-portrait'].includes(path)&&!isRecord)return false;
  if(!['GET','POST'].includes(req.method)){send(405,{error:'method_not_allowed'});return true;}
  if(req.method==='POST'&&(req.headers.origin!==origin||req.headers['sec-fetch-site']==='cross-site')){send(403,{error:'origin_not_allowed'});return true;}
  try{
   const session=await adminSession(req,sessions,admins);if(!session){send(401,{error:'sign_in_required'});return true;}
   const url=new URL(req.url,origin);
   if(!isRecord&&!session.admin){send(403,{error:'admin_required'});return true;}
   if(path===npcDirectoryPath){await npcDirectory({req,url,db,ownerId:session.user.id,send});return true;}
   if(['/api/v1/admin/owlbear-status','/api/v1/admin/owlbear-portrait'].includes(path)){
    if(req.method!=='GET'){send(405,{error:'method_not_allowed'});return true;}
    if(path.endsWith('/owlbear-status')){if(url.search)throw Error('Unsupported status query.');send(200,{characters:statusRoster(db)});}
    else{
     if([...url.searchParams.keys()].some(key=>key!=='characterId'))throw Error('Unsupported portrait query.');
     const row=db.prepare("SELECT d.data_json FROM characters c JOIN character_details d ON d.character_id=c.id WHERE c.id=? AND c.archived=0 AND c.kind='player'").get(url.searchParams.get('characterId')||'');
     const data=row?JSON.parse(row.data_json):null;
     if(data?.owlbearStatusVisible!==true){send(404,{error:'not_found'});return true;}
     send(200,{portrait:characterPortrait(data)});
    }
    return true;
   }
   if(path.endsWith('/directory')){
    if(req.method!=='GET'){send(405,{error:'method_not_allowed'});return true;}
    const q=(url.searchParams.get('q')||'').slice(0,80),cursor=(url.searchParams.get('cursor')||'').slice(0,128),ownerId=url.searchParams.get('ownerId');
    if(url.searchParams.get('groupBy')==='party'){
     const partyId=url.searchParams.get('partyTagId');
     if(partyId){
      const rows=db.prepare("SELECT c.id,c.name,c.revision,json_extract(d.data_json,'$.owlbearStatusVisible') AS owlbearStatusVisible FROM characters c JOIN character_tag_links l ON l.character_id=c.id JOIN character_tags t ON t.id=l.tag_id LEFT JOIN character_details d ON d.character_id=c.id WHERE t.id=? AND t.kind='party' AND c.archived=0 AND c.kind='player' AND c.id>? AND (instr(lower(c.name),lower(?))>0 OR instr(lower(t.name),lower(?))>0) ORDER BY c.id LIMIT 21").all(partyId,cursor,q,q);
      send(200,{characters:rows.slice(0,20).map(c=>({...c,owlbearStatusVisible:c.owlbearStatusVisible===1,tags:db.prepare('SELECT t.* FROM character_tags t JOIN character_tag_links l ON l.tag_id=t.id WHERE l.character_id=?').all(c.id)})),nextCursor:rows.length>20?rows[19].id:null});
     }else{
      const rows=db.prepare("SELECT t.id,t.name,(SELECT count(*) FROM character_tag_links l JOIN characters c ON c.id=l.character_id WHERE l.tag_id=t.id AND c.archived=0 AND c.kind='player') AS characterCount FROM character_tags t WHERE t.kind='party' AND t.id>? AND (instr(lower(t.name),lower(?))>0 OR EXISTS(SELECT 1 FROM character_tag_links l JOIN characters c ON c.id=l.character_id WHERE l.tag_id=t.id AND c.archived=0 AND c.kind='player' AND instr(lower(c.name),lower(?))>0)) ORDER BY t.id LIMIT 51").all(cursor,q,q);
      send(200,{parties:rows.slice(0,50),nextCursor:rows.length>50?rows[49].id:null});
     }return true;
    }
    if(ownerId){const rows=db.prepare("SELECT c.id,c.name,c.revision,json_extract(d.data_json,'$.owlbearStatusVisible') AS owlbearStatusVisible FROM characters c JOIN users u ON u.id=c.owner_id LEFT JOIN character_details d ON d.character_id=c.id WHERE c.owner_id=? AND c.archived=0 AND c.kind='player' AND c.id>? AND (instr(lower(c.name),lower(?))>0 OR instr(lower(u.display_name),lower(?))>0) ORDER BY c.id LIMIT 21").all(ownerId,cursor,q,q);send(200,{characters:rows.slice(0,20).map(c=>({...c,owlbearStatusVisible:c.owlbearStatusVisible===1,tags:db.prepare('SELECT t.* FROM character_tags t JOIN character_tag_links l ON l.tag_id=t.id WHERE l.character_id=?').all(c.id)})),nextCursor:rows.length>20?rows[19].id:null});}
    else{const rows=db.prepare("SELECT u.id,u.display_name AS displayName,u.revision,(SELECT count(*) FROM characters c WHERE c.owner_id=u.id AND c.archived=0 AND c.kind='player') AS characterCount FROM users u WHERE u.deleted_at IS NULL AND u.id>? AND (instr(lower(u.display_name),lower(?))>0 OR EXISTS(SELECT 1 FROM characters c WHERE c.owner_id=u.id AND c.archived=0 AND c.kind='player' AND instr(lower(c.name),lower(?))>0)) ORDER BY u.id LIMIT 51").all(cursor,q,q);send(200,{users:rows.slice(0,50),nextCursor:rows.length>50?rows[49].id:null});}return true;
   }
   if(path.endsWith('/tags')){
    if(req.method==='POST'){
     const data=await adminJson(req);
     if(!data||Object.keys(data).some(key=>!['name','id','kind'].includes(key))||typeof data.name!=='string'||!data.name.trim()||data.name.length>80||/[\u0000-\u001f]/.test(data.name))throw Error('Use a tag name of 1–80 characters.');
     if(data.kind!==undefined&&!['world','party'].includes(data.kind))throw Error('Choose World or Party.');
     if(data.id===LORE_ADMIN_TAG_ID||data.name.trim().toLowerCase()==='admin')throw Error('The Admin tag is reserved.');
     db.exec('BEGIN IMMEDIATE');try{
      if(data.id){const changed=db.prepare('UPDATE character_tags SET name=?,kind=COALESCE(?,kind) WHERE id=?').run(data.name.trim(),data.kind??null,data.id);if(!changed.changes)throw Error('Tag not found.');db.prepare('UPDATE characters SET revision=revision+1,updated_at=? WHERE id IN (SELECT character_id FROM character_tag_links WHERE tag_id=?)').run(new Date().toISOString(),data.id);}
      else db.prepare('INSERT INTO character_tags(id,name,kind) VALUES(?,?,?)').run(randomUUID(),data.name.trim(),data.kind||'party');
      db.exec('COMMIT');
     }catch(error){db.exec('ROLLBACK');throw error;}
    }
    send(200,{tags:tags()});return true;
   }
   const id=path.slice(recordPath.length),c=db.prepare('SELECT * FROM characters WHERE id=?').get(id);
   if(!c||c.archived||(!session.admin&&(c.kind==='npc'||c.owner_id!==session.user.id))){send(404,{error:'not_found'});return true;}
   if(req.method==='GET'&&url.searchParams.get('stream')==='1'){
    const count=streams.get(session.user.id)||0;if(count>=4){send(429,{error:'too_many_streams'});return true;}streams.set(session.user.id,count+1);
    res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-store','Connection':'keep-alive','X-Accel-Buffering':'no'});let previous=-1,ended=false;
    const close=()=>{if(ended)return;ended=true;clearInterval(interval);clearTimeout(expiry);streams.set(session.user.id,Math.max(0,(streams.get(session.user.id)||1)-1));if(!streams.get(session.user.id))streams.delete(session.user.id);res.end();};
    const tick=()=>{try{const row=db.prepare('SELECT revision,owner_id,archived,kind FROM characters WHERE id=?').get(id);if(!row||row.archived||(!session.admin&&(row.kind==='npc'||row.owner_id!==session.user.id))){close();return;}if(row.revision!==previous){previous=row.revision;res.write('data: '+JSON.stringify({revision:previous})+'\n\n');}else res.write(': keepalive\n\n');}catch{close();}};
    const interval=setInterval(tick,1000),expiry=setTimeout(close,25000);res.on('close',close);tick();return true;
   }
   if(req.method==='GET'&&url.searchParams.get('revision')===String(c.revision)){send(200,{unchanged:true,revision:c.revision});return true;}
   let data=JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(id)?.data_json||'{}');
   const npc=c.kind==='npc';
   if(npc)data=normalizeNpcSheet(data);
   else data.skills=sheetSkills(data);
   if(req.method==='POST'){
    const change=await adminJson(req,230000);
    if(npc&&(!['sheet','roll','edit','archive','wizard'].includes(change.op)||change.op==='wizard'&&change.step!=='identity'))throw Error('This action is only available for player characters.');
    if(change.op==='archive'&&(Object.keys(change).sort().join(',')!=='confirmName,op,revision'||change.confirmName!==c.name)){send(400,{error:'invalid_request',message:'Confirm the exact character name to delete.'});return true;}if(change.op==='roll'){const result=await publishRoll({db,userId:session.user.id,character:{...c,data},change,origin});publicParty.refresh();send(200,result);return true;}if(change.revision!==c.revision){send(409,{error:'conflict',message:'This character changed. Reload before saving.'});return true;}
    db.exec('BEGIN IMMEDIATE');try{
     if(db.prepare('SELECT revision FROM characters WHERE id=?').get(id).revision!==change.revision)throw Object.assign(Error('Character changed. Reload before saving.'),{httpStatus:409});
     if(change.op==='archive'){
      const updated=db.prepare('UPDATE characters SET archived=1,revision=revision+1,updated_at=? WHERE id=? AND revision=? AND archived=0').run(new Date().toISOString(),id,change.revision);
      if(updated.changes!==1)throw Object.assign(Error('Character changed. Reload before deleting.'),{httpStatus:409});
     }else if(change.op==='tags'){
      if(!session.admin)throw Object.assign(Error('Administrator access required.'),{httpStatus:403});if(!Array.isArray(change.tagIds)||change.tagIds.length>100||change.tagIds.some(t=>typeof t!=='string'||!db.prepare('SELECT 1 FROM character_tags WHERE id=?').get(t)))throw Error('Invalid tags.');
      db.prepare('DELETE FROM character_tag_links WHERE character_id=?').run(id);for(const t of new Set(change.tagIds))db.prepare('INSERT INTO character_tag_links VALUES(?,?)').run(id,t);data.group_tags=change.tagIds.map(t=>db.prepare('SELECT name FROM character_tags WHERE id=?').get(t).name);db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?) ON CONFLICT(character_id) DO UPDATE SET data_json=excluded.data_json').run(id,JSON.stringify(data));
     }else if(change.op==='owlbear-status'){
      if(!session.admin)throw Object.assign(Error('Administrator access required.'),{httpStatus:403});
      if(Object.keys(change).sort().join(',')!=='op,revision,visible'||typeof change.visible!=='boolean')throw Error('Invalid Owlbear status setting.');
      if(change.visible&&data.owlbearStatusVisible!==true){const count=db.prepare("SELECT count(*) AS count FROM characters c JOIN character_details d ON d.character_id=c.id WHERE c.archived=0 AND c.kind='player' AND json_extract(d.data_json,'$.owlbearStatusVisible')=1").get().count;if(count>=STATUS_LIMIT)throw Error('Choose up to '+STATUS_LIMIT+' characters for the Owlbear status overlay.');}
      data.owlbearStatusVisible=change.visible;
      db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?) ON CONFLICT(character_id) DO UPDATE SET data_json=excluded.data_json').run(id,JSON.stringify(data));
     }else if(change.op==='sheet'){
      if(change.action==='addCatalogItem'){
       if(npc||c.owner_id!==session.user.id)throw Object.assign(Error('Choose one of your own characters.'),{httpStatus:403});
       if(!Number.isInteger(change.quantity)||change.quantity<1||change.quantity>999)throw Error('Choose a quantity from 1 to 999.');
       const item=items?.get(change.itemId);
       if(!item||item.archived)throw Object.assign(Error('This item is unavailable.'),{httpStatus:404});
       const inventory=Array.isArray(data.items)?data.items:[];
       if(inventory.length>=1000)throw Error('Inventory has too many entries.');
       data.items=[...inventory,catalogInventoryItem(item,change.quantity)];
       if(Buffer.byteLength(JSON.stringify(data))>500000)throw Error('Character inventory is too large.');
      }else data=mergeSheetData(data,change,{npc});
      db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?) ON CONFLICT(character_id) DO UPDATE SET data_json=excluded.data_json').run(id,JSON.stringify(data));
     }else if(['wizard-build','wizard-level-up','wizard-add-class'].includes(change.op)){
      if(!Array.isArray(change.build?.skillRanks))throw Error('Allocate all skill points before saving.');
      if(change.op==='wizard-build'&&data.rulesBuild&&change.build?.level!==data.rulesBuild.input.level)throw Error('Use Level up to gain a level.');
      data=change.op==='wizard-add-class'?appendClassBuild(change.build,{...data,charName:data.charName||c.name}):change.op==='wizard-level-up'?levelUpBuild(change.build,data):compileBuild(change.build,data,{allowRankReduction:true});
      if(Buffer.byteLength(JSON.stringify(data))>600000)throw Error('Character plus rollback is too large.');
      db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?) ON CONFLICT(character_id) DO UPDATE SET data_json=excluded.data_json').run(id,JSON.stringify(data));
      db.prepare('UPDATE characters SET name=? WHERE id=?').run(data.charName,id);
     }else if(change.op==='wizard'){
      if(data.rulesBuild)throw Error('Use the current character builder or Level up for this character.');
      if(!['identity','race','class'].includes(change.step))throw Error('Invalid wizard step.');
      data=mergeWizardData(data,change.step,change.fields);
      if(Buffer.byteLength(JSON.stringify(data))>380000)throw Error('Character data is too large.');
      db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?) ON CONFLICT(character_id) DO UPDATE SET data_json=excluded.data_json').run(id,JSON.stringify(data));
      if(change.step==='identity')db.prepare('UPDATE characters SET name=? WHERE id=?').run(data.charName,id);
     }else if(change.op==='edit'){
      if(data.rulesBuild)throw Error('Use the current character builder to edit this character.');
      if(!change.fields||Object.keys(change.fields).some(k=>!['charName','race','class','level'].includes(k)))throw Error('Invalid character fields.');
      for(const [key,value] of Object.entries(change.fields)){if(typeof value!=='string'||value.length>120||/[\u0000-\u001f]/.test(value))throw Error('Invalid field.');if(key==='charName'&&(!value.trim()||value.length>80))throw Error('Enter a character name.');if(key==='level'&&!/^(?:[1-9]|[1-9][0-9])$/.test(value))throw Error('Level must be 1–99.');data[key]=value.trim();}
      db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?) ON CONFLICT(character_id) DO UPDATE SET data_json=excluded.data_json').run(id,JSON.stringify(data));if(change.fields.charName)db.prepare('UPDATE characters SET name=? WHERE id=?').run(change.fields.charName.trim(),id);
     }else throw Error('Invalid operation.');
     if(change.op!=='archive')db.prepare('UPDATE characters SET revision=revision+1,updated_at=? WHERE id=?').run(new Date().toISOString(),id);db.exec('COMMIT');
    }catch(error){db.exec('ROLLBACK');throw error;}
   }
   if(req.method==='POST')publicParty.refresh();
   if(req.method==='POST'&&db.prepare('SELECT archived FROM characters WHERE id=?').get(id)?.archived){send(200,{archived:true,id});return true;}
   const current=db.prepare('SELECT name,revision FROM characters WHERE id=?').get(id);
   send(200,{admin:session.admin,character:{id,...current,owned:c.owner_id===session.user.id,...(npc?{kind:'npc'}:{}),data,tags:db.prepare('SELECT tag_id AS id FROM character_tag_links WHERE character_id=?').all(id).map(t=>t.id),partyTags:db.prepare("SELECT t.id,t.name,t.kind FROM character_tags t JOIN character_tag_links l ON l.tag_id=t.id WHERE l.character_id=? AND t.kind='party' ORDER BY t.name COLLATE NOCASE,t.id").all(id)},availableTags:session.admin?tags():[]});
  }catch(error){send(error.httpStatus||400,{error:'invalid_request',message:error.message?.includes('UNIQUE')?'That name is already in use.':error.message||'Could not save.'});}return true;
 };
}
