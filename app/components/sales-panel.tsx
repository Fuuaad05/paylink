'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,ArrowRight,ExternalLink,RefreshCw,ShoppingBag,Wallet} from 'lucide-react';
import {api} from '../../lib/browser';
import type {SalesReport} from '../../lib/sales';

export default function SalesPanel({signedIn,onSignIn}:{signedIn:boolean;onSignIn:()=>Promise<void>}){
  const [report,setReport]=useState<SalesReport|null>(null);
  const [page,setPage]=useState(0),[refresh,setRefresh]=useState(0);
  const [loading,setLoading]=useState(false),[error,setError]=useState('');
  const generation=useRef(0);
  useEffect(()=>{
    const current=++generation.current;
    if(!signedIn){setReport(null);setError('');return;}
    let active=true;setLoading(true);setError('');
    api('/api/sales?page='+page).then((data:SalesReport)=>{
      if(active&&current===generation.current)setReport(data);
    }).catch((e:Error)=>{
      if(active&&current===generation.current){setError(e.message);setReport(null);}
    }).finally(()=>{if(active&&current===generation.current)setLoading(false);});
    return()=>{active=false;};
  },[signedIn,page,refresh]);

  if(!signedIn)return <section className="empty"><Wallet size={29}/><h3>Sign in with your seller wallet.</h3><p>Your sales appear here after a buyer completes a payment.</p><button className="button secondary" onClick={onSignIn}>Connect wallet</button></section>;

  return <section aria-label="Seller sales">
    <div className="sales-summary" aria-busy={loading}>
      <article><span>MUSD received</span><strong>{report?.totalReceived??'—'}<small>MUSD</small></strong><p>Confirmed product sales</p></article>
      <article><span>Paid orders</span><strong>{report?.paidOrders??'—'}</strong><p>Successful payments</p></article>
      <article><span>Products sold</span><strong>{report?.productsSold??'—'}</strong><p>Products with at least one sale</p></article>
    </div>
    <div className="section-title"><h2>Sales history</h2><button className="text-button" onClick={()=>setRefresh(n=>n+1)} disabled={loading}><RefreshCw size={15}/>{loading?'Loading…':'Refresh'}</button></div>
    {error?<div className="notice error" role="alert">{error}</div>:loading&&!report?<div className="empty" role="status">Loading your sales…</div>:report?.sales.length?<>
      <div className="sales-table-wrap"><table className="sales-table"><caption className="sr-only">Confirmed payments for products owned by your signed-in seller account.</caption><thead><tr><th scope="col">PRODUCT</th><th scope="col">RECEIVED</th><th scope="col">BUYER WALLET</th><th scope="col">PAID AT</th><th scope="col">RECEIPT</th></tr></thead><tbody>{report.sales.map(sale=><tr key={sale.id}><td><strong>{sale.product.title}</strong><small>Order {sale.id.slice(0,8)}</small></td><td className="sales-amount">{sale.amount} <span>MUSD</span></td><td><span title={sale.payer}>{sale.payer.slice(0,6)+'…'+sale.payer.slice(-4)}</span></td><td><time dateTime={sale.paid_at}>{new Date(sale.paid_at).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'})}</time></td><td><a href={'https://explorer.test.mezo.org/tx/'+sale.tx_hash} target="_blank" rel="noreferrer" aria-label={'View blockchain receipt for '+sale.product.title}>View <ExternalLink size={13}/></a></td></tr>)}</tbody></table></div>
      <div className="sales-pagination"><span>{report.page*report.pageSize+1}–{report.page*report.pageSize+report.sales.length} of {report.paidOrders} sales</span><div><button className="button secondary" disabled={loading||page===0} onClick={()=>setPage(p=>p-1)}><ArrowLeft size={14}/>Previous</button><button className="button secondary" disabled={loading||!report.hasMore} onClick={()=>setPage(p=>p+1)}>Next<ArrowRight size={14}/></button></div></div>
    </>:report&&page>0?<div className="empty"><h3>No sales on this page.</h3><button className="button secondary" onClick={()=>setPage(0)}>Return to first page</button></div>:report?<div className="empty"><ShoppingBag size={30}/><h3>Your first sale will appear here.</h3><p>Share a product’s checkout link. Once payment is confirmed, refresh this page.</p></div>:null}
    <p className="sales-note">Totals cover confirmed sales recorded by PayLink. Payments go directly to the seller wallet shown at checkout. Times use your device’s timezone.</p>
  </section>;
}
