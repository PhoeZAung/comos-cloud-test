// Pinned Dice Box 1.1.4 adapter. Record real physics at a fixed timestep, then
// replay those positions/quaternions with one constant face offset. Nothing is
// lifted, eased toward a new face, or reoriented after the visible landing.
export function patchPhysicsRecording(source){
 const workerPattern=/const ml = "([A-Za-z0-9+/=]+)"/;
 const match=workerPattern.exec(source);if(!match)throw Error('Dice physics worker adapter needs review.');
 let worker=Buffer.from(match[1],'base64').toString('utf8');
 const clock='const t=_-Pe;Pe=_,!ee&&k.byteLength&&(Tl(t),';
 if(!worker.includes(clock))throw Error('Dice physics clock adapter needs review.');
 worker=worker.replace(clock,'const t=p.cosmosReplay?1000/60:_-Pe;Pe=_,!ee&&k.byteLength&&(Tl(t),');
 return source.replace(workerPattern,'const ml = "'+Buffer.from(worker).toString('base64')+'"');
}
export function patchLandingAnimation(source){
 const updateStart=source.lastIndexOf('  updatesFromPhysics(e) {'),updateEnd=source.indexOf('  // handle the position updates',updateStart);
 const renderStart=source.lastIndexOf('  render(e) {'),renderEnd=source.indexOf('  async loadTheme(e)',renderStart);
 const clear='  clear() {\n    !Object.keys(C(this, Z)).length',spawn='}, i = new Oe(t, C(this, K));';
 if(updateStart<0||updateEnd<0||renderStart<0||renderEnd<0||!source.includes(clear)||!source.includes(spawn))throw Error('Dice playback adapter needs review.');
 // Replace from the end first, so earlier offsets remain valid.
 source=source.slice(0,updateStart)+`
  updatesFromPhysics(e){
    if(!this.config.cosmosReplay)return this.cosmosLiveUpdates(e);
    this.diceBufferView=new Float32Array(e);
    if(this.cosmosReplayPhase!=='capture'){this.cosmosReturnBuffer();return;}
    const values=this.diceBufferView;
    for(let index=0,at=1;index<values[0];index++,at+=8){
      const die=C(this,Z)[String(values[at])];if(!die)continue;
      if(values[at+1]===-1){die.cosmosPhysicsDone=true;continue;}
      die.cosmosFrames??=[];die.cosmosFrames.push(Array.from(values.subarray(at+1,at+8)));
      die.mesh.position.set(values[at+1],values[at+2],values[at+3]);
      die.mesh.rotationQuaternion.set(values[at+4],values[at+5],values[at+6],values[at+7]);
    }
    const dice=Object.values(C(this,Z));
    if(dice.length>=this.config.cosmosExpectedDice&&dice.every(die=>die.cosmosPhysicsDone)){
      this.cosmosReplayPhase='prepare';this.cosmosReturnBuffer();
      void this.cosmosPrepareReplay(dice,this.cosmosGeneration);return;
    }
    // Worker messages already yield the UI thread. No render-frame delay is
    // needed while computing the short, bounded physics trace.
    C(this,ne).postMessage({action:'stepSimulation',diceBuffer:values.buffer},[values.buffer]);
  }
  cosmosReturnBuffer(){
    C(this,ne).postMessage({action:'stopSimulation'});
    // The worker must own the transfer buffer while paused, so the next roll
    // (or a roll after dismissal) can resume without waiting on a lost buffer.
    const buffer=this.diceBufferView.buffer;
    if(buffer.byteLength)C(this,ne).postMessage({action:'initBuffer',diceBuffer:buffer},[buffer]);
  }
  cosmosLiveUpdates(e){
    this.diceBufferView=new Float32Array(e);const values=this.diceBufferView;
    for(let index=0,at=1;index<values[0];index++,at+=8){
      const die=C(this,Z)[String(values[at])];if(!die)continue;
      if(values[at+1]===-1)void this.handleAsleep(die);
      else if(!die.asleep){die.mesh.position.set(values[at+1],values[at+2],values[at+3]);die.mesh.rotationQuaternion.set(values[at+4],values[at+5],values[at+6],values[at+7]);}
    }
    requestAnimationFrame(()=>{C(this,ne).postMessage({action:'stepSimulation',diceBuffer:this.diceBufferView.buffer},[this.diceBufferView.buffer]);});
  }
`.trimStart()+source.slice(updateEnd);
 // The earlier render offsets are unchanged by replacing the later method.
 source=source.slice(0,renderStart)+`
  render(e){
    C(this,oe).runRenderLoop(this.renderLoop.bind(this));
    if(this.config.cosmosReplay)this.cosmosReplayPhase='waiting';
    else C(this,ne).postMessage({action:'resumeSimulation',newStartPoint:e});
  }
  async cosmosPrepareReplay(dice,generation){
    try{
      for(const die of dice){
        if(generation!==this.cosmosGeneration)return;
        if(!die.cosmosFrames?.length)throw Error('No dice trajectory was recorded.');
        const last=die.cosmosFrames.at(-1),rotation=die.mesh.rotationQuaternion;
        die.mesh.position.set(last[0],last[1],last[2]);rotation.set(last[3],last[4],last[5],last[6]);rotation.normalize();
        const physical=rotation.clone();die.cosmosPreparing=true;
        await Oe.getRollResult(die,C(this,K));die.cosmosPreparing=false;
        if(generation!==this.cosmosGeneration)return;
        if(Number.isInteger(die.config.data?.targetValue)&&!die.cosmosPreparedFace)throw Error('Could not prepare the recorded face.');
        // q(t) * inverse(q(final)) * wanted(final): a constant body-space
        // offset throughout playback, with no last-frame face substitution.
        die.cosmosFaceOffset=physical.conjugate().multiply(rotation);
        die.cosmosQ0=rotation.clone();die.cosmosQ1=rotation.clone();
      }
      if(generation!==this.cosmosGeneration)return;
      this.cosmosReplayStarted=performance.now();this.cosmosReplayPhase='playback';
      this.cosmosPlayback(this.cosmosReplayStarted);
      for(const die of dice)die.mesh.isVisible=true;
      document.dispatchEvent(new Event('comos:dice-motion-start'));
    }catch(error){
      if(generation!==this.cosmosGeneration)return;
      this.cosmosReplayPhase='failed';C(this,oe).stopRenderLoop();
      console.error('Dice motion:',error.message);
      // Let the presentation show its authoritative receipt on visual failure.
      for(const die of dice)if(!die.dieParent)this.onRollResult({rollId:die.config.rollId,value:NaN});
    }
  }
  cosmosPlayback(now){
    // Speed changes only the playback clock. Captured physics, screen bounds,
    // bounces, and the final face stay identical at every speed.
    const time=Math.max(0,(now-this.cosmosReplayStarted)*60/1000)*(this.config.cosmosPlaybackSpeed||1),dice=Object.values(C(this,Z));let finished=true;
    for(const die of dice){
      const frames=die.cosmosFrames;if(!frames?.length)continue;
      const position=Math.min(time,frames.length-1),first=Math.floor(position),second=Math.min(first+1,frames.length-1),mix=position-first,a=frames[first],b=frames[second];
      die.mesh.position.set(a[0]+(b[0]-a[0])*mix,a[1]+(b[1]-a[1])*mix,a[2]+(b[2]-a[2])*mix);
      die.cosmosQ0.set(a[3],a[4],a[5],a[6]).normalize();die.cosmosQ1.set(b[3],b[4],b[5],b[6]).normalize();
      const orientation=die.cosmosQ0.constructor.Slerp(die.cosmosQ0,die.cosmosQ1,mix).multiply(die.cosmosFaceOffset);
      die.mesh.rotationQuaternion.copyFrom(orientation);die.mesh.computeWorldMatrix(true);
      if(time<frames.length-1)finished=false;
    }
    C(this,K).render();
    if(finished){this.cosmosReplayPhase='settled';for(const die of dice)void this.handleAsleep(die);}
  }
  renderLoop(){
    if(this.config.cosmosReplay){
      if(this.cosmosReplayPhase==='waiting'){
        if(Object.keys(C(this,Z)).length>=this.config.cosmosExpectedDice){
          this.cosmosReplayPhase='capture';C(this,ne).postMessage({action:'resumeSimulation',newStartPoint:false});
        }return;
      }
      if(this.cosmosReplayPhase==='capture'||this.cosmosReplayPhase==='prepare'||this.cosmosReplayPhase==='failed')return;
      if(this.cosmosReplayPhase==='playback'){this.cosmosPlayback(performance.now());return;}
    }
    if(C(this,me)&&C(this,me)===Object.keys(C(this,Z)).length){C(this,oe).stopRenderLoop();C(this,ne).postMessage({action:'stopSimulation'});this.onRollComplete();}
    else C(this,K).render();
  }
`.trimStart()+source.slice(renderEnd);
 source=source.replace(spawn,spawn+'\n  if(this.config.cosmosReplay)i.mesh.isVisible=false;');
 const child='return s.dieParent = i, s;';
 if(!source.includes(child))throw Error('Percentile playback adapter needs review.');
 source=source.replace(child,'s.dieParent=i;if(this.config.cosmosReplay)s.mesh.isVisible=false;return s;');
 const asleep='if (e.asleep = !0, await Oe.getRollResult(e, C(this, K)),';
 if(!source.includes(asleep))throw Error('Dice playback result adapter needs review.');
 source=source.replace(asleep,'if(e.asleep)return;e.asleep=true; if (await Oe.getRollResult(e, C(this, K)), e.cosmosLanded=true,');
 source=source.replace('!= null && t.asleep ||','!= null && t.cosmosLanded ||').replace('!= null && i.asleep)','!= null && i.cosmosLanded)');
 source=source.replace(clear,'  clear() {\n    this.cosmosGeneration=(this.cosmosGeneration||0)+1;this.cosmosReplayPhase=\'idle\';\n    !Object.keys(C(this, Z)).length');
 return source;
}
