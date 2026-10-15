/* New monster families, one-time specialized fusions and workshop regression.
 * Run: node --test tests/monster-roles-forge.test.cjs
 */
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const filenames=['game.js','expansion.js','evolution.js','learning.js','essence-combat.js','arcane-role-fusions.js','arcane-monster-forge.js'];
function setup(){
 const el=()=>({style:{},dataset:{},innerHTML:'',value:'',disabled:false,hidden:false,
  classList:{contains(){return true},add(){},remove(){},toggle(){}},
  append(){},appendChild(){},addEventListener(){},removeEventListener(){},
  querySelector(){return null},querySelectorAll(){return []},insertAdjacentHTML(){},
  setAttribute(){},getAttribute(){return null}});
 const nodes=new Map(),document={
  getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id);},
  createElement:el,querySelector(){return null},querySelectorAll(){return []},
  addEventListener(){},body:el()
 };
 const memory=new Map(),localStorage={
  getItem(id){return memory.get(id)??null},
  setItem(id,val){memory.set(id,String(val))},removeItem(id){memory.delete(id)}
 };
 const window={localStorage,location:{protocol:'https:',hostname:'isolated.test'},
  matchMedia(){return {matches:true}},addEventListener(){}};
 const scripts=filenames.map(f=>fs.readFileSync(path.join(__dirname,'../assets',f),'utf8')).join('\n;\n');
 const vmContext=vm.createContext({window,document,localStorage,navigator:{},
  setTimeout(){return 0},setInterval(){return 0},clearTimeout(){},clearInterval(){},
  console,Date,Math,JSON,Map,Set,Array,Number,Object,RegExp,String,Error,TypeError,
  Uint32Array,Boolean,Infinity,NaN});
 vm.runInContext(scripts+'\n;globalThis.testGame={profile,CARDS,ARCANE_STAGE_IDS,RPG_BASE_CARDS,RPG_FUSIONS,RPG_OPPONENTS,RPG_DEFAULT_DECK,RPG_START_FUSIONS,UPDATE_B_ACTIVE_IDS,boosterPools,lootPool,rpgEnemyLoadout,mainDeckError,fusionDeckError,cardAvailable,sharedShards,craftCard,rewardMatch,sourceCards,createGame,simulateGame,fusedInstance,newInstance,fusionOptions};',vmContext,{timeout:10000});
 return {g:vmContext.testGame,forge:window.ArcaneMonsterForge,role:window.ArcaneRoleFusion,evolution:window.ArcaneEvolution};
}
test('All 32 workshop families stop at level 10; levels 11/12 remain reserved',()=>{
 const {g}=setup();
 const families=[...new Set([...g.ARCANE_STAGE_IDS.keys()].map(k=>k.split(':')[0]))];
 assert.equal(families.length,32);
 const ids=[...g.ARCANE_STAGE_IDS.values()];
 assert.equal(new Set(ids).size,ids.length);
 for(const root of families){for(let lv=1;lv<=10;lv++)assert.ok(Number.isInteger(g.ARCANE_STAGE_IDS.get(root+':'+lv)),root+' level '+lv);
  for(const lv of [11,12])assert.equal(g.ARCANE_STAGE_IDS.has(root+':'+lv),false,root+' level '+lv+' must be reserved');}
});
test('Tournament limits prevent early Lv7 crafting, then allow reversible conversion',()=>{
 const {g,forge}=setup(),root=0,id1=forge.stage(root,1),id7=forge.stage(root,7);
 assert.equal(forge.levelCap(),4);
 assert.equal(forge.transact('combine',root,7,'1+1+1+1+1+1+1').ok,false);
 g.profile.cleared=[1,2,3,4,5];g.profile.inventory[id1]=12;
 assert.equal(forge.levelCap(),8);
 const before=g.profile.inventory[id1];
 assert.equal(forge.transact('combine',root,7,'1+1+1+1+1+1+1').ok,true);
 assert.equal(g.profile.inventory[id1],before-7);
 assert.equal(g.profile.inventory[id7],1);
 assert.equal(forge.transact('split',root,7,'3+3+1').ok,true);
 assert.equal(g.profile.inventory[id7],0);
 assert.equal(g.profile.inventory[forge.stage(root,3)],2);
 assert.equal(g.profile.inventory[id1],before-6);
});
test('Workshop refuses to consume cards required by active decks',()=>{
 const {g,forge}=setup(),root=0,one=forge.stage(root,1);
 g.profile.cleared=[1,2,3,4,5];
 g.profile.inventory[one]=g.profile.activeDeck.filter(id=>id===one).length;
 assert.equal(forge.transact('combine',root,2,'1+1').ok,false);
});
test('Fusion specialization needs a three-material majority gap',()=>{
 const {role}=setup();
 assert.equal(role.inheritance([{id:1,roleOverride:'guardian'},{id:2,roleOverride:'guardian'},{id:3,roleOverride:'guardian'}]),'guardian');
 assert.equal(role.inheritance([{id:1,roleOverride:'guardian'},{id:2,roleOverride:'guardian'},{id:3,roleOverride:'predator'}]),null);
 assert.equal(role.inheritance([{id:1,roleOverride:'predator'},{id:2,roleOverride:'predator'},{id:3,roleOverride:'predator'}]),'predator');
});
test('Soul awakening probability is below 75 percent or capped',()=>{
 const {role,g}=setup();
 const cards=g.RPG_BASE_CARDS.filter(c=>c.level>=1&&!c.fusionOnly).slice(0,5).map(c=>({id:c.id,card:{level:12}}));
 assert.ok(role.soulOdds(cards)<=.75);
 assert.ok(role.soulOdds(cards)>=.20);
});
test('Real game applies defender fusion to INSTANCE, not to card template',()=>{
 const {g}=setup();
 const duel=g.createGame({mode:'pve',context:'free',opponentId:1,seed:40991,
  deck:g.RPG_DEFAULT_DECK,fusionDeck:g.RPG_START_FUSIONS});
 const cards=[0,1,13].map(id=>g.newInstance(duel,id,0));
 assert.ok(g.fusionOptions(duel,cards.map(c=>c.card.level)).length);
 const result=g.fusedInstance(duel,cards,cards.map(c=>c.card.level));
 assert.ok(result);
 assert.ok(['guardian','soul'].includes(result.roleOverride));
 assert.equal(g.CARDS[result.id].roleOverride,undefined);
 assert.ok(result.card.def>0&&result.card.atk>0);
});
test('Actual game runs 40 seeded duels with new role rules and no deadlocks',()=>{
 const {g}=setup();
 for(let i=0;i<40;i++){
  const duel=g.createGame({mode:'pve',context:'free',opponentId:1+(i%10),
   seed:81913+i*31,deck:g.RPG_DEFAULT_DECK,fusionDeck:g.RPG_START_FUSIONS});
  assert.doesNotThrow(()=>g.simulateGame(duel));
  assert.ok(duel.winner===0||duel.winner===1);
  for(const p of duel.players)assert.ok(p.lp>=0&&p.lp<=duel.maxLP);
 }
});

