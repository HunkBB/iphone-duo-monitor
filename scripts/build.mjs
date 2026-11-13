import {readFile,mkdir,writeFile,cp} from 'node:fs/promises';
const html=await readFile('public/index.html','utf8');
const stock=await readFile('stock.mjs','utf8');
await mkdir('dist/server',{recursive:true});
await mkdir('dist/.openai',{recursive:true});
await cp('.openai/hosting.json','dist/.openai/hosting.json');
await writeFile('dist/server/index.js',stock+`\nconst HTML=${JSON.stringify(html)};\n`+await readFile('worker.mjs','utf8'));
