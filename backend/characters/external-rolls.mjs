import {diceTerms} from '../../src/features/sheet/calculations.mjs';

// Dice+ is a client-side provider. Only die faces come from it; all modifiers,
// formulas, criticals, resource costs and ownership remain server-controlled.
export function externalRollSource(responses){
 if(!Array.isArray(responses)||responses.length>4)throw Error('Invalid external dice response.');
 let cursor=0,invalid=null;
 return {
  roll(expression){try{
   const response=responses[cursor++];
   if(!response||Object.keys(response).some(k=>!['expression','faces'].includes(k))||response.expression!==expression||!Array.isArray(response.faces)||response.faces.length>50)throw Error('External roll does not match the sheet formula.');
   const terms=diceTerms(expression),rolls=[],breakdown=[];let index=0,bonus=0,total=0;
   for(const term of terms){
    if(term.count){
     const values=Array.from({length:term.count},()=>{const face=response.faces[index++];if(!Number.isInteger(face)||face<1||face>term.sides)throw Error('Invalid external die face.');return face;});
     const subtotal=term.sign*values.reduce((a,b)=>a+b,0);rolls.push(...values.map(v=>v*term.sign));total+=subtotal;breakdown.push({type:term.type,dice:term.count+'d'+term.sides,rolls:values,total:subtotal});
    }else{const n=term.sign*term.flat;bonus+=n;total+=n;breakdown.push({type:term.type,total:n});}
   }
   if(index!==response.faces.length)throw Error('Unexpected external dice.');
   return {expression,rolls,bonus,total,breakdown};
  }catch(error){invalid=error;throw error;}},
  finish(){if(invalid)throw invalid;if(cursor!==responses.length)throw Error('Unused external dice responses.');}
 };
}
