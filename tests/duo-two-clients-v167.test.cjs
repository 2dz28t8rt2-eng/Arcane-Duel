const {test}=require("node:test");
const assert=require("node:assert/strict");
const rules=require("../assets/duo-shared-rules-v160.js");
const data=require("../assets/duo-card-catalog-v160.json");
const catalog=Object.fromEntries(data.cards.map(x=>[x.id,x]));
function pairedRoom(){
 const base=rules.create({roomId:"paired-device-fixture",hostName:"Host",
  hostDeck:[...data.starterMain],hostFusions:[...data.starterFusions],
  enemyDeckA:[...data.starterMain],enemyDeckB:[...data.starterMain],
  enemyFusionsA:[...data.starterFusions],enemyFusionsB:[...data.starterFusions],
  chapter:1,entry:"new",catalog});
 return rules.apply(base,2,{type:"join",name:"Partner",
  deck:[...data.starterMain],fusions:[...data.starterFusions]},{catalog});
}
test("two clients see consistent public revisions but never each other's private hands",()=>{
 let room=pairedRoom(),host=rules.view(room,0),guest=rules.view(room,2);
 assert.equal(host.revision,guest.revision);
 assert.equal(host.players[0].hand.length,5);
 assert.equal(guest.players[2].hand.length,5);
 assert.ok(guest.players[0].hand.every(x=>x===null));
 assert.ok(host.players[2].hand.every(x=>x===null));
 const next=rules.apply(room,0,{type:"end"},{catalog});
 host=rules.view(next,0);guest=rules.view(next,2);
 assert.equal(host.revision,guest.revision);
 assert.equal(host.activeSeat,guest.activeSeat);
 assert.ok(next.revision>room.revision);
 assert.equal(room.activeSeat,0,"reducer must preserve old state");
});
test("the partner cannot submit actions when host has the turn",()=>{
 const room=pairedRoom();
 assert.throws(()=>rules.apply(room,2,{type:"end"},{catalog}),/zug|Zug|Reihe|aktiv|Sitz|dran|berechtigt/i);
});
test("independent client views agree on team LP and the current chapter",()=>{
 const room=pairedRoom();
 const a=rules.view(room,0),b=rules.view(room,2);
 assert.deepEqual(a.teams,b.teams);
 assert.equal(a.chapter,b.chapter);
 assert.equal(a.round,b.round);
});
