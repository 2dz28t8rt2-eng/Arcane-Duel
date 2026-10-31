'use strict';
/* Engineering QA in two real, isolated Chromium contexts. No production bypasses.
 * --live uses the deployed endpoint; default uses the deterministic HTTP test double.
 * Tokens, recovery links and storage dumps are never logged or captured as artifacts. */
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),vm=require('node:vm');
const {fixture}=require('../tests/helpers/duo-online-fixture-v221.cjs');
const root=path.resolve(__dirname,'..'),live=process.argv.includes('--live'),backend=fixture();
const snapshot=require('../assets/duo-card-catalog-v160.json'),catalog=Object.fromEntries(snapshot.cards.map(c=>[c.id,c]));
const output=process.env.DUO_QA_OUTPUT||'/tmp/duo-v221-browser';fs.mkdirSync(output,{recursive:true});
const endpoint='https://cvmtmvruutdneyblumgf.supabase.co/functions/v1/arcane-duo-v2';
const prefix=live?'live':'fixture',pageErrors=[];
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{
 const name=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
 if(!name.startsWith(root+path.sep)||!fs.existsSync(name)||!fs.statSync(name).isFile()){res.writeHead(404);res.end();return;}
 res.setHeader('Content-Type',mime[path.extname(name)]||'application/octet-stream');fs.createReadStream(name).pipe(res);
});
async function state(page){return page.evaluate(()=>window.ArcaneDuoParty218.state());}
async function refresh(page){await page.evaluate(()=>window.ArcaneDuoParty218.refresh());}
async function status(page,value){await page.waitForFunction(v=>window.ArcaneDuoParty218?.state().game?.status===v,value);}
async function route(page,section){
 const group={menu:'play',quests:'play',deck:'deck',fusions:'deck',shop:'growth',upgrades:'growth',collection:'growth',progress:'growth',profile:'options',settings:'options',rules:'options'}[section];
 await page.locator('[data-fm-group="'+group+'"]').click();
 const id='duoSoloTab'+section[0].toUpperCase()+section.slice(1);if(section!=='menu'&&section!=='deck'&&section!=='collection'&&section!=='profile')await page.locator('#'+id).click();
}
async function newClient(browser,url,name){
 const context=await browser.newContext({viewport:{width:1500,height:1080}});
 await context.addInitScript(()=>{
  if(!localStorage.getItem('arcane-duel-rpg-profile-v4-reborn'))localStorage.setItem('arcane-duel-rpg-profile-v4-reborn','solo-sentinel-221');
  localStorage.setItem('arcane-duo-motion-v221','reduced');
 });
 if(!live)await context.route(endpoint,async route=>{
  if(route.request().method()==='OPTIONS'){await route.fulfill({status:200,headers:{'access-control-allow-origin':'http://localhost:8757','access-control-allow-headers':'Content-Type','access-control-allow-methods':'POST,OPTIONS'},body:'{}'});return;}
  try{await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(backend.handle(route.request().postDataJSON()))});}
  catch(e){await route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:e.message})});}
 });
 const page=await context.newPage();page.setDefaultTimeout(20000);page.on('pageerror',e=>pageErrors.push(e.message));page.on('dialog',d=>d.accept());
 await page.goto(url);await page.waitForFunction(()=>window.ArcaneDuoParty218?.state().catalogReady&&!document.getElementById('duoNameConfirm').disabled);
 await page.locator('#duoNameInput').fill(name);await page.locator('#duoNameConfirm').click();await page.waitForFunction(()=>window.ArcaneDuoParty218.state().nameConfirmed);
 return {context,page};
}
// Offline-only access to existing AI choice helpers. The bot receives only its
// own server-redacted view and submits ordinary authenticated actions.
function bot(){
 const text=fs.readFileSync(path.join(root,'assets/duo-shared-rules-v160.js'),'utf8').replace('return Object.freeze({version:', 'return Object.freeze({npcSummonChoice,npcTacticalChoice,npcDefenseSwitch,version:');
 const context={module:{exports:{}},console,Date,Math,structuredClone};vm.runInNewContext(text,context);return context.module.exports;
}
async function finishLiveDuel(A,B){
 const decisions=bot();let lastTurn=-1,steps=0,actions=0,g;
 for(;actions<260;actions++){
  await refresh(A);g=(await state(A)).game;if(g.status==='finished')break;
  const page=g.activeSeat===0?A:B;await refresh(page);g=(await state(page)).game;
  assert.ok([0,2].includes(g.activeSeat),'Edge must finish both NPC turns');
  if(g.turn!==lastTurn){steps=0;lastTurn=g.turn;}
  const seat=g.activeSeat,view=structuredClone(g);view.uid=1000000;view.rngSeed=221;
  let action=steps++>18?{type:'end'}:decisions.npcSummonChoice(view,seat,catalog)||decisions.npcDefenseSwitch(view,seat)||decisions.npcTacticalChoice(view,seat,catalog)||{type:'end'};
  const revision=g.revision;await page.evaluate(a=>window.ArcaneDuoParty218.send(a),action);
  if((await state(page)).game.revision===revision){await refresh(page);await page.evaluate(()=>window.ArcaneDuoParty218.send({type:'end'}));}
 }
 assert.equal(g.status,'finished','A complete live duel must reach an authoritative result');
 await refresh(A);await refresh(B);assert.deepEqual((await state(A)).game.teams,(await state(B)).game.teams);
 return {actions,winner:g.winner,rounds:g.round,chapter:g.chapter,duelNo:g.duelNo};
}
(async()=>{
 await new Promise(resolve=>server.listen(8757,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,...(process.env.CHROME?{executablePath:process.env.CHROME}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
 let a,b;const report={mode:prefix,checks:[]};
 try{
  const tag=Date.now().toString(36);a=await newClient(browser,'http://localhost:8757/duo-campaign-v2.html','QA221 Host '+tag);
  const A=a.page;await A.locator('#duoPartyCreate').click();await status(A,'waiting');await A.locator('#duoPartyEnter').click();
  await A.locator('#duoMenuScreen').waitFor({state:'visible'});assert.equal(await A.locator('#duoMenuStart').isDisabled(),true);
  await route(A,'deck');assert.equal(await A.locator('[data-deck-slot]').count(),40);await A.locator('#duoDeckSearch').fill('Asche');
  await A.screenshot({path:path.join(output,prefix+'-waiting-deck.png')});report.checks.push('waiting host: full menu, forty deck slots, start blocked');
  const party=await state(A);b=await newClient(browser,'http://localhost:8757/duo-campaign-v2.html?join='+party.roomId+'.'+party.invite,'QA221 Gast '+tag);
  const B=b.page;await B.locator('#duoPartyAccept').waitFor({state:'visible'});assert.equal((await state(B)).game,null);
  await B.locator('#duoPartyAccept').click();await status(B,'lobby');assert.equal(await B.locator('#duoPartyGate').isVisible(),true);
  await B.locator('#duoPartyEnter').click();await route(B,'shop');await refresh(A);
  assert.equal(await A.locator('#duoPage').getAttribute('data-lobby-section'),'deck');assert.equal(await B.locator('#duoPage').getAttribute('data-lobby-section'),'shop');
  await A.locator('#duoDeckSearch').focus();await refresh(A);await refresh(B);assert.equal(await A.locator('#duoDeckSearch').inputValue(),'Asche');assert.equal(await A.locator('#duoDeckSearch').evaluate(n=>n===document.activeElement),true);
  report.checks.push('explicit group acceptance and enter; independent deck/shop/search/focus');
  await route(A,'menu');await A.locator('#duoMenuStart').click();await status(A,'party_ready');await refresh(B);
  assert.equal(await B.locator('#duoStartNotice').getAttribute('role'),'dialog');assert.match(await B.locator('#duoStartNoticeTitle').innerText(),/QA221 Host/);
  await B.screenshot({path:path.join(output,prefix+'-invitation.png')});await B.locator('#duoStartDecline').click();await status(B,'lobby');await refresh(A);
  assert.equal(await B.locator('#duoPage').getAttribute('data-lobby-section'),'shop');
  await A.locator('#duoMenuStart').click();await status(A,'party_ready');await refresh(B);await B.locator('#duoStartLater').click();
  assert.equal(await B.locator('#duoPage').evaluate(n=>n.inert),false);await A.locator('#duoStartCancel').click();await status(A,'lobby');await refresh(B);
  report.checks.push('host invite popup, decline, prepare, cancel: no duel or route reset');
  await route(B,'menu');await B.locator('#duoMenuStart').click();await status(B,'party_ready');await refresh(A);
  assert.match(await A.locator('#duoStartNoticeTitle').innerText(),/QA221 Gast/);
  // Verify wrong-seat consent at the real server boundary using the initiator's own credentials.
  const denied=await B.evaluate(async endpoint=>{
   const s=window.ArcaneDuoParty218.state(),session=JSON.parse(sessionStorage.getItem('arcane-duo-v2-session-'+s.roomId));
   const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'action',roomId:s.roomId,token:session.token,expectedRevision:s.game.revision,action:{type:'acceptPartyStart',inviteId:s.game.partyStartInvite.id}})});return r.status;
  },endpoint);assert.equal(denied,400);
  await A.locator('#duoStartAccept').dblclick();await status(A,'active');await refresh(B);await status(B,'active');
  const started=(await state(A)).game;assert.ok(started.duelNo>1);
  for(const page of [A,B]){
   assert.equal(await page.locator('#duoSeats .seat').count(),4);assert.equal(await page.locator('#duoSeats .seat>.field>.field-cell').count(),28);
   assert.equal(await page.locator('#duoBattleInspector').isVisible(),true);assert.equal(await page.locator('#duoSeats .duo178-hand-card').count(),5);
   const s=await state(page);assert.ok(s.game.players[s.seat===0?2:0].hand.every(x=>x===null));assert.equal(s.game.rngSeed,undefined);
   assert.equal(s.game.teams[0].maxLp,4000);
  }
  assert.equal(await B.locator('#duoSeats [data-perspective="self"]').getAttribute('data-seat'),'2');
  report.checks.push('guest invite, wrong-seat denied, double-click single start, 28 zones, LP, private hands, guest perspective');
  const empty=A.locator('#duoSeats [data-seat="0"]>.field>.field-cell[data-slot="6"]');
  await A.locator('.duo178-hand-card[data-index="0"]').click();await empty.click();await A.locator('#ad189-summon-guide .ad189-guide-confirm').click();
  await A.waitForFunction(()=>!!window.ArcaneDuoParty218.state().game.players[0].field[6]);await refresh(B);
  assert.equal((await state(A)).game.players[0].field[6].uid,(await state(B)).game.players[0].field[6].uid);
  await A.keyboard.press('d');await A.waitForFunction(()=>window.ArcaneDuoParty218.state().game.players[0].field[6].mode==='def');
  await empty.click();await A.locator('#duoLargeCardPreview .hand-card').waitFor({state:'visible'});
  await A.screenshot({path:path.join(output,prefix+'-battle-desktop.png')});
  await B.setViewportSize({width:390,height:844});await B.screenshot({path:path.join(output,prefix+'-battle-mobile.png')});
  assert.ok(await B.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3),'mobile viewport must contain its layout');
  await B.locator('#duoSeats [data-seat="0"]>.field>.field-cell[data-slot="6"]').scrollIntoViewIfNeeded();
  report.checks.push('real click summon in zone seven, position change, persistent inspector, mobile zone access');
  if(live){
   report.duel=await finishLiveDuel(A,B);
  }else{
   const room=backend.rooms.get(party.roomId);room.game.status='finished';room.game.winner=0;room.game.revision++;
   await refresh(A);await refresh(B);
  }
  await A.locator('.ad204-result-close').waitFor({state:'visible'});await A.locator('.ad204-result-close').click();await A.locator('#duoMenuScreen').waitFor({state:'visible'});
  await B.keyboard.press('Escape');await B.locator('#duoMenuScreen').waitFor({state:'visible'});
  await A.locator('#duoMenuStart').click();await status(A,'party_ready');await refresh(B);await B.locator('#duoStartDecline').click();await status(B,'finished');await refresh(A);
  assert.equal(await A.locator('#duoMenuScreen').isVisible(),true);assert.equal(await B.locator('#duoMenuScreen').isVisible(),true);
  report.checks.push('complete result, menu close, Escape, rematch consent and decline');
  for(const page of [A,B])assert.equal(await page.evaluate(()=>localStorage.getItem('arcane-duel-rpg-profile-v4-reborn')),'solo-sentinel-221');
  await A.reload();await A.locator('#duoNameConfirm').waitFor({state:'visible'});await A.waitForFunction(()=>!document.getElementById('duoNameConfirm').disabled);await A.locator('#duoNameConfirm').click();
  await A.locator('#duoPartyEnter').waitFor({state:'visible'});await A.locator('#duoPartyEnter').click();
  const recovered=await state(A);assert.equal(recovered.roomId,party.roomId);assert.equal(recovered.seat,0);
  report.checks.push('reload restores own room/seat; solo save unchanged');
  assert.deepEqual(pageErrors,[]);report.pass=true;
  fs.writeFileSync(path.join(output,prefix+'-report.json'),JSON.stringify(report,null,2));console.log('DUO_BROWSER_221_PASS '+JSON.stringify(report));
 }catch(error){
  for(const [label,client]of [['host',a],['guest',b]])if(client)await client.page.screenshot({path:path.join(output,prefix+'-failure-'+label+'.png'),mask:[client.page.locator('input[readonly]')]}).catch(()=>{});
  throw error;
 }finally{await a?.context.close();await b?.context.close();await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error('DUO_BROWSER_221_FAIL '+e.message+'\n'+e.stack);process.exitCode=1;server.close();});
