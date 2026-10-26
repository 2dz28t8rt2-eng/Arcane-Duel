const test=require("node:test");
const assert=require("node:assert/strict");
const fx=require("../assets/duo-cinematics-v167.js");

const unit=(id,atk=100,def=100,used=false)=>({id,atk,def,uid:"unit-"+id,used});
const player=(seat,name,field)=>({seat,name,team:seat%2,field,
  lv1:{ghostSlots:[]}});
function state(revision,log=[],overrides={}){
 return {roomId:"fixture-room",revision,chapter:1,round:3,
  players:[player(0,"Host",[unit(1),null]),
   player(1,"Gegner A",[unit(2),null]),player(2,"Partner",[null,null]),
   player(3,"Gegner B",[null,null])],log,...overrides};
}
test("no duplicate choreography for an unchanged server revision",()=>{
 const s=state(3,["Host ist am Zug"]);
 assert.deepEqual(fx.describe(s,s),[]);
 assert.deepEqual(fx.describe(null,s),[]);
});
test("fusion announcement follows the actual new card",()=>{
 const a=state(1),b=state(2,["Host fusioniert 2 eigene Monster zu Wolkentitan."]);
 b.players[0].field[1]=unit(20,300,280);
 const events=fx.describe(a,b);
 assert.equal(events.length,1);
 assert.equal(events[0].type,"fusion");
 assert.deepEqual(events[0].where,{seat:0,slot:1,area:"field"});
});
test("an attack uses confirmed log and changed enemy defense",()=>{
 const a=state(10),b=state(11,["Host greift Gegner A in DEF an: 80 Schaden"]);
 b.players[0].field[0].used=true;
 b.players[1].field[0].def=20;
 const events=fx.describe(a,b);
 assert.equal(events[0].type,"attack");
 assert.equal(events[0].from.seat,0);
 assert.equal(events[0].where.seat,1);
});
test("fate and arena events are determined only by confirmed public state",()=>{
 const a=state(7);
 const b=state(8,["✦ SCHICKSALSZUG! Partner zieht Rettungskarten."],
  {fateEvent:{ownerSeat:2,round:3}});
 b.players[2].field[0]=unit(30);
 assert.equal(fx.describe(a,b)[0].type,"fate");
 const c=state(9,["☄ Arena-Zerfall, Runde 11: 320 LP"],{round:11});
 assert.equal(fx.describe(a,c)[0].type,"arena");
});
test("chapter changes cannot replay stale logs",()=>{
 const a=state(50,["Host fusioniert 2 Monster"]);
 const b=state(51,["Kapitel 2 beginnt"],{chapter:2});
 assert.equal(fx.describe(a,b)[0].type,"chapter");
 assert.equal(fx.describe(a,b).length,1);
});
test("effects stay bounded when many server events arrive",()=>{
 const a=state(1),b=state(2,
  ["Host beschwört A","Host beschwört B","Host greift Gegner A",
   "Host greift Gegner B","Host fusioniert 3 Monster"]);
 assert.ok(fx.describe(a,b).length<=3);
});

test("a destroyed target follows the confirmed attack in order",()=>{
 const a=state(20),b=state(21,["Host greift Gegner A in ATK an"]);
 b.players[0].field[0].used=true;b.players[1].field[0]=null;
 const events=fx.describe(a,b);
 assert.deepEqual(events.map(e=>e.type),["attack","destroy"]);
 assert.equal(events[1].where.seat,1);
});
