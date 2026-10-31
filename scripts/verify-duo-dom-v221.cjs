'use strict';
/* Two independent DOM documents against a shared deterministic test server.
 * Complements, and does not replace, the live two-browser verification. */
const {JSDOM,ResourceLoader,VirtualConsole}=require('jsdom');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {fixture}=require('../tests/helpers/duo-online-fixture-v221.cjs');
const root=path.resolve(__dirname,'..'),backend=fixture(),errors=[];
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(fn,label){for(let i=0;i<100;i++){if(fn())return;await delay(30);}throw Error('Timeout: '+label);}
class LocalLoader extends ResourceLoader{fetch(url){const u=new URL(url);if(u.hostname!=='localhost')return null;const file=path.join(root,decodeURIComponent(u.pathname));return fs.existsSync(file)?Promise.resolve(fs.readFileSync(file)):null;}}
function client(query=''){
 const console=new VirtualConsole();console.on('jsdomError',e=>{if(!/Not implemented: (HTMLMediaElement|window.scroll|HTMLCanvasElement)/.test(e.message))errors.push(e.message);});
 return new JSDOM(fs.readFileSync(path.join(root,'duo-campaign-v2.html'),'utf8'),{url:'http://localhost:8757/duo-campaign-v2.html'+query,runScripts:'dangerously',resources:new LocalLoader(),pretendToBeVisual:true,virtualConsole:console,beforeParse(w){
  w.matchMedia=()=>({matches:false,addEventListener(){},removeEventListener(){}});
  w.localStorage.setItem('arcane-duo-motion-v221','reduced');
  w.HTMLElement.prototype.scrollIntoView=()=>{};w.confirm=()=>true;
  w.fetch=async(url,opts)=>{
   if(opts?.method==='POST'){try{const data=backend.handle(JSON.parse(opts.body));return {ok:true,json:async()=>data};}catch(e){return {ok:false,status:400,json:async()=>({error:e.message})};}}
   const p=path.join(root,new URL(url,w.location.href).pathname);return {ok:true,json:async()=>JSON.parse(fs.readFileSync(p,'utf8'))};
  };
 }});
}
async function ready(dom,name){const w=dom.window,d=w.document;await until(()=>w.ArcaneDuoParty218?.state().catalogReady,'catalog');d.getElementById('duoNameInput').value=name;d.getElementById('duoNameConfirm').click();await until(()=>w.ArcaneDuoParty218.state().nameConfirmed,'name');}
(async()=>{
 const a=client();let b;
 try{
  await ready(a,'Test Host');const A=a.window,ad=A.document;
  ad.getElementById('duoPartyCreate').click();await until(()=>A.ArcaneDuoParty218.state().game?.status==='waiting','party');
  ad.getElementById('duoPartyEnter').click();assert.equal(ad.getElementById('duoMenuScreen').hidden,false);
  assert.equal(ad.getElementById('duoMenuStart').disabled,true);
  A.ArcaneDuoPartyUI218.select('deck');assert.equal(ad.getElementById('duoDeckBuilder').hidden,false);
  assert.equal(ad.querySelectorAll('[data-deck-slot]').length,40);
  const room=A.ArcaneDuoParty218.state();b=client('?join='+room.roomId+'.'+room.invite);await ready(b,'Test Gast');
  const B=b.window,bd=B.document;await until(()=>B.ArcaneDuoParty218.state().joinPreview,'invite preview');
  assert.equal(bd.getElementById('duoPartyEnter').disabled,true);
  bd.getElementById('duoPartyAccept').click();await until(()=>B.ArcaneDuoParty218.state().game?.status==='lobby','join');
  assert.equal(bd.getElementById('duoPartyGate').hidden,false);assert.equal(bd.getElementById('duoPage').hidden,true);
  bd.getElementById('duoPartyEnter').click();B.ArcaneDuoPartyUI218.select('shop');await A.ArcaneDuoParty218.refresh();
  assert.equal(ad.getElementById('duoPage').dataset.lobbySection,'deck');assert.equal(bd.getElementById('duoPage').dataset.lobbySection,'shop');
  const search=ad.getElementById('duoDeckSearch');search.value='Asche';search.dispatchEvent(new A.Event('input'));search.focus();
  await A.ArcaneDuoParty218.refresh();assert.equal(ad.activeElement,search);assert.equal(search.value,'Asche');
  A.ArcaneDuoPartyUI218.select('menu');ad.getElementById('duoMenuStart').click();await until(()=>A.ArcaneDuoParty218.state().game.status==='party_ready','host request');
  await B.ArcaneDuoParty218.refresh();assert.match(bd.getElementById('duoStartNoticeTitle').textContent,/Test Host/);
  assert.equal(bd.getElementById('duoStartNotice').getAttribute('role'),'dialog');assert.equal(B.ArcaneDuoParty218.state().game.status,'party_ready');
  bd.getElementById('duoStartLater').click();assert.equal(bd.getElementById('duoPage').inert,false);assert.equal(bd.getElementById('duoPage').dataset.lobbySection,'shop');
  ad.getElementById('duoStartCancel').click();await until(()=>A.ArcaneDuoParty218.state().game.status==='lobby','cancel');await B.ArcaneDuoParty218.refresh();
  assert.equal(bd.getElementById('duoPage').dataset.lobbySection,'shop');
  B.ArcaneDuoPartyUI218.select('menu');bd.getElementById('duoMenuStart').click();await until(()=>B.ArcaneDuoParty218.state().game.status==='party_ready','guest request');await A.ArcaneDuoParty218.refresh();
  assert.match(ad.getElementById('duoStartNoticeTitle').textContent,/Test Gast/);ad.getElementById('duoStartAccept').click();
  await until(()=>A.ArcaneDuoParty218.state().game.status==='active','accept');await B.ArcaneDuoParty218.refresh();
  for(const [w,d]of [[A,ad],[B,bd]]){assert.equal(d.querySelectorAll('#duoSeats .seat').length,4);assert.equal(d.querySelectorAll('#duoSeats .ad221-team-field').length,2);assert.equal(d.querySelectorAll('#duoSeats .seat>.field>.field-cell:not(.ad221-shared-hidden)').length,14);assert.equal(d.getElementById('duoMenuScreen').hidden,true);assert.equal(d.getElementById('duoPage').hidden,false);assert.equal(d.querySelectorAll('.duo178-hand-card').length,5);assert.equal(w.ArcaneDuoParty218.state().game.teams[0].lp,4000);}
  assert.equal(bd.querySelector('#duoSeats [data-perspective="self"]').dataset.seat,'2');
  const current=backend.rooms.get(room.roomId);current.game.status='finished';current.game.winner=0;current.game.revision++;
  await A.ArcaneDuoParty218.refresh();await B.ArcaneDuoParty218.refresh();await delay(20);
  ad.querySelector('.ad204-result-close').click();assert.equal(ad.getElementById('duoMenuScreen').hidden,false);
  bd.dispatchEvent(new B.KeyboardEvent('keydown',{key:'Escape',bubbles:true}));assert.equal(bd.getElementById('duoMenuScreen').hidden,false);
  assert.equal(A.localStorage.getItem('arcane-duel-duo-v171-profile-key')===B.localStorage.getItem('arcane-duel-duo-v171-profile-key'),false);
  assert.deepEqual(errors,[]);console.log('DUO_DOM_221_PASS: independent waiting/menu/deck/search/invite/cancel/guest-start/14-shared-zones/guest-perspective/result/Escape');
 }finally{a.window.close();b?.window.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
