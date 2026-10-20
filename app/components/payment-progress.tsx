'use client';
import {useEffect,useRef,useState} from 'react';
import {api} from '../../lib/browser';
import {confirmationDelay,pollConfirmation} from '../../lib/confirmation';
export default function PaymentProgress({orderId,onPaid}:{orderId:string;onPaid:()=>void}){
 const [status,setStatus]=useState('Checking blockchain confirmations…'),[retry,setRetry]=useState(0);const callback=useRef(onPaid);callback.current=onPaid;
 useEffect(()=>{const abort=new AbortController();setStatus('Checking blockchain confirmations…');pollConfirmation(()=>api('/api/orders/reconcile',{orderId},undefined,abort.signal).then(()=>{}),confirmationDelay,abort.signal).then(result=>{if(abort.signal.aborted)return;if(result==='paid'){setStatus('Payment confirmed. Loading your download…');callback.current()}else if(result==='timeout')setStatus('Payment is still awaiting confirmation. You can check again; your existing order is saved.');}).catch(()=>{if(!abort.signal.aborted)setStatus('Automatic checking paused. Use Verify payment to check your saved order.');});return()=>abort.abort()},[orderId,retry]);
 return <div className="payment-progress" role="status"><strong>Payment submitted</strong><p>{status}</p><span>Saved order → Confirmations → Download</span><button className="text-button" onClick={()=>setRetry(n=>n+1)}>Check again</button></div>;
}
