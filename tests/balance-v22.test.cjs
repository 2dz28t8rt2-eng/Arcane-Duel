'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const js=fs.readFileSync(path.resolve(__dirname,'../assets/game.js'),'utf8');
function engine(){
 const map=new Map(),nodes=new Map();const el=()=>({innerHTML:'',textContent:'',hidden:false,disabled:false,value:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return true}},addEventListener(){},click(){},append(){}});
 const doc={body:el(),getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id)},querySelector(){return null},querySelectorAll(){return []},createElement:el,addEventListener(){}};
 const w={localStorage:{getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,String(v))},crypto:{getRandomValues(a){a[0]=70013;return a}}};
 const ctx=vm.createContext({window:w,document:doc,console,setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}}});
 vm.runInContext(js,ctx,{timeout:8000});
 return (fn,timeout=30000)=>JSON.parse(vm.runInContext('JSON.stringify(('+fn.toString()+')())',ctx,{timeout}));
}
test('2.2: 1,000 deterministic PvE duels over all ten tournament opponents',()=>{
 const run=engine();
 const stats=run(function(){
 const stats=[];
 for(let tier=1;tier<=10;tier++){
  let wins=0,losses=0,unfinished=0,turns=0,exceptions=0;
  for(let i=1;i<=100;i++){
   try{
    const progress=tier>1?themedEnemyLoadout(tier-1,'easy'):null;
    const opts={mode:'pve',context:'tournament',opponentId:tier,
      difficulty:i%5===0?'hard':'easy',starter:i%2,seed:100000+tier*1733+i*31};
    if(progress){opts.deck=progress.deck;opts.fusionDeck=progress.fusionDeck;}else{opts.fusionDeck=[...RPG_START_FUSIONS,...RPG_START_FUSIONS,TRAINING_FUSION];opts.flatBonus=35;} // Training III awards a level-5 fusion before the first tournament.
    const g=createGame(opts);
    simulateGame(g,'balanced',RPG_OPPONENTS[tier].policy);
    if(g.winner===0)wins++;else losses++;
    turns+=g.turn;
    if(g.turn>32)unfinished++;
    for(const p of g.players)for(const c of p.field.filter(Boolean)){
      const data=dataOf(c);
      if(!Number.isFinite(data.atk)||!Number.isFinite(data.def)||data.atk<0||data.def<0)throw Error('Invalid combat stats');
    }
   }catch(error){
    exceptions++;
    if(exceptions<3)stats.push({warning:'Tier '+tier+' seed '+i+': '+error.message});
   }
  }
  stats.push({tier,wins,losses,unfinished,exceptions,avgTurns:+(turns/Math.max(1,wins+losses)).toFixed(1)});
 }
 return stats;
 },60000);
 const rows=stats.filter(s=>s.tier);
 assert.equal(rows.length,10);
 assert.equal(rows.reduce((n,s)=>n+s.wins+s.losses+s.exceptions,0),1000);
 for(const row of rows){
  assert.equal(row.exceptions,0,'Tier '+row.tier+' failed '+JSON.stringify(stats.filter(s=>s.warning)));
  assert.equal(row.unfinished,0);
  assert.ok(row.avgTurns>0&&row.avgTurns<=32);
 }
 console.log('2.2 BALANCE_REPORT '+JSON.stringify(rows));
});
test('2.2: duel snapshot keeps decay age and attack fatigue through reload',()=>{
 const run=engine();
 const x=run(function(){
 const g=createGame({mode:'pve',seed:412,opponentId:4,starter:0});
 const c=newInstance(g,RPG_START_FUSIONS[1],0);c.fusion=true;c.decayClass='fusion';c.summonedTurn=g.turn;
 g.players[0].field[0]=c;
 advanceTurn(g);advanceTurn(g);advanceTurn(g);
 const afterFirst={atk:dataOf(c).atk,total:c.decayTotal,age:c.decayAge};
 c.attackFatigue=30;c.card.atk-=30;
 const snap=validateDuelSnapshot(JSON.parse(JSON.stringify(g)));
 const saved=snap.players[0].field[0];
 advanceTurn(snap);advanceTurn(snap);
 return {afterFirst,saved:{age:saved.decayAge,fatigue:saved.attackFatigue,total:saved.decayTotal},nextTotal:saved.decayTotal,nextAge:saved.decayAge};
 });
 assert.equal(x.afterFirst.age,1);assert.equal(x.afterFirst.total,50);
 assert.equal(x.saved.fatigue,30);
 assert.equal(x.nextAge,2);
 assert.equal(x.nextTotal,95);
});
test('2.2: legacy duel snapshots infer decay age from total when field is absent',()=>{
 const run=engine();
 const x=run(function(){
 const g=createGame({mode:'pve',seed:17,opponentId:3,starter:0});
 const c=newInstance(g,RPG_START_FUSIONS[0],0);c.fusion=true;c.decayClass='fusion';
 c.summonedTurn=1;c.decayTotal=135;c.card.atk=Math.max(0,c.card.atk-135);
 g.players[0].field[0]=c;
 const snap=validateDuelSnapshot(JSON.parse(JSON.stringify(g)));
 return {age:snap.players[0].field[0].decayAge,total:snap.players[0].field[0].decayTotal};
 });
 assert.equal(x.age,3);assert.equal(x.total,135);
});
test('2.2: smarter tournament opponent removes a dangerous but killable monster',()=>{
 const run=engine();
 const x=run(function(){
 const g=createGame({mode:'pve',opponentId:5,starter:1,seed:770,context:'tournament'});
 const p=g.players[1],e=g.players[0];
 p.field[0]=newInstance(g,41,1);p.field[0].card.atk=1550;
 e.field[0]=newInstance(g,0,0);e.field[0].card.atk=250;e.field[0].card.def=250;
 e.field[1]=newInstance(g,0,0);e.field[1].card.atk=1350;e.field[1].card.def=800;
 g.turn=5;g.active=1;
 return attackPlan(g);
 });
 assert.equal(x.ai,0);assert.equal(x.di,1);
});
test('2.1: first tournament win refills charges; rematches cannot farm full refills',()=>{
 const run=engine();const x=run(function(){
 profile.guideSeen=true;
 let first=createGame({id:'tournament-first-100',mode:'pve',context:'tournament',opponentId:1,seed:100,starter:0});
 first.winner=0;profile.dropCharges=0;
 const initial=rewardMatch(first),cap=dropChargeCap(),after=profile.dropCharges;
 profile.dropCharges=0;
 let second=createGame({id:'tournament-rematch-101',mode:'pve',context:'tournament',opponentId:1,seed:101,starter:0});
 second.winner=0;const rematch=rewardMatch(second);
 return {initialFirst:initial.first,refilled:initial.refilled,cap,after,rematchFirst:rematch.first,rematchCharge:profile.dropCharges};
 });
 assert.equal(x.initialFirst,true);assert.equal(x.refilled,true);assert.equal(x.after,x.cap);
 assert.equal(x.rematchFirst,false);assert.equal(x.rematchCharge,1);
});

