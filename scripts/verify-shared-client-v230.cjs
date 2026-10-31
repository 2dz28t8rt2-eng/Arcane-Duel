'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{createServer}=require('../server/main.cjs');
const output=path.resolve(process.env.DUO_QA_OUTPUT||'../shared-client-v230');fs.mkdirSync(output,{recursive:true});
const origin='http://127.0.0.1:8758';
(async()=>{
 const {server,store}=createServer({database:':memory:',origin});await new Promise(r=>server.listen(8758,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME||(process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true});
 const errors=[],checks=[];let a,b;
 const mark=text=>{checks.push(text);console.log(text);};
 const watchdog=setTimeout(()=>{console.error('Browser verification exceeded six minutes');process.exit(1);},360000);
 try{
  const contexts=await Promise.all([browser.newContext({viewport:{width:1500,height:1000}}),browser.newContext({viewport:{width:1500,height:1000}})]);
  [a,b]=await Promise.all(contexts.map(c=>c.newPage()));
  for(const p of [a,b]){p.setDefaultTimeout(25000);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!m.text().includes('404'))errors.push(m.text());});}
  await Promise.all([a.goto(origin),b.goto(origin)]);await Promise.all([a,b].map(p=>p.waitForFunction(()=>!!window.ArcaneOnline230)));
  console.log('original pages loaded');
  await Promise.all([a,b].map(p=>p.evaluate(()=>window.ArcaneTitleGate.close())));
  console.log('title gates closed');
  for(const [p,coins,name]of [[a,111,'Host'],[b,222,'Partner']])await p.evaluate(async({coins,name})=>{
   await window.ArcaneOnline230.connect();profile.coins=coins;profile.duelistName=name;profile.activeDeck.reverse();saveProfile();await window.ArcaneOnline230.flush();
  },{coins,name});
  mark('personal menu changes synchronize to separate original-format saves');
  await a.evaluate(()=>window.ArcaneOnline230.invitePlayer());
  assert.equal(await a.locator('#onlineContinue230').isDisabled(),true);
  const link=await a.locator('#onlineInviteLink230').inputValue();await b.goto(link);
  await b.getByText('Du bist einer Gruppe beigetreten. Warte auf Host.',{exact:true}).waitFor();
  mark('guest waits for host');
  await a.locator('#onlineContinue230').waitFor();await a.waitForFunction(()=>!document.getElementById('onlineContinue230').disabled);await a.locator('#onlineContinue230').click();
  await Promise.all([a,b].map(p=>p.waitForFunction(()=>window.ArcaneOnline230.snapshot().state?.groupReleased===true)));
  await a.evaluate(()=>window.ArcaneOnline230.duelMenu());await a.locator('[data-online-opponent="1"]').click();
  await b.locator('#onlineDecline230').click();await a.waitForFunction(()=>window.ArcaneOnline230.snapshot().state.status==='lobby');
  mark('declined invitation preserves original menus');
  await a.evaluate(()=>window.ArcaneOnline230.duelMenu());await a.locator('[data-online-opponent="1"]').click();await b.locator('#onlineAccept230').click();
  await Promise.all([a,b].map(p=>p.waitForFunction(()=>typeof game!=='undefined'&&game?.online230&&!window.ArcaneOnlineBattle230.playing())));
  for(const p of [a,b]){assert.equal(await p.locator('#ownRow [data-mine]').count(),7);assert.equal(await p.locator('#enemyRow [data-enemy]').count(),7);}
  mark('original duel uses seven zones per team');
  const states=await Promise.all([a,b].map(p=>p.evaluate(()=>({seat:window.ArcaneOnline230.snapshot().seat,network:window.ArcaneOnline230.snapshot().state,hand:game.players[0].hand.map(c=>c.id)}))));
  assert.ok(states[0].network.players[2].hand.every(c=>c===null));assert.ok(states[1].network.players[0].hand.every(c=>c===null));
  assert.deepEqual(states[1].hand,states[1].network.players[2].hand.map(c=>typeof c==='number'?c:c.id));checks.push('each original hand displays only its own cards');
  await a.waitForFunction(()=>inputAllowed());
  const first=a.locator('#hand [data-hand]').first(),uid=await first.getAttribute('data-hand');await first.click();
  const selected=await a.evaluate(()=>({uid:game.pending?.card.uid||game.selection?.uid}));assert.equal(String(selected.uid),uid);
  if(!await a.evaluate(()=>!!game.pending))await a.locator('#summonBtn').click();
  await a.locator('#ownRow [data-mine="0"]').click();await a.waitForFunction(()=>window.ArcaneOnline230.snapshot().state.players[0].field[0]&&!window.ArcaneOnlineBattle230.playing());
  mark('clicked card is selected and summoned through original controls');
  await a.locator('#endTurnBtn').click();await b.waitForFunction(()=>window.ArcaneOnline230.snapshot().state.activeSeat===2&&!window.ArcaneOnlineBattle230.playing());
  mark('host and NPC turns advance to partner');
  await b.locator('#hand [data-hand]').nth(0).click({button:'right'});await b.locator('#hand [data-hand]').nth(1).click({button:'right'});
  await b.keyboard.press('f');await b.locator('[data-fusion-choice]').first().click();
  await b.locator('#ownRow .empty').first().click();
  await b.waitForFunction(()=>window.ArcaneOnline230.snapshot().state.players[2].fusionsPerformed===1&&!window.ArcaneOnlineBattle230.playing(),null,{timeout:45000});
  mark('original material selection and complete fusion ritual');
  const attackSlot=await b.evaluate(()=>game.players[0].field.findIndex(c=>c?.onlineSeat===2));
  await b.locator('#ownRow [data-mine="'+attackSlot+'"]').click();
  const target=await b.evaluate(()=>game.players[1].field.findIndex(Boolean));
  if(target>=0)await b.locator('#enemyRow [data-enemy="'+target+'"]').click();else await b.locator('#directBtn').click();
  await b.waitForFunction(()=>window.ArcaneOnline230.snapshot().state.players[2].soloMetrics?.attacks===1&&!window.ArcaneOnlineBattle230.playing(),null,{timeout:45000});
  mark('original field attack completes its animation and confirmed server action');
  await b.setViewportSize({width:410,height:900});
  await b.screenshot({path:path.join(output,'mobile-duel.png'),fullPage:true});
  await b.setViewportSize({width:1500,height:1000});
  await a.screenshot({path:path.join(output,'host-duel.png'),fullPage:true});await b.screenshot({path:path.join(output,'partner-duel.png'),fullPage:true});
  await b.locator('.ad182-advanced > summary').click();await b.locator('#surrenderBtn').click();await b.locator('#surrenderConfirm').click();
  await Promise.all([a,b].map(p=>p.waitForFunction(()=>game?.finishShown)));
  const profiles=await Promise.all([a,b].map(p=>p.evaluate(()=>({profile:JSON.parse(JSON.stringify(profile)),id:window.ArcaneOnline230.snapshot()}))));
  assert.equal(profiles[0].profile.losses,1);assert.equal(profiles[1].profile.losses,1);assert.notEqual(profiles[0].id.seat,profiles[1].id.seat);checks.push('original surrender result and independent saves');
  assert.equal(profiles[0].profile.coins,111);assert.equal(profiles[1].profile.coins,222);
  await b.reload();await b.waitForFunction(()=>window.ArcaneOnline230?.snapshot().ready);assert.equal(await b.evaluate(()=>profile.coins),222);
  mark('reload restores the same personal progress without copying the teammate');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({ok:true,checks,errors},null,2));console.log(JSON.stringify({ok:true,checks}));
 }catch(e){for(const [name,p]of [['host',a],['guest',b]])if(p){await p.screenshot({path:path.join(output,name+'-failure.png'),fullPage:true}).catch(()=>{});fs.writeFileSync(path.join(output,name+'-failure.html'),await p.content());}
  const debug=await Promise.all([a,b].map(p=>p?.evaluate(()=>({state:window.ArcaneOnline230?.snapshot(),game:typeof game!=='undefined'?game:null,busy:typeof busy!=='undefined'?busy:null,modal:document.getElementById('modal')?.innerText})).catch(()=>null)));
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({ok:false,checks,errors,error:e.stack,debug},null,2));throw e;
 }finally{clearTimeout(watchdog);await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));store.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
