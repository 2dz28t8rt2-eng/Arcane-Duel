'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function load(file){
 const sandbox={window:{matchMedia(){return {matches:false}}},document:{},console,setTimeout,
  Math,Number,String,Array,Map,Set,Object,parseFloat,parseInt,Infinity,NaN};
 vm.createContext(sandbox);
 vm.runInContext(fs.readFileSync(path.join(root,'assets',file),'utf8'),sandbox);
 return sandbox.window;
}
test('Poker quality seal comes from real saved roll math, not from fabricated bonus values',()=>{
 const bonus=load('fusion-bonus-cinema-v4.js').ArcaneFusionBonus;
 const one=bonus.describe({pattern:'Paar · Elementharmonie',materialsUsed:2,rollMath:{combo:{name:'Paar · Elementharmonie',qualityPct:8,rollBonus:0,materialCount:2}}});
 assert.equal(one.title,'ZWILLING');assert.equal(one.percent,8);assert.equal(one.harmonized,true);
 assert.equal(bonus.describe({pattern:'Freie Fusion',materialsUsed:2,rollMath:{}}),null);
 const three=bonus.describe({pattern:'Drilling',materialsUsed:3,rollMath:{combo:{name:'Drilling',qualityPct:8,rollBonus:1,materialCount:3}}});
 const five=bonus.describe({pattern:'Fünfling',materialsUsed:5,rollMath:{combo:{name:'Fünfling',qualityPct:18,rollBonus:3,materialCount:5}}});
 assert.ok(five.tier>three.tier);
 assert.equal(five.rollBonus,3);
});
test('Every poker pattern has a theatrical label; max tier is reserved for five materials',()=>{
 const bonus=load('fusion-bonus-cinema-v4.js').ArcaneFusionBonus;
 for(const p of ['Paar','Zwei Paare','Drilling','Kleine Straße','Full House','Vierling','Große Straße','Fünfling']){
  assert.ok(bonus.describe({pattern:p,materialsUsed:p==='Fünfling'?5:3,rollMath:{}})?.title,p);
 }
});
test('Art revamp uses stable IDs and never alters existing game cards or collection ownership',()=>{
 const art=load('artwork-revamp-v4.js').ArcaneArtCatalog;
 assert.equal(art.key({id:22,level:10,ace:true}),'ace/sovereign/0022');
 assert.equal(art.key({id:22,level:1}),'base/initiate/0022');
 assert.equal(art.resolve({id:22,level:5,art:'test.webp'}),null);
 const values=art.audit([{id:1,level:1},{id:2,level:8}]);
 assert.equal(values.count,2);assert.equal(values.duplicates,0);
});
test('Cinema follows role seal with bonus seal before real dice, without modifying stats',()=>{
 const js=fs.readFileSync(path.join(root,'assets/fusion-cinema-ritual.js'),'utf8');
 const role=js.indexOf("overlay.classList.add('evo-stamp-impact'");
 const bonus=js.indexOf('ArcaneFusionBonus.stamp(overlay,c');
 const rolls=js.indexOf("overlay.classList.add('evo-phase-rolls'");
 assert.ok(role>=0&&bonus>role&&rolls>bonus);
 const evolution=fs.readFileSync(path.join(root,'assets/evolution.js'),'utf8');
 assert.ok(evolution.includes('combo:{name:f.name,qualityPct:Math.round(f.qualityBonus*1000)/10'));
 assert.ok(evolution.includes('m.combo.qualityPct'));
});
