'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const rules=require('../assets/duo-shared-rules-v160.js');
const pack=require('../assets/duo-card-catalog-v160.json');
const cinema=require('../assets/duo-cinema-v170.js');
const catalog=Object.fromEntries(pack.cards.map(card=>[card.id,card]));
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8');
const live=(id,extra={})=>({id,uid:1000+id,level:catalog[id].level,
 atk:catalog[id].atk,def:catalog[id].def,role:catalog[id].role,mode:'atk',fusion:false,
 used:false,switched:false,placedRound:0,soul:0,condensed:0,lv1Shield:0,
 soulCooldown:0,raidCooldown:0,condenseLeft:0,condenseSlice:0,
 drainPreference:0,lastSoulAction:-1,lastDrainSwitch:-1,decaySkipOwnTurn:-1,
 decayGrace:0,maxDef:catalog[id].def,resonance:0,...extra});
function match(){
 const deck=[...pack.starterMain],fusions=[...pack.starterFusions];
 const base=rules.create({roomId:'duo-v194',hostName:'Hannes',hostDeck:deck,
  hostFusions:fusions,enemyDeckA:deck,enemyDeckB:deck,
  enemyFusionsA:fusions,enemyFusionsB:fusions,chapter:1,entry:'new',catalog});
 const state=rules.apply(base,2,{type:'join',name:'Partner',deck,fusions},{catalog});
 state.round=3;return state;
}
const act=(before,seat,action)=>rules.apply(before,seat,action,{catalog});
function audioFixture({stored=null,hidden=false,audio=true}={}){
 let created=0,oscillators=0,noises=0;
 const tasks=[],settings=new Map(stored?[['arcane-duo-sound-v194',JSON.stringify(stored)]]:[]);
 class Param{
  constructor(){this.value=1;this.last=null;}
  setValueAtTime(v){this.last=v;}
  exponentialRampToValueAtTime(v){this.last=v;}
  setTargetAtTime(v){this.last=v;}
 }
 class Node{
  constructor(){this.gain=new Param();this.frequency=new Param();this.Q=new Param();
   for(const k of ['threshold','knee','ratio','attack','release'])this[k]=new Param();}
  connect(){}start(){}stop(){}
 }
 class Context{
  constructor(){created++;this.state='running';this.sampleRate=600;
   this.currentTime=0;this.destination=new Node();}
  createGain(){return new Node();}
  createOscillator(){oscillators++;return new Node();}
  createBufferSource(){noises++;return new Node();}
  createBiquadFilter(){return new Node();}
  createDynamicsCompressor(){return new Node();}
  createBuffer(_,length){return {getChannelData:()=>new Float32Array(length)};}
  resume(){this.state='running';return Promise.resolve();}
 }
 class Element{
  constructor(){this.handlers={};this.dataset={};this.value='35';this.textContent='';
   this.attributes={};this.disabled=false;}
  addEventListener(type,fn){this.handlers[type]=fn;}
  setAttribute(k,v){this.attributes[k]=v;}
  fire(type){this.handlers[type]?.();}
 }
 const elements=Object.fromEntries(['ad194-sound-controls','ad194-sound-toggle',
  'ad194-sound-volume','ad194-sound-value','ad194-sound-hint'].map(x=>[x,new Element()]));
 const document={readyState:'complete',visibilityState:hidden?'hidden':'visible',hidden,
  getElementById:id=>elements[id]||null};
 const window={AudioContext:audio?Context:undefined,
  localStorage:{getItem:k=>settings.get(k)||null,setItem:(k,v)=>settings.set(k,v)},
  addEventListener:()=>{},ArcaneDuoCinema170:cinema};
 const scope={window,document,Math,JSON,Number,
  setTimeout:(fn,ms)=>{tasks.push({fn,ms,clear:false});return tasks.length;},
  clearTimeout:id=>{if(tasks[id-1])tasks[id-1].clear=true;}};
 vm.runInNewContext(read('assets/duo-impact-cinema-v192.js'),scope);
 vm.runInNewContext(read('assets/duo-abilities-cinema-v193.js'),scope);
 vm.runInNewContext(read('assets/duo-sound-v194.js'),scope);
 return {api:window.ArcaneDuoSound194,window,document,tasks,elements,settings,
  get created(){return created;},get oscillators(){return oscillators;},
  get noises(){return noises;}};
}

