import {createPublicClient,http} from 'viem';
import {mezoChain} from '../lib/checkout';
import {POOLS,quoteFunding} from '../lib/mezo-pools';
import {poolAbi} from '../lib/mezo-pools-abi';
const c=createPublicClient({chain:mezoChain,transport:http(process.env.MEZO_RPC_URL||'https://rpc.test.mezo.org',{timeout:12000,retryCount:1})});
// Read-only adapter: this dummy account owns nothing and no signing method is exposed.
const account='0x0000000000000000000000000000000000000001';
try{
 const provider={request:async({method,params}:{method:string;params?:any})=>method==='eth_accounts'?[account]:c.request({method,params} as any)};
 const quote=await quoteFunding(provider,account,'0.0001',50);
 const reserves=await c.readContract({address:POOLS.pool,abi:poolAbi,functionName:'getReserves',blockNumber:BigInt(quote.blockNumber)});
 console.log(JSON.stringify({checkedAt:new Date().toISOString(),kind:'read-only pool check; no swap submitted',chainId:31611,router:POOLS.router,pool:POOLS.pool,factory:POOLS.factory,reserves:reserves.map(String),quote},null,2));
}catch(e){console.error('Live verification did not pass:',(e as Error).message);process.exitCode=1;}
