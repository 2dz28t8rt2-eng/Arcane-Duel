'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const names=['art-engine.js','game.js','expansion.js','evolution.js','learning.js','essence-combat.js','arcane-role-fusions.js','arcane-monster-forge.js'];
const source=names.map(n=>fs.readFileSync(path.join(__dirname,'../assets',n),'utf8')).join('\n;\n');
const sim=String.raw;
function boot(){
 const nodes=new Map(),storage=new Map();
 const el=()=>({innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,style:{},dataset:{},
  classList:{add(){},remove(){},toggle(){},contains(){return false}},append(){},appendChild(){},remove(){},
  addEventListener(){},removeEventListener(){},insertAdjacentHTML(){},setAttribute(){},
  querySelector(){return null},querySelectorAll(){return []}});
 const document={body:el(),getElementById(id){if(!nodes.has(id))nodes.set(id,el());return nodes.get(id)},
  createElement:el,querySelector(){return null},querySelectorAll(){return []},addEventListener(){}};
 const localStorage={getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)};
 const window={localStorage,location:{hostname:'isolated.test',protocol:'https:'},innerWidth:1200,
  matchMedia(){return {matches:true}},addEventListener(){},crypto:{getRandomValues(a){a[0]=12345;return a}}};
 const ctx=vm.createContext({window,document,localStorage,navigator:{},console,Date,Math,JSON,
  setTimeout(){},clearTimeout(){},setInterval(){},clearInterval(){},Map,Set,Array,Number,Object,
  String,RegExp,Error,TypeError,Uint32Array,Boolean,Infinity,NaN});
 vm.runInContext(source+'\n;'+analysis+'\n;globalThis.audit=inventoryProgression;',ctx,{timeout:30000});
 return ctx;
}
const analysis="\nfunction inventoryProgression(seed,policy,plan,cap=12){\n profile.guideSeen=true;\n const f=window.ArcaneMonsterForge;\n const out={seed,policy,plan,training:0,duels:0,wins:0,losses:0,farm:0,cleared:0,\n  highestCard:0,firstTen:null,boosters:0,crafts:0,forge:0,upgrade:0,milestones:0,\n  stages:[],error:null,quests:0,packCards:0};\n let serial=0;\n const levelMax=()=>Math.max(0,...Object.keys(profile.inventory).map(Number)\n  .filter(id=>profile.inventory[id]>0&&!CARDS[id]?.fusionOnly&&!CARDS[id]?.essenceMonster).map(id=>CARDS[id].level));\n function milestones(){\n  for(let i=0;i<10&&profile.rewardQueue.length;i++){\n   const q=profile.rewardQueue[0],best=q.cards?.length?[...q.cards].sort((a,b)=>CARDS[b].level-CARDS[a].level||CARDS[b].atk-CARDS[a].atk)[0]:null;\n   if(!finishMilestone(best))throw Error('milestone cannot be consumed');\n   out.milestones++;\n  }\n }\n function prepare(){\n  milestones();\n  if(cap>12){\n   for(const entry of [...(profile.evolution?.active||[])]){\n    const task=quests.find(x=>x.id===entry.id);\n    if(task&&entry.progress>=task.target&&claimQuest(entry.id))out.quests++;\n   }\n   for(let source=0;source<=Math.max(0,...profile.cleared);source++){\n    if(profile.packs[packKey(source,'easy')]>0&&openCharacterPack(source,'easy')){\n     const choices=profile.openPack.cards;\n     const preferred=[...choices].sort((a,b)=>(CARDS[b].atk+CARDS[b].def)-(CARDS[a].atk+CARDS[a].def))[0];\n     if(takePackCard(choices.indexOf(preferred))){out.packCards++;closeCharacterPack();}\n    }\n   }\n  }\n  if(plan==='invest'){\n   const tier=Math.max(0,...profile.cleared);\n   if(out.duels%4===0&&profile.coins>=boosterPrice(tier,5)+60){\n    if(buyBooster(5))out.boosters++;\n   }\n   if(out.duels%6===0){\n    for(const key of ['power','starter','learning']){\n     if(UPGRADES[key]&&profile.coins>=upgradeCost(key)+100&&buyUpgrade(key)){out.upgrade++;break;}\n    }\n   }\n   if(out.duels%5===0){\n    const pool=CARDS.filter(c=>c.rpg&&!c.retired&&!c.workshopOnly&&!c.ace&&!c.essenceMonster&&!c.fusionOnly\n      &&c.source>=0&&c.source<=tier&&c.level<=10&&cardAvailable(c.id)\n      &&profile.shards[c.source]>=20&&profile.coins>=cardCost(c.id)+60)\n      .sort((a,b)=>b.level-a.level||(b.atk+b.def)-(a.atk+a.def));\n    if(pool.length&&craftCard(pool[0].id))out.crafts++;\n   }\n   if(out.duels%7===0){\n    let done=false;\n    for(let lv=f.levelCap();lv>=2&&!done;lv--){\n     for(const root of [...new Set([...ARCANE_STAGE_IDS.keys()].map(s=>Number(s.split(':')[0])))]){\n      const parts=f.findComposition(root,lv);\n      if(parts?.length>=2&&f.transact('combine',root,lv,parts.join('+')).ok){out.forge++;done=true;break;}\n     }\n    }\n   }\n  }else if(out.duels%8===0){\n   const tier=Math.max(0,...profile.cleared);\n   if(profile.coins>=boosterPrice(tier,3)+150&&buyBooster(3))out.boosters++;\n  }\n  equipBest();\n  out.highestCard=Math.max(out.highestCard,levelMax());\n  if(out.firstTen===null&&out.highestCard>=10)out.firstTen={at:out.duels,afterTier:Math.max(0,...profile.cleared)};\n }\n function fight(tier,context){\n  const id='audit-'+seed+'-'+serial;\n  const g=createGame({id,mode:'pve',opponentId:tier,context,seed:(seed*10007+(++serial)*3091+tier*277)>>>0||1,\n   starter:serial%2,deck:[...profile.activeDeck],fusionDeck:[...profile.fusionDeck],enhancements:profile.enhancements});\n  simulateGame(g,policy);\n  const win=g.winner===0,rew=rewardMatch(g);\n  if(!rew)throw Error('no real reward');\n  out.duels++;out.wins+=Number(win);out.losses+=Number(!win);\n  if(context==='free'&&tier!==0)out.farm++;\n  return win;\n }\n for(let i=0;i<18&&profile.trainingWins<3;i++){fight(0,'free');if(out.duels%3===0)prepare();}\n out.training=profile.trainingWins;\n if(out.training!==3)return {...out,stop:'training',level:playerLevel(profile),coins:profile.coins};\n prepare();\n for(let tier=1;tier<=10;tier++){\n  const stage={tier,attempts:0,losses:0,farm:0,win:false,levelBefore:playerLevel(profile),\n   cardsBefore:levelMax(),coinsBefore:profile.coins};\n  for(let i=0;i<cap;i++){\n   const win=fight(tier,'tournament');stage.attempts++;stage.losses+=Number(!win);prepare();\n   if(win){stage.win=true;break;}\n   if(i%3===2){\n    for(let j=0;j<2;j++){fight(Math.max(0,tier-1),'free');stage.farm++;prepare();}\n   }\n  }\n  stage.levelAfter=playerLevel(profile);stage.cardsAfter=levelMax();stage.coinsAfter=profile.coins;\n  out.stages.push(stage);out.cleared=Math.max(0,...profile.cleared);\n  if(!stage.win)break;\n }\n out.level=playerLevel(profile);out.coins=profile.coins;out.shards=profile.shards.reduce((a,b)=>a+b,0);\n out.inventory=Object.values(profile.inventory).reduce((a,b)=>a+b,0);\n out.saveValid=!!validateProfile(JSON.parse(JSON.stringify(profile)));\n return out;\n}\n";

