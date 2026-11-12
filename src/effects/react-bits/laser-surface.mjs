// Convert the real sheet navigation bounds to the fixed effect's coordinates.
export function sheetLaserSurface(tabs,sheet,stage){
 if(!tabs||!sheet||tabs.width<=0||tabs.height<=0||stage.width<=0)return null;
 const left=tabs.left-stage.left,top=Math.max(0,tabs.top-stage.top);
 return {left,top,width:tabs.width,height:Math.max(sheet.bottom-stage.top,stage.height)-top,
  beamPosition:Math.max(0,Math.min(1,(left+tabs.width*0.6)/stage.width))};
}
