'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.resolve(__dirname,'..');
const source=fs.readFileSync(path.join(root,'assets/fusion-guide-v213.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');

function harness(){
 const events=[],modals=[],toasts=[];
 const catalog=[{id:7,level:8,name:'Testfusion',atk:1250,def:960}];
 const document={
  addEventListener(type,fn,capture){events.push({type,fn,capture});},
  querySelector(){return null;},
  getElementById(){return null;}
 };
 const window={
  ArcaneFusionRework113:{calculate(levels){
   return {core:6,coreIndex:0,floor:5,first:5,gain:3,bonus:0,resonatorBonus:0,
    street:false,penalty:0,others:[5],weights:[1],coreIsFusion:false};
  }},
  ArcaneFusionMath:{
   pattern(){return {name:'Freie Fusion'};},
   tuned(){return {factor:1.06,qualityBonus:.04,rollBonus:0,heritagePct:0,resonancePct:0};}
  },
  ArcaneRoleFusion:{inheritance(){return 'predator';}}
 };
 const context={
  window,document,game:null,render(){},showRules(){},
  escapeHtml(value){return String(value).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');},
  dataOf(c){return c.card||c;},
  fusionBudget(){return 8;},
  fusionOptions(){return catalog;},
  fusionPreview(){return {atk:[1000,1500],def:[600,950],rolls:3,bonus:20};},
  toast(msg){toasts.push(msg);},openModal(msg){modals.push(msg);},
  modalHtml(...args){return args.join('|');},
  hideModal(){},$(id){return {id,onclick:null};}
 };
 vm.runInNewContext(source,context,{filename:'fusion-guide-v213.js'});
 return {context,window,events,modals,toasts};
}

test('index loads the guide after the final solo balance module',()=>{
 assert.ok(index.includes('assets/fusion-guide-v213.css'));
 const last=index.indexOf('assets/guardian-balance-v212.js');
 const guide=index.indexOf('assets/fusion-guide-v213.js');
 assert.ok(last>=0&&guide>last);
});

test('handbook groups fusion topics into accessible subchapters',()=>{
 const {window}=harness();
 const html=window.ArcaneFusionGuide213.bookContent();
 for(const phrase of ['Was ist eine Fusion?','Fusionslevel','Levelbeispiele','Pokerkombinationen',
  'ATK und DEF','Resonanz','Fusions-Stomp','Vorschau richtig lesen'])assert.ok(html.includes(phrase),phrase);
 assert.equal((html.match(/class="ad213-subchapter"/g)||[]).length,8);
 assert.ok(html.includes('6 + 5'));
 assert.ok(html.includes('124,5 %'));
});

test('read-only explanation uses engine level, quality and preview; never spends materials',()=>{
 const {window}=harness();
 const materials=[
  {uid:1,card:{name:'Kern',level:6}},
  {uid:2,card:{name:'Partner',level:5}}
 ];
 const g={mode:'pve',active:0,materials:[1,2],players:[{hand:materials,remainingFusion:[7]}],pending:null};
 const before=JSON.stringify(g);
 const actual=window.ArcaneFusionGuide213.actualInfo({g,levels:[6,5],materials,pending:false});
 assert.equal(actual.budget,8);
 assert.equal(actual.best.level,8);
 assert.equal(actual.quality.factor,1.06);
 const screen=window.ArcaneFusionGuide213.explanationText(actual);
 assert.match(screen,/LV 8/);
 assert.match(screen,/106 %/);
 assert.match(screen,/1\.000–1\.500/);
 assert.match(screen,/Predator/);
 assert.equal(JSON.stringify(g),before);
});

test('a pending fusion cannot expose pre-reveal combat values',()=>{
 const {window}=harness();
 const pending={card:{name:'Vorbereitete Fusion',level:8,atk:9999,def:8888},levels:[6,5]};
 const g={mode:'pve',active:0,pending:{kind:'fusion',...pending},players:[{hand:[],remainingFusion:[]}]};
 const info=window.ArcaneFusionGuide213.actualInfo({g,levels:pending.levels,materials:[],pending:true,card:pending.card});
 const screen=window.ArcaneFusionGuide213.explanationText(info);
 assert.match(screen,/Level 8/);
 assert.doesNotMatch(screen,/9\.999|8\.888/);
 assert.match(screen,/Enthüllung/);
});

test('click intercept is a read-only capture-phase user action',()=>{
 const {context,events,modals}=harness();
 const materials=[{uid:1,card:{name:'Kern',level:6}},{uid:2,card:{name:'Partner',level:5}}];
 context.game={mode:'pve',active:0,materials:[1,2],players:[{hand:materials,remainingFusion:[7]}]};
 const event=events.find(e=>e.type==='click'&&e.capture===true);
 assert.ok(event);
 let stopped=false,prevented=false;
 const target={closest(selector){
  if(selector==='[data-ad113-explain]')return {closest(inner){return inner==='#summonStage';}};
  return null;
 }};
 const previous=JSON.stringify(context.game);
 event.fn({target,preventDefault(){prevented=true;},stopImmediatePropagation(){stopped=true;}});
 assert.ok(prevented&&stopped);
 assert.equal(modals.length,1);
 assert.match(modals[0],/Fusion verstehen|FUSION VERSTEHEN/);
 assert.equal(JSON.stringify(context.game),previous);
});