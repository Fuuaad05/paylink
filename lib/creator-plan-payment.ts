import {createHash} from 'node:crypto';
import {z} from 'zod';
import type {PaymentPayload,PaymentRequirements} from '@x402/core/types';
import {admin,user,walletOf,sameOrigin,body,fail,HttpError} from './server';
import {planRecipient,CREATOR_PLAN,productLimit} from './creator-plan';
import {requirements,paymentServer,EXTENSIONS} from './x402';
import {checkSettlement} from './chain';
import {claimPayment} from './payment-claims';
const fields='id,recipient,amount,status,tx_hash,payer,created_at,paid_at,granted_until';
export async function getCreatorPlan(request:Request){try{
 const u=await user(request);walletOf(u);const db=admin();
 const [plan,products,open,history]=await Promise.all([
  db.from('creator_plans').select('expires_at').eq('seller_id',u.id).maybeSingle(),db.from('products').select('id',{head:true,count:'exact'}).eq('seller_id',u.id),
  db.from('creator_plan_orders').select(fields).eq('buyer_id',u.id).neq('status','paid').maybeSingle(),
  db.from('creator_plan_orders').select(fields).eq('buyer_id',u.id).eq('status','paid').order('paid_at',{ascending:false}).limit(5)]);
 for(const r of [plan,products,open,history])if(r.error)throw r.error;
 const expiresAt=plan.data?.expires_at??null;
 return Response.json({plan:CREATOR_PLAN,configured:!!planRecipient(),recipient:planRecipient(),expiresAt,productCount:products.count??0,productLimit:productLimit(expiresAt),order:open.data,history:history.data},{headers:{'Cache-Control':'private, no-store','Vary':'Authorization'}});
 }catch(e){return fail(e)}}
export async function payCreatorPlan(request:Request){try{
 sameOrigin(request);const u=await user(request),wallet=walletOf(u),db=admin();const recipient=planRecipient();if(!recipient)throw new HttpError(503,'Creator plan payments are not enabled yet. Free publishing remains available.');
 // This endpoint accepts no client-supplied price, recipient, or membership duration.
 z.object({}).strict().parse(await body(request));
 let {data:order,error}=await db.from('creator_plan_orders').select('*').eq('buyer_id',u.id).neq('status','paid').maybeSingle();if(error)throw error;
 if(!order){const r=await db.from('creator_plan_orders').insert({buyer_id:u.id,recipient,amount:CREATOR_PLAN.price}).select('*').single();if(r.error&&r.error.code!=='23505')throw r.error;order=r.data;if(!order){const r=await db.from('creator_plan_orders').select('*').eq('buyer_id',u.id).neq('status','paid').single();if(r.error)throw r.error;order=r.data;}}
 if(order.status==='settling')return Response.json({pending:true,order:{id:order.id,tx_hash:order.tx_hash,status:'settling'}},{status:202});
 const header=request.headers.get('payment-signature');
 if(!header){const built=await requirements(order.amount,order.recipient);const r=await db.from('creator_plan_orders').update({payment_requirements:built.requirement}).eq('id',order.id).is('payment_requirements',null);if(r.error)throw r.error;
  const {data:saved,error}=await db.from('creator_plan_orders').select('payment_requirements').eq('id',order.id).single();if(error)throw error;
  const quote=await built.server.createPaymentRequiredResponse([saved!.payment_requirements as PaymentRequirements],{url:new URL('/api/creator-plan?order='+order.id,process.env.APP_ORIGIN||request.url).href,description:'PayLink Creator: 30 days, up to 25 products',mimeType:'application/json'},undefined,EXTENSIONS);
  return Response.json(quote,{status:402,headers:{'PAYMENT-REQUIRED':Buffer.from(JSON.stringify(quote)).toString('base64'),'Cache-Control':'no-store'}});}
 if(header.length>24000)throw new HttpError(400,'Payment authorization is too large.');
 let payload:PaymentPayload;try{payload=JSON.parse(Buffer.from(header,'base64').toString('utf8'))}catch{throw new HttpError(400,'Invalid payment authorization.')}
 const requirement=order.payment_requirements as PaymentRequirements|null;if(!requirement)throw new HttpError(400,'Request a plan quote before paying.');
 const raw=payload.payload as any,payer=raw?.permit2Authorization?.from||raw?.authorization?.from,signature=raw?.signature;
 if(typeof payer!=='string'||payer.toLowerCase()!==wallet||typeof signature!=='string'||!/^0x[0-9a-fA-F]{130,4096}$/.test(signature))throw new HttpError(400,'Use your signed-in wallet to authorize the plan.');
 const server=await paymentServer(),verified=await server.verifyPayment(payload,requirement,EXTENSIONS);if(!verified.isValid)throw new HttpError(400,'Plan payment authorization rejected: '+(verified.invalidReason||'Invalid authorization'));
 const authorizationId=createHash('sha256').update(signature.toLowerCase()).digest('hex');await claimPayment(db,'payment_authorizations',authorizationId,'creator_plan',order.id);
 const lock=await db.from('creator_plan_orders').update({status:'settling',payer:wallet,payment_payload:payload,authorization_id:authorizationId}).eq('id',order.id).eq('status','pending').select('id').maybeSingle();if(lock.error)throw lock.error;if(!lock.data)return Response.json({pending:true},{status:202});
 const settled=await server.settlePayment(payload,requirement,EXTENSIONS);if(!settled.success||!/^0x[0-9a-fA-F]{64}$/.test(settled.transaction))throw new HttpError(409,'Plan settlement needs review. Recover the existing payment before trying again.');
 const hash=settled.transaction.toLowerCase();const save=await db.from('creator_plan_orders').update({tx_hash:hash}).eq('id',order.id);if(save.error)throw save.error;
 try{await checkSettlement(hash,wallet,order.recipient,order.amount,signature)}catch(e){if(e instanceof HttpError&&e.status===409)return Response.json({pending:true,txHash:hash},{status:202});throw e;}
 await claimPayment(db,'payment_receipts',hash,'creator_plan',order.id);const grant=await db.rpc('activate_creator_plan',{p_order_id:order.id});if(grant.error)throw grant.error;
 return Response.json({paid:true,expiresAt:grant.data,txHash:hash});
 }catch(e){return fail(e)}}
export async function recoverCreatorPlan(request:Request){try{
 sameOrigin(request);const u=await user(request);walletOf(u);const input=z.object({orderId:z.string().uuid(),txHash:z.string().regex(/^0x[0-9a-fA-F]{64}$/).optional()}).parse(await body(request));const db=admin();
 const {data:order,error}=await db.from('creator_plan_orders').select('*').eq('id',input.orderId).eq('buyer_id',u.id).single();if(error||!order)throw new HttpError(404,'Plan order not found.');if(order.status==='paid')return Response.json({paid:true,expiresAt:order.granted_until});
 const hash=order.tx_hash||input.txHash;if(order.status!=='settling'||!hash||!order.payment_payload||!order.payer)throw new HttpError(409,'Use the original submitted plan payment hash to recover.');
 await checkSettlement(hash,order.payer,order.recipient,order.amount,order.payment_payload.payload.signature);await claimPayment(db,'payment_receipts',hash,'creator_plan',order.id);
 const save=await db.from('creator_plan_orders').update({tx_hash:hash.toLowerCase()}).eq('id',order.id);if(save.error)throw save.error;
 const grant=await db.rpc('activate_creator_plan',{p_order_id:order.id});if(grant.error)throw grant.error;return Response.json({paid:true,expiresAt:grant.data});
 }catch(e){return fail(e)}}
