'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

function fixture(){
 const added=[],muted=[];
 const banner={getClientRects:()=>[{}],querySelector:()=>({getBoundingClientRect:()=>({left:20,width:200,top:70,bottom:80})})};
 const elements={myBanner:banner,enemyBanner:banner};
 const document={getElementById:id=>elements[id]||null,
  createElement:()=>{
   const flags=new Set(),styles={};
   return {className:'',textContent:'',innerHTML:'',style:{setProperty:(k,v)=>styles[k]=v},
    setAttribute(){},remove(){this.removed=true},
    classList:{add:x=>flags.add(x),remove:x=>flags.delete(x),contains:x=>flags.has(x)},flags,styles};
  },body:{append:node=>added.push(node)}};
 const window={matchMedia:()=>({matches:false}),
  ArcaneSoundscape:{setTransientMuted:value=>muted.push(value)}};
 const context={window,document,setTimeout:callback=>{callback();return 1;},
  MutationObserver:class{observe(){}},render(){},console};
 vm.runInNewContext(read('assets/duel-polish-v197.js'),context,{filename:'duel-polish-v197.js'});
 return {window,added,muted};
}

test('damage number rises before a scaled burst and removal, without changing life points',async()=>{
 const f=fixture();
 await f.window.ArcaneDamageFX.play(0,3500);
 const number=f.added[0];
 assert.equal(number.textContent.replace(/[^\d−]/g,''),'−3500');
 assert.ok(number.className.includes('ad197-heavy'));
 assert.ok(number.flags.has('ad197-burst'));
 assert.equal(number.style.top,'57px','player hit appears above LP track');
 assert.ok(number.removed);
 await f.window.ArcaneDamageFX.play(1,600);
 assert.equal(f.added[1].style.top,'115px','enemy hit appears below LP track');
 assert.ok(f.added[1].className.includes('ad197-mid'));
 assert.equal(typeof f.window.ArcaneDamageFX.play(0,0).then,'function');
});

test('blackout transiently mutes the music without changing persisted audio settings',async()=>{
 const f=fixture();
 await f.window.ArcaneDuelPolish197.blackout(800);
 assert.deepEqual(f.muted,[true,false]);
 assert.equal(f.added[0].flags.has('ad197-active'),false);
 assert.equal(f.added[0].className,'ad197-screen-curtain');
});

test('integrated scripts preserve engine rules and settle attacks after the returned lunge',()=>{
 const game=read('assets/game.js'),attack=read('assets/attack-impact-v113.js');
 assert.match(game,/chosen\.switched\|\|chosen\.attacked/);
 assert.match(game,/details\.open=true;render\(\)/);
 const pathOfFx=game.indexOf('ArcaneAttackFX?.play?.(g,viewId,ai,di)');
 const commit=game.indexOf('const result=attack(g,ai,di)',pathOfFx);
 const hit=game.indexOf('ArcaneDamageFX?.play?.(result.damaged,result.damage)',commit);
 const render=game.indexOf('\n  render();',hit);
 assert.ok(pathOfFx>0&&pathOfFx<commit&&commit<hit&&hit<render);
 assert.match(attack,/Return the striking card to its zone BEFORE combat changes the board/);
 assert.match(read('assets/hand-draw-v1161.css'),/scale\(\.24\)/);
 assert.match(read('assets/duel-polish-v197.css'),/grid-template-columns:minmax\(0,1fr\)!important/);
 const html=read('index.html');
 assert.match(html,/assets\/duel-polish-v197\.css/);
 assert.match(html,/assets\/duel-polish-v197\.js/);
});
