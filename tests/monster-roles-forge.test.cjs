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
 vm.runInContext(scripts+'\n;globalThis.testGame={profile,CARDS,ARCANE_STAGE_IDS,RPG_BASE_CARDS,RPG_FUSIONS,RPG_OPPONENTS,RPG_DEFAULT_DECK,RPG_START_FUSIONS,UPDATE_B_ACTIVE_IDS,boosterPools,lootPool,rpgEnemyLoadout,mainDeckError,fusionDeckError,cardAvailable,sharedShards,craftCard,rewardMatch,sourceCards,createGame,simulateGame,fusedInstance,newInstance,fusionOptions,baseStat,normalRoleBonus,profileCard,UPGRADES,buyUpgrade,upgradeCost,validateProfile,workshopBudget,attack,dataOf,strongestMainDeck,validateDuelSnapshot};',vmContext,{timeout:10000});
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
test('Role inheritance from two matching cards prevents unrelated fusion tags',()=>{
 const {role}=setup();
 assert.equal(role.inheritance([{id:1,roleOverride:'guardian'},{id:2,roleOverride:'guardian'},{id:3,roleOverride:'guardian'}]),'guardian');
 assert.equal(role.inheritance([{id:1,roleOverride:'guardian'},{id:2,roleOverride:'guardian'},{id:3,roleOverride:'predator'}]),'guardian');
 assert.equal(role.inheritance([{id:1,roleOverride:'guardian'},{id:2,roleOverride:'guardian'}]),'guardian');
 assert.equal(role.inheritance([{id:1,roleOverride:'soul'},{id:2,roleOverride:'soul'}]),'soul');
 assert.equal(role.inheritance([{id:1,roleOverride:'predator'},{id:2,roleOverride:'predator'}]),'predator');
 assert.equal(role.inheritance([{id:1,roleOverride:'guardian'},{id:2,roleOverride:'predator'}]),'resonator');
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
 g.profile.cleared=[1]; // Open a genuinely ordinary recipe; tier-0 cards are training-only.
 g.profile.shards[1]=6;g.profile.shards[2]=4;g.profile.coins=999999;
 const c=g.CARDS.find(c=>c.rpg&&!c.fusionOnly&&!c.essenceMonster&&!c.ace&&
  !c.trainingReward&&!c.workshopOnly&&!c.questOnly&&!c.lv1Exclusive&&
  !c.fateOnly&&!c.milestoneOnly&&!c.enemyOnly&&c.source===1&&c.level<=3&&
  g.cardAvailable(c.id));
 assert.ok(c,'requires an obtainable level-1-to-3 normal card');
 const before=g.profile.inventory[c.id]||0;
 assert.equal(g.sharedShards(),10);
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

test('No legacy single-card monster matchup bonuses remain in the playable catalog',()=>{
 const {g}=setup();
 const removed=new Set(['aegis','pierce','hunt','guide','rush','guard']);
 const oldAbilities=[...g.RPG_BASE_CARDS,...g.RPG_FUSIONS]
  .filter(c=>c.level<=10&&!c.retired&&removed.has(c.ability))
  .map(c=>({name:c.name,ability:c.ability}));
 assert.deepEqual(oldAbilities,[],'legacy PvE bonuses should not survive in playable cards');
});

test('Workshop splits a free level-seven card without requiring a manually typed recipe',()=>{
 const {g,forge}=setup(),root=0,id7=forge.stage(root,7),id3=forge.stage(root,3),id4=forge.stage(root,4);
 g.profile.cleared=[1,2,3,4,5];
 g.profile.inventory[id7]=(g.profile.inventory[id7]||0)+1;
 const before3=g.profile.inventory[id3]||0,before4=g.profile.inventory[id4]||0;
 const result=forge.transact('split',root,7,'');
 assert.equal(result.ok,true,result.message);
 assert.equal(g.profile.inventory[id3],before3+1);
 assert.equal(g.profile.inventory[id4],before4+1);
 assert.equal(g.profile.inventory[id7],0);
});

test('Fusion reference is the midpoint of ordinary monster stat potentials at every unlocked level',()=>{
 const {g,evolution}=setup();
 const workshopIds=[...g.ARCANE_STAGE_IDS.values()];
 for(let level=2;level<=10;level++){
  const normals=workshopIds.map(id=>g.CARDS[id]).filter(c=>c.level===level&&!c.retired);
  assert.ok(normals.length>=22,'ordinary comparison pool for level '+level);
  const reference=evolution.fusionReferenceStats(level);
  for(const stat of ['atk','def']){
   const values=normals.map(c=>c[stat]);
   const expected=Math.round(((Math.min(...values)+Math.max(...values))/2)/10)*10;
   assert.equal(reference[stat],expected,stat+' level '+level);
   assert.ok(reference[stat]>=Math.min(...values)&&reference[stat]<=Math.max(...values));
  }
 }
});
test('Fusion no longer inherits a guaranteed 95% of an overpowered material',()=>{
 const {g,evolution}=setup(),duel=g.createGame({mode:'pve',context:'free',opponentId:1,seed:71991,
  deck:g.RPG_DEFAULT_DECK,fusionDeck:g.RPG_START_FUSIONS});
 const materials=[0,1].map(id=>g.newInstance(duel,id,0));
 for(const c of materials){c.card.atk=9000;c.card.def=9000;}
 const levels=materials.map(c=>c.card.level),fused=g.fusedInstance(duel,materials,levels);
 assert.ok(fused,'the existing fusion template is selectable');
 const ref=evolution.fusionReferenceStats(fused.card.level);
 assert.ok(fused.card.atk<ref.atk*2&&fused.card.def<ref.def*2,
  'result uses normal-monster potential, not the strongest inflated material');
 assert.ok(fused.card.atk<9000&&fused.card.def<9000);
});
test('Ordinary 2-material fusion may roll below the normal level reference',()=>{
 let weaker=false,stronger=false;
 for(let seed=100;seed<160;seed++){
  const {g,evolution}=setup(),duel=g.createGame({mode:'pve',context:'free',opponentId:1,seed,starter:0,
   deck:g.RPG_DEFAULT_DECK,fusionDeck:g.RPG_START_FUSIONS});
  const cards=[0,1].map(id=>g.newInstance(duel,id,0));
  const fused=g.fusedInstance(duel,cards,cards.map(c=>c.card.level));
  assert.ok(fused);
  // Measure downside/upside against the role-adjusted reference before actual dice.
  const base=fused.rollMath.base,rolled=fused.rollMath.winner;
  weaker||=rolled.atk+rolled.def<base.atk+base.def;
  stronger||=rolled.atk+rolled.def>base.atk+base.def;
  if(weaker&&stronger)break;
 }
 assert.ok(weaker,'some fusion rolls should have a real downside');
 assert.ok(stronger,'some fusion rolls should create a useful upside');
});

test('Defenders have 9% extra base DEF and normal high-level bonus, without buffing Fusion 3.1 reference',()=>{
 const {g,evolution}=setup();
 for(const level of [2,4,6,8,10]){
  const normal=[...g.ARCANE_STAGE_IDS.values()].map(id=>g.CARDS[id]);
  const guardian=normal.find(c=>c.level===level&&c.role==='guardian');
  const soul=normal.find(c=>c.level===level&&c.role==='soul');
  const predator=normal.find(c=>c.level===level&&c.role==='predator');
  for(const defender of [guardian,soul]){
   assert.ok(defender,'a defender at level '+level);
   const budget=g.workshopBudget(level);
   const expected=Math.round(budget*.09/10)*10+(level>=6?20*(level-5):0);
   assert.equal(g.normalRoleBonus(defender,'def',1),expected,'defense '+defender.role+' '+level);
   assert.equal(g.normalRoleBonus(defender,'atk',1),level>=6?20*(level-5):0);
   assert.equal(g.normalRoleBonus(defender,'def',0),expected,'unperked player and NPC same baseline');
  }
  assert.equal(g.normalRoleBonus(predator,'def',1),level>=6?20*(level-5):0);
  const ref=evolution.fusionReferenceStats(level);
  assert.ok(ref.atk>0&&ref.def>0);
  assert.equal(g.normalRoleBonus({rpg:true,fusionOnly:true,role:'guardian',level},'def',0),0);
 }
});
test('Jagdinstinkt and Schildwall apply 80/20 level scaling for both stats, max five ranks',()=>{
 const {g}=setup();
 const level=10;
 const cards=[...g.ARCANE_STAGE_IDS.values()].map(id=>g.CARDS[id]);
 const predator=cards.find(c=>c.level===level&&c.role==='predator');
 const guardian=cards.find(c=>c.level===level&&c.role==='guardian');
 const soul=cards.find(c=>c.level===level&&c.role==='soul');
 const base=p=>g.normalRoleBonus(p,'atk',1),def=p=>g.normalRoleBonus(p,'def',1);
 g.profile.upgrades.jagdinstinkt=5;g.profile.upgrades.schildwall=5;
 assert.equal(g.normalRoleBonus(predator,'atk',0)-base(predator),5*(15+8*level));
 assert.equal(g.normalRoleBonus(predator,'def',0)-def(predator),5*(5+2*level));
 for(const c of [guardian,soul]){
  assert.equal(g.normalRoleBonus(c,'atk',0)-base(c),5*(5+2*level));
  assert.equal(g.normalRoleBonus(c,'def',0)-def(c),5*(20+8*level));
 }
 const fakeFusion={...predator,fusionOnly:true};
 assert.equal(g.normalRoleBonus(fakeFusion,'atk',0),0);
 assert.equal(g.normalRoleBonus(fakeFusion,'def',0),0);
});
test('Global training caps at 110 and new class ranks have real upgrade costs and save validation',()=>{
 const {g}=setup();
 assert.equal(g.UPGRADES.jagdinstinkt.max,5);
 assert.equal(g.UPGRADES.schildwall.max,5);
 const p=g.profile;
 assert.equal(p.upgrades.jagdinstinkt,0);assert.equal(p.upgrades.schildwall,0);
 const copy=JSON.parse(JSON.stringify(p));
 copy.upgrades.power=10;
 const validated=g.validateProfile(copy);
 assert.ok(validated);
 const atk=g.CARDS.find(c=>c.role==='predator'&&!c.fusionOnly&&c.rpg);
 const before=g.baseStat(atk,'atk',{id:0,power:1,enhancements:{},flatBonus:110});
 assert.ok(before>=atk.atk+110);
 p.coins=10000;
 const price=g.upgradeCost('schildwall');assert.ok(price>0);
 assert.equal(g.buyUpgrade('schildwall'),true);
 assert.equal(p.upgrades.schildwall,1);
 assert.equal(p.coins,10000-price);
 const roundtrip=g.validateProfile(JSON.parse(JSON.stringify(p)));
 assert.equal(roundtrip.upgrades.schildwall,1);
});
test('Legacy power purchase receives one-time 40% compensation, no second refund after saving',()=>{
 const {g}=setup();
 const raw=JSON.parse(JSON.stringify(g.profile));
 raw.upgrades.power=3;raw.coins=100;delete raw.specializationRebalance;
 delete raw.upgrades.schildwall;delete raw.upgrades.jagdinstinkt;
 const loaded=g.validateProfile(raw);
 assert.equal(loaded.upgrades.schildwall,0);
 assert.equal(loaded.upgrades.jagdinstinkt,0);
 const spent=[120,180,270].reduce((a,b)=>a+b,0);
 assert.equal(loaded.coins,100+Math.floor(spent*.4));
 assert.equal(loaded.specializationRebalance,true);
 const second=g.validateProfile(JSON.parse(JSON.stringify(loaded)));
 assert.equal(second.coins,loaded.coins);
});

test('Gegenschlag uses half the actual defender ATK, including bonus and battle fatigue',()=>{
 const {g}=setup();
 const ids=[...g.ARCANE_STAGE_IDS.values()];
 const predator=ids.find(id=>g.CARDS[id].level===6&&g.CARDS[id].role==='predator');
 const guard=ids.find(id=>g.CARDS[id].level===6&&g.CARDS[id].role==='guardian');
 assert.ok(predator!==undefined&&guard!==undefined);
 g.profile.upgrades.schildwall=5;
 const duel=g.createGame({mode:'pve',context:'free',opponentId:4,seed:213314,
  deck:g.RPG_DEFAULT_DECK,fusionDeck:g.RPG_START_FUSIONS});
 duel.players[0].field[0]=g.newInstance(duel,guard,0);
 duel.players[1].field[0]=g.newInstance(duel,predator,1);
 duel.players[0].field[0].mode='def';duel.turn=2;duel.active=1;duel.players[1].shield=0;
 const defender=duel.players[0].field[0],predatorInst=duel.players[1].field[0];
 const expectedAtk=defender.card.atk;
 defender.card.atk=Math.max(0,expectedAtk-60); // accumulated battle wear
 const expectedCounter=Math.floor(defender.card.atk/2);
 const before=duel.players[1].lp;
 assert.ok(g.attack(duel,0,0),'attack should resolve');
 assert.equal(before-duel.players[1].lp,expectedCounter,'counter uses live ATK, not source card');
 assert.notEqual(expectedCounter,Math.floor(g.CARDS[guard].atk/2));
});

test('Neutral auto-equip remains consistent when optional role perks are purchased',()=>{
 const {g}=setup();
 const ids=[...g.ARCANE_STAGE_IDS.values()]
  .filter(id=>[6,7,8,9,10].includes(g.CARDS[id].level)&&
   ['predator','guardian','soul'].includes(g.CARDS[id].role));
 const inventory=Object.fromEntries(ids.map(id=>[id,3]));
 assert.ok(ids.length>=40);
 g.profile.upgrades.jagdinstinkt=0;g.profile.upgrades.schildwall=0;
 const baseline=g.strongestMainDeck(ids,{},inventory);
 assert.equal(baseline.length,40);
 for(const perk of ['jagdinstinkt','schildwall']){
  g.profile.upgrades[perk]=5;
  const proposed=g.strongestMainDeck(ids,{},inventory);
  assert.deepEqual(proposed,baseline,'auto-selection does not force specialist role composition');
  assert.ok(proposed.every(id=>g.CARDS[id].level<=10));
  g.profile.upgrades[perk]=0;
 }
});

test('Imprinted fusion chooses role before rolling and displays exact best-roll math',()=>{
 const {g}=setup();
 const duel=g.createGame({mode:'pve',context:'free',opponentId:4,seed:711333,
  deck:g.RPG_DEFAULT_DECK,fusionDeck:g.RPG_START_FUSIONS});
 const materials=[0,1,13].map(id=>g.newInstance(duel,id,0));
 const result=g.fusedInstance(duel,materials,materials.map(c=>c.card.level));
 assert.ok(result);
 assert.ok(['guardian','soul'].includes(result.roleOverride));
 assert.equal(result.roleOrigin,'material');
 const calculation=result.rollMath;
 assert.ok(calculation&&Number.isInteger(calculation.winnerIndex));
 assert.equal(calculation.role,result.roleOverride);
 assert.equal(calculation.roleWeights.atk,.75);
 assert.equal(calculation.roleWeights.def,1.35);
 const best=result.rollTrace[calculation.winnerIndex];
 assert.ok(result.rollTrace.length>=1&&result.rollTrace.length<=7);
 assert.equal(best.atk+best.def,Math.max(...result.rollTrace.map(x=>x.atk+x.def)));
 for(const stat of ['atk','def']){
  const expected=Math.max(0,best[stat]+calculation.bonus[stat]-calculation.penalty);
  assert.equal(result.card[stat],expected,'arithmetic for '+stat);
  assert.equal(calculation.final[stat],expected);
 }
});
test('Imprinted role and bounded fusion math survive actual saved duel reload',()=>{
 const {g}=setup();
 const duel=g.createGame({mode:'pve',context:'free',opponentId:4,seed:712434,
  deck:g.RPG_DEFAULT_DECK,fusionDeck:g.RPG_START_FUSIONS});
 const materials=[0,1,13].map(id=>g.newInstance(duel,id,0));
 const result=g.fusedInstance(duel,materials,materials.map(c=>c.card.level));
 assert.ok(result?.roleOverride);
 duel.players[0].field[0]=result;duel.nextUid+=1;
 const saved=JSON.parse(JSON.stringify(duel));
 const restored=g.validateDuelSnapshot(saved);
 assert.equal(restored.players[0].field[0].roleOverride,result.roleOverride);
 assert.deepEqual(JSON.parse(JSON.stringify(restored.players[0].field[0].rollMath.final)),
  JSON.parse(JSON.stringify(result.rollMath.final)));
 assert.equal(restored.players[0].field[0].rollTrace.length,result.rollTrace.length);
});
test('Cinematic assets animate role stamps, real rolls and final math instead of inventing data',()=>{
 const entry=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 const scene=fs.readFileSync(path.join(__dirname,'../assets/evolution.js'),'utf8');
 const css=fs.readFileSync(path.join(__dirname,'../assets/fusion-stamp.css'),'utf8');
 assert.match(entry,/assets\/fusion-stamp\.css/);
 assert.match(scene,/winnerIndex/);assert.match(scene,/rollTrace/);
 assert.match(scene,/evo-stamp-impact/);assert.match(scene,/evo-calc-absorb/);
 assert.match(css,/@keyframes evo-role-impact/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
