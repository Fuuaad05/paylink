import type {SupabaseClient} from '@supabase/supabase-js';
import {HttpError} from './server';
export async function claimPayment(db:SupabaseClient,table:'payment_authorizations'|'payment_receipts',id:string,kind:'product'|'creator_plan',orderId:string){
 const {error}=await db.from(table).upsert({id:id.toLowerCase(),kind,order_id:orderId},{onConflict:'id',ignoreDuplicates:true});if(error)throw error;
 const {data,error:readError}=await db.from(table).select('kind,order_id').eq('id',id.toLowerCase()).single();if(readError)throw readError;
 if(data.kind!==kind||data.order_id!==orderId)throw new HttpError(409,'This payment is already attached to another order. Recover the original purchase.');
}