test('Tournament opponents and every playable deck stop at Lv10 in easy and hard mode',()=>{
 const {g}=setup();
 assert.equal(g.RPG_OPPONENTS.length,11);
 for(const opponent of g.RPG_OPPONENTS){
  assert.ok(opponent.level<=10,'tournament opponent '+opponent.id);
  for(const difficulty of ['easy','hard']){
   const load=g.rpgEnemyLoadout(opponent.id,difficulty);
   assert.equal(g.mainDeckError(load.deck),'',opponent.id+' '+difficulty+' main');
   assert.equal(g.fusionDeckError(load.fusionDeck),'',opponent.id+' '+difficulty+' fusion');
   for(const id of [...load.deck,...load.fusionDeck])assert.ok(g.CARDS[id].level<=10,'NPC '+opponent.id+' '+difficulty+' card '+id);
  }
 }
});
test('Reserved Lv11/12 are absent from shop, card pool, workshop and loot',()=>{
 const {g,forge}=setup();
 const active=g.UPDATE_B_ACTIVE_IDS;
 assert.ok(active.length>=128);
 assert.ok(active.every(id=>g.CARDS[id].level<=10));
 assert.ok(g.RPG_BASE_CARDS.every(c=>c.level<=10));
 assert.ok(g.RPG_FUSIONS.every(c=>c.level<=10));
 const hidden=g.CARDS.filter(c=>c.level===11||c.level===12);
 assert.ok(hidden.length>=64,'technical card IDs are reserved for a future update');
 assert.ok(hidden.every(c=>c.retired&&c.workshopOnly));
 assert.ok(hidden.every(c=>!active.includes(c.id)&&!g.cardAvailable(c.id)));
 for(let tier=0;tier<=10;tier++){
  const pools=g.boosterPools(tier);
  for(const pool of Object.values(pools))assert.ok(pool.every(id=>g.CARDS[id].level<=10),'booster '+tier);
  for(const mode of ['easy','hard'])assert.ok(g.lootPool(tier,mode).every(id=>g.CARDS[id].level<=10),'loot '+tier);
 }
 const root=Number([...g.ARCANE_STAGE_IDS.keys()][0].split(':')[0]);
 assert.equal(forge.stage(root,11),undefined);
 assert.equal(forge.stage(root,12),undefined);
 assert.equal(forge.transact('combine',root,11,'1+1+1+1+1+1+1+1+1+1+1').ok,false);
 const invalidDeck=[...g.profile.activeDeck];invalidDeck[0]=hidden[0].id;
 assert.notEqual(g.mainDeckError(invalidDeck,[...g.profile.unlocked,hidden[0].id]),'');
 assert.notEqual(g.fusionDeckError([hidden[0].id,hidden[0].id]),'');
});

