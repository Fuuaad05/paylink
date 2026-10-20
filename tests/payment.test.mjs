import {test} from 'node:test';
import assert from 'node:assert/strict';
import {units,address,transferData,assertPayment,TOKEN,TRANSFER_TOPIC} from '../lib/direct-payment.ts';
const recipient='0x'+'a'.repeat(40),payer='0x'+'b'.repeat(40);
const invoice={id:'12345678-1234-4234-8234-123456789abc',recipient,amount:'25.000001',description:'Design milestone',createdAt:0,txHash:null,payer:null,paidAt:null};
function fixture(){return {tx:{to:TOKEN,from:payer,input:transferData(invoice),blockNumber:'0x64',blockHash:'0x'+'d'.repeat(64)},receipt:{status:'0x1',blockNumber:'0x64',blockHash:'0x'+'d'.repeat(64),logs:[{address:TOKEN,topics:[TRANSFER_TOPIC,'0x'+payer.slice(2).padStart(64,'0'),'0x'+recipient.slice(2).padStart(64,'0')],data:'0x'+units(invoice.amount).toString(16)}]}};}
test('decimal arithmetic keeps full precision',()=>{assert.equal(units('25.000001'),25000001000000000000n);assert.equal(units('0.000001'),1000000000000n)});
test('reject malformed, zero, negative and oversized amounts',()=>{for(const n of ['0','-1','1e3','1.1234567','9999999999','01','NaN'])assert.throws(()=>units(n))});
test('reject zero and malformed wallet addresses',()=>{assert.throws(()=>address('0x'+'0'.repeat(40)));assert.throws(()=>address('someone.eth'))});
test('accept a matching confirmed payment',()=>{const {tx,receipt}=fixture();assert.equal(assertPayment(invoice,tx,receipt,102n),payer)});
test('reject transfer reused for a different invoice',()=>{const {tx,receipt}=fixture();assert.throws(()=>assertPayment({...invoice,id:'22345678-1234-4234-8234-123456789abc'},tx,receipt,102n),/match/)});
test('reject failed and pending transactions',()=>{const {tx,receipt}=fixture();assert.throws(()=>assertPayment(invoice,tx,{...receipt,status:'0x0'},102n),/failed/);assert.throws(()=>assertPayment(invoice,{...tx,blockNumber:null},receipt,102n),/confirmed/)});
test('wait for three confirmations',()=>{const {tx,receipt}=fixture();assert.throws(()=>assertPayment(invoice,tx,receipt,101n),/confirmations/)});
test('reject wrong token and mismatched transaction block',()=>{const {tx,receipt}=fixture();assert.throws(()=>assertPayment(invoice,{...tx,to:recipient},receipt,102n),/match/);assert.throws(()=>assertPayment(invoice,tx,{...receipt,blockHash:'0xBAD'},102n),/current chain/)});
test('reject wrong transfer log token, recipient, amount and sender',()=>{for(const field of ['token','recipient','amount','sender']){const {tx,receipt}=fixture();const log=receipt.logs[0];if(field==='token')log.address=recipient;if(field==='recipient')log.topics[2]='0x'+'c'.repeat(64);if(field==='amount')log.data='0x1';if(field==='sender')log.topics[1]='0x'+'c'.repeat(64);assert.throws(()=>assertPayment(invoice,tx,receipt,102n),/matching MUSD/);}});
test('reject untagged ordinary transfer',()=>{const {tx,receipt}=fixture();tx.input=tx.input.slice(0,-64);assert.throws(()=>assertPayment(invoice,tx,receipt,102n),/match/)});
