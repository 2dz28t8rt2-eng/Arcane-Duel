'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {boot}=require('./helpers/game-runtime.cjs');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

function sampledAudioHarness(){
 const calls=[],intervals=[];
 class Audio {
  constructor(src){this.src=src;this.volume=1;this.preload='';this.paused=false;}
  addEventListener(){}
  load(){}
  play(){calls.push(this.src);this.paused=false;return Promise.resolve();}
  pause(){this.paused=true;}
 }
 const g={id:'playtest-sound',mode:'pve',winner:null,turn:1,active:0,
  log:['Duellant 1 beginnt.'],players:[
   {lp:3000,hand:[],field:[{uid:101,card:{atk:180,def:250}},null,null,null,null]},
   {lp:3000,hand:[],field:[null,null,null,null,null]}
  ]};
 const document={readyState:'complete',hidden:false,getElementById:()=>null,addEventListener(){}};
 const window={ArcaneSoundscape:{getSettings:()=>({enabled:true,volume:.35})}};
 const scope={window,document,game:g,uiMode:'duel',Audio,setTimeout:()=>1,setInterval:(fn,delay)=>{intervals.push({fn,delay});return 1;},console};
 vm.runInNewContext(read('assets/arcane-sfx-v208.js'),scope);
 const tick=intervals.find(x=>x.delay===260)?.fn;
 assert.equal(typeof tick,'function');
 return {g,calls,tick};
}

test('audio snapshot uses actual card values and newest-first duel logs, with no removal crash',()=>{
 const {g,calls,tick}=sampledAudioHarness();
 tick();
 g.turn=2;g.log.unshift('Zerfall: Monster verlieren Kampfwerte.');
 g.players[0].field[0].card.atk-=30;
 assert.doesNotThrow(()=>tick());
 assert.equal(calls.filter(src=>src.endsWith('/decay.ogg')).length,1);
 g.players[0].field[0]=null;
 assert.doesNotThrow(()=>tick(),'a destroyed field card cannot crash the audio timer');
 assert.equal(calls.filter(src=>src.endsWith('/destroy.ogg')).length,0,
  'destruction sound belongs to the impact/defeat event, not polling');
 g.players[0].field[1]={uid:200,card:{atk:70,def:80}};
 tick();
 assert.equal(calls.filter(src=>src.endsWith('/summon.ogg')).length,0,
  'normal summons use placement callbacks, not late polling');
});

test('Lv1 researcher unlock is deterministic by tournament III with optional early encounters',()=>{
 const result=boot().run("(()=>{profile=freshProfile();const s=window.ArcaneLv1Saga;const before=s.forced();profile.cleared=[1,2,3];const guaranteed=s.forced();s.maybeOffer({mode:'pve',context:'tournament',surrendered:false,automatic:false});return {before,guaranteed,offered:profile.lv1Saga.offered};})()");
 assert.equal(result.guaranteed,true);
 assert.equal(result.offered,true);
});

test('all major audio cues are anchored at actual actions and soundscape never ducks for results',()=>{
 const sfx=read('assets/arcane-sfx-v208.js'),battle=read('assets/arcane-battle-fx.js');
 const attack=read('assets/attack-impact-v113.js'),solo=read('assets/game.js');
 const soul=read('assets/soul-burst-v207.js'),finale=read('assets/duel-polish-v197.js');
 const draw=read('assets/hand-draw-v1161.js');
 assert.match(sfx,/pointerdown/);
 assert.match(sfx,/newLogs=oldAt>=0\?now\.log\.slice\(0,oldAt\)/);
 assert.match(sfx,/\(turnDecay&&decayed\)\|\|decayLogged/);
 assert.match(battle,/if\(res\?\.destroyed\?\.length&&g===game&&uiMode==='duel'\)/);
 assert.match(attack,/if\(di===null\)window\.ArcaneSfx208\?\.play\?\.\('damage'\)/);
 assert.match(solo,/if\(a\.type==='place'&&result\.card&&!fusion\)window\.ArcaneSfx208/);
 assert.match(soul,/await sleep\(305\);[\s\S]*?\.play\?\.\('damage'\)/);
 assert.match(finale,/announcement\.textContent=victory\?'Sieg':'Niederlage';[\s\S]*?\.result\?\.\(victory\?'win':'lose'\)/);
 assert.match(sfx,/Keep battle music at its normal level/);
 assert.doesNotMatch(sfx,/\.setDuck\s*\(/);
 assert.match(draw,/newly\.forEach/);
 assert.match(draw,/revealOpeningHand/);
});

test('fusion, positioning, victory and research safeguards remain wired',()=>{
 const ritual=read('assets/fusion-cinema-ritual.js'),stage=read('assets/summon-stage-v56.js');
 const label=read('assets/fusion-utility-v55.js'),style=read('assets/duel-polish-v197.css');
 const labels=read('assets/duel-cinematics-v42.js'),fate=read('assets/fate.css');
 const guide=read('assets/lv1-saga-v43.js'),handbook=read('assets/hand-draw-v1161.js');
 const game=read('assets/game.js');
 assert.match(ritual,/Math\.max\(2,Math\.min\(5,c\.materialsUsed\|\|materials\.length\|\|2\)\)/);
 assert.match(ritual,/fusionAudio\?\.pause\?\.\(\)/);
 assert.match(stage,/data-ad207-mode="discard"/);
 assert.match(stage,/data-ad207-commit-discard/);
 assert.match(stage,/data-ad207-clear/);
 assert.match(label,/RUDELFÜHRER FÄHIGKEIT/);
 assert.match(style,/ad209-ace-brief/);
 assert.match(style,/ad-summon-hidden/);
 assert.match(fate,/fateCardGlow 5\.5s ease-in-out infinite/);
 assert.match(labels,/35 % seiner aktuellen ATK/);
 assert.match(labels,/nur, wenn es den Angriff überlebt/);
 assert.match(guide,/id='lv1QuestTeaser'/);
 assert.match(game,/Speicherwarnung schließen/);
 assert.match(handbook,/440/);
});
