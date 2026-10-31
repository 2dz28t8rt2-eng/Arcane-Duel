'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const {createServer}=require('../server/main.cjs');
const output=path.resolve(process.env.ENTRY_QA_OUTPUT||'artifacts/online-entry');
const origin=process.env.ENTRY_QA_ORIGIN||'http://127.0.0.1:8759';
fs.mkdirSync(output,{recursive:true});
(async()=>{
 let local,browser,a,b;const checks=[],errors=[];
 const mark=text=>{checks.push(text);console.log(text);};
 try{
  if(!process.env.ENTRY_QA_ORIGIN){
   local=createServer({database:':memory:',origin});
   await new Promise(r=>local.server.listen(8759,'127.0.0.1',r));
  }
  browser=await chromium.launch({executablePath:process.env.CHROME||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true});
  const contexts=await Promise.all([browser.newContext(),browser.newContext()]);
  if(process.env.ENTRY_QA_CREDENTIALS){
   const profiles=JSON.parse(fs.readFileSync(process.env.ENTRY_QA_CREDENTIALS,'utf8'));
   for(let i=0;i<2;i++)await contexts[i].addInitScript(token=>localStorage.setItem('arcane-duel-duo-v171-profile-key',token),profiles[i].token);
  }
  [a,b]=await Promise.all(contexts.map(c=>c.newPage()));
  for(const p of [a,b]){p.setDefaultTimeout(15000);p.on('pageerror',e=>errors.push(e.message));}
  await Promise.all([a,b].map(p=>p.goto(origin+'/?show-title=1')));
  await a.locator('#ad196-title.ad196-ready').waitFor();
  await a.locator('[data-ad196-action="solo"]').click();
  await a.locator('#ad196-title').waitFor({state:'hidden'});
  for(const id of ['guideClose','helpDismiss'])if(await a.locator('#'+id).isVisible())await a.locator('#'+id).click();
  assert.equal(await a.locator('#onlineContinue230').isVisible(),false);
  await a.locator('#duoQuickInvite').click();
  await a.locator('#onlineContinue230').waitFor();
  const link=await a.locator('#onlineInviteLink230').inputValue();
  assert.equal(await a.locator('#onlineContinue230').isDisabled(),true);
  await a.locator('#onlineWaitingClose230').click();
  assert.equal(await a.locator('#onlineContinue230').isVisible(),false);
  mark('host can close invitation and keep the same invitation link');
  await a.goto(origin+'/?show-title=1');
  await a.waitForFunction(()=>window.ArcaneOnline230?.snapshot().state?.groupReleased===false);
  await a.locator('#ad196-title.ad196-ready').waitFor();
  await a.locator('[data-ad196-action="solo"]').click();
  await a.locator('#ad196-title').waitFor({state:'hidden'});
  assert.equal(await a.locator('#onlineContinue230').isVisible(),false);
  assert.equal(await a.evaluate(()=>document.getElementById('app').inert),false);
  mark('solo entry after reload does not reopen a saved host invitation');
  await a.locator('#duoQuickInvite').click();
  assert.equal(await a.locator('#onlineInviteLink230').inputValue(),link);
  await a.locator('#onlineWaitingClose230').click();
  await b.goto(link);
  await b.getByText('Du bist einer Gruppe beigetreten. Warte auf Host.',{exact:true}).waitFor();
  await a.waitForFunction(()=>window.ArcaneOnline230.snapshot().state?.status==='lobby');
  assert.equal(await a.locator('#onlineContinue230').isVisible(),false);
  assert.equal(await b.evaluate(()=>document.getElementById('app').inert),true);
  mark('guest waits while partner arrival leaves the host menu usable');
  await a.goto(origin+'/?show-title=1');
  await a.waitForFunction(()=>window.ArcaneOnline230?.snapshot().state?.status==='lobby');
  await a.locator('#ad196-title.ad196-ready').waitFor();
  await a.locator('[data-ad196-action="duo"]').click();
  await a.locator('#ad196-title').waitFor({state:'hidden'});
  await a.waitForFunction(()=>document.getElementById('onlineContinue230')?.disabled===false);
  await a.locator('#onlineWaitingClose230').click();
  await a.locator('#duoCampaignLab').click();
  await a.locator('#onlineContinue230').click();
  await Promise.all([a,b].map(p=>p.waitForFunction(()=>window.ArcaneOnline230.snapshot().state?.groupReleased===true)));
  await a.locator('#duoCampaignLab').click();
  await a.locator('[data-online-opponent="1"]').waitFor();
  await a.locator('#onlineClose230').click();
  await a.goto(origin+'/?show-title=1');
  await a.waitForFunction(()=>window.ArcaneOnline230?.snapshot().state?.groupReleased===true);
  await a.locator('#ad196-title.ad196-ready').waitFor();
  await a.locator('[data-ad196-action="duo"]').click();
  await a.locator('#ad196-title').waitFor({state:'hidden'});
  await a.locator('[data-online-opponent="1"]').click();
  await b.locator('#onlineDecline230').click();
  await a.waitForFunction(()=>window.ArcaneOnline230.snapshot().state.status==='lobby');
  mark('both real 2v2 buttons open usable group and duel dialogs');
  await a.setViewportSize({width:410,height:900});
  await a.locator('#duoCampaignLab').click();
  await a.locator('#onlineClose230').click();
  mark('duel menu can also be opened and closed on a narrow screen');
  await a.screenshot({path:path.join(output,'host-menu.png'),fullPage:true});
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({ok:true,checks,errors},null,2));
 }catch(e){
  for(const [name,p]of [['host',a],['guest',b]])if(p){await p.screenshot({path:path.join(output,name+'-failure.png'),fullPage:true}).catch(()=>{});}
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({ok:false,checks,errors,error:e.stack},null,2));throw e;
 }finally{await browser?.close();if(local){local.server.closeAllConnections();await new Promise(r=>local.server.close(r));local.store.close();}}
})().catch(e=>{console.error(e);process.exitCode=1;});
