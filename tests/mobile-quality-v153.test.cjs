'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

function boot(){
  const elements=new Map(),calls=[];
  const tray={insertAdjacentElement:(_,bar)=>elements.set(bar.id,bar)};
  const makeNode=()=>({dataset:{},children:[],disabled:false,hidden:false,
    setAttribute(name,value){this[name]=value;},
    addEventListener(name,listener){this[name]=listener;},
    appendChild(child){this.children.push(child);},
    querySelector(selector){const id=selector.match(/data-arcane-action="([^"]+)"/)?.[1];
      return this.children.find(x=>x.dataset.arcaneAction===id)||null;}});
  const original={};
  for(const id of ['summonBtn','fusionBtn','switchBtn','endTurnBtn']){
    original[id]={disabled:false,hidden:false,click:()=>calls.push(id)};
    elements.set(id,original[id]);
  }
  elements.set('hand',{closest:()=>tray});
  const state={uiMode:'duel',render:()=>42,
    document:{getElementById:id=>elements.get(id)||null,createElement:makeNode},window:{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../assets/mobile-quality-v153.js'),'utf8'),state);
  return {state,elements,original,calls};
}

test('mobile quick actions forward only to the original enabled controls',()=>{
  const {state,elements,original,calls}=boot();
  assert.equal(state.render(),42);
  const bar=elements.get('ad153-mobile-actions');
  assert.equal(bar.children.length,4);
  const summon=bar.children[0],fusion=bar.children[1];
  summon.click();
  assert.deepEqual(calls,['summonBtn']);
  original.fusionBtn.disabled=true;
  state.render();
  assert.equal(fusion.disabled,true);
  fusion.click();
  assert.deepEqual(calls,['summonBtn']);
  original.fusionBtn.disabled=false;
  state.render();fusion.click();
  assert.deepEqual(calls,['summonBtn','fusionBtn']);
  assert.equal(elements.get('ad153-mobile-actions'),bar,'same toolbar reused across renders');
});
