from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor, Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pathlib import Path
import json,textwrap
root=Path(__file__).resolve().parents[1]
for name,path in [('Regular','/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'),('Bold','/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf')]:pdfmetrics.registerFont(TTFont(name,path))
e=json.loads((root/'docs/evidence.json').read_text())
out=root/'public/pitch-deck.pdf';out.parent.mkdir(exist_ok=True)
c=canvas.Canvas(str(out),pagesize=(960,540));c.setTitle('PayLink - Mezo Buildathon pitch and evidence');c.setAuthor('Fouad Abdulhakeem')
red=HexColor('#e24352');ink=HexColor('#22232a');muted=HexColor('#62656f');paper=HexColor('#faf9f6');white=HexColor('#ffffff')
def text(x,y,s,size=15,b=False,color=None):
 c.setFillColor(color or ink);c.setFont('Bold' if b else 'Regular',size);c.drawString(x,y,s)
def wrap(x,y,s,width=780,size=15,color=None,leading=None):
 words=s.split();lines=[];line=''
 for w in words:
  n=(line+' '+w).strip()
  if pdfmetrics.stringWidth(n,'Regular',size)>width and line:lines.append(line);line=w
  else:line=n
 if line:lines.append(line)
 for l in lines:text(x,y,l,size,color=color);y-=leading or size*1.6
 return y
p=0
def page(kicker,title,sub=''):
 global p;p+=1;c.setFillColor(paper);c.rect(0,0,960,540,fill=1,stroke=0);text(54,496,'PayLink',19,True);text(540,498,'MEZO BUILDATHON / DEVELOPMENT DECK',10,True,muted);c.setStrokeColor(HexColor('#deddd8'));c.line(54,480,906,480);text(54,441,kicker,11,True,red);text(54,391,title,31,True)
 if sub:wrap(54,355,sub,size=13,color=muted,width=835)
 text(54,24,'Fouad Abdulhakeem  |  Track 2  |  Mezo Testnet - test tokens only',9,color=muted);text(845,24,f'{p:02} / 07',9,color=muted)
def card(x,y,w,h,label,body):
 c.setFillColor(white);c.setStrokeColor(HexColor('#e6e3df'));c.roundRect(x,y,w,h,10,fill=1,stroke=1);text(x+20,y+h-30,label,17,True);wrap(x+20,y+h-63,body,w-40,13,color=muted)
page('01 / THE PRODUCT','Your work. Paid. Delivered. Recoverable.','MUSD checkout for digital products, with access tied to the buyer\'s verified wallet.')
card(54,140,268,160,'Publish','Upload a file, set a MUSD price and share a checkout link or website button.')
card(346,140,268,160,'Pay','Buyers authorize MUSD payment directly to the creator on Mezo testnet.')
card(638,140,268,160,'Recover','Return with the same wallet and download a paid purchase again.')
text(54,93,'paylink-omega-three.vercel.app',18,True,red);c.linkURL('https://paylink-omega-three.vercel.app/',(54,86,540,112),relative=0)
c.showPage()
page('02 / PROBLEM AND AUDIENCE','A payment should not become a lost file.','For creators selling PDFs, templates, guides, images and ZIP files to wallet users.')
card(54,140,410,160,'Buyer friction','A closed tab or dropped connection can leave a paid buyer unsure whether to pay again.')
card(488,140,418,160,'Creator friction','A payment link alone does not connect settlement, private delivery, purchase recovery and seller records.')
wrap(54,98,'PayLink connects the complete purchase: publishing, payment verification, private delivery and a reliable way back.',size=16,width=830)
c.showPage()
page('03 / MEZO INTEGRATION','Get MUSD at the point of checkout.','Wave 1: real x402 MUSD settlement. Wave 2 implementation: integrated BTC-to-MUSD funding via Mezo Pools.')
labels=['TEST BTC','MEZO POOLS','BUYER MUSD','x402 CHECKOUT'];xs=[54,273,492,711]
for x,l in zip(xs,labels):
 c.setFillColor(white);c.setStrokeColor(red);c.roundRect(x,235,195,66,9,fill=1,stroke=1);text(x+15,262,l,12,True)
 if x<700:text(x+201,260,'>',17,True,red)
wrap(54,190,'The buyer reviews BTC input, expected MUSD and minimum output. The app verifies router, pool, token pair and reserves, then requests exact approval and a separate swap.',size=15,width=830)
wrap(54,116,'LIVE SWAP CONFIRMED: 0.005 test BTC returned 392.9315077 MUSD on November 3. Receipt linked on /evidence.',size=12,color=red,width=830)
c.showPage()
page('04 / TECHNICAL DESIGN','Verification before delivery. Recovery before retry.','Next.js + TypeScript on Vercel; Supabase Auth, Postgres and private Storage.')
card(54,143,268,174,'Identity','Supabase verifies wallet sign-in. Protected server routes enforce ownership of products, orders and downloads.')
card(346,143,268,174,'Payment','Saved authorizations, settlement locks and global receipt claims bind payment to one product or plan order.')
card(638,143,268,174,'Delivery','After three confirmations and matching MUSD logs, buyers receive short-lived private download links.')
wrap(54,94,'A submitted payment that times out stays recoverable. The app does not automatically create a replacement charge.',size=14,width=830)
c.showPage()
page('05 / BUSINESS MODEL','Free to start. A paid plan for growing creators.','A concrete sustainability model paid in MUSD; no buyer surcharge and no automatic renewal.')
card(54,135,410,182,'FREE / 0 MUSD','Up to 3 products. Includes private files, checkout links, purchase recovery and seller receipts.')
card(488,135,418,182,'CREATOR / 3 MUSD for 30 days','Up to 25 products. Payment goes to the configured PayLink treasury. Entitlement activates once after verified settlement.')
wrap(54,91,'Existing products and buyer downloads remain accessible after expiry. Two 3 MUSD payments confirmed on chain; the builder verified activation and extension. Independent demand remains unproven.',size=12,color=red,width=830)
c.showPage()
page('06 / VERIFIABLE EVIDENCE','Wave 2 transactions, confirmed on chain.','Builder-controlled test wallets. Every hash opens its explorer receipt; full wallets and roles are on /evidence.')
y=300
for r in e['wave2Receipts']:
 amount=(r.get('inputAmount','')+' test BTC -> ' if r['kind']=='swap' else '')+r['amount']+' MUSD'
 text(54,y,r['title']+' / '+r['date'],13,True,red)
 text(54,y-20,amount,11)
 text(54,y-39,r['txHash'],9,color=muted)
 c.linkURL('https://explorer.test.mezo.org/tx/'+r['txHash'],(54,y-44,906,y+13),relative=0)
 y-=62
text(54,43,'Wave 1 history is retained on the public evidence page. No independent customer adoption is claimed.',10,color=muted)
c.showPage()
page('07 / NEXT STEPS AND LINKS','Prove the new flows with real users.','Keep a clear distinction between implemented code, automated checks and completed live acceptance.')
wrap(54,300,'1. Completed: checkout swap, 400 MUSD product payment, Creator activation and extension.',size=17,width=830)
wrap(54,247,'2. Run independent creator and buyer pilots; document friction, fixes and consented feedback.',size=17,width=830)
wrap(54,194,'3. Update the demo and evidence manifest before the Wave 2 submission.',size=17,width=830)
text(54,122,'Live evidence: /evidence   |   Source: github.com/Fuuaad05/paylink',13,True,red)
wrap(54,86,'Updated November 3, 2026. Confirmed testnet receipts and builder testing; independent pilots and production readiness remain outstanding.',width=830,size=11,color=muted)
c.showPage();c.save();print(out)
