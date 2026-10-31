'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const snapshot=require('../assets/duo-card-catalog-v160.json');
const duoCinema=require('../assets/duo-cinema-v170.js');

test('all exported card frames match the actual single-player renderer',()=>{
 const solo=boot();
 for(const card of snapshot.cards){
  const expected=solo.run('frameClassForCard({id:'+card.id+'})');
  const online=solo.run('ArcaneCardView221.frame('+JSON.stringify(card)+')');
  assert.equal(online,expected,'Card '+card.id+' '+card.name);
  assert.equal(card.desc,solo.run('CARDS['+card.id+'].desc||""'),'Description '+card.id);
 }
});
test('shared fusion ritual preserves the confirmed result and inherited soul arithmetic',()=>{
 const source={atk:600,def:800,role:'soul',soulInheritance:{defBonus:50},
  rollMath:{bonus:{atk:10,def:20},final:{atk:510,def:720}}};
 const adapted=duoCinema.ritualInstance(source);
 assert.deepEqual(adapted.rollMath.final,{atk:510,def:720});
 assert.equal(adapted.rollMath.bonus.def,70);
 assert.equal(source.rollMath.bonus.def,20);
});
test('fused and Fate instances use their original single-player frame',()=>{
 const solo=boot();
 for(const card of snapshot.cards.filter(c=>c.playable).slice(0,40)){
  const expected=solo.run('frameClassForCard({id:'+card.id+',fusion:true})');
  const online=solo.run('ArcaneCardView221.frame('+JSON.stringify(card)+',{fusion:true})');
  assert.equal(online,expected,'Fused card '+card.id);
 }
 snapshot.fateIds.forEach((id,index)=>{
  const expected=solo.run('frameClassForCard({id:'+id+',fate:true,card:{}})');
  const online=solo.run('ArcaneCardView221.frame('+JSON.stringify(snapshot.cards[id])+',{fate:true},'+index+')');
  assert.equal(online,expected,'Fate card '+id);
 });
});
