import asyncio,pathlib,json,re,mimetypes
from urllib.parse import urlparse
from playwright.async_api import async_playwright
ROOT=pathlib.Path('/mnt/data/arcane-audit')
async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  for size in [1200,410]:
   for path,key in [('tests/browser-layout.html','layoutTest'),('index.html',''),('tests/browser-ui.html','uiTest'),('tests/browser-reset.html','resetUiTest'),('tests/browser-fusion-click.html','fusionClickTest')]:
    context=await browser.new_context(viewport={'width':size,'height':980});page=await context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    async def route(rt):
     fp=ROOT/urlparse(rt.request.url).path.lstrip('/')
     if fp.is_file():await rt.fulfill(status=200,body=fp.read_bytes(),content_type=mimetypes.guess_type(str(fp))[0] or 'application/octet-stream')
     else:await rt.abort()
    await page.route('https://arcane.test/**',route)
    try:
     await page.goto('https://arcane.test/'+path,wait_until='domcontentloaded',timeout=8000)
     await page.wait_for_timeout(2200)
     res=await page.evaluate('''k=>({result:k?document.body.dataset[k]:null,guide:document.body.innerText.includes('DUELLANTENHANDBUCH'),spread:document.querySelectorAll('.guide-spread').length,status:document.querySelector('#status')?.innerText?.slice(0,1000),details:document.querySelector('#result')?.innerText?.slice(0,1400)})''',key)
     print(size,path,json.dumps(res,ensure_ascii=False)[:1600],'js_errors',errors[:3],flush=True)
    except Exception as e:print(size,path,'ERR',str(e)[:500],flush=True)
    await context.close()
  await browser.close()
asyncio.run(main())
