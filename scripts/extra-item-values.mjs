import {readableDescription} from './build-pf2e-catalog.mjs';
import {itemWeightLb} from '../src/features/sheet/inventory-fields.mjs';
const str=x=>typeof x==='string'?x:'';
const txt=x=>typeof x==='string'?x:typeof x==='number'&&Number.isFinite(x)?String(x):'';
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const number=x=>x!==null&&x!==undefined&&String(x).trim()!==''&&Number.isFinite(Number(x))?Number(x):null;
export function sourceText(input){
 if(Array.isArray(input))return input.map(sourceText).filter(Boolean).join('\n');
 if(typeof input==='string')return readableDescription(input.replace(/‹([^›]+)›/g,(_,value)=>value.split('/').at(-1)));
 if(object(input))return sourceText(input.entries||input.items||input.description||'');
 return '';
}
export function cleanDescription(text){
 return text.split('\n').filter(line=>!/^‹?SOURCE\b/i.test(line.trim())&&!/^#{1,5}\s*Source\s*:?$/i.test(line.trim())&&!/^Source:\s*[^\n]+$/i.test(line.trim())).join('\n').replace(/\n{3,}/g,'\n\n').trim();
}
export function markdownField(markdown,...labels){
 for(const label of labels){
  const escaped=label.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&');
  const re=new RegExp('\\*\\*'+escaped+'\\*\\*\\s*:?\\s*([^;\\n]*?)(?=\\s*\\*\\*|\\s*;|$)','im');
  const match=re.exec(markdown);
  if(match&&match[1].trim())return match[1].trim();
 }
 return '';
}
function price(value){
 if(typeof value==='number'&&Number.isFinite(value)&&value>=0)return value+' gp';
 if(typeof value==='string')return value.trim().slice(0,160);
 if(object(value)){
  if(object(value.value))return ['pp','gp','sp','cp'].filter(c=>Number.isFinite(value.value[c])).map(c=>value.value[c]+' '+c).join(' + ');
  if(Number.isFinite(value.value))return value.value+' '+str(value.unit||'gp');
 }
 return '';
}
function dice(value){
 const raw=txt(value).trim();
 const m=/^sizeRoll\(\s*(\d+)\s*,\s*(\d+)\s*,\s*@size\s*\)$/i.exec(raw);
 return m?m[1]+'d'+m[2]:raw.slice(0,200);
}
function distance(range){
 const v=object(range)?range.value:range,units=str(range?.units);
 return v===null||v===undefined||String(v).trim()===''?'':txt(v)+(units&&units!=='melee'?' '+units:'');
}
export function mapFoundry1e(row,pack){
 const s=row.system||{},type=str(row.type).toLowerCase(),name=str(row.name),sub=str(s.subType||s.equipmentSubtype||s.weaponSubtype||s.consumableType);
 const r=distance(s.range),ranged=type==='weapon'&&(s.weaponSubtype==='ranged'||Boolean(r)&&s.range?.units!=='melee');
 const armorType=str(s.equipmentType).toLowerCase();
 const consumable=type==='consumable'||/^(potion|scroll|elixir|oil of)\b/i.test(name);
 const ammo=/^(ammo|ammunition)$/i.test(sub)||type==='ammo';
 let category='Gear';
 if(ammo)category='Ammunition';else if(consumable)category='Consumables';
 else if(type==='weapon')category=ranged?'Ranged Weapon':'Weapon';
 else if(type==='armor'||type==='shield'||['armor','shield'].includes(armorType))category='Armor';
 else if(pack==='pf-artifacts')category='Artifacts';
 else if(['pf-magic','pf-wondrous'].includes(pack))category='Magic Items';
 else if(pack==='pf-technology'&&/vehicle|transport/.test(sub))category='Vehicles & Mounts';
 else if(pack==='pf-goods-services'&&/service|lodging/.test(sub))category='Services & Other';
 const action=Array.isArray(s.actions)?s.actions.find(x=>object(x)):null;
 const ability=s.ability||action?.ability||{},parts=Array.isArray(s.damage?.parts)?s.damage.parts:action?.damage?.parts||[];
 const damage=dice(parts[0]?.[0]),dtype=parts[0]?.[1],damageType=str(dtype)||str(dtype?.custom)||str(dtype?.values?.[0]);
 const critRange=number(ability.critRange),critMult=number(ability.critMult),armor=object(s.armor)?s.armor:{};
 const save=action?.save||s.save||{},saveDc=number(save.dc),spellFail=number(s.spellFailure);
 return {
  id:row._id,name,category,description:cleanDescription(sourceText(s.description?.value||'')),
  price:price(s.price),weight:itemWeightLb(object(s.weight)?s.weight.value:s.weight),
  damage:['Weapon','Ranged Weapon','Consumables'].includes(category)?damage:'',
  crit:['Weapon','Ranged Weapon'].includes(category)&&critRange!==null&&critMult!==null?critRange+'/×'+critMult:'',
  damageType,range:r,proficiency:str(s.weaponType),
  armor:category==='Armor'&&number(armor.value)>0?armor.value:null,
  maxDex:category==='Armor'?armor.dex:null,checkPenalty:category==='Armor'?armor.acp:null,
  spellFailure:category==='Armor'&&spellFail!==null?spellFail+'%':'',
  cl:number(s.cl)>0?s.cl:null,dcSave:saveDc!==null&&saveDc>0?'DC '+saveDc+' '+str(save.type):'',
  duration:distance(s.duration),effect:sourceText(action?.description||''),rarity:str(s.rarity),
  originalCategory:[type,armorType,sub].filter(Boolean).join(' / ')
 };
}
export function mapPfData(row,filename){
 const raw=sourceText(row.description||[]);
 const desc=cleanDescription(raw.split('\n').filter(line=>!/^#{1,4}\s/.test(line.trim())).join('\n'));
 const group=markdownField(raw,'Category').toLowerCase(),file=filename.toLowerCase(),top=str(row.topLink?.[0]).toLowerCase();
 let category='Gear';
 if(/poison|pharmaceutical|alchemical|alchemy/.test(file)||/alchemical|poison|potion/.test(group+' '+top))category='Consumables';
 else if(/artifact/.test(file))category='Artifacts';
 else if(/enchantment|enhancement/.test(file))category='Enhancements';
 else if(/armor/.test(file))category='Armor';
 else if(/weapon/.test(file))category=/ranged|firearm|bow|crossbow|sling/.test(group+' '+top)?'Ranged Weapon':'Weapon';
 else if(/siege|vehicle|mount/.test(file+' '+group))category='Vehicles & Mounts';
 else if(file.includes('magic_'))category='Magic Items';
 const speeds=markdownField(raw,'Speed').match(/(\d+)\s*ft\.?\s*\/\s*(\d+)\s*ft\.?/i);
 return {
  name:str(row.name),category,description:desc,
  price:price(row.price||row.cost)||markdownField(raw,'Price','Cost'),
  weight:itemWeightLb(row.weight)??itemWeightLb(markdownField(raw,'Weight')),
  damage:txt(row.damage)||markdownField(raw,'Damage (M)','Dmg (M)','Damage (Medium)','Damage'),
  dmgS:markdownField(raw,'Damage (S)','Dmg (S)','Damage (Small)'),
  crit:txt(row.critical)||markdownField(raw,'Critical','Crit'),
  range:txt(row.range)||markdownField(raw,'Range','Range Increment'),
  damageType:markdownField(raw,'Type','Damage Type'),
  armor:markdownField(raw,'Armor Bonus','Armor/Shield Bonus','Shield Bonus'),
  maxDex:markdownField(raw,'Max Dex Bonus','Maximum Dex Bonus'),
  checkPenalty:markdownField(raw,'Armor Check Penalty'),
  spellFailure:markdownField(raw,'Arcane Spell Failure Chance','Spell Failure'),
  speed30Ft:speeds?speeds[1]+' ft.':markdownField(raw,'Speed (30 ft.)'),
  speed20Ft:speeds?speeds[2]+' ft.':markdownField(raw,'Speed (20 ft.)'),
  proficiency:markdownField(raw,'Proficiency'),dcSave:markdownField(raw,'DC/Save','Save','Saving Throw'),
  duration:markdownField(raw,'Duration'),craftDc:markdownField(raw,'Craft DC'),originalCategory:group
 };
}
const coins=cp=>!Number.isSafeInteger(cp)||cp<0?'':cp===0?'0 cp':cp%100===0?cp/100+' gp':cp%10===0?cp/10+' sp':cp+' cp';
export function mapOrc2e(row,locales={}){
 const translate=x=>str(locales[str(x)]||x);
 const kind=str(row.category).toLowerCase();
 let category='Gear';
 if(kind==='weapon')category='Weapon';
 else if(/armor|shield/.test(kind))category='Armor';
 else if(/consumable|alchemical|potion|scroll/.test(kind))category='Consumables';
 else if(/rune|enhancement/.test(kind))category='Enhancements';
 else if(/ammunition|ammo/.test(kind))category='Ammunition';
 else if(/vehicle|mount/.test(kind))category='Vehicles & Mounts';
 else if(/magic|held|worn/.test(kind)||(Array.isArray(row.traits)&&row.traits.includes('magical')))category='Magic Items';
 const weapon=row.weapon||{},armor=row.armor||{},ranged=number(weapon.range)>0;
 if(category==='Weapon'&&ranged)category='Ranged Weapon';
 const effect=Array.isArray(row.activations)?row.activations.map(x=>translate(x?.text)).filter(x=>x&&!/^item\./.test(x)).join('\n'):'';
 return {
  id:row.id,name:translate(row.name),description:sourceText([translate(row.text),effect]),
  category,price:coins(row.priceCp),weight:null,pf2eBulk:txt(row.bulk),
  damage:str(weapon.damage?.dice),damageType:str(weapon.damage?.type),
  range:ranged?weapon.range+' ft.':'',proficiency:str(weapon.category),
  armor:Number.isFinite(armor.acBonus)?armor.acBonus:null,
  maxDex:Number.isFinite(armor.dexCap)?armor.dexCap:null,
  checkPenalty:Number.isFinite(armor.checkPenalty)?armor.checkPenalty:null,
  speedPenalty:Number.isFinite(armor.speedPenalty)?armor.speedPenalty:null,
  traits:Array.isArray(row.traits)?row.traits:[],itemLevel:row.level,
  rarity:str(row.rarity),usageType:translate(row.usage),review:str(row.review),
  originalCategory:kind
 };
}
export function mapLegacyPf2e(row,group,filename){
 const k=(group+' '+filename).toLowerCase();
 let category='Gear';
 if(/ammunition|arrows|bolts/.test(k))category='Ammunition';
 else if(/shields|armor/.test(k))category='Armor';
 else if(/rangedweapon|bow|crossbow/.test(k))category='Ranged Weapon';
 else if(/weapon/.test(k))category='Weapon';
 else if(/consumable|wand|potion|alchemical|bomb|snares/.test(k))category='Consumables';
 else if(/runes/.test(k))category='Enhancements';
 else if(/artifact/.test(k))category='Artifacts';
 else if(/worn|held|staff|staves/.test(k))category='Magic Items';
 else if(/services/.test(k))category='Services & Other';
 const d=str(row.damage),dice=/\b\d+d\d+(?:[+-]\d+)?\b/i.exec(d)?.[0]||d;
 return {
  id:row.id||row.link||'',name:str(row.name).trim(),category,
  description:sourceText(row.text||row.description||row.entries),
  price:price(row.price??row.Price??row.cost),weight:null,pf2eBulk:txt(row.bulk),
  damage:dice,damageType:/\b[BPS]\b$/i.exec(d)?.[0]||'',range:txt(row.range),
  armor:txt(row.acBonus),maxDex:txt(row.dexCap),checkPenalty:txt(row.checkPenalty),
  traits:row.traits||row.weaponTraits||[],itemLevel:row.level??row.Level,
  originalLink:typeof row.link==='string'&&/^https:\/\/2e\.aonprd\.com\//i.test(row.link)?row.link:''
 };
}
