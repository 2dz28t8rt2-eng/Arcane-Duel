'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

const resolve=name=>{
  const checkout=path.join(__dirname,'../assets',name);
  return fs.existsSync(checkout)?checkout:path.join(__dirname,name);
};
function setup(storageValue){
  const values=new Map(storageValue!==undefined?[['arcane-duel-tutorial-v152',storageValue]]:[]);
  const ctx={
    window:{localStorage:{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)}},
    document:{getElementById:()=>null,querySelectorAll:()=>[]},
    uiMode:'idle',game:null,render:()=>null,renderMenu:()=>null,showFinished:()=>null,
    addCard:()=>null,ownsCard:()=>false,escapeHtml:x=>String(x),
    profile:{},OPPONENTS:[],CARDS:[],startDuel:()=>null
  };
  vm.runInNewContext(fs.readFileSync(resolve('strategy-experience-v120.js'),'utf8'),ctx);
  return {api:ctx.window.ArcaneStrategyExperience120,ctx,values};
}

test('beginner curriculum contains three distinct real-action lessons',()=>{
  const {api}=setup();
  const levels=[1,2,3].map(n=>Array.from(api.stageLessons(n)));
  assert.equal(levels[0].length,5);
  assert.equal(levels[1].length,3);
  assert.equal(levels[2].length,4);
  assert.match(levels[1][1][1],/Fusion/);
  assert.match(levels[2][2][1],/Angriff/);
});
test('completed curriculum respects local storage and invalid values',()=>{
  const {api}=setup('[1,2,2,0,4]');
  assert.deepEqual(Array.from(api.completedLessons()),[1,2,2]);
  const bad=setup('{invalid');
  assert.deepEqual(Array.from(bad.api.completedLessons()),[]);
});
