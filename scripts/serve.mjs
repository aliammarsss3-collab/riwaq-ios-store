import {createServer} from 'node:http';
import {readFile,cp} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve('public');const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml'};
mime['.mjs']='text/javascript; charset=utf-8';
await cp(new URL('../lib/catalog.mjs',import.meta.url),new URL('../public/catalog.mjs',import.meta.url));
createServer(async(req,res)=>{try{
 const path=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(path!==root&&!path.startsWith(root+sep)) {res.writeHead(403);res.end();return;}
 const file=path===root?resolve(root,'index.html'):path;
 res.setHeader('Content-Type',mime[extname(file)]||'application/octet-stream');res.setHeader('X-Content-Type-Options','nosniff');
 res.end(await readFile(file));
}catch{res.writeHead(404);res.end('Not found');}}).listen(4173,'127.0.0.1',()=>console.log('Riwaq: http://127.0.0.1:4173'));
