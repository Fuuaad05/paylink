export const CREATOR_PLAN={name:'Creator',price:'3',days:30,freeProducts:3,paidProducts:25} as const;
export function productLimit(expiresAt:string|null,now=Date.now()){return expiresAt&&Date.parse(expiresAt)>now?CREATOR_PLAN.paidProducts:CREATOR_PLAN.freeProducts;}
export function assertCanPublish(count:number,expiresAt:string|null,now=Date.now()){if(count>=productLimit(expiresAt,now))throw Error('Your publishing limit is reached. Open Creator plan to upgrade. Existing products and buyer downloads remain available.');}
export function planRecipient(){const value=process.env.PAYLINK_TREASURY_ADDRESS;if(!value||!/^0x[0-9a-fA-F]{40}$/.test(value)||/^0x0{40}$/i.test(value))return null;return value.toLowerCase();}
