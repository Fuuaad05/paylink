import {test} from 'node:test';
import assert from 'node:assert/strict';
import {storageDetails,ownPath,fileLabel} from '../lib/product-details.ts';
import {checkoutUrl,buttonCode} from '../lib/embed.ts';
import {checkFunds,ensureMezo} from '../lib/checkout.ts';
import {pollConfirmation} from '../lib/confirmation.ts';
import {PATCH} from '../app/api/products/route.ts';

test('server uses stored file metadata and rejects invalid or oversized uploads',()=>{
 assert.deepEqual(storageDetails({size:2048,contentType:'application/pdf'}),{size:2048,type:'application/pdf'});
 for(const value of [{size:1,contentType:'image/svg+xml'},{size:0,contentType:'image/png'},{size:2097153,contentType:'image/png'},{size:100,contentType:'text/html'}])assert.throws(()=>storageDetails(value,true));
 assert.throws(()=>storageDetails({size:10485761,contentType:'application/pdf'}));
 assert.equal(fileLabel(null,null),'Digital download');assert.equal(fileLabel('application/pdf',2048),'PDF · 2.0 KB');
});
test('product and cover storage ownership rejects other users and traversal',()=>{
 assert.equal(ownPath('seller/a/cover.png','seller'),true);
 for(const path of ['other/a.png','seller/../other/a','seller2/a','seller/\\other'])assert.equal(ownPath(path,'seller'),false);
});
test('existing product presentation changes require authentication',async()=>{
 const result=await PATCH(new Request('http://localhost:3000/api/products',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId:'forged'})}));assert.equal(result.status,401);
});
test('embed preserves a safe hosted checkout URL and opens without opener access',()=>{
 assert.equal(checkoutUrl('https://paylink.example/path','a&b'),'https://paylink.example/?product=a%26b');
 const code=buttonCode('https://paylink.example','abc');assert.match(code,/rel="noopener noreferrer"/);assert.match(code,/href="https:\/\/paylink.example\/\?product=abc"/);assert.doesNotMatch(code,/<script/);assert.throws(()=>checkoutUrl('javascript:alert(1)','x'));
});
test('balance guard accepts exact funds and rejects even one token unit short',()=>{
 assert.doesNotThrow(()=>checkFunds(10n**16n,'0.01'));assert.throws(()=>checkFunds(10n**16n-1n,'0.01'),/Insufficient test MUSD/);assert.throws(()=>checkFunds(0n,'0.01'));
});
test('unknown chain adds Mezo then switches; wallet rejection never adds chain',async()=>{
 const calls=[];let first=true;await ensureMezo({request:async x=>{calls.push(x);if(x.method==='wallet_switchEthereumChain'&&first){first=false;throw Object.assign(Error('Unrecognized chain ID'),{code:-32603});}return x.method==='eth_chainId'?'0x7b7b':null}});
 assert.deepEqual(calls.map(x=>x.method),['wallet_switchEthereumChain','wallet_addEthereumChain','wallet_switchEthereumChain','eth_chainId']);
 let count=0;await assert.rejects(()=>ensureMezo({request:async()=>{count++;throw Object.assign(Error('Rejected'),{code:4001})}}),/Rejected/);assert.equal(count,1);
});
test('confirmation checks stop after success without creating replacement payments',async()=>{
 let checks=0,waits=0;const result=await pollConfirmation(async()=>{if(++checks<3)throw {status:409}},async()=>{waits++},new AbortController().signal,24);assert.equal(result,'paid');assert.equal(checks,3);assert.equal(waits,2);
});
test('confirmation checks are bounded, abortable, and stop on authorization failures',async()=>{
 let calls=0;assert.equal(await pollConfirmation(async()=>{calls++;throw {status:409}},async()=>{},new AbortController().signal,3),'timeout');assert.equal(calls,3);
 const controller=new AbortController();assert.equal(await pollConfirmation(async()=>{throw {status:409}},async()=>{controller.abort()},controller.signal,24),'stopped');
 await assert.rejects(()=>pollConfirmation(async()=>{throw Object.assign(Error('Forbidden'),{status:403})},async()=>{},new AbortController().signal),/Forbidden/);
});
