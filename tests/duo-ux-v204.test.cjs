'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/duo-ux-v204.js'),'utf8');
function load(){
 const listeners=new Map(),root={
  document:{addEventListener:(name,fn)=>listeners.set(name,fn)},
  ArcaneDuoRules:{attackValue:c=>c.atk+(c.role==='soul'?Math.floor((c.condensed||0)/2):0)},
  matchMedia:()=>({matches:false})
 };
 const mod={exports:{}};
 vm.runInNewContext(source,{window:root,module:mod,console},
  {filename:'duo-ux-v204.js'});
 assert.equal(typeof listeners.get('keydown'),'function');
 return mod.exports;
}
const predator=(uid,extra={})=>({uid,role:'predator',atk:1000,...extra});
test('2v2 Predator swarm percentage is scoped per own seven-card field and capped at five',()=>{
 const ui=load();
 assert.equal(ui.packState({field:[predator(1),null,predator(2)]}).percentage,4);
 assert.equal(ui.packState({field:Array.from({length:7},(_,i)=>predator(i+1))}).percentage,10);
 const alpha=predator(1,{fusion:true,predatorLeader:{bornUid:1,powers:[]}});
 const enriched={field:[alpha,predator(2),predator(3)]};
 assert.equal(ui.packState(enriched).percentage,9);
 assert.equal(ui.effectiveAttack(enriched.field[1],enriched,{attackValue:c=>c.atk}),990);
 enriched.field[0].predatorLeader.powers=['swarm'];
 assert.equal(ui.packState(enriched).percentage,10.5);
 assert.equal(ui.effectiveAttack(enriched.field[1],enriched,{attackValue:c=>c.atk}),1005);
});
test('Duo scope checking prevents false confirmation across chapters/rooms',()=>{
 const ui=load();
 assert.equal(ui.sameRoom({roomId:'room',chapter:2},{roomId:'room',chapter:2}),true);
 assert.equal(ui.sameRoom({roomId:'room',chapter:2},{roomId:'room',chapter:3}),false);
 assert.equal(ui.sameRoom({roomId:'room',chapter:2},{roomId:'other',chapter:2}),false);
});
