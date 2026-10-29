'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

class Element{
  constructor(){this.textContent='';this.hidden=false;this.disabled=false;this.open=false;this.dataset={};this.attributes={};this.listeners={};this.clicks=0;}
  addEventListener(type,listener){(this.listeners[type]||=[]).push(listener);}
  setAttribute(name,value){this.attributes[name]=value;}
  removeAttribute(name){delete this.attributes[name];}
  click(){this.clicks++;for(const listener of this.listeners.click||[])listener({target:this});}
  emit(type){for(const listener of this.listeners[type]||[])listener({target:this});}
}

function setup(){
  const ids=['ad182-workspace','ad182-open-workspace','ad182-primary','ad182-secondary',
    'ad182-next-title','ad182-next-hint','ad182-material-count','summonBtn','fusionBtn',
    'clearBtn','switchBtn','directBtn'];
  const nodes=Object.fromEntries(ids.map(id=>[id,new Element()]));
  const monster={id:4,uid:104};
  const game={mode:'pve',active:0,winner:null,pending:null,summoned:false,selection:null,
    materials:[],players:[{hand:[monster],field:[monster]},{hand:[],field:[]}]};
  const context={window:{matchMedia:()=>({matches:true})},document:{getElementById:id=>nodes[id]},
    render(){return 'rendered';},uiMode:'duel',game,dataOf:()=>({name:'Mondwächter'}),console};
  vm.runInNewContext(read('assets/duel-comfort-v182.js'),context,{filename:'duel-comfort-v182.js'});
  return {nodes,game,context};
}

test('the fusion workspace stays in the left panel and the hand follows a short action bar',()=>{
  const html=read('index.html'),styles=read('assets/duel-comfort-v182.css');
  const workspace=html.indexOf('id="ad182-workspace"');
  const stage=html.indexOf('id="summonStage"');
  const board=html.indexOf('id="enemyRow"');
  const quickbar=html.indexOf('id="ad182-quickbar"');
  const hand=html.indexOf('id="hand"');
  assert.ok(workspace>=0&&workspace<stage&&stage<board);
  assert.ok(board<quickbar&&quickbar<hand);
  assert.ok(html.indexOf('assets/duel-comfort-v182.js')>html.indexOf('assets/duel-layout-v180.js'));
  assert.match(styles,/\.ad182-fusion-workspace\[open\]/);
  assert.match(styles,/\.ad182-quickbar/);
  assert.match(styles,/#duelScreen \.cardtray\{position:sticky/);
  assert.match(read('assets/duel-layout-v180.js'),/Keep the player's chosen fold state/);
});

test('2v2 chapter history and battle log fold without losing the live render targets',()=>{
  const html=read('duo-campaign-v2.html');
  assert.match(html,/<details class="duo-progress ad182-duo-fold"[\s\S]*?<ol id="duoChapterProgress"[\s\S]*?<\/details>/);
  assert.match(html,/<details class="duo-log ad182-duo-fold"[\s\S]*?<ol id="duoLog"[\s\S]*?<\/details>/);
  assert.match(html,/assets\/duo-comfort-v182\.css/);
  assert.match(read('assets/duo-parity-v160.js'),/const dock=\$\('duoActions'\),track=\$\('duoTrack'\),seats=\$\('duoSeats'\),log=\$\('duoLog'\)/);
});

test('the next step follows hand selection and material selection without changing game state',()=>{
  const {nodes,game,context}=setup();
  context.render();
  assert.equal(nodes['ad182-primary'].hidden,true);
  assert.equal(nodes['ad182-workspace'].open,true);
  game.selection={type:'hand',uid:104};
  context.render();
  assert.equal(nodes['ad182-primary'].dataset.ad182Action,'summonBtn');
  nodes['ad182-primary'].click();
  assert.equal(nodes.summonBtn.clicks,1);
  game.selection=null;
  game.materials=[104,105,106];
  context.render();
  assert.equal(nodes['ad182-primary'].dataset.ad182Action,'fusionBtn');
  assert.equal(nodes['ad182-material-count'].textContent,'3 / 5 Materialien');
  nodes['ad182-primary'].click();
  assert.equal(nodes.fusionBtn.clicks,1);
  assert.equal(game.materials.length,3,'the presentation must not spend materials');
  game.pending={kind:'fusion'};
  context.render();
  assert.equal(nodes['ad182-primary'].hidden,true);
  assert.equal(nodes['ad182-secondary'].dataset.ad182Action,'clearBtn');
  assert.match(nodes['ad182-next-title'].textContent,/Wähle eine Zone/);
});

test('selected field monsters still expose their actions after summoning',()=>{
  const {nodes,game,context}=setup();
  nodes.directBtn.disabled=true;
  game.summoned=true;
  game.selection={type:'field',idx:0};
  context.render();
  assert.equal(nodes['ad182-primary'].dataset.ad182Action,'switchBtn');
  nodes['ad182-primary'].click();
  assert.equal(nodes.switchBtn.clicks,1);
  nodes.directBtn.disabled=false;
  context.render();
  assert.equal(nodes['ad182-primary'].dataset.ad182Action,'directBtn');
});

test('player fold choices persist, and disabled actions never fire',()=>{
  const {nodes,game,context}=setup();
  nodes['ad182-open-workspace'].click();
  assert.equal(nodes['ad182-workspace'].open,false);
  game.selection={type:'hand',uid:104};
  nodes.summonBtn.disabled=true;
  context.render();
  assert.equal(nodes['ad182-workspace'].open,false);
  assert.equal(nodes['ad182-primary'].hidden,true);
  nodes['ad182-primary'].click();
  assert.equal(nodes.summonBtn.clicks,0);
  nodes['ad182-open-workspace'].click();
  assert.equal(nodes['ad182-open-workspace'].attributes['aria-expanded'],'true');
});
