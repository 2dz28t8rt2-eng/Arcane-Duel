'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
test('v12.6 strengthened Jagdinstinkt and Schildwall affect only correctly typed owned normal monsters',()=>{
 const r=boot({seed:1261}).run(`(()=>{
 const hunter=CARDS.find(c=>c.rpg&&!c.retired&&!c.fusionOnly&&c.role==='predator'&&c.level>=3);
 const guard=CARDS.find(c=>c.rpg&&!c.retired&&!c.fusionOnly&&c.role==='guardian'&&c.level>=3);
 const fusion=CARDS.find(c=>c.rpg&&c.fusionOnly&&!c.retired);
 if(!hunter||!guard||!fusion)throw Error('Missing normal Predator or fusion samples');
 const full={jagdinstinkt:2,schildwall:2},zero={jagdinstinkt:0,schildwall:0};
 const bonus=(card,stat,owner,upgrades)=>normalRoleBonus(card,stat,owner,upgrades);
 return {h:hunter.level,g:guard.level,
 hAtk:bonus(hunter,'atk',0,full)-bonus(hunter,'atk',0,zero),
 hDef:bonus(hunter,'def',0,full)-bonus(hunter,'def',0,zero),
 gAtk:bonus(guard,'atk',0,full)-bonus(guard,'atk',0,zero),
 gDef:bonus(guard,'def',0,full)-bonus(guard,'def',0,zero),
 npcAtk:bonus(hunter,'atk',1,full)-bonus(hunter,'atk',1,zero),
 fusionAtk:bonus(fusion,'atk',0,full)-bonus(fusion,'atk',0,zero)};
})()`);
 assert.equal(r.hAtk,2*(20+10*r.h));
 assert.equal(r.hDef,2*(6+3*r.h));
 assert.equal(r.gAtk,2*(6+3*r.g));
 assert.equal(r.gDef,2*(28+10*r.g));
 assert.equal(r.npcAtk,0);assert.equal(r.fusionAtk,0);
});
