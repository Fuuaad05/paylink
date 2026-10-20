export const PRODUCT_TYPES=['application/pdf','application/zip','text/plain','image/png','image/jpeg'];
export const COVER_TYPES=['image/png','image/jpeg','image/webp'];
export function storageDetails(info:any,cover=false){
 const size=info?.size, type=info?.contentType??info?.content_type??info?.metadata?.mimetype;
 if(!Number.isSafeInteger(size)||size<=0||size>(cover?2:10)*1024*1024||!(cover?COVER_TYPES:PRODUCT_TYPES).includes(type))throw Error(cover?'Use a PNG, JPEG or WebP cover up to 2 MB.':'Use a PDF, ZIP, text, PNG or JPEG file up to 10 MB.');
 return {size:size as number,type:type as string};
}
export function ownPath(path:string,userId:string){return path.startsWith(userId+'/')&&!path.includes('..')&&!path.includes('\\');}
export function fileLabel(type?:string|null,size?:number|null){
 if(!type||!size)return 'Digital download';
 const labels:Record<string,string>={'application/pdf':'PDF','application/zip':'ZIP','text/plain':'TXT','image/png':'PNG','image/jpeg':'JPEG'};
 return (labels[type]||'File')+' · '+(size<1024?size+' B':size<1048576?(size/1024).toFixed(1)+' KB':(size/1048576).toFixed(1)+' MB');
}
