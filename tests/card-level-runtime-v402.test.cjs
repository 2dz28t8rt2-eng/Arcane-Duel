'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const src=read('assets/card-level-runtime-v402.js');
const css=read('assets/card-level-runtime-v402.css');
function node(cls,level,boardLevel){
 const set=new Set(cls.split(' '));
 return {nodeType:1,dataset:{},_level:level,classList:{
  contains:s=>set.has(s),add:(...values)=>values.forEach(v=>set.add(v)),
  remove:s=>set.delete(s),[Symbol.iterator]:()=>set.values()
 },getAttribute:key=>key==='data-level'?(level===null?null:String(level)):null,
 matches:s=>s.includes('hand-card')&&set.has('hand-card')||s.includes('board-creature')&&set.has('board-creature'),
 querySelector:s=>boardLevel?{textContent:boardLevel}:null,
 querySelectorAll:()=>[],_set:set};
}
function boot(cards){
 const seen={};
 const doc={nodeType:9,readyState:'loading',body:{nodeType:1},
  addEventListener:(type,fn)=>{seen[type]=fn},
  querySelectorAll:()=>cards};
 const win={ArcaneCardTemplates:{rank:l=>Math.ceil(l/2),definitions:
  ['normal','fusion','ace','essence'].flatMap(f=>[1,2,3,4,5].map(t=>({family:f,tier:t})))},
  ArcaneLevelFrames:{resolve:()=>({})}};
 const ctx={document:doc,window:win,console,requestAnimationFrame:fn=>fn(),
  MutationObserver:class{constructor(fn){seen.observer=fn}observe(){}}};
 vm.createContext(ctx);vm.runInContext(src,ctx);
 seen.DOMContentLoaded();return{doc,win,seen};
}
test('Live game synchronizes existing hand cards, ACE and fusion battlefield cards',()=>{
 const normal=node('hand-card tc-card',2),ace=node('hand-card tc-card tc-ace',10);
 const fusion=node('board-creature tc-card tc-fusion',null,'Lv 7');
 const fate=node('hand-card tc-card tc-fate',3);
 const {win,seen}=boot([normal,ace,fusion,fate]);
 assert.ok(normal._set.has('ad-template-normal-01'));
 assert.ok(normal._set.has('ad-level-normal-02'));
 assert.ok(ace._set.has('ad-template-ace-05'));
 assert.ok(ace._set.has('ad-level-ace-10'));
 assert.ok(fusion._set.has('ad-template-fusion-04'));
 assert.ok(fusion._set.has('ad-level-fusion-07'));
 assert.ok(!fate._set.has('ad-level-frame'));
 assert.equal(win.ArcaneFrameRuntime.audit().unframed,0);
 const dyn=node('hand-card tc-card tc-essence',5);
 const cards=[normal,ace,fusion,fate,dyn];
 seen.observer();
 // Scan the dynamic card separately as our test's static document query is fixed.
 assert.equal(win.ArcaneFrameRuntime.scan(dyn),1);
 assert.ok(dyn._set.has('ad-level-essence-05'));
 assert.equal(win.ArcaneFrameRuntime.scan(dyn),0);
 assert.ok(ace._set.has('tc-ace'),'Gameplay flags are preserved');
});
test('CSS draws ornaments visibly above live card art, preserving Fate and base frame assets',()=>{
 assert.match(css,/::before/);
 assert.match(css,/background-image:var\(--ad-level-trim\)!important/);
 assert.match(css,/pointer-events:none!important/);
 assert.match(css,/z-index:7!important/);
 const idx=read('index.html');
 assert.ok(idx.indexOf('card-level-runtime-v402.js')>idx.indexOf('card-level-frames-v401.js'));
 assert.ok(idx.indexOf('card-level-runtime-v402.css')>idx.indexOf('card-level-frames-v401.css'));
 assert.ok(idx.includes('4.0.2-live-fix'));
 assert.ok(read('tests/browser-card-templates.html').includes('Individual Level 10 ornament'));
});
