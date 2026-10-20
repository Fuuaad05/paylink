import {test,beforeEach} from 'node:test';
import assert from 'node:assert/strict';
import {discoverWallets,selectWallet,activeWallet,disconnectWallet,assertWalletAccount,pairWalletConnect} from '../lib/wallet.ts';
let memory;
beforeEach(async()=>{globalThis.window=new EventTarget();memory=new Map();globalThis.localStorage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)};await disconnectWallet();});
function announce(info,provider){const event=new Event('eip6963:announceProvider');event.detail={info,provider};window.dispatchEvent(event);}

test('discovery lists different installed wallets, deduplicates legacy aliases and never requests accounts',async()=>{
 let requested=0;const rabby={isRabby:true,request:async()=>{requested++}},metamask={isMetaMask:true,request:async()=>{requested++}};
 window.rabby=rabby;window.ethereum={providers:[rabby,metamask]};window.addEventListener('eip6963:requestProvider',()=>{announce({rdns:'io.rabby',name:'Rabby'},rabby);announce({rdns:'io.metamask',name:'MetaMask'},metamask);announce({rdns:'io.metamask',name:'MetaMask'},metamask)});
 const wallets=await discoverWallets();assert.equal(wallets.length,2);assert.equal(requested,0);assert.deepEqual(wallets.map(w=>w.name),['Rabby','MetaMask']);
});
test('payment provider is the explicit choice and never falls back to Rabby',async()=>{
 const rabby={request:async()=>{throw Error('Wrong provider')}};const metamask={request:async()=>['0x1111111111111111111111111111111111111111']};window.rabby=rabby;
 selectWallet({id:'eip6963:io.metamask',name:'MetaMask',provider:metamask});assert.equal(await activeWallet(),metamask);assert.equal(memory.get('paylink.wallet'),'eip6963:io.metamask');
 await disconnectWallet();await assert.rejects(()=>activeWallet(),/Connect your wallet/);
});
test('a stale restore cannot overwrite a newer explicit wallet choice',async()=>{
 memory.set('paylink.wallet','eip6963:old');const old={request:async()=>[]},next={request:async()=>[]};window.addEventListener('eip6963:requestProvider',()=>announce({rdns:'old',name:'Old wallet'},old));
 const restore=activeWallet();selectWallet({id:'new',name:'New wallet',provider:next});assert.equal(await restore,next);assert.equal(await activeWallet(),next);
});
test('wallet account must match the authenticated address before payment',async()=>{
 const address='0x1111111111111111111111111111111111111111';assert.equal(await assertWalletAccount({request:async()=>[address]},address),address);
 await assert.rejects(()=>assertWalletAccount({request:async()=>['0x2222222222222222222222222222222222222222']},address),/differs from your signed-in wallet/);
 await assert.rejects(()=>assertWalletAccount({request:async()=>[]},address),/differs/);
});
test('disconnect revokes WalletConnect transport and clears the selected wallet even if revocation fails',async()=>{
 let calls=0;selectWallet({id:'walletconnect',name:'Test wallet',provider:{request:async()=>[],disconnect:async()=>{calls++;throw Error('Offline')}}});
 await assert.rejects(()=>disconnectWallet(),/Offline/);assert.equal(calls,1);assert.equal(memory.has('paylink.wallet'),false);await assert.rejects(()=>activeWallet(),/Connect your wallet/);
});


test('closing WalletConnect prevents sign-in after late pairing and reuses a pending request',async()=>{
 let resolveConnect,calls=0;const listeners=new Set();const provider={session:null,on:(event,fn)=>listeners.add(fn),removeListener:(event,fn)=>listeners.delete(fn),request:async()=>['0x1111111111111111111111111111111111111111'],connect:()=>{calls++;return new Promise(resolve=>{resolveConnect=()=>{provider.session={peer:{metadata:{name:'Mobile wallet'}}};resolve()}})}};
 const firstAbort=new AbortController(),secondAbort=new AbortController();const uris=[];
 const first=pairWalletConnect(provider,uri=>uris.push(uri),firstAbort.signal);firstAbort.abort();const rejected=assert.rejects(first,e=>e.name==='AbortError');
 const second=pairWalletConnect(provider,uri=>uris.push(uri),secondAbort.signal);
 for(const listener of listeners)listener('wc:fixture');resolveConnect();const chosen=await second;await rejected;
 assert.equal(calls,1);assert.equal(chosen.provider,provider);assert.equal(chosen.name,'Mobile wallet');assert.deepEqual(uris,['wc:fixture']);assert.equal(listeners.size,0);
 await assert.rejects(()=>activeWallet(),/Connect your wallet/);
});
