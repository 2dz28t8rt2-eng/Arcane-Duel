'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const snapshot=require('../assets/duo-card-catalog-v160.json');

test('all exported card frames match the actual single-player renderer',()=>{
 const solo=boot();
 for(const card of snapshot.cards){
  const expected=solo.run('frameClassForCard({id:'+card.id+'})');
  const online=solo.run('ArcaneCardView221.frame('+JSON.stringify(card)+')');
  assert.equal(online,expected,'Card '+card.id+' '+card.name);
  assert.equal(card.desc,solo.run('CARDS['+card.id+'].desc||""'),'Description '+card.id);
 }
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
