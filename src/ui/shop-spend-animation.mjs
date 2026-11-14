// Only animate a successful purchase receipt returned from the server.
// No optimistic deduction: the amount displayed is the actual Gil spent.
const currency=value=>new Intl.NumberFormat('en-US',{minimumFractionDigits:0,maximumFractionDigits:2}).format(value);
export function showShopSpendAnimation(receipt,{doc=typeof document==='undefined'?null:document}={}){
 const spent=receipt?.totalGil,remaining=receipt?.remainingGil;
 if(!doc||!Number.isFinite(spent)||spent<=0||!Number.isFinite(remaining)||remaining<0)return null;
 const before=spent+remaining;
 if(!Number.isFinite(before))return null;
 doc.querySelector('[data-shop-spend-feedback]')?.remove();
 const overlay=doc.createElement('aside');
 overlay.className='cs-shop-spend-feedback';
 overlay.dataset.shopSpendFeedback='';
 overlay.setAttribute('role','status');
 overlay.setAttribute('aria-label','Spent '+currency(spent)+' Gil. Balance '+currency(remaining)+' Gil.');
 overlay.innerHTML='<div class="cs-shop-spend-caption">Purchase complete</div>'+
  '<div class="cs-shop-spend-line"><span aria-hidden="true">🪙</span> <strong data-shop-spend-balance></strong></div>'+
  '<div class="cs-shop-spend-deduction" aria-hidden="true">− 🪙 '+currency(spent)+'</div>';
 const balance=overlay.querySelector('[data-shop-spend-balance]');
 balance.textContent=currency(before);
 doc.body.append(overlay);
 const view=doc.defaultView;
 const reduceMotion=view?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
 if(!reduceMotion&&typeof view?.requestAnimationFrame==='function'){
  let start=null;
  const animate=now=>{
   if(!overlay.isConnected)return;
   if(start===null)start=now;
   const t=Math.min(1,(now-start)/1050);
   const eased=1-(1-t)**3;
   balance.textContent=currency(Math.round((before-(spent*eased))*100)/100);
   if(t<1)view.requestAnimationFrame(animate);
   else balance.textContent=currency(remaining);
  };
  view.requestAnimationFrame(animate);
 }else balance.textContent=currency(remaining);
 view?.setTimeout?.(()=>overlay.remove(),2800);
 return overlay;
}
