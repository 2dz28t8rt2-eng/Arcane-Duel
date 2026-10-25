const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
function load(name,context){
  vm.runInNewContext(fs.readFileSync(path.join(root,'assets',name),'utf8'),context,{filename:name});
}
const fakeDocument=()=>({readyState:'loading',addEventListener:()=>{},getElementById:()=>null});

test('level shimmer has four bands and no automatic monster leveling',()=>{
  const context={window:{},document:fakeDocument()};
  load('level-aura-v154.js',context);
  const tier=context.window.ArcaneLevelAura154.tierOf;
  assert.deepEqual(Array.from({length:10},(_,i)=>tier(i+1)),[1,1,1,2,2,2,3,3,4,4]);
  assert.equal(tier(0),0);assert.equal(tier(11),0);
  const card={getAttribute:()=>"5",querySelector:()=>null};
  assert.equal(context.window.ArcaneLevelAura154.levelOf(card),5);
});

function labFixture(){
  const store=new Map();
  const CARDS=[
    {id:0,name:'Mon A',rpg:true,level:3,lineRoot:100},
    {id:1,name:'Mon B',rpg:true,level:3,lineRoot:100},
    {id:2,name:'Mon C',rpg:true,level:2,lineRoot:200},
    {id:3,name:'Mon D',rpg:true,level:1,lineRoot:200},
    {id:4,name:'Mon E',rpg:true,level:4,lineRoot:100},
    {id:5,name:'Ziel',rpg:true,level:4,fusionOnly:true},
    {id:6,name:'Unbekannt',rpg:true,level:5,lineRoot:100}
  ];
  const profile={inventory:{0:2,1:2,2:1,3:1,4:1,5:1},unlocked:[0,1,2,3,4],fusionOwned:[5],
    slots:[{main:[],fusion:[]}],activeSlot:0,activeDeck:[0,1,2,3,4],fusionDeck:[5]};
  const context={CARDS,profile,uiMode:'idle',menuTab:'collection',game:null,window:{
    localStorage:{getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,value)},
    ArcaneFusionRework113:{calculate:levels=>({level:Math.min(10,Math.max(...levels)+1)})}},
    document:fakeDocument(),addCard:id=>{profile.inventory[id]=(profile.inventory[id]||0)+1;return true;},
    renderMenu:()=>null,escapeHtml:value=>String(value),deckDraft:profile.activeDeck,fusionDraft:profile.fusionDeck};
  load('collection-lab-v154.js',context);
  return {context,api:context.window.ArcaneCollectionLab154,store};
}

test('fusion planner uses live rank calculator, real deck copies, and no state mutations',()=>{
  const {context,api}=labFixture();
  const before=JSON.stringify(context.profile);
  const routes=api.fusionRoutes([0,1,2,3,4],5);
  assert.ok(routes.length>0);
  assert.ok(routes.every(route=>route.rank>=4&&route.materials.length>=2));
  assert.ok(routes.some(route=>route.materials.includes(0)&&route.materials.includes(1)));
  assert.equal(JSON.stringify(context.profile),before);
  assert.equal(api.cardCopies([0,1],[3,3,3]),null);
  assert.equal(api.fusionRoutes([3,3,3],999).length,0);
});

test('chronicle dates only new first acquisitions and keeps undiscovered names private',()=>{
  const {context,api}=labFixture();
  assert.equal(Object.keys(api.readFirst()).length,0);
  assert.ok(api.familyProgress().every(f=>f.known.length>0));
  context.addCard(2); // already owned; no falsely backdated first discovery
  assert.equal(Object.keys(api.readFirst()).length,0);
  context.addCard(6); // newly owned
  const first=api.readFirst();
  assert.ok(first[6]>0);
  context.addCard(6);
  assert.equal(api.readFirst()[6],first[6]);
});

test('combat feedback labels measured deltas and identifies proven decay/fatigue',()=>{
  const g={mode:'pve',active:0,turn:8,players:[{field:[{id:0,uid:11,mode:'atk',decayTotal:30,attackFatigue:0}]},
    {field:[{id:1,uid:22,mode:'def'}]}]};
  const context={window:{},document:fakeDocument(),uiMode:'idle',game:null,
    render:()=>null,renderMenu:()=>null,dataOf:c=>({name:'Kreatur '+c.id,atk:150,def:210}),
    effectiveAttack:(_g,c)=>150-(c.decayTotal||0)-(c.attackFatigue||0)};
  load('duel-feedback-v154.js',context);
  const api=context.window.ArcaneDuelFeedback154;
  assert.equal(api.reason({decay:0,fatigue:0,surge:false},{decay:30,fatigue:0,surge:false}),'Zerfall registriert');
  assert.equal(api.reason({decay:0,fatigue:0,surge:false},{decay:0,fatigue:30,surge:false}),'Angriffserschöpfung registriert');
  assert.equal(api.reason({decay:0,fatigue:0,surge:false},{decay:0,fatigue:0,surge:false}),'Kampfwertänderung');
  assert.equal(api.signed(-40),'-40');assert.equal(api.signed(40),'+40');
  const snapshot=JSON.stringify(g),entries=api.extract(g);
  assert.equal(entries.get('mine:11').atk,120);
  assert.equal(entries.get('enemy:22').def,210);
  assert.equal(JSON.stringify(g),snapshot);
});

test('development page loads the cosmetic modules after v15.3 and declares no AI changes',()=>{
  const page=fs.readFileSync(path.join(root,'index.html'),'utf8');
  for(const name of ['level-aura-v154','collection-lab-v154','duel-feedback-v154']){
    assert.match(page,new RegExp('assets/'+name+'\\.css'));
    assert.match(page,new RegExp('assets/'+name+'\\.js'));
    assert.ok(page.indexOf(name+'.js')>page.indexOf('mobile-quality-v153.js'));
  }
});
