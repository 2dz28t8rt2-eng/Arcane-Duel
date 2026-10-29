'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const rules=require('../assets/duo-shared-rules-v160.js');
const cinema=require('../assets/duo-cinema-v170.js');
const snapshot=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(snapshot.cards.map(c=>[c.id,c]));
const baseDeck=snapshot.starterMain,fusions=snapshot.starterFusions;
function game(){
 const waiting=rules.create({roomId:'predator-duo-198',hostName:'Hannes',
  hostDeck:baseDeck,hostFusions:fusions,enemyDeckA:baseDeck,enemyDeckB:baseDeck,
  enemyFusionsA:fusions,enemyFusionsB:fusions,catalog,randomSeed:42});
 return rules.apply(waiting,2,{type:'join',name:'Partner',deck:baseDeck,fusions},{catalog});
}
const act=(state,seat,action)=>rules.apply(state,seat,action,{catalog});
function fusion(n,seat=0){
 const state=game();state.activeSeat=seat;state.players[seat].hand=Array(n).fill(9);
 const materials=Array.from({length:n},(_,index)=>({from:'hand',index}));
 const choices=rules.fusionOptions(state,seat,materials,catalog);
 assert.equal(choices.analysis.role,'predator');
 return act(state,seat,{type:'fusion',materials,slot:0,templateId:choices.templates[0]});
}
const fighter=(uid,{atk=1000,def=10000,role='predator',mode='atk',level=3,...rest}={})=>({
 uid,id:9,level,atk,def,maxDef:def,role,mode,fusion:false,used:false,
 switched:false,placedRound:0,decayGrace:1,lv1Shield:0,soul:0,condensed:0,...rest});