test('Released-engine player progression with earned inventory, tournament I-X and farming limits',()=>{
 const result=[];
 for(const plan of ['saver','invest'])for(const policy of ['balanced','offensive','economy'])for(const seed of [11,37]){
  try{const ctx=boot();result.push(vm.runInContext('audit('+seed+','+JSON.stringify(policy)+','+JSON.stringify(plan)+')',ctx,{timeout:120000}));}
  catch(e){result.push({seed,policy,plan,error:String(e),stack:String(e.stack||'').slice(0,350)});}
 }
 console.log('ECONOMY_AUDIT_SUMMARY '+JSON.stringify(result.map(r=>({seed:r.seed,plan:r.plan,policy:r.policy,
  stop:r.stop,cleared:r.cleared,duels:r.duels,wins:r.wins,losses:r.losses,farm:r.farm,level:r.level,
  coins:r.coins,max:r.highestCard,ten:r.firstTen,booster:r.boosters,crafts:r.crafts,forge:r.forge,
  upgrades:r.upgrade,training:r.training,error:r.error,stages:r.stages?.map(t=>({t:t.tier,a:t.attempts,
   w:t.win,f:t.farm,l:t.levelAfter,c:t.cardsAfter}))}))));
 assert.equal(result.filter(r=>r.error).length,0,'audit profiles should complete without exceptions');
 assert.ok(result.every(r=>r.training===3),'training actually completed');
 assert.ok(result.every(r=>r.saveValid),'saved profiles validated');
});

test('Extended thirty-try progression with legitimately completed quests and character-pack picks',()=>{
 const rows=[];
 for(const seed of [11,37,83])for(const policy of ['balanced','offensive']){
  try{rows.push(vm.runInContext('audit('+seed+','+JSON.stringify(policy)+',"invest",30)',boot(),{timeout:120000}));}
  catch(e){rows.push({seed,policy,error:String(e),stack:String(e.stack||'').slice(0,400)});}
 }
 console.log('ECONOMY_AUDIT_EXTENDED '+JSON.stringify(rows.map(r=>({seed:r.seed,policy:r.policy,error:r.error,cleared:r.cleared,
  duels:r.duels,wins:r.wins,losses:r.losses,level:r.level,highestCard:r.highestCard,firstTen:r.firstTen,
  boosters:r.boosters,crafts:r.crafts,forge:r.forge,quests:r.quests,packCards:r.packCards,upgrades:r.upgrade,
  stages:r.stages?.map(s=>({t:s.tier,a:s.attempts,w:s.win,f:s.farm,lv:s.levelAfter,max:s.cardsAfter,coins:s.coinsAfter}))}))));
 assert.equal(rows.filter(r=>r.error).length,0);
 assert.ok(rows.every(r=>r.saveValid));
});
