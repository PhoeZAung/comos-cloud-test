// Coordinates are local Owlbear viewport pixels, unaffected by map pan/zoom.
// The Party overlay can be dragged anywhere within the visible viewport.
export function dockedPanels(view,layout,partyCount,battleCount,ready){
 const [vw,vh]=view,edge=12,top=Math.min(64,Math.max(edge,vh/8)),bottom=12;
 const availableWidth=Math.max(1,vw-edge*2),availableHeight=Math.max(1,vh-edge*2);
 const requestedColumns=Number.isInteger(layout.partyColumns)?Math.max(1,Math.min(6,layout.partyColumns)):3;
 const fittingColumns=Math.max(1,Math.floor(Math.max(1,availableWidth-3)/160));
 const columns=Math.max(1,Math.min(requestedColumns,Math.max(1,partyCount),fittingColumns));
 const rows=Math.ceil(Math.max(0,partyCount)/columns);
 const width=Math.min(availableWidth,columns*160+3);
 // 24px draggable title, 74px cards, 5px row gap and 8px outer padding.
 const height=Math.min(availableHeight,32+rows*74+Math.max(0,rows-1)*5);
 const fraction=value=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));
 const x=Math.round((vw-width)*fraction(layout.partyX));
 const y=Math.round((vh-height)*fraction(layout.partyY));
 const p={width,height,x,y,columns,vertical:false};
 const bw=Math.min(410,Math.max(1,vw-edge*2));
 const bh=Math.min(Math.max(150,94+battleCount*42),Math.max(1,vh-top-bottom));
 return {party:layout.party&&partyCount?p:null,battle:layout.initiative&&ready?{width:bw,height:bh,x:layout.initiativeDock==='right'?vw-edge-bw:edge,y:top}:null};
}
// Normalize a handle drag in pixels into a persisted viewport-relative position.
export function moveParty(layout,rectangle,view,dx,dy){
 if(!rectangle||![dx,dy].every(Number.isFinite))return null;
 const [vw,vh]=view;
 const x=Math.max(0,Math.min(vw-rectangle.width,rectangle.x+dx));
 const y=Math.max(0,Math.min(vh-rectangle.height,rectangle.y+dy));
 return {partyX:vw>rectangle.width?x/(vw-rectangle.width):0,
  partyY:vh>rectangle.height?y/(vh-rectangle.height):0};
}
