'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

function soundscapeHarness(){
 const storage=new Map(),elements={},events=new Map();let constructed=0,notes=0;
 class Param{
  constructor(){this.value=0;}
  setTargetAtTime(v){this.value=v;}
  setValueAtTime(v){this.value=v;}
  exponentialRampToValueAtTime(v){this.value=v;}
 }
 class Node{
  constructor(){this.gain=new Param();this.frequency=new Param();this.Q=new Param();
   for(const p of ['threshold','ratio','attack','release'])this[p]=new Param();}
  connect(){}start(){notes++;}stop(){}
 }
 class AudioContext{
  constructor(){constructed++;this.state='running';this.currentTime=0;this.sampleRate=800;this.destination=new Node();}
  createGain(){return new Node();}
  createConvolver(){return new Node();}
  createDynamicsCompressor(){return new Node();}
  createBiquadFilter(){return new Node();}
  createOscillator(){return new Node();}
  createBufferSource(){return new Node();}
  createBuffer(ch,len){return {getChannelData:()=>new Float32Array(len)};}
  resume(){return Promise.resolve();}
 }
 const host={append(child){this.last=child;}};
 const document={readyState:'complete',hidden:false,
  querySelector:q=>q==='.mast-actions'?host:null,
  getElementById:id=>elements[id]||null,
  addEventListener:(type,fn)=>events.set(type,fn),
  createElement:()=>({addEventListener(){},setAttribute(){}})};
 const store={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
 const window={AudioContext,localStorage:store};
 const scope={window,document,localStorage:store,setInterval:()=>1};
 vm.runInNewContext(read('assets/arcane-soundscape-v196.js'),scope);
 return {api:window.ArcaneSoundscape,document,elements,events,storage,host,
  get constructed(){return constructed;},get notes(){return notes;}};
}

test('four original instrumental score profiles are musically distinct',()=>{
 const f=soundscapeHarness();
 assert.deepEqual(Object.keys(f.api.scores).sort(),['duel','mystery','shadow','title']);
 assert.equal(f.api.scores.title.character,'piano');
 assert.equal(f.api.scores.mystery.character,'mystery');
 assert.ok(f.api.scores.duel.bpm>f.api.scores.title.bpm);
 assert.ok(f.api.scores.shadow.bpm<f.api.scores.duel.bpm);
 for(const profile of Object.values(f.api.scores)){
  assert.equal(profile.bars.length,8);
  assert.ok(profile.bars.every(b=>b.chord.length>=3&&b.melody.length>=2));
 }
});

test('no audio context or scheduled notes before the first user interaction',()=>{
 const f=soundscapeHarness();
 assert.equal(f.constructed,0);
 assert.equal(f.notes,0);
 assert.equal(f.api.getSettings().enabled,true);
 assert.equal(f.host.last.textContent,'♫ Musik: An');
 f.events.get('pointerdown')();
 assert.equal(f.constructed,1);
 assert.ok(f.notes>0);
});

test('title, exploration, early duel and high-tier duel select correct scores',()=>{
 const f=soundscapeHarness();
 const title={hidden:false};const duel={hidden:true};
 f.elements['ad196-title']=title;f.elements['duelScreen']=duel;
 f.api.start();f.api.refresh();assert.equal(f.api.getSettings().scene,'title');
 title.hidden=true;f.api.refresh();assert.equal(f.api.getSettings().scene,'mystery');
 duel.hidden=false;f.api.refresh();assert.equal(f.api.getSettings().scene,'duel');
 f.api.setScene('shadow');f.api.refresh();assert.equal(f.api.getSettings().scene,'shadow');
 f.api.setScene('');f.api.refresh();assert.equal(f.api.getSettings().scene,'duel');
});

test('music controls persist independent preferences and can disable playback',()=>{
 const f=soundscapeHarness();
 f.api.setVolume(.22);f.api.setEnabled(false);
 assert.equal(f.api.start(),false);
 const saved=JSON.parse(f.storage.get('arcane-duel-soundscape-v1'));
 assert.equal(saved.volume,.22);assert.equal(saved.enabled,false);
 assert.equal(f.host.last.textContent,'♫ Musik: Aus');
});

test('title overlay integrates separately from existing campaign and saved games',()=>{
 const solo=read('index.html'),duo=read('duo-campaign-v2.html'),catalog=read('collection-v3.html');
 const js=read('assets/arcane-title-v196.js');
 assert.match(solo,/id="ad196-title"[^>]*role="dialog"/);
 assert.match(solo,/<div class="app" id="app" inert>/);
 assert.match(solo,/data-ad196-action="solo"/);
 assert.match(solo,/data-ad196-action="resume" hidden/);
 assert.match(solo,/data-ad196-action="duo"/);
 assert.match(solo,/data-ad196-action="collection"/);
 assert.match(solo,/assets\/arcane-title-v196\.js/);
 assert.match(solo,/assets\/arcane-soundscape-v196\.js/);
 assert.match(duo,/assets\/arcane-soundscape-v196\.js/);
 assert.match(catalog,/assets\/arcane-soundscape-v196\.js/);
 assert.match(js,/\.fm-resume-bar \[data-royal="resume"\]/);
 assert.doesNotMatch(js,/localStorage\.clear|removeItem|activeDuel\s*=/);
 assert.doesNotMatch(js,/game\s*=/);
});