test('Lv10 tournament strategy comparison: predator, guardian/soul and fusion against VIII–X',()=>{
 const {g}=setup();
 // Diagnostic only: deliberately strong synthetic decks, NOT an economically
 // simulated player inventory or a prediction of human win probability.
 const main=g.RPG_BASE_CARDS.filter(c=>!c.retired&&!c.essenceMonster&&!c.ace&&!c.fusionOnly&&c.level<=10);
 const fusionPool=g.RPG_FUSIONS.filter(c=>!c.retired&&c.level<=10&&c.fusionOnly)
  .sort((a,b)=>b.level-a.level||b.atk-a.atk);
 // Include low/mid and high fusion levels. A late-only stock mislabels a deck as
 // fusion-focused even though its opening material combinations cannot fuse.
 const bridges=[2,4,5,6,7,8,9,10].map(lv=>fusionPool.find(c=>c.level===lv)?.id).filter(id=>id!==undefined);
 const fusionDeck=[...new Set([...bridges,...fusionPool.map(c=>c.id)])].slice(0,15);
 const archetypes=[
  {name:'predator',roles:['predator'],policy:'offensive',sort:(a,b)=>b.atk-a.atk||b.level-a.level},
  {name:'guardian-soul',roles:['guardian','soul'],policy:'guardian',sort:(a,b)=>b.def-a.def||b.level-a.level},
  {name:'fusion-focused',roles:[],policy:'balanced',sort:(a,b)=>a.level-b.level||b.atk-a.atk}
 ];
 const summary=[];
 for(const archetype of archetypes){
  let options;
  if(archetype.name==='fusion-focused'){
   // Two creatures for each low/mid level, plus high-level finishers.
   options=[...Array.from({length:6},(_,i)=>i+1).flatMap(lv=>main.filter(c=>c.level===lv).sort((a,b)=>b.atk+b.def-a.atk-a.def).slice(0,2)),
    ...main.filter(c=>c.level===10).sort((a,b)=>b.atk+b.def-a.atk-a.def).slice(0,2)];
  }else options=main.filter(c=>archetype.roles.includes(c.role)).sort(archetype.sort).slice(0,14);
  assert.ok(options.length>=14,archetype.name+' must have 14 distinct cards');
  const deck=options.slice(0,14).flatMap(c=>[c.id,c.id,c.id]).slice(0,40);
  assert.equal(deck.length,40);
  assert.ok(deck.every(id=>g.CARDS[id].level<=10));
  for(const opponentId of [8,9,10]){
   let wins=0,turns=0,fusions=0;
   for(let trial=0;trial<24;trial++){
    g.profile.cleared=Array.from({length:opponentId-1},(_,i)=>i+1);
    const duel=g.createGame({mode:'pve',context:'tournament',opponentId,
     seed:75001+opponentId*499+trial*313,deck,fusionDeck});
    g.simulateGame(duel,archetype.policy);
    assert.ok(duel.winner===0||duel.winner===1,'duel must finish');
    assert.ok(duel.players.flatMap(p=>p.originalDeck.concat(p.fusionDeck)).every(id=>g.CARDS[id].level<=10),'all battle decks capped');
    wins+=Number(duel.winner===0);turns+=duel.turn;fusions+=duel.totalFusions[0];
   }
   summary.push({archetype:archetype.name,opponentId,samples:24,wins,
    winPercent:Math.round(100*wins/24),meanHalfTurns:+(turns/24).toFixed(1),
    meanFusions:+(fusions/24).toFixed(1)});
  }
 }
 console.log('LEVEL10_SYNTHETIC_STRATEGY_DIAGNOSTIC '+JSON.stringify(summary));
 assert.equal(summary.length,9);
});