test('2.1: first tournament victory that reaches level 10 refills the new larger charge capacity',()=>{
 const run=engine(),x=run(function(){
 profile.xp=levelFloor(10)-1;
 profile.milestones=[5];
 profile.dropCharges=0;
 const g=createGame({id:'level-10-first-tourney',mode:'pve',context:'tournament',opponentId:1,seed:995,starter:0});
 g.winner=0;
 const result=rewardMatch(g);
 return {first:result.first,refilled:result.refilled,cap:dropChargeCap(),charges:profile.dropCharges,level:playerLevel(profile),ten:profile.milestones.includes(10)};
 });
 assert.equal(x.first,true);assert.equal(x.refilled,true);
 assert.equal(x.ten,true);assert.ok(x.level>=10);assert.equal(x.cap,6);assert.equal(x.charges,x.cap);
});
test('2.2: damage decay is bounded at 20 per round (10 for starters) and attacks cost exactly 30 ATK',()=>{
 const run=engine(),x=run(function(){
 function decay(kind){
  const g=createGame({mode:'pve',opponentId:2,seed:122,starter:0});
  const c=newInstance(g,kind==='fusion'?RPG_START_FUSIONS[1]:kind==='starter'?0:20,0);
  c.decayClass=kind;c.fusion=kind==='fusion';
  c.card.atk=4000;c.card.def=4000;
  c.summonedTurn=1;
  g.players[0].field[0]=c;
  const losses=[];
  for(let i=0;i<8;i++){
   const last=c.decayTotal||0;
   advanceTurn(g);advanceTurn(g);
   losses.push((c.decayTotal||0)-last);
  }
  return losses;
 }
 return {fusion:decay('fusion'),regular:decay('normal'),starter:decay('starter')};
 });
 assert.deepEqual(x.fusion,[0,50,45,40,35,30,25,20]);
 assert.deepEqual(x.regular,[0,30,25,20,20,20,20,20]);
 assert.deepEqual(x.starter,[0,20,15,10,10,10,10,10]);
});
test('2.1: ACE remains separately marked in card, collection and battlefield',()=>{
 const run=engine(),x=run(function(){
 const id=ACE_CARD_IDS[1];
 return {id,ace:CARDS[id].ace,hand:fullCardHtml({id}),board:(()=>{const g=createGame({mode:'pve',starter:0,opponentId:2,seed:1});const c=newInstance(g,id,0);return cardHtml(c,0);})()};
 });
 assert.equal(x.ace,true);
 assert.match(x.hand,/tc-ace/);assert.match(x.hand,/ace-stamp/);
 assert.match(x.board,/tc-ace/);assert.match(x.board,/board-ace-stamp/);
});
