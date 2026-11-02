import OBR from '@owlbear-rodeo/sdk';
import {peer} from './rpc.mjs';
import {dicePlus} from './dice-plus.mjs';
const status=document.querySelector('[data-status]'),list=document.querySelector('[data-characters]'),frame=document.querySelector('iframe'),dice=dicePlus(OBR);
let popup,nonce,connection,sheetConnection,sheetNonce,available=false;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function say(message){status.textContent=message;}
function back(){frame.hidden=true;list.hidden=false;document.querySelector('[data-back]').hidden=true;sheetConnection?.close();sheetConnection=null;frame.removeAttribute('src');}
async function load(){
 if(!connection)throw Error('Connect your Cosmos account first.');
 const characters=await connection.call('list');
 list.innerHTML=characters.map(c=>'<button class="character-card" data-character="'+esc(c.id)+'"><strong>'+esc(c.name)+'</strong><small>'+esc([c.race,c.className,c.level?'Level '+c.level:''].filter(Boolean).join(' · '))+'</small></button>').join('')||'<p>No characters on this account. Create one on the Cosmos website.</p>';
 say('Choose your character. Keep the Cosmos connection window open.');
}
OBR.onReady(()=>{available=true;say('Connect your Cosmos account to load your characters.');});
document.querySelector('[data-connect]').onclick=()=>{
 if(!available){say('Open this extension inside an Owlbear room first.');return;}
 const bytes=crypto.getRandomValues(new Uint8Array(32));nonce=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
 connection?.close();back();popup=window.open(new URL('connect.html#'+nonce,location.href).href,'cosmos-connect-'+crypto.randomUUID(),'width=520,height=520');
 if(!popup)say('Allow this Cosmos connection popup, then click Connect again.');else say('Sign in in the Cosmos connection window.');
};
window.addEventListener('message',event=>{
 if(event.origin!==location.origin)return;
 if(event.source===popup&&event.data?.type==='cosmos:connect-ready'&&event.data.nonce===nonce){
  const channel=new MessageChannel();connection=peer(channel.port1,()=>{throw Error('Unsupported request.');});popup.postMessage({type:'cosmos:connect-port',nonce},location.origin,[channel.port2]);void load().catch(error=>say(error.message));
 }
 if(event.source===frame.contentWindow&&event.data?.type==='cosmos:sheet-ready'&&event.data.nonce===sheetNonce){
  const channel=new MessageChannel();sheetConnection?.close();
  sheetConnection=peer(channel.port1,async(method,value)=>{
   if(!connection||popup?.closed)throw Error('The Cosmos connection window closed. Reconnect your account.');
   if(method==='api')return connection.call('api',value);
   if(method==='dice'){await dice.ready();return dice.roll(value.notation,document.querySelector('[data-audience]').value);}
   throw Error('Unsupported sheet action.');
  });
  frame.contentWindow.postMessage({type:'cosmos:sheet-port',nonce:sheetNonce},location.origin,[channel.port2]);
 }
 if(event.source===frame.contentWindow&&event.data?.type==='cosmos:back')back();
});
list.onclick=event=>{
 const button=event.target.closest('[data-character]');if(!button)return;
 sheetNonce=crypto.randomUUID();frame.src=new URL('sheet.html?characterId='+encodeURIComponent(button.dataset.character)+'#'+sheetNonce,location.href).href;
 list.hidden=true;frame.hidden=false;document.querySelector('[data-back]').hidden=false;
 say('Your character sheet · Rolls use Dice+ in this Owlbear room.');
};
document.querySelector('[data-back]').onclick=back;
document.querySelector('[data-refresh]').onclick=()=>void load().catch(error=>say(error.message));
document.querySelector('[data-dice-check]').onclick=()=>void dice.ready().then(()=>say('Dice+ is ready.')).catch(error=>say(error.message));
window.addEventListener('pagehide',()=>{connection?.close();sheetConnection?.close();},{once:true});
