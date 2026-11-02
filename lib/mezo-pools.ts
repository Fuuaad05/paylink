import {createPublicClient,createWalletClient,custom,formatUnits,parseUnits} from 'viem';
import {TOKEN,CHAIN} from './direct-payment';
import {mezoChain,ensureMezo} from './checkout';
import {assertWalletAccount,type Provider} from './wallet';
import {routerAbi,poolAbi,btcAbi} from './mezo-pools-abi';

export const POOLS={router:'0x9a1ff7FE3a0F69959A3fBa1F1e5ee18e1A9CD7E9',factory:'0x4947243CC818b627A5D06d14C4eCe7398A23Ce1A',pool:'0xd16A5Df82120ED8D626a1a15232bFcE2366d6AA9',btc:'0x7b7c000000000000000000000000000000000000'} as const;
export const swapRoute=[{from:POOLS.btc,to:TOKEN,stable:false,factory:POOLS.factory}] as const;
export type FundingQuote={amountIn:string;expectedOut:string;minimumOut:string;slippageBps:number;quotedAt:number;blockNumber:string};
export function btcUnits(value:string){if(!/^(0|[1-9]\d{0,5})(\.\d{1,18})?$/.test(value))throw Error('Enter a test BTC amount with up to 18 decimal places.');const n=parseUnits(value,18);if(n<=0n)throw Error('Enter an amount greater than zero.');return n;}
export function minimumOutput(value:bigint,bps:number){if(![50,100].includes(bps))throw Error('Choose 0.5% or 1% slippage.');if(value<=0n)throw Error('The pool returned no MUSD.');return value*BigInt(10000-bps)/10000n;}
export function assertFreshQuote(q:FundingQuote,now=Date.now()){if(!Number.isSafeInteger(q.quotedAt)||!Number.isSafeInteger(now)||now<q.quotedAt||now-q.quotedAt>30000)throw Error('Quote expired. Get a fresh quote before swapping.');if(BigInt(q.minimumOut)!==minimumOutput(BigInt(q.expectedOut),q.slippageBps)||BigInt(q.minimumOut)<=0n)throw Error('Invalid swap quote.');btcUnits(formatUnits(BigInt(q.amountIn),18));}
const equal=(a:string,b:string)=>a.toLowerCase()===b.toLowerCase();
export async function quoteFunding(p:Provider,account:string,input:string,bps:number):Promise<FundingQuote>{
 await assertWalletAccount(p,account);const c=createPublicClient({chain:mezoChain,transport:custom(p)});
 if(await c.getChainId()!==CHAIN)throw Error('Switch to Mezo Testnet before quoting.');
 const blockNumber=await c.getBlockNumber();const amountIn=btcUnits(input);
 const [code,factory,pool,token0,token1,poolFactory,stable,reserves]=await Promise.all([
  c.getCode({address:POOLS.router,blockNumber}),c.readContract({address:POOLS.router,abi:routerAbi,functionName:'defaultFactory',blockNumber}),
  c.readContract({address:POOLS.router,abi:routerAbi,functionName:'poolFor',args:[POOLS.btc,TOKEN,false,POOLS.factory],blockNumber}),
  c.readContract({address:POOLS.pool,abi:poolAbi,functionName:'token0',blockNumber}),c.readContract({address:POOLS.pool,abi:poolAbi,functionName:'token1',blockNumber}),
  c.readContract({address:POOLS.pool,abi:poolAbi,functionName:'factory',blockNumber}),c.readContract({address:POOLS.pool,abi:poolAbi,functionName:'stable',blockNumber}),
  c.readContract({address:POOLS.pool,abi:poolAbi,functionName:'getReserves',blockNumber})]);
 if(!code||code==='0x'||!equal(factory,POOLS.factory)||!equal(pool,POOLS.pool)||!equal(poolFactory,POOLS.factory)||stable||!([token0,token1].some(x=>equal(x,TOKEN))&&[token0,token1].some(x=>equal(x,POOLS.btc))))throw Error('Mezo pool configuration could not be verified. Swap is unavailable.');
 if(reserves[0]===0n||reserves[1]===0n)throw Error('The testnet pool has no liquidity. No swap is available.');
 const amounts=await c.readContract({address:POOLS.router,abi:routerAbi,functionName:'getAmountsOut',args:[amountIn,[...swapRoute]],blockNumber});
 const minimumOut=minimumOutput(amounts[1],bps);if(minimumOut===0n)throw Error('Amount is too small for a safe swap.');
 return {amountIn:amountIn.toString(),expectedOut:amounts[1].toString(),minimumOut:minimumOut.toString(),slippageBps:bps,quotedAt:Date.now(),blockNumber:blockNumber.toString()};
}
export async function executeFunding(p:Provider,account:string,q:FundingQuote,onStage:(s:string)=>void,onSubmitted:(hash:`0x${string}`)=>void){
 assertFreshQuote(q);await ensureMezo(p);const owner=await assertWalletAccount(p,account);
 const c=createPublicClient({chain:mezoChain,transport:custom(p)}),w=createWalletClient({account:owner,chain:mezoChain,transport:custom(p)});
 // Re-check the live pool. Never silently change the reviewed input or minimum output.
 const fresh=await quoteFunding(p,account,formatUnits(BigInt(q.amountIn),18),q.slippageBps);
 if(BigInt(fresh.expectedOut)<BigInt(q.minimumOut))throw Error('The price moved beyond your minimum. Review a fresh quote.');
 const amountIn=BigInt(q.amountIn),native=await c.getBalance({address:owner});
 const reserve=10n**12n;if(native<=amountIn+reserve)throw Error('Leave test BTC for approval and swap gas; use a smaller amount.');
 const allowance=await c.readContract({address:POOLS.btc,abi:btcAbi,functionName:'allowance',args:[owner,POOLS.router]});
 async function approve(value:bigint){await assertWalletAccount(p,account);if(await c.getChainId()!==CHAIN)throw Error('Wallet network changed.');onStage('Approve test BTC in your wallet');const {request}=await c.simulateContract({account:owner,address:POOLS.btc,abi:btcAbi,functionName:'approve',args:[POOLS.router,value]});const hash=await w.writeContract(request);const receipt=await c.waitForTransactionReceipt({hash,confirmations:3,timeout:120000});if(receipt.status!=='success')throw Error('BTC approval failed.');}
 if(allowance<amountIn){if(allowance>0n)await approve(0n);await approve(amountIn);}
 await assertWalletAccount(p,account);if(await c.getChainId()!==CHAIN)throw Error('Wallet network changed.');
 const block=await c.getBlock();const args=[amountIn,BigInt(q.minimumOut),[...swapRoute],owner,block.timestamp+180n] as const;
 const gas=await c.estimateContractGas({account:owner,address:POOLS.router,abi:routerAbi,functionName:'swapExactTokensForTokens',args});
 const gasPrice=await c.getGasPrice();if(await c.getBalance({address:owner})<amountIn+gas*gasPrice*2n)throw Error('Insufficient test BTC left for swap gas. Reduce the swap amount.');
 const {request}=await c.simulateContract({account:owner,address:POOLS.router,abi:routerAbi,functionName:'swapExactTokensForTokens',args});
 onStage('Confirm the swap in your wallet');const hash=await w.writeContract(request);onSubmitted(hash);onStage('Waiting for swap confirmations');
 const receipt=await c.waitForTransactionReceipt({hash,confirmations:3,timeout:120000});if(receipt.status!=='success')throw Error('Swap reverted. No MUSD was purchased.');return hash;
}
