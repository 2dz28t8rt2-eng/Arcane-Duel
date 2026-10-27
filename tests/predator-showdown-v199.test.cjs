'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const rules=require('../assets/duo-shared-rules-v160.js');
const cinema=require('../assets/duo-cinema-v170.js');
const snapshot=require('../assets/duo-card-catalog-v160.json');
const catalog=Object.fromEntries(snapshot.cards.map(c=>[c.id,c]));
const base=snapshot.starterMain,fusions=snapshot.starterFusions;
const round10=v=>Math.max(0,Math.round(v/10)*10);
function start(){
 const pending=rules.create({roomId:'leader-duel-v199',hostName:'Hannes',
  hostDeck:base,hostFusions:fusions,enemyDeckA:base,enemyDeckB:base,
  enemyFusionsA:fusions,enemyFusionsB:fusions,catalog,randomSeed:42});
 return rules.apply(pending,2,{type:'join',name:'Partner',deck:base,fusions},{catalog});
}
function makeAlpha(){
 const g=start(),p=g.players[0];p.hand=[9,9,9,9,9];
 const materials=[0,1,2].map(index=>({from:'hand',index}));
 const templateId=rules.fusionOptions(g,0,materials,catalog).templates[0];
 const after=rules.apply(g,0,{type:'fusion',materials,slot:0,templateId},{catalog});
 assert.ok(after.players[0].field[0].predatorLeader);
 assert.equal(after.predatorShowdown,null);
 return after;
}
function replace(seed,consumeOld=false){
 const g=makeAlpha(),p=g.players[0];p.summoned=false;p.hand=[9,9,9];
 p.remainingFusion=[...p.remainingFusion,...fusions];g.rngSeed=seed;
 const materials=consumeOld?
  [{from:'field',index:0},{from:'hand',index:0},{from:'hand',index:1}]:
  [{from:'hand',index:0},{from:'hand',index:1},{from:'hand',index:2}];
 const options=rules.fusionOptions(g,0,materials,catalog);
 assert.equal(options.analysis.role,'predator');
 assert.ok(options.templates.length);
 const after=rules.apply(g,0,{type:'fusion',materials,
  slot:consumeOld?0:1,templateId:options.templates[0]},{catalog});
 return {before:g,after};
}
test('server and client run identical authority for the leadership roll',()=>{
 assert.equal(fs.readFileSync(path.resolve(__dirname,'../assets/duo-shared-rules-v160.js'),'utf8'),
  fs.readFileSync(path.resolve(__dirname,'../supabase/functions/arcane-duo-v2/duo-rules.js'),'utf8'));
});
test('all three outcomes are reachable and 30/20/50 weights are plausible',()=>{
 const cases=new Map(),counts={struggle:0,overthrow:0,stalemate:0};
 for(let seed=1;seed<=400;seed++){
  const {before,after}=replace(seed),event=after.predatorShowdown;
  assert.ok(event);counts[event.outcome]++;
  if(!cases.has(event.outcome))cases.set(event.outcome,{before,after});
 }
 assert.equal(cases.size,3);
 assert.ok(counts.struggle>80&&counts.struggle<165,JSON.stringify(counts));
 assert.ok(counts.overthrow>45&&counts.overthrow<120,JSON.stringify(counts));
 assert.ok(counts.stalemate>155&&counts.stalemate<240,JSON.stringify(counts));
 for(const [outcome,{before,after}]of cases){
  const e=after.predatorShowdown,p=after.players[0],old=p.field[0],next=p.field[1];
  assert.equal(e.seat,0);assert.equal(e.newUid,next.uid);
  assert.equal(e.outcome,outcome);
  assert.ok(next.predatorLeader,'new predator must always wear the crown');
  assert.equal(old?.predatorLeader,undefined,'former leader never remains alpha');
  assert.equal(before.players[0].field[0].predatorLeader.materials,3);
  if(outcome==='struggle'){
   assert.equal(e.penaltyPct,15);
   for(const [now,prior]of [[old,e.old],[next,e.new]]){
    assert.equal(now.atk,round10(prior.atk*.85));
    assert.equal(now.def,round10(prior.def*.85));
    assert.equal(now.maxDef,round10(prior.def*.85));
   }
  }else if(outcome==='overthrow'){
   assert.equal(old,null);assert.equal(e.penaltyPct,0);
   assert.ok(p.graveyard.some(c=>c.uid===e.oldUid));
   assert.equal(next.atk,e.new.atk);assert.equal(next.def,e.new.def);
  }else{
   assert.ok(old);assert.equal(e.penaltyPct,0);
   assert.equal(old.atk,e.old.atk);assert.equal(old.def,e.old.def);
   assert.equal(next.atk,e.new.atk);assert.equal(next.def,e.new.def);
  }
  const event=cinema.observed(before,after).find(x=>x.kind==='fusion');
  assert.equal(event.showdown.outcome,outcome,'cinema only presents committed server roll');
  assert.equal(rules.view(after,2).predatorShowdown.outcome,outcome);
  assert.equal(rules.view(after,2).rngSeed,undefined);
 }
});
test('using the predecessor as material avoids confrontation',()=>{
 const {after}=replace(1103,true);
 assert.equal(after.predatorShowdown,null);
 assert.equal(after.players[0].field.filter(c=>c?.predatorLeader).length,1);
});
test('existing alpha, tokens and fusion cards keep independent roles',()=>{
 const {after}=replace(29);
 const e=after.predatorShowdown;
 assert.ok(['struggle','overthrow','stalemate'].includes(e.outcome));
 assert.equal(after.players[0].field[1].fusion,true);
 assert.equal(after.players[0].field[1].role,'predator');
});
test('solo bridge and cinematic assets parse as standalone scripts',()=>{
 const vm=require('node:vm');
 for(const file of ['predator-showdown-v199.js','predator-showdown-solo-v199.js'])
  assert.ok(new vm.Script(fs.readFileSync(path.resolve(__dirname,'../assets',file),'utf8')));
});
test('solo succession applies each rolled result and shows one visual after fusion',async()=>{
 const vm=require('node:vm');
 const source=fs.readFileSync(path.resolve(__dirname,
  '../assets/predator-showdown-solo-v199.js'),'utf8');
 for(const [roll,outcome]of [[5,'struggle'],[45,'overthrow'],[90,'stalemate']]){
  const old={uid:10,id:9,fusion:true,card:{atk:1200,def:1000,level:3},
   predatorLeader:{bornUid:10,powers:['swarm']}};
  const alpha={uid:11,id:9,fusion:true,card:{atk:2000,def:1500,level:3},
   predatorLeader:{bornUid:11,powers:['mark']}};
  const g={mode:'pve',active:0,turn:3,players:[{field:[old,null],graveyard:[]}]};
  const presentations=[];
  const context={game:g,window:{ArcanePredatorShowdown199:{play:async e=>{
   presentations.push(e.outcome);}}},
   dataOf:c=>({name:'Predator',art:'predator.png',...c.card}),
   placePending:game=>{game.players[0].field[1]=alpha;game.lastSummoned=alpha.uid;
    return {card:alpha};},
   onOwnSlot:async function(){context.placePending(g,1);},
   randomInt:()=>roll,logEvent:()=>{},render:()=>{}};
  vm.runInNewContext(source,context);
  await context.onOwnSlot(1);
  assert.equal(g.predatorShowdown.outcome,outcome);
  assert.deepEqual(presentations,[outcome]);
  assert.equal(alpha.predatorLeader.bornUid,11);
  assert.equal(old.predatorLeader,undefined);
  if(outcome==='struggle'){
   assert.equal(old.card.atk,1020);assert.equal(old.card.def,850);
   assert.equal(alpha.card.atk,1700);assert.equal(alpha.card.def,1280);
  }else if(outcome==='overthrow'){
   assert.equal(g.players[0].field[0],null);
   assert.equal(g.players[0].graveyard.length,1);
  }else assert.equal(g.players[0].field[0],old);
 }
});
