// Pathfinder 1e carrying capacity (PRPG Core Rulebook p. 169).
// Source: https://aonprd.com/Rules.aspx?ID=118
// All thresholds are MAXIMUMS, not displayed minimum integer entry values.
// Size scaling therefore works for fractional pounds and smaller characters.
import {inventoryItemValue} from './inventory-fields.mjs';
import {itemCategoryForItem} from './item-categories.mjs';

const light=[0,3,6,10,13,16,20,23,26,30,33,38,43,50,58,66,76,86,100,116,133,153,173,200,233,266,306,346,400,466];
const medium=[0,6,13,20,26,33,40,46,53,60,66,76,86,100,116,133,153,173,200,233,266,306,346,400,466,533,613,693,800,933];
const heavy=[0,10,20,30,40,50,60,70,80,90,100,115,130,150,175,200,230,260,300,350,400,460,520,600,700,800,920,1040,1200,1400];
export const SIZE_CAPACITY=Object.freeze({
 Fine:[.125,.25],Diminutive:[.25,.5],Tiny:[.5,.75],Small:[.75,1],Medium:[1,1.5],
 Large:[2,3],Huge:[4,6],Gargantuan:[8,12],Colossal:[16,24]
});
const numeric=value=>value===null||value===undefined||value===''?0:Number.isFinite(Number(value))?Number(value):0;
const bounded=(value,min,max)=>Math.min(max,Math.max(min,value));
export function strengthCapacity(score){
 const str=Math.floor(numeric(score));
 if(str<=0)return {light:0,medium:0,heavy:0};
 if(str<=29){const idx=bounded(str,1,29);return {light:light[idx],medium:medium[idx],heavy:heavy[idx]};}
 const row=20+(str-20)%10,multiple=4**Math.floor((str-20)/10);
 return {light:light[row]*multiple,medium:medium[row]*multiple,heavy:heavy[row]*multiple};
}
const pounds=v=>Math.round(v*10000)/10000;
const loadName=key=>({light:'Light',medium:'Medium',heavy:'Heavy',over:'Over maximum'})[key]||'Light';
const validWeight=value=>{
 if(value===null||value===undefined||value==='')return 0;
 const raw=String(value).trim();
 let weight=Number.parseFloat(raw);
 const fraction=/^(\d+)\s*\/\s*(\d+)/.exec(raw);
 if(fraction&&Number(fraction[2]))weight=Number(fraction[1])/Number(fraction[2]);
 return Number.isFinite(weight)&&weight>0?Math.min(weight,1e9):0;
};
const quantity=row=>{
 const value=row?.amount;
 if(value===null||value===undefined||value==='')return 1;
 const n=Number(value);return Number.isFinite(n)&&n>0?Math.min(n,100000):0;
};
export function isCarried(row){
 // Items are carried by default (even when not worn); explicit stowed items do
 // not contribute unless actually equipped in a slot.
 return !!row&&(row.carried!==false||!!(row.equip_slot&&row.equipped!==false));
}
export function carriedWeight(data={}){
 const rows=['items','weapons'].flatMap(collection=>Array.isArray(data[collection])?data[collection].map(row=>({row,collection})) : []);
 const lineItems=[];
 for(const {row,collection} of rows){
  if(!row||!isCarried(row))continue;
  const amount=quantity(row),unitWeight=validWeight(inventoryItemValue(row,'weight'));
  if(!amount||!unitWeight)continue;
  lineItems.push({name:String(row.name||'Item'),collection,amount,weight:pounds(amount*unitWeight)});
 }
 return {total:pounds(lineItems.reduce((sum,row)=>sum+row.weight,0)),lineItems};
}
export const REDUCED_SPEED_THRESHOLDS=Object.freeze([[5,5],[10,10],[20,15],[25,20],[35,25],[40,30],[50,35],[55,40],[65,45],[70,50],[80,55],[85,60],[95,65],[100,70],[110,75],[115,80]]);
export function reducedSpeed(base){
 const speed=Math.max(0,Math.floor(numeric(base)));
 if(speed<=0)return 0;
 // For non-tabulated speeds beyond 120 feet, use the standard 2/3 movement rate.
 if(speed>120)return Math.floor(speed*2/3/5)*5;
 return [...REDUCED_SPEED_THRESHOLDS].reverse().find(([minimum])=>speed>=minimum)?.[1]||speed;
}
// The two speed columns in PF armor tables refer to 30-ft and 20-ft NORMAL
// movement, not literally creature size. Prefer a recorded base speed.
const armNumber=value=>{
 if(value===undefined||value===null||value==='')return null;
 const raw=String(value).replaceAll(',','').trim();
 if(/^[-—–]$/.test(raw))return null;
 const match=raw.match(/[-+]?\d+(?:\.\d+)?/);
 return match&&Number.isFinite(Number(match[0]))?Number(match[0]):null;
};
const rowSources=row=>[row,row.raw,row.sourceCatalog,row.sourceCatalog?.raw,row.catalog,row.catalog?.raw].filter(source=>source&&typeof source==='object');
const findColumn=(row,thirty)=>{
 const expected=thirty?'speed30ft':'speed20ft';
 for(const source of rowSources(row)){
  for(const [name,value] of Object.entries(source)){
   if(name.toLowerCase().replace(/[^a-z0-9]/g,'')===expected){
    const parsed=armNumber(value);if(parsed!==null)return parsed;
   }
  }
 }
 const details=[row.details,row.sourceCatalog?.details,row.catalog?.details].flat().filter(Boolean);
 for(const detail of details){
  if(typeof detail!=='object')continue;
  const key=String(detail.name??detail.label??detail.key??'').toLowerCase().replace(/[^a-z0-9]/g,'');
  if(key===expected){const parsed=armNumber(detail.val??detail.value??detail.text);if(parsed!==null)return parsed;}
 }
 return null;
};
export function armorSpeedLimit(row,baseSpeed,category='light'){
 // Prefer a complete explicit speed column pair, e.g. "20 ft. / 15 ft.".
 const direct=row.speed??row.raw?.speed??row.sourceCatalog?.raw?.speed??row.sourceCatalog?.speed;
 let cap30=findColumn(row,true),cap20=findColumn(row,false);
 if(direct!==undefined&&direct!==null&&String(direct).trim()){
  const values=String(direct).match(/\d+(?:\.\d+)?/g)?.map(Number)||[];
  if(values.length>=2){[cap30,cap20]=values;}
  else if(values.length===1&&cap30===null&&cap20===null){cap30=cap20=values[0];}
 }
 if(cap30===null&&cap20===null){
  // Older shop items sometimes expose speed only through aliases.
  const alias=inventoryItemValue(row,'speed');
  const values=String(alias??'').match(/\d+(?:\.\d+)?/g)?.map(Number)||[];
  if(values.length>=2)[cap30,cap20]=values;
  else if(values.length===1)cap30=cap20=values[0];
 }
 if(cap30===null&&cap20===null){
  return ['medium','heavy'].includes(category)?reducedSpeed(baseSpeed):baseSpeed;
 }
 // Complete 30/20 values refer to normal land speed, not character size.
 const selected=baseSpeed<=20?(cap20??cap30):(cap30??cap20);
 return Math.max(0,Math.min(baseSpeed,selected));
}
const armorCategoryOf=row=>{
 const type=[inventoryItemValue(row,'type'),row.secondaryType,row.subtype,row.name].join(' ').toLowerCase();
 return /\bheavy\b/.test(type)?'heavy':/\bmedium\b/.test(type)?'medium':'light';
};
const isShield=row=>/\b(shield|buckler)\b/i.test([row.name,inventoryItemValue(row,'type'),row.secondaryType].join(' '));
export function equippedArmor(data={},baseSpeed=30){
 const worn=(Array.isArray(data.items)?data.items:[]).filter(row=>row&&row.equipped!==false&&row.equip_slot&&itemCategoryForItem(row)==='Armor');
 const body=worn.filter(row=>!isShield(row)),shields=worn.filter(isShield);
 // Pathfinder non-stacking armor and shield bonus types: take the best of each.
 // Enhancement values are expected to be included in the item's total bonus.
 const maximumBonus=rows=>Math.max(0,...rows.map(row=>armNumber(inventoryItemValue(row,'acBonus'))??0));
 const bodyBonus=maximumBonus(body),shieldBonus=maximumBonus(shields);
 const maxDexCaps=worn.map(row=>armNumber(inventoryItemValue(row,'maxDex'))).filter(v=>v!==null);
 const worstPenalty=rows=>Math.min(0,...rows.map(row=>armNumber(inventoryItemValue(row,'checkPenalty'))??0));
 // Shields and armor have separate ACPs. Their penalties stack with each other,
 // but the resulting worn-gear ACP does not stack with load ACP.
 const armorPenalty=worstPenalty(body),shieldPenalty=worstPenalty(shields);
 const category=body.some(row=>armorCategoryOf(row)==='heavy')?'heavy':body.some(row=>armorCategoryOf(row)==='medium')?'medium':'light';
 const speedCaps=body.map(row=>armorSpeedLimit(row,baseSpeed,armorCategoryOf(row)));
 return {worn:worn.length,bodyBonus,shieldBonus,acBonus:bodyBonus+shieldBonus,
  checkPenalty:armorPenalty+shieldPenalty,armorPenalty,shieldPenalty,
  maxDex:maxDexCaps.length?Math.min(...maxDexCaps):Infinity,
  category,speedCap:speedCaps.length?Math.min(baseSpeed,...speedCaps):baseSpeed};
}
export function carryingCapacity(data={}){
 const strength=Math.floor(data.str===undefined||data.str===null||data.str===''?10:numeric(data.str)),size=Object.keys(SIZE_CAPACITY).find(s=>s.toLowerCase()===String(data.size_category||data.size||'Medium').toLowerCase())||'Medium';
 const bodyType=data.capacity_body_type==='quadruped'?'quadruped':'biped',multiplier=SIZE_CAPACITY[size][bodyType==='quadruped'?1:0];
 const base=strengthCapacity(strength),capacityModifier=bounded(numeric(data.capacity_modifier),-1e6,1e6);
 const originalMax=base.heavy*multiplier;
 // Flat capacity bonus/penalty changes the full threshold range proportionally.
 const maximum=pounds(Math.max(0,originalMax+capacityModifier)),ratio=originalMax>0?maximum/originalMax:0;
 const lightMax=pounds(base.light*multiplier*ratio),mediumMax=pounds(base.medium*multiplier*ratio);
 const {total:weight,lineItems}=carriedWeight(data);
 const load=weight<=lightMax?'light':weight<=mediumMax?'medium':weight<=maximum?'heavy':'over';
 const effects={light:{maxDex:Infinity,checkPenalty:0,run:4,armor:'none'},medium:{maxDex:3,checkPenalty:-3,run:4,armor:'medium'},heavy:{maxDex:1,checkPenalty:-6,run:3,armor:'heavy'},over:{maxDex:0,checkPenalty:-6,run:0,armor:'heavy'}}[load];
 const sizeSpeedDefault=['Fine','Diminutive','Tiny','Small'].includes(size)?20:30;
 const baseSpeed=Math.max(0,numeric(data.speed===undefined||data.speed===null||data.speed===''?sizeSpeedDefault:data.speed));
 const speedMod=numeric(data.speed_mod);
 const armor=equippedArmor(data,baseSpeed),maxDex=Math.min(effects.maxDex,armor.maxDex);
 const checkPenalty=Math.min(effects.checkPenalty,armor.checkPenalty);
 const armorRanks={none:0,light:1,medium:2,heavy:3},armorCategory=armorRanks[armor.category]>armorRanks[effects.armor]?armor.category:effects.armor;
 const loadSpeed=load==='over'?(weight<=maximum*2&&maximum>0?5:0):load==='light'?baseSpeed:reducedSpeed(baseSpeed);
 const limitedByArmor=armor.speedCap<baseSpeed,limitedByLoad=loadSpeed<baseSpeed;
 const constrainedSpeed=Math.min(baseSpeed,armor.speedCap,loadSpeed);
 // Speed Mod deliberately adds AFTER armor and encumbrance restrictions.
 const effectiveSpeed=Math.max(0,constrainedSpeed+speedMod);
 const runMultiplier=armor.category==='heavy'?Math.min(effects.run,3):effects.run;
 const speedCapReasons=[...(limitedByArmor?['armor']:[]),...(limitedByLoad?['load']:[])];
 return {strength,size,bodyType,multiplier,capacityModifier,lightMax,mediumMax,maximum,weight,load,label:loadName(load),
  remaining:pounds(Math.max(0,maximum-weight)),overBy:pounds(Math.max(0,weight-maximum)),lineItems,
  maxDex,checkPenalty,baseSpeed,speedMod,effectiveSpeed,constrainedSpeed,loadSpeed,armorSpeed:armor.speedCap,speedCapReasons,limitedByArmor,limitedByLoad,runMultiplier,armorCategory,armor,armorBonus:armor.acBonus,
  liftOverhead:maximum,liftGround:pounds(maximum*2),pushDrag:pounds(maximum*5),
  mediumStarts:pounds(lightMax),heavyStarts:pounds(mediumMax)};
}
