#!/usr/bin/env python3
"""Arcane Duel 4.0: import genuinely sourced images and render W03-W09.
Never synthesize substitute illustrations and never alter the game balance.
"""
import argparse,base64,hashlib,html.parser,io,json,os,subprocess,sys,time,urllib.request,zipfile
from pathlib import Path
from PIL import Image,ImageOps,ImageDraw,ImageFilter
ROOT=Path(__file__).resolve().parents[1]
CAT=json.loads((ROOT/'assets/arcane-v4-catalog.json').read_text(encoding='utf-8'))
OUT=ROOT/'assets/finished-cards'
UA='Mozilla/5.0 (Arcane-Duel-4.0-asset-import; compatible)'
class DOM(html.parser.HTMLParser):
 def __init__(self):super().__init__();self.active=False;self.text=''
 def handle_starttag(self,tag,attrs):
  if tag=='script' and ('id','pngExport') in attrs:self.active=True
 def handle_endtag(self,tag):
  if tag=='script':self.active=False
 def handle_data(self,data):
  if self.active:self.text+=data
def acquire(row):
 req=urllib.request.Request(row['sourceFile'],headers={'User-Agent':UA,'Accept':'image/png,image/jpeg,image/webp,*/*','Referer':'https://opengameart.org/'})
 for attempt in range(3):
  try:
   with urllib.request.urlopen(req,timeout=45) as response:
    data=response.read(20_000_001)
   if not 500<len(data)<=20_000_000:raise ValueError('Unexpected source byte size')
   with Image.open(io.BytesIO(data)) as im:
    if im.format not in ('PNG','JPEG','WEBP'):raise ValueError('Unsupported image format')
    if im.width<96 or im.height<96:raise ValueError('Artwork too small for a card')
    im.load();return data,im.convert('RGBA')
  except Exception as e:
   print('Image import retry',row['id'],attempt+1,str(e),flush=True)
   if attempt==2:raise
   time.sleep(3*(attempt+1))
