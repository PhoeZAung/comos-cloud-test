import {firstCoreManual} from './first-core-manual-catalog.mjs';

export const manualSourceFamilies=firstCoreManual.families;
const collections=['activeAbilities','passiveAbilities','feats','spells'];
const rows=data=>collections.flatMap(key=>data[key]||[]);
export function manualSourceOptions(data,{familyId,pageId='',query=''}={}){
 const family=manualSourceFamilies.find(f=>f.id===familyId);if(!family)return [];
 const search=String(query).trim().toLocaleLowerCase(),existing=rows(data);
 return family.pages.filter(p=>!pageId||p.id===pageId).flatMap(page=>page.cards.map(card=>({
  ...card,familyId:family.id,familyName:family.name,pageId:page.id,pageName:page.name,pageKind:page.kind,
  url:card.url||page.url,sourceMarkdownSha256:card.markdownSha256||page.markdownSha256,
  limitBreak:card.limitBreak||/limit breaks?/i.test(card.name),
  defaultCollection:page.kind==='songs'?'spells':card.limitBreak||/limit breaks?/i.test(card.name)||['active','mixed'].includes(card.activation)?'activeAbilities':'passiveAbilities',
  added:existing.some(row=>row.manualSourceId===card.id||row.sourceRuleId===card.id||card.canonicalRuleId&&row.sourceRuleId===card.canonicalRuleId)
 }))).filter(card=>!search||[card.name,card.description,card.pageName,card.prerequisites||''].some(text=>text.toLocaleLowerCase().includes(search)));
}

// This is the equivalent of the player's manual entry editor: it deliberately
// grants no class entitlement, prerequisites, stats, replacement or rest rules.
// Source IDs/URLs/text come from the catalog, never from the client request.
export function addManualSourceAbilities(data,picks){
 if(!Array.isArray(picks)||!picks.length||picks.length>100)throw Error('Choose between 1 and 100 source entries.');
 if(picks.some(p=>!p||typeof p!=='object'||Array.isArray(p)||Object.keys(p).some(k=>!['id','collection','maximum'].includes(k))||typeof p.id!=='string'))throw Error('Invalid source selection.');
 if(new Set(picks.map(p=>p.id)).size!==picks.length)throw Error('Choose each source entry once.');
 const catalog=manualSourceFamilies.flatMap(f=>manualSourceOptions(data,{familyId:f.id}));
 const prepared=picks.map(p=>{
  const option=catalog.find(o=>o.id===p.id);
  if(!option)throw Error('This source entry is unavailable.');
  if(option.added)throw Error(option.name+' is already on the sheet.');
  const collection=p.collection??option.defaultCollection,maximum=p.maximum??0;
  if(!collections.includes(collection)||(option.pageKind==='songs')!==(collection==='spells')||option.limitBreak&&collection!=='activeAbilities')throw Error('Choose a valid destination for this source entry.');
  if(!Number.isSafeInteger(maximum)||maximum<0||maximum>1000000||(collection==='spells'||option.limitBreak)&&maximum!==0)throw Error('Enter a whole usage maximum from 0 to 1,000,000; songs and Limit Breaks use their own pools.');
  const row={name:option.name,desc:option.description,manualSourceId:option.id,
   sourceRuleId:'cosmos:manual-source:'+option.id,sourceClass:option.familyName,sourceURL:option.url,link:option.url,
   sourceTextHash:option.textSha256,sourceMarkdownSha256:option.sourceMarkdownSha256,
   manualImport:true,automation:'manual',rulesOwned:false};
  const notes=[option.prerequisites&&option.prerequisites!=='—'?'Prerequisites: '+option.prerequisites:'',option.sheetNote||''].filter(Boolean);
  if(notes.length)row.effect=notes.join('\n\n');
  if(option.pageKind==='archetype')row.sourceArchetype=option.pageName;
  if(collection==='spells'){row.lvl=option.level;row.casting_ability='cha';}
  else{row.u_max=maximum;row.u_curr=maximum;row.restoreOnLongRest=false;}
  if(option.limitBreak)row.limitBreak=true;
  return {collection,row};
 });
 for(const {collection,row} of prepared){data[collection]??=[];data[collection].push(row);}
 return prepared.map(p=>p.row);
}
