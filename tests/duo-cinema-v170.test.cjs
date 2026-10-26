'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const cine=require('../assets/duo-cinema-v170.js');
const card=(uid,attrs={})=>({uid,id:222,level:5,atk:800,def:1000,
 role:'guardian',fusion:true,quality:1.08,pattern:'Full House',qualityRolls:3,
 rollTrace:[{atk:700,def:800},{atk:810,def:920},{atk:760,def:850}],
 materialBonus:{atk:20,def:0},rollMath:{winnerIndex:1},...attrs});
const player=(seat,hand=[],field=[])=>({seat,kind:seat%2===0?'human':'ai',
 name:seat===0?'Gastgeber':seat===2?'Partner':seat===1?'KI A':'KI B',
 hand,field:field.length?field:[null,null],lv1:{ghostSlots:[]}});
const room=(revision,players)=>({roomId:'beta-cinema',revision,chapter:1,
 fateEvent:null,players});
const initial=()=>room(1,[player(0,[1,2]),player(1,[null]),player(2,[3]),player(3,[null])]);
test('two humans (0/2) and two AIs (1/3) are kept distinct',()=>{
 const state=initial();
 assert.deepEqual(state.players.map(x=>x.kind),['human','ai','human','ai']);
 assert.deepEqual(cine.observed(state,state),[]);
});
test('real confirmed fusion uses server roll trace, role, best index and bonuses',()=>{
 const before=initial(),next=structuredClone(before);
 next.revision=2;next.players[0].field[1]=card(101);
 const events=cine.observed(before,next);
 assert.equal(events.length,1);const e=events[0];
 assert.equal(e.kind,'fusion');assert.equal(e.seat,0);
 assert.equal(e.result.role,'guardian');assert.equal(e.result.rolls.length,3);
 assert.deepEqual(e.result.rolls[1],{atk:810,def:920});
 assert.equal(e.result.winnerIndex,1);assert.equal(e.result.bonus.atk,20);
 assert.equal(e.result.quality,1.08);
 assert.deepEqual(cine.observed(next,next),[]);
});
test('AI fusion is publicly visible but does not disclose private hand cards',()=>{
 const before=initial(),next=structuredClone(before);
 next.revision=2;next.players[1].field[0]=card(200,{id:333,role:'predator'});
 next.players[1].hand=[null,null,null,null,null];
 const events=cine.observed(before,next);
 assert.equal(events[0].kind,'fusion');
 const draws=events.filter(x=>x.kind==='draw');
 assert.ok(draws.every(x=>x.hidden===true));
 assert.ok(draws.every(x=>!('cards' in x)&&!('ids' in x)));
});
test('draw animation carries only the hand count and hides card identities',()=>{
 const before=initial(),next=structuredClone(before);
 next.revision=3;next.players[2].hand=[9,12,7,4];
 next.players[1].hand=[null,null,null,null];
 const events=cine.observed(before,next);
 assert.equal(events.length,2);
 assert.ok(events.every(x=>x.kind==='draw'&&x.hidden));
 assert.equal(events.find(x=>x.seat===2).count,3);
 assert.equal(events.find(x=>x.seat===1).count,3);
 assert.equal(JSON.stringify(events).includes('"id":9'),false);
});
test('new chapter or initial load cannot replay previous dice/draws',()=>{
 const before=initial(),next=structuredClone(before);
 next.revision=2;next.chapter=2;
 next.players[0].field[0]=card(567);
 assert.deepEqual(cine.observed(before,next),[]);
 assert.deepEqual(cine.observed(null,next),[]);
});
test('fate replaces cards without producing an extra normal draw cinema',()=>{
 const before=initial(),next=structuredClone(before);
 next.revision=2;next.fateEvent={ownerSeat:0,round:3};
 next.players[0].hand=[1,2,3,4,5];
 assert.deepEqual(cine.observed(before,next),[]);
});
test('old revisions do not animate after newer state',()=>{
 const before=initial(),next=structuredClone(before);
 next.revision=0;next.players[0].field[0]=card(345);
 assert.deepEqual(cine.observed(before,next),[]);
});
test('visual queue bounds dice (12) and draws (5) without altering actual game state',()=>{
 const before=initial(),next=structuredClone(before);
 next.revision=2;next.players[0].field[0]=card(678,{rollTrace:Array.from({length:20},(_,i)=>({atk:i,def:20-i}))});
 next.players[2].hand=Array(10).fill(23);
 const copy=structuredClone(next);
 const e=cine.observed(before,next);
 assert.equal(e[0].result.rolls.length,12);
 assert.equal(e.find(x=>x.kind==='draw').count,5);
 assert.deepEqual(next,copy,'cinema must not write to authoritative state');
});
