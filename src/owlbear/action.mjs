import OBR from '@owlbear-rodeo/sdk';
import {peer} from './rpc.mjs';
import {dicePlus} from './dice-plus.mjs';
import {panelSize} from './panel-size.mjs';
const status=document.querySelector('[data-status]'),list=document.querySelector('[data-characters]'),frame=document.querySelector('iframe'),dice=dicePlus(OBR);
let popup,nonce,connection,sheetConnection,sheetNonce,activeCharacterId,tabWindow,tabNonce,tabConnection,tabCharacterId,available=false;
const tabName='cosmos-owlbear-sheet-'+crypto.randomUUID(),openTab=document.querySelector('[data-open-sheet-tab]');
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function say(message){status.textContent=message;}
function back(){frame.hidden=true;list.hidden=false;document.querySelector('[data-back]').hidden=true;openTab.hidden=true;activeCharacterId=null;sheetConnection?.close();sheetConnection=null;sheetNonce=null;frame.removeAttribute('src');}
async function sheetRequest(method,value){
 if(!connection||popup?.closed)throw Error('The Cosmos connection window closed. Reconnect your account.');
 if(method==='api')return connection.call('api',value);
 if(method==='dice'){await dice.ready();return dice.roll(value.notation,document.querySelector('[data-audience]').value);}
 throw Error('Unsupported sheet action.');
}
async function load(){
 if(!connection)throw Error('Connect your Cosmos account first.');
 const characters=await connection.call('list');
 list.innerHTML=characters.map(c=>'<button class="character-card" data-character="'+esc(c.id)+'"><strong>'+esc(c.name)+'</strong><small>'+esc([c.race,c.className,c.level?'Level '+c.level:''].filter(Boolean).join(' · '))+'</small></button>').join('')||'<p>No characters on this account. Create one on the Cosmos website.</p>';
 say('Choose your character. Keep the Cosmos connection window open.');
}
OBR.onReady(()=>{available=true;say('Connect your Cosmos account to load your characters.');void OBR.action.setIcon(new URL('/owlbear/sheet-action.svg',location.origin).href).catch(()=>{});void panelSize(OBR,say).catch(error=>say(error.message));});
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
 const fromFrame=sheetNonce&&event.source===frame.contentWindow&&event.data?.nonce===sheetNonce;
 const fromTab=tabNonce&&event.source===tabWindow&&event.data?.nonce===tabNonce;
 if((fromFrame||fromTab)&&event.data?.type==='cosmos:sheet-ready'){
  const channel=new MessageChannel();
  if(fromTab){tabConnection?.close();tabConnection=peer(channel.port1,sheetRequest);}
  else{sheetConnection?.close();sheetConnection=peer(channel.port1,sheetRequest);}
  event.source.postMessage({type:'cosmos:sheet-port',nonce:event.data.nonce},location.origin,[channel.port2]);
 }
 if((fromFrame||fromTab)&&event.data?.type==='cosmos:back'){back();if(fromTab){tabConnection?.close();tabConnection=null;tabCharacterId=null;}}
});
list.onclick=event=>{
 const button=event.target.closest('[data-character]');if(!button)return;
 activeCharacterId=button.dataset.character;sheetConnection?.close();sheetConnection=null;
 sheetNonce=crypto.randomUUID();frame.src=new URL('sheet.html?characterId='+encodeURIComponent(activeCharacterId)+'#'+sheetNonce,location.href).href;
 list.hidden=true;frame.hidden=false;document.querySelector('[data-back]').hidden=false;openTab.hidden=false;
 document.querySelector('.panel-options').open=false;
 say('Your character sheet · Rolls use Dice+ in this Owlbear room.');
};
openTab.onclick=()=>{
 if(!activeCharacterId)return;
 if(tabWindow&&!tabWindow.closed&&tabCharacterId===activeCharacterId){tabWindow.focus();return;}
 tabNonce=crypto.randomUUID();tabConnection?.close();tabConnection=null;
 tabWindow=window.open(new URL('sheet.html?characterId='+encodeURIComponent(activeCharacterId)+'#'+tabNonce,location.href).href,tabName);
 if(!tabWindow){tabCharacterId=null;say('Allow the sheet tab, then click Open in new tab again.');return;}
 tabCharacterId=activeCharacterId;tabWindow.focus();say('Sheet opened in your browser. Keep this Owlbear room and the Cosmos connection window open for Dice+.');
};
document.querySelector('[data-back]').onclick=back;
document.querySelector('[data-refresh]').onclick=()=>void load().catch(error=>say(error.message));
document.querySelector('[data-dice-check]').onclick=()=>void dice.ready().then(()=>say('Dice+ is ready.')).catch(error=>say(error.message));
window.addEventListener('pagehide',()=>{connection?.close();sheetConnection?.close();tabConnection?.close();},{once:true});
