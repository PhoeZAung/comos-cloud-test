// Bounded dice arithmetic: supports parentheses, unary signs and PEMDAS.
// Typed damage is carried through scalar arithmetic and rounded only once,
// after the entire expression has been evaluated. Never evaluate user JavaScript.
const limit=1000000;
const MAX_DICE=50,MAX_TERMS=16,MAX_NODES=100,MAX_DEPTH=20;

export function parseDiceMath(source,{requireDice=true}={}){
 if(typeof source!=='string'||source.length>500)throw Error('Invalid dice expression.');
 const input=source.replaceAll('−','-').replaceAll('×','*').replaceAll('÷','/')
  .replace(/([a-z])\s+(?=\d*d\d+\b)/gi,'$1 + ').trim();
 let pos=0,nodes=0,depth=0,dice=0;
 const terms=[];
 const skip=()=>{while(/\s/.test(input[pos]||''))pos++;};
 const node=value=>{if(++nodes>MAX_NODES)throw Error('Dice expression is too complex.');return value;};
 function primary(){
  if(++depth>MAX_DEPTH)throw Error('Dice expression is too complex.');
  skip();
  let result;
  const ch=input[pos];
  if(ch==='+'||ch==='-'){pos++;result=node({op:ch==='+'?'positive':'negative',child:power()});}
  else if(ch==='('){
   pos++;result=sum();skip();
   if(input[pos++]!==')')throw Error('Close the dice parentheses.');
  }else{
   const match=/^(?:(\d*)[dD](\d+)|(\d+(?:\.\d+)?|\.\d+))/.exec(input.slice(pos));
   if(!match)throw Error('Invalid dice term.');
   pos+=match[0].length;
   const count=match[2]!==undefined?Number(match[1]||1):0;
   const sides=match[2]!==undefined?Number(match[2]):0;
   const value=match[3]===undefined?null:Number(match[3]);
   if(count){
    dice+=count;
    if(!Number.isSafeInteger(count)||dice>MAX_DICE||count<1||!Number.isSafeInteger(sides)||sides<2||sides>1000)
     throw Error('Use at most 50 dice, with 2–1,000 sides.');
   }else if(value===null||!Number.isFinite(value)||value>limit)throw Error('Invalid dice term.');
   let type='';
   const tail=/^\s+([a-z]+(?:\s*\/\s*[a-z]+|\s+[a-z]+)*)/i.exec(input.slice(pos));
   if(tail){type=tail[1].trim().replace(/\s+/g,' ');pos+=tail[0].length;}
   const term=count?{sign:1,count,sides,type}:{sign:1,flat:value,type};
   terms.push(term);
   if(terms.length>MAX_TERMS)throw Error('Too many dice terms.');
   result=node(count?{op:'die',count,sides,type}:{op:'number',value,type});
  }
  depth--;return result;
 }
 function power(){
  let left=primary();skip();
  if(input[pos]==='^'){pos++;left=node({op:'^',left,right:power()});skip();}
  return left;
 }
 function product(){
  let left=power();skip();
  while(input[pos]==='*'||input[pos]==='/'){
   const op=input[pos++];left=node({op,left,right:power()});skip();
  }
  return left;
 }
 function sum(){
  let left=product();skip();
  while(input[pos]==='+'||input[pos]==='-'){
   const op=input[pos++];left=node({op,left,right:product()});skip();
  }
  return left;
 }
 const ast=sum();skip();
 if(pos!==input.length)throw Error('Invalid dice expression.');
 if(requireDice&&!dice)throw Error('A roll needs at least one die.');
 return {ast,terms};
}

