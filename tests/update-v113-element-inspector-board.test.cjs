'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const {boot}=require('./helpers/game-runtime.cjs');
const rules=require('../assets/duo-shared-rules-v160.js');
const read=(p)=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8');
const distinct=['FEUER','WASSER','WIND','ERDE','LICHT'];
const make=(levels,elements)=>levels.map((level,i)=>({level,element:elements[i],role:'combatant',fusion:false}));

test('five different valid fusion elements grant +5 quality points in solo and authoritative duo',()=>{
 const levels=[1,2,3,4,5],same=Array(5).fill('FEUER');
 const solo=boot();
 const values=solo.run(`(()=>{const f=window.ArcaneEvolution.fusionPattern;return {
  diverse:f([1,2,3,4,5],['FEUER','WASSER','WIND','ERDE','LICHT']),
  same:f([1,2,3,4,5],Array(5).fill('FEUER')),
  repeated:f([1,2,3,4,5],['FEUER','WASSER','WIND','ERDE','FEUER']),
  missing:f([1,2,3,4,5],['FEUER','WASSER','WIND','ERDE','']),
  four:f([1,2,3,4],['FEUER','WASSER','WIND','ERDE'])};})()`);
 const duo=rules.fusionPattern(make(levels,distinct));
 assert.match(values.diverse.name,/Elementvielfalt/);
 assert.equal(values.diverse.elementDiversity,true);
 assert.equal(values.diverse.elemental,false);
 assert.equal(duo.elementDiversity,true);
 assert.equal(duo.qualityBonus,values.diverse.qualityBonus);
 assert.ok(Math.abs(duo.qualityBonus-rules.fusionPattern(make(levels, ['FEUER','WASSER','WIND','ERDE','FEUER'])).qualityBonus-.05)<1e-10);
 assert.equal(values.same.elementDiversity,false);
 assert.equal(values.same.elemental,true);
 assert.ok(Math.abs(values.same.qualityBonus-values.repeated.qualityBonus-.025)<1e-10);
 assert.equal(values.repeated.elementDiversity,false);
 assert.equal(values.missing.elementDiversity,false);
 assert.equal(values.four.elementDiversity,false);
 assert.equal(rules.fusionPattern(make(levels, same)).elementDiversity,false);
 assert.equal(rules.fusionPattern(make(levels, distinct)).name,values.diverse.name);
 assert.equal(read('assets/duo-shared-rules-v160.js'),read('supabase/functions/arcane-duo-v2/duo-rules.js'));
});

function makeDom(){
 const elements=[];
 function node(tag){
  return {tagName:tag,children:[],listeners:{},dataset:{},value:'',disabled:false,
   append(child){this.children.push(child);},remove(){},setAttribute(){},closest(){return null;},
   addEventListener(type,fn){this.listeners[type]=fn;},focus(){},
   click(){if(!this.disabled)this.listeners.click?.({target:this});},
   set textContent(v){this.text=v;},get textContent(){return this.text||'';}};
 }
 const document={addEventListener(){},createElement(tag){let el=node(tag);elements.push(el);return el;},
  getElementById(){return null;},querySelector(){return null;},body:node('body')};
 const win={document,matchMedia:()=>({matches:false}),localStorage:{getItem(){return null;},setItem(){}},
  ArcaneDuoRules:{attackValue:c=>c.atk}};
 const m={exports:{}};
 vm.runInNewContext(read('assets/duo-ux-v204.js'),{window:win,module:m,console}, {filename:'duo-ux-v204.js'});
 return {...m.exports,document,elements};
}

test('left 2v2 inspector exposes Soul abilities for owner in DEF on own turn',()=>{
 const m=makeDom();
 const card={uid:701,id:31,role:'soul',mode:'def',soul:90,level:5,ownTurns:1,lastSoulAction:-1,
  soulCooldown:0,raidCooldown:0,lastDrainSwitch:-1};
 const own={seat:2,team:0,ownTurns:3,field:[null,card],hand:[]};
 const host={seat:0,team:0,field:[null],hand:[]};
 const enemy={seat:1,team:1,field:[{uid:777,id:3}],hand:[]};
 const enemy2={seat:3,team:1,field:[null],hand:[]};
 const game={status:'active',activeSeat:2,players:[host,enemy,own,enemy2]};
 const sent=[];
 m.decorate({game,seat:2,catalog:{31:{name:'Seele'},3:{name:'Gegner'}},send:action=>{sent.push(action);}});
 const panel=m.document.createElement('div');
 m.renderSoulActions(panel,card,own,{31:{name:'Seele'},3:{name:'Gegner'}});
 assert.equal(panel.children.length,1);
 const actions=panel.children[0].children;
 const buttons=actions.filter(n=>n.tagName==='button');
 assert.deepEqual(buttons.map(x=>x.textContent),[
  '◇ Verdichten · Schutz und ATK','✦ Seelenstoß · Entladen (130 % LP)',
  '◇ Seelenraub auf Ziel','ATK bevorzugen','DEF bevorzugen']);
 assert.equal(buttons[0].disabled,false);
 buttons[0].click();
 assert.equal(sent.length,1);
 assert.equal(sent[0].type,'soulCondense');
 assert.equal(sent[0].slot,1);
 const other=m.document.createElement('div');m.renderSoulActions(other,card,host,{});
 assert.equal(other.children.length,0,'partner cannot control Soul abilities');
 game.activeSeat=0;
 const wrongTurn=m.document.createElement('div');m.renderSoulActions(wrongTurn,card,own,{});
 assert.equal(wrongTurn.children.length,0);
 card.mode='atk';game.activeSeat=2;
 const attacking=m.document.createElement('div');m.renderSoulActions(attacking,card,own,{});
 assert.equal(attacking.children.length,0);
});

test('click capture updates side inspector even if combat handlers stop bubbling',()=>{
 const ui=read('assets/duo-solo-shell-v221.js');
 assert.match(ui,/arena\.addEventListener\('click',event=>\{/);
 assert.match(ui,/},true\); \/\/ Capture field-card clicks/);
 assert.match(ui,/ArcaneDuoUX204\?\.renderSoulActions\?\.\(\$\('duoLargeCardPreview'\)/);
 assert.match(ui,/inspector\.open=true/);
 const css=read('assets/duo-solo-shell-v221.css');
 assert.match(css,/grid-template-columns:repeat\(7,minmax\(136px,1fr\)\)/);
 assert.match(css,/overflow-x:auto/);
 assert.match(css,/#duoPage #duoSeats \.ad221-team-heading\{font-size:16px/);
 assert.match(css,/#duoPage \.ad221-battle-grid\{grid-template-columns/);
});
