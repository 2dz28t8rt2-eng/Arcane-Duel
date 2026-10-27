'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const code=file=>fs.readFileSync(path.join(root,file),'utf8');

function fixture(){
 const events={};let audio=null;
 class Param{setValueAtTime(){}setTargetAtTime(){}exponentialRampToValueAtTime(){}}
 class Node{constructor(){for(const k of ['gain','frequency','Q','threshold','ratio','attack','release'])this[k]=new Param();}connect(){}start(){}stop(){}}
 class AudioContext{
  constructor(){this.state='running';this.currentTime=0;this.sampleRate=800;this.destination=new Node();}
  createGain(){return new Node();}createConvolver(){return new Node();}
  createDynamicsCompressor(){return new Node();}createBiquadFilter(){return new Node();}
  createOscillator(){return new Node();}createBufferSource(){return new Node();}
  createBuffer(){return {getChannelData:()=>new Float32Array(20)};}
  resume(){return Promise.resolve();}
 }
 class Audio{
  constructor(){audio=this;this.paused=true;this.volume=0;this.playCount=0;this.listeners={};}
  pause(){this.paused=true;}load(){this.paused=true;}
  play(){this.paused=false;this.playCount++;return Promise.resolve();}
  addEventListener(name,handler){this.listeners[name]=handler;}
 }
 const title={hidden:false},duel={hidden:true};
 const overlay={boss:false,classList:{contains:()=>false},querySelector(){return this.boss?{}:null;}};
 const elements={'ad196-title':title,duelScreen:duel,overlay};
 const storage=new Map(),store={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
 const host={append(){}};
 const document={readyState:'loading',hidden:false,body:{append(){}},
  getElementById:id=>elements[id]||null,
  querySelector:s=>s==='.mast-actions'?host:null,
  addEventListener:(name,fn)=>(events[name]??=[]).push(fn),
  createElement:()=>({addEventListener(){},setAttribute(){}})};
 const window={Audio,AudioContext,localStorage:store};
 const scope={window,document,localStorage:store,setInterval:()=>1,game:{id:'duel-1',showcase:false,opponentId:1}};
 vm.runInNewContext(code('assets/arcane-track-catalog-v014.js'),scope);
 document.readyState='complete';
 vm.runInNewContext(code('assets/arcane-soundscape-v196.js'),scope);
 return {window,scope,title,duel,overlay,get audio(){return audio;}};
}

test('catalog contains 20 licensed unique tracks and exactly 17 random battle themes',()=>{
 const f=fixture(),{all,tracks}=f.window.ArcaneTrackCatalog;
 assert.equal(all.length,20);
 assert.equal(tracks.battle.length,17);
 assert.equal(new Set(all.map(t=>t.file)).size,20);
 assert.equal(new Set(tracks.battle.map(t=>t.id)).size,17);
 assert.equal(tracks.boss.artist,'Vishwa Jay');
 assert.ok(tracks.battle.every(t=>t.id!==tracks.boss.id));
 assert.ok(all.every(t=>t.title&&t.artist&&t.license&&t.source&&t.licenseUrl));
 assert.ok(all.every(t=>fs.existsSync(path.join(root,t.file))), 'Every music URL must resolve to a bundled file');
 assert.ok(all.every(t=>!t.title.includes('Mind In Motion')&&!t.title.includes('Driving Game')));
});

test('every shipped music byte matches its source package integrity receipt',()=>{
 const entries=code('assets/music-v014/SHA256SUMS.txt').trim().split(/\r?\n/);
 assert.equal(entries.length,20);
 for(const entry of entries){
  const [,expected,file]=/^([a-f\d]{64})  (.+)$/.exec(entry)||[];
  assert.ok(expected&&file,`Invalid receipt entry: ${entry}`);
  const actual=crypto.createHash('sha256').update(fs.readFileSync(path.join(root,'assets/music-v014',file))).digest('hex');
  assert.equal(actual,expected,`Source-byte mismatch: ${file}`);
 }
});

test('title, menu, Eiman dialogue and duel resolve exclusive tracks with artists',()=>{
 const f=fixture(),api=f.window.ArcaneSoundscape;
 assert.equal(api.getNowPlaying().title,'Morningstar');
 assert.equal(f.audio.playCount,1);
 f.title.hidden=true;api.refresh();
 assert.equal(api.getNowPlaying().artist,'David KBD');
 f.overlay.boss=true;api.refresh();
 assert.equal(api.getNowPlaying().id,'morning-attack');
 assert.equal(api.getNowPlaying().artist,'Vishwa Jay');
 f.overlay.boss=false;f.duel.hidden=false;api.refresh();
 assert.ok(f.window.ArcaneTrackCatalog.tracks.battle.some(t=>t.id===api.getNowPlaying().id));
 const firstId=api.getNowPlaying().id;api.refresh();assert.equal(api.getNowPlaying().id,firstId);
 f.scope.game.showcase=true;api.refresh();assert.equal(api.getNowPlaying().id,'morning-attack');
});

test('mute and stop controls really pause audio; volume remains configurable',()=>{
 const f=fixture(),api=f.window.ArcaneSoundscape;
 api.setTransientMuted(true);assert.equal(f.audio.paused,true);
 api.setTransientMuted(false);assert.equal(f.audio.paused,false);
 api.setVolume(.4);assert.equal(f.audio.volume,.4);
 api.setEnabled(false);assert.equal(f.audio.paused,true);
 assert.equal(api.getSettings().enabled,false);
});

test('long duel blackout starts music before revealing the game and shows song plus artist',async()=>{
 const appended=[],muted=[];
 const make=()=>{
  const flags=new Set();return {className:'',textContent:'',children:[],
   setAttribute(){},append(child){this.children.push(child)},
   classList:{add:x=>flags.add(x),remove:x=>flags.delete(x),contains:x=>flags.has(x)},flags};
 };
 const document={body:{append:node=>appended.push(node)},getElementById:()=>null,createElement:make};
 const window={matchMedia:()=>({matches:false}),ArcaneSoundscape:{
  setTransientMuted:v=>muted.push(v),
  getNowPlaying:()=>({title:'Enemy Infiltration',artist:'Eric Matyas'})}};
 const context={window,document,setTimeout:fn=>(fn(),1),MutationObserver:class{observe(){}},console};
 vm.runInNewContext(code('assets/duel-polish-v197.js'),context);
 await window.ArcaneDuelPolish197.blackout(2850,true);
 assert.deepEqual(muted,[true,false]);
 assert.equal(appended[0].children[0].textContent,'♫ Enemy Infiltration — Eric Matyas');
 assert.ok(!appended[0].flags.has('ad197-active'));
 assert.match(code('assets/duel-polish-v197.css'),/ad197-theme-fade/);
});
