import {test} from 'node:test';
import assert from 'node:assert/strict';
import {assertSettlement} from '../lib/chain.ts';
import {TOKEN,TRANSFER_TOPIC,units} from '../lib/direct-payment.ts';
const payer='0x'+'a'.repeat(40),recipient='0x'+'b'.repeat(40),signature='0x'+'c'.repeat(130);
function fixture(){return {tx:{blockHash:'0x123',input:'0x1234'+signature.slice(2)+'abcd'},receipt:{status:'0x1',blockHash:'0x123',blockNumber:'0x64',logs:[{address:TOKEN,topics:[TRANSFER_TOPIC,'0x'+payer.slice(2).padStart(64,'0'),'0x'+recipient.slice(2).padStart(64,'0')],data:'0x'+units('2.5').toString(16)}]}}}
test('accept confirmed x402 settlement bound to saved signature',()=>{const {receipt,tx}=fixture();assert.doesNotThrow(()=>assertSettlement(receipt,tx,102n,payer,recipient,'2.5',signature))});
test('reject another order’s settlement signature',()=>{const {receipt,tx}=fixture();assert.throws(()=>assertSettlement(receipt,tx,102n,payer,recipient,'2.5','0x'+'d'.repeat(130)),/signature/)});
test('reject insufficient confirmations',()=>{const {receipt,tx}=fixture();assert.throws(()=>assertSettlement(receipt,tx,101n,payer,recipient,'2.5',signature),/confirmations/)});
test('reject fake token, wrong amount and wrong recipient',()=>{for(const field of ['token','amount','recipient']){const {receipt,tx}=fixture();if(field==='token')receipt.logs[0].address=payer;if(field==='amount')receipt.logs[0].data='0x1';if(field==='recipient')receipt.logs[0].topics[2]='0x'+'0'.repeat(64);assert.throws(()=>assertSettlement(receipt,tx,102n,payer,recipient,'2.5',signature),/matching MUSD/)}});
test('reject failed transaction or block mismatch',()=>{for(const field of ['status','blockHash']){const {receipt,tx}=fixture();receipt[field]='0x0';assert.throws(()=>assertSettlement(receipt,tx,102n,payer,recipient,'2.5',signature),/settled/)}});
test('reject a different payer',()=>{const {receipt,tx}=fixture();assert.throws(()=>assertSettlement(receipt,tx,102n,recipient,recipient,'2.5',signature),/matching MUSD/)});
