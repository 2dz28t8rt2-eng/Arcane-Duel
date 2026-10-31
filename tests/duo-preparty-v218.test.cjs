'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
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
 const request=rules.apply(b,0,{type:'startParty'},{catalog});
 assert.equal(request.status,'party_ready');assert.equal(request.revision,b.revision+1);
 assert.throws(()=>rules.apply(request,0,{type:'acceptPartyStart'},{catalog}),/Zustimmung/);
 const rejected=rules.apply(request,2,{type:'declinePartyStart'},{catalog});
 assert.equal(rejected.status,'lobby');
 const consent=rules.apply(rejected,0,{type:'startParty'},{catalog});
 const newBuild={deck:snapshot.starterMain,fusions:snapshot.starterFusions,
  upgrades:{},enhancements:{},essence:{},lv1:{},portraitId:'hero-14'};
 const started=rules.apply(consent,2,{type:'acceptPartyStart'},
  {catalog,humanBuilds:{0:newBuild,2:newBuild}});
 assert.equal(started.status,'active');
 assert.equal(started.chapter,1);assert.equal(started.players[0].name,'Leiter');
 assert.equal(started.players[2].name,'Verbündeter');
 assert.equal(started.players[0].portraitId,'hero-14');
 assert.equal(started.players[2].portraitId,'hero-14');
 assert.deepEqual(started.players.map(p=>p.field.length),[7,7,7,7]);
 const d=rules.apply(started,0,{type:'end'},{catalog});
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
 assert.match(ui,/\['lobby','party_ready'\]\.includes\(g\?\.status\)/);
 assert.match(ui,/lobbySection!=='menu'/);
 assert.match(ui,/\$\('duoPage'\)\.inert=/);
 assert.match(ui,/\$\('duoMenuStart'\)\.disabled=/);
 assert.match(ui,/api\.send\(\{type:'startParty'\}\)/);
 assert.match(css,/#duoMainMenuGate\[hidden\]/);
 assert.match(client,/deferStart:true/);
 assert.match(client,/action\.type==='startParty'/);
 assert.doesNotMatch(client,/else if\(!hash&&duoLastRoom\?\.roomId&&duoProfileToken\)/);
 assert.match(edge,/deferStart:body\.deferStart===true/);
 assert.match(edge,/"startParty","acceptPartyStart","declinePartyStart","cancelPartyStart","soulCondense"/);
 assert.equal(read('assets/duo-shared-rules-v160.js'),
  read('supabase/functions/arcane-duo-v2/duo-rules.js'));
});

