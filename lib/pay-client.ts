import {createPublicClient,createWalletClient,custom,http} from 'viem';
import {x402Client,x402HTTPClient} from '@x402/core/client';
import {ExactEvmScheme} from '@x402/evm/exact/client';
import {browserDb} from './browser';
import {activeWallet,assertWalletAccount} from './wallet';
import {checkFunds,ensureMezo,mezoChain,musdBalance} from './checkout';
export async function buyCreatorPlan(address:string,stage:(s:string)=>void){
 const token=(await browserDb().auth.getSession()).data.session?.access_token;if(!token)throw Error('Sign in first.');
 const send=(extra:Record<string,string>={})=>fetch('/api/creator-plan',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token,...extra},body:'{}'});
 const initial=await send();if(initial.status!==402){const data=await initial.json();if(!initial.ok)throw Error(data.error||'Could not prepare plan.');return data;}
 const p=await activeWallet();await ensureMezo(p);const account=await assertWalletAccount(p,address);checkFunds(await musdBalance(account),'3');
 const wallet=createWalletClient({account,chain:mezoChain,transport:custom(p)}),publicClient=createPublicClient({chain:mezoChain,transport:http()});
 const signer={address:account,signTypedData:async(args:any)=>{await assertWalletAccount(p,address);return wallet.signTypedData({...args,account});},readContract:(args:any)=>publicClient.readContract(args)};
 const client=x402Client.fromConfig({schemes:[{network:'eip155:31611',client:new ExactEvmScheme(signer)}],spendControls:{maxAmountPerPayment:'$3'}}),h=new x402HTTPClient(client);
 const required=h.getPaymentRequiredResponse(name=>initial.headers.get(name),await initial.json());stage('Approve 3 test MUSD in your wallet');const payload=await h.createPaymentPayload(required);
 await assertWalletAccount(p,address);stage('Confirming creator plan');const response=await send(h.encodePaymentSignatureHeader(payload));const data=await response.json();if(!response.ok)throw Error(data.error||'Recover the existing plan payment before paying again.');return data;
}
