'use strict';
// Run only against a disposable in-memory server; never change real player saves.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{createServer}=require('../server/main.cjs');
const snapshot=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(snapshot.cards.map(c=>[c.id,c]));
const origin='http://127.0.0.1:8766';
const output=path.resolve(process.env.DUO_QA_OUTPUT||'../update-1.1.4-interactions');
fs.mkdirSync(output,{recursive:true});
const creature=(id,uid,extra={})=>({id,uid,level:catalog[id].level,
 atk:catalog[id].atk,def:catalog[id].def,role:catalog[id].role,
 fusion:false,mode:'atk',used:false,switched:false,placedRound:0,
 soul:0,condensed:0,soulCooldown:0,raidCooldown:0,condenseLeft:0,
 condenseSlice:0,drainPreference:0,lastSoulAction:-1,lastDrainSwitch:-1,
 decaySkipOwnTurn:-1,decayGrace:0,maxDef:catalog[id].def,resonance:0,...extra});
(async()=>{
 const {server,store}=createServer({database:':memory:',origin});
 await new Promise(r=>server.listen(8766,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROME||
  (process.platform==='win32'?'C:/Program Files/Google/Chrome/Application/chrome.exe':undefined),headless:true});
 const errors=[],checks=[];let pages=[];
 const mark=text=>{checks.push(text);console.log(text);};
 const watchdog=setTimeout(()=>{console.error('Update browser verification exceeded six minutes');process.exit(1);},360000);
 const room=()=>JSON.parse(store.db.prepare('SELECT document FROM rooms LIMIT 1').get().document);
 async function fixture(change){
  const value=room();change(value.state);value.state.revision++;
  value.revision=value.state.revision;value.presentation=[];store.save('rooms',value);
  await Promise.all(pages.map(p=>p.waitForFunction(revision=>
   window.ArcaneOnlineBattle230.revision()===revision&&!window.ArcaneOnlineBattle230.playing(),value.revision)));
  return value.state;
 }
 async function idle(){await Promise.all(pages.map(p=>p.waitForFunction(()=>
  !window.ArcaneOnlineBattle230.playing()&&!busy)));}
 const normal=snapshot.starterMain.find(id=>catalog[id].level===1&&catalog[id].role==='combatant');
 const enemy=snapshot.starterMain.find(id=>id!==normal&&catalog[id].level===1);
 function fullBoard(g){
  g.activeSeat=0;g.turn=8;g.round=3;g.status='active';g.winner=null;
  for(const p of g.players){p.field=Array(7).fill(null);p.summoned=false;p.hand=[normal,normal,normal,normal,normal];p.remainingFusion=[...snapshot.starterFusions];}
  for(let i=0;i<7;i++)g.players[i%2?2:0].field[i]=creature(normal,81000+i);
  g.players[1].field[0]=creature(enemy,82000);
 }
 try{
  const contexts=await Promise.all([browser.newContext({viewport:{width:1500,height:1000}}),browser.newContext({viewport:{width:1500,height:1000}})]);
  pages=await Promise.all(contexts.map(c=>c.newPage()));const [a,b]=pages;
  for(const p of pages){p.setDefaultTimeout(30000);p.on('pageerror',e=>errors.push(e.message));
   await p.addInitScript(()=>localStorage.setItem('arcane-duel-leader-help-v211','1'));}
  await Promise.all(pages.map(p=>p.goto(origin)));
  await Promise.all(pages.map(p=>p.waitForFunction(()=>!!window.ArcaneOnline230)));
  await Promise.all(pages.map(p=>p.evaluate(()=>window.ArcaneTitleGate.close())));
  await a.evaluate(()=>window.ArcaneOnline230.invitePlayer());
  await b.goto(await a.locator('#onlineInviteLink230').inputValue());
  await b.getByText('Du bist einer Gruppe beigetreten. Warte auf Host.',{exact:true}).waitFor();
  await a.waitForFunction(()=>!document.getElementById('onlineContinue230').disabled);
  await a.locator('#onlineContinue230').click();
  await Promise.all(pages.map(p=>p.waitForFunction(()=>window.ArcaneOnline230.snapshot().state?.groupReleased===true)));
  await a.evaluate(()=>window.ArcaneOnline230.duelMenu());await a.locator('[data-online-opponent="1"]').click();
  await b.locator('#onlineAccept230').click();
  await Promise.all(pages.map(p=>p.waitForFunction(()=>game?.online230&&!window.ArcaneOnlineBattle230.playing())));
  const saves=await Promise.all(pages.map(p=>p.evaluate(()=>JSON.parse(JSON.stringify(profile)))));
  const before=await fixture(fullBoard),old=before.players[2].field[5];
  await a.locator('#hand [data-hand]').first().click();
  await a.locator('#ownRow [data-mine="5"]').click();
  await a.locator('#ad207-back').click();
  assert.equal(room().state.players[2].field[5].uid,old.uid,'cancel preserves occupied zone');
  await a.locator('#ownRow [data-mine="5"]').click();await a.locator('#ad207-replace').click();
  await a.waitForFunction(()=>window.ArcaneOnline230.snapshot().state.players[0].field[5]!==null);await idle();
  assert.equal(room().state.players[2].field[5],null);
  assert.equal(room().state.players[2].graveyard.at(-1).uid,old.uid);
  mark('full board: clicking own hand then partner zone offers cancel, replace and fusion; replacement keeps owner graveyard');

  await fixture(fullBoard);
  await a.locator('#hand [data-hand]').nth(0).click({button:'right'});
  await a.locator('#hand [data-hand]').nth(1).click({button:'right'});
  await a.keyboard.press('f');await a.locator('[data-fusion-choice]').first().click();
  await a.locator('#ownRow [data-mine="5"]').click();await a.locator('#ad207-replace').click();
  await a.waitForFunction(()=>window.ArcaneOnline230.snapshot().state.players[0].field[5]?.fusion===true);await idle();
  assert.equal(room().state.players[2].graveyard.at(-1).uid,81005);
  assert.equal(room().state.players[0].hand.length,3);
  mark('full board: hand fusion replaces partner card after confirmation, without using it as material');

  await fixture(fullBoard);
  await a.locator('#hand [data-hand]').first().click();await a.locator('#ownRow [data-mine="5"]').click();
  await a.locator('#ad207-fuse').click();await a.locator('[data-fusion-choice]').first().click();
  await a.waitForFunction(()=>window.ArcaneOnline230.snapshot().state.players[0].field[5]?.fusion===true);await idle();
  assert.equal(room().state.players[2].field[5],null);
  assert.equal(room().state.players[0].hand.length,4);
  mark('full board: field fusion consumes exactly one partner field card and one own hand card');

  const inspect=await fixture(g=>{fullBoard(g);g.activeSeat=2;g.turn=10;});
  await a.locator('#ownRow [data-mine="5"]').click();
  assert.ok((await a.locator('#largeCardPreview').innerText()).includes(catalog[normal].name));
  await a.locator('#enemyRow [data-enemy="0"]').click();
  assert.ok((await a.locator('#largeCardPreview').innerText()).includes(catalog[enemy].name),'enemy preview replaces previous own selection');
  assert.equal(await a.locator('#ad182-inspector').evaluate(el=>el.open),true);
  assert.equal(await a.locator('#endTurnBtn').isDisabled(),true);
  assert.equal(await a.locator('#hand [data-hand]').first().isDisabled(),true);
  assert.equal(room().state.revision,inspect.revision,'read-only inspection sends no server action');
  mark('inactive player can inspect partner and opponent cards in sequence, without enabling actions');

  await a.evaluate(()=>{window.update114Fx=[];const fx=window.ArcaneDefenderFX;
   window.ArcaneDefenderFX={...fx,record:(g,e)=>{window.update114Fx.push(e);return fx.record(g,e);}};});
  await fixture(g=>{fullBoard(g);g.players[1].field[0]=creature(7,83000,{soul:500,mode:'def'});
   for(const p of g.players)if(p.seat!==1)p.field=Array(7).fill(null);
   g.players[0].field[0]=creature(normal,83001,{atk:3000,def:3000,maxDef:3000});});
  await a.locator('#endTurnBtn').click();
  await b.waitForFunction(()=>window.ArcaneOnline230.snapshot().state.activeSeat===2);await idle();
  const events=await a.evaluate(()=>window.update114Fx);
  assert.ok(events.some(e=>e.type==='absorb'&&e.owner===1&&e.gain>0),'Soul absorption remains animated when decay exceeds the gain');
  mark('enemy start-of-turn decay and absorption keep the original Soul effect even with negative net stored soul');
  for(let i=0;i<pages.length;i++){
   const save=await pages[i].evaluate(()=>JSON.parse(JSON.stringify(profile)));
   for(const key of ['coins','xp','activeDeck','fusionDeck','inventory','cleared','shards'])assert.deepEqual(save[key],saves[i][key]);
   const state=await pages[i].evaluate(()=>window.ArcaneOnline230.snapshot());
   assert.ok(state.state.players[state.seat^2].hand.every(c=>c===null));
  }
  assert.deepEqual(errors,[]);
  await a.screenshot({path:path.join(output,'duel.png'),fullPage:true});
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({ok:true,checks,errors},null,2));
 }catch(error){
  for(const [i,p] of pages.entries())await p.screenshot({path:path.join(output,'failure-'+i+'.png'),fullPage:true}).catch(()=>{});
  fs.writeFileSync(path.join(output,'report.json'),JSON.stringify({ok:false,checks,errors,error:error.stack},null,2));throw error;
 }finally{clearTimeout(watchdog);await browser.close();server.closeAllConnections();await new Promise(r=>server.close(r));store.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
