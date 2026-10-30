'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const run=(src,seed=21430)=>boot({seed}).run("(()=>{profile=freshProfile();profile.trainingWins=3;const g=createGame({mode:'pve',context:'free',opponentId:3,seed:"+seed+"});game=g;g.active=0;g.turn=5;g.aiPhase='summon';g.summoned=false;const p=g.players[0];const base=RPG_BASE_CARDS.find(c=>c.level===5&&!c.fusionOnly&&!c.retired&&!c.enemyOnly);const v6=RPG_FUSIONS.find(c=>c.level===6&&!c.retired&&!c.enemyOnly);const v8=RPG_FUSIONS.find(c=>c.level===8&&!c.retired&&!c.enemyOnly);if(!base||!v6||!v8)throw Error('missing real fusion fixtures');p.hand=[newInstance(g,base.id,0),newInstance(g,base.id,0)];p.field=Array.from({length:5},()=>newInstance(g,base.id,0));p.fusionDeck=[v6.id];p.remainingFusion=[v6.id];"+src+"})()");

test('full board with a single spare template disallows a hand fusion; chooser avoids the trap',()=>{
 const r=run("const m=p.hand,lv=m.map(c=>dataOf(c).level);const opts=fusionOptions(g,lv,m);const allowed=opts.filter(c=>canCompleteHandFusion(g,lv,c.id));const before=JSON.stringify({hand:p.hand.map(c=>c.uid),stock:p.remainingFusion,field:p.field.map(c=>c.uid)});const action=coreChooseAiAction(g,'balanced');return {options:opts.length,allowed:allowed.length,action:action.type,unchanged:JSON.stringify({hand:p.hand.map(c=>c.uid),stock:p.remainingFusion,field:p.field.map(c=>c.uid)})===before};");
 assert.ok(r.options>=1,JSON.stringify(r));
 assert.equal(r.allowed,0,JSON.stringify(r));
 assert.notEqual(r.action,'fusion',JSON.stringify(r));
 assert.equal(r.unchanged,true);
});

test('a genuine second fusion template still permits the intended full-board chain',()=>{
 const r=run("p.fusionDeck.push(v8.id);p.remainingFusion.push(v8.id);const lv=p.hand.map(c=>dataOf(c).level);const opts=fusionOptions(g,lv,p.hand);const legal=opts.filter(c=>canCompleteHandFusion(g,lv,c.id));const outcome=prepareHandFusion(g,p.hand.map(c=>c.uid),v6.id);const place=outcome?placePending(g,0,v8.id):null;return {available:opts.map(c=>c.level),legal:legal.map(c=>c.level),prepared:outcome,placed:!!place?.fused,used:p.remainingFusion.length};");
 assert.ok(r.available.includes(6),JSON.stringify(r));
 assert.ok(r.legal.includes(6),JSON.stringify(r));
 assert.equal(r.prepared,true,JSON.stringify(r));
 assert.equal(r.placed,true,JSON.stringify(r));
 assert.equal(r.used,0);
});

test('AI safely ignores repeatedly proposed illegal fusion rather than throwing or using a template',()=>{
 const r=run("const handBefore=p.hand.length,stockBefore=p.remainingFusion.length,turnBefore=g.turn;chooseAiAction=()=>({type:'fusion',uids:p.hand.map(c=>c.uid)});const finished=aiTurn(g,'balanced');return {turnBefore,turnAfter:g.turn,handBefore,handAfter:p.hand.length,stockBefore,stockAfter:p.remainingFusion.length,pending:!!g.pending,field:p.field.length};",21431);
 assert.ok(r.turnAfter>r.turnBefore,JSON.stringify(r));
 assert.equal(r.handAfter,r.handBefore);
 assert.equal(r.stockAfter,r.stockBefore);
 assert.equal(r.pending,false);
 assert.equal(r.field,5);
});

test('real Lv1 research help can list the exclusive quest template without spending it',()=>{
 const x=boot({seed:21432}).run("(()=>{profile=freshProfile();profile.lv1Saga.perk=true;game=createGame({mode:'pve',opponentId:1,context:'free',seed:21432});game.active=0;game.turn=5;const p=game.players[0],id=RPG_BASE_CARDS.find(c=>c.level===1&&!c.fusionOnly&&!c.ace).id;const m=Array.from({length:3},()=>newInstance(game,id,0));p.hand=m;p.field.fill(null);const template=ArcaneLv1Swarm.ids.hive;p.remainingFusion=[template];p.fusionDeck=[template];const stockBefore=p.remainingFusion.length;const info=window.ArcaneFusionGuide213.actualInfo({g:game,levels:[1,1,1],materials:m,pending:false});const html=window.ArcaneFusionGuide213.explanationText(info);return {target:template,special:info.specialLv1,eligible:info.specialTemplates.some(c=>c.id===template),bestId:info.best?.id,level:info.best?.level,help:html.includes('Verbotene Forschung'),stockBefore,stockAfter:p.remainingFusion.length};})()");
 assert.equal(x.special,true,JSON.stringify(x));
 assert.equal(x.eligible,true,JSON.stringify(x));
 assert.equal(x.bestId,x.target,JSON.stringify(x));
 assert.equal(x.level,1,JSON.stringify(x));
 assert.equal(x.help,true);
 assert.equal(x.stockAfter,x.stockBefore);
});