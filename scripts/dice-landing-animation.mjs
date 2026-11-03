// The server-selected face is prepared while the new mesh is still hidden.
// Physics supplies position/bounces; visual rotation approaches that face as
// part of the toss, never as a correction after the die has landed.
export function patchLandingAnimation(source){
 const render='  renderLoop() {';
 const actualPrepare='}, i = new Oe(t, C(this, K));';
 const update='s.mesh.position.set(n, a, o), s.mesh.rotationQuaternion.set(l, d, h, c);';
 const asleep='if (e.asleep = !0, await Oe.getRollResult(e, C(this, K)),';
 const clear='  clear() {\n    !Object.keys(C(this, Z)).length';
 if(![render,actualPrepare,update,asleep,clear].every(anchor=>source.includes(anchor)))throw Error('Dice landing adapter needs review for this library version.');
 source=source.replace(actualPrepare,actualPrepare+`
    if(Number.isInteger(i.config.data?.targetValue)){
      i.cosmosPreparing=true;await Oe.getRollResult(i,C(this,K));i.cosmosPreparing=false;
      if(!i.cosmosRotationFor)throw Error('Could not prepare the recorded die face.');
    }
 ` .trimEnd());
 const child='.then((r) => {\n    const s = new Oe(r, C(this, K));\n    return s.dieParent = i, s;';
 if(!source.includes(child))throw Error('Percentile landing adapter needs review.');
 source=source.replace(child,`.then(async (r) => {
    const s = new Oe(r, C(this, K));s.dieParent=i;
    if(Number.isInteger(s.config.data?.targetValue)){s.cosmosPreparing=true;await Oe.getRollResult(s,C(this,K));s.cosmosPreparing=false;if(!s.cosmosRotationFor)throw Error('Could not prepare percentile face.');}
    return s;`);
 source=source.replace(render,`
  cosmosAnimateDice(now=performance.now()){
    for(const die of Object.values(C(this,Z))){
      if(!die.cosmosRotationFor||!die.cosmosPhysicalPosition||!die.mesh||die.mesh.isDisposed())continue;
      die.cosmosStartedAt??=now;
      const elapsed=Math.max(0,Math.min(1,(now-die.cosmosStartedAt)/1400));
      die.mesh.position.copyFrom(die.cosmosPhysicalPosition);
      // Keep a still-spinning visual above the surface until its landing ends.
      die.mesh.position.y+=.8*Math.sin(Math.PI*elapsed)*(1-elapsed);
      const target=die.cosmosRotationFor(die.mesh.position);
      if(elapsed<1){
        const axis=new (die.mesh.position.constructor)(.85,.3,.6);axis.normalize();
        const spin=target.constructor.RotationAxis(axis,Math.PI*4*Math.pow(1-elapsed,3));
        die.mesh.rotationQuaternion.copyFrom(spin.multiply(target));
      }else die.mesh.rotationQuaternion.copyFrom(target);
      die.mesh.computeWorldMatrix(true);
    }
  }
  async cosmosWaitForLanding(die,generation){
    if(!die.cosmosRotationFor)return;
    die.cosmosStartedAt??=performance.now();
    this.cosmosAnimateDice();
    await new Promise(resolve=>{
      const step=()=>{
        if(generation!==this.cosmosGeneration||die.mesh.isDisposed()||performance.now()-die.cosmosStartedAt>=1400){resolve();return;}
        requestAnimationFrame(step);
      };step();
    });
  }
  renderLoop() {
    this.cosmosAnimateDice();
`.trimStart());
 source=source.replace(update,`if(!s.asleep){s.cosmosPhysicalPosition??=s.mesh.position.clone();s.cosmosPhysicalPosition.set(n,a,o);s.mesh.position.set(n,a,o);if(!s.cosmosRotationFor)s.mesh.rotationQuaternion.set(l,d,h,c);}`);
 source=source.replace(asleep,`
    if(e.asleep)return;e.asleep=true;
    const generation=this.cosmosGeneration;await this.cosmosWaitForLanding(e,generation);
    if(generation!==this.cosmosGeneration||!e.mesh||e.mesh.isDisposed())return;
    this.cosmosAnimateDice();
    if (await Oe.getRollResult(e, C(this, K)), e.cosmosLanded=true,
`.trimStart());
 source=source.replace('!= null && t.asleep ||','!= null && t.cosmosLanded ||').replace('!= null && i.asleep)','!= null && i.cosmosLanded)');
 source=source.replace(clear,'  clear() {\n    this.cosmosGeneration=(this.cosmosGeneration||0)+1;\n    !Object.keys(C(this, Z)).length');
 return source;
}
