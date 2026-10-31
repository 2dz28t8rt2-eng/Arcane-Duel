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
 let a,b,c;const report={mode:prefix,checks:[]};
 try{
  if(!live){
   const solo=await browser.newContext({viewport:{width:1500,height:1080}});
   try{
    await solo.route(endpoint,async route=>{
     if(route.request().method()==='OPTIONS'){await route.fulfill({status:200,headers:{'access-control-allow-origin':'http://localhost:8757','access-control-allow-headers':'Content-Type','access-control-allow-methods':'POST,OPTIONS'},body:'{}'});return;}
     try{await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(backend.handle(route.request().postDataJSON()))});}
     catch(e){await route.fulfill({status:400,contentType:'application/json',body:JSON.stringify({error:e.message})});}
    });
    const page=await solo.newPage();await page.goto('http://localhost:8757/index.html');
    await page.locator('[data-ad196-action="solo"]').click();
    if(await page.locator('#guideClose').isVisible())await page.locator('#guideClose').click();
    if(await page.locator('#helpDismiss').isVisible())await page.locator('#helpDismiss').click();
    assert.equal(await page.locator('#duoQuickInvite').isVisible(),true);
    assert.equal(await page.locator('#duoQuickInvite').getAttribute('href'),'duo-campaign-v2.html?invitePlayer=1');
    const soloSave=await page.evaluate(()=>localStorage.getItem('arcane-duel-rpg-profile-v4-reborn'));
    await page.locator('#duoQuickInvite').click();
    await page.waitForFunction(()=>window.ArcaneDuoParty218?.state().catalogReady&&!document.getElementById('duoNameConfirm').disabled);
    await page.locator('#duoNameInput').fill('QA221 Direkt');await page.locator('#duoNameConfirm').click();
    await status(page,'waiting');
    assert.equal(await page.locator('#duoInvitePlayerPanel input').isVisible(),true);
    assert.equal(await page.evaluate(()=>localStorage.getItem('arcane-duel-rpg-profile-v4-reborn')),soloSave);
    report.checks.push('singleplayer main menu exposes a direct invitation entry');
    report.checks.push('direct entry creates an invitation without changing the solo save');
   }finally{await solo.close();}
  }
  const tag=Date.now().toString(36);a=await newClient(browser,'http://localhost:8757/duo-campaign-v2.html','QA221 Host '+tag);
  const A=a.page;await A.locator('#duoMenuScreen').waitFor({state:'visible'});
  if(!live){const host=[...backend.profiles.values()].find(p=>p.nickname==='QA221 Host '+tag);host.clearedChapters=[1,2];await A.evaluate(()=>window.ArcaneDuoParty218.refreshProfile());}
  assert.equal((await state(A)).game,null);await route(A,'deck');
  assert.equal(await A.locator('[data-deck-slot]').count(),40);await A.locator('#duoDeckSearch').fill('Asche');
  await A.locator('#duoInvitePlayer').click();await status(A,'waiting');
  assert.equal(await A.locator('#duoInvitePlayerPanel input').isVisible(),true);
  const party=await state(A);b=await newClient(browser,'http://localhost:8757/duo-campaign-v2.html?join='+party.roomId+'.'+party.invite,'QA221 Gast '+tag);
  const B=b.page;await B.locator('#duoPartyAccept').waitFor({state:'visible'});assert.equal((await state(B)).game,null);
  await B.locator('#duoPartyAccept').click();await status(B,'lobby');await B.locator('#duoMenuScreen').waitFor({state:'visible'});
  await route(B,'shop');await refresh(A);
  if(!live){await route(A,'menu');assert.equal(await A.locator('#duoDuelChapter option[value="2"]').evaluate(n=>n.disabled),true);await route(A,'deck');}
  report.checks.push('independent personal menu before room, link created in menu, guest joins');
  assert.equal(await A.locator('#duoPage').getAttribute('data-lobby-section'),'deck');assert.equal(await B.locator('#duoPage').getAttribute('data-lobby-section'),'shop');
  await A.locator('#duoDeckSearch').focus();await refresh(A);await refresh(B);assert.equal(await A.locator('#duoDeckSearch').inputValue(),'Asche');assert.equal(await A.locator('#duoDeckSearch').evaluate(n=>n===document.activeElement),true);
  if(!live){
   const guest=[...backend.profiles.values()].find(p=>p.nickname==='QA221 Gast '+tag);
   guest.clearedChapters=[1];await refresh(A);
   assert.equal((await state(A)).partyLimits.maxChapter,2);
   assert.equal(await A.locator('#duoDeckSearch').inputValue(),'Asche');
   assert.equal(await A.locator('#duoDeckSearch').evaluate(n=>n===document.activeElement),true);
   guest.clearedChapters=[];await refresh(A);
  }
  report.checks.push('explicit group acceptance and enter; independent deck/shop/search/focus');
  await route(A,'menu');await A.locator('#duoMenuStart').click();await status(A,'party_ready');await refresh(B);
  assert.equal(await B.locator('#duoStartNotice').getAttribute('role'),'dialog');assert.match(await B.locator('#duoStartNoticeTitle').innerText(),/QA221 Host/);
  await B.screenshot({path:path.join(output,prefix+'-invitation.png')});await B.locator('#duoStartDecline').click();await status(B,'lobby');await refresh(A);
  assert.equal(await B.locator('#duoPage').getAttribute('data-lobby-section'),'shop');
  await A.locator('#duoMenuStart').click();await status(A,'party_ready');await refresh(B);await B.locator('#duoStartLater').click();
  assert.equal(await B.locator('#duoPage').evaluate(n=>n.inert),false);await A.locator('#duoStartCancel').click();await status(A,'lobby');await refresh(B);
  report.checks.push('host invite popup, decline, prepare, cancel: no duel or route reset');
  await route(B,'menu');assert.equal(await B.locator('#duoMenuStart').isDisabled(),true);
  await route(A,'menu');await A.locator('#duoMenuStart').click();await status(A,'party_ready');await refresh(B);
  assert.match(await B.locator('#duoStartNoticeTitle').innerText(),/QA221 Host/);
  // Verify wrong-seat consent at the server boundary using the initiator's credentials.
  const denied=await A.evaluate(async endpoint=>{
   const s=window.ArcaneDuoParty218.state(),session=JSON.parse(sessionStorage.getItem('arcane-duo-v2-session-'+s.roomId));
   const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'action',roomId:s.roomId,token:session.token,expectedRevision:s.game.revision,action:{type:'acceptPartyStart',inviteId:s.game.partyStartInvite.id}})});return r.status;
  },endpoint);assert.equal(denied,400);
  await B.locator('#duoStartAccept').dblclick();await status(B,'active');await refresh(A);await status(A,'active');
  const started=(await state(A)).game;assert.ok(started.duelNo>1);
  if(!live){assert.equal(started.players[0].loanedDeck,true);assert.equal(started.players[2].loanedDeck,false);}
  for(const page of [A,B]){
   assert.equal(await page.locator('#duoSeats .seat').count(),4);assert.equal(await page.locator('#duoSeats .ad221-team-field').count(),2);assert.equal(await page.locator('#duoSeats .seat>.field>.field-cell:visible').count(),14);
   assert.equal(await page.locator('#duoBattleInspector').isVisible(),true);assert.equal(await page.locator('#duoSeats .duo178-hand-card').count(),5);
   const s=await state(page);assert.ok(s.game.players[s.seat===0?2:0].hand.every(x=>x===null));assert.equal(s.game.rngSeed,undefined);
   assert.equal(s.game.teams[0].maxLp,4000);
  }
  assert.equal(await B.locator('#duoSeats [data-perspective="self"]').getAttribute('data-seat'),'2');
  report.checks.push('host invite, wrong-seat denied, double-click single start, 14 shared team zones, LP, private hands, guest perspective');
  if(live){
   const revision=(await state(B)).game.revision;
   await a.context.setOffline(true);
   await B.waitForFunction(()=>window.ArcaneDuoParty218.state().presence?.hostOnline===false,null,{timeout:75000});
   await B.locator('#duoPresenceNotice').waitFor({state:'visible'});
   assert.match(await B.locator('#duoPresenceNotice').innerText(),/ursprüngliche Host/);
   assert.equal((await state(B)).game.revision,revision);assert.equal((await state(B)).seat,2);
   await a.context.setOffline(false);await refresh(A);
   await B.waitForFunction(()=>window.ArcaneDuoParty218.state().presence?.hostOnline===true,null,{timeout:45000});
   await B.locator('#duoPresenceNotice').waitFor({state:'hidden'});
   assert.equal((await state(A)).seat,0);assert.equal((await state(A)).game.revision,revision);
   report.checks.push('host offline >45s: visible waiting, unchanged combat and seats, original host reconnects');
  }
  const empty=A.locator('#duoSeats [data-seat="0"]>.field>.field-cell[data-slot="6"]');
  await A.locator('.duo178-hand-card[data-index="0"]').click();await empty.click();await A.locator('#ad189-summon-guide .ad189-guide-confirm').click();
  await A.waitForFunction(()=>!!window.ArcaneDuoParty218.state().game.players[0].field[6]);await refresh(B);
  const summonedUid=(await state(A)).game.players[0].field[6].uid;
  await B.waitForFunction(uid=>window.ArcaneDuoParty218.state().game.players[0].field[6]?.uid===uid,summonedUid);
  assert.equal((await state(A)).game.players[0].field[6].uid,(await state(B)).game.players[0].field[6].uid);
  await A.keyboard.press('d');await A.waitForFunction(()=>window.ArcaneDuoParty218.state().game.players[0].field[6].mode==='def');
  await refresh(B);await B.waitForFunction(()=>window.ArcaneDuoParty218.state().game.players[0].field[6]?.mode==='def');
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
  const finishedNo=(await state(A)).game.duelNo;
  await A.locator('#duoMenuStart').click();await status(A,'party_ready');await refresh(B);
  await B.locator('#duoStartAccept').click();await status(B,'active');await refresh(A);await status(A,'active');
  const replay=(await state(B)).game;
  assert.equal(replay.duelNo,finishedNo+1);assert.equal(replay.round,1);assert.equal(replay.activeSeat,0);
  assert.ok(replay.players.every(p=>p.field.every(c=>c===null)));assert.equal(replay.teams[0].lp,4000);
  report.checks.push('accepted rematch starts clean fields, LP and turn with a new duel number');
  if(live){report.replay=await finishLiveDuel(A,B);}

  const personal=[];
  for(const page of [A,B]){
   await page.evaluate(()=>window.ArcaneDuoParty218.refreshProfile());
   const profile=(await state(page)).profile;
   personal.push({xp:profile.xp,essence:profile.essence,shards:profile.shards,wins:profile.wins,credits:profile.chapterCardCredits});
   assert.equal(await page.evaluate(()=>localStorage.getItem('arcane-duel-rpg-profile-v4-reborn')),'solo-sentinel-221');
  }
  if(live)report.personalRewards=personal;

  await A.reload();await A.locator('#duoNameConfirm').waitFor({state:'visible'});await A.waitForFunction(()=>!document.getElementById('duoNameConfirm').disabled);await A.locator('#duoNameConfirm').click();
  await A.waitForFunction(()=>window.ArcaneDuoParty218.state().seat===0);
  const recovered=await state(A);assert.equal(recovered.roomId,party.roomId);assert.equal(recovered.seat,0);
  await A.evaluate(()=>window.ArcaneDuoParty218.refreshProfile());
  const saved=(await state(A)).profile;
  assert.deepEqual({xp:saved.xp,essence:saved.essence,shards:saved.shards,wins:saved.wins,credits:saved.chapterCardCredits},personal[0]);
  report.checks.push('reload restores own room/seat; personal rewards unchanged; solo save unchanged');
  if(live){
   // Use only isolated QA profiles; the first host has earned chapter 1 by
   // playing the prior live duel. A fresh third player has not earned it.
   assert.ok(saved.clearedChapters?.includes(1),'Original QA profile must have earned chapter 1');
   const savedDeck=structuredClone(saved.deck);
   await A.evaluate(()=>window.ArcaneDuoParty218.createRoom());await status(A,'waiting');
   const veteranParty=await state(A);
   c=await newClient(browser,'http://localhost:8757/duo-campaign-v2.html?join='+
    veteranParty.roomId+'.'+veteranParty.invite,'QA221 Rookie '+tag);
   const C=c.page;await C.locator('#duoPartyAccept').click();await status(C,'lobby');await refresh(A);
   const limits=(await state(A)).partyLimits;
   assert.equal(limits.maxChapter,1);assert.equal(limits.loanSeatChapter,0);
   assert.equal((await state(C)).profile.clearedChapters.length,0);
   await route(A,'menu');
   assert.equal(await A.locator('#duoDuelChapter option[value="2"]').evaluate(n=>n.disabled),true);
   await A.locator('#duoMenuStart').click();await status(A,'party_ready');await refresh(C);
   await C.locator('#duoStartAccept').click();await status(C,'active');await refresh(A);
   const veteranStart=(await state(A)).game,rookieStart=(await state(C)).game;
   assert.equal(veteranStart.players[0].loanedDeck,true);
   assert.equal(veteranStart.players[2].loanedDeck,false);
   assert.ok(rookieStart.players[0].hand.every(x=>x===null));
   assert.ok(veteranStart.players[2].hand.every(x=>x===null));
   await A.evaluate(()=>window.ArcaneDuoParty218.refreshProfile());
   assert.deepEqual((await state(A)).profile.deck,savedDeck);
   report.checks.push('LIVE unequal earned progress: novice limits opponent, veteran gets temporary loan, saved deck stays unchanged');

   // Pick two legal materials from genuinely private player views. Send only
   // normal game actions through the deployed Edge function.
   const rules=require('../assets/duo-shared-rules-v160.js');
   let pair;
   for(let hi=0;hi<veteranStart.players[0].hand.length&&!pair;hi++){
    const hostId=veteranStart.players[0].hand[hi];
    const def=catalog[hostId];if(!def||def.ace)continue;
    const candidate=structuredClone(rookieStart);
    candidate.players[0].field[6]={id:hostId,level:def.level,role:def.role,
     fusion:false,uid:888,mode:'atk',atk:def.atk,def:def.def};
    for(let gi=0;gi<rookieStart.players[2].hand.length;gi++){
     const mats=[{from:'hand',index:gi},{from:'allyField',index:6}];
     try{
      const options=rules.fusionOptions(candidate,2,mats,catalog);
      if(options.templates.length){pair={hi,gi,templateId:options.templates[0]};break;}
     }catch{}
    }
   }
   assert.ok(pair,'Starter hands must offer at least one legal allied field fusion');
   const sharedSlot=A.locator('#duoSeats [data-seat="0"]>.field>.field-cell[data-slot="6"]');
   await A.locator('.duo178-hand-card[data-index="'+pair.hi+'"]').click();
   await sharedSlot.click();await A.locator('#ad189-summon-guide .ad189-guide-confirm').click();
   await A.waitForFunction(()=>!!window.ArcaneDuoParty218.state().game.players[0].field[6]);
   await A.evaluate(()=>window.ArcaneDuoParty218.send({type:'end'}));await refresh(C);
   await C.waitForFunction(()=>window.ArcaneDuoParty218.state().game.activeSeat===2);
   assert.ok((await state(C)).game.players[0].field[6],'Partner material survives until guest turn');
   await C.evaluate(action=>window.ArcaneDuoParty218.send(action),{
    type:'fusion',materials:[{from:'hand',index:pair.gi},{from:'allyField',index:6}],
    slot:6,templateId:pair.templateId
   });
   await C.waitForFunction(()=>!!window.ArcaneDuoParty218.state().game.players[2].field[6]);
   const after=(await state(C)).game;
   assert.equal(after.players[0].field[6],null);
   assert.equal(after.players[2].field[6].id,pair.templateId);
   await refresh(A);assert.equal((await state(A)).game.players[2].field[6].id,pair.templateId);
   report.checks.push('LIVE guest fusion consumes host field card and occupies one of the seven shared zones');
  }
  assert.deepEqual(pageErrors,[]);report.pass=true;
  fs.writeFileSync(path.join(output,prefix+'-report.json'),JSON.stringify(report,null,2));console.log('DUO_BROWSER_221_PASS '+JSON.stringify(report));
 }catch(error){
  for(const [label,client]of [['host',a],['guest',b],['rookie',c]])if(client)await client.page.screenshot({path:path.join(output,prefix+'-failure-'+label+'.png'),mask:[client.page.locator('input[readonly]')]}).catch(()=>{});
  throw error;
 }finally{await a?.context.close();await b?.context.close();await c?.context.close();await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(e=>{console.error('DUO_BROWSER_221_FAIL '+e.message+'\n'+e.stack);process.exitCode=1;server.close();});
