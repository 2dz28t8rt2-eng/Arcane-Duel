'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const read=p=>fs.readFileSync(path.join(__dirname,'..',p),'utf8');
test('Rulebook explains opening protection and its limitations',()=>{
 const text=read('assets/handbook-human-v180.js');
 assert.match(text,/25 · Eröffnungsschutz & Predator-Entwicklung/);
 for(const x of ['zweiten Gesamtzug','nur im','ATK','DEF','1 DEF','Fusion','einmalig','verfällt'])
  assert.ok(text.includes(x),'missing '+x);
});
test('Rulebook explains all five Predator progression stages, additive swarm and UI',()=>{
 const text=read('assets/handbook-human-v180.js');
 for(const x of ['90 %','93 %','96 %','99 %','102 %','ENTWICKLUNG','96 % + 4 % = 100 %',
  '111 % Gesamt-ATK','Schwarmbonus','Große Kartenansicht','große Kartenansicht'])
  assert.ok(text.includes(x),'missing '+x);
 assert.match(text,/2v2-Regelkern jedoch noch nicht/);
});
test('Stomp and updated handbook use unique sequential titles and accurate duo support',()=>{
 const rules=read('assets/handbook-human-v180.js');
 const stomp=read('assets/fusion-stomp-guide-v201.js');
 const html=read('index.html');
 assert.match(rules,/24 · Duellbedienung/);
 assert.match(stomp,/23 · Fusions-Stomp/);
 assert.match(stomp,/beide gegnerischen 7er-Felder/);
 assert.match(stomp,/insertBefore\(node,before\)/);
 assert.match(html,/handbook-human-v180\.js\?v=20261029-growth-rules-1/);
 assert.match(html,/fusion-stomp-guide-v201\.js\?v=20261029-growth-rules-1/);
});