'use client';
import {useEffect,useState} from 'react';
import {rabby} from '../../lib/browser';
import {balanceText,ensureMezo,musdBalance} from '../../lib/checkout';
import {units} from '../../lib/direct-payment';
export default function CheckoutReadiness({address,price}:{address:string;price:string}){
 const [balance,setBalance]=useState<bigint|null>(null),[chain,setChain]=useState<number|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(false),[tick,setTick]=useState(0);
 useEffect(()=>{let active=true;setLoading(true);setError('');setBalance(null);setChain(null);
 async function read(){const p=await rabby();const [id,accounts]=await Promise.all([p.request({method:'eth_chainId'}),p.request({method:'eth_accounts'})]);if(!accounts[0]||accounts[0].toLowerCase()!==address.toLowerCase())throw Error('Wallet account changed. Sign in again with the selected account.');if(active)setChain(Number(BigInt(id)));const value=await musdBalance(address);if(active)setBalance(value);}
 read().catch(e=>{if(active)setError(e.message)}).finally(()=>{if(active)setLoading(false)});
 let provider:any;const changed=()=>setTick(n=>n+1);rabby().then(p=>{if(!active)return;provider=p;p.on?.('chainChanged',changed)}).catch(()=>{});
 return()=>{active=false;provider?.removeListener?.('chainChanged',changed)};
 },[address,tick]);
 async function switchNetwork(){setLoading(true);setError('');try{await ensureMezo(await rabby());setTick(n=>n+1)}catch(e:any){setError(e.code===4001?'Network change cancelled.':e.message)}finally{setLoading(false)}}
 const low=balance!==null&&balance<units(price);
 return <section className="readiness" aria-label="Payment readiness" aria-busy={loading}><div><span>Wallet network</span><b>{chain===null?'Checking…':chain===31611?'Mezo Testnet':'Switch required'}</b></div><div><span>Test MUSD balance</span><b>{loading?'Checking…':balance===null?'Unavailable':balanceText(balance)+' MUSD'}</b></div><div><span>Required</span><b>{price} MUSD</b></div>{error&&<p role="alert">{error}</p>}{low&&<p role="status">You need more test MUSD before purchasing. Test BTC and MEZO are different assets.</p>}<div className="readiness-actions">{chain!==31611&&<button className="text-button" disabled={loading} onClick={switchNetwork}>Add / switch to Mezo Testnet</button>}<button className="text-button" disabled={loading} onClick={()=>setTick(n=>n+1)}>Refresh balance</button><a href="https://testnet.mezo.org" target="_blank" rel="noreferrer">Get test MUSD ↗</a></div><small>Balance is read on Mezo Testnet. Payment settlement uses the facilitator; acquiring MUSD may require test BTC.</small></section>;
}
