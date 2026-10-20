import type {SupabaseClient} from '@supabase/supabase-js';
import {units} from './direct-payment';

export type Sale = {
  id:string;product_id:string;amount:string;recipient:string;
  payer:string;tx_hash:string;paid_at:string;
  product:{title:string;seller_id:string};
};
export type SalesReport = {
  sales:Sale[];totalReceived:string;paidOrders:number;productsSold:number;
  page:number;pageSize:number;hasMore:boolean;
};

export function formatMusd(value:bigint):string {
  const scale=10n**18n;
  const fraction=(value%scale).toString().padStart(18,'0').replace(/0+$/,'');
  return (value/scale).toString()+(fraction?'.'+fraction:'');
}

// The caller supplies the verified auth user ID. Never take sellerId from URL/body.
export async function getSellerSales(db:SupabaseClient,sellerId:string,page=0):Promise<SalesReport> {
  if(!sellerId)throw new Error('A verified seller ID is required.');
  if(!Number.isSafeInteger(page)||page<0||page>100000)throw new Error('Invalid sales page.');
  const pageSize=25,batchSize=100;
  let offset=0,total=0n,count=0;
  const products=new Set<string>();
  const sales:Sale[]=[];
  // Scan paid rows in bounded batches so totals include records beyond PostgREST's row cap.
  // For a large production workload this should become a SQL aggregate + paged query.
  for(;;){
    const {data,error}=await db.from('orders')
      .select('id,product_id,amount,recipient,payer,tx_hash,paid_at,product:products!inner(title,seller_id)')
      .eq('product.seller_id',sellerId).eq('status','paid')
      .order('paid_at',{ascending:false}).order('id',{ascending:false})
      .range(offset,offset+batchSize-1);
    if(error)throw error;
    const rows=(data??[]) as unknown as Sale[];
    for(const row of rows){
      // Defence in depth: fail closed if a misconfigured join ever returns another seller.
      if(row.product?.seller_id!==sellerId)throw new Error('Sales ownership mismatch.');
      total+=units(row.amount);products.add(row.product_id);
      if(count>=page*pageSize&&count<(page+1)*pageSize)sales.push(row);
      count++;
    }
    if(rows.length<batchSize)break;
    offset+=batchSize;
  }
  return {sales,totalReceived:formatMusd(total),paidOrders:count,productsSold:products.size,page,pageSize,hasMore:(page+1)*pageSize<count};
}