test('real party UI controller follows profile -> invite -> shared menu -> host start -> battle',async()=>{
 const nodes=new Map(),node=id=>{
  if(nodes.has(id))return nodes.get(id);
  const el={id,hidden:false,inert:false,disabled:false,dataset:{},value:'',
   textContent:'',children:[],parent:null,
   append(child){this.children.push(child);child.parent=this;},
   get childElementCount(){return this.children.length;},
   closest(tag){return tag==='label'?this.parent:null;},
   focus(){},select(){},scrollIntoView(){},addEventListener(){},click(){if(this.onclick)this.onclick();}};
  nodes.set(id,el);return el;
 };
 for(const id of ['duoEntry','duoChapter']){
  const label={id:id+'-label',children:[]};
  node(id).parent=label;
 }
 const document={getElementById:node};
 let model={nameConfirmed:false,joinIntent:false,roomId:'',seat:-1,
  game:null,invite:'',profile:{nickname:'Host'},lastRoom:null,busy:false,catalogReady:true};
 let started=0;
 const api={
  state:()=>model,
  createRoom:async()=>{model.roomId='room-1';model.seat=0;model.invite='abcdef';
   model.game={status:'waiting',players:[{name:'Host'},null,{name:'Partner (ausstehend)'}]};},
  send:async action=>{
   if(action.type==='startParty'){started++;model.game={...model.game,status:'party_ready'};}
   else if(action.type==='acceptPartyStart')model.game={...model.game,status:'active'};
   else if(action.type==='declinePartyStart')model.game={...model.game,status:'lobby'};
   else throw Error('unexpected action '+action.type);
  },pasteInvite:async()=>{},
  continueLastRoom:async()=>{},
  resetWaitingRoom:()=>{model={...model,roomId:'',seat:-1,invite:'',game:null};}
 };
 const window={ArcaneDuoParty218:api},location={href:'https://example.invalid/duo-campaign-v2.html#room=old'};
 const navigator={clipboard:{writeText:async()=>{}}};
 vm.runInNewContext(read('assets/duo-preparty-v218.js'),{window,document,location,navigator,console});
 const ui=window.ArcaneDuoPartyUI218;
 assert.ok(ui);
 assert.equal(node('duoPartyGate').hidden,true);
 model.nameConfirmed=true;ui.sync();
 assert.equal(node('duoPartyGate').hidden,false);
 assert.equal(node('duoMainMenuGate').hidden,true);
 assert.equal(node('duoPage').inert,true);
 await node('duoPartyCreate').onclick();
 assert.equal(node('duoPartyWaiting').hidden,false);
 assert.match(node('duoPartyLink').value,/#join=room-1\.abcdef$/);
 model.game={status:'lobby',chapter:1,players:[{name:'Host'},null,{name:'Partner'}]};
 ui.sync();
 assert.equal(node('duoPartyGate').hidden,true);
 assert.equal(node('duoMainMenuGate').hidden,false);
 assert.equal(node('duoMenuStart').disabled,false);
 node('duoMenuCollection').onclick();
 assert.equal(node('duoMainMenuGate').hidden,true);
 assert.equal(node('duoPage').hidden,false);
 assert.equal(node('duoPage').dataset.lobbyView,'true');
 node('duoReturnMenu').onclick();
 assert.equal(node('duoMainMenuGate').hidden,false);
 model.seat=2;ui.sync();
 assert.equal(node('duoMenuStart').disabled,true);
 await node('duoMenuStart').onclick();
 assert.equal(started,0);
 model.seat=0;ui.sync();
 await node('duoMenuStart').onclick();
 assert.equal(started,1);
 assert.equal(node('duoMainMenuGate').hidden,false);
 assert.equal(node('duoStartNotice').hidden,false);
 assert.equal(node('duoStartCancel').hidden,false);
 model.seat=2;ui.sync();
 assert.equal(node('duoStartAccept').hidden,false);
 node('duoMenuDeck').onclick();
 assert.equal(node('duoPage').dataset.lobbySection,'deck');
 await node('duoStartAccept').onclick();
 assert.equal(node('duoMainMenuGate').hidden,true);
 assert.equal(node('duoPage').hidden,false);
 assert.equal(node('duoPage').inert,false);
 assert.equal(node('duoPage').dataset.lobbyView,'false');
});
test('lobby persists in JSON while SQL room status remains compatible',()=>{
 const edge=read('supabase/functions/arcane-duo-v2/index.ts');
 assert.match(edge,/state:next,status:next\.status==='lobby'\?'waiting':next\.status/);
 assert.match(edge,/\['lobby','party_ready'\]\.includes\(next\.status\)\?'waiting'/);
 assert.match(edge,/room\.status==="waiting"&&!room\.guest_token_hash/);
});

test('a recovered waiting party renews only its host-owned invitation, never a guest token',()=>{
 const edge=read('supabase/functions/arcane-duo-v2/index.ts');
 const client=read('assets/duo-parity-v160.js');
 assert.match(edge,/if\(kind==="renewInvite"\)/);
 assert.match(edge,/owner\.id===room\.host_profile_id/);
 assert.match(edge,/room\.state\?\.status==="waiting"&&!room\.guest_token_hash/);
 assert.match(edge,/invitation_hash:await hash\(newInvite\)/);
 assert.match(client,/type:'renewInvite',roomId:id,profileToken:duoProfileToken/);
 assert.match(client,/invite=restoredInvite;load\(r\)/);
});

test('full solo title markup, independent menu selection and seven actual monster slots',()=>{
 const html=read('duo-campaign-v2.html'),css=read('assets/duo-solo-parity-v219.css');
 const solo=read('index.html');
 for(const cls of ['ad196-title','ad196-reveal','ad196-ready','ad196-panel',
  'ad196-crest','ad196-kicker','ad196-wordmark','ad196-nav','ad196-bottom']){
  assert.ok(html.includes(cls),cls+' missing from duo');
  assert.ok(solo.includes(cls),cls+' missing from solo');
 }
 for(const id of ['duoStartNotice','duoStartAccept','duoStartDecline','duoStartCancel',
  'duoJoinValue','duoJoinManual'])
  assert.ok(html.includes('id="'+id+'"'),id);
 assert.match(css,/grid-template-columns:repeat\(7,minmax\(0,1fr\)\)/);
 for(let seat=0;seat<4;seat++)assert.match(css,new RegExp('data-seat="'+seat+'"'));
 assert.match(css,/data-lobby-section="deck"/);
 assert.match(css,/data-lobby-section="collection"/);
 assert.match(css,/data-lobby-section="profile"/);
 const client=read('assets/duo-parity-v160.js');
 assert.match(client,/pasteInvite:async value=>/);
 assert.match(client,/type:'invitePreview',roomId:id,invite:secret/);
 assert.match(client,/type:'acceptPartyStart'/);
});
