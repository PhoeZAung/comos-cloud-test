const buffers=new WeakMap();
export function playDragonWhoosh(context,volume=0){
 if(!context||context.state!=='running'||!Number.isFinite(volume)||volume<=0)return ()=>{};
 const nodes=[],sources=[];let stopped=false;
 const stop=()=>{if(stopped)return;stopped=true;for(const source of sources)try{source.stop();}catch{}for(const node of nodes)try{node.disconnect();}catch{}};
 try{
  const time=context.currentTime,level=Math.min(1,volume),output=context.createGain();output.gain.value=level*.65;output.connect(context.destination);nodes.push(output);
  if(!buffers.has(context)){const buffer=context.createBuffer(1,Math.ceil(context.sampleRate*.82),context.sampleRate),data=buffer.getChannelData(0);let state=934751,low=0;for(let i=0;i<data.length;i++){state=(Math.imul(state,1664525)+1013904223)>>>0;const white=state/2147483648-1;low=low*.94+white*.06;data[i]=white*.25+low*2;}buffers.set(context,buffer);}
  const noise=context.createBufferSource(),filter=context.createBiquadFilter(),gain=context.createGain();noise.buffer=buffers.get(context);filter.type='lowpass';filter.Q.value=.65;filter.frequency.setValueAtTime(180,time);filter.frequency.exponentialRampToValueAtTime(1250,time+.28);filter.frequency.exponentialRampToValueAtTime(160,time+.76);
  gain.gain.setValueAtTime(0,time);gain.gain.linearRampToValueAtTime(.34,time+.16);gain.gain.exponentialRampToValueAtTime(.001,time+.8);noise.connect(filter).connect(gain).connect(output);noise.start(time);noise.stop(time+.82);nodes.push(noise,filter,gain);sources.push(noise);
  for(const [frequency,loudness,delay,length] of [[47,.035,0,.65],[932,.012,.19,.5],[1397,.008,.23,.47],[2093,.005,.28,.4]]){
   const tone=context.createOscillator(),envelope=context.createGain();tone.type='sine';tone.frequency.setValueAtTime(frequency,time+delay);tone.frequency.exponentialRampToValueAtTime(frequency*.88,time+delay+length);envelope.gain.setValueAtTime(0,time+delay);envelope.gain.linearRampToValueAtTime(loudness,time+delay+.045);envelope.gain.exponentialRampToValueAtTime(.0001,time+delay+length);tone.connect(envelope).connect(output);tone.start(time+delay);tone.stop(time+delay+length);sources.push(tone);nodes.push(tone,envelope);
  }
  // Disconnect the entire graph when the longest source ends or on cancellation.
  noise.onended=stop;return stop;
 }catch{stop();return ()=>{};}
}
