import {declareEip2612GasSponsoringExtension} from '@x402/extensions';
import {x402ResourceServer,HTTPFacilitatorClient} from '@x402/core/server';
import {ExactEvmScheme} from '@x402/evm/exact/server';
import {TOKEN,units} from './direct-payment';
export const NETWORK='eip155:31611' as const;
export async function paymentServer(){const server=new x402ResourceServer(new HTTPFacilitatorClient({url:process.env.X402_FACILITATOR_URL||'https://facilitator.vativ.io'}));server.register(NETWORK,new ExactEvmScheme());await server.initialize();return server;}
export async function requirements(amount:string,recipient:string){const server=await paymentServer();const result=await server.buildPaymentRequirements({scheme:'exact',network:NETWORK,price:'$'+amount,payTo:recipient,maxTimeoutSeconds:300});if(result.length!==1||result[0].asset.toLowerCase()!==TOKEN.toLowerCase()||result[0].amount!==units(amount).toString())throw Error('MUSD payment configuration mismatch.');return {server,requirement:result[0]};}

export const EXTENSIONS=declareEip2612GasSponsoringExtension();
