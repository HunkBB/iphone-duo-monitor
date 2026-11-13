import {collect} from '../stock.mjs';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
const current=await collect();
let previous=null;try{previous=JSON.parse(await readFile('public/stock.json','utf8'));}catch{}
let history=[];try{history=JSON.parse(await readFile('public/history.json','utf8'));}catch{}
for(const s of current.stores)for(const p of s.products){
 const old=previous?.stores?.find(x=>x.id===s.id)?.products?.find(x=>x.sku===p.sku);
 if(old&&old.status!==p.status)history.unshift({at:current.checkedAt,city:s.city,store:s.name,capacity:p.capacity,from:old.status,to:p.status});
}
await mkdir('public',{recursive:true});
await writeFile('public/stock.json',JSON.stringify(current,null,2)+'\n');
await writeFile('public/history.json',JSON.stringify(history.slice(0,200),null,2)+'\n');
console.log(JSON.stringify({checkedAt:current.checkedAt,stores:current.stores.length,errors:current.errors}));
