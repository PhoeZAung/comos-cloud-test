// Default only absent optional fields. Never infer or overwrite a recorded selection.
export function withBuildDefaults(input,defaults){
 const result=structuredClone(input||{});
 for(const [key,value] of Object.entries(defaults))if(result[key]===undefined)result[key]=structuredClone(value);
 return result;
}
// Object insertion order is not a character change; array order remains meaningful.
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
export const sameBuildValue=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
