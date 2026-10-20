// Bounded checks reuse an existing order. They never create a payment or authorization.
export async function pollConfirmation(check:()=>Promise<void>,wait:(signal:AbortSignal)=>Promise<void>,signal:AbortSignal,attempts=24):Promise<'paid'|'timeout'|'stopped'>{
 for(let n=0;n<attempts;n++){
  if(signal.aborted)return 'stopped';
  try{await check();return signal.aborted?'stopped':'paid'}catch(error:any){if(signal.aborted)return 'stopped';if(error.status!==409)throw error;}
  if(n+1<attempts)await wait(signal);
 }
 return signal.aborted?'stopped':'timeout';
}
export function confirmationDelay(signal:AbortSignal){return new Promise<void>(resolve=>{if(signal.aborted){resolve();return}const done=()=>{clearTimeout(timer);signal.removeEventListener('abort',done);resolve()};const timer=setTimeout(done,5000);signal.addEventListener('abort',done,{once:true});});}
