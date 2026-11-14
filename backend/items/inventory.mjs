import {shopSourceForItem} from '../../src/features/sheet/shop-sources.mjs';
import {inventoryEditorKeys,inventoryItemValue,inventorySourceFields,usableItemImageUrl} from '../../src/features/sheet/inventory-fields.mjs';

export function catalogInventoryItem(item,quantity){
 const catalog=item.catalog||{};
 const mapped={};
 for(const key of inventoryEditorKeys(item.category)){
  if(['sourceCategory','name','amount','desc','two_handed'].includes(key))continue;
  const value=inventoryItemValue({sourceCatalog:catalog},key);
  if(value===undefined||value===null||String(value).trim()==='')continue;
  if(key==='weight'){
   const weight=Number.parseFloat(String(value));if(Number.isFinite(weight)&&weight>=0&&weight<=1000000)mapped.weight=weight;
  }else if(key==='img'){
    const url=usableItemImageUrl(value);
    if(url)mapped.img=url;
   }else if(['string','number'].includes(typeof value))mapped[key]=String(value).slice(0,1200);
 }
 return {...mapped,name:item.name,desc:item.description,sourceCategory:item.category,tags:item.category,amount:quantity,
  equipped:false,equip_slot:'',sourceItemId:item.id,sourceOriginalId:catalog.id||'',sourceCatalog:catalog,
  details:catalog.details||[],cost:item.costText||mapped.cost||'',shopSource:shopSourceForItem(item),
  sourceFields:inventorySourceFields({sourceCatalog:catalog}),
  sourceCategoryDetail:catalog.sourceCategoryDetail||catalog.sourceCategory||catalog.originalCategory||catalog.sourceSection||'',
  link:catalog.detailUrl||catalog.sourceUrl||'',...(catalog.dmg?{damage:catalog.dmg}:{})};
}
