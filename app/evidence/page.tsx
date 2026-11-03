import type {Metadata} from 'next';
import evidence from '../../docs/evidence.json';
import poolRead from '../../docs/pool-read-check.json';
import {formatUnits} from 'viem';
import {POOLS} from '../../lib/mezo-pools';
export const metadata:Metadata={title:'PayLink · Evidence and pitch deck'};
const explorer='https://explorer.test.mezo.org';
function video(){try{const u=new URL(process.env.NEXT_PUBLIC_DEMO_VIDEO_URL||'');return u.protocol==='https:'&&['youtu.be','youtube.com','www.youtube.com'].includes(u.hostname)?u.href:null;}catch{return null;}}
function wallet(address:string){return <a href={explorer+'/address/'+address} target="_blank" rel="noreferrer"><code>{address}</code></a>;}
export default function Evidence(){const demo=video();return <main className="evidence-page">
 <a href="/">← PayLink</a><div className="eyebrow" style={{marginTop:36}}>BUILDATHON EVIDENCE · TEST TOKENS ONLY</div><h1>Receipts, materials, and what has been tested.</h1>
 <p>PayLink sells digital products with MUSD, sends payment to the creator’s wallet, and restores access to confirmed purchases when the buyer returns.</p>
 <p><a href="/pitch-deck.pdf" target="_blank" rel="noreferrer">Open the pitch deck (PDF)</a> · <a href="https://github.com/Fuuaad05/paylink" target="_blank" rel="noreferrer">Public source code</a>{demo&&<> · <a href={demo} target="_blank" rel="noreferrer">Watch the demo</a></>}</p>
 {!demo&&<p>The demo video has not been linked in this build yet.</p>}
 <table><tbody><tr><th scope="row">Network</th><td>{evidence.network} · chain {evidence.chainId}</td></tr><tr><th scope="row">MUSD contract</th><td>{wallet(evidence.token)}</td></tr></tbody></table>
 <h2>Wave 2: confirmed transactions</h2>
 <p>The checkout swap, product payment, and Creator plan payments below have successful on-chain receipts. Purchase downloads and recovery were recorded by the builder. These tests use builder-controlled wallets; they do not represent independent customers or mainnet revenue.</p>
 {evidence.wave2Receipts.map(r=><article className="proof-card" key={r.txHash}>
  <div className="eyebrow">WAVE 2 · {r.date} · BLOCK {r.blockNumber}</div><h3>{r.title}</h3>
  <p><strong>{r.kind==='swap'?r.inputAmount+' '+r.inputAsset+' → ':''}{r.amount} MUSD</strong></p>
  <p>{r.kind==='swap'?'Wallet funding the swap':'MUSD payer'}: {wallet(r.payer)}<br/>{r.kind==='creator_plan'?'Plan treasury':r.kind==='swap'?'MUSD receiving wallet':'Seller receiving payment'}: {wallet(r.recipient)}</p>
  {r.router&&<p>Swap router: {wallet(r.router)}</p>}
  <a href={explorer+'/tx/'+r.txHash} target="_blank" rel="noreferrer">View confirmed {r.kind==='swap'?'swap':r.kind==='creator_plan'?'plan payment':'product payment'} ↗<br/><code>{r.txHash}</code></a><p>{r.status}</p>
 </article>)}
 <h2>Testing status</h2><ul><li><strong>Swap:</strong> completed through the configured Mezo Pools router; BTC input and MUSD output verified from transfer logs.</li><li><strong>Product payment:</strong> 400 MUSD paid directly to the seller; successful receipt and MUSD transfer verified.</li><li><strong>Creator plan:</strong> two separate 3 MUSD payments confirmed. The builder verified activation and extension of the expiry.</li><li><strong>Purchase recovery:</strong> initial download and a returning download shown in the supplied builder demo.</li><li><strong>Independent user testing:</strong> pending. No outside adoption or commercial demand is claimed.</li></ul>
 <p>The x402 transaction sender can be the facilitator. Use the MUSD Transfer log to identify the actual payer and recipient. A successful payment receipt alone does not prove file delivery or database entitlement; those are covered by the builder’s app testing.</p>
 <h2>Wave 1 payment history</h2><p>The Wave 1 judges independently traced test purchases to the seller. The original 20 MUSD receipt is retained below. Wallet roles changed between test sessions: this Wave 1 seller wallet is the buyer and plan treasury in the Wave 2 receipts above.</p>
 {evidence.receipts.map(r=><article className="proof-card" key={r.txHash}><h3>{r.amount} MUSD · {r.date}</h3><p>Buyer: {wallet(r.payer)}<br/>Seller: {wallet(r.recipient)}</p><a href={explorer+'/tx/'+r.txHash} target="_blank" rel="noreferrer"><code>{r.txHash}</code> ↗</a><p>{r.status}</p></article>)}
 <h2>Historical pool quote check</h2><p>Before the live swap, a read-only check at block <code>{poolRead.quote.blockNumber}</code> quoted {formatUnits(BigInt(poolRead.quote.expectedOut),18)} MUSD for 0.0001 test BTC. Router, factory, pool identity, token pair and nonzero reserves were checked. This is historical development evidence, not a current quote.</p>
 <h2>Wave 2 implementation</h2><ul><li>Checkout funding through Mezo Testnet’s BTC/MUSD pool, with chain, router, pool identity, reserves, quote and slippage checks before signing.</li><li>A Creator plan paid in MUSD: 3 MUSD for 30 days, up to 25 products. Free publishing supports 3 products. No automatic renewal.</li><li>Global receipt and authorization claims stop a single payment being reused across product and plan orders.</li></ul>
 <p>Testnet router: {wallet(POOLS.router)}<br/>BTC/MUSD pool: {wallet(POOLS.pool)}</p>
 <h2>Reproduce purchase recovery</h2><ol><li>Sign in as a creator and publish a small trusted file. Copy its checkout link.</li><li>Open that link in a separate buyer wallet. If short of MUSD, use the swap form inside checkout. Review its quote, confirm the swap, then pay for the product separately.</li><li>After payment confirmation, download the file and save the receipt.</li><li>Return with the same buyer wallet. Open My purchases and download again without another payment.</li><li>Check the seller’s Sales page against the MUSD Transfer log.</li></ol>
 <h2>Next evidence to collect</h2><p>Collect feedback from independent creators and buyers with their consent. Testnet payments demonstrate working flows, not willingness to pay real money. Keep the public demo link current and identify the exact release commit in the Wave 2 submission. See the repository’s acceptance checklist and pilot guide.</p>
 </main>}
