(function mainDriver(){
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');
const src=require('./helpers/ai-defender-coverage-v88.cjs');
const earned=JSON.parse(fs.readFileSync('artifacts/ai-earned-preiv-v88.json','utf8'));
const num=Number(process.env.ARCANE_V88_CAREERS||32),seeds=Number(process.env.ARCANE_V88_MATCH_SEEDS||2);
assert.ok(Number.isInteger(num)&&num>=24&&num<=40);
assert.ok(Number.isInteger(seeds)&&seeds>=1&&seeds<=4);
assert.equal(earned.entries.length,num);
const arms=['baseline','defense-only','support-only','defense-support',
  'earned-role-deck','role-support','role-defense-support'];
const b=boot({seed:880022}),results=[];
let duels=0;
function game(s,type,seed,starter){
 const expr=`(()=>{
  profile=${JSON.stringify(s.profile)};
  const type=${JSON.stringify(type)},mode=${JSON.stringify(s.policy)};
  const before=JSON.stringify(profile);
  const owned=profile.inventory;
  if(mainDeckError(profile.activeDeck)||fusionDeckError(profile.fusionDeck)||
    inventoryError(profile.activeDeck,owned)||inventoryError(profile.fusionDeck,owned))
    throw Error('v8.8 input inventory invalid');
  const initialRole=profile.activeDeck.reduce((a,id)=>{
    const role=CARDS[id]?.role;
    if(role==='soul')a.soul++;
    if(role==='guardian')a.guardian++;
    return a;
  },{soul:0,guardian:0});
  let selected={changed:false};
  if(type.startsWith('role-')||type==='earned-role-deck')
    selected=(${src.roleDeckSource})();
  const equipped=JSON.stringify(profile),realDeck=[...profile.activeDeck],
    g=createGame({mode:'pve',context:'tournament',opponentId:4,
      id:'v88-${seed}-${starter}-${type}',seed:${seed},starter:${starter},
      deck:[...profile.activeDeck],fusionDeck:[...profile.fusionDeck],
      enhancements:profile.enhancements,difficulty:'easy'});
  const diagnostics={decisionCalls:0,turnsSeen:0,soulFieldTurns:0,guardianFieldTurns:0,
    soulDefTurns:0,guardianDefTurns:0,soulReadyTurns:0,guardianReadyTurns:0,
    switchedSoulTurns:0,spentSoulTurns:0,adjacentTurns:0,targetTurns:0,
    legalDrainTurns:0,legalHealTurns:0,legalDrainChoices:0,legalHealChoices:0,
    supportChosen:0,supportApplied:0,supportRejected:0,defenseChosen:0};
  const observed=new Set(),oldChoose=chooseAiAction,oldApply=applyAiAction;
  chooseAiAction=function(game,policy){
   if(game!==g||game.active!==0)return oldChoose(game,policy);
   const c=(${src.coverageSource})(game),key=String(game.turn);
   diagnostics.decisionCalls++;
   if(game.aiPhase==='attacks'&&!observed.has(key)){
    observed.add(key);diagnostics.turnsSeen++;
    for(const [test,dest] of [
     ['soulOnField','soulFieldTurns'],['guardianOnField','guardianFieldTurns'],
     ['soulDef','soulDefTurns'],['guardianDef','guardianDefTurns'],
     ['readySoul','soulReadyTurns'],['readyGuard','guardianReadyTurns'],
     ['switchedSoul','switchedSoulTurns'],['spentSoul','spentSoulTurns'],
     ['adjacent','adjacentTurns'],['enemyTargets','targetTurns'],
     ['legalDrain','legalDrainTurns'],['legalHeal','legalHealTurns']])
      if(c[test])diagnostics[dest]++;
   }
   const chosen=(${src.policySource})(game,type,diagnostics,c);
   return chosen||oldChoose(game,policy);
  };
  applyAiAction=function(game,action){
   if(game!==g||game.active!==0||
      (action.type!=='arcane-soul-extract'&&action.type!=='arcane-guardian-heal'))
      return oldApply(game,action);
   const me=game.players[0],enemy=game.players[1],
     prior=action.type==='arcane-soul-extract'?
       enemy.field[action.target]?.card?.[enemy.field[action.target]?.mode==='def'?'def':'atk']:
       me.field[action.ally]?.card?.def;
   const out=oldApply(game,action);
   const next=action.type==='arcane-soul-extract'?
       enemy.field[action.target]?.card?.[enemy.field[action.target]?.mode==='def'?'def':'atk']:
       me.field[action.ally]?.card?.def;
   if(out&&typeof prior==='number'&&typeof next==='number'&&prior!==next){
     diagnostics.supportApplied++;
     if(action.type==='arcane-soul-extract')diagnostics.legalDrainChoices++;
     else diagnostics.legalHealChoices++;
   }else diagnostics.supportRejected++;
   return out;
  };
  try{simulateGame(g,mode,'balanced');}
  finally{chooseAiAction=oldChoose;applyAiAction=oldApply;}
  if(g.winner===null)throw Error('unfinished v8.8 duel');
  if(equipped!==JSON.stringify(profile))throw Error('v8.8 diagnostics changed economy/profile');
  if(mainDeckError(profile.activeDeck)||fusionDeckError(profile.fusionDeck)||
     inventoryError(profile.activeDeck,owned)||inventoryError(profile.fusionDeck,owned))
    throw Error('v8.8 result deck illegal');
  return {win:g.winner===0,lpDiff:g.players[0].lp-g.players[1].lp,
   realFusions:Number(g.totalFusions?.[0]||0),
   initialRole,selected,diagnostics};
 })()`;
 const r=b.run(expr,180000);duels++;return r;
}
for(const s of earned.entries){
 const variants={};
 for(const type of arms){
  const rows=[];
  for(let k=0;k<seeds;k++)for(const starter of [0,1]){
   const seed=(8841517+s.careerId*15349+k*1301+starter*419)>>>0;
   rows.push(game(s,type,seed,starter));
  }
  const sum=key=>rows.reduce((n,r)=>n+r[key],0),metric=key=>rows.reduce((n,r)=>n+r.diagnostics[key],0);
  variants[type]={games:rows.length,wins:rows.filter(r=>r.win).length,
   avgLP:+(sum('lpDiff')/rows.length).toFixed(2),realFusions:sum('realFusions'),
   roleDeckChanged:rows.some(r=>r.selected.changed),
   roleEquipped:rows[0].selected.newRoles||rows[0].initialRole,
   roleStock:rows[0].selected.roleStock??null,
   turnsSeen:metric('turnsSeen'),
   soulFieldTurns:metric('soulFieldTurns'),guardianFieldTurns:metric('guardianFieldTurns'),
   soulDefTurns:metric('soulDefTurns'),guardianDefTurns:metric('guardianDefTurns'),
   soulReadyTurns:metric('soulReadyTurns'),guardianReadyTurns:metric('guardianReadyTurns'),
   switchedSoulTurns:metric('switchedSoulTurns'),spentSoulTurns:metric('spentSoulTurns'),
   adjacentTurns:metric('adjacentTurns'),targetTurns:metric('targetTurns'),
   legalDrainTurns:metric('legalDrainTurns'),legalHealTurns:metric('legalHealTurns'),
   supportChosen:metric('supportChosen'),supportApplied:metric('supportApplied'),
   supportRejected:metric('supportRejected'),defenseChosen:metric('defenseChosen')};
 }
 results.push({careerId:s.careerId,policy:s.policy,variants});
 console.log('ARCANE_V88_ORIGIN '+JSON.stringify({run:s.careerId,policy:s.policy,
   wins:Object.fromEntries(arms.map(type=>[type,variants[type].wins])),
   roles:Object.fromEntries(arms.map(type=>[type,variants[type].roleEquipped])),
   legalSupport:Object.fromEntries(arms.map(type=>[type,variants[type].legalDrainTurns+variants[type].legalHealTurns]))}));
}
const train=results.slice(0,num/2),holdout=results.slice(num/2);
function summary(rows){
 const out={};
 for(const type of arms){
  const a=rows.map(r=>r.variants[type]),sum=k=>a.reduce((n,r)=>n+r[k],0);
  out[type]={independentOrigins:rows.length,games:sum('games'),wins:sum('wins'),
   avgLP:+(sum('avgLP')/a.length).toFixed(1),fusions:sum('realFusions'),
   roleDeckChanges:a.filter(x=>x.roleDeckChanged).length,
   originsWithSoul:a.filter(x=>x.roleEquipped.soul>0).length,
   originsWithGuardian:a.filter(x=>x.roleEquipped.guardian>0).length,
   soulCardsEquipped:sum('roleEquipped.soul')||0,
   soulFieldTurns:sum('soulFieldTurns'),guardianFieldTurns:sum('guardianFieldTurns'),
   readySoulTurns:sum('soulReadyTurns'),legalDrainTurns:sum('legalDrainTurns'),
   legalHealTurns:sum('legalHealTurns'),supportChosen:sum('supportChosen'),
   supportApplied:sum('supportApplied'),defenseChosen:sum('defenseChosen'),
   switchedSoulTurns:sum('switchedSoulTurns')};
  // The nested role equipped fields are aggregated explicitly.
  out[type].soulCardsEquipped=a.reduce((n,x)=>n+x.roleEquipped.soul,0);
  out[type].guardianCardsEquipped=a.reduce((n,x)=>n+x.roleEquipped.guardian,0);
 }
 return out;
}
function paired(rows,type){
 const diffs=rows.map(r=>r.variants[type].wins-r.variants.baseline.wins),
  lp=rows.map(r=>r.variants[type].avgLP-r.variants.baseline.avgLP);
 return {winsDelta:diffs.reduce((n,x)=>n+x,0),better:diffs.filter(x=>x>0).length,
  equal:diffs.filter(x=>x===0).length,worse:diffs.filter(x=>x<0).length,
  avgLPDelta:+(lp.reduce((n,x)=>n+x,0)/rows.length).toFixed(1)};
}
const ranked=arms.filter(x=>x!=='baseline').map(type=>({type,...paired(train,type)}))
 .sort((a,b)=>b.winsDelta-a.winsDelta||b.avgLPDelta-a.avgLPDelta);
const selected=ranked[0]?.winsDelta>0||
   ranked[0]?.winsDelta===0&&ranked[0]?.avgLPDelta>0?ranked[0].type:'baseline';
const holdoutPairs=Object.fromEntries(arms.filter(x=>x!=='baseline').map(x=>[x,paired(holdout,x)]));
const qualified=selected!=='baseline'&&holdoutPairs[selected].winsDelta>0&&
 holdoutPairs[selected].better>holdoutPairs[selected].worse;
const report={schema:'arcane-defender-soul-coverage-v88',origins:num,
 trainOrigins:train.length,holdoutOrigins:holdout.length,
 seedOffset:earned.careerSeedOffset,sourceEarnedMatches:earned.earnedMatches,
 sourceCareerIVWins:earned.completedIV,diagnosticDuels:duels,
 arms,training:summary(train),holdout:summary(holdout),overall:summary(results),
 rankedTraining:ranked,selectedByTraining:selected,holdoutPairs,qualified,
 originResults:results,
 limitations:['This is player-side offline training, not ongoing live NPC learning.',
 'Role-deck experiments change the owned active deck, so their comparisons isolate the full deck-plus-tactics combination only in explicitly combined arms.',
 'Player souls and guardians need field DEF, unused action and targets; ability availability is audited by live state.',
 'No synthetic reward, inventory card or forced enemy outcome in matched diagnostic duels.',
 'Two match seeds times two starters per origin; independent unit is earned career origin.',
 'This stage compares IV duels only; full IV/VI career progression is still a separate promotion gate.']};
fs.mkdirSync('artifacts',{recursive:true});
fs.writeFileSync('artifacts/ai-defender-coverage-v88.json',JSON.stringify(report,null,2)+'\n');
console.log('ARCANE_V88_SUMMARY '+JSON.stringify({origins:num,diagnosticDuels:duels,
 sourceEarnedMatches:earned.earnedMatches,sourceCareerIVWins:earned.completedIV,
 training:report.training,holdout:report.holdout,rankedTraining:ranked,
 selected,holdoutPairs,qualified}));
})();
