'use client';
import {useEffect,useRef,useState} from 'react';
import {createPublicClient,custom,formatUnits} from 'viem';
import {activeWallet,assertWalletAccount} from '../../lib/wallet';
import {mezoChain,ensureMezo} from '../../lib/checkout';
import {quoteFunding,executeFunding,POOLS,type FundingQuote} from '../../lib/mezo-pools';
import {units,EXPLORER} from '../../lib/direct-payment';
type SavedSwap={hash:`0x${string}`;pending:boolean};
export default function FundingPanel({address,price,balance,onFunded,onBusy,disabled=false}:{address:string;price:string;balance:bigint|null;onFunded:()=>void;onBusy?:(label:string)=>void;disabled?:boolean}){
 const [open,setOpen]=useState(false),[input,setInput]=useState('0.0001'),[bps,setBps]=useState(50),[quote,setQuote]=useState<FundingQuote|null>(null),[busy,setBusy]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState(''),[swap,setSwap]=useState<SavedSwap|null>(null);
 const generation=useRef(0);const key='paylink.swap:31611:'+address.toLowerCase();
 useEffect(()=>{setQuote(null);setSwap(null);setError('');try{const s=JSON.parse(localStorage.getItem(key)||'null');if(s&&/^0x[0-9a-fA-F]{64}$/.test(s.hash)){setSwap(s);if(s.pending)setOpen(true);}}catch{}return()=>{generation.current++;}},[key]);
 function remember(s:SavedSwap){setSwap(s);try{localStorage.setItem(key,JSON.stringify(s))}catch{setMessage('Save the swap transaction hash below before closing this page.');}}
 async function run(label:string,fn:()=>Promise<void>){if(busy||disabled)return;setBusy(label);onBusy?.(label);setError('');setMessage('');try{await fn()}catch(e:any){setError(e.code===4001?'Request cancelled in your wallet.':e.shortMessage||e.message||'Swap unavailable.')}finally{setBusy('');onBusy?.('');}}
 async function getQuote(){const current=++generation.current;await run('Reading Mezo Pools',async()=>{const p=await activeWallet();await ensureMezo(p);const q=await quoteFunding(p,address,input,bps);if(current===generation.current)setQuote(q);});}
 async function swapNow(){if(!quote)return;await run('Preparing swap',async()=>{
  const p=await activeWallet();await executeFunding(p,address,quote,label=>{setBusy(label);onBusy?.(label)},hash=>remember({hash,pending:true}));
  // executeFunding returns only after a successful, confirmed receipt.
  setSwap(s=>{if(s){const done={...s,pending:false};try{localStorage.setItem(key,JSON.stringify(done))}catch{}return done;}return s});
  setQuote(null);setMessage('Swap confirmed. Your MUSD stays in your wallet. Review and pay for the product when ready.');onFunded();
 });}
 async function checkSwap(){if(!swap)return;await run('Checking the existing swap',async()=>{
  const p=await activeWallet();await ensureMezo(p);await assertWalletAccount(p,address);const c=createPublicClient({chain:mezoChain,transport:custom(p)});
  const r=await c.getTransactionReceipt({hash:swap.hash});if(r.status==='reverted'){remember({...swap,pending:false});throw Error('This swap reverted. You can request a new quote.');}
  if(await c.getBlockNumber()-r.blockNumber<2n)throw Error('Waiting for three confirmations. Check this same swap again shortly.');
  remember({...swap,pending:false});setQuote(null);setMessage('Existing swap confirmed. Your balance has been refreshed.');onFunded();
 });}
 const insufficient=balance!==null&&balance<units(price),shortfall=balance===null?0n:units(price)>balance?units(price)-balance:0n;
 const covered=quote&&BigInt(quote.minimumOut)>=shortfall;
 return <section className="funding-panel" aria-label="Get MUSD with Mezo Pools">
  <button className="text-button" onClick={()=>setOpen(v=>!v)} aria-expanded={open} disabled={!!busy||disabled}>{open?'Close swap':'Get MUSD with test BTC'} <span aria-hidden="true">↔</span></button>
  {!open&&insufficient&&<p>Swap into MUSD here, then continue checkout.</p>}
  {open&&<><h3>Test BTC → MUSD</h3><p>Swap through Mezo Pools. This is a separate wallet transaction before purchasing your product. You will spend test BTC, including gas.</p>
   <label htmlFor="funding-btc">Test BTC to swap</label><input id="funding-btc" inputMode="decimal" value={input} disabled={!!busy||disabled||!!swap?.pending} onChange={e=>{generation.current++;setInput(e.target.value);setQuote(null)}}/>
   <label htmlFor="funding-slippage">Maximum slippage</label><select id="funding-slippage" value={bps} disabled={!!busy||disabled||!!swap?.pending} onChange={e=>{generation.current++;setBps(Number(e.target.value));setQuote(null)}}><option value={50}>0.5%</option><option value={100}>1%</option></select>
   {quote&&<div className="funding-quote"><div><span>Estimated MUSD</span><b>{formatUnits(BigInt(quote.expectedOut),18)}</b></div><div><span>Minimum MUSD received</span><b>{formatUnits(BigInt(quote.minimumOut),18)}</b></div><small>Quote valid for 30 seconds. Router and pool are checked against the Mezo Testnet deployment.</small>{!covered&&<p>Increase the swap amount: the minimum output does not cover this product’s MUSD shortfall.</p>}</div>}
   {swap?.pending?<><p role="status">A swap was already submitted. Check its receipt before submitting another swap.</p><button className="button secondary" disabled={!!busy||disabled} onClick={checkSwap}>Check existing swap</button></>:<div className="funding-actions"><button className="button secondary" disabled={!!busy||disabled} onClick={getQuote}>Get quote</button>{quote&&<button className="button primary" disabled={!!busy||disabled||!covered} onClick={swapNow}>Approve &amp; swap test BTC</button>}</div>}
   {busy&&<p role="status">{busy}…</p>}{error&&<p className="funding-error" role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
   {swap&&<a className="receipt-link" href={EXPLORER+'/tx/'+swap.hash} target="_blank" rel="noreferrer">View swap receipt ↗ <code>{swap.hash}</code></a>}
   <small>Funds are sent to your signed-in wallet, never to PayLink. Router: <a href={EXPLORER+'/address/'+POOLS.router} target="_blank" rel="noreferrer">{POOLS.router}</a>. Approvals are limited to your swap amount. If quoting fails, the swap stays unavailable.</small>
  </>}
 </section>;
}
