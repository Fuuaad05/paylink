'use client';
import {useState} from 'react';
import {Copy,X,ExternalLink} from 'lucide-react';
import type {Product} from '../../lib/types';
import {buttonCode,checkoutUrl} from '../../lib/embed';
export default function EmbedPanel({product,onClose}:{product:Product;onClose:()=>void}){
 const [status,setStatus]=useState('');
 const origin=typeof window==='undefined'?'https://your-paylink-site.vercel.app':window.location.origin;
 const code=buttonCode(origin,product.id),url=checkoutUrl(origin,product.id);
 async function copy(text:string,label:string){try{await navigator.clipboard.writeText(text);setStatus(label+' copied.')}catch{setStatus('Clipboard unavailable. Select and copy the text below.')}}
 return <div className="overlay" onClick={onClose}><section className="modal embed-modal" role="dialog" aria-modal="true" aria-labelledby="embed-title" onClick={e=>e.stopPropagation()}><button className="close" aria-label="Close integration" onClick={onClose}><X/></button><div className="eyebrow">ADD TO YOUR WEBSITE</div><h2 id="embed-title">Your storefront. MUSD checkout.</h2><p>{product.title} · {product.price} MUSD</p><label htmlFor="checkout-url">Checkout link</label><input id="checkout-url" value={url} readOnly onFocus={e=>e.target.select()}/><button className="text-button" onClick={()=>copy(url,'Checkout link')}><Copy size={15}/>Copy checkout link</button><label htmlFor="button-code">HTML button · paste into your website</label><textarea id="button-code" rows={5} readOnly value={code} onFocus={e=>e.target.select()}/><button className="text-button" onClick={()=>copy(code,'Button code')}><Copy size={15}/>Copy button code</button><div className="embed-preview"><span>BUTTON PREVIEW</span><a className="button primary" href={url} target="_blank" rel="noopener noreferrer">Buy with MUSD <ExternalLink size={15}/></a></div><a className="text-button" href={'/storefront?product='+encodeURIComponent(product.id)} target="_blank" rel="noopener noreferrer">Open sample storefront <ExternalLink size={14}/></a><p className="fine">Opens hosted PayLink checkout in a new tab. No script or API key required. After deploying, copy the code again so it uses your public website URL.</p><p role="status">{status}</p></section></div>;
}
