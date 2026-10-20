(function driver(){
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const input=JSON.parse(fs.readFileSync('artifacts/ai-earned-preiv-v87.json','utf8'));
const tactics=require('./helpers/ai-tactical-v87.cjs');
const originsCount=Number(process.env.ARCANE_V87_CAREERS||32);
const repeats=Number(process.env.ARCANE_V87_MATCH_SEEDS||2);
assert.ok(Number.isInteger(originsCount)&&originsCount>=24&&originsCount<=40);
assert.ok(Number.isInteger(repeats)&&repeats>=1&&repeats<=4);
assert.equal(input.entries.length,originsCount);
const types=['baseline','threat-target','survival-defense','soul-support','hybrid-board'];
const vm=boot({seed:870001});
let duels=0;
function fight(s,type,seed,starter){
  const expr=`(()=>{
    profile=${JSON.stringify(s.profile)};
    const policy=${JSON.stringify(s.policy)},type=${JSON.stringify(type)};
    if(mainDeckError(profile.activeDeck)||fusionDeckError(profile.fusionDeck)||
       inventoryError(profile.activeDeck,profile.inventory)||
       inventoryError(profile.fusionDeck,profile.inventory))throw Error('Unowned or invalid source deck');
    const save=JSON.stringify(profile);
    const g=createGame({mode:'pve',context:'tournament',opponentId:4,
      id:'v87-tactic-${seed}-${starter}-${type}',seed:${seed},starter:${starter},
      deck:[...profile.activeDeck],fusionDeck:[...profile.fusionDeck],
      enhancements:profile.enhancements,difficulty:'easy'});
    const metrics={attackOverrides:0,defensiveSwitches:0,supportActions:0,supportTypes:{},targetedThreats:0,directAttacks:0,trades:0};
    const oldChoose=chooseAiAction;
    chooseAiAction=function(game,p){
      if(game===g&&game.active===0){
       const action=(${tactics.source})(game,type,policy,metrics);
       if(action)return action;
      }
      return oldChoose(game,p);
    };
    try{simulateGame(g,policy,'balanced');}
    finally{chooseAiAction=oldChoose;}
    if(g.winner===null)throw Error('Unfinished match');
    if(save!==JSON.stringify(profile))throw Error('Diagnostic duel modified user profile');
    return {won:g.winner===0,lpDelta:g.players[0].lp-g.players[1].lp,
     fusions:Number(g.totalFusions?.[0]||0),turns:g.turn,metrics};
  })()`;
  const r=vm.run(expr,180000);duels++;return r;
}
const origins=[];
for(const s of input.entries){
 const arms={};
 for(const type of types){
  const matches=[];
  for(let k=0;k<repeats;k++)for(const starter of [0,1]){
   const seed=(8725553+s.careerId*17749+k*2143+starter*419)>>>0;
   matches.push(fight(s,type,seed,starter));
  }
  const sum=key=>matches.reduce((n,m)=>n+m[key],0);
  const metric=key=>matches.reduce((n,m)=>n+m.metrics[key],0);
  arms[type]={games:matches.length,wins:matches.filter(x=>x.won).length,
    meanLP:+(sum('lpDelta')/matches.length).toFixed(2),
    meanTurns:+(sum('turns')/matches.length).toFixed(2),
    actualFusions:sum('fusions'),attackOverrides:metric('attackOverrides'),
    defensiveSwitches:metric('defensiveSwitches'),supportActions:metric('supportActions'),
    targetedThreats:metric('targetedThreats'),directAttacks:metric('directAttacks'),trades:metric('trades')};
 }
 origins.push({careerId:s.careerId,policy:s.policy,arms});
 console.log('ARCANE_V87_ORIGIN '+JSON.stringify({origin:s.careerId,policy:s.policy,
 wins:Object.fromEntries(types.map(t=>[t,arms[t].wins])),
 attackOverrides:Object.fromEntries(types.map(t=>[t,arms[t].attackOverrides])),
 support:Object.fromEntries(types.map(t=>[t,arms[t].supportActions]))}));
}
const split=Math.floor(originsCount/2),training=origins.slice(0,split),holdout=origins.slice(split);
function summarize(rows){
 const out={};
 for(const t of types){
  const a=rows.map(x=>x.arms[t]),sum=k=>a.reduce((n,x)=>n+x[k],0);
  out[t]={independentOrigins:rows.length,games:sum('games'),wins:sum('wins'),
   meanLP:+(sum('meanLP')/a.length).toFixed(1),
   actualFusions:sum('actualFusions'),attackOverrides:sum('attackOverrides'),
   defensiveSwitches:sum('defensiveSwitches'),supportActions:sum('supportActions'),
   targetedThreats:sum('targetedThreats'),directAttacks:sum('directAttacks'),trades:sum('trades')};
 }
 return out;
}
function paired(rows,t){
 const delta=rows.map(x=>x.arms[t].wins-x.arms.baseline.wins);
 const lp=rows.map(x=>x.arms[t].meanLP-x.arms.baseline.meanLP);
 return {winsDelta:delta.reduce((a,b)=>a+b,0),
   better:delta.filter(n=>n>0).length,equal:delta.filter(n=>n===0).length,
   worse:delta.filter(n=>n<0).length,
   meanLPDelta:+(lp.reduce((a,b)=>a+b,0)/rows.length).toFixed(1)};
}
const ranked=types.filter(t=>t!=='baseline').map(type=>({type,...paired(training,type)}))
.sort((a,b)=>b.winsDelta-a.winsDelta||b.meanLPDelta-a.meanLPDelta);
const best=ranked[0]?.winsDelta>0||ranked[0]?.winsDelta===0&&ranked[0]?.meanLPDelta>0?
 ranked[0].type:'baseline';
const holdoutPairs=Object.fromEntries(types.filter(t=>t!=='baseline').map(t=>[t,paired(holdout,t)]));
const qualified=best!=='baseline'&&holdoutPairs[best].winsDelta>0&&
 holdoutPairs[best].better>holdoutPairs[best].worse;
const report={schema:'arcane-matched-tactical-fusions-v87',
 origins:originsCount,independentTrain:training.length,independentHoldout:holdout.length,
 sourceSeedOffset:input.careerSeedOffset,sourceEarnedMatches:input.earnedMatches,
 totalDiagnosticDuels:duels,sourceWonIV:input.completedIV,
 types,training: summarize(training),holdout:summarize(holdout),overall:summarize(origins),
 trainingRanked:ranked,selectedByTraining:best,holdoutPairs,qualified,
 originDetails:origins,
 limitations:['Player tactical policy is sandboxed inside match only, not an NPC or neural model.',
 'Independent unit is one earned source career, not a repeated match.',
 'Legal fusion search limited to two or three cards from hand, engine field fusion fallback unchanged.',
 'Identical starts do not force identical later RNG state after divergent actions.',
 'Controlled duels never call rewardMatch or grant cards/XP/shards.',
 'Full career follow-up is required before any game integration.']};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-tactical-v87.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V87_SUMMARY '+JSON.stringify({
 independentOrigins:originsCount,sourceEarnedMatches:input.earnedMatches,
 totalDiagnosticDuels:duels,training:report.training,holdout:report.holdout,
 trainingRanked:ranked,selected:best,holdoutPairs,qualified}));
})();
