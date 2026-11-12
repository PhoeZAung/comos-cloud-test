import {peer} from './rpc.mjs';
import {requestSheetDice} from './rolls.mjs';
import {attackOutcome} from './combat-target.mjs';
const nativeFetch=window.fetch.bind(window),nonce=location.hash.slice(1),controller=window.opener||parent;let connection,character;
const connected=new Promise(resolve=>{
 window.addEventListener('message',function receive(event){
  if(event.origin!==location.origin||event.source!==controller||event.data?.type!=='cosmos:sheet-port'||event.data.nonce!==nonce||!event.ports[0])return;
  connection=peer(event.ports[0],()=>{throw Error('Unsupported request.');});window.removeEventListener('message',receive);resolve();
 });
});
window.fetch=async(input,options={})=>{
 const url=new URL(typeof input==='string'?input:input.url,location.href);
 if(url.origin!==location.origin||!url.pathname.startsWith('/api/'))return nativeFetch(input,options);
 await connected;
 const method=options.method||'GET',body=options.body?JSON.parse(options.body):undefined;
 let combat=null;
 if(body?.op==='roll'&&body.mode!=='send'){
  if(!character||url.pathname!=='/api/v1/character-records/'+character.id)throw Error('Reload your character before rolling.');
  const collection=body.kind==='weapon'?'weapons':body.kind==='spell'?'spells':body.kind==='ability'?body.collection:null;
  const row=collection?character.data?.[collection]?.[body.index]:null;
  if(row&&(body.kind==='weapon'||['damage','heal','temp_hp'].includes(row.effect_type))){
   combat=await connection.call('combat-context',{
    requestId:body.requestId,characterId:character.id,kind:body.kind,
    row:{effect_type:row.effect_type,attack_type:row.attack_type,damage:row.damage}
   });
  }
  await connection.call('roll-context',{requestId:body.requestId});
  body.owlbearRolls=await requestSheetDice(character,body,notation=>connection.call('dice',{notation,requestId:body.requestId},100000));
 }
 const result=await connection.call('api',{path:url.pathname+url.search,method,body},30000);
 if(combat&&result.status===200&&result.data?.roll){
  const roll=result.data.roll;
  roll.combat={target:combat.targetName,ac:combat.ac,defense:combat.defense,
   outcome:roll.spellFailure?.failed?'Spell failed':attackOutcome(roll,combat),
   applied:false};
  // Remove only the target used by this successful roll. Do not clear a new selection.
  try{await connection.call('combat-complete',{requestId:body.requestId,targetId:combat.targetId});}
  catch(error){console.warn('Could not clear Owlbear target:',error.message);}
 }
 const current=result.data?.character;
 if(current&&current.id===new URL(location.href).searchParams.get('characterId')){
  if(current.id!==character?.id)controller.postMessage({type:'cosmos:sheet-selected',nonce,characterId:current.id},location.origin);
  character=current;
 }
 return new Response(JSON.stringify(result.data),{status:result.status,headers:{'Content-Type':'application/json'}});
};
document.addEventListener('click',event=>{
 // The host owns the sheet picker and pop-out grant; never open an unconnected popup.
 const add=event.target.closest('[data-add-sheet]'),pop=event.target.closest('[data-sheet-popout]');
 if(add||pop){
  event.preventDefault();event.stopImmediatePropagation();
  if(pop&&window.parent!==window){
   try{if(window.parent.cosmosOpenSheetWindow?.(nonce))return;}catch{}
  }
  controller.postMessage({type:add?'cosmos:add-sheet':'cosmos:popout-sheet',nonce},location.origin);return;
 }
 const link=event.target.closest('a[href]');if(!link)return;const url=new URL(link.href);
 if(url.origin!==location.origin)return;
 event.preventDefault();
 if(url.pathname==='/characters.html'){controller.postMessage({type:'cosmos:back',nonce},location.origin);if(window.opener)window.close();}
 else window.open(url.href,'_blank','noopener');
},true);
controller.postMessage({type:'cosmos:sheet-ready',nonce},location.origin);
await connected;
await import(new URL('/assets/sheet-entry.mjs',location.origin).href);
window.addEventListener('pagehide',()=>connection?.close(),{once:true});
