import {test} from 'node:test';
import assert from 'node:assert/strict';
import {x402Client} from '@x402/core/client';
import {ExactEvmScheme} from '@x402/evm/exact/client';
import {EXTENSIONS} from '../lib/x402.ts';
import {TOKEN,units} from '../lib/direct-payment.ts';
test('first-time MUSD payer gets gas-sponsored permit alongside payment signature',async()=>{
 let signatures=0;
 const payer='0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
 const signer={address:payer,signTypedData:async()=>{signatures++;return '0x'+'11'.repeat(65)},readContract:async()=>0n};
 const client=new x402Client().register('eip155:31611',new ExactEvmScheme(signer));
 const required={x402Version:2,resource:{url:'https://example.com/api/pay',description:'Test purchase',mimeType:'application/json'},accepts:[{scheme:'exact',network:'eip155:31611',asset:TOKEN,amount:units('0.01').toString(),payTo:'0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',maxTimeoutSeconds:300,extra:{name:'Mezo USD',version:'1',assetTransferMethod:'permit2'}}],extensions:EXTENSIONS};
 const payload=await client.createPaymentPayload(required);
 assert.equal(payload.accepted.asset,TOKEN);
 assert.ok(payload.extensions?.eip2612GasSponsoring);
 assert.equal(signatures,2);
});
