'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');const files=['assets/art-engine.js','assets/game.js','assets/expansion.js','assets/evolution.js'].map(f=>fs.readFileSync(path.join(root,f),'utf8'));
function boot(saved=null){const nodes=new Map(),store=new Map(saved?[['arcane-duel-rpg-profile-v3',saved]]:[]);function el(id=''){return {id,innerHTML:'',textContent:'',value:'',hidden:false,disabled:false,style:{},dataset:{},classList:{add(){},remove(){},toggle(){},contains(k){return k==='hidden'}},append(){},appendChild(){},remove(){},setAttribute(){},addEventListener(){},insertAdjacentHTML(){},click(){if(typeof this.onclick==='function')this.onclick()},querySelector(){return el()},querySelectorAll(){return []},getBoundingClientRect(){return {left:0,top:0,width:100,height:100}}};}const document={body:el('body'),getElementById(id){if(!nodes.has(id))nodes.set(id,el(id));return nodes.get(id)},querySelector(){return el()},querySelectorAll(){return []},createElement:el,addEventListener(){},elementFromPoint(){return null}};const window={localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,String(v))},crypto:{getRandomValues(a){a[0]=12345;return a}},innerWidth:1200,innerHeight:800};const ctx=vm.createContext({window,document,console,setTimeout(){},setInterval(){},clearTimeout(){},clearInterval(){},Blob,URL:{createObjectURL(){return 'blob:test'},revokeObjectURL(){}}});for(const f of files)vm.runInContext(f,ctx,{timeout:15000});return {run(code){return JSON.parse(vm.runInContext('JSON.stringify('+code+')',ctx,{timeout:15000}))},ctx,store};}

const policies=['balanced','offensive','economy'];const rows=[],targetRuns=30;
for(let pi=0;pi<policies.length;pi++)for(let run=0;run<targetRuns;run++){
 const b=boot();const prefix=pi+'-'+run;const script=`(()=>{
 profile.trainingWins=3;profile.guideSeen=true;
 let fights=0,losses=0,wins=0,tier=1,coinsSpent=0,stop=null,duelsByTier=[0,0,0],winsByTier=[0,0,0];
 for(;tier<=3;tier++){
  let cleared=false;
  for(let attempt=0;attempt<45;attempt++){
   const g=createGame({id:'early-journey-${prefix}-'+tier+'-'+attempt,mode:'pve',context:'tournament',opponentId:tier,seed:${(pi+1)*100003+(run+1)*173}+tier*709+attempt*17,starter:(attempt+${run})%2,deck:profile.activeDeck,fusionDeck:profile.fusionDeck,enhancements:profile.enhancements});
   simulateGame(g,'${policies[pi]}');fights++;duelsByTier[tier-1]++;
   const outcome=g.winner===0;if(outcome){wins++;winsByTier[tier-1]++;}else losses++;
   rewardMatch(g);
   if(outcome){cleared=true;break;}
   // Gradually use earned collectible cards and fusion stock in the permanent deck.
   if((attempt+1)%5===0){
    const ids=Object.keys(profile.inventory).map(Number);
    const deck=strongestMainDeck(ids,profile.enhancements,profile.inventory);
    if(deck.length===40)profile.activeDeck=deck;
    const fusion=bestFusionDeck(ids,profile.enhancements,profile.inventory);
    if(fusion.length>=4)profile.fusionDeck=fusion;
   }
  }
  if(!cleared){stop=tier;break;}
 }
 return {strategy:'${policies[pi]}',run:${run},fights,losses,wins,cleared:stop===null,stoppedAt:stop,duelsByTier,winsByTier,level:playerLevel(profile),coins:profile.coins,XP:profile.xp};
})()`;
 try{rows.push(b.run(script))}catch(e){rows.push({strategy:policies[pi],run,error:String(e)})}
}
const summary=policies.map(p=>{const r=rows.filter(x=>x.strategy===p),ok=r.filter(x=>x.cleared);return {strategy:p,cleared:ok.length,total:r.length,errors:r.filter(x=>x.error).length,averageFights:Number((r.reduce((a,x)=>a+(x.fights||0),0)/r.length).toFixed(1)),averageLosses:Number((r.reduce((a,x)=>a+(x.losses||0),0)/r.length).toFixed(1)),blockedAtII:r.filter(x=>x.stoppedAt===2).length,blockedAtIII:r.filter(x=>x.stoppedAt===3).length}});
const report={version:'2.5.0',kind:'connected tournament I–III, NPC themed decks',runs:rows.length,maxAttemptsPerTier:45,summary,rows};
fs.writeFileSync(path.join(root,'tests/evolution-journey-results.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify(summary,null,2));
