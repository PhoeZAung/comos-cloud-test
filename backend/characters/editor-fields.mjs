import {ALIGNMENTS,SOURCE_NAME,totalClassLevel} from '../../src/features/characters/ffd20.mjs';
const fieldsByStep={identity:['charName','alignment','portrait','bio'],race:['race','standardRacialTraits','alternateRacialTraits'],class:['classes']};
const control=/[\u0000-\u001f\u007f]/u;
const plain=v=>v&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
export const badEditor=message=>Object.assign(new Error(message),{code:'INVALID_CHARACTER'});
const word=(value,max,label,{empty=false}={})=>{
 if(typeof value!=='string'||value.length>max||control.test(value)||(!empty&&!value.trim()))throw badEditor(`Invalid ${label}.`);
 return value.trim();
};
export function validateBio(value){
 if(typeof value!=='string'||value.length>2000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u.test(value))throw badEditor('Bio must be 2,000 characters or fewer.');
 return value.replace(/\r\n?/g,'\n').trim();
}
export function validatePortrait(value){
 if(value===''||value===null)return '';
 if(typeof value!=='string'||value.length>160000||!/^data:image\/(?:jpeg|png|webp);base64,(?:[a-z0-9+/]{4})*(?:[a-z0-9+/]{2}==|[a-z0-9+/]{3}=)?$/i.test(value))throw badEditor('Use a small JPEG, PNG, or WebP portrait.');
 return value;
}
function traits(value,label){
 if(!Array.isArray(value)||value.length>60)throw badEditor(`Invalid ${label}.`);
 const found=new Set();return value.map(item=>{
  if(!plain(item)||Object.keys(item).some(k=>!['name','enabled'].includes(k))||typeof item.enabled!=='boolean')throw badEditor(`Invalid ${label}.`);
  const name=word(item.name,80,label),key=name.toLowerCase();if(found.has(key))throw badEditor('Duplicate racial trait.');found.add(key);
  return {name,enabled:item.enabled};
 });
}
export function validateWizardFields(step,values){
 if(!Object.hasOwn(fieldsByStep,step)||!plain(values)||Object.keys(values).some(k=>!fieldsByStep[step].includes(k)))throw badEditor('Invalid wizard fields.');
 if(step==='identity'){
  const charName=word(values.charName,80,'character name');
  if(typeof values.alignment!=='string'||(!ALIGNMENTS.includes(values.alignment)&&values.alignment!==''))throw badEditor('Select a valid alignment.');
  return {charName,alignment:values.alignment,portrait:values.portrait===undefined?undefined:validatePortrait(values.portrait),...(values.bio===undefined?{}:{bio:validateBio(values.bio)}),source:SOURCE_NAME};
 }
 if(step==='race')return {race:word(values.race,80,'race'),standardRacialTraits:traits(values.standardRacialTraits,'standard racial traits'),alternateRacialTraits:traits(values.alternateRacialTraits,'alternate racial traits'),source:SOURCE_NAME};
 if(!Array.isArray(values.classes)||values.classes.length<1||values.classes.length>8)throw badEditor('Choose one to eight classes.');
 const unique=new Set(),classes=values.classes.map((row,i)=>{
  if(!plain(row)||Object.keys(row).some(k=>!['name','level','archetype'].includes(k)))throw badEditor('Invalid class entry.');
  const name=word(row.name,80,`class ${i+1}`),key=name.toLowerCase();if(unique.has(key))throw badEditor('Choose different classes for multiclassing.');unique.add(key);
  if(!Number.isInteger(row.level)||row.level<1||row.level>20)throw badEditor('Class level must be 1–20.');
  const archetype=word(row.archetype??'',80,'archetype',{empty:true});
  return {name,level:row.level,archetype};
 });
 const totalLevel=totalClassLevel(classes);
 if(totalLevel>20)throw badEditor('Total level cannot exceed 20.');
 return {classes,class:classes[0].name,level:totalLevel,character_level:totalLevel,total_level:totalLevel,class_level:classes[0].level,archetype:classes[0].archetype,source:SOURCE_NAME};
}
export function mergeWizardData(data,step,values){
 const safe=validateWizardFields(step,values);
 const merged={...data,...safe};
 // Preserve unknown imported per-class fields when the same class is still present.
 if(step==='class'&&Array.isArray(data.classes))merged.classes=safe.classes.map(row=>{
  const previous=data.classes.find(old=>plain(old)&&old.name===row.name);
  return previous?{...previous,...row}:row;
 });
 // Preserve imported stats, equipment, feats, spells and older sheet fields.
 return merged;
}