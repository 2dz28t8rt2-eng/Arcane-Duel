'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const scripts=['assets/art-engine.js','assets/game.js','assets/expansion.js'].map(p=>fs.readFileSync(path.resolve(__dirname,'..',p),'utf8'));
function boot(){
 const storage=new Map(),nodes=new Map(),el=()=>({innerHTML:'',textContent:'',hidden:false,disabled:false,value:'',style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(){return true}},addEventListener(){},append(){},appendChild(){},insertAdjacentHTML(){},remove(){},click(){},focus(){},querySelector(){return null},querySelectorAll(){return []}});
 const doc={body:el(),getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id)},querySelectorAll(){return []},querySelector(){return null},createElement:el,addEventListener(){}};
 const w={localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v))},crypto:{getRandomValues(a){a[0]=1234567;return a}},location:{reload(){}}};
 const ctx=vm.createContext({window:w,document:doc,console,Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}},setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){}});
 for(const s of scripts)vm.runInContext(s,ctx,{timeout:10000});
 return (fn,timeout=30000)=>JSON.parse(vm.runInContext('JSON.stringify(('+fn.toString()+')())',ctx,{timeout}));
}
test('Progression economy: 10 farm wins per cleared tier and XP thresholds',()=>{
 const run=boot(),out=run(function(){
 profile.trainingWins=3;profile.guideSeen=true;
 const rows=[];let serial=0;
 for(let tier=1;tier<=10;tier++){
  const first=createGame({id:'progress-first-'+(++serial),mode:'pve',opponentId:tier,context:'tournament',seed:serial*1297});
  first.winner=0;const reward=rewardMatch(first);let extra=0,loot=0;
  for(let n=0;n<10;n++){
   const g=createGame({id:'progress-farm-'+(++serial),mode:'pve',opponentId:tier,context:'free',seed:serial*131});
   g.winner=0;const r=rewardMatch(g);extra+=r.coins;if(r.loot?.card!=null)loot++;
  }
  const level=playerLevel(profile),threshold=farmingLevelCap(tier),dropFactor=farmingDropFactor(tier,level);
  rows.push({tier,level,xp:profile.xp,coins:profile.coins,firstCoins:reward.coins,farmCoins:extra,farmCards:loot,dropFactor:+dropFactor.toFixed(2),queued:profile.rewardQueue.length});
 }
 return {rows,lv10xp:levelFloor(10),lv20xp:levelFloor(20),lv30xp:levelFloor(30),saved:validateProfile(JSON.parse(window.localStorage.getItem(SAVE_KEY))).xp===profile.xp};
 },45000);
 assert.equal(out.rows.length,10);
 assert.ok(out.rows.every(x=>Number.isFinite(x.xp)&&Number.isFinite(x.coins)));
 assert.equal(out.saved,true);
 console.log('PROGRESSION_AUDIT '+JSON.stringify(out));
});
test('First-trial scaling: bounded, first attempt only, not repeated after loss',()=>{
 const run=boot(),out=run(function(){
 profile.trainingWins=3;profile.cleared=[];
 const deck=[...RPG_DEFAULT_DECK];
 const g=createGame({id:'trial-scale',mode:'pve',context:'tournament',opponentId:1,deck,flatBonus:2500,seed:917});
 const bonus=g.firstTrialBoost||0;
 profile.tournamentLosses[1]=1;
 const replay=createGame({id:'trial-replay',mode:'pve',context:'tournament',opponentId:1,deck,flatBonus:2500,seed:917});
 return {bonus,replayBonus:replay.firstTrialBoost||0,enemyPower:g.players[1].power,replayPower:replay.players[1].power};
 });
 assert.ok(out.bonus>0&&out.bonus<=.12);
 assert.equal(out.replayBonus,0);
 console.log('FIRST_TRIAL_AUDIT '+JSON.stringify(out));
});
test('Card pack offers empirical rare rate and unique selections',()=>{
 const run=boot(),out=run(function(){
 const rows=[];
 for(let tier=1;tier<=10;tier++){
  let rare=0,duplicates=0,errors=0;
  for(let i=0;i<1000;i++){
   try{const offers=drawCharacterPackOffers({seed:10101+tier*23917+i*19},tier,'easy');
    if(offers.some(id=>CARDS[id].fusionOnly||CARDS[id].manifestOf!=null))rare++;
    if(new Set(offers).size!==3)duplicates++;
   }catch(e){errors++;}
  }
  rows.push({tier,rare,duplicates,errors,expected:+(1000*characterPackRareChance(tier,'easy')).toFixed(1)});
 }
 return rows;
 },45000);
 assert.equal(out.reduce((n,x)=>n+x.errors+x.duplicates,0),0);
 console.log('PACK_RARITY_AUDIT '+JSON.stringify(out));
});

test('Stalled progression: farm first unlocked opponent for 240 wins',()=>{
 const run=boot(),rows=run(function(){
 profile.trainingWins=3;profile.guideSeen=true;profile.cleared=[1];const rows=[];
 for(let n=1;n<=240;n++){
  const g=createGame({id:'stall-farm-'+n,mode:'pve',context:'free',opponentId:1,seed:1234+n*17});g.winner=0;rewardMatch(g);
  if(n%40===0){
   const lv=playerLevel(profile),threshold=farmingLevelCap(1);
   rows.push({wins:n,level:lv,xp:profile.xp,coins:profile.coins,dropFactor:+farmingDropFactor(1,lv).toFixed(2),xpFactor:+farmingXpFactor(1,lv).toFixed(2),packs:profile.packs[packKey(1,'easy')],milestones:profile.milestones.length});
  }
 }
 return rows;
 },45000);
 assert.equal(rows.length,6);
 assert.ok(rows.every(x=>Number.isFinite(x.coins)));
 console.log('STALL_FARM_AUDIT '+JSON.stringify(rows));
});
