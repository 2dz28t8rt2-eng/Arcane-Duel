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
test('solo fusion starts sample on orbit and values phase gets one cue',()=>{
 const cinema=read('assets/fusion-cinema-ritual.js');
 assert.match(cinema,/ArcaneSfx208\.play\('orbit'\)/);
 assert.match(cinema,/await wait\(3900\)/);
 assert.match(cinema,/await wait\(1850\)/);
 assert.match(cinema,/ArcaneSfx208\?\.play\?\.\('calc'\)/);
});
test('duo shows rotating material cards and delays reveal until after fusion orbit',()=>{
 const cinema=read('assets/duo-cinema-v170.js');
 const style=read('assets/duo-cinema-v170.css');
 assert.match(cinema,/duo-cinema208-orbit/);
 assert.match(cinema,/schedule\(stages\[0\],5750,stamp\)/);
 assert.match(style,/@keyframes ad208-orbit-card/);
});
test('result music uses temporary ducking and not muting',()=>{
 const music=read('assets/arcane-soundscape-v196.js');
 const solo=read('assets/duel-cinematics-v42.js');
 assert.match(music,/setDuck/);
 assert.match(solo,/ArcaneSfx208\?\.result/);
 assert.match(read('assets/arcane-sfx-v208.js'),/setDuck\?\.\(\.16,4300\)/);
});
test('new sampled pack is not required for combat determinism',()=>{
 const sfx=read('assets/arcane-sfx-v208.js');
 assert.match(sfx,/onDuoState/);
 assert.match(sfx,/decayed/);
 assert.match(sfx,/Math\.min\(3,decayed\)/);
 const soundFiles=['damage','decay','destroy','draw','fusion-calc','fusion-orbit',
  'leader-idle','leader-roar','lose','menu','powerup','summon'];
 for(const f of soundFiles)assert.ok(fs.existsSync(path.join(ROOT,'assets/sfx-v208',f+'.ogg')),f);
});
