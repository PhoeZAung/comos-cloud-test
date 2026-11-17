// Safe-area positions keep Party HUD clear of Owlbear's top toolbar,
// right tools, extension actions and bottom dock. No draggable HUD state.
export const PARTY_SIZES={
 large:{cardWidth:194,cardHeight:90},medium:{cardWidth:155,cardHeight:74},
 small:{cardWidth:128,cardHeight:60},compact:{cardWidth:112,cardHeight:44}
};
export function dockedPanels(view,layout,partyCount,battleCount,ready){
 const [vw,vh]=view,edge=12,top=Math.min(64,Math.max(edge,vh/8)),bottom=12;
 const leftSafe=Math.min(170,Math.floor(vw*.18)),rightSafe=Math.min(88,Math.floor(vw*.13));
 const topSafe=Math.min(76,Math.floor(vh*.12)),bottomSafe=Math.min(76,Math.floor(vh*.12));
 const usableWidth=Math.max(1,vw-leftSafe-rightSafe),usableHeight=Math.max(1,vh-topSafe-bottomSafe);
 const size=['large','medium','small','compact'].includes(layout.partySize)?layout.partySize:'medium';
 const metrics=PARTY_SIZES[size],requestedColumns=Number.isInteger(layout.partyColumns)?Math.max(1,Math.min(6,layout.partyColumns)):3;
 const fittingColumns=Math.max(1,Math.floor(Math.max(1,usableWidth-3)/(metrics.cardWidth+5)));
 const columns=Math.max(1,Math.min(requestedColumns,Math.max(1,partyCount),fittingColumns));
 const rows=Math.ceil(Math.max(0,partyCount)/columns);
 const width=Math.min(usableWidth,columns*(metrics.cardWidth+5)+3);
 const height=Math.min(usableHeight,28+rows*metrics.cardHeight+Math.max(0,rows-1)*5);
 const dock=['top','bottom','left','right'].includes(layout.partyDock)?layout.partyDock:'top';
 const centerX=leftSafe+Math.max(0,Math.floor((usableWidth-width)/2));
 const centerY=topSafe+Math.max(0,Math.floor((usableHeight-height)/2));
 const x=Math.max(0,Math.min(vw-width,dock==='left'?leftSafe:dock==='right'?vw-rightSafe-width:centerX));
 const y=Math.max(0,Math.min(vh-height,dock==='bottom'?vh-bottomSafe-height: dock==='top'?topSafe:centerY));
 const party={width,height,x,y,columns,vertical:false,size,dock};
 const bw=Math.min(410,Math.max(1,vw-edge*2));
 const bh=Math.min(Math.max(150,94+battleCount*42),Math.max(1,vh-top-bottom));
 return {party:layout.party&&partyCount?party:null,battle:layout.initiative&&ready?{width:bw,height:bh,x:layout.initiativeDock==='right'?vw-edge-bw:edge,y:top}:null};
}
