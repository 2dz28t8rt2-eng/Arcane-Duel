'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const rules=require('../assets/duo-shared-rules-v160.js');
const snapshot=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(snapshot.cards.map(c=>[c.id,c]));
const room=()=>rules.create({roomId:'duo-party-v218-test',hostName:'Leiter',
 hostDeck:snapshot.starterMain,hostFusions:snapshot.starterFusions,
 hostPortrait:'hero-16',enemyDeckA:snapshot.starterMain,enemyDeckB:snapshot.starterMain,
 enemyFusionsA:snapshot.starterFusions,enemyFusionsB:snapshot.starterFusions,
 catalog,chapter:1,entry:'new'});
const join=(r,deferStart)=>rules.apply(r,2,{type:'join',name:'Verbündeter',
 deck:snapshot.starterMain,fusions:snapshot.starterFusions,
 portraitId:'hero-15',deferStart},{catalog});
test('new party waits for two humans and cannot play until host starts',()=>{
 const a=room();assert.equal(a.status,'waiting');
 const b=join(a,true);
 assert.equal(b.status,'lobby');
 assert.equal(b.players[2].portraitId,'hero-15');
 assert.equal(b.players[0].portraitId,'hero-16');
 assert.equal(b.teams[0].lp,b.teams[0].maxLp);
 assert.equal(b.players.length,4);
 assert.ok(b.players.every(p=>p.hand.length>0));
 assert.throws(()=>rules.apply(b,0,{type:'end'},{catalog}),/nicht aktiv/);
 assert.throws(()=>rules.apply(b,2,{type:'startParty'},{catalog}),/Party-Leiter/);
 const c=rules.apply(b,0,{type:'startParty'},{catalog});
 assert.equal(c.status,'active');assert.equal(c.revision,b.revision+1);
 assert.equal(c.chapter,1);assert.equal(c.players[0].name,'Leiter');
 assert.equal(c.players[2].name,'Verbündeter');
 const d=rules.apply(c,0,{type:'end'},{catalog});
 assert.equal(d.activeSeat,1);
});
test('previous rooms preserve auto-start and remain compatible',()=>{
 const r=join(room(),false);
 assert.equal(r.status,'active');
 assert.throws(()=>rules.apply(r,0,{type:'startParty'},{catalog}),/Party-Leiter/);
 assert.equal(rules.view(r,0).players[2].portraitId,'hero-15');
});
test('solo-like duo menu loads only after joining and before battle',()=>{
 const html=read('duo-campaign-v2.html');
 const ui=read('assets/duo-preparty-v218.js');
 const css=read('assets/duo-preparty-v218.css');
 const client=read('assets/duo-parity-v160.js');
 const edge=read('supabase/functions/arcane-duo-v2/index.ts');
 assert.ok(html.indexOf('id="duoPartyGate"')<html.indexOf('id="duoMainMenuGate"'));
 assert.ok(html.indexOf('id="duoMainMenuGate"')<html.indexOf('id="duoPage"'));
 for(const id of ['duoPartyCreate','duoPartyLink','duoPartyResume','duoMenuStart',
  'duoMenuCollection','duoMenuDeck','duoMenuProfile','duoReturnMenu'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.ok(html.indexOf('assets/duo-parity-v160.js?')<html.indexOf('assets/duo-preparty-v218.js?'));
 assert.match(ui,/g\.status==='lobby'&&lobbySection==='menu'/);
 assert.match(ui,/g\.status==='lobby'&&lobbySection!=='menu'/);
 assert.match(ui,/\$\('duoPage'\)\.inert=/);
 assert.match(ui,/\$\('duoMenuStart'\)\.disabled=/);
 assert.match(ui,/api\.send\(\{type:'startParty'\}\)/);
 assert.match(css,/#duoMainMenuGate\[hidden\]/);
 assert.match(client,/deferStart:true/);
 assert.match(client,/action\.type==='startParty'/);
 assert.doesNotMatch(client,/else if\(!hash&&duoLastRoom\?\.roomId&&duoProfileToken\)/);
 assert.match(edge,/deferStart:body\.deferStart===true/);
 assert.match(edge,/"startParty","soulCondense"/);
 assert.equal(read('assets/duo-shared-rules-v160.js'),
  read('supabase/functions/arcane-duo-v2/duo-rules.js'));
});
