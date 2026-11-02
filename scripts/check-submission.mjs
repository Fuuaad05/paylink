import fs from 'node:fs';
const e=JSON.parse(fs.readFileSync(new URL('../docs/evidence.json',import.meta.url),'utf8'));let bad=[];
if(!fs.existsSync(new URL('../public/pitch-deck.pdf',import.meta.url)))bad.push('Pitch deck PDF is missing.');
for(const r of e.receipts){if(!/^0x[0-9a-fA-F]{64}$/.test(r.txHash))bad.push('Invalid receipt hash.');for(const k of ['payer','recipient'])if(!/^0x[0-9a-fA-F]{40}$/.test(r[k]))bad.push('Invalid '+k+' wallet.');}
try{const u=new URL(process.env.NEXT_PUBLIC_DEMO_VIDEO_URL||'');if(u.protocol!=='https:'||!['youtube.com','www.youtube.com','youtu.be'].includes(u.hostname))throw Error();}catch{bad.push('Set NEXT_PUBLIC_DEMO_VIDEO_URL to your public/unlisted YouTube link.');}
for(const [k,v] of Object.entries(e.wave2LiveAcceptance))if(v==='pending')bad.push('Wave 2 acceptance pending: '+k+'. Add real evidence before claiming this is tested.');
if(bad.length){console.error(bad.join('\n'));process.exitCode=1;}else console.log('Submission links and recorded acceptance evidence are complete.');
