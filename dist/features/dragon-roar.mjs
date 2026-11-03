// Original, deterministic creature vocal: rough glottal pulses, subharmonics,
// breath, and vocal-formant resonances. No recording or third-party sample.
export const DRAGON_ROAR_SECONDS=.98;
export function synthesizeDragonRoar(sampleRate=44100){
 if(!Number.isFinite(sampleRate)||sampleRate<8000||sampleRate>192000)throw Error('Unsupported audio sample rate.');
 const data=new Float32Array(Math.ceil(sampleRate*DRAGON_ROAR_SECONDS));let random=928731,phase=0,subphase=0,jitter=0,breath=0,peak=0;
 function resonator(frequency,q){const omega=2*Math.PI*frequency/sampleRate,alpha=Math.sin(omega)/(2*q),denominator=1+alpha,b0=alpha/denominator,b2=-b0,a1=-2*Math.cos(omega)/denominator,a2=(1-alpha)/denominator;let x1=0,x2=0,y1=0,y2=0;return x=>{const y=b0*x+b2*x2-a1*y1-a2*y2;x2=x1;x1=x;y2=y1;y1=y;return y;};}
 const chest=resonator(310,1.25),throat=resonator(810,1.1),snarl=resonator(1660,.8),breathDecay=Math.exp(-2*Math.PI*2400/sampleRate);
 for(let i=0;i<data.length;i++){
  const t=i/sampleRate,u=t/DRAGON_ROAR_SECONDS;random=(Math.imul(random,1664525)+1013904223)>>>0;const noise=random/2147483648-1;jitter=jitter*.995+noise*.005;breath=breath*breathDecay+noise*(1-breathDecay);
  const pitch=64+32*Math.exp(-Math.pow((t-.2)/.15,2))-24*u+7*Math.sin(2*Math.PI*23*t)+jitter*30;
  phase+=2*Math.PI*pitch/sampleRate;subphase+=2*Math.PI*(pitch*.497+Math.sin(t*17)*1.5)/sampleRate;
  const pulses=Math.tanh(2.5*(Math.sin(phase)+.45*Math.sin(phase*2+.3)+.22*Math.sin(phase*3)));
  const roughness=.77+.23*Math.sin(2*Math.PI*31*t)*Math.sin(2*Math.PI*19*t),voice=(pulses*.73+Math.sin(subphase)*.27)*roughness+breath*.3;
  const attack=Math.min(1,t/.055),release=Math.pow(Math.max(0,1-u),.6)*Math.min(1,(1-u)/.13),envelope=Math.sin(attack*Math.PI/2)*release;
  const value=(chest(voice)*1.65+throat(voice)*1.05+snarl(voice)*.38+Math.sin(subphase)*.13+breath*.07)*envelope;
  data[i]=value;peak=Math.max(peak,Math.abs(value));
 }
 if(peak)for(let i=0;i<data.length;i++)data[i]=data[i]/peak*.86;
 return data;
}
