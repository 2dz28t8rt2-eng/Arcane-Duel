const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

function setup(){
  const CARDS=[
    {id:0,rpg:true,name:'Wächter A',level:8,role:'guardian',atk:800,def:1000},
    {id:1,rpg:true,name:'Wächter B',level:7,role:'guardian',atk:700,def:900},
    {id:2,rpg:true,name:'Predator A',level:2,role:'predator',atk:310,def:100},
    {id:3,rpg:true,name:'Seelenzehrer A',level:2,role:'soul',atk:200,def:250},
    {id:4,rpg:true,name:'Fusion',level:5,fusionOnly:true,atk:600,def:650}
  ];
  const profile={inventory:{0:3,1:3,2:3,3:3,4:1},unlocked:[0,1,2,3],fusionOwned:[4],slots:[],activeSlot:0,
    activeDeck:[],fusionDeck:[4],enhancements:{},upgrades:{power:0}};
  const state={
    window:{localStorage:{getItem:()=>null,setItem:()=>{}},setTimeout:(callback)=>callback()},
    document:{getElementById:()=>null},CARDS,profile,RPG_BASE_CARDS:CARDS.filter(c=>!c.fusionOnly),
    $:()=>null,uiMode:'idle',menuTab:'free',game:null,
    escapeHtml:x=>String(x).replace(/</g,'&lt;'),
    dataOf:c=>CARDS[c.id],
    mainDeckError:d=>d.length===40&&d.every(id=>d.filter(x=>x===id).length<=3)?'':'invalid',
    fusionDeckError:f=>f.length===1?'':'invalid',
    inventoryError:(deck,inventory)=>deck.some(id=>deck.filter(x=>x===id).length>(inventory[id]||0))?'inventory':'',
    rpgRole:id=>({role:CARDS[id].role}),
    prepareHandFusion:()=>true,placePending:()=>null,logEvent:()=>null,showFinished:()=>null,
    renderMenu:()=>null,render:()=>null,OPPONENTS:[],opponentUnlocked:()=>false,
    monsterTrainingBonus:()=>0,createGame:()=>({}),simulateGame:()=>{},
    saveProfile:()=>true,setActiveDeck:()=>true,openModal:()=>{},hideModal:()=>{},toast:()=>{}
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'strategy-evolution-v122.js'),'utf8'),state);
  return {api:state.window.ArcaneStrategyEvolution122,state};
}

test('safe state strips malformed and excessive client metadata',()=>{
  const {api}=setup();
  const state=api.safeState({wish:[2,2,-5,'3',1],fusions:[{result:4,materials:[0,1]}],tips:['fusion','fusion',9],dangers:1});
  assert.deepEqual(Array.from(state.wish),[2,1]);
  assert.equal(state.fusions.length,1);
  assert.deepEqual(Array.from(state.tips),['fusion']);
  assert.equal(state.dangers,false);
});

test('deck optimizer creates a valid one-card substitution and leaves original untouched',()=>{
  const {api,state}=setup();
  const deck=[...Array(3).fill(0),...Array(3).fill(1),...Array(2).fill(2),...Array(2).fill(3)];
  // 40 cards, initially all copies capped at three across a larger genuine collection.
  for(let id=5;id<15;id++){
    state.CARDS.push({id,rpg:true,name:'Wächter '+id,level:8,role:'guardian'});
    state.RPG_BASE_CARDS.push(state.CARDS[id]);
    state.profile.inventory[id]=3;
    state.profile.unlocked.push(id);
    deck.push(id,id,id);
  }
  const plan=api.proposeSwap(deck);
  assert.equal(deck.length,40);
  assert.equal(plan.trial.length,40);
  assert.notDeepEqual(Array.from(plan.trial),deck);
  assert.equal(deck.filter(x=>x===plan.before).length-plan.trial.filter(x=>x===plan.before).length,1);
  assert.equal(plan.trial.filter(x=>x===plan.after).length-deck.filter(x=>x===plan.after).length,1);
});

test('only visible field stats generate vulnerability flags',()=>{
  const {api}=setup();
  const game={mode:'pve',players:[{field:[{id:0,mode:'def'},{id:2,mode:'atk'},null]},
    {field:[{id:1,mode:'atk'},null]}]};
  const threats=Array.from(api.dangerMarkers(game));
  assert.deepEqual(threats,[false,true,false]);
});

test('pivotal moments are real logged entries and returned chronologically',()=>{
  const {api}=setup();
  const events=[{turn:2,entry:'Eine Fusion ausgeführt.'},{turn:5,entry:'Gegenschlag: 100 Schaden.'},
    {turn:4,entry:'Angriff gegen Gegner: 900 Schaden.'},{turn:8,entry:'Duellant 1 gewinnt: Sieg.'}];
  const highlights=Array.from(api.pivotalMoments(events));
  assert.ok(highlights.length>=2);
  assert.ok(highlights.every(h=>events.some(e=>e.entry===h.entry)));
  assert.deepEqual(highlights.map(h=>h.turn),[...highlights.map(h=>h.turn)].sort((a,b)=>a-b));
});

test('archive groups equivalent materials regardless of placement order',()=>{
  const {api}=setup();
  const rows=Array.from(api.archiveRows([{result:4,materials:[0,2],atk:430,def:300,at:1},
    {result:4,materials:[2,0],atk:500,def:270,at:2}]));
  assert.equal(rows.length,1);
  assert.equal(rows[0].count,2);
  assert.equal(rows[0].maxAtk,500);
  assert.equal(rows[0].maxDef,300);
});

test('A/B report makes no positive claim without complete simulations',()=>{
  const {api}=setup();
  assert.match(api.comparisonText({n:0,wins:0},{n:0,wins:0}),/Zu wenige/);
  assert.match(api.comparisonText({n:10,wins:5},{n:10,wins:6}),/dieses Testszenario/);
});