test('fresh visitors start muted; state sync never constructs an audio context',()=>{
 const f=audioFixture(),before=match();
 before.players[0].field[0]=live(4,{atk:950});
 const after=act(before,0,{type:'attack',slot:0,targetSeat:null,targetSlot:null});
 const cues=f.api.onState(before,after,catalog,0);
 assert.ok(cues.some(e=>e.kind==='attack'));
 assert.ok(cues.some(e=>e.kind==='heavy'||e.kind==='hit'));
 assert.equal(f.api.isEnabled(),false);
 assert.equal(f.created,0);
 assert.equal(f.tasks.length,0);
 assert.equal(f.elements['ad194-sound-toggle'].attributes['aria-pressed'],'false');
});

test('card draw follows public confirmed hand count, without seeing card identities',()=>{
 const f=audioFixture(),before=match();before.activeSeat=3;
 before.players[0].hand.splice(0,2);
 const after=act(before,3,{type:'end'});
 const a=f.api.analyze(rules.view(before,0),rules.view(after,0),catalog,0);
 assert.ok(a.some(e=>e.kind==='draw'&&e.count===2));
 assert.equal(f.api.analyze(after,after,catalog,0).length,0);
});

test('differentiate attack flight, real hit, shield absorption and counterstrike',()=>{
 const f=audioFixture();let before=match();
 before.players[0].field[0]=live(4,{atk:2050});
 let after=act(before,0,{type:'attack',slot:0,targetSeat:null,targetSlot:null});
 let cues=f.api.analyze(before,after,catalog,0);
 assert.ok(cues.find(e=>e.kind==='attack'&&e.delay===120));
 assert.ok(cues.find(e=>e.kind==='heavy'&&e.delay===395));

 before=match();before.players[0].field[0]=live(4,{atk:950});
 before.teams[1].shield=3000;
 after=act(before,0,{type:'attack',slot:0,targetSeat:null,targetSlot:null});
 cues=f.api.analyze(before,after,catalog,0);
 assert.ok(cues.some(e=>e.kind==='shield'));
 assert.ok(!cues.some(e=>e.kind==='hit'||e.kind==='heavy'),
  'a fully blocked hit must sound like a shield, not damage');

 before=match();before.players[0].field[0]=live(4,{atk:750});
 before.players[1].field[0]=live(7,{mode:'def',atk:500,def:950,maxDef:950});
 after=act(before,0,{type:'attack',slot:0,targetSeat:1,targetSlot:0});
 cues=f.api.analyze(before,after,catalog,0);
 assert.ok(cues.some(e=>e.kind==='counter'&&e.delay===1010));
});

test('the actual fusion reducer triggers the ritual sound once',()=>{
 const f=audioFixture(),before=match();
 const levelOne=pack.starterMain.find(id=>catalog[id]?.level===1);
 before.players[0].hand[0]=levelOne;before.players[0].hand[1]=levelOne;
 const material=before.players[0].hand.map((id,index)=>({id,index}))
  .filter(v=>catalog[v.id]?.level===1).slice(0,2)
  .map(v=>({from:'hand',index:v.index}));
 assert.equal(material.length,2);
 const templates=rules.fusionOptions(before,0,material,catalog).templates;
 const after=act(before,0,{type:'fusion',materials:material,slot:0,
  templateId:templates[0]});
 const cues=f.api.analyze(before,after,catalog,0);
 assert.equal(cues.filter(x=>x.kind==='fusion').length,1);
 assert.ok(!cues.some(x=>x.kind==='summon'));
});

