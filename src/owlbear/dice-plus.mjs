const SOURCE='com.cosmos.character-sheets';
export function dicePlus(OBR){
 const exchange=async(channel,request,accept,timeout)=>{
  const connectionId=await OBR.player.getConnectionId();
  return new Promise((resolve,reject)=>{
   let timer,off=()=>{};const done=(error,value)=>{clearTimeout(timer);off();error?reject(error):resolve(value);};
   off=OBR.broadcast.onMessage(channel,event=>{if(event.connectionId!==connectionId)return;if(accept(event.data))done(null,event.data);});
   timer=setTimeout(()=>done(Error('Dice+ did not respond. Add Dice+ to this Owlbear room and try again.')),timeout);
   OBR.broadcast.sendMessage(request.channel,request.data,{destination:'LOCAL'}).catch(error=>done(error));
  });
 };
 return {
  async ready(){const requestId=crypto.randomUUID();await exchange('dice-plus/isReady',{channel:'dice-plus/isReady',data:{requestId,timestamp:Date.now()}},d=>d?.requestId===requestId&&d.ready===true,3000);return true;},
  async roll(notation,target='everyone'){
   const requestId=crypto.randomUUID();
   const check=await exchange('dice-plus/validate-notation',{channel:'dice-plus/validate-notation',data:{requestId,notation,timestamp:Date.now()}},d=>d?.requestId===requestId&&typeof d.valid==='boolean',3000);
   if(!check.valid)throw Error(check.error?.message||'Dice+ rejected this notation.');
   const rollId=crypto.randomUUID(),playerId=await OBR.player.getId(),playerName=await OBR.player.getName(),connectionId=await OBR.player.getConnectionId();
   return new Promise((resolve,reject)=>{
    let timer;const cleanup=[];const done=(error,value)=>{clearTimeout(timer);cleanup.forEach(off=>off());error?reject(error):resolve(value);};
    cleanup.push(OBR.broadcast.onMessage(SOURCE+'/roll-result',event=>{const d=event.data;if(event.connectionId===connectionId&&d?.rollId===rollId&&d.playerId===playerId&&d.result?.diceNotation===notation)done(null,d.result);}));
    cleanup.push(OBR.broadcast.onMessage(SOURCE+'/roll-error',event=>{if(event.connectionId===connectionId&&event.data?.rollId===rollId)done(Error(event.data.error||'Dice+ roll failed.'));}));
    timer=setTimeout(()=>done(Error('Dice+ roll timed out. It may still appear in Dice+ history; Cosmos has not spent resources.')),90000);
    OBR.broadcast.sendMessage('dice-plus/roll-request',{rollId,playerId,playerName,rollTarget:target,diceNotation:notation,showResults:true,timestamp:Date.now(),source:SOURCE},{destination:'LOCAL'}).catch(error=>done(error));
   });
  }
 };
}
