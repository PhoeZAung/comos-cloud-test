// Only the current FFd20 character-shop opts into this conversion.
// The catalog retains its printed price; Pathfinder sheets can use native
// Pathfinder currencies without inheriting the FFd20 Gil rule.
export const FFD20_SHOP_PRICE_MODE='ffd20-gp-to-gil-v1';
const COIN_CENTS=Object.freeze({pp:1000,gp:100,sp:10,cp:1});

/** Read exact, fixed fantasy coin prices. Never guess at ranges, formulas,
 * per-stack prices, percentage modifiers, or unspecified currencies. */
export function sourceCoinsToGil(price){
 if(typeof price!=='string'||price.length>160)return null;
 const parts=price.trim().split(/\s+\+\s+/);
 if(!parts.length||parts.length>4)return null;
 const seen=new Set();
 let cents=0;
 for(const part of parts){
  const match=/^((?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d{1,2})?)\s*(pp|gp|sp|cp)$/i.exec(part.trim());
  if(!match)return null;
  const coin=match[2].toLowerCase();
  if(seen.has(coin))return null;
  seen.add(coin);
  const n=Number(match[1].replaceAll(',',''));
  if(!Number.isFinite(n)||n<0)return null;
  const pieceCents=n*COIN_CENTS[coin];
  if(!Number.isSafeInteger(Math.round(pieceCents))||Math.abs(pieceCents-Math.round(pieceCents))>1e-6)return null;
  cents+=Math.round(pieceCents);
  if(!Number.isSafeInteger(cents)||cents>1e14)return null;
 }
 return cents/100;
}

/** A manually assigned Gil price always wins. A missing price gets a
 * derived FFd20 *view/checkout* price only when explicitly requested. */
export function shopUnitPriceGil(item,pricingMode=null){
 if(item?.priceGil!==null&&item?.priceGil!==undefined)return item.priceGil;
 if(pricingMode!==FFD20_SHOP_PRICE_MODE)return null;
 return sourceCoinsToGil(item?.costText);
}
