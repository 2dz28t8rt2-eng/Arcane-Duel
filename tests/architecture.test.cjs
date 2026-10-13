'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const js=fs.readFileSync(path.join(root,'assets/game.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');

test('Keine überschriebenen globalen Funktionsdeklarationen mehr',()=>{
 const counts=new Map();
 for(const m of js.matchAll(/^(?:async\s+)?function\s+([\w$]+)\s*\(/gm))counts.set(m[1],(counts.get(m[1])||0)+1);
 const dup=[...counts].filter(([_,n])=>n>1);
 assert.deepEqual(dup,[]);
 assert.ok(counts.size>200);
});
test('HTML bindet ausgelagerte CSS- und JS-Dateien ein',()=>{
 assert.match(html,/href="assets\/styles\.css/);
 assert.match(html,/src="assets\/game\.js/);
 assert.doesNotMatch(html,/<style\b/);
 assert.doesNotMatch(html,/<script\s*>/);
});
test('Spielstand-Schlüssel bleibt kompatibel',()=>{
 assert.match(js,/arcane-duel-rpg-profile-v3/);
});
