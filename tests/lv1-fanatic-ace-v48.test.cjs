'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {boot}=require('./helpers/game-runtime.cjs');
function stage(n){
 const b=boot({seed:100+n});
 b.exec("profile=freshProfile();profile.lv1Saga={offered:true,stage:"+(n-1)+",perk:false,aceGranted:false,finalRewards:false,story:[]};profile.activeDuel=null;startDuel('pve',1,'lv1-saga','easy',"+n+");");
 return b;
}
test('all five research decks are different, 40 legal regular cards, and contain the guaranteed sealed Lumira in hand',()=>{
 const reports=[1,2,3,4,5].map(n=>stage(n).run("(()=>{const g=game,p=g.players[1],ace=p.hand.find(c=>c.id===ArcaneLv1Swarm.ids.ace),counts={};for(const id of p.originalDeck)counts[id]=(counts[id]||0)+1;return {stage:g.lv1Saga?.stage,lp:g.maxLP,ace:!!ace,sealed:ace?.lv1FanaticSealed===true,hand:p.hand.length,original:p.originalDeck.length,deckContainsAce:p.originalDeck.includes(ArcaneLv1Swarm.ids.ace),unique:Object.keys(counts).length,duplicates:Math.max(...Object.values(counts)),low:p.originalDeck.filter(id=>CARDS[id].level===1).length,power:p.power};})()"));
 assert.deepEqual(reports.map(r=>r.stage),[1,2,3,4,5]);
 assert.ok(reports.every(r=>r.ace&&r.sealed&&r.hand===5&&r.original===40&&!r.deckContainsAce&&r.duplicates<=3));
 assert.equal(reports[0].lp,2000);
 assert.equal(reports[0].low,40);
 assert.ok(reports[1].low>=30);
 assert.ok(reports[2].low<reports[1].low);
 assert.equal(reports[4].low,0);
 assert.ok(reports[2].power>reports[1].power&&reports[4].power>reports[3].power);
});
test('the fanatic must summon Lumira before any other card, in every stage, triggering the specific once-only dialogue',()=>{
 for(let n=1;n<=5;n++){
  const r=stage(n).run("(()=>{const g=game,p=g.players[1],a=g.lv1FanaticAce;g.active=1;g.turn=2;g.summoned=false;const order=chooseAiAction(g,'offensive'),selected=order.uid===a.uid;const summoned=applyAiAction(g,order);const placed=placePending(g,0);const effect=placed?.card?.lv1FanaticSealed===true;return {type:order.type,selected,summoned:!!summoned,placed:!!placed,played:a.played,pending:a.dialogPending,shown:a.dialogShown,seal:effect};})()");
  assert.deepEqual(r,{type:'normal',selected:true,summoned:true,placed:true,played:true,pending:true,shown:false,seal:true},'chapter '+n);
 }
});
test('Lumira remains powerless in the enemy hand and battlefield even if the player unlocked swarm',()=>{
 const r=stage(3).run("(()=>{const g=game,p=g.players[1];profile.lv1Saga.perk=true;g.active=1;g.turn=3;const ace=p.hand.find(c=>c.id===ArcaneLv1Swarm.ids.ace);prepareNormal(g,ace.uid);placePending(g,0);g.players[0].field.fill(null);const lp=p.lp,opponent=g.players[0].lp;const result=attack(g,0,null);return {attacked:!!result,enemyHealed:p.lp!==lp,didDamage:g.players[0].lp<opponent,stats:p.field[0]?.card?.level,abilityEnabled:!!p.field[0]?.lv1AceSaved};})()");
 assert.equal(r.attacked,true);assert.equal(r.enemyHealed,false);assert.equal(r.didDamage,true);assert.equal(r.stats,1);assert.equal(r.abilityEnabled,false);
});
test('the final antagonist has one unique Level-5 Predator fusion with red corrupted art and no invented abilities',()=>{
 const b=stage(5);const r=b.run("(()=>{const id=ArcaneLv1Saga.corruptedId,c=CARDS[id],p=game.players[1];return {name:c.name,level:c.level,role:c.role,ability:c.ability??null,art:c.art,enemyOnly:c.enemyOnly,fusionOnly:c.fusionOnly,inDeck:p.fusionDeck.includes(id),stock:p.remainingFusion.includes(id)};})()");
 assert.match(r.name,/Lumiras Fall/);assert.equal(r.level,5);assert.equal(r.role,'predator');
 assert.equal(r.ability,null);assert.equal(r.enemyOnly,true);assert.equal(r.fusionOnly,true);
 assert.equal(r.inDeck,true);assert.equal(r.stock,true);
 const file=fs.readFileSync(path.resolve(__dirname,'../'+r.art));
 assert.equal(file.subarray(0,4).toString('ascii'),'RIFF');
 assert.equal(file.subarray(8,12).toString('ascii'),'WEBP');
 assert.ok(file.length>150000);
});
test('every Lumira apparition has a distinct hopeful-to-disillusioned response',()=>{
 const r=stage(1).run("ArcaneLv1Saga.aceScenes.map(s=>[s.mood,s.text,s.response])");
 assert.equal(r.length,5);
 assert.equal(new Set(r.map(s=>s[1])).size,5);
 assert.ok(r.every(s=>s[1].length>70&&s[2].length>45));
});

test('in stage V the opponent actively fuses and plays the corrupted Predator after his forced Lumira',()=>{
 const r=stage(5).run("(()=>{const g=game,p=g.players[1];g.active=1;g.turn=2;let a=chooseAiAction(g);applyAiAction(g,a);placePending(g,0);g.summoned=false;g.turn=4;g.aiPhase='summon';const next=chooseAiAction(g);const began=next.type==='fusion'?applyAiAction(g,next):false;const prepared=g.pending?.card?.id===ArcaneLv1Saga.corruptedId;const summoned=began?placePending(g,1):null;return {ace:g.lv1FanaticAce.played,type:next.type,materials:next.uids?.length||0,began:!!began,prepared,corrupt:!!summoned&&summoned.card.id===ArcaneLv1Saga.corruptedId,dialog:g.lv1FanaticCorruptDialoguePending===true};})()");
 assert.equal(r.ace,true);assert.equal(r.type,'fusion');
 assert.ok(r.materials>=3&&r.materials<=5);
 assert.equal(r.began,true);assert.equal(r.prepared,true);assert.equal(r.corrupt,true);assert.equal(r.dialog,true);
});
