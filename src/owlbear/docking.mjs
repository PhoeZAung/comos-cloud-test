// Coordinates are screen pixels, independent of the map's pan/zoom transform.
export function dockedPanels(view,layout,partyCount,battleCount,ready){
 const [vw,vh]=view,edge=12,top=Math.min(64,Math.max(edge,vh/8)),bottom=12;
 const availableWidth=Math.max(1,vw-edge*2),availableHeight=Math.max(1,vh-top-bottom);
 const vertical=['left','right'].includes(layout.partyDock),sameSide=layout.party&&partyCount&&layout.initiative&&ready&&vertical&&layout.partyDock===layout.initiativeDock;
 const width=Math.min(vertical?166:partyCount*160+8,availableWidth),height=Math.min(vertical?partyCount*78+8:86,availableHeight*(sameSide?0.45:1));
 const p={width,height,x:layout.partyDock==='left'?edge:layout.partyDock==='right'?vw-edge-width:(vw-width)/2,y:layout.partyDock==='bottom'?vh-bottom-height:top,vertical};
 const battleTop=top+(sameSide?height+8:layout.party&&partyCount&&layout.partyDock==='top'?height+8:0),battleBottom=bottom+(layout.party&&partyCount&&layout.partyDock==='bottom'?height+8:0);
 const bw=Math.min(410,availableWidth),bh=Math.min(Math.max(150,94+battleCount*42),Math.max(1,vh-battleTop-battleBottom));
 return {party:layout.party&&partyCount?p:null,battle:layout.initiative&&ready?{width:bw,height:bh,x:layout.initiativeDock==='right'?vw-edge-bw:edge,y:battleTop}:null};
}
