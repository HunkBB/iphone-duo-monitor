// stock.mjs and HTML are prepended by the dependency-free build.
let snapshot=null, pending=null;
export default {async fetch(request,env,ctx){
 const path=new URL(request.url).pathname;
 if(path==='/api/stock'){
  const key=new Request(new URL('/api/stock',request.url));
  const cache=globalThis.caches?.default;
  const hit=cache?await cache.match(key):null;
  if(hit)return hit;
  if(!snapshot||Date.now()-Date.parse(snapshot.checkedAt)>=60000){
   if(!pending)pending=collect().then(x=>snapshot=x).finally(()=>pending=null);
   await pending;
  }
  const response=Response.json(snapshot,{headers:{'Cache-Control':'public, max-age=60','X-Content-Type-Options':'nosniff'}});
  if(cache&&ctx)ctx.waitUntil(cache.put(key,response.clone()));
  return response;
 }
 if(path!=='/'&&path!=='/index.html')return new Response('Not found',{status:404});
 return new Response(HTML,{headers:{'Content-Type':'text/html; charset=utf-8','X-Content-Type-Options':'nosniff','Referrer-Policy':'strict-origin-when-cross-origin'}});
}};
