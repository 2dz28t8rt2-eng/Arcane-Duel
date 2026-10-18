'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {boot}=require('./helpers/game-runtime.cjs');
function setup(chapter=5){
 const b=boot({seed:500+chapter});
 b.exec("profile=freshProfile();profile.lv1Saga={offered:true,met:true,stage:"+(chapter-1)+",perk:false,aceGranted:false,finalRewards:false,story:[]};profile.activeDuel=null;startDuel('pve',1,'lv1-saga','easy',"+chapter+");game.active=1;game.turn=1;game.summoned=false;");
 return b;
}
test('both approved 768x1024 angel and eclipse artworks are bound to the existing card IDs',()=>{
 const r=setup().run("({pure:CARDS[ArcaneLv1Swarm.ids.ace].art,fallen:CARDS[ArcaneLv1Saga.corruptedId].art})");
 assert.equal(r.pure,'assets/custom-art/lumira-angel-v49.webp');
 assert.equal(r.fallen,'assets/custom-art/lumira-fallen-v49.webp');
 for(const filename of [r.pure,r.fallen]){
  const data=fs.readFileSync(path.resolve(__dirname,'..',filename));
  assert.equal(data.subarray(0,4).toString('ascii'),'RIFF');
  assert.equal(data.subarray(8,12).toString('ascii'),'WEBP');
  assert.ok(data.length>100000);
 }
});
test('corrupted fusion recipe allows exactly Lumira plus 2-4 free hand monsters',()=>{
 const r=setup().run("(()=>{const g=game,h=g.players[1].hand,ace=h.find(c=>c.id===ArcaneLv1Swarm.ids.ace),extra=h.filter(c=>c.uid!==ace.uid),recipe=ArcaneLumiraCorruption.recipe;return {onlyTwo:recipe(g,[ace,extra[0]]),three:recipe(g,[ace,...extra.slice(0,2)]),five:recipe(g,[ace,...extra]),without:recipe(g,extra.slice(0,3)),duplicate:recipe(g,[ace,extra[0],extra[0]]),unique:recipe(g,[ace,extra[0],extra[1]])};})()");
 assert.deepEqual(r,{onlyTwo:false,three:true,five:true,without:false,duplicate:false,unique:true});
});
test('chapter V opponent now summons Lumira and never consumes her as ordinary fusion material',()=>{
 const r=setup().run("(()=>{const g=game,p=g.players[1],ace=g.lv1FanaticAce.uid,a=chooseAiAction(g,'offensive'),normal=a.type==='normal'&&a.uid===ace,prepared=applyAiAction(g,a),placed=prepared?applyAiAction(g,chooseAiAction(g,'offensive')):null,lumiraOnField=p.field.some(c=>c?.uid===ace),usedInFusion=p.graveyard.some(c=>c.uid===ace);return {normal,prepared:!!prepared,lumiraOnField,usedInFusion,placed:!!placed};})()");
 assert.deepEqual(r,{normal:true,prepared:true,lumiraOnField:true,usedInFusion:false,placed:true});
});
test('chapter V rejects direct Lumira fusion even when old recipe accepts the material combination',()=>{
 const r=setup().run("(()=>{const g=game,p=g.players[1],ace=p.hand.find(c=>c.id===ArcaneLv1Swarm.ids.ace),extra=p.hand.filter(c=>c.uid!==ace.uid).slice(0,2),all=[ace,...extra];return {recipe:ArcaneLumiraCorruption.recipe(g,all),blocked:!prepareHandFusion(g,all.map(c=>c.uid)),lumiraStillInHand:p.hand.some(c=>c.uid===ace.uid)};})()");
 assert.deepEqual(r,{recipe:true,blocked:true,lumiraStillInHand:true});
});
test('the boss fusion is never legal without Lumira or outside chapter V',()=>{
 const fifth=setup().run("(()=>{const g=game,p=g.players[1],id=ArcaneLv1Saga.corruptedId,others=p.hand.filter(c=>c.id!==ArcaneLv1Swarm.ids.ace).slice(0,3);g.fusionChoice=id;const r=fusedInstance(g,others,others.map(c=>dataOf(c).level));delete g.fusionChoice;return {r:r===null};})()");
 const fourth=setup(4).run("(()=>{const g=game,p=g.players[1],id=ArcaneLv1Saga.corruptedId,hand=p.hand.slice(0,3);return {has:ArcaneLumiraCorruption.recipe(g,hand),offer:fusionOptions(g,hand.map(c=>dataOf(c).level),hand).some(c=>c.id===id)};})()");
 assert.equal(fifth.r,true);assert.equal(fourth.has,false);assert.equal(fourth.offer,false);
});
test('dialogue and seven animation phases are hooked in order around the game action',()=>{
 const ai=fs.readFileSync(path.resolve(__dirname,'../assets/game.js'),'utf8');
 const script=fs.readFileSync(path.resolve(__dirname,'../assets/lumira-corruption-v49.js'),'utf8');
 const css=fs.readFileSync(path.resolve(__dirname,'../assets/lumira-corruption-v49.css'),'utf8');
 assert.ok(ai.indexOf("beforeAiAction?.(g,a)")<ai.indexOf("result=applyAiAction(g,a)"));
 assert.match(ai,/if\(lumiraFall\)await window\.ArcaneLumiraCorruption\.play\(g,result\.card\)/);
 for(const phase of ['angel','fracture','spiral','orb','burst','fallen','land']){
  assert.match(script,new RegExp("lumira-stage-"+phase));
  assert.match(css,new RegExp("lumira-stage-"+phase));
 }
 assert.match(script,/lumira-corruption-skip/);
 assert.match(script,/fullCardHtml/);
});
