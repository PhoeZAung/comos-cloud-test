import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createStaticHandler} from '../backend/http/static.mjs';

test('only content-hashed public sheet chunks are cacheable',async()=>{
 const root=await mkdtemp(path.join(tmpdir(),'cosmos-static-cache-'));
 try{
  await mkdir(path.join(root,'assets','sheet-chunks'),{recursive:true});
  await writeFile(path.join(root,'auth-headers.json'),JSON.stringify({'Content-Security-Policy':"default-src 'none'"}));
  for(const filename of ['sheet-ABC12345.mjs','sheet-unhashed.mjs'])
   await writeFile(path.join(root,'assets','sheet-chunks',filename),'export const ready=true;\n');
  await writeFile(path.join(root,'assets','sheet-entry.mjs'),'export const ready=true;\n');
  await writeFile(path.join(root,'sheet.html'),'<html></html>');
  const handler=await createStaticHandler(root);
  async function get(url){
   const response={headers:{},status:null,body:null,
    setHeader(name,value){this.headers[name]=value;},
    writeHead(status,headers){this.status=status;Object.assign(this.headers,headers);return this;},
    end(body){this.body=body;return this;}};
   await handler({url,method:'GET'},response);
   return response;
  }
  const hashed=await get('/assets/sheet-chunks/sheet-ABC12345.mjs');
  assert.equal(hashed.status,200);
  assert.equal(hashed.headers['Cache-Control'],'public, max-age=31536000, immutable');
  assert.equal(hashed.headers['Content-Type'],'text/javascript; charset=utf-8');
  const missing=await get('/assets/sheet-chunks/sheet-NOFILE12.mjs');
  assert.equal(missing.status,404);
  assert.equal(missing.headers['Cache-Control'],'no-store','missing chunks must never be cached');
  for(const asset of ['/assets/sheet-chunks/sheet-unhashed.mjs','/assets/sheet-entry.mjs','/sheet.html']){
   const res=await get(asset);
   assert.equal(res.status,200);
   assert.equal(res.headers['Cache-Control'],'no-store',asset);
  }
 }finally{await rm(root,{recursive:true,force:true});}
});
