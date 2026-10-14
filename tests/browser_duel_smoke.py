import asyncio,pathlib,re,mimetypes,json
from urllib.parse import urlparse
from playwright.async_api import async_playwright
ROOT=pathlib.Path('/mnt/data/arcane-audit')
async def run():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  for mode,size in [('desktop',{'width':1440,'height':920}),('mobile',{'width':390,'height':844})]:
   pg=await b.new_page(viewport=size); errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
   async def router(route):
    path=ROOT/urlparse(route.request.url).path.lstrip('/')
    if path.is_file():await route.fulfill(body=path.read_bytes(),content_type=mimetypes.guess_type(str(path))[0] or 'application/octet-stream')
    else:await route.abort()
   await pg.route('https://arcane.test/**',router)
   html=(ROOT/'index.html').read_text();html=re.sub(r'<script[^>]*src="[^"]+"[^>]*></script>','',html);html=re.sub(r'<link[^>]*rel="stylesheet"[^>]*>','',html);html=html.replace('<head>','<head><base href="https://arcane.test/">');await pg.set_content(html)
   await pg.evaluate("() => {const store={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>store[k]||null,setItem:(k,v)=>store[k]=String(v),removeItem:k=>delete store[k]}})}")
   for file in ['styles.css','visual-progression-v3.css','expansion.css','evolution.css','visual-v3.css','card-look-v3.css']:await pg.add_style_tag(content=(ROOT/'assets'/file).read_text())
   for file in ['art-engine.js','game.js','expansion.js','evolution.js']:await pg.add_script_tag(content=(ROOT/'assets'/file).read_text())
   await pg.evaluate("() => {hideModal();profile.guideSeen=true;profile.trainingWins=3;profile.cleared=[1];startDuel('pve',1,'free');hideModal();game.active=0;render()}")
   info={'hand':await pg.locator('#hand .hand-card').count()}
   await pg.locator('#hand .hand-card').first.click(force=True)
   info['pending']=await pg.evaluate('game.pending?.kind')
   await pg.locator('#ownRow button.monster-slot').first.click(force=True)
   info['summoned']=await pg.evaluate('!!game.players[0].field[0]')
   info['pendingCleared']=await pg.evaluate('!game.pending')
   await pg.evaluate('() => {saveDuelSnapshot();}')
   info['snapshotValid']=await pg.evaluate('() => !!validateDuelSnapshot(JSON.parse(JSON.stringify(profile.activeDuel)))')
   info['errors']=errors
   print(mode,json.dumps(info))
   await pg.close()
  await b.close()
asyncio.run(run())
