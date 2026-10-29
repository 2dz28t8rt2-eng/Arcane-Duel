'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

function api(){
  const window={};
  vm.runInNewContext(read('assets/combat-identity-v183.js'),{window,console},
    {filename:'combat-identity-v183.js'});
  return window.ArcaneCombatIdentity183;
}

test('Verdichten shows exactly the remaining ATK and DEF bonus, without changing rules',()=>{
  const identity=api();
  const before=identity.state({uid:12,role:'soul',mode:'def',condensed:0},0,0);
  const after=identity.state({uid:12,role:'soul',mode:'def',condensed:320},0,0);
  const result=identity.eventFor(before,after);
  assert.equal(result.kind,'soul');
  assert.match(result.label,/ATK \+160 · DEF \+320/);
  assert.equal(identity.eventFor(after,after),null);
  assert.equal(identity.eventFor(after,{...after,condensed:120}),null,
    'a decaying condensation shield must not play a new cast animation');
  assert.equal(after.condensed,320,'read-only snapshots never consume essence');
});

test('guardians, predators and resonators get different contextual cues',()=>{
  const i=api();
  const guard=i.state({uid:1,role:'guardian',mode:'atk'},0,0);
  assert.match(i.eventFor(guard,{...guard,mode:'def'}).label,/Schildstellung/);
  assert.match(i.eventFor(guard,{...guard,guardLeft:2}).label,/Bollwerk/);
  const predator=i.state({uid:2,role:'predator',mode:'atk'},0,1,3);
  assert.match(i.eventFor(null,predator,{duo:true}).label,/Schwarm \+6 %/);
  assert.equal(i.eventFor(predator,{...predator,attacked:true}).kind,'predator');
  const resonator=i.state({uid:3,role:'resonator',fusion:true,resonance:0},0,2);
  assert.match(i.eventFor(resonator,{...resonator,resonance:1}).label,/\+20 % Fusion/);
  const allrounder=i.state({uid:4,role:'combatant',resonance:0},0,3);
  assert.equal(i.resonantPct({...allrounder,resonance:3}),16);
  assert.equal(i.resonantPct({...resonator,resonance:2}),30);
});

test('combat identity scripts are shared with 2v2 and run only after cards are rendered',()=>{
  const solo=read('index.html'),duo=read('duo-campaign-v2.html');
  const render=read('assets/duo-parity-v160.js');
  const js=read('assets/combat-identity-v183.js');
  const css=read('assets/combat-identity-v183.css');
  assert.match(solo,/assets\/combat-identity-v183\.css/);
  assert.match(duo,/assets\/combat-identity-v183\.css/);
  assert.ok(solo.indexOf('assets/duel-comfort-v182.js')<solo.indexOf('assets/combat-identity-v183.js'));
  assert.ok(duo.indexOf('assets/combat-identity-v183.js')<duo.indexOf('assets/duo-parity-v160.js'));
  assert.match(render,/window\.ArcaneCombatIdentity183\?\.duoDidRender\?\.\(\{game,roomId\}\)/);
  assert.match(js,/typeof animationSpeed!=='undefined'&&animationSpeed==='instant'/);
  assert.match(js,/prefers-reduced-motion: reduce/);
  assert.match(css,/\.ad183-notice-soul/);
  assert.match(css,/\.ad183-role-guardian/);
  assert.match(css,/\.ad183-role-predator/);
});

test('standalone visual preview exercises the real shared animation runtime',()=>{
  const preview=read('tests/browser-combat-identity-v183.html');
  assert.match(preview,/assets\/combat-identity-v183\.js/);
  assert.match(preview,/ArcaneCombatIdentity183\.duoDidRender/);
  for(const id of ['predator','guardian','soul','resonator'])assert.match(preview,new RegExp('id="'+id+'"'));
  const inline=preview.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(inline,'the visual demo needs its own local controls');
  assert.doesNotThrow(()=>new Function(inline));
});

test('2v2 paintings only add presentation nodes and keep card data untouched',()=>{
  const nodes=[];
  const slots=Array.from({length:7},()=>({classList:{add(){}},appendChild(x){nodes.push(x);}}));
  const field={children:slots};
  const panel={querySelector(){return field;}};
  const window={matchMedia:()=>({matches:false})};
  const document={hidden:true,querySelector(selector){return selector.includes('data-seat="0"')?panel:null;},
    createElement(){return {className:'',title:'',textContent:'',setAttribute(){}};},
    body:{classList:{contains(){return false;}}}};
  const original={uid:6,role:'soul',mode:'def',condensed:180,resonance:0};
  const game={players:[{seat:0,field:[original]}]};
  vm.runInNewContext(read('assets/combat-identity-v183.js'),{window,document,console});
  window.ArcaneCombatIdentity183.duoDidRender({game,roomId:'test-room'});
  assert.equal(nodes.some(x=>x.className==='ad183-condense-badge'&&x.textContent==='+90 ⚔'),true);
  assert.equal(original.condensed,180);
  assert.equal(original.role,'soul');
  assert.equal(game.players[0].field[0],original);
});
