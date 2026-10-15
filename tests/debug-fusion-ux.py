import asyncio,pathlib,re,mimetypes
from urllib.parse import urlparse
from playwright.async_api import async_playwright
R=pathlib.Path('/mnt/data/arcane-audit')
async def run():
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  pg=await b.new_page(viewport={'width':1200,'height':980});pg.on('pageerror',lambda e:print('PAGEERROR',e))
  async def route(rt):
   f=R/urlparse(rt.request.url).path.lstrip('/')
   if f.is_file():await rt.fulfill(body=f.read_bytes(),content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
   else:await rt.abort()
  await pg.route('https://arcane.test/**',route)
  html=(R/'index.html').read_text();html=re.sub(r'<script[^>]*src="[^"]+"[^>]*></script>','',html);html=re.sub(r'<link[^>]*rel="stylesheet"[^>]*>','',html);html=html.replace('<head>','<head><base href="https://arcane.test/">');await pg.set_content(html)
  await pg.evaluate("() => { const d={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>d[k]||null,setItem:(k,v)=>{d[k]=String(v)},removeItem:k=>delete d[k]}}); }")
  for file in ['styles.css','visual-progression-v3.css','expansion.css','evolution.css','visual-v3.css','card-look-v3.css']:await pg.add_style_tag(content=(R/'assets'/file).read_text())
  for file in ['art-engine.js','game.js','expansion.js','evolution.js']:await pg.add_script_tag(content=(R/'assets'/file).read_text())
  print('game loaded, modal',await pg.locator('#modal').count())
  print('test',await pg.evaluate('''() => {
   const reports=[],check=(ok,msg)=>reports.push([msg,!!ok]);
   document.getElementById('guideClose')?.click();document.getElementById('helpDismiss')?.click();
   game=createGame({mode:'pve',starter:0,seed:13});game.materials=game.players[0].hand.slice(0,2).map(c=>c.uid);
   window.__fusionPicked=[];let p=game.players[0],m=p.hand.slice(0,2);chooseFusionModal(m.map(c=>dataOf(c).level),m,id=>window.__fusionPicked.push(id));
   const modal=document.getElementById('modal');
   check(modal?.classList.contains('fusion-choice-modal'),'Fusionsauswahl kompakt');
   check(!!modal?.querySelector('details.fusion-how:not([open])'),'Erklärung zu');
   check(!!modal?.querySelector('.fusion-forecast'),'Forecast');
   const card=modal?.querySelector('.fusion-choice-grid .fusion-pick-card[data-fusion-choice]');check(!!card,'Fusionspick');
   const id=Number(card?.dataset.fusionChoice);card?.querySelector('.hand-art img')?.click();
   check(window.__fusionPicked?.length===1&&window.__fusionPicked[0]===id,'Fusion picked by img');
   check(document.getElementById('overlay')?.classList.contains('hidden'),'closed');
   card?.click();check(window.__fusionPicked.length===1,'no 2 picks');
   menuTab='fusions';renderMenu();
   const picker=document.querySelector('.fusion-deck-pick-card[data-preview-card=\"'+fusionDraft[0]+'\"]');check(!!picker,'Fusionsdeck picker');
   const targetId=Number(picker?.dataset.previewCard);
   picker?.querySelector('.hand-art img')?.click();
   const pane=document.getElementById('deckSidePreview');
   check(!!pane&&pane.querySelector('.deck-preview-card'),'preview pane');
   check(!!pane&&pane.querySelector('.deck-preview-card .hand-card')?.getAttribute('aria-label')?.includes(CARDS[targetId].name),'selected correct');
   const before=fusionDraft.length, action=pane?.querySelector('[data-action="copy"]:not(:disabled)'),delta=Number(action?.dataset.delta||0);action?.click();
   check(!!delta&&fusionDraft.length===before+delta,'copy action');
   return {reports,detail:{before,delta,after:fusionDraft.length,pickerId:targetId,paneHtml:pane?.outerHTML.slice(0,200)}};
  }'''))
  await pg.close();await b.close()
asyncio.run(run())
