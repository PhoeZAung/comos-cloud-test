import {createRoot} from 'react-dom/client';
import {toPng} from 'html-to-image';
import PaperCrumple from '../../components/react-bits/PaperCrumple.jsx';

export async function sheetImage(sheet){
 const width=Math.max(1,Math.ceil(sheet.getBoundingClientRect().width));
 const height=Math.min(900,Math.max(400,innerHeight));
 try{
  return await toPng(sheet,{width,height,pixelRatio:1,skipFonts:true,backgroundColor:'#f4f0e8',
   style:{width:width+'px',height:height+'px',overflow:'hidden',visibility:'visible'},
   filter:node=>!node.matches?.('dialog,canvas,.cs-note-electric-overlay,[data-recovery-panel]')});
 }catch{
  // A blocked image or stylesheet must not break a confirmed deletion.
  const canvas=document.createElement('canvas');canvas.width=320;canvas.height=400;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#f4f0e8';ctx.fillRect(0,0,320,400);
  ctx.fillStyle='#292536';ctx.font='bold 22px serif';ctx.fillText((sheet.querySelector('h1')?.textContent||'Cosmos character').slice(0,25),20,45);
  ctx.font='14px sans-serif';const lines=sheet.innerText.split('\n').map(s=>s.trim()).filter(Boolean).slice(0,16);
  lines.forEach((line,i)=>ctx.fillText(line.slice(0,36),20,80+i*18));return canvas.toDataURL();
 }
}
export function mountPaperCrumple(host,src){
 let readyResolve,readyReject,foldResolve;
 const ready=new Promise((resolve,reject)=>{readyResolve=resolve;readyReject=reject;});
 const folded=new Promise(resolve=>{foldResolve=resolve;});
 const root=createRoot(host,{onUncaughtError:readyReject});
 root.render(<PaperCrumple src={src} alt="Character sheet" width={320} height={400} sceneHeight={560}
  releaseBehavior="restore" crumpleAmount={0.85} crumpleDuration={0.55} releaseDuration={0.4}
  foldCount={6} foldSharpness={0.6} wrinkleDepth={0.65} creaseStrength={0.18}
  paperColor="#f4f0e8" paperTexture={0.08} draggable returnToOrigin
  onReady={readyResolve} onError={readyReject} onStateChange={state=>{if(state==='crumpled')foldResolve();}} />);
 return {ready,folded,dispose:()=>root.unmount()};
}