def make_art(im,id):
 # Uncropped creature depiction and dark vignette; do not invent new elements.
 source=ImageOps.contain(im,(990,990),Image.Resampling.LANCZOS)
 bg=Image.new('RGBA',(1024,1024),(9,14,30,255))
 d=ImageDraw.Draw(bg,'RGBA')
 d.ellipse((60,62,968,974),fill=(37,43,65,195),outline=(156,136,111,110),width=3)
 d.ellipse((100,100,924,924),outline=(138,115,167,55),width=2)
 xx=(1024-source.width)//2;yy=(1024-source.height)//2
 if source.getchannel('A').getextrema()[0]==255:
  border=Image.new('L',source.size,0)
  draw=ImageDraw.Draw(border);edge=max(6,min(source.size)//28)
  draw.rounded_rectangle((edge,edge,source.width-edge-1,source.height-edge-1),radius=edge,fill=255)
  source.putalpha(border.filter(ImageFilter.GaussianBlur(edge*1.1)))
 bg.alpha_composite(source,(xx,yy))
 return bg.convert('RGB')
def import_all():
 rows=CAT['externalArt'];success=[];failed=[]
 for row in rows:
  target=ROOT/row['artwork'];target.parent.mkdir(parents=True,exist_ok=True)
  if target.exists():
   with Image.open(target) as im:
    if im.format!='WEBP' or im.size!=(1024,1024):raise ValueError('Bad existing art: '+str(target))
   success.append(row['id']);continue
  try:
   original,src=acquire(row)
   out=make_art(src,row['id']);out.save(target,'WEBP',quality=92,method=6)
   with Image.open(target) as probe:
    assert probe.size==(1024,1024) and probe.format=='WEBP'
   print('IMPORTED',row['id'],target.name,target.stat().st_size,flush=True)
   success.append(row['id'])
  except Exception as e:
   failed.append({'id':row['id'],'error':str(e)})
   print('MISSING ORIGINAL:',row['id'],e,flush=True)
 report={'imported':success,'failed':failed}
 (ROOT/'assets/curated-openart-v4-import-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 print('OpenGameArt download status:',len(success),'/',len(rows),'images',flush=True)
 return len(success)==len(rows)
def source_exists(wave):
 return all((ROOT/c['art']).exists() for c in CAT['waves'][wave])
def build(waves):
 chrome=next((p for p in ['/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser'] if Path(p).exists()),None)
 if not chrome:raise RuntimeError('Chrome/Chromium unavailable')
 server=subprocess.Popen([sys.executable,'-m','http.server','8757','--bind','127.0.0.1'],cwd=ROOT,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
 try:
  time.sleep(2)
  total=0;ready=[]
  for wave in waves:
   rows=CAT['waves'][wave]
   if not source_exists(wave):
    print('DEFERRED WAVE',wave,'because original artwork not imported',flush=True);continue
   address='http://127.0.0.1:8757/tools/finished-card-renderer.html?wave='+wave
   cmd=[chrome,'--headless','--no-sandbox','--disable-gpu','--disable-dev-shm-usage','--no-first-run','--virtual-time-budget=120000','--window-size=1500,980','--dump-dom',address]
   raw=subprocess.run(cmd,stdout=subprocess.PIPE,stderr=subprocess.PIPE,timeout=180)
   doc=raw.stdout.decode('utf8','replace')
   if 'data-card-export="pass"' not in doc:
    import re,html
    match=re.search(r'<div id="message"[^>]*>(.*?)</div>',doc,re.S)
    print('RENDERER ERROR WAVE',wave,html.unescape(re.sub('<[^>]+>','',match.group(1))) if match else '(missing message)',flush=True)
    print('BROWSER DEBUG:',raw.stderr.decode('utf8','replace')[-1000:],flush=True)
    raise RuntimeError('Failed Chrome card renderer, wave '+wave)
   parser=DOM();parser.feed(doc)
   payload=json.loads(parser.text)
   if payload['status']!='ok' or payload['wave']!=wave or len(payload['cards'])!=len(rows):
    raise RuntimeError('Wave payload mismatch '+wave)
   dest=OUT/('wave'+wave);dest.mkdir(parents=True,exist_ok=True)
   meta=[]
   for actual,planned in zip(payload['cards'],rows):
    m=actual['metadata'];assert actual['id']==planned['id']==m['card']['id']
    assert m['card']['art']==planned['art']
    assert m['template']==planned['template'] and m['card']['level']==planned['level']
    filename='monster-'+str(actual['id']).zfill(4)+'.png'
    assert actual['filename']==filename
    png=base64.b64decode(actual['base64'])
    assert png[:8]==bytes.fromhex('89504e470d0a1a0a') and int.from_bytes(png[16:20],'big')==768 and int.from_bytes(png[20:24],'big')==1224
    (dest/filename).write_bytes(png)
    d=m['card']
    meta.append(dict(filename=filename,id=d['id'],name=d['name'],level=d['level'],atk=d['atk'],def_=d['def'],role=d['role'],element=d['element'],description=d['desc'],artwork=d['art'],frame=m['frame'],template=m['template']))
    meta[-1]['def']=meta[-1].pop('def_')
   sheet=base64.b64decode(payload['sheet'])
   assert sheet[:8]==bytes.fromhex('89504e470d0a1a0a')
   assert int.from_bytes(sheet[16:20],'big')==1300
   assert int.from_bytes(sheet[20:24],'big')==114+((len(rows)+4)//5)*507+12
   (dest/'kontaktbogen.png').write_bytes(sheet)
   prev=base64.b64decode(payload['preview'])
   assert prev[:4]==b'RIFF' and prev[8:12]==b'WEBP'
   (dest/'kontaktbogen-preview.webp').write_bytes(prev)
   (dest/'manifest.json').write_text(json.dumps({'schema':'arcane-finished-cards-wave'+wave,'count':len(meta),'cards':meta},ensure_ascii=False,indent=2)+'\n',encoding='utf8')
   with zipfile.ZipFile('/tmp/Arcane-Duel-Welle'+wave+'-4.0.zip','w',zipfile.ZIP_DEFLATED) as archive:
    for item in dest.iterdir():archive.write(item,item.name)
   print('RENDERED',wave,len(rows),'cards',flush=True)
   ready.append(wave);total+=len(rows)
  (ROOT/'assets/arcane-v4-render-status.json').write_text(json.dumps({'waveCounts':{w:len(CAT['waves'][w]) for w in ready},'rendered':total,'expected':94},indent=2)+'\n',encoding='utf8')
  print('V4 PNG CREATED',total,'of 94; waves:',','.join(ready),flush=True)
 finally:server.terminate();server.wait(timeout=10)
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('action',choices=['import','render']);p.add_argument('--waves',nargs='*',default=list(CAT['waves']));args=p.parse_args()
 if args.action=='import':import_all()
 else:build(args.waves)
