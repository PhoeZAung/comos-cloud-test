export function publicAuthConfig(input) {
  if (!input || typeof input!=='object' || Array.isArray(input) || Object.keys(input).some(k=>!['origin','firebase'].includes(k))) throw new Error('Only public origin and firebase configuration are accepted.');
  const origin=new URL(input.origin);
  if(origin.protocol!=='https:'||origin.origin!==input.origin)throw new Error('An exact HTTPS origin is required.');
  const f=input.firebase;
  const fields=['apiKey','authDomain','projectId','appId'];
  if(!f||typeof f!=='object'||Object.keys(f).some(k=>!fields.includes(k))||fields.some(k=>typeof f[k]!=='string'||!f[k]))throw new Error('Only apiKey, authDomain, projectId and appId public Firebase fields are accepted.');
  if(!/^[a-z][a-z0-9-]{4,28}[a-z0-9]$/.test(f.projectId)||!/^AIza[\w-]{20,}$/.test(f.apiKey)||!/^1:\d+:web:[\da-f]+$/.test(f.appId))throw new Error('Invalid public Firebase configuration.');
  // Keep the initial adapter to the provider-owned domain. Custom domains need an explicit later review.
  if(f.authDomain!==`${f.projectId}.firebaseapp.com`)throw new Error('Use the project Firebase auth domain.');
  return {origin:input.origin,firebase:{...f}};
}
export function liveAuthPolicy(config) {
 return `default-src 'none'; script-src 'self' https://apis.google.com; style-src 'self'; img-src 'self' data:; connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://${config.firebase.authDomain}; frame-src https://${config.firebase.authDomain}; font-src 'self'; form-action 'none'; base-uri 'none'; object-src 'none'; worker-src 'none'`;
}
