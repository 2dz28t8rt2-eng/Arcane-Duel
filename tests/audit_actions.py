import asyncio,re,mimetypes,pathlib,json
from playwright.async_api import async_playwright
ROOT=pathlib.Path('/mnt/data/arcane-audit')
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  pg=await b.new_page();errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
  html=(ROOT/'index.html').read_text();html=re.sub(r'<script[^>]*src="[^"]+"[^>]*></script>','',html);html=re.sub(r'<link[^>]*rel="stylesheet"[^>]*>','',html)
  await pg.set_content(html)
  await pg.evaluate("() => {const d={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>d[k]||null,setItem:(k,v)=>d[k]=String(v),removeItem:k=>delete d[k]}})}")
  for file in ['art-engine.js','game.js','expansion.js','evolution.js']:
   await pg.add_script_tag(content=(ROOT/'assets'/file).read_text())
  result=await pg.evaluate('''() => {
   hideModal();profile.guideSeen=true;profile.inventory[0]=40;profile.coins=10000;profile.favorites=[];profile.rewardQueue=[];profile.openPack=null;
   const before=profile.inventory[0];showSell(0);const confirm=$('sellConfirm'),handler=confirm.onclick;handler();handler();const after=profile.inventory[0];
   profile.inventory[0]=40;profile.enhancements[0]=0;showCopyAscension(0);const a=$('ascendConfirm'),fn=a.onclick;fn();fn();const rank=profile.enhancements[0];
   profile.inventory[0]=40;showSalvage(0);const c=$('salvageConfirm'),sf=c.onclick;sf();sf();const salvageCount=profile.inventory[0];
   return {before,after,sold:before-after,rank,salvageCount,errors:null,profileCoins:profile.coins};
  }''')
  print('Modal confirmations:',result,'browsererrors:',errors)
  await b.close()
asyncio.run(main())
