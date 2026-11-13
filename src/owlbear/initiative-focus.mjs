const KEY='com.cosmos.character-sheets/initiative-highlight';

// The local outlines never change the shared scene or take over a player's
// selection. Every player sees the turn marker; hover is per viewer.
export function initiativeFocus(OBR,buildShape){
 let items=[],active=null,hovered=null,recommended=null,rendered='',ids=[],closed=false,running=false,again=false,showHidden=false;
 const visible=id=>items.find(item=>item.id===id&&(showHidden||item.visible!==false)&&item.type==='IMAGE'&&item.layer==='CHARACTER');
 async function bounds(id){
  if(!visible(id))return null;
  const box=await OBR.scene.items.getItemBounds([id]);
  return box&&Number.isFinite(box.width)&&Number.isFinite(box.height)&&box.width>0&&box.height>0?box:null;
 }
 function signature(){
  return JSON.stringify([active,hovered,recommended,...[active,hovered,recommended].map(id=>{
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
    for(const [id,color,kind] of [[active,'#ffd66d','turn'],[hovered,'#5cecff','hover'],[recommended,'#ff475d','recommend']]){
     if(!id||!visible(id))continue;
     const box=await bounds(id);
     if(!box||closed)continue;
     // Outline the token's actual scene bounds, not a detached circle.
     // A shallow margin hugs transparent PNG tokens more closely and is
     // centered using the exact Owlbear item bounds, including scale/rotation.
     const margin=Math.max(3,Math.min(10,Math.min(box.width,box.height)*.035));
     const width=box.width+margin*2,height=box.height+margin*2;
     const cx=box.center?.x??(box.min.x+box.max.x)/2;
     const cy=box.center?.y??(box.min.y+box.max.y)/2;
     shapes.push(buildShape().shapeType('RECTANGLE')
      .width(width).height(height)
      .position({x:cx-width/2,y:cy-height/2})
      .layer('CHARACTER').zIndex((visible(id)?.zIndex||0)+100)
      .fillOpacity(0).strokeColor(color).strokeOpacity(1).strokeWidth(5)
      .disableHit(true).locked(true).disableAutoZIndex(true)
      .metadata({[KEY]:{tokenId:id,kind}}).build());
    }
    if(shapes.length&&!closed){await OBR.scene.local.addItems(shapes);ids=shapes.map(x=>x.id);}
    rendered=wanted;
   }while(again&&!closed);
  }catch(error){console.warn('Initiative highlight:',error.message);rendered='';}
  finally{running=false;}
 }
 async function locate(id){
  const box=await bounds(id);if(!box)return false;
  const center=box.center||{x:(box.min.x+box.max.x)/2,y:(box.min.y+box.max.y)/2};
  const size=Math.max(600,box.width*7,box.height*7);
  await OBR.viewport.animateToBounds({min:{x:center.x-size/2,y:center.y-size/2},
   max:{x:center.x+size/2,y:center.y+size/2},width:size,height:size,center});
  return true;
 }
 return {
  setShowHidden(value){const next=value===true;if(showHidden===next)return;showHidden=next;rendered='';if(hovered&&!visible(hovered))hovered=null;void draw();},
  update(nextItems,activeId){items=nextItems;active=activeId&&visible(activeId)?activeId:null;if(hovered&&!visible(hovered))hovered=null;if(recommended&&!visible(recommended))recommended=null;void draw();},
  recommend(id){recommended=id&&visible(id)?id:null;void draw();},
  hover(id){hovered=id&&visible(id)?id:null;void draw();},
  locate,
  // Frame both combatants only when the recommended target is already
  // visible on this GM's screen; otherwise keep the usual NPC-only focus.
  async frameTurn(id,targetId){
   if(!targetId||targetId===id)return locate(id);
   const [actor,target]=await Promise.all([bounds(id),bounds(targetId)]);
   if(!actor||!target)return locate(id);
   try{
    const center=box=>box.center||{x:(box.min.x+box.max.x)/2,y:(box.min.y+box.max.y)/2};
    const [point,width,height]=await Promise.all([
     OBR.viewport.transformPoint(center(target)),OBR.viewport.getWidth(),OBR.viewport.getHeight()
    ]);
    if(!point||![point.x,point.y,width,height].every(Number.isFinite)||
       point.x<0||point.y<0||point.x>width||point.y>height)return locate(id);
    const minX=Math.min(actor.min.x,target.min.x),minY=Math.min(actor.min.y,target.min.y);
    const maxX=Math.max(actor.max.x,target.max.x),maxY=Math.max(actor.max.y,target.max.y);
    const padding=Math.max(120,Math.min(actor.width,actor.height)*1.5,Math.min(target.width,target.height)*1.5);
    const spanX=Math.max(600,maxX-minX+padding*2),spanY=Math.max(600,maxY-minY+padding*2);
    const cx=(minX+maxX)/2,cy=(minY+maxY)/2;
    await OBR.viewport.animateToBounds({min:{x:cx-spanX/2,y:cy-spanY/2},
     max:{x:cx+spanX/2,y:cy+spanY/2},width:spanX,height:spanY,center:{x:cx,y:cy}});
    return true;
   }catch(error){console.warn('Recommended target framing:',error.message);return locate(id);}
  },
  async close(){closed=true;hovered=null;active=null;recommended=null;if(ids.length)await OBR.scene.local.deleteItems(ids);ids=[];}
 };
}
