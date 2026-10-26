import {gilUnits} from './catalog.mjs';
const fail=(message,status=400)=>Object.assign(Error(message),{httpStatus:status,error:'invalid_purchase'});
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const balance=d=>gilUnits(Number(d.currency_gil??d.gil??0));
export function createPurchaseService(db,items){
 const summary=row=>{const d=JSON.parse(row.data_json||'{}'),units=balance(d);return {id:row.id,name:row.name,ownerName:row.owner_name,revision:row.revision,gil:units===null?null:units/100};};
 function characters({q='',cursor=''}={}){
  if(typeof q!=='string'||q.length>80||cursor&&!uuid(cursor))throw fail('Invalid character search.');
  const rows=db.prepare('SELECT c.*,u.display_name AS owner_name,d.data_json FROM characters c JOIN users u ON u.id=c.owner_id LEFT JOIN character_details d ON d.character_id=c.id WHERE c.archived=0 AND c.id>? AND (instr(lower(c.name),lower(?))>0 OR instr(lower(u.display_name),lower(?))>0) ORDER BY c.id LIMIT 21').all(cursor,q,q);
  return {characters:rows.slice(0,20).map(summary),nextCursor:rows.length>20?rows[19].id:null};
 }
 const character=id=>{if(!uuid(id))throw fail('Choose a character.');const row=db.prepare('SELECT c.*,u.display_name AS owner_name,d.data_json FROM characters c JOIN users u ON u.id=c.owner_id LEFT JOIN character_details d ON d.character_id=c.id WHERE c.id=? AND c.archived=0').get(id);if(!row)throw fail('Character unavailable.',404);return summary(row);};
 function purchase(userId,change){
  const fields=['op','requestId','characterId','itemId','quantity','revision','itemRevision'];
  if(!change||Object.keys(change).some(k=>!fields.includes(k))||change.op!=='buy'||!uuid(change.requestId)||!uuid(change.characterId)||!uuid(change.itemId)||!Number.isInteger(change.quantity)||change.quantity<1||change.quantity>999||!Number.isSafeInteger(change.revision)||change.revision<1||!Number.isSafeInteger(change.itemRevision)||change.itemRevision<1)throw fail('Choose an item, character and quantity of 1–999.');
  const fingerprint=JSON.stringify([change.characterId,change.itemId,change.quantity,change.revision,change.itemRevision]);
  db.exec('BEGIN IMMEDIATE');try{
   const existing=db.prepare('SELECT * FROM item_purchases WHERE request_id=?').get(change.requestId);
   if(existing){if(existing.user_id!==userId||existing.fingerprint!==fingerprint)throw fail('This purchase ID was already used.',409);db.exec('COMMIT');return JSON.parse(existing.receipt_json);}
   const c=db.prepare('SELECT * FROM characters WHERE id=? AND archived=0').get(change.characterId);
   if(!c)throw fail('Character unavailable.',404);if(c.revision!==change.revision)throw fail('Character changed. Recheck its gil before buying.',409);
   const item=items.get(change.itemId);if(!item||item.archived)throw fail('Item unavailable.',404);if(item.revision!==change.itemRevision)throw fail('Item or price changed. Reopen it before buying.',409);
   if(item.priceGil===null)throw fail('Set a fixed gil price before buying this item.');
   const unit=gilUnits(item.priceGil),total=unit*change.quantity;if(unit===null||!Number.isSafeInteger(total))throw fail('Invalid gil price.');
   const data=JSON.parse(db.prepare('SELECT data_json FROM character_details WHERE character_id=?').get(c.id)?.data_json||'{}'),funds=balance(data);
   if(funds===null)throw fail('Set a valid gil balance in the sheet first.');if(funds<total)throw fail('Not enough gil.');
   const inventory=Array.isArray(data.items)?data.items:[],catalog=item.catalog||{},now=new Date().toISOString();
   if(inventory.length>=1000)throw fail('Inventory has too many entries.');
   // Retain all source properties separately. Never equip or apply bonuses while buying.
   inventory.push({name:item.name,desc:item.description,sourceCategory:item.category,tags:item.category,amount:change.quantity,equipped:false,equip_slot:'',sourceItemId:item.id,sourceOriginalId:catalog.id||'',sourceCatalog:catalog,details:catalog.details||[],slot:Number.isFinite(Number(catalog.slotAmount))&&Number(catalog.slotAmount)>=0?Number(catalog.slotAmount):1,unitPriceGil:item.priceGil,purchasedForGil:total/100,purchasedAt:now,cost:item.costText,link:catalog.sourceUrl||'',...(catalog.dmg?{damage:catalog.dmg}:{}),...(catalog.range?{range:catalog.range}:{})});
   data.items=inventory;data.currency_gil=(funds-total)/100;data.gil=data.currency_gil;
   const json=JSON.stringify(data);if(Buffer.byteLength(json)>500000)throw fail('Character inventory is too large.');
   db.prepare('INSERT INTO character_details(character_id,data_json) VALUES(?,?) ON CONFLICT(character_id) DO UPDATE SET data_json=excluded.data_json').run(c.id,json);
   db.prepare('UPDATE characters SET revision=revision+1,updated_at=? WHERE id=?').run(now,c.id);
   const receipt={requestId:change.requestId,characterId:c.id,characterName:c.name,itemName:item.name,quantity:change.quantity,totalGil:total/100,remainingGil:data.currency_gil,revision:c.revision+1};
   db.prepare('INSERT INTO item_purchases VALUES(?,?,?,?,?,?)').run(change.requestId,userId,c.id,fingerprint,JSON.stringify(receipt),now);
   db.exec('COMMIT');return receipt;
  }catch(error){db.exec('ROLLBACK');throw error;}
 }
 return {characters,character,purchase};
}
