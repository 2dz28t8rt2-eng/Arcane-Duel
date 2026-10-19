'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const audit=code=>boot({seed:19019}).run(code);
test('all ten tournament opponents follow the intended strategy rotation',()=>{
 const rows=audit('Array.from({length:10},(_,i)=>({tier:i+1,...ArcaneAiRevamp55.profileFor(i+1)}))');
 assert.deepEqual(rows.map(x=>x.style),
  ['attack','defense','fusion','attack','defense','fusion','attack','defense','fusion','hybrid']);
 assert.deepEqual(rows.map(x=>x.difficulty),
  ['leicht','leicht','leicht','mittel','mittel','mittel','schwer','schwer','schwer','finale']);
});
test('tournament decks are legal, contain ACE and final opponent has no Lv3 filler',()=>{
 const rows=audit("Array.from({length:10},(_,i)=>{const tier=i+1,g=createGame({mode:'pve',context:'tournament',opponentId:tier,difficulty:'easy'}),p=g.players[1],ace=ACE_CARD_IDS[tier],copies=p.originalDeck.filter(x=>x===ace).length;return {tier,count:p.originalDeck.length,valid:!mainDeckError(p.originalDeck,RPG_BASE_CARDS.map(c=>c.id)),min:Math.min(...p.originalDeck.map(x=>CARDS[x].level)),aceInMain:copies,aceInFusion:p.fusionDeck.includes(ace),fusionAce:CARDS[ace].fusionOnly,distinct:new Set(p.originalDeck).size,power:p.power};})");
 for(const r of rows){
  assert.equal(r.count,40,'tier '+r.tier+' needs 40 cards');
  assert.equal(r.valid,true,'tier '+r.tier+' invalid deck '+JSON.stringify(r));
  assert.ok(r.aceInMain>0||r.aceInFusion,'tier '+r.tier+' missing ACE');
  assert.ok(r.distinct>=10,'tier '+r.tier+' has too little variety');
 }
 assert.ok(rows[9].min>=7,'Final boss must never bring Lv3 filler: '+JSON.stringify(rows[9]));
 console.log('AI_DECK_AUDIT',JSON.stringify(rows));
});
test('a drawn ordinary ACE outranks weaker summons in NPC tournament',()=>{
 const result=audit("(()=>{const g=createGame({mode:'pve',context:'tournament',opponentId:7});game=g;g.active=1;g.aiPhase='summon';g.summoned=false;g.pending=null;g.players[1].field.fill(null);const id=ACE_CARD_IDS[7];if(CARDS[id].fusionOnly)return {fusion:true};const ace=newInstance(g,id,1);g.players[1].hand=[ace,...g.players[1].hand.filter(c=>c.id!==id).slice(0,4)];const choice=chooseAiAction(g);return {fusion:false,type:choice.type,chosen:choice.uid===ace.uid};})()");
 if(!result.fusion){assert.equal(result.type,'normal');assert.equal(result.chosen,true);}
});
test('ace preparation shifts an existing card in the actual deck rather than creating one',()=>{
 const result=audit("(()=>{const g=createGame({mode:'pve',context:'tournament',opponentId:10});game=g;g.active=1;g.aiPhase='summon';g.turn=9;g.summoned=false;const ace=ACE_CARD_IDS[10],p=g.players[1];const amountBefore=p.deck.filter(x=>x===ace).length;p.hand=p.hand.filter(c=>c.id!==ace);p.graveyard=[];p.field.fill(null);if(!amountBefore)return {skip:true};chooseAiAction(g);return {skip:false,flag:g.arcaneAceCue,first:p.deck[0]===ace,remaining:p.deck.filter(x=>x===ace).length,amountBefore};})()");
 if(!result.skip){assert.equal(result.flag,true);assert.equal(result.first,true);assert.equal(result.remaining,result.amountBefore);}
});
test('Forbidden Research unlock and upgrade rank are validated and persist after a save roundtrip',()=>{
 const result=audit("(()=>{profile.lv1Saga={offered:true,met:true,stage:5,perk:true,skillRank:3,story:[1,2,3,4,5]};const normal=RPG_BASE_CARDS.find(c=>c.level===1&&!c.fusionOnly&&!c.ace&&!c.retired);const bonus=normalRoleBonus(normal,'atk',0,profile.upgrades);const enemy=normalRoleBonus(normal,'atk',1,profile.upgrades);saveProfile();const saved=JSON.parse(localStorage.getItem(SAVE_KEY));const validated=validateProfile(saved);return {bonus:bonus-enemy,rank:saved.lv1Saga.skillRank,validated:validated.lv1Saga.skillRank};})()");
 assert.equal(result.bonus,15);assert.equal(result.rank,3);assert.equal(result.validated,3);
});
test('no permanent Lv1 research passive without clearing finale',()=>{
 const result=audit("(()=>{profile.lv1Saga={offered:true,met:true,stage:3,perk:false,skillRank:0};const x=RPG_BASE_CARDS.find(c=>c.level===1&&!c.ace&&!c.fusionOnly&&!c.retired);return normalRoleBonus(x,'def',0,profile.upgrades)-normalRoleBonus(x,'def',1,profile.upgrades);})()");
 // Other player-only progression bonuses may exist: compare against baseline.
 assert.equal(result,0);
});

test('fusion-oriented opponents can plan their ACE directly from legal hand materials',()=>{
 const result=audit("Array.from({length:3},(_,i)=>{const tier=[6,9,10][i],g=createGame({mode:'pve',context:'tournament',opponentId:tier}),p=g.players[1];g.active=1;g.aiPhase='summon';g.summoned=false;g.pending=null;p.field.fill(null);const ace=ACE_CARD_IDS[tier];let legal=null;for(let a=0;a<p.hand.length&&!legal;a++)for(let b=a+1;b<p.hand.length;b++){const x=[p.hand[a],p.hand[b]],levels=x.map(c=>dataOf(c).level);if(fusionOptions(g,levels,x).some(c=>c.id===ace)&&canCompleteHandFusion(g,levels,ace))legal=x;}if(!legal)return {tier,legal:false};p.hand=[...legal,...p.hand.filter(c=>!legal.includes(c))];const a=chooseAiAction(g);return {tier,legal:true,chosen:a.choice===ace,action:a.type};})");
 for(const x of result)if(x.legal){
  assert.equal(x.action,'fusion','tier '+x.tier+' should fuse available ACE');
  assert.equal(x.chosen,true,'tier '+x.tier+' should choose ACE template');
 }
 console.log('ACE_FUSION_PLAN_AUDIT',JSON.stringify(result));
});
test('temporary Lv1 mechanics unlock per trial; passive only after final research',()=>{
 const r=audit("(()=>{profile.lv1Saga={offered:true,met:true,stage:2,perk:false};const g=createGame({mode:'pve',opponentId:1,context:'challenge'});g.lv1Saga={stage:2};const float=ArcaneLv1Swarm.enabled(g);g.lv1Saga.stage=3;const swarm=ArcaneLv1Swarm.enabled(g);g.lv1Saga.stage=4;const fusion=ArcaneLv1Swarm.enabled(g);delete g.lv1Saga;const outside=ArcaneLv1Swarm.enabled(g);profile.lv1Saga.perk=true;profile.lv1Saga.skillRank=1;const after=ArcaneLv1Swarm.enabled(g);return {float,swarm,fusion,outside,after};})()");
 assert.deepEqual(r,{float:true,swarm:true,fusion:true,outside:false,after:true});
});