function viewModule(){
 const window={};
 vm.runInNewContext(fs.readFileSync(path.resolve(__dirname,
  '../assets/duo-predator-pack-v198.js'),'utf8'),{window,document:{}});
 return window.ArcaneDuoPredator198;
}
test('shared client and Edge reducer remain strictly identical',()=>{
 assert.equal(fs.readFileSync(path.resolve(__dirname,
  '../assets/duo-shared-rules-v160.js'),'utf8'),
 fs.readFileSync(path.resolve(__dirname,
  '../supabase/functions/arcane-duo-v2/duo-rules.js'),'utf8'));
});
test('two to five Predator fusion materials grant exact tiered Rudelführer powers',()=>{
 for(const [count,expected] of [[2,0],[3,1],[4,2],[5,3]]){
  const result=fusion(count),alpha=result.players[0].field[0];
  assert.equal(alpha.role,'predator');assert.equal(alpha.fusion,true);
  assert.equal(alpha.predatorLeader.materials,count);
  assert.equal(alpha.predatorLeader.powers.length,expected);
  assert.equal(new Set(alpha.predatorLeader.powers).size,expected);
  assert.ok(alpha.predatorLeader.powers.every(p=>['swarm','mark','token'].includes(p)));
  assert.equal(alpha.predatorLeader.bornUid,alpha.uid);
  if(count===5)assert.deepEqual(alpha.predatorLeader.powers,['swarm','mark','token']);
  const pub=rules.view(result,2);
  assert.deepEqual(pub.players[0].field[0].predatorLeader,alpha.predatorLeader);
  assert.equal(pub.rngSeed,undefined);
 }
});
test('identical seed and matching inputs yield identical rolled abilities',()=>{
 assert.deepEqual(fusion(4),fusion(4));
 const enemy=fusion(5,1);
 assert.equal(enemy.players[1].field[0].predatorLeader.powers.length,3);
 assert.equal(enemy.players[1].team,1);
});
test('new leader permanently retires older leader even after the new one dies',()=>{
 const g=fusion(5),p=g.players[0],old=p.field[0];
 p.hand=[9,9,9];p.summoned=false;p.remainingFusion.push(old.id);
 const materials=[0,1,2].map(index=>({from:'hand',index}));
 const choice=rules.fusionOptions(g,0,materials,catalog).templates[0];
 const renewed=act(g,0,{type:'fusion',materials,slot:1,templateId:choice});
 assert.equal(renewed.players[0].field[0].predatorLeader,undefined);
 assert.ok(renewed.players[0].field[1].predatorLeader);
 renewed.players[0].field[1]=null;
 assert.equal(renewed.players[0].field[0].predatorLeader,undefined);
});
test('Predator mark is scoped to exact target UID, owner seat and own turn',()=>{
 let g=game();g.round=4;g.activeSeat=0;g.turn=12;
 const p=g.players[0];
 p.field[0]=fighter(501,{fusion:true,predatorLeader:{materials:5,
  powers:['swarm','mark','token'],bornUid:501,ownTurns:0,createdTurn:0}});
 p.field[1]=fighter(502);p.field[2]=fighter(503);
 g.players[1].field[0]=fighter(701,{role:'combatant',mode:'def'});
 const target=(state)=>state.players[1].field[0];
 const first=act(g,0,{type:'attack',slot:0,targetSeat:1,targetSlot:0});
 const firstHit=10000-target(first).def;
 assert.equal(firstHit,Math.floor(1000*(1+3*.035)));
 assert.equal(first.predatorPursuit.ownerSeat,0);
 assert.equal(first.predatorPursuit.targetUid,701);
 assert.equal(first.predatorImpact.followups,0);
 const second=act(first,0,{type:'attack',slot:1,targetSeat:1,targetSlot:0});
 assert.equal(target(first).def-target(second).def,
  Math.floor(Math.floor(1000*(.90+3*.035))*1.08));
 assert.equal(second.predatorImpact.followups,1);
 assert.equal(second.predatorImpact.bonusPct,.08);
 assert.equal(second.predatorPursuit.attackers.length,2);
 const third=act(second,0,{type:'attack',slot:2,targetSeat:1,targetSlot:0});
 assert.equal(target(second).def-target(third).def,
  Math.floor(Math.floor(1000*(.90+3*.035))*1.13));
 assert.equal(third.predatorImpact.followups,2);
 const next=act(third,0,{type:'end'});
 assert.equal(next.predatorPursuit,null);
 assert.equal(next.activeSeat,1);
 assert.equal(g.predatorPursuit,undefined,'previous state must stay immutable');
});
test('different target restarts hunt; previously used attacker gains no extra bonus',()=>{
 let g=game();g.round=4;g.activeSeat=0;
 g.players[0].field[0]=fighter(10);g.players[0].field[1]=fighter(11);
 g.players[1].field[0]=fighter(20,{mode:'def',role:'combatant'});
 g.players[3].field[0]=fighter(30,{mode:'def',role:'combatant'});
 g=act(g,0,{type:'attack',slot:0,targetSeat:1,targetSlot:0});
 assert.equal(g.predatorPursuit.targetUid,20);
 g=act(g,0,{type:'attack',slot:1,targetSeat:3,targetSlot:0});
 assert.equal(g.predatorPursuit.targetUid,30);
 assert.equal(g.predatorImpact.followups,0);
});
test('Rudelruf summons only on every third own turn and keeps its charge when full',()=>{
 let g=game();g.players[0].field[0]=fighter(555,{fusion:true,
  predatorLeader:{materials:5,powers:['swarm','mark','token'],bornUid:555,
   ownTurns:0,createdTurn:0}});
 g.round=2;g.turn=7;g.activeSeat=3;
 for(let i=1;i<=3;i++){
  g=act(g,3,{type:'end'});
  const leader=g.players[0].field[0];
  assert.equal(leader.predatorLeader.ownTurns,i===3?0:i);
  assert.equal(g.players[0].field.filter(c=>c?.predatorToken).length,i===3?1:0);
  if(i<3){g.activeSeat=3;g.turn+=3;g.round++;}
 }
 const token=g.players[0].field.find(c=>c?.predatorToken);
 assert.equal(token.predatorToken.leaderUid,555);
 assert.equal(token.role,'predator');assert.equal(token.fusion,false);
 assert.equal(token.level,3);
 assert.equal(token.atk,Math.max(10,Math.round(catalog[token.id].atk*.55/10)*10));
 assert.equal(token.def,Math.max(10,Math.round(catalog[token.id].def*.55/10)*10));
 assert.equal(token.placedRound,g.round);
 g.players[0].field[1]=null;
 g.players[0].field=Array.from({length:7},(_,i)=>i===0?g.players[0].field[0]:fighter(600+i));
 g.players[0].field[0].predatorLeader.ownTurns=2;
 g.activeSeat=3;g.turn+=3;g.round++;
 g=act(g,3,{type:'end'});
 assert.equal(g.players[0].field[0].predatorLeader.ownTurns,3);
 g.players[0].field[6]=null;g.activeSeat=3;g.turn+=3;g.round++;
 g=act(g,3,{type:'end'});
 assert.equal(g.players[0].field[0].predatorLeader.ownTurns,0);
 assert.ok(g.players[0].field[6].predatorToken);
});
test('tokens are never fusion material and never remain as permanent graveyard loot',()=>{
 let g=game();g.players[0].field[0]=fighter(88,{predatorToken:{leaderUid:77,level:3}});
 g.players[0].field[1]=fighter(89);
 assert.throws(()=>rules.fusionOptions(g,0,[{from:'field',index:0},
  {from:'field',index:1}],catalog),/niemals Fusionsmaterial/);
 assert.throws(()=>act(g,0,{type:'fusion',materials:[{from:'field',index:0},
  {from:'field',index:1}],slot:0,templateId:41}),/niemals Fusionsmaterial/);
 g.round=4;g.players[0].field[0].mode='atk';
 g.players[0].graveyard.push(g.players[0].field[0]);
 g=act(g,0,{type:'switch',slot:1});
 assert.equal(g.players[0].graveyard.some(c=>c.predatorToken),false);
 assert.equal(g.players[0].field[0].predatorToken.level,3);
});
test('public effects and the fusion cinema detect server-confirmed leadership only',()=>{
 const before=game(),after=fusion(5);
 const event=cinema.observed(before,after).find(e=>e.kind==='fusion');
 assert.equal(event.result.predatorLeader.materials,5);
 const ui=viewModule();
 assert.equal(ui.leader(after.players[0]).uid,after.players[0].field[0].uid);
 const start=JSON.parse(JSON.stringify(after));
 start.predatorImpact={revision:start.revision+1,ownerSeat:0,attackerUid:10,
  targetSeat:1,targetSlot:0,targetArea:'field',followups:2,bonusPct:.13,broken:true};
 start.revision++;
 const effect=ui.analyze(after,start);
 assert.equal(effect[0].kind,'hunt');assert.equal(effect[0].broken,true);
 start.predatorImpact.revision--;
 assert.equal(ui.analyze(after,start).length,0,'outdated events cannot replay');
});
