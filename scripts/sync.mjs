import {readFile, writeFile, mkdir, rename} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
import {lookup} from 'node:dns/promises';
import https from 'node:https';
import {isIP} from 'node:net';
import {validateConfig, normalizeSource, fromRelease, mergeApps} from '../lib/catalog.mjs';
export function publicAddress(ip) {
  if (isIP(ip) !== 4) return false; // Conservative IPv4-only outbound metadata transport.
  const [a,b] = ip.split('.').map(Number);
  return !(a===0 || a===10 || a===127 || a>=224 || (a===169&&b===254) || (a===172&&b>=16&&b<=31) || (a===192&&b===168) || (a===100&&b>=64&&b<=127) || (a===198&&(b===18||b===19)));
}
export async function fetchJSON(value, redirects = 0) {
  const u = new URL(value);
  if(u.protocol!=='https:' || u.username || u.password || (u.port && u.port!=='443')) throw Error('يسمح فقط بروابط HTTPS العامة');
  const addresses = await lookup(u.hostname,{all:true, family:4});
  if(!addresses.length || addresses.some(a=>!publicAddress(a.address))) throw Error('عنوان مصدر غير عام');
  return new Promise((resolve,reject)=>{
    const headers = {'User-Agent':'Riwaq-iOS-Store','Accept':'application/json'};
    if(u.hostname==='api.github.com' && process.env.GITHUB_TOKEN) headers.Authorization='Bearer '+process.env.GITHUB_TOKEN;
    const req = https.get(u,{headers,lookup:(_host,opts,cb)=> opts.all ? cb(null,[addresses[0]]) : cb(null,addresses[0].address,4)}, res=>{
      if([301,302,303,307,308].includes(res.statusCode)) {
        res.resume(); if(redirects>=3 || !res.headers.location) return reject(Error('تحويلات مصدر كثيرة'));
        resolve(fetchJSON(new URL(res.headers.location,u).href,redirects+1)); return;
      }
      if(res.statusCode!==200){res.resume();reject(Error('HTTP '+res.statusCode));return;}
      const parts=[]; let size=0;
      res.on('data',chunk=>{size+=chunk.length;if(size>5_000_000){res.destroy();reject(Error('ملف المصدر أكبر من الحد المسموح'));}else parts.push(chunk);});
      res.on('error',reject); res.on('end',()=>{try{resolve(JSON.parse(Buffer.concat(parts).toString('utf8')));}catch{reject(Error('JSON غير صالح'));}});
    });
    const timer=setTimeout(()=>req.destroy(Error('انتهت مهلة المصدر')),20000);
    req.on('close',()=>clearTimeout(timer));req.on('error',reject);
  });
}
export async function collect(config, fetcher=fetchJSON, now=new Date().toISOString()) {
  validateConfig(config); const apps=[];const sources=[];
  for(const source of config.sources){
    try{
      const url=source.type==='github' ? 'https://api.github.com/repos/'+new URL(source.url).pathname.slice(1).replace(/\/$/,'')+'/releases/latest' : source.url;
      const data=await fetcher(url);const entries=source.type==='github'?fromRelease(data,source):normalizeSource(data,source);
      apps.push(...entries);sources.push({id:source.id,name:source.name||source.id,status:'ok',count:entries.length,checkedAt:now});
    }catch(e){sources.push({id:source.id,name:source.name||source.id,status:'error',count:0,error:e.message,checkedAt:now});}
  }
  return {name:config.name,identifier:config.identifier||'com.riwaq.store',subtitle:'تطبيقات من مصادر مصرح بها',generatedAt:now,apps:mergeApps(apps),sources};
}
export async function sync() {
  const config=JSON.parse(await readFile(new URL('../config/sources.json',import.meta.url),'utf8'));
  const catalog=await collect(config);const dir=new URL('../public/data/',import.meta.url);await mkdir(dir,{recursive:true});
  await writeFile(new URL('catalog.json.tmp',dir),JSON.stringify(catalog,null,2));await rename(new URL('catalog.json.tmp',dir),new URL('catalog.json',dir));
  // Export only authorized metadata. No demo records, tokens, IPA bytes or permission notes.
  await writeFile(new URL('source.json',dir),JSON.stringify({name:catalog.name,identifier:catalog.identifier,apps:catalog.apps},null,2));
  console.log(`${catalog.apps.length} apps; ${catalog.sources.filter(s=>s.status==='error').length} source errors`);
  return catalog;
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) await sync();
