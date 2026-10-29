'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {combinations,enumerateLargeFusions}=require('./helpers/ai-multifusion-v1573.cjs');

test('enumerates all legal 3/4/5 material sizes without duplicates',()=>{
 const cards=[1,2,3,4,5];
 assert.deepEqual([3,4,5].map(n=>combinations(cards,n).length),[10,5,1]);
 assert.ok(combinations(cards,4).every(a=>new Set(a).size===4));
});

test('simulates real action and only returns valid 3–5 material candidates',()=>{
 const card=id=>({uid:id,id,card:{atk:80,def:65,level:2}});
 const own={hand:[1,2,3,4,5].map(card),field:Array(5).fill(null)};
 const game={active:0,pending:null,players:[own,{hand:[],field:Array(5).fill(null)}]};
 const x=enumerateLargeFusions({game,own,profile:{materialCost:.53,synergy:1},
  cardValue:c=>c.card.atk+c.card.def,
  dataOf:c=>c.card,isFateCard:()=>false,
  fusionOptions:()=>[{id:99,level:7,atk:500,def:480}],
  canCompleteHandFusion:()=>true,role:()=> 'resonator',
  applyAiAction:(clone,action)=>{
   if(action.type==='fusion'){
    assert.ok(action.uids.every(uid=>clone.players[0].hand.some(c=>c.uid===uid)));
    clone.pending={card:{uid:99,id:99,card:{atk:550,def:530,level:7}}};return true;
   }
   if(action.type==='place'){
    clone.players[0].field[action.idx]=clone.pending.card;
    clone.pending=null;return true;
   }
   return false;
  }});
 for(const n of [3,4,5]){
  assert.ok(x.bySize[n].legal>0);
  assert.ok(x.bySize[n].previewed>0);
  assert.ok(x.bySize[n].accepted>0);
 }
 assert.ok(x.choices.every(v=>v.a.uids.length>=3&&v.a.uids.length<=5));
});

test('rejects failed legal-action previews instead of inventing fusion strength',()=>{
 const own={hand:[1,2,3].map(id=>({uid:id,id,card:{level:1,atk:10,def:10}})),field:Array(5).fill(null)};
 const out=enumerateLargeFusions({game:{active:0,players:[own,{field:[]}]},own,
  profile:{materialCost:.5,synergy:1},cardValue:c=>c.card.atk+c.card.def,
  dataOf:c=>c.card,isFateCard:()=>false,
  fusionOptions:()=>[{id:9,level:2,atk:50,def:50}],
  canCompleteHandFusion:()=>true,role:()=> 'resonator',applyAiAction:()=>false});
 assert.equal(out.bySize[3].legal,1);
 assert.equal(out.bySize[3].accepted,0);
 assert.equal(out.choices.length,0);
});
