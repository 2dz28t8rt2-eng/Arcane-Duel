'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../assets/strategy-experience-v120.js'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'../assets/strategy-experience-v120.css'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');

test('strategy extension is actually loaded after the core gameplay modules',()=>{
  const p=html.indexOf('strategy-experience-v120.js');
  assert.ok(p>html.indexOf('fusion-template-neutral-v129.js'));
  assert.match(html,/strategy-experience-v120\.css/);
});
test('postduel report uses real match telemetry, not fabricated damage or paid hints',()=>{
  assert.match(src,/\[\.\.\.g\.damageDealt\]/);
  assert.match(src,/\[\.\.\.g\.totalFusions\]/);
  assert.match(src,/g\.log\.slice\(0,10\)/);
  assert.doesNotMatch(src,/buyHint\(/);
  assert.match(src,/originalFinished\.apply/);
});
test('lab reuses original game rules without rewards, purchases or persisted duels',()=>{
  const start=src.indexOf('async function runLab()');
  const end=src.indexOf('function menuExtras()',start);
  const body=src.slice(start,end);
  assert.ok(start>0&&end>start);
  assert.match(body,/createGame\(/);
  assert.match(body,/simulateGame\(/);
  assert.match(body,/sample<5/);
  assert.match(body,/seed=210012\+foe\*97\+sample\*1013/);
  assert.doesNotMatch(body,/rewardMatch\(|saveProfile\(|newMatchId\(|consumeEnergy\(/);
});
test('fusion comparison is information-only with legal templates and non-guaranteed ranges',()=>{
  assert.match(src,/fusionOptions\(game,levels,materials\)\.filter\(c=>canCompleteHandFusion/);
  assert.match(src,/fusionPreview\(game,c,materials,levels\)/);
  assert.match(src,/keine garantierten Würfelergebnisse/);
});
test('tutorial follows real actions and unlock toast can be dismissed',()=>{
  assert.match(src,/g\.selection\?\.type==='hand'/);
  assert.match(src,/g\.summoned/);
  assert.match(src,/g\.players\[0\]\.field\.some\(c=>c&&\(c\.attacked\|\|c\.switched\)\)/);
  assert.match(src,/const dismiss=el\.querySelector\?\.\('button'\)/);
  assert.match(src,/dismiss\.onclick=close/);
  assert.match(css,/prefers-reduced-motion:reduce/);
});
