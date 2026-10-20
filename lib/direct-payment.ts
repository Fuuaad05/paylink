export const TOKEN = '0x118917a40FAF1CD7a13dB0Ef56C86De7973Ac503';
export const CHAIN = 31611;
export const RPC = 'https://rpc.test.mezo.org';
export const EXPLORER = 'https://explorer.test.mezo.org';
export const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
export type Invoice = {id:string;recipient:string;amount:string;description:string;createdAt:number;txHash:string|null;payer:string|null;paidAt:number|null};
export function units(value:string):bigint {
  if(!/^(0|[1-9]\d{0,8})(\.\d{1,6})?$/.test(value)) throw new Error('Enter a positive amount with up to 6 decimal places.');
  const [whole,fraction='']=value.split('.');
  const result=BigInt(whole)*10n**18n+BigInt(fraction.padEnd(18,'0'));
  if(result<=0n) throw new Error('Amount must be greater than zero.');
  return result;
}
export function address(value:string):string {
  if(!/^0x[0-9a-fA-F]{40}$/.test(value) || /^0x0{40}$/i.test(value)) throw new Error('Enter a valid nonzero wallet address.');
  return value.toLowerCase();
}
export function transferData(invoice:Pick<Invoice,'id'|'amount'|'recipient'>):string {
  const id=invoice.id.replaceAll('-','');
  if(!/^[0-9a-f]{32}$/.test(id)) throw new Error('Invalid invoice identifier.');
  return '0xa9059cbb'+address(invoice.recipient).slice(2).padStart(64,'0')+units(invoice.amount).toString(16).padStart(64,'0')+id.padStart(64,'0');
}
type RpcTx = {to:string|null;from:string;input:string;blockNumber:string|null;blockHash:string|null};
type RpcReceipt = {status:string;blockNumber:string;blockHash:string;logs:{address:string;topics:string[];data:string}[]};
export function assertPayment(invoice:Invoice,tx:RpcTx,receipt:RpcReceipt,head:bigint):string {
  if(receipt.status!=='0x1') throw new Error('Transaction failed.');
  if(!tx.blockNumber || !tx.blockHash || tx.blockHash!==receipt.blockHash || tx.blockNumber!==receipt.blockNumber) throw new Error('Transaction is not confirmed in the current chain.');
  if(head-BigInt(receipt.blockNumber)<2n) throw new Error('Waiting for 3 confirmations. Try verification again shortly.');
  if(tx.to?.toLowerCase()!==TOKEN.toLowerCase() || tx.input.toLowerCase()!==transferData(invoice)) throw new Error('This transaction does not match this invoice. Pay through the invoice checkout.');
  const matched=receipt.logs.some(log=>log.address.toLowerCase()===TOKEN.toLowerCase() && log.topics.length===3 && log.topics[0].toLowerCase()===TRANSFER_TOPIC && log.topics[1].slice(-40).toLowerCase()===tx.from.slice(2).toLowerCase() && log.topics[2].slice(-40).toLowerCase()===invoice.recipient.slice(2).toLowerCase() && BigInt(log.data)===units(invoice.amount));
  if(!matched) throw new Error('No matching MUSD transfer was found.');
  return address(tx.from);
}
