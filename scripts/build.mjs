import {cp,mkdir,rm} from 'node:fs/promises';
const out=new URL('../dist/',import.meta.url);
await cp(new URL('../lib/catalog.mjs',import.meta.url),new URL('../public/catalog.mjs',import.meta.url));
await rm(out,{recursive:true,force:true});await mkdir(out,{recursive:true});
await cp(new URL('../public/',import.meta.url),out,{recursive:true});
console.log('Built static site in dist/');
