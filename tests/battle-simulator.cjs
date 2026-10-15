/* Arcane Duel battle simulation harness – node tests/battle-simulator.cjs
 * Test-only isolated VM: NO browser storage or user's actual save data.
 * Imports the SAME four shipped gameplay scripts, not a simplified combat model.
 * Uses synthetic, tier-source-filtered decks; these are NOT a player-progression
 * balance verdict. Their card acquisition and AI fusion behavior are limitations.
 * Usage:
 *   node tests/battle-simulator.cjs --samples 40
 *   node tests/battle-simulator.cjs --samples 5 --json
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const R=path.resolve(__dirname,'..');
const files=['assets/game.js','assets/expansion.js','assets/evolution.js','assets/learning.js'];
const argv=process.argv.slice(2);
const flag=argv.indexOf('--samples');
const perTier=flag<0?5:Number(argv[flag+1]);
if(!Number.isSafeInteger(perTier)||perTier<1||perTier>200){
 console.error('Samples must be between 1 and 200');process.exit(2);
}
const json=argv.includes('--json');
function element(){
 return {innerHTML:'',textContent:'',value:'',style:{},dataset:{},disabled:false,hidden:false,
  classList:{add(){},remove(){},toggle(){},contains(){return false}},
  append(){},appendChild(){},addEventListener(){},removeEventListener(){},
  querySelector(){return null},querySelectorAll(){return []},
  insertAdjacentHTML(){},setAttribute(){},getAttribute(){return null}};
}
const nodes=new Map(),document={
 getElementById(id){if(!nodes.has(id))nodes.set(id,element());return nodes.get(id);},
 addEventListener(){},querySelector(){return null},querySelectorAll(){return []},
 createElement(){return element()},body:element()
};
const mem={getItem(){return null},setItem(){},removeItem(){}};
const browser={localStorage:mem,location:{protocol:'https:',hostname:'isolated.test'},
 addEventListener(){},matchMedia(){return {matches:true}},crypto:null};
const scope={
 window:browser,document,navigator:{},localStorage:mem,
 setInterval(){return 0},setTimeout(){return 0},clearInterval(){},clearTimeout(){},
 console,Date,Math,JSON,Map,Set,Array,Number,String,Object,RegExp,Error,TypeError,
 Uint32Array,Boolean,Infinity,NaN,parseInt,parseFloat,isNaN
};
const context=vm.createContext(scope,{name:'arcane-duel-balance-isolated'});
const source=files.map(p=>fs.readFileSync(path.join(R,p),'utf8')).join('\n;\n');
vm.runInContext(source+'\n;globalThis.__balanceApi={createGame,simulateGame,profile,CARDS,RPG_DEFAULT_DECK,RPG_BASE_CARDS,RPG_FUSIONS,OPPONENTS};',context,{filename:'actual-game-combined.js',timeout:10000});
const g=context.__balanceApi;
assert.equal(g.profile.version,3);
const kinds=['attack','defense','balanced','lowlevel'];
function setup(tier,type){
 const cards=g.RPG_BASE_CARDS.filter(c=>c.rpg&&!c.fusionOnly&&!c.ace&&(c.source===undefined||c.source<=tier));
 const score=c=>type==='attack'?c.atk:type==='defense'?c.def:type==='lowlevel'?-300*Math.min(c.level,3)+.2*c.atk:(c.atk+c.def)*.5;
 const selected=[...cards].sort((a,b)=>score(b)-score(a)).slice(0,20).flatMap(c=>[c.id,c.id]);
 const fusionDeck=g.RPG_FUSIONS.filter(c=>c.rpg&&c.fusionOnly&&!c.ace&&(c.source===undefined||c.source<=tier))
  .sort((a,b)=>a.level-b.level||a.id-b.id).slice(0,15).map(c=>c.id);
 assert.equal(selected.length,40);
 return {deck:selected,fusionDeck};
}
const rows=[],errors=[];
for(let tier=1;tier<=10;tier++){
 for(let index=0;index<kinds.length;index++){
  const kind=kinds[index],data=setup(tier,kind);
  const row={tier,kind,wins:0,losses:0,errors:0,turnSum:0,fusionSum:0};
  for(let iteration=0;iteration<perTier;iteration++){
   const seed=98765+tier*8317+iteration*103+index*7;
   try{
    const duel=g.createGame({...data,id:'balance-'+tier+'-'+kind+'-'+iteration,
     seed,mode:'pve',opponentId:tier,context:'tournament',difficulty:'easy',flatBonus:0});
    g.simulateGame(duel,kind==='lowlevel'?'economy':kind==='defense'?'guardian':'balanced',
     g.OPPONENTS[tier].policy||'balanced');
    if(duel.winner===0)row.wins++;else row.losses++;
    row.turnSum+=duel.turn;row.fusionSum+=duel.totalFusions?.[0]||0;
   }catch(e){row.errors++;errors.push({tier,kind,iteration,error:String(e)});}
  }
  rows.push({tier,kind,n:perTier,winRate:Math.round(1000*row.wins/perTier)/10,
   wins:row.wins,losses:row.losses,errors:row.errors,
   avgTurns:Math.round(10*row.turnSum/Math.max(1,row.wins+row.losses))/10,
   avgFusions:Math.round(10*row.fusionSum/Math.max(1,row.wins+row.losses))/10});
 }
}
const report={version:'strategy-baseline-1',actualCombatCode:true,isolatedSave:true,
 battles:perTier*10*kinds.length,roster:{all:g.CARDS.length,base:g.RPG_BASE_CARDS.length,templates:g.RPG_FUSIONS.length},
 warnings:['Synthetic decks do not verify card acquisition at each tier','AI policies still fuse for all four archetypes','Do not infer human win rates or final game balance'],
 errors,rows};
if(json)console.log(JSON.stringify(report,null,2));
else{
 console.log('Arcane Duel full-rules AI baseline:',report.battles,'simulated duels; errors:',errors.length);
 console.table(rows.map(({tier,kind,winRate,avgTurns,avgFusions,errors})=>({tier,kind,winRate,avgTurns,avgFusions,errors})));
}
if(errors.length)process.exitCode=1;
