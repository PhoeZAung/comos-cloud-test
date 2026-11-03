import OBR from '@owlbear-rodeo/sdk';
import {localChannel} from './local-channel.mjs';
const form=document.querySelector('form'),status=document.querySelector('[role=status]'),params=new URLSearchParams(location.search);let bus;
document.querySelector('[data-name]').textContent=params.get('name')||'Character';
OBR.onReady(async()=>{bus=await localChannel(OBR,data=>{if(data?.type==='state')form.querySelector('button').disabled=!data.admin;if(data?.type==='result'&&data.error){status.textContent=data.error;form.querySelector('button').disabled=false;}});bus.send({type:'hello'});});
form.onsubmit=event=>{event.preventDefault();if(!bus)return;const data=new FormData(form),stats=Object.fromEntries(['hp','mp','ac','initiative'].map(key=>[key,key==='hp'&&String(data.get(key)).trim()===''?null:Number(data.get(key))]));form.querySelector('button').disabled=true;status.textContent='';bus.send({type:'add',id:params.get('id'),stats,requestId:crypto.randomUUID()});};
window.addEventListener('pagehide',()=>bus?.close(),{once:true});
