export const PRODUCTS = [{capacity:256,sku:'MK2M4CH/A'},{capacity:512,sku:'MK2P4CH/A'}];
export const STORES = [
 ['R471','杭州','西湖'],['R532','杭州','杭州万象城'],
 ['R581','上海','五角场'],['R390','上海','香港广场'],['R401','上海','上海环贸 iapm'],['R359','上海','南京东路'],['R389','上海','浦东'],['R678','上海','静安'],['R683','上海','环球港'],['R705','上海','七宝']
];
export function parseStores(payload, city, checkedAt) {
 if(String(payload?.head?.status)!=='200'||!Array.isArray(payload?.body?.stores)) throw Error('Apple 返回格式异常');
 const found = new Map(payload.body.stores.filter(s=>s.city?.replace(/市$/,'')===city).map(s=>[s.storeNumber,s]));
 return STORES.filter(s=>s[1]===city).map(([id,city,name])=>{
  const s=found.get(id);
  return {id,city,name,address:s?.address?.address2||'',products:PRODUCTS.map(p=>{
   const a=s?.partsAvailability?.[p.sku];
   const title=a?.messageTypes?.regular?.storePickupProductTitle||'';
   const valid=title.includes('iPhone Duo')&&title.includes(String(p.capacity))&&title.includes('星光白色');
   const status=valid&&['available','unavailable'].includes(a?.pickupDisplay)?a.pickupDisplay:'unknown';
   return {...p,status,quote:status==='unknown'?'暂未获得有效库存':String(a.pickupSearchQuote||''),checkedAt:status==='unknown'?null:checkedAt};
  })};
 });
}
export async function collect(fetcher=fetch) {
 const checkedAt=new Date().toISOString();
 const errors=[];
 const groups=await Promise.all([['杭州','310000'],['上海','200000']].map(async([city,location])=>{
  const url=new URL('https://www.apple.com.cn/shop/retail/pickup-message');
  url.searchParams.set('pl','true');url.searchParams.set('location',location);
  PRODUCTS.forEach((p,i)=>url.searchParams.set('parts.'+i,p.sku));
  try {
   const res=await fetcher(url,{headers:{'User-Agent':'Mozilla/5.0','Accept':'application/json','Referer':'https://www.apple.com.cn/shop/buy-iphone/iphone-duo'},signal:AbortSignal.timeout(20000)});
   if(!res.ok)throw Error('Apple HTTP '+res.status);
   const rows=parseStores(await res.json(),city,checkedAt);
   if(rows.some(s=>s.products.some(p=>p.status==='unknown')))errors.push(city+'：部分门店或商品未返回有效库存');
   return rows;
  }catch(e){errors.push(city+'：'+e.message);return STORES.filter(s=>s[1]===city).map(([id,city,name])=>({id,city,name,address:'',products:PRODUCTS.map(p=>({...p,status:'unknown',quote:'查询失败，不能判断是否有货',checkedAt:null}))}));}
 }));
 return {checkedAt,source:'Apple 中国大陆官网 · 门店自提',errors,stores:groups.flat()};
}
