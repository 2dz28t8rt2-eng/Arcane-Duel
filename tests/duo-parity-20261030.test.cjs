'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

function uiHarness(){
 const listeners=new Map();
 const storage=new Map([['arcane-duo-battle-zoom-v2','85']]);
 const window={
  document:{addEventListener:(type,fn)=>listeners.set(type,fn)},
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},
  matchMedia:()=>({matches:false})
 };
 const module={exports:{}};
 vm.runInNewContext(read('assets/duo-ux-v204.js'),{window,module,console},
  {filename:'duo-ux-v204.js'});
 return {api:module.exports,storage,listeners};
}

test('Duo battle zoom allows enlarged 80–140 percent shared field, stays local to viewer',()=>{
 const {api,storage}=uiHarness();
 assert.equal(api.zoomClamp(65),80);
 assert.equal(api.zoomClamp(83),85);
 assert.equal(api.zoomClamp(100),100);
 assert.equal(api.zoomClamp(119),120);
 assert.equal(api.setBattleZoom(110),110);
 assert.equal(storage.get('arcane-duo-battle-zoom-v2'),'110');
 assert.equal(typeof api.decorate,'function');
 const source=read('assets/duo-ux-v204.js');
 assert.match(source,/seats\.style\.zoom=battleZoom\+'%'/);
 assert.doesNotMatch(source,/game\.players\[[^\]]+\]\.zoom\s*=/);
 assert.match(read('assets/duo-ux-v204.css'),/#duoBattleArena \.stats\{\s*position:sticky/);
 assert.match(read('duo-campaign-v2.html'),/id="duoAlliedLP"/);
 assert.match(read('duo-campaign-v2.html'),/id="duoEnemyLP"/);
});

test('Duo result cue leads the title by 150ms, with the long solo music fade',()=>{
 const ux=read('assets/duo-ux-v204.js');
 const sfx=read('assets/arcane-sfx-v208.js');
 const music=read('assets/arcane-soundscape-v196.js');
 assert.match(ux,/ArcaneSoundscape\?\.fadeOutForResult\?\.\(5300\)/);
 assert.match(ux,/duration-150/);
 assert.match(ux,/ArcaneSfx208\?\.result\?\.\(won\?'win':'lose'\)/);
 assert.match(ux,/ArcaneSoundscape\?\.resetResultFade\?\.\(\)/);
 const duoPart=sfx.slice(sfx.indexOf('function onDuoState('),sfx.indexOf('function stopAll()'));
 assert.doesNotMatch(duoPart,/result\(player\.team/,'sample must not pre-play on receipt');
 assert.match(music,/function fadeOutForResult\(/);
 assert.match(music,/const musicScale=scene=>\['duel','shadow','boss'\]/);
});

test('Duo first Rudelführer reveals abilities and gives human-readable first-use help',()=>{
 const ux=read('assets/duo-ux-v204.js'),cinema=read('assets/duo-cinema-v170.js');
 for(const skill of ['Rudelinstinkt','Blutspur','Rudelruf'])
  assert.ok(ux.includes(skill),skill+' needs an explanation');
 assert.match(ux,/arcane-duo-leader-guide-v1/);
 assert.match(ux,/predatorLeader&&!prior\.has\(c\.uid\)/);
 assert.match(ux,/},11650\)/);
 assert.match(cinema,/alpha\?11200:8850/);
 assert.match(ux,/Eure Monster teilen sich sieben Zonen/);
});

test('Duo Soul panel remains action-authorized to current human, with plain-language DEF protection',()=>{
 const ux=read('assets/duo-ux-v204.js');
 const bond=read('assets/duo-soul-bond-v206.js');
 assert.match(ux,/context\?\.seat===player\.seat&&context\.game\?\.activeSeat===context\.seat/);
 for(const action of ['soulCondense','soulDischarge','soulRaid'])
  assert.ok(ux.includes("'"+action+"'"));
 assert.match(ux,/action\.type==='soulRaid'\?2750:1750/);
 assert.match(ux,/SEELENESSENZ −/);
 assert.match(bond,/SEELENBUND AKTIV/);
 assert.match(bond,/35 % des eingehenden Schadens/);
});

test('Duo uses newest pack bloom and shared sound resources',()=>{
 const html=read('duo-campaign-v2.html');
 assert.match(html,/pack-cinema-v195\.css\?v=20261030-smooth-reveal/);
 assert.match(html,/arcane-sfx-v208\.js\?v=[^"\s]+/);
 assert.match(html,/duo-ux-v204\.js\?v=shared-presentation-228/);
 const pack=read('assets/pack-cinema-v195.css');
 assert.match(pack,/ad195-warming/);
 assert.match(pack,/ad195-reveal-light 1\.55s/);
 assert.match(pack,/prefers-reduced-motion:reduce/);
});

test('Duo combat remains server-authoritative and its independent save is not blended into solo',()=>{
 const client=read('assets/duo-shared-rules-v160.js');
 const server=read('supabase/functions/arcane-duo-v2/duo-rules.js');
 assert.equal(client,server,'local and Edge rule calculators must match exactly');
 const duo=read('assets/duo-parity-v160.js');
 const ux=read('assets/duo-ux-v204.js');
 assert.match(duo,/window\.ArcaneDuoUX204\?\.decorate\?\.\(\{game,seat,roomId,catalog,send\}\)/);
 assert.match(ux,/Rival hands remain private/);
 assert.match(duo,/seat=payload\.seat/);
 assert.match(duo,/const p=game\.players\[seat\],legal=choices\.legalChoices\(game,seat\)/);
 assert.match(read('duo-campaign-v2.html'),/Deine Sammlung gehört allein dir und bleibt von deinem Einzelspieler-Deck getrennt/);
});
