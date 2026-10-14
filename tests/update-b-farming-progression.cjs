'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path');const root=path.resolve(__dirname,'..');
const scripts=['art-engine.js','game.js','expansion.js','evolution.js'].map(p=>fs.readFileSync(path.join(root,'assets',p),'utf8'));
function boot(){const nodes=new Map(),store=new Map();function node(id=''){return {id,innerHTML:'',textContent:'',hidden:false,disabled:false,style:{},dataset:{},value:'',classList:{add(){},remove(){},toggle(){},contains(){return false}},addEventListener(){},insertAdjacentHTML(){},setAttribute(){},click(){this.onclick?.()},querySelector(){return node()},querySelectorAll(){return []},append(){},appendChild(){},remove(){},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}}}}const d={body:node(),getElementById(id){if(!nodes.has(id))nodes.set(id,node(id));return nodes.get(id)},createElement:node,addEventListener(){},querySelector(){return node()},querySelectorAll(){return []}};const w={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))},crypto:{getRandomValues(a){a[0]=123456;return a}},innerWidth:1200};const ctx=vm.createContext({window:w,document:d,Blob,console,URL:{createObjectURL(){return ''},revokeObjectURL(){}},setTimeout(){},setInterval(){},clearInterval(){},clearTimeout(){}});for(const js of scripts)vm.runInContext(js,ctx,{timeout:15000});return code=>JSON.parse(vm.runInContext(`JSON.stringify(${code})`,ctx,{timeout:60000}));}
const results=[];for(let policy of ['balanced','offensive','economy'])for(let run=0;run<4;run++){
 const evalGame=boot();const code=`(()=>{
 profile.trainingWins=3;profile.guideSeen=true;
 let fights=0,farms=0,wins=0,losses=0,boosters=0,finishAt=null;
 const settle=()=>{while(profile.rewardQueue.length){const r=profile.rewardQueue[0];if(!finishMilestone(r.kind==='choice'?r.cards[0]:undefined))throw Error('Milestone stuck');}};
 const improve=()=>{let ids=Object.keys(profile.inventory).map(Number).filter(id=>UPDATE_B_SET.has(id));const deck=strongestMainDeck(ids,profile.enhancements,profile.inventory);if(deck.length===40)profile.activeDeck=deck;const f=bestFusionDeck(ids,profile.enhancements,profile.inventory);if(f.length>=2)profile.fusionDeck=f;};
 for(let tier=1;tier<=10;tier++){
  let success=false;
  for(let attempt=0;attempt<18;attempt++){
   const g=createGame({id:'b-econ-'+tier+'-'+attempt+'-${policy}-${run}',mode:'pve',context:'tournament',opponentId:tier,seed:${run*909+331}+tier*2003+attempt*13,starter:attempt%2,deck:profile.activeDeck,fusionDeck:profile.fusionDeck,enhancements:profile.enhancements});simulateGame(g,'${policy}');fights++;if(g.winner===0)wins++;else losses++;rewardMatch(g);settle();if(g.winner===0){success=true;break;}
   if(tier>1&&attempt%3===2){
    for(let k=0;k<6;k++){const fg=createGame({id:'b-farm-'+tier+'-'+attempt+'-'+k+'-${run}',mode:'pve',context:'free',opponentId:tier-1,seed:${run*1009+131}+tier*941+attempt*67+k*19,starter:k%2,deck:profile.activeDeck,fusionDeck:profile.fusionDeck});simulateGame(fg,'${policy}');farms++;rewardMatch(fg);settle();}
    while(profile.coins>=boosterPrice(highestCleared(),10)&&boosters<60){if(!buyBooster(10))break;boosters++;}
    improve();
   }
  }
  if(!success){finishAt=tier;break;}
  for(let k=0;k<10;k++){const fg=createGame({id:'b-farm-post-'+tier+'-'+k+'-${run}',mode:'pve',context:'free',opponentId:tier,seed:${run*1909+113}+tier*667+k*19,starter:k%2,deck:profile.activeDeck,fusionDeck:profile.fusionDeck});simulateGame(fg,'${policy}');farms++;rewardMatch(fg);settle();}
  while(profile.coins>=boosterPrice(highestCleared(),10)&&boosters<60){if(!buyBooster(10))break;boosters++;}improve();
 }
 return {policy:'${policy}',run:${run},cleared:finishAt==null,blockedAt:finishAt,fights,farms,wins,losses,boosters,level:playerLevel(profile),maxTier:highestCleared()};
})()`;
 try{results.push(evalGame(code))}catch(e){results.push({policy,run,error:String(e)})}
}
console.log(JSON.stringify(results,null,2));fs.writeFileSync(path.join(root,'tests','update-b-farming-progression-results.json'),JSON.stringify(results,null,2));
