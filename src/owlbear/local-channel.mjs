// Same-origin, per-room/per-browser memory channel. Never send grants via OBR
// broadcasts: those channels can be observed by unrelated room extensions.
export async function localChannel(OBR,receive){
 const id=await OBR.player.getConnectionId(),channel=new BroadcastChannel('cosmos.unified.'+OBR.room.id+'.'+id);
 channel.onmessage=event=>receive(event.data);
 return {send:value=>channel.postMessage(value),close:()=>channel.close()};
}
