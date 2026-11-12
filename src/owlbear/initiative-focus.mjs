import {buildShape} from '@owlbear-rodeo/sdk';

const KEY='com.cosmos.character-sheets/initiative-highlight';

// The local outlines never change the shared scene or take over a player's
// selection. Every player sees the turn marker; hover is per viewer.
export function initiativeFocus(OBR){
 let items=[],active=null,hovered=null,rendered='',ids=[],closed=false,running=false,again=false;
 const visible=id=>items.find(item=>item.id===id&&item.visible!==false&&item.type==='IMAGE'&&item.layer==='CHARACTER');
 async function bounds(id){
  if(!visible(id))return null;
  const box=await OBR.scene.items.getItemBounds([id]);
  return box&&Number.isFinite(box.width)&&Number.isFinite(box.height)&&box.width>0&&box.height>0?box:null;
 }
 function signature(){
  return JSON.stringify([active,hovered,...[active,hovered].map(id=>{
   const item=visible(id);return item?[id,item.position,item.rotation,item.scale,item.image?.width,item.image?.height,item.lastModified]:null;
  })]);
 }
 async function draw(){
  if(running){again=true;return;}running=true;
  try{
   do{
    again=false;
    const wanted=signature();
    if(wanted===rendered)continue;
    if(ids.length){await OBR.scene.local.deleteItems(ids);ids=[];}
    if(closed)return;
    const shapes=[];
    for(const [id,color,pad] of [[active,'#ffd66d',8],[hovered,'#5cecff',16]]){
     if(!id||!visible(id))continue;
     const box=await bounds(id);
     if(!box||closed)continue;
     const margin=Math.max(pad,Math.min(box.width,box.height)*.12);
     shapes.push(buildShape().shapeType('CIRCLE')
      .width(box.width+margin*2).height(box.height+margin*2)
      .position({x:box.min.x-margin,y:box.min.y-margin})
      .layer('CHARACTER').zIndex((visible(id)?.zIndex||0)+100)
      .fillOpacity(0).strokeColor(color).strokeOpacity(1).strokeWidth(5)
      .disableHit(true).locked(true).disableAutoZIndex(true)
      .metadata({[KEY]:{tokenId:id,kind:id===hovered?'hover':'turn'}}).build());
    }
    if(shapes.length&&!closed){await OBR.scene.local.addItems(shapes);ids=shapes.map(x=>x.id);}
    rendered=wanted;
   }while(again&&!closed);
  }catch(error){console.warn('Initiative highlight:',error.message);rendered='';}
  finally{running=false;}
 }
 return {
  update(nextItems,activeId){items=nextItems;active=activeId&&visible(activeId)?activeId:null;if(hovered&&!visible(hovered))hovered=null;void draw();},
  hover(id){hovered=id&&visible(id)?id:null;void draw();},
  async locate(id){
   const box=await bounds(id);if(!box)return false;
   // Don't zoom all the way to a single token: keep adjacent squares visible.
   const size=Math.max(600,box.width*7,box.height*7);
   const expanded={min:{x:box.center.x-size/2,y:box.center.y-size/2},
     max:{x:box.center.x+size/2,y:box.center.y+size/2},width:size,height:size,center:box.center};
   await OBR.viewport.animateToBounds(expanded);
   return true;
  },
  async close(){closed=true;hovered=null;active=null;if(ids.length)await OBR.scene.local.deleteItems(ids);ids=[];}
 };
}
