import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {collect} from '../stock.mjs';
let data, pending;
http.createServer(async(req,res)=>{try{
 if(req.url.split('?')[0]==='/api/stock'){
  if(!data||Date.now()-Date.parse(data.checkedAt)>60000){pending??=collect().then(x=>data=x).finally(()=>pending=null);await pending;}
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify(data));
 }else if(req.url==='/'||req.url==='/index.html'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(await readFile('public/index.html'));}
 else{res.statusCode=404;res.end('Not found');}
}catch{res.statusCode=500;res.end('Service unavailable');}}).listen(8787,'127.0.0.1',()=>console.log('http://127.0.0.1:8787'));
