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

test('Turniergegner sind benannte Personen; ihre Kernkarten sind eindeutig benannt',()=>{
 const vm=require('node:vm');
 const nodes=new Map(),store=new Map();
 const node=()=>({innerHTML:'',textContent:'',classList:{add(){},remove(){},toggle(){},contains(){return true}},style:{},addEventListener(){},click(){}});
 const document={body:node(),getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id)},querySelectorAll(){return []},createElement(){return node()},addEventListener(){}};
 const context=vm.createContext({window:{localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))},crypto:{getRandomValues(a){a[0]=42}}},document,console,setTimeout(){},setInterval(){},Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}}});
 vm.runInContext(js,context,{timeout:10000});
 const data=vm.runInContext("JSON.stringify({duelists:RPG_OPPONENTS.map(o=>o.name),monsterNames:RPG_OPPONENTS.flatMap(o=>[...o.loot,...o.hardLoot].map(id=>CARDS[id].name)),arts:[CARDS[0].art,CARDS[7].art]})",context);
 const r=JSON.parse(data);
 assert.equal(new Set(r.duelists).size,11);
 assert.equal(new Set(r.monsterNames).size,88);
 assert.equal(r.arts.length,2);
 assert.notEqual(r.arts[0],r.arts[1]);
});

test('Lesbarkeits- und Hilfefunktionen sind im Entwicklungszweig vorhanden',()=>{
 assert.match(js,/id="hudDropToggle"/);
 assert.match(js,/id="hudShardsHelp"/);
 assert.match(js,/function xpMarkup/);
 assert.match(js,/Seltenheitsbonus bis dahin/);
 assert.match(js,/Keine passende Fusionskopie/);
});
