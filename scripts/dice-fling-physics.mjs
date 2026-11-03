// Pinned Ammo worker hooks. Launch near the middle toward a random wall,
// with elastic walls and a much softer floor; all bounces remain simulated.
export function patchFlingPhysics(worker){
 const replace=(from,to)=>{if(!worker.includes(from))throw Error('Dice fling physics adapter needs review: '+from);worker=worker.replace(from,to);};
 // Give percentile partners and dice in the same batch distinct starts too.
 replace('Bl=_=>{var tt;','Bl=_=>{if(p.cosmosFling)fe();var tt;');
 replace('fe=()=>{let _=p.size',`fe=()=>{
   if(p.cosmosFling){
     const radius=p.cosmosRadius||1.5,x=Math.max(.05,p.size*yt/2-radius-.12),z=Math.max(.05,p.size/2-radius-.12);
     p.startPosition=[(Math.random()-.5)*x*.5,p.startingHeight,(Math.random()-.5)*z*.5];
     p.cosmosFlingAxis=Math.random()<.8?0:2;p.cosmosFlingSign=Math.random()<.5?-1:1;return;
   }
   let _=p.size`);
 replace('ge=_=>{_.setLinearVelocity',`ge=_=>{
   if(p.cosmosFling){
     const radius=p.cosmosRadius||1.5,x=Math.max(.05,p.size*yt/2-radius-.12),z=Math.max(.05,p.size/2-radius-.12),side=p.cosmosFlingSign||1,across=p.cosmosFlingAxis===0;
     const targetX=across?side*x:(Math.random()-.5)*x,targetZ=across?(Math.random()-.5)*z:side*z,flight=.24+Math.random()*.10;
     const cap=value=>Math.max(-65,Math.min(65,value));
     _.setLinearVelocity(P(cap((targetX-p.startPosition[0])/flight),-1.5-Math.random()*2,cap((targetZ-p.startPosition[2])/flight)));
     _.setAngularVelocity(P((Math.random()-.5)*22,(Math.random()-.5)*26,(Math.random()-.5)*22));return;
   }
   _.setLinearVelocity`);
 // In the stock box, one restitution value also makes the floor springy.
 replace('G.setRestitution(p.restitution)','G.setRestitution(p.cosmosFling ? .12 : p.restitution)');
 // Place inner wall faces at the viewport bounds, including narrow windows.
 // Box colliders have half-thickness 1, so the centre sits 1 unit beyond.
 for(const [from,to] of [
  ['P(0,0,_/-2-.5)','P(0,0,_/-2-(p.cosmosFling?1:.5))'],
  ['P(0,0,_/2+.5)','P(0,0,_/2+(p.cosmosFling?1:.5))'],
  ['P(_*yt/-2-.5,0,0)','P(_*yt/-2-(p.cosmosFling?1:.5),0,0)'],
  ['P(_*yt/2+.5,0,0)','P(_*yt/2+(p.cosmosFling?1:.5),0,0)']
 ])replace(from,to);
 replace('if(j<.01&&V<.005||g.timeout<0)','if((p.cosmosFling?j<.12&&V<.12:j<.01&&V<.005)||g.timeout<0)');
 return worker;
}
