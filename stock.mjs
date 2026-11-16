import {STORE_DIRECTORY,CITIES,CITY_NAMES} from './store-directory.mjs';
export {STORE_DIRECTORY,CITIES,CITY_NAMES};
export const PRODUCTS = [{capacity:256,sku:'MK2M4CH/A'},{capacity:512,sku:'MK2P4CH/A'}];
export const STORES = STORE_DIRECTORY.map(s=>[s.id,s.city,s.name]);
export const DEFAULT_CITIES = '杭州,上海';
const normalizeCity=city=>String(city).trim().replace(/市$/,'');
export function selectCities(selection=DEFAULT_CITIES) {
 const requested=selection==='all'?CITY_NAMES:String(selection).split(',').map(normalizeCity).filter(Boolean);
 if(!requested.length||requested.some(name=>!CITY_NAMES.includes(name)))throw Error('不支持的城市');
 return [...new Set(requested)];
}
function unknownStore(s,quote='查询失败，不能判断是否有货') {
 return {id:s.id,city:s.city,name:s.name,address:s.address,products:PRODUCTS.map(p=>({...p,status:'unknown',quote,checkedAt:null}))};
}
export function parseStores(payload, city, checkedAt) {
 city=normalizeCity(city);
 if(!CITY_NAMES.includes(city))throw Error('不支持的城市');
 if(String(payload?.head?.status)!=='200'||!Array.isArray(payload?.body?.stores))throw Error('Apple 返回格式异常');
 const found=new Map(payload.body.stores.filter(s=>normalizeCity(s.city||'')===city).map(s=>[s.storeNumber,s]));
 return STORE_DIRECTORY.filter(s=>s.city===city).map(record=>{
  const s=found.get(record.id);
  return {id:record.id,city,name:record.name,address:s?.address?.address2||record.address,products:PRODUCTS.map(p=>{
   const a=s?.partsAvailability?.[p.sku];
   const title=a?.messageTypes?.regular?.storePickupProductTitle||'';
   const valid=/iPhone\s+Duo\b/i.test(title)&&new RegExp('\\b'+p.capacity+'\\s*GB\\b','i').test(title)&&title.includes('星光白色');
   const status=valid&&['available','unavailable'].includes(a?.pickupDisplay)?a.pickupDisplay:'unknown';
   return {...p,status,quote:status==='unknown'?'暂未获得有效库存':String(a.pickupSearchQuote||''),checkedAt:status==='unknown'?null:checkedAt};
  })};
 });
}
export async function collect(fetcher=fetch,selection=DEFAULT_CITIES) {
 const cities=selectCities(selection);
 const checkedAt=new Date().toISOString();
 const errors=[];
 const groups=new Array(cities.length);
 let cursor=0;
 async function worker(){
  while(cursor<cities.length){
   const index=cursor++,city=cities[index];
   // City-specific official store postcode, not a guessed geocoding location.
   const location=CITIES.find(c=>c.name===city).postalCode;
   const url=new URL('https://www.apple.com.cn/shop/retail/pickup-message');
   url.searchParams.set('pl','true');url.searchParams.set('location',location);
   PRODUCTS.forEach((p,i)=>url.searchParams.set('parts.'+i,p.sku));
   try{
    const get=async target=>{
     const res=await fetcher(target,{headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json','Referer':'https://www.apple.com.cn/shop/buy-iphone/iphone-duo'},signal:AbortSignal.timeout(20000)});
     if(!res.ok)throw Error('Apple HTTP '+res.status);
     return res.json();
    };
    let payload=await get(url);
    // Some official postcodes (currently Chengdu 610000) are rejected by
    // Apple's geocoder. Its verified store-ID query avoids that geocoder.
    if(payload?.body?.errorMessage?.includes('邮政编码')&&!Array.isArray(payload.body.stores)){
     const stores=[];
     for(const record of STORE_DIRECTORY.filter(s=>s.city===city)){
      const direct=new URL(url);direct.searchParams.delete('location');direct.searchParams.set('store',record.id);
      try{
       const result=await get(direct);
       if(String(result?.head?.status)!=='200'||!Array.isArray(result?.body?.stores))throw Error('门店查询格式异常');
       stores.push(...result.body.stores);
      }catch(e){errors.push(city+' '+record.name+'：'+e.message);}
     }
     payload={head:{status:'200'},body:{stores}};
    }
    groups[index]=parseStores(payload,city,checkedAt);
    if(groups[index].some(s=>s.products.some(p=>p.status==='unknown')))errors.push(city+'：部分门店或商品未返回有效库存');
   }catch(e){
    errors.push(city+'：'+e.message);
    groups[index]=STORE_DIRECTORY.filter(s=>s.city===city).map(s=>unknownStore(s));
   }
  }
 }
 await Promise.all(Array.from({length:Math.min(3,cities.length)},()=>worker()));
 return {checkedAt,source:'Apple 中国大陆官网 · 门店自提',cities,errors,stores:groups.flat()};
}
