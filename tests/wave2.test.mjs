import {test} from 'node:test';
import assert from 'node:assert/strict';
import {minimumOutput,btcUnits,assertFreshQuote,quoteFunding,POOLS} from '../lib/mezo-pools.ts';
import {productLimit,assertCanPublish,planRecipient} from '../lib/creator-plan.ts';
import {claimPayment} from '../lib/payment-claims.ts';
import {GET,POST} from '../app/api/creator-plan/route.ts';
import {POST as recover} from '../app/api/creator-plan/reconcile/route.ts';
import {encodeFunctionData,decodeFunctionData,encodeFunctionResult,toHex} from 'viem';
import {routerAbi,poolAbi} from '../lib/mezo-pools-abi.ts';
import {TOKEN} from '../lib/direct-payment.ts';

test('slippage and BTC input are exact, bounded, and reject zero or exponents',()=>{
 assert.equal(btcUnits('0.00000001'),10000000000n);assert.equal(minimumOutput(20000000000000000000n,50),19900000000000000000n);
 for(const x of ['0','-1','1e-4','.1','0.0000000000000000001'])assert.throws(()=>btcUnits(x));
 for(const x of [-1,0,101,10000])assert.throws(()=>minimumOutput(1n,x));assert.throws(()=>minimumOutput(0n,50));
});
test('stale, future and altered quote minimums cannot be used',()=>{
 const q={amountIn:'1000000000',expectedOut:'10000',minimumOut:'9950',slippageBps:50,quotedAt:1000,blockNumber:'10'};
 assert.doesNotThrow(()=>assertFreshQuote(q,31000));assert.throws(()=>assertFreshQuote(q,31001),/expired/);assert.throws(()=>assertFreshQuote(q,999),/expired/);assert.throws(()=>assertFreshQuote({...q,minimumOut:'1'},1000),/Invalid/);
});
test('pool ABI encodes BTC through ERC20 route, never a payable ETH swap',()=>{
 const data=encodeFunctionData({abi:routerAbi,functionName:'swapExactTokensForTokens',args:[1n,2n,[{from:POOLS.btc,to:TOKEN,stable:false,factory:POOLS.factory}],TOKEN,1000n]});
 const decoded=decodeFunctionData({abi:routerAbi,data});assert.equal(decoded.functionName,'swapExactTokensForTokens');assert.equal(decoded.args[2][0].from.toLowerCase(),POOLS.btc.toLowerCase());
 assert.equal(routerAbi.find(x=>x.name==='swapExactTokensForTokens').stateMutability,'nonpayable');
});
test('quote checks reject the wrong network without attempting a contract write',async()=>{
 let writes=0;await assert.rejects(()=>quoteFunding({request:async({method})=>{if(method==='eth_accounts')return [TOKEN];if(method==='eth_chainId')return '0x1';writes++;throw Error('unexpected');}},TOKEN,'0.001',50),/Mezo Testnet/);assert.equal(writes,0);
});
test('creator quota expiry preserves free tier and rejects over-limit publishing',()=>{
 assert.equal(productLimit(null),3);assert.equal(productLimit('2030-01-01',0),25);assert.equal(productLimit('2020-01-01',Date.parse('2021-01-01')),3);
 assert.doesNotThrow(()=>assertCanPublish(2,null));assert.throws(()=>assertCanPublish(3,null));assert.throws(()=>assertCanPublish(25,'2030-01-01',0));
});
test('treasury is disabled by default and refuses zero/invalid recipients',()=>{
 const old=process.env.PAYLINK_TREASURY_ADDRESS;try{delete process.env.PAYLINK_TREASURY_ADDRESS;assert.equal(planRecipient(),null);process.env.PAYLINK_TREASURY_ADDRESS='0x'+'0'.repeat(40);assert.equal(planRecipient(),null);process.env.PAYLINK_TREASURY_ADDRESS=TOKEN;assert.equal(planRecipient(),TOKEN.toLowerCase());}finally{if(old===undefined)delete process.env.PAYLINK_TREASURY_ADDRESS;else process.env.PAYLINK_TREASURY_ADDRESS=old;}
});
test('plan reads, settlement and recovery all require authenticated ownership',async()=>{
 for(const fn of [GET,POST,recover]){const r=await fn(new Request('https://example.com/api/creator-plan',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'}));assert.equal(r.status,401);}
});
test('one authorization or receipt cannot purchase both a product and a creator plan',async()=>{
 const rows=new Map();const db={from:()=>({upsert:async v=>{if(!rows.has(v.id))rows.set(v.id,v);return {error:null}},select:()=>({eq:(_k,id)=>({single:async()=>({data:rows.get(id),error:null})})})})};
 await claimPayment(db,'payment_receipts','0xABC','product','one');await claimPayment(db,'payment_receipts','0xABC','product','one');
 await assert.rejects(()=>claimPayment(db,'payment_receipts','0xABC','creator_plan','two'),/another order/);
});

function poolProvider(mode='valid'){
 const calls=[];const provider={request:async({method,params})=>{
  calls.push(method);if(method==='eth_accounts')return [TOKEN];if(method==='eth_chainId')return '0x7b7b';if(method==='eth_blockNumber')return '0x64';if(method==='eth_getCode')return '0x6001';
  if(method==='eth_call'){
   const target=params[0].to.toLowerCase();const abi=target===POOLS.router.toLowerCase()?routerAbi:poolAbi;
   const {functionName}=decodeFunctionData({abi,data:params[0].data});let result;
   switch(functionName){case 'defaultFactory':result=mode==='factory'?TOKEN:POOLS.factory;break;case 'poolFor':result=POOLS.pool;break;case 'factory':result=POOLS.factory;break;case 'token0':result=mode==='token'?POOLS.router:TOKEN;break;case 'token1':result=POOLS.btc;break;case 'stable':result=false;break;case 'getReserves':result=[mode==='empty'?0n:100n,100n,1n];break;case 'getAmountsOut':result=[100000000000000n,2000000000000000000n];break;default:throw Error(functionName);}
   return encodeFunctionResult({abi,functionName,result});
  }throw Error('Unexpected write '+method);
 }};return {provider,calls};
}
test('live quote validation accepts a matching liquid deployment without writes',async()=>{
 const {provider,calls}=poolProvider();const q=await quoteFunding(provider,TOKEN,'0.0001',50);assert.equal(q.expectedOut,'2000000000000000000');assert.equal(q.minimumOut,'1990000000000000000');assert.ok(calls.every(x=>['eth_accounts','eth_chainId','eth_blockNumber','eth_getCode','eth_call'].includes(x)));
});
test('wrong factory, fake token and empty liquidity cannot produce a signable quote',async()=>{
 for(const mode of ['factory','token','empty']){const {provider}=poolProvider(mode);await assert.rejects(()=>quoteFunding(provider,TOKEN,'0.0001',50),mode==='empty'?/liquidity/:/configuration/);}
});
