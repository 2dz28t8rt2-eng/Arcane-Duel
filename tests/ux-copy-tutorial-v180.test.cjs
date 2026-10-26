'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');

test('the introductory lesson only advances after an ordinary hand selection',()=>{
  const source=read('assets/strategy-experience-v120.js');
  assert.match(source,/tutorial\.step===0&&g\.selection\?\.type==='hand'/);
  assert.doesNotMatch(source,/tutorial\.step===0&&\(g\.selection\?\.type==='hand'\|\|g\.materials\.length\)/);
  assert.equal((source.match(/Gewinne das Duell/g)||[]).length,3);
  assert.match(source,/Nächstes Lernduell/);
  assert.match(source,/g\.winner===0/);
});

test('only the explicit introductory matches use 2,000 LP',()=>{
  const game=read('assets/game.js'),intro=read('assets/strategy-experience-v120.js');
  assert.match(game,/options\.lessonStage>=1&&options\.lessonStage<=3.*?\?2000:duelStartingLP/);
  assert.match(game,/\[2000,4000,6000,7000,8000,10000\]/);
  assert.match(intro,/startDuel\('pve',0,'free','easy',null,stage\)/);
  assert.match(game,/if\(mode!=='pve'\|\|!Number\.isInteger\(opponentId\)\|\|opponentId<=3\)return 4000/);
});

test('the attack charges halfway and the duel guidance no longer expands above the hand',()=>{
  const attack=read('assets/attack-impact-v113.js');
  const view=read('assets/duel-layout-v180.js');
  const styles=read('assets/duel-layout-v180.css');
  assert.match(attack,/dx\*\.5/);
  assert.match(attack,/duration:175/);
  assert.match(view,/source\.querySelector\('#ad156-fusion-coach'\)/);
  assert.match(view,/host\.replaceChildren\(\.\.\.moved\)/);
  assert.match(styles,/\.ad117-mat-viewport \{height:142px/);
  assert.match(styles,/\.cardtray \{position:sticky/);
});

test('players get visible Predator explanations and the updated rule chapters',()=>{
  const view=read('assets/duel-layout-v180.js');
  const manual=read('assets/handbook-human-v180.js');
  const index=read('index.html');
  assert.match(view,/Predator-Schwarm/);
  assert.match(view,/count\)\*2/);
  for(const title of ['Seelenzehrer','Weiterfusionen','Gemeinsam spielen','Lernduelle'])assert.ok(manual.includes(title));
  assert.match(index,/assets\/duel-layout-v180\.js/);
  assert.match(index,/assets\/handbook-human-v180\.js/);
});
