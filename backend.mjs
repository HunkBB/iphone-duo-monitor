const ORIGIN = 'https://hunkbb.github.io';
const JSON_HEADERS = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
export function createBackend({collectFn,html,cities=[]}) {
 const pending=new Map();
 async function save(bucket,city,data){
  if(!bucket)return;
  const key='inventory/'+encodeURIComponent(city)+'.json';
  for(let attempt=0;attempt<3;attempt++){
   const old=await bucket.get(key);
   if(old&&(await old.json()).checkedAt>=data.checkedAt)return;
   const onlyIf=new Headers(old?{'If-Match':old.httpEtag}:{'If-None-Match':'*'});
   const saved=await bucket.put(key,JSON.stringify(data),{onlyIf,httpMetadata:{contentType:'application/json'}});
   if(saved)return;
  }
  throw Error('库存写入冲突，请重试');
 }
 async function query(env,city) {
  if(!pending.has(city))pending.set(city,(async()=>{
   const data=await collectFn(city);
   await save(env.BUCKET,city,data);
   return data;
  })().finally(()=>pending.delete(city)));
  return pending.get(city);
 }
 const json=(data,status=200,origin)=>new Response(JSON.stringify(data),{status,headers:{...JSON_HEADERS,...(origin===ORIGIN?{'Access-Control-Allow-Origin':ORIGIN,'Vary':'Origin'}:{})}});
 return {
  async scheduled(event,env,ctx){
   for(let i=0;i<cities.length;i+=3)await Promise.all(cities.slice(i,i+3).map(c=>query(env,c.name)));
  },
  async fetch(request,env,ctx){
   const url=new URL(request.url),path=url.pathname,origin=request.headers.get('Origin');
   if(path.startsWith('/api/')) {
    if(origin&&origin!==ORIGIN&&origin!==url.origin)return json({error:'不允许的来源'},403);
    if(request.method==='OPTIONS')return new Response(null,{status:204,headers:{'Access-Control-Allow-Origin':origin||url.origin,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600','Vary':'Origin'}});
    if(path==='/api/cities'&&request.method==='GET')return json({cities},200,origin);
    const city=url.searchParams.get('city')||'杭州';
    if(!cities.some(c=>c.name===city))return json({error:'请选择有效的 Apple Store 城市'},400,origin);
    try {
     if(path==='/api/refresh'&&request.method==='POST')return json({...await query(env,city),mode:'live'},200,origin);
     if(path==='/api/stock'&&request.method==='GET') {
      const saved=env.BUCKET?await env.BUCKET.get('inventory/'+encodeURIComponent(city)+'.json'):null;
      const data=saved?await saved.json():await query(env,city);
      return json({...data,mode:'snapshot'},200,origin);
     }
     return json({error:'接口或请求方式不支持'},404,origin);
    }catch(error){console.error('Inventory service failure',error.message);return json({error:'库存服务暂不可用，请稍后重试'},503,origin);}
   }
   if(path==='/runtime-config.js')return new Response('window.DUO_CONFIG = {};',{headers:{'Content-Type':'text/javascript','Cache-Control':'no-store'}});
   if(path==='/catalog.js')return new Response('window.DUO_CITIES = '+JSON.stringify(cities)+';',{headers:{'Content-Type':'text/javascript','Cache-Control':'no-cache'}});
   if(path==='/'||path==='/index.html')return new Response(html,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache','X-Content-Type-Options':'nosniff'}});
   return new Response('Not found',{status:404});
  }
 };
}
