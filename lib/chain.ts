import {TOKEN,CHAIN,TRANSFER_TOPIC,units} from './direct-payment';
import {HttpError} from './server';
export async function rpc(method:string,params:unknown[]=[]):Promise<any>{const r=await fetch(process.env.MEZO_RPC_URL||'https://rpc.test.mezo.org',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params}),signal:AbortSignal.timeout(12000),cache:'no-store'});if(!r.ok)throw new HttpError(503,'Mezo is unavailable. Retry shortly.');const d=await r.json();if(d.error)throw new HttpError(503,'Could not query Mezo. Retry shortly.');return d.result}
export function assertSettlement(receipt:any,tx:any,head:bigint,payer:string,recipient:string,amount:string,signature?:string){
 if(!receipt||!tx||receipt.status!=='0x1'||!receipt.blockHash||receipt.blockHash!==tx.blockHash)throw new HttpError(409,'Transaction has not settled successfully.');
 if(head-BigInt(receipt.blockNumber)<2n)throw new HttpError(409,'Waiting for 3 confirmations. Refresh shortly.');
 if(signature&&!tx.input.toLowerCase().includes(signature.slice(2).toLowerCase()))throw new HttpError(400,'This transaction does not contain this order’s payment signature.');
 const ok=receipt.logs.some((l:any)=>l.address.toLowerCase()===TOKEN.toLowerCase()&&l.topics.length===3&&l.topics[0].toLowerCase()===TRANSFER_TOPIC&&l.topics[1].slice(-40).toLowerCase()===payer.slice(2).toLowerCase()&&l.topics[2].slice(-40).toLowerCase()===recipient.slice(2).toLowerCase()&&BigInt(l.data)===units(amount));
 if(!ok)throw new HttpError(400,'No matching MUSD transfer was found.');
}
export async function checkSettlement(hash:string,payer:string,recipient:string,amount:string,signature?:string){const [chain,receipt,tx,head]=await Promise.all([rpc('eth_chainId'),rpc('eth_getTransactionReceipt',[hash]),rpc('eth_getTransactionByHash',[hash]),rpc('eth_blockNumber')]);if(Number(BigInt(chain))!==CHAIN)throw new HttpError(503,'Incorrect RPC network.');assertSettlement(receipt,tx,BigInt(head),payer,recipient,amount,signature)}
