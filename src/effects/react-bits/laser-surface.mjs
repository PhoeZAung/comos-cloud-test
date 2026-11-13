// Convert the real sheet navigation bounds to the fixed effect's coordinates.
// Keep the hit bar aligned, but let side light run past the viewport edge.
// Longer tabs grow below the fold, while short tabs must not cut the flow off.
export const LASER_VIEWPORT_OVERFLOW=96;
export function sheetLaserSurface(tabs,sheet,stage){
 if(!tabs||!sheet||tabs.width<=0||tabs.height<=0||stage.width<=0||stage.height<=0)return null;
 const left=tabs.left-stage.left,top=Math.max(0,tabs.top-stage.top);
 const contentBottom=sheet.bottom-stage.top;
 const minBottom=stage.height+LASER_VIEWPORT_OVERFLOW;
 return {
  left,top,width:tabs.width,
  height:Math.max(contentBottom,minBottom)-top,
  beamPosition:Math.max(0,Math.min(1,(left+tabs.width*0.6)/stage.width))
 };
}
