import {createClient} from '@supabase/supabase-js';
import {z} from 'zod';
export function admin(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new HttpError(503,'Supabase is not configured. Follow docs/SETUP.md.');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}})}
export class HttpError extends Error{constructor(public status:number,message:string){super(message)}}
export async function user(request:Request){const token=request.headers.get('authorization')?.replace(/^Bearer /i,'');if(!token)throw new HttpError(401,'Sign in with your wallet first.');const {data,error}=await admin().auth.getUser(token);if(error||!data.user)throw new HttpError(401,'Your session expired. Sign in again.');return data.user;}
export function fail(error:unknown){if(error instanceof HttpError)return Response.json({error:error.message},{status:error.status});if(error instanceof z.ZodError)return Response.json({error:error.issues[0]?.message||'Invalid request.'},{status:400});console.error(error instanceof Error?error.message:'Unknown server error');return Response.json({error:'The request could not be completed. Check configuration and retry.'},{status:500})}
export async function body(request:Request){const text=await request.text();if(text.length>8192)throw new HttpError(413,'Request is too large.');try{return JSON.parse(text)}catch{throw new HttpError(400,'Invalid JSON.')}}
export function sameOrigin(request:Request){const origin=request.headers.get('origin');if(origin&&origin!==new URL(process.env.APP_ORIGIN||request.url).origin)throw new HttpError(403,'Request origin is not allowed.');}
export function walletOf(u: Awaited<ReturnType<typeof user>>) {
  for (const identity of u.identities ?? []) {
    if (identity.provider !== 'web3') continue;
    const data = identity.identity_data ?? {};
    const claims = data.custom_claims ?? data;
    if (claims.chain !== 'ethereum') continue;
    const address = claims.address;
    if (typeof address === 'string' && /^0x[0-9a-fA-F]{40}$/.test(address)) {
      return address.toLowerCase();
    }
  }
  throw new HttpError(403, 'Sign in using an Ethereum wallet.');
}
