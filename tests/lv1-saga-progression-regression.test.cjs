'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
test('first Fanatiker encounter is a standalone prologue, unlocked research only after win',()=>{
 const a=boot().run("(()=>{profile=freshProfile();profile.lv1Saga.offered=true;startDuel('pve',1,'lv1-saga','easy','prologue');const g=game;const original={prologue:g?.lv1SagaPrologue,stage:g?.lv1Saga?.stage};g.winner=0;rewardMatch(g);return {...original,met:profile.lv1Saga.met,progress:profile.lv1Saga.stage};})()");
 assert.deepEqual(a,{prologue:true,stage:1,met:true,progress:0});
});
test('second research chapter win advances from 1/5 to 2/5 even without Floating callback',()=>{
 const r=boot().run("(()=>{profile=freshProfile();profile.lv1Saga.offered=true;profile.lv1Saga.met=true;profile.lv1Saga.stage=1;startDuel('pve',1,'lv1-saga','easy',2);const g=game;g.winner=0;const result=rewardMatch(g);return {stage:profile.lv1Saga.stage,awarded:result?.lv1StageNew,met:profile.lv1Saga.met,claimed:!!g.rewardClaimed};})()");
 assert.deepEqual(r,{stage:2,awarded:true,met:true,claimed:true});
});
test('chapter II victory is idempotent and stage III subsequently launches',()=>{
 const r=boot().run("(()=>{profile=freshProfile();profile.lv1Saga.offered=true;profile.lv1Saga.met=true;profile.lv1Saga.stage=1;startDuel('pve',1,'lv1-saga','easy',2);const g=game;g.winner=0;const a=rewardMatch(g),b=rewardMatch(g);render();game=null;startDuel('pve',1,'lv1-saga','easy',3);return {one:a?.lv1StageNew,two:b===null,next:game?.lv1Saga?.stage,profile:profile.lv1Saga.stage};})()");
 assert.deepEqual(r,{one:true,two:true,next:3,profile:2});
});