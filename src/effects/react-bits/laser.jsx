import {useLayoutEffect,useRef,useState} from 'react';
import {createRoot} from 'react-dom/client';
import LaserFlow from '../../components/react-bits/LaserFlow.jsx';
import {sheetLaserSurface} from './laser-surface.mjs';
import '../../styles/laser-flow.css';

// React owns only the decoration; the site and sheet controls stay native.
function CosmosLaserFlow(){
 const cardRef=useRef(null),stageRef=useRef(null);
 const [surface,setSurface]=useState(null);
 useLayoutEffect(()=>{
  const stage=stageRef.current,main=document.querySelector('main');
  let frame=0,observedTabs,observedSheet,closed=false;
  const resize=new ResizeObserver(schedule);
  function measure(){
   frame=0;if(closed)return;
   const tabs=main?.querySelector('.cs-tabs[aria-label="Character sheet"]');
   const sheet=tabs?.closest('[data-sheet]');
   if(tabs!==observedTabs||sheet!==observedSheet){
    if(observedTabs)resize.unobserve(observedTabs);if(observedSheet)resize.unobserve(observedSheet);
    observedTabs=tabs;observedSheet=sheet;
    if(tabs)resize.observe(tabs);if(sheet)resize.observe(sheet);
   }
   const next=sheetLaserSurface(tabs?.getBoundingClientRect(),sheet?.getBoundingClientRect(),stage.getBoundingClientRect());
   setSurface(current=>JSON.stringify(current)===JSON.stringify(next)?current:next);
  }
  function schedule(){if(!closed&&!frame)frame=requestAnimationFrame(measure);}
  const mutations=new MutationObserver(schedule);
  if(main){mutations.observe(main,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});resize.observe(main);}
  resize.observe(stage);measure();
  // Capture nested scroll containers as well as window scrolling (including Owlbear).
  window.addEventListener('scroll',schedule,{capture:true,passive:true});
  window.addEventListener('resize',schedule,{passive:true});
  return ()=>{closed=true;cancelAnimationFrame(frame);resize.disconnect();mutations.disconnect();window.removeEventListener('scroll',schedule,true);window.removeEventListener('resize',schedule);};
 },[]);
 return <div ref={stageRef} className="cosmos-laser-stage" data-laser-surface={surface?'sheet-tabs':'ambient'}>
  <div ref={cardRef} className="cosmos-laser-surface" style={surface?{left:surface.left,top:surface.top,width:surface.width,height:surface.height,right:'auto',bottom:'auto'}:undefined} />
  <LaserFlow surfaceRef={cardRef} beamPosition={surface?.beamPosition??0.6} color="#3847ff"
   intensity={1.8} flare={1.5} spread={surface?2.5:1.5} spill={1} fog={0.2} dust={1.6}
   revealImage={new URL('../comos-universe.png',import.meta.url).href}
   revealRadius={220} revealOpacity={0.6} />
 </div>;
}
export function mountLaserFlow(host){
 const root=createRoot(host);
 root.render(<CosmosLaserFlow />);
 return ()=>root.unmount();
}