test('Grand straight is awarded for Lv1+2+3+4, with greater reward for five cards',()=>{
 const {evolution}=setup();
 const four=evolution.fusionPattern([1,2,3,4]),five=evolution.fusionPattern([1,2,3,4,5]),three=evolution.fusionPattern([1,2,3]);
 assert.equal(three.name,'Kleine Straße');
 assert.equal(four.name,'Große Straße');
 assert.equal(five.name,'Große Straße');
 assert.ok(five.qualityBonus>four.qualityBonus);
 assert.ok(four.qualityBonus>three.qualityBonus);
});
test('Common shards can be spent across formerly separate opponent banks',()=>{
 const {g}=setup();
 g.profile.shards=Array(11).fill(0);
 g.profile.shards[1]=18;g.profile.shards[2]=12;g.profile.coins=999999;
 const c=g.CARDS.find(c=>c.rpg&&!c.fusionOnly&&!c.essenceMonster&&!c.ace&&c.source===0&&g.cardAvailable(c.id));
 assert.ok(c,'requires an obtainable source-0 card');
 const before=g.profile.inventory[c.id]||0;
 assert.equal(g.sharedShards(),30);
 assert.equal(g.craftCard(c.id),true);
 assert.equal(g.sharedShards(),0);
 assert.equal(g.profile.inventory[c.id],before+1);
});
test('A conceded tournament duel appears as an actual loss in the persistent match chronicle',()=>{
 const {g}=setup();
 const duel=g.createGame({mode:'pve',opponentId:1,context:'tournament',seed:49019});
 duel.surrendered=true;duel.winner=1;duel.winReason='Aufgegeben';
 const before=g.profile.losses;
 const reward=g.rewardMatch(duel);
 assert.ok(reward.surrendered);
 assert.equal(g.profile.losses,before+1);
 assert.equal(g.profile.history[0].win,false);
 assert.equal(g.profile.history[0].opponent,1);
 assert.equal(g.profile.history[0].context,'tournament');
 assert.equal(g.profile.history[0].coins,0);
});
test('Unowned fusion cards remain discoverable elsewhere but are not in the fusion deck editor',()=>{
 const {g}=setup();
 const cards=g.sourceCards(true);
 assert.ok(cards.length>=2);
 assert.ok(cards.every(c=>(g.profile.inventory[c.id]||0)>0));
 assert.ok(g.RPG_FUSIONS.some(c=>(g.profile.inventory[c.id]||0)===0),'unowned cards exist');
});
