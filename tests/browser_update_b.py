import asyncio,pathlib,json,re,mimetypes
from urllib.parse import urlparse
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).resolve().parent.parent; OUT=ROOT
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
  for label,view in [('desktop',{'width':1440,'height':900}),('mobile',{'width':390,'height':844})]:
   ctx=await b.new_context(viewport=view); page=await ctx.new_page();errors=[];network=[];page.on('pageerror',lambda e:errors.append(str(e)))
   async def route(req):
    f=ROOT/urlparse(req.request.url).path.lstrip('/')
    if f.is_file(): await req.fulfill(body=f.read_bytes(),content_type=mimetypes.guess_type(str(f))[0] or 'application/octet-stream')
    else: network.append(str(f.relative_to(ROOT)));await req.abort()
   await page.route('https://arcane.test/**',route)
   html=(ROOT/'index.html').read_text();html=re.sub(r'<script[^>]*src="[^"]+"[^>]*></script>','',html);html=re.sub(r'<link[^>]*rel="stylesheet"[^>]*>','',html);html=html.replace('<head>','<head><base href="https://arcane.test/">');await page.set_content(html)
   await page.evaluate("() => { const d={};Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>d[k]||null,setItem:(k,v)=>{d[k]=String(v)},removeItem:k=>delete d[k],key:i=>Object.keys(d)[i],get length(){return Object.keys(d).length;}}}); }")
   for file in ['styles.css','visual-progression-v3.css','expansion.css','evolution.css','visual-v3.css','card-look-v3.css']:
    await page.add_style_tag(content=(ROOT/'assets'/file).read_text())
   for file in ['art-engine.js','game.js','expansion.js','evolution.js']:
    await page.add_script_tag(content=(ROOT/'assets'/file).read_text())
   res={'tabs':{},'errors':errors,'network':network}
   await page.evaluate("() => {hideModal();profile.guideSeen=true;profile.trainingWins=3;profile.cleared=[1,2,3];renderMenu()}")
   for tab in ['tournament','free','collection','fusions','decks','packs','challenges','lexicon','upgrades','stats','shop','xp','settings']:
    try:
     await page.evaluate('(tab)=>{menuTab=tab;renderMenu();}',tab)
     res['tabs'][tab]=await page.locator('#menuContent').evaluate("e=>({length:e.innerHTML.length,buttons:e.querySelectorAll('button').length})")
    except Exception as e:res['tabs'][tab]=str(e)[:220]
   await page.evaluate("() => {menuTab='collection';renderMenu()}")
   deck={}
   deck['before']=await page.locator('#deckSidePreview').count()
   deck['cards']=await page.locator('[data-preview-card]').count()
   cards=page.locator('[data-preview-card]')
   if await cards.count()>1:
    # Real user behavior: search filter + scroll should survive selecting a card
    await page.locator('#cardSearch').fill('Sumpf')
    filtered_before=await page.locator('#filterCount').text_content()
    await cards.nth(1).click(force=True)
    deck['searchAfterClick']=await page.locator('#cardSearch').input_value()
    deck['filteredBefore']=filtered_before
    deck['filteredAfter']=await page.locator('#filterCount').text_content()
    deck['after']=await page.locator('#deckSidePreview').count()
    deck['previewName']=await page.locator('#deckSidePreview h3').first.text_content()
    deck['controls']=await page.locator('#deckSidePreview [data-action]').count()
    deck['cardSize']=await page.locator('#deckSidePreview .hand-card').evaluate('e=>({h:e.offsetHeight,w:e.offsetWidth,art:e.querySelector(".hand-art")?.offsetHeight})')
    # check has distinct element data
    deck['level']=await page.locator('#deckSidePreview .card-level-badge').count()
    deck['oldDescription']=await page.locator('#deckSidePreview .hand-description').count()
   res['deck']=deck
   # ensure different card type samples loading
   res['art']=await page.evaluate("() => {const cs=[CARDS[0], CARDS.find(x=>x.fusionOnly&&!x.ace), CARDS.find(x=>x.ace&&!x.fusionOnly), CARDS.find(x=>x.ace&&x.fusionOnly)].filter(Boolean); const d=document.createElement('div');d.id='auditSamples';d.style.cssText='display:flex;gap:20px;max-width:100%;overflow:auto';d.innerHTML=cs.map(c=>fullCardHtml(c)).join('');document.body.prepend(d); return cs.map(c=>({id:c.id,element:c.element,lv:c.level,ace:c.ace,fusion:c.fusionOnly}));}")
   await page.wait_for_timeout(500)
   res['artImg']=await page.locator('#auditSamples img').evaluate_all('(els)=>els.map(e=>({loaded:e.complete&&e.naturalWidth>0,type:e.getAttribute("src")?.slice(0,20)}))')
   res['layout']=await page.evaluate('''() => ({xscroll:document.documentElement.scrollWidth>window.innerWidth, width:document.documentElement.scrollWidth,window:window.innerWidth,cards:[...document.querySelectorAll('#auditSamples .hand-card')].map(e=>({cls:e.className,h:e.offsetHeight,art:e.querySelector('.hand-art').offsetHeight,border:getComputedStyle(e).borderColor}))})''')
   await page.screenshot(path=str(OUT/f'Arcane-Update-B-{label}.png'),full_page=False)
   print(label,json.dumps(res,ensure_ascii=False)[:7000])
   await ctx.close()
  await b.close()
asyncio.run(main())
