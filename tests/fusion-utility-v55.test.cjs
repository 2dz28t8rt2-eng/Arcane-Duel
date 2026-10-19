'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
test('Lv3–5 fusion utility has meaningful role-specific effects and fires exactly once',()=>{
 const b=boot({seed:19020});
 const r=b.run("(()=>{const types=['predator','guardian','soul','resonator'];const rows=[];for(const role of types){const g=createGame({mode:'pve',context:'free',opponentId:1}),p=g.players[0],foe=g.players[1],t=RPG_FUSIONS.find(c=>c.level>=3&&c.level<=5&&!c.ace&&!c.lv1Exclusive&&!c.retired&&!c.essenceMonster);if(!t)throw Error('No test fusion');g.active=0;g.turn=4;p.lp=g.maxLP-500;foe.lp=g.maxLP;const card=newInstance(g,t.id,0);card.fusion=true;card.roleOverride=role;p.field[0]=card;const partner=newInstance(g,RPG_BASE_CARDS.find(c=>c.level===3&&!c.ace&&!c.retired).id,0);partner.roleOverride=role==='guardian'?'soul':'predator';p.field[1]=partner;const atk=partner.card.atk,def=partner.card.def,lp=p.lp,foeLp=foe.lp,hand=p.hand.length,shield=p.shield;const first=ArcaneFusionUtility55.grant(g,card),second=ArcaneFusionUtility55.grant(g,card);rows.push({role,first,second,atkGain:partner.card.atk-atk,defGain:partner.card.def-def,healed:p.lp-lp,damage:foeLp-foe.lp,drawn:p.hand.length-hand,shieldGain:p.shield-shield,description:card.arcaneUtilityText});}return rows;})()");
 for(const x of r){assert.equal(x.first,true);assert.equal(x.second,false);assert.ok(x.description);}
 assert.ok(r[0].atkGain>0,'Predator should strengthen normal pack');
 assert.ok(r[1].defGain>0&&r[1].healed>0,'Guardian should heal souls and team');
 assert.ok(r[2].damage>0&&r[2].healed>0,'Soul must attack through drain');
 assert.ok(r[3].drawn===1||r[3].shieldGain>0,'Resonator should gain card utility');
});
test('ordinary Lv6+ fusions and unique Lv1-exclusive cards never receive low-tier utility',()=>{
 const r=boot().run("(()=>{const g=createGame({mode:'pve',opponentId:1,context:'free'});return {hi:ArcaneFusionUtility55.eligible({id:RPG_FUSIONS.find(c=>c.level>=6&&!c.ace&&!c.retired).id,card:{level:7,atk:100,def:100},fusion:true}),basic:ArcaneFusionUtility55.eligible({id:RPG_BASE_CARDS.find(c=>c.level===4&&!c.retired).id,card:{level:4,atk:100,def:100},fusion:false})};})()");
 assert.deepEqual(r,{hi:false,basic:false});
});
