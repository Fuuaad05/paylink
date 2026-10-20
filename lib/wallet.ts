import {CHAIN,RPC} from './direct-payment';
export type Provider={request:(args:{method:string;params?:any})=>Promise<any>;on?:(event:string,fn:(...args:any[])=>void)=>void;removeListener?:(event:string,fn:(...args:any[])=>void)=>void;isRabby?:boolean;isMetaMask?:boolean;disconnect?:()=>Promise<void>};
export type WalletChoice={id:string;name:string;provider:Provider};
const STORAGE_KEY='paylink.wallet';
export const WALLET_CHANGED='paylink:wallet-selected';
let selected:WalletChoice|undefined;
let wcPromise:Promise<any>|undefined;
let selectionVersion=0;
function savedId(){try{return localStorage.getItem(STORAGE_KEY)}catch{return null}}
export async function discoverWallets():Promise<WalletChoice[]>{
 const wallets:WalletChoice[]=[];
 const add=(provider:Provider|undefined,id:string,name:string)=>{if(typeof provider?.request==='function'&&!wallets.some(w=>w.provider===provider||w.id===id))wallets.push({provider,id,name:name.slice(0,80)})};
 const listener=(event:Event)=>{const {info,provider}=(event as CustomEvent).detail??{};if(typeof info?.rdns==='string'&&typeof info?.name==='string')add(provider,'eip6963:'+info.rdns,info.name)};
 window.addEventListener('eip6963:announceProvider',listener);window.dispatchEvent(new Event('eip6963:requestProvider'));
 await new Promise(resolve=>setTimeout(resolve,300));window.removeEventListener('eip6963:announceProvider',listener);
 const browser=window as any;
 if(browser.rabby)add(browser.rabby,'legacy:rabby','Rabby');
 const legacy:Provider[]=(browser.ethereum?.providers??(browser.ethereum?[browser.ethereum]:[]));
 for(const p of legacy)add(p,p.isRabby?'legacy:rabby':p.isMetaMask?'legacy:metamask':'legacy:wallet',p.isRabby?'Rabby':p.isMetaMask?'MetaMask':'Browser wallet');
 return wallets;
}
export function selectWallet(choice:WalletChoice){
 selected=choice;selectionVersion++;
 try{localStorage.setItem(STORAGE_KEY,choice.id)}catch{}
 window.dispatchEvent(new Event(WALLET_CHANGED));
}
export async function walletConnectProvider(){
 if(!wcPromise){
  wcPromise=(async()=>{
   const projectId=process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
   if(!projectId||!/^[a-fA-F0-9]{32}$/.test(projectId))throw Error('WalletConnect is not configured. Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID and restart.');
   const {EthereumProvider}=await import('@walletconnect/ethereum-provider');
   return EthereumProvider.init({projectId,showQrModal:false,optionalChains:[CHAIN],rpcMap:{[CHAIN]:RPC},metadata:{name:'PayLink',description:'MUSD checkout and recoverable digital purchases on Mezo Testnet',url:window.location.origin,icons:[]}});
  })().catch(error=>{wcPromise=undefined;throw error});
 }
 return wcPromise;
}
export async function activeWallet():Promise<Provider>{
 if(selected)return selected.provider;
 const version=selectionVersion,id=savedId();let choice:WalletChoice|undefined;
 if(id==='walletconnect'){
  const provider=await walletConnectProvider();if(provider.session)choice={id,name:'WalletConnect',provider};
 }else if(id){choice=(await discoverWallets()).find(wallet=>wallet.id===id);}
 // An older restore must never overwrite a newer user choice or disconnect.
 if(version!==selectionVersion){const latest=selected as WalletChoice|undefined;if(latest)return latest.provider;throw Error('Connect your wallet to continue.');}
 if(!choice)throw Error('Connect your wallet to continue. If you signed in before this update, sign out and connect again.');
 selected=choice;return choice.provider;
}
export async function disconnectWallet(){
 const previous=selected;selected=undefined;selectionVersion++;
 try{localStorage.removeItem(STORAGE_KEY)}catch{}
 window.dispatchEvent(new Event(WALLET_CHANGED));
 if(previous?.id==='walletconnect'&&previous.provider.disconnect)await previous.provider.disconnect();
}
export async function assertWalletAccount(provider:Provider,address:string){
 const accounts=await provider.request({method:'eth_accounts'});
 if(!Array.isArray(accounts)||typeof accounts[0]!=='string'||accounts[0].toLowerCase()!==address.toLowerCase())throw Error('Your connected account differs from your signed-in wallet. Sign out and connect the correct wallet.');
 return accounts[0] as `0x${string}`;
}

let connecting:Promise<void>|undefined;
let connectionUri='';
export async function connectWalletConnect(onUri:(uri:string)=>void,signal:AbortSignal):Promise<WalletChoice>{
 return pairWalletConnect(await walletConnectProvider(),onUri,signal);
}
export async function pairWalletConnect(provider:any,onUri:(uri:string)=>void,signal:AbortSignal):Promise<WalletChoice>{
 if(signal.aborted)throw new DOMException('Connection cancelled','AbortError');
 const display=(uri:string)=>{connectionUri=uri;if(!signal.aborted)onUri(uri)};
 provider.on('display_uri',display);
 try{
  if(!provider.session){
   if(connectionUri)onUri(connectionUri);
   // Reopening the picker reuses the pending proposal, never creates two requests.
   connecting??=provider.connect().finally(()=>{connecting=undefined;connectionUri=''});
   await connecting;
  }
  if(signal.aborted)throw new DOMException('Connection cancelled','AbortError');
  const accounts=await provider.request({method:'eth_accounts'});
  if(!accounts?.length)throw Error('The wallet did not share an Ethereum account.');
  return {id:'walletconnect',name:provider.session?.peer?.metadata?.name||'WalletConnect',provider};
 }finally{provider.removeListener('display_uri',display)}
}