export function evaluateDiceMath(ast,face){
 if(typeof face!=='function')throw Error('A dice source is required.');
 const rolls=[];
 const finite=value=>{
  if(!Number.isFinite(value)||Math.abs(value)>limit)throw Error('Invalid or excessive dice result.');
  return value;
 };
 const scale=(parts,factor)=>parts.map(part=>({...part,raw:finite(part.raw*factor)}));
 const kinds=parts=>new Set(parts.map(part=>part.type).filter(Boolean));
 function solve(node){
  if(node.op==='number')return {value:node.value,parts:[{raw:node.value,type:node.type||'',flat:true}],dice:false};
  if(node.op==='die'){
   const faces=[];
   for(let i=0;i<node.count;i++){
    const n=face(node.sides);
    if(!Number.isInteger(n)||n<1||n>node.sides)throw Error('Invalid die face.');
    faces.push(n);rolls.push(n);
   }
   const value=faces.reduce((a,b)=>a+b,0);
   return {value,parts:[{raw:value,type:node.type||'',dice:node.count+'d'+node.sides,rolls:faces}],dice:true};
  }
  if(node.op==='positive')return solve(node.child);
  if(node.op==='negative'){
   const v=solve(node.child);
   return {value:finite(-v.value),parts:scale(v.parts,-1),dice:v.dice};
  }
  const left=solve(node.left),right=solve(node.right);
  let value,parts;
  if(node.op==='+'||node.op==='-'){
   value=finite(node.op==='+'?left.value+right.value:left.value-right.value);
   parts=left.parts.concat(scale(right.parts,node.op==='+'?1:-1));
  }else if(node.op==='*'){
   value=finite(left.value*right.value);
   if(left.dice&&right.dice){
    if(kinds(left.parts).size||kinds(right.parts).size)throw Error('Cannot multiply two typed dice groups.');
    parts=[{raw:value,type:''}];
   }else if(left.dice)parts=scale(left.parts,right.value);
   else if(right.dice)parts=scale(right.parts,left.value);
   else parts=[{raw:value,type:left.parts[0]?.type||right.parts[0]?.type||'',flat:true}];
  }else if(node.op==='^'){
   if(!Number.isInteger(right.value)||right.value<-10||right.value>10)throw Error('Exponent must be a whole number from -10 to 10.');
   if(kinds(left.parts).size>1||kinds(right.parts).size)throw Error('Cannot exponentiate multiple typed damage groups.');
   value=finite(left.value**right.value);
   const types=[...kinds(left.parts)];
   parts=[{raw:value,type:types[0]||'',flat:!left.dice&&!right.dice}];
  }else if(node.op==='/'){
   if(right.value===0)throw Error('Cannot divide by zero.');
   value=finite(left.value/right.value);
   if(right.dice&&kinds(right.parts).size)throw Error('Cannot divide by a typed dice group.');
   if(right.dice)parts=[{raw:value,type:''}];
   else parts=scale(left.parts,1/right.value);
  }else throw Error('Invalid dice operator.');
  return {value,parts,dice:left.dice||right.dice};
 }
 const evaluated=solve(ast),total=Math.floor(evaluated.value);
 // Floor the entire expression, never each die or damage component separately.
 const parts=evaluated.parts;
 const integerParts=parts.map(part=>Math.floor(part.raw));
 const residue=total-integerParts.reduce((sum,value)=>sum+value,0);
 if(residue<0||residue>integerParts.length)throw Error('Invalid dice rounding.');
 const order=parts.map((part,index)=>({index,fraction:part.raw-Math.floor(part.raw)}))
  .sort((a,b)=>b.fraction-a.fraction||a.index-b.index);
 for(let i=0;i<residue;i++)integerParts[order[i].index]++;
 const breakdown=parts.map((part,index)=>{
  const {raw,flat,...details}=part;
  return {...details,total:integerParts[index]};
 });
 const bonus=parts.reduce((sum,part,i)=>sum+(part.flat?integerParts[i]:0),0);
 if(breakdown.reduce((sum,part)=>sum+part.total,0)!==total)throw Error('Invalid dice breakdown.');
 return {rolls,bonus,total,breakdown};
}
