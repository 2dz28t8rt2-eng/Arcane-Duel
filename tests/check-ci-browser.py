from pathlib import Path
import threading,http.server,functools,asyncio,json
from playwright.async_api import async_playwright
root=Path('/mnt/data/arcane-audit')
Handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(root))
server=http.server.ThreadingHTTPServer(('127.0.0.1',8757),Handler)
threading.Thread(target=server.serve_forever,daemon=True).start()
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--disable-gpu'])
  for size in [1200,410]:
   for path,key in [('tests/browser-layout.html','layoutTest'),('index.html',''),('tests/browser-ui.html','uiTest'),('tests/browser-reset.html','resetUiTest'),('tests/browser-fusion-click.html','fusionClickTest')]:
    pg=await b.new_page(viewport={'width':size,'height':980});errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
    try:
     await pg.goto('http://127.0.0.1:8757/'+path,wait_until='domcontentloaded',timeout=30000)
     await pg.wait_for_timeout(2400)
     data=await pg.evaluate('''k=>({result:k?document.body.dataset[k]:null,guide:document.body.innerText.includes('DUELLANTENHANDBUCH'),spread:document.querySelectorAll('.guide-spread').length,message:document.querySelector('#status')?.innerText?.slice(0,600),resultText:document.querySelector('#result')?.innerText?.slice(0,1000)})''',key)
     print(size,path,json.dumps(data,ensure_ascii=False),errors[:2],flush=True)
    except Exception as e:print(size,path,'ERR',str(e)[:200],flush=True)
    await pg.close()
  await b.close()
asyncio.run(main());server.shutdown()
