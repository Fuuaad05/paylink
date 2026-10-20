import {z} from 'zod';
import {createHash} from 'node:crypto';
import type {PaymentPayload,PaymentRequirements} from '@x402/core/types';
import {admin,user,body,fail,HttpError,sameOrigin,walletOf} from '../../../lib/server';
import {paymentServer,requirements,EXTENSIONS} from '../../../lib/x402';
import {checkSettlement} from '../../../lib/chain';
const columns='id,product_id,buyer_id,recipient,amount,status,tx_hash,payer,created_at,paid_at';
export const maxDuration=60;
export async function POST(request:Request){try{
 sameOrigin(request);const u=await user(request),wallet=walletOf(u);const {orderId}=z.object({orderId:z.string().uuid()}).parse(await body(request));const db=admin();const {data:order}=await db.from('orders').select('*').eq('id',orderId).eq('buyer_id',u.id).single();if(!order)throw new HttpError(404,'Order not found.');
 if(order.status==='paid')return Response.json({order,alreadyPaid:true});
 if(order.status==='settling')return Response.json({order:{id:order.id,status:order.status,tx_hash:order.tx_hash},pending:true},{status:202});
 const header=request.headers.get('payment-signature');
 if(!header){
  const built=await requirements(order.amount,order.recipient);
  // Persist one quote per order so concurrent callers cannot replace its payment terms.
  await db.from('orders').update({payment_requirements:built.requirement}).eq('id',order.id).is('payment_requirements',null);
  const {data:saved,error}=await db.from('orders').select('payment_requirements').eq('id',order.id).single();if(error)throw error;
  const quote=await built.server.createPaymentRequiredResponse([saved!.payment_requirements as PaymentRequirements],{url:new URL('/api/pay?order='+order.id,process.env.APP_ORIGIN||request.url).href,description:'PayLink digital purchase',mimeType:'application/json'},undefined,EXTENSIONS);
  return Response.json(quote,{status:402,headers:{'PAYMENT-REQUIRED':Buffer.from(JSON.stringify(quote)).toString('base64'),'Cache-Control':'no-store'}});
 }
 if(header.length>24000)throw new HttpError(400,'Payment authorization is too large.');
 let payload:PaymentPayload;try{payload=JSON.parse(Buffer.from(header,'base64').toString('utf8'))}catch{throw new HttpError(400,'Invalid payment authorization.')}
 const requirement=order.payment_requirements as PaymentRequirements|null;if(!requirement)throw new HttpError(400,'Request a quote before paying.');
 const raw=payload.payload as any;const payer=raw?.permit2Authorization?.from||raw?.authorization?.from;const signature=raw?.signature;
 if(typeof payer!=='string'||payer.toLowerCase()!==wallet||typeof signature!=='string'||!/^0x[0-9a-fA-F]{130,4096}$/.test(signature))throw new HttpError(400,'Authorize payment using your signed-in wallet.');
 const server=await paymentServer();const verified=await server.verifyPayment(payload,requirement,EXTENSIONS);if(!verified.isValid)throw new HttpError(400,'Payment authorization was rejected: '+(verified.invalidReason||'No reason supplied'));
 const authorizationId=createHash('sha256').update(signature.toLowerCase()).digest('hex');
 const {data:locked,error:lockError}=await db.from('orders').update({status:'settling',payment_method:'x402',payer:wallet,payment_payload:payload,authorization_id:authorizationId}).eq('id',order.id).eq('status','pending').select('id').maybeSingle();if(lockError)throw lockError;if(!locked)return Response.json({pending:true},{status:202});
 // Keep a durable settling state if the network drops. Never automatically sign a replacement payment.
 const settled=await server.settlePayment(payload,requirement,EXTENSIONS);
 if(!settled.success||!/^0x[0-9a-fA-F]{64}$/.test(settled.transaction))throw new HttpError(409,'Settlement needs review. Use Recover purchases and reconcile the existing payment before paying again.');
 const txHash=settled.transaction.toLowerCase();const {error:saveError}=await db.from('orders').update({tx_hash:txHash}).eq('id',order.id).eq('status','settling');if(saveError)throw saveError;
 try{await checkSettlement(txHash,wallet,order.recipient,order.amount,signature);}catch(e){if(e instanceof HttpError&&e.status===409)return Response.json({pending:true,txHash},{status:202});throw e}
 const {data:paid,error}=await db.from('orders').update({status:'paid',paid_at:new Date().toISOString()}).eq('id',order.id).eq('status','settling').select(columns).single();if(error)throw error;
 return Response.json({order:paid},{headers:{'PAYMENT-RESPONSE':Buffer.from(JSON.stringify(settled)).toString('base64')}});
 }catch(e){return fail(e)}}
