'use strict';
// Real Chromium hit-testing and full-motion regression. The fixture is local only.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {fixture}=require('../tests/helpers/duo-online-fixture-v221.cjs');
const root=path.resolve(__dirname,'..'),backend=fixture(),output=process.env.DUO_QA_OUTPUT||'/tmp/duo-v230-browser';
fs.mkdirSync(output,{recursive:true});
const endpoint='https://cvmtmvruutdneyblumgf.supabase.co/functions/v1/arcane-duo-v2';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.ogg':'audio/ogg','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{const file=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);});
const state=page=>page.evaluate(()=>window.ArcaneDuoParty218.state());
const refresh=page=>page.evaluate(()=>window.ArcaneDuoParty218.refresh());
const waitStatus=(page,status)=>page.waitForFunction(v=>window.ArcaneDuoParty218?.state().game?.status===v,status);
const report={checks:[],pageErrors:[],hand:[]};
(async()=>{
 await new Promise(r=>server.listen(8759,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME?{executablePath:process.env.CHROME}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 async function client(name,url='/duo-campaign-v2.html'){
  const context=await browser.newContext({viewport:{width:1500,height:1080},reducedMotion:'no-preference'});
  await context.addInitScript(()=>{localStorage.setItem('arcane-duel-rpg-profile-v4-reborn','solo-sentinel-230');localStorage.setItem('arcane-duo-motion-v221','full');});
  await context.route(endpoint,async route=>{
   const headers={'access-control-allow-origin':'http://localhost:8759','access-control-allow-headers':'Content-Type','access-control-allow-methods':'POST,OPTIONS'};
   if(route.request().method()==='OPTIONS')return route.fulfill({status:200,headers,body:'{}'});
   try{await route.fulfill({status:200,headers,contentType:'application/json',body:JSON.stringify(backend.handle(route.request().postDataJSON()))});}
   catch(e){await route.fulfill({status:400,headers,contentType:'application/json',body:JSON.stringify({error:e.message})});}
  });
  const page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>report.pageErrors.push(e.message));
  await page.goto('http://localhost:8759'+url);
  await page.waitForFunction(()=>window.ArcaneDuoParty218?.state().catalogReady&&!document.getElementById('duoNameConfirm').disabled);
  await page.locator('#duoNameInput').fill(name);await page.locator('#duoNameConfirm').click();
  await page.waitForFunction(()=>window.ArcaneDuoParty218.state().nameConfirmed);return page;
 }
 let A,B;
 try{
  A=await client('QA230 Host');await A.locator('#duoInvitePlayer').click();await waitStatus(A,'waiting');
  const s=await state(A);B=await client('QA230 Gast','/duo-campaign-v2.html?join='+s.roomId+'.'+s.invite);
  await B.locator('#duoPartyAccept').click();await waitStatus(B,'lobby');await refresh(A);
  await A.locator('#duoMenuStart').click();await refresh(B);await B.locator('#duoStartAccept').click();await waitStatus(B,'active');await refresh(A);
  for(const page of [A,B]){
   await page.waitForFunction(()=>!document.querySelector('.ad216-dialog-overlay,.ad-battle-intro')&&!document.getElementById('duoBattleArena').classList.contains('duo178-intro-active')&&!document.getElementById('duoBattleArena').classList.contains('duo178-revealing'),null,{timeout:45000});
   assert.equal(await page.locator('.duo178-hand-card').count(),5);
  }
  const before=await state(A);report.profiles=[before.profile.id,(await state(B)).profile.id];
  for(const width of [1500,410]){
   await A.setViewportSize({width,height:1080});
   for(let index=0;index<5;index++){
    const face=A.locator('.duo178-hand-card[data-index="'+index+'"]>.hand-card');await face.scrollIntoViewIfNeeded();
    const measure=await face.evaluate(n=>{const a=n.getBoundingClientRect(),b=n.parentElement.getBoundingClientRect();const hit=document.elementFromPoint(a.left+a.width*.5,a.top+a.height*.55);return {faceWidth:a.width,hitWidth:b.width,index:n.parentElement.dataset.index,hit:hit?.closest('.duo178-hand-card')?.dataset.index};});
    const rect=await face.boundingBox();await A.mouse.click(rect.x+rect.width*.5,rect.y+rect.height*.55);
    const selected=await A.locator('[data-ad189-hand]').inputValue();report.hand.push({width,index,...measure,selected});
   }
  }
  await A.screenshot({path:path.join(output,'interaction-mobile.png'),fullPage:true});
  assert.ok(report.hand.every(x=>x.hit===String(x.index)&&x.selected===String(x.index)),JSON.stringify(report.hand));
  report.checks.push('actual pointer coordinates choose exactly the visible hand card on desktop and mobile');
  assert.equal((await state(A)).profile.revision,before.profile.revision);
  assert.equal(await A.evaluate(()=>localStorage.getItem('arcane-duel-rpg-profile-v4-reborn')),'solo-sentinel-230');
  assert.deepEqual(report.pageErrors,[]);report.pass=true;
 }catch(e){report.pass=false;report.error=e.stack;if(A)await A.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});throw e;}
 finally{fs.writeFileSync(path.join(output,'interaction-report.json'),JSON.stringify(report,null,2));await browser.close();server.close();}
 console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
