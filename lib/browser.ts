import { createClient } from '@supabase/supabase-js';
let instance:ReturnType<typeof createClient>|undefined;
export function browserDb(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
 if(!url||!key)throw new Error('Connect your Supabase project first. Follow docs/SETUP.md.');
 return instance??=createClient(url,key);
}
export type Provider={request:(args:{method:string;params?:unknown[]})=>Promise<any>;on?:(event:string,fn:(args:any)=>void)=>void;removeListener?:(event:string,fn:(args:any)=>void)=>void;isRabby?:boolean};
export async function rabby():Promise<Provider>{
 const providers:Provider[]=[];
 const listener=(event:Event)=>{const d=(event as CustomEvent).detail; if(d?.provider)providers.push(d.provider)};
 window.addEventListener('eip6963:announceProvider',listener);window.dispatchEvent(new Event('eip6963:requestProvider'));
 await new Promise(resolve=>setTimeout(resolve,200));window.removeEventListener('eip6963:announceProvider',listener);
 const p=providers.find(p=>p.isRabby)||(window as any).rabby||providers[0]||(window as any).ethereum;
 if(!p)throw Error('Open PayLink in a wallet browser, or install the Rabby extension on your laptop.');return p;
}
export async function api(path:string,body?:unknown,method?:string,signal?:AbortSignal){
 const {data:{session}}=await browserDb().auth.getSession();
 const response=await fetch(path,{method:method||(body?'POST':'GET'),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(15000)]):undefined,headers:{...(body?{'Content-Type':'application/json'}:{}),...(session?{Authorization:'Bearer '+session.access_token}:{})},body:body?JSON.stringify(body):undefined});
 const result=await response.json();if(!response.ok)throw Object.assign(Error(result.error||'Request failed.'),{status:response.status});return result;
}
