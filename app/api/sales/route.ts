import {admin,user,fail,HttpError} from '../../../lib/server';
import {getSellerSales} from '../../../lib/sales';

export async function GET(request:Request){
  try{
    const seller=await user(request);
    const raw=new URL(request.url).searchParams.get('page')??'0';
    if(!/^\d{1,6}$/.test(raw)||Number(raw)>100000)throw new HttpError(400,'Invalid sales page.');
    const report=await getSellerSales(admin(),seller.id,Number(raw));
    return Response.json(report,{headers:{'Cache-Control':'private, no-store','Vary':'Authorization'}});
  }catch(error){return fail(error);}
}