test('Verdichten, Seelenentzug and resonance map to distinct sounds',()=>{
 const f=audioFixture();let before=match();
 before.players[0].field[0]=live(7,{role:'soul',mode:'def',soul:420});
 let after=act(before,0,{type:'soulCondense',slot:0});
 assert.ok(f.api.analyze(before,after,catalog,0).some(x=>x.kind==='condense'));

 before=match();before.activeSeat=3;
 before.players[0].field[0]=live(7,{role:'soul',mode:'def',soul:50});
 before.players[0].field[1]=live(0,{role:'combatant',resonance:0});
 before.players[1].field[0]=live(4,{atk:500,def:500});
 after=act(before,3,{type:'end'});
 const cues=f.api.analyze(before,after,catalog,0);
 assert.ok(cues.some(x=>x.kind==='siphon'));
 assert.ok(cues.some(x=>x.kind==='resonance'));
});

test('volume and mute are directly controllable, persisted and quiet on disabled tabs',()=>{
 const f=audioFixture(),button=f.elements['ad194-sound-toggle'];
 button.fire('click');
 assert.equal(f.api.isEnabled(),true);assert.equal(f.created,1);
 assert.ok(f.oscillators>0,'explicit activation offers a brief sound sample');
 const slider=f.elements['ad194-sound-volume'];slider.value='20';slider.fire('input');
 assert.equal(f.api.getVolume(),20);
 assert.equal(JSON.parse(f.settings.get('arcane-duo-sound-v194')).volume,20);
 const previous=f.oscillators;
 button.fire('click');assert.equal(f.api.isEnabled(),false);
 assert.equal(f.api.playPreview('fusion'),false);
 assert.equal(f.oscillators,previous);
 const g=audioFixture({stored:{enabled:true,volume:20},hidden:true});
 assert.equal(g.api.isEnabled(),true);
 assert.equal(g.created,0,'even saved opt-in never automatically unlocks audio');
 assert.equal(g.api.playPreview('draw'),false);
});

test('same-revision polling does not replay, new revisions cancel queued sounds',()=>{
 const f=audioFixture();f.elements['ad194-sound-toggle'].fire('click');
 const before=match();before.players[0].field[0]=live(4,{atk:900});
 const after=act(before,0,{type:'attack',slot:0,targetSeat:null,targetSlot:null});
 f.api.onState(before,after,catalog,0);const sounds=f.tasks.length;
 assert.ok(sounds>0);
 f.api.onState(after,after,catalog,0);
 assert.equal(f.tasks.length,sounds,'no sound replay during unchanged polling');
 f.api.onState(after,{...after,revision:after.revision+1,
  log:[...after.log,'Nur ein Hinweis.']},catalog,0);
 assert.ok(f.tasks.every(x=>x.clear),'previously queued cues are cancelled');
});

test('integration is client-only, opt-in, and loaded before 2v2 parity',()=>{
 const html=read('duo-campaign-v2.html'),parity=read('assets/duo-parity-v160.js');
 const source=read('assets/duo-sound-v194.js');
 assert.match(html,/duo-sound-v194\.css\?v=20261026-v194/);
 // Cache keys may change when the audio pack gains new confirmed cues.
 assert.match(html,/duo-sound-v194\.js\?v=[a-zA-Z0-9-]+/);
 assert.match(html,/id="ad194-sound-toggle"/);
 assert.match(html,/id="ad194-sound-volume"/);
 assert.ok(html.indexOf('duo-sound-v194.js')<html.indexOf('duo-parity-v160.js'));
 assert.match(parity,/ArcaneDuoSound194\?\.onState\(previous,game,catalog,seat\)/);
 assert.doesNotMatch(source,/\b(fetch|WebSocket)\s*\(/);
 assert.doesNotMatch(source,/\bsend\s*\(/);
 assert.doesNotMatch(source,/createElement\(['"]audio['"]\)|\.src\s*=\s*['"]https?:/);
});
