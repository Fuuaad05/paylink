import {createPublicClient,defineChain,http,formatUnits} from 'viem';
import {TOKEN,RPC,CHAIN,units} from './direct-payment';
import type {Provider} from './wallet';
export const mezoChain=defineChain({id:CHAIN,name:'Mezo Testnet',nativeCurrency:{name:'Bitcoin',symbol:'BTC',decimals:18},rpcUrls:{default:{http:[RPC]}},blockExplorers:{default:{name:'Mezo Explorer',url:'https://explorer.test.mezo.org'}}});
export const musdAbi=[{type:'function',name:'balanceOf',stateMutability:'view',inputs:[{name:'account',type:'address'}],outputs:[{type:'uint256'}]}] as const;
export async function musdBalance(account:string){return createPublicClient({chain:mezoChain,transport:http(RPC,{timeout:10000,retryCount:1})}).readContract({address:TOKEN,abi:musdAbi,functionName:'balanceOf',args:[account as `0x${string}`]});}
export function balanceText(amount:bigint){return formatUnits(amount,18);}
export function checkFunds(balance:bigint,price:string){if(balance<units(price))throw Error('Insufficient test MUSD. You have '+balanceText(balance)+' MUSD; this product costs '+price+' MUSD. Get MUSD on Mezo Testnet, then refresh your balance.');}
export async function ensureMezo(p:Provider){
 try{await p.request({method:'wallet_switchEthereumChain',params:[{chainId:'0x7b7b'}]})}catch(e:any){
  const missing=e.code===4902||e.data?.originalError?.code===4902||/unrecognized chain|unknown chain|chain.*not.*added/i.test(e.message||'');
  if(!missing)throw e;
  await p.request({method:'wallet_addEthereumChain',params:[{chainId:'0x7b7b',chainName:'Mezo Testnet',nativeCurrency:{name:'Bitcoin',symbol:'BTC',decimals:18},rpcUrls:[RPC],blockExplorerUrls:['https://explorer.test.mezo.org']}]});
  await p.request({method:'wallet_switchEthereumChain',params:[{chainId:'0x7b7b'}]});
 }
 const id=await p.request({method:'eth_chainId'});if(Number(BigInt(id))!==CHAIN)throw Error('Select Mezo Testnet in your wallet, then try again.');
}
