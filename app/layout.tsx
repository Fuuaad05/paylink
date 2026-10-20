import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'PayLink · MUSD checkout',description:'Sell a digital product. Get paid in MUSD. Let buyers recover their purchases.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
