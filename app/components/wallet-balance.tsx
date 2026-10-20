'use client';
import {useEffect,useState} from 'react';
import {ExternalLink,RefreshCw,Wallet} from 'lucide-react';
import {musdBalance,balanceText} from '../../lib/checkout';

export default function WalletBalance({address}:{address:string}){
  const [amount,setAmount]=useState<bigint|null>(null);
  const [loading,setLoading]=useState(true),[error,setError]=useState('');
  const [refresh,setRefresh]=useState(0),[checkedAt,setCheckedAt]=useState<string|null>(null);
  useEffect(()=>{
    let active=true;
    setLoading(true);setError('');setAmount(null);setCheckedAt(null);
    musdBalance(address).then(value=>{
      if(active){setAmount(value);setCheckedAt(new Date().toISOString());}
    }).catch(()=>{
      if(active)setError('Could not read your balance. Refresh to try again.');
    }).finally(()=>{if(active)setLoading(false);});
    return()=>{active=false;};
  },[address,refresh]);

  return <section className="wallet-balance" aria-label="Wallet balance" aria-busy={loading}>
    <div className="wallet-balance-main">
      <span className="wallet-balance-label"><Wallet size={16}/>Wallet balance <small>Mezo Testnet</small></span>
      <div className="wallet-balance-value" aria-live="polite">{loading?'Checking…':amount===null?'Unavailable':<>{balanceText(amount)} <span>MUSD</span></>}</div>
      <a className="wallet-balance-address" href={'https://explorer.test.mezo.org/address/'+address} target="_blank" rel="noreferrer" title={address}>{address.slice(0,6)+'…'+address.slice(-4)} <ExternalLink size={12}/></a>
    </div>
    <div className="wallet-balance-info">
      <p>Current MUSD held in your signed-in wallet. Sales revenue is tracked separately under Sales.</p>
      {error?<p className="wallet-balance-error" role="alert">{error}</p>:<small>{checkedAt?<time dateTime={checkedAt}>Checked {new Date(checkedAt).toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</time>:'Reading directly from Mezo Testnet.'}</small>}
      <button className="text-button" disabled={loading} onClick={()=>setRefresh(n=>n+1)}><RefreshCw size={14}/>{loading?'Checking balance…':'Refresh balance'}</button>
    </div>
  </section>;
}
