// Notes-only Electric Border adaptation for the framework-free sheet.
// The SVG strokes are resized with the note card, including expanding textareas.
let nextEffect=0;
const ns='http://www.w3.org/2000/svg';
const node=(name,attrs={})=>{const element=document.createElementNS(ns,name);for(const [key,value] of Object.entries(attrs))element.setAttribute(key,String(value));return element;};
export function mountNotesElectric(root){
 const disposers=[];
 for(const wrapper of root.querySelectorAll('.cs-notes-electric')){
  const id='cs-note-electric-'+(++nextEffect);
  const svg=node('svg',{class:'cs-note-electric-overlay','aria-hidden':'true',focusable:'false',preserveAspectRatio:'none'});
  const defs=node('defs'),filter=node('filter',{id,x:'-12%',y:'-12%',width:'124%',height:'124%'});
  const noise=node('feTurbulence',{type:'fractalNoise',baseFrequency:'0.026 0.045',numOctaves:2,seed:3,result:'noise'});
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
   const motion=node('animate',{attributeName:'baseFrequency',dur:'0.44s',values:'0.026 0.045;0.044 0.075;0.02 0.055;0.026 0.045',repeatCount:'indefinite'});
   noise.append(motion);
  }
  filter.append(noise,node('feDisplacementMap',{in:'SourceGraphic',in2:'noise',scale:7,xChannelSelector:'R',yChannelSelector:'G'}));
  defs.append(filter);svg.append(defs);
  const glow=node('rect',{x:4,y:4,rx:12,ry:12,class:'cs-note-electric-glow',filter:'url(#'+id+')'});
  const arc=node('rect',{x:4,y:4,rx:12,ry:12,class:'cs-note-electric-arc',filter:'url(#'+id+')'});
  const core=node('rect',{x:4,y:4,rx:12,ry:12,class:'cs-note-electric-core'});
  svg.append(glow,arc,core);wrapper.append(svg);
  const paint=()=>{
   if(!wrapper.isConnected)return;
   const w=Math.max(16,Math.ceil(wrapper.getBoundingClientRect().width)),h=Math.max(16,Math.ceil(wrapper.getBoundingClientRect().height));
   svg.setAttribute('viewBox','0 0 '+w+' '+h);
   for(const rect of [glow,arc,core]){rect.setAttribute('width',String(w-8));rect.setAttribute('height',String(h-8));}
  };
  const observer=typeof ResizeObserver==='undefined'?null:new ResizeObserver(paint);
  observer?.observe(wrapper);
  if(!observer)window.addEventListener('resize',paint);
  paint();
  disposers.push(()=>{observer?.disconnect();if(!observer)window.removeEventListener('resize',paint);svg.remove();});
 }
 return ()=>{for(const dispose of disposers)dispose();};
}
