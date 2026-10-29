/* Arcane Duel v20.8 – Sound asset wiring and credits regression guards. */
'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=path.join(__dirname,'..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
test('main title has a Credits entry with artist links and thanks',()=>{
 const index=read('index.html');
 const title=read('assets/arcane-title-v196.js');
 const credits=read('assets/arcane-credits-v208.js');
 assert.match(index,/data-ad196-action="credits"/);
 assert.match(index,/arcane-credits-v208\.js/);
 assert.match(title,/if\(type==='credits'\)/);
 assert.match(credits,/Dankeschön/);
 for(const artist of ['Little Robot Sound Factory','Berklee','Darsycho','IgnisForge','David KBD'])
  assert.ok(credits.includes(artist),artist);
});
test('solo fusion plays orbit sample but silences experimental calculation cue',()=>{
 const cinema=read('assets/fusion-cinema-ritual.js');
 assert.match(cinema,/ArcaneSfx208\?\.play\?\.\('orbit'\)/);
 assert.match(cinema,/await wait\(3900\)/);
 assert.match(cinema,/await wait\(1850\)/);
 assert.doesNotMatch(cinema,/ArcaneSfx208\?\.startLoop\?\.\('calc'\)/);
 assert.match(cinema,/stopCalcLoop\?\.\(\)/);
 assert.match(cinema,/fusionAudio\?\.pause\?\.\(\)/);
});
test('duo shows rotating material cards and delays reveal until after fusion orbit',()=>{
 const cinema=read('assets/duo-cinema-v170.js');
 const style=read('assets/duo-cinema-v170.css');
 assert.match(cinema,/duo-cinema208-orbit/);
 assert.match(cinema,/schedule\(stages\[0\],5750,stamp\)/);
 assert.match(style,/@keyframes ad208-orbit-card/);
 assert.doesNotMatch(cinema,/ArcaneSfx208\?\.startLoop\?\.\('calc'\)/);
 assert.match(cinema,/stopCalcLoop\?\.\(\);stopCalcLoop=null/);
});
test('result SFX plays just before the title; battle music fades gradually',()=>{
 const music=read('assets/arcane-soundscape-v196.js');
 const solo=read('assets/duel-cinematics-v42.js');
 assert.match(music,/setDuck/);
 assert.doesNotMatch(solo,/ArcaneSfx208\?\.result/);
 assert.match(read('assets/duel-polish-v197.js'),/ArcaneSfx208\?\.result/);
 assert.doesNotMatch(read('assets/arcane-sfx-v208.js'),/setDuck\?\.\(\.16,4300\)/);
});
test('new sampled pack is not required for combat determinism',()=>{
 const sfx=read('assets/arcane-sfx-v208.js');
 assert.match(sfx,/onDuoState/);
 assert.match(sfx,/decayed/);
 assert.match(sfx,/Intentionally silent: no debuff\/decay cue/);
 const soundFiles=['damage','decay','destroy','draw','fusion-calc','fusion-orbit',
  'leader-idle','leader-roar','lose','menu','powerup','summon'];
 for(const f of soundFiles)assert.ok(fs.existsSync(path.join(ROOT,'assets/sfx-v208',f+'.ogg')),f);
});

const vm=require('node:vm');
function loopHarness(){
 const instances=[],tasks=[];
 class FakeAudio{
  constructor(src){this.src=src;this.volume=1;this.readyState=1;this.loop=false;
   this.playCalls=0;this.pauseCalls=0;this.handlers={};instances.push(this);}
  addEventListener(name,cb){this.handlers[name]=cb;}
  load(){}
  play(){this.playCalls++;return Promise.resolve();}
  pause(){this.pauseCalls++;}
 }
 const document={hidden:false,readyState:'loading',getElementById:()=>null,
  addEventListener(){}};
 const window={ArcaneSoundscape:{getSettings:()=>({enabled:true,volume:.35})}};
 const scope={document,window,Audio:FakeAudio,setTimeout:(fn,ms)=>{
  tasks.push({fn,ms});return tasks.length;},setInterval:()=>1};
 vm.runInNewContext(read('assets/arcane-sfx-v208.js'),scope);
 return {api:window.ArcaneSfx208,instances,tasks,document};
}
test('fusion calculation sample repeats natively until stopped, then fades',()=>{
 const h=loopHarness(),stop=h.api.startLoop('calc');
 assert.equal(typeof stop,'function');
 assert.equal(h.instances.length,1);
 const audio=h.instances[0];
 assert.ok(audio.src.endsWith('/fusion-calc.ogg'));
 assert.equal(audio.loop,true);
 assert.equal(audio.playCalls,1);
 stop();stop();
 assert.equal(h.tasks.filter(t=>t.ms>=30&&t.ms<=120).length,4);
 for(const task of h.tasks)task.fn();
 assert.equal(audio.pauseCalls,1);
});
test('stopping a fusion loop cannot accidentally stop a separate effect',()=>{
 const h=loopHarness(),stop=h.api.startLoop('calc');
 const effect=h.api.play('powerup');
 stop();
 for(const task of h.tasks.filter(t=>t.ms<=120))task.fn();
 assert.equal(h.instances[0].pauseCalls,1);
 assert.equal(effect.pauseCalls,0);
});
test('clearing all effects also immediately silences active fusion loops',()=>{
 const h=loopHarness();h.api.startLoop('calc');
 h.api.stopAll();
 assert.equal(h.instances[0].pauseCalls,1);
});
