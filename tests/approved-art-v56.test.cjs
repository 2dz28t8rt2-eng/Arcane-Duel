'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {boot,repo}=require('./helpers/game-runtime.cjs');
const expected=[
 [0,'sternenrichter'],[1,'himmlischer-loewenwaechter'],
 [2,'schicksalsdrache'],[3,'ewigkeitswaechter'],[4,'sonnenseraph'],
 [5,'astralgreif'],[6,'nebelkaiser'],[7,'kometenbestie'],
 [8,'himmelsarchon'],[9,'kosmischer-titan']
];
const qa=[
 [46,'Eibenwächter','eibenwaechter'],
 [49,'Eisenzahn','eisenzahn'],
 [50,'Bastion Ferrus','bastion-ferrus'],
 [54,'Rubin-Seraph','rubin-seraph'],
 [58,'Waldgeist Veyra','waldgeist-veyra']
];
const installed=fs.existsSync(path.join(repo,'assets/custom-art/qa/eibenwaechter.webp'));
test('15 approved new images map to real, distinct cards in the runtime and collection', {skip:!installed},()=>{
 const r=boot().run("({fate:FATE_NAMES.map((name,i)=>({name,art:ArcaneFateVisuals.artFor(i),card:dataOf({id:FATE_CARD_IDS[i],fate:true}).art})),qa:[46,49,50,54,58].map(id=>({id,name:CARDS[id].name,art:CARDS[id].art,custom:CARDS[id].customArt})),installed:ArcaneApprovedArt56.count})");
 assert.equal(r.installed,5);
 assert.equal(r.fate.length,10);
 assert.equal(r.fate[1].name,'Himmlischer Löwenwächter');
 const paths=[];
 for(const [index,slug] of expected){
  const item=r.fate[index],image='assets/custom-art/fate/'+slug+'.webp';
  assert.equal(item.art,image);assert.equal(item.card,item.art);
  paths.push(item.art);
 }
 for(let i=0;i<qa.length;i++){
  const [id,name,slug]=qa[i],x=r.qa[i],image='assets/custom-art/qa/'+slug+'.webp';
  assert.equal(x.id,id);assert.equal(x.name,name);
  assert.equal(x.art,image);assert.equal(x.custom,image);
  paths.push(x.art);
 }
 assert.equal(new Set(paths).size,15,'Every character gets an individual file');
 for(const art of paths){
  const buf=fs.readFileSync(path.join(repo,art));
  assert.ok(buf.length>60000,art);
  assert.equal(buf.subarray(0,4).toString('ascii'),'RIFF');
  assert.equal(buf.subarray(8,12).toString('ascii'),'WEBP');
 }
});
