import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {collect,CITIES} from '../stock.mjs';
import {createBackend} from '../backend.mjs';
const handler=createBackend({collectFn:city=>collect(fetch,city),cities:CITIES,html:await readFile('public/index.html','utf8')});
http.createServer(async(req,res)=>{
 try{
  const request=new Request('http://127.0.0.1:8787'+req.url,{method:req.method,headers:req.headers});
  const result=await handler.fetch(request,{},{});
  res.writeHead(result.status,Object.fromEntries(result.headers));res.end(Buffer.from(await result.arrayBuffer()));
 }catch{res.statusCode=500;res.end('Service unavailable');}
}).listen(8787,'127.0.0.1',()=>console.log('http://127.0.0.1:8787'));
