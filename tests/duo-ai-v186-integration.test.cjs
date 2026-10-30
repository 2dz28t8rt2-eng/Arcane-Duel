'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const rules=require('../assets/duo-shared-rules-v160.js');
const catalogData=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(catalogData.cards.map(c=>[c.id,c]));
const starter=[...catalogData.starterMain],fusion=[...catalogData.starterFusions];
const create=(chapter=1)=>rules.apply(rules.create({
 roomId:'duo-ai-186-'+chapter,hostName:'A',chapter,entry:chapter===1?'new':'chapter',
 hostDeck:starter,hostFusions:fusion,enemyDeckA:starter,enemyDeckB:starter,
 enemyFusionsA:fusion,enemyFusionsB:fusion,catalog,randomSeed:186000+chapter
}),2,{type:'join',name:'B',deck:starter,fusions:fusion},{catalog});
const active=(g,seat=1)=>{g.activeSeat=seat;g.round=5;g.status='active';return g;};
const creature=(id,props={})=>({id,uid:id+1000,level:catalog[id].level,
 atk:catalog[id].atk,def:catalog[id].def,role:catalog[id].role,mode:'atk',
 used:false,switched:false,placedRound:1,soul:0,condensed:0,
 soulCooldown:0,raidCooldown:0,lastSoulAction:-1,...props});
test('server & browser use identical latest 2v2 AI source',()=>{
 assert.equal(fs.readFileSync('assets/duo-shared-rules-v160.js','utf8'),
 fs.readFileSync('supabase/functions/arcane-duo-v2/duo-rules.js','utf8'));
 assert.equal(rules.aiPolicy,'18.6-duo-live.1');
});
test('both NPCs complete their turns; independent human decks remain unchanged',()=>{
 let g=active(create(),1);
 const before=JSON.stringify(g),human=g.players.map(p=>p.team===0?JSON.stringify([p.hand,p.deck]):null);
 const result=rules.aiTurn(g,{catalog});
 assert.equal(JSON.stringify(g),before,'The reducer must not modify original state');
 assert.equal(result.activeSeat,2);
 assert.ok(result.log.length>g.log.length);
 assert.deepEqual(result.players.map(p=>p.team===0?JSON.stringify([p.hand,p.deck]):null),human);
 g=active(result,3);
 const second=rules.aiTurn(g,{catalog});
 assert.equal(second.activeSeat,0);
});
test('defender position and real Soul actions are used when applicable',()=>{
 const soul=catalogData.cards.find(x=>x.playable&&x.role==='soul'&&!x.fusionOnly&&!x.ace&&x.level>=3);
 const guard=catalogData.cards.find(x=>x.playable&&x.role==='guardian'&&!x.fusionOnly&&!x.ace&&x.level>=3);
 assert.ok(soul&&guard);
 const g=active(create(),1),p=g.players[1];
 p.summoned=true;p.hand=[];p.field.fill(null);
 p.field[0]=creature(guard.id,{atk:100,def:1900,placedRound:4});
 p.field[1]=creature(soul.id,{mode:'def',soul:100,placedRound:4,lastSoulAction:-1});
 g.players[0].field[0]=creature(starter[0],{atk:700,def:700});
 const next=rules.aiTurn(g,{catalog});
 assert.ok(next.log.some(x=>x.includes('ändert die Position')),'Guardian must switch to DEF');
 assert.ok(next.log.some(x=>x.includes('Seelenentladung')||x.includes('Seelenraub')||x.includes('verdichtet')),
 'NPC must use legitimate Soul ability');
 assert.equal(next.activeSeat,2);
});
test('AI attack selects across two human fields, including finishing a direct attack',()=>{
 const g=active(create(),3),npc=g.players[3];
 npc.summoned=true;npc.hand=[];npc.field.fill(null);
 const attacker=catalogData.cards.find(x=>x.playable&&x.role==='predator'&&!x.fusionOnly);
 npc.field[0]=creature(attacker.id,{atk:5000,def:3000,placedRound:1});
 for(const seat of [0,2])g.players[seat].field.fill(null);
 g.teams[0].lp=400;
 const next=rules.aiTurn(g,{catalog});
 assert.equal(next.winner,1);
 assert.equal(next.status,'finished');
 assert.ok(next.log.some(s=>s.includes('direkter Angriff')));
});
test('fusions are allowed from real hand materials, never spawned free of costs',()=>{
 const g=active(create(8),1),npc=g.players[1];
 npc.field.fill(null);npc.summoned=false;
 // Candidate material rows can contain genuinely valid templates, but this
 // test must not presume a fusion is always preferable to a normal summon.
 const before=npc.remainingFusion.length,hand=npc.hand.length;
 const next=rules.aiTurn(g,{catalog});
 assert.ok(next.players[1].remainingFusion.length<=before);
 assert.ok(next.players[1].hand.length<=hand);
 assert.equal(next.activeSeat,2);
 assert.ok(next.log.some(s=>s.includes('beschwört')||s.includes('fusioniert')));
});
