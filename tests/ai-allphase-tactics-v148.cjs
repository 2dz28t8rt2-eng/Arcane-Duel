'use strict';
// v14.8 uses the exact v14.7 source controller as its reference. The source
// adaptations are asserted so upstream changes cannot silently change the audit.
const fs=require('node:fs');
let script=fs.readFileSync('tests/ai-final-score-transparency-v147.cjs','utf8');
script=script.slice(0,script.indexOf('const reports='));
function patch(a,b){const n=script.split(a).length-1;if(n!==1)throw Error('Source update mismatch '+a+' '+n);script=script.replace(a,b)}
patch('ARCANE_V147_TRAIN||63','ARCANE_V148_TRAIN||63');
patch('ARCANE_V147_HOLDOUT||63','ARCANE_V148_HOLDOUT||63');
patch('ARCANE_V147_LEAGUE||12','ARCANE_V148_LEAGUE||12');
patch('1470000:3470000','1480000:3480000');
patch('9100:5150','9200:5250');
patch("+'\\n'+lookahead139.toString()+'\\n'+explain146.toString()","+'\\n'+lookahead139.toString()+'\\n'+lookahead148.toString()+'\\n'+explain146.toString()");
patch("'suggested=lookahead139(game,weights,tally,ARCANE144_SIDES[side]);',","'suggested=lookahead148(game,weights,tally,ARCANE144_SIDES[side]);',");
patch("'sameStateComparisons:0,sameStateOverrides:0,',","'sameStateComparisons:0,sameStateOverrides:0,',\n 'v148Offers:{},v148Chosen:{},v148Interventions:0,',\n 'v148Evaluations:0,v148Audit:[],v148Rejected:0,',");
const addon=String.raw\`
function lookahead148(g,w,stats,mode='candidate'){
 if(mode==='prior147')return lookahead139(g,w,stats,'candidate');
 if(mode==='champion')return null;
 if(mode!=='candidate')return lookahead139(g,w,stats,mode);
 if(g.pending||g.winner!==null||g.turn>10)return null;
 if(g.aiPhase==='summon')return lookahead139(g,w,stats,'candidate');
 if(!['attacks','positions'].includes(g.aiPhase))return null;
 const type=g.aiPhase,seat=g.active;
 const options=choices135(g,stats).filter(c=>type==='positions'?
   c.action.type==='switch':
   ['attack','arcane-soul-extract','arcane-guardian-heal','end'].includes(c.action.type));
 if(!options.length)return null;
 stats.v148Offers[type]=(stats.v148Offers[type]||0)+1;
 const p=ARCANE144_PROFILE?.bySide?.[seat]||{};
 const start=boardValue139(g,seat),danger=tacticalThreat144(g,seat);
 const ranked=[];
 for(const c of options.slice(0,type==='attacks'?20:5)){
  const cloned=JSON.parse(JSON.stringify(g));
  let ok=false;
  try{ok=!!applyAiAction(cloned,c.action)}catch(e){ok=false}
  if(!ok){stats.v148Rejected++;continue}
  const value=boardValue139(cloned,seat)-start;
  const relief=danger-tacticalThreat144(cloned,seat);
  const kind=c.action.type;
  const base=c.base+c.features.reduce((n,f,i)=>n+f*w[i],0);
  const pieces={
   linear:.22*base,
   actualResolved:2.35*value,
   attackTempo:kind==='attack'?.17*(p.tempo??1):0,
   endPenalty:kind==='end'?-.08:0,
   pressure:kind==='attack'?(p.attackPressure??.25)*(
     Math.max(0,g.players[1-seat].lp-cloned.players[1-seat].lp)/850+
     (g.players[1-seat].field.filter(Boolean).length>
      cloned.players[1-seat].field.filter(Boolean).length?.45:0)):0,
   soul:kind==='arcane-soul-extract'?(p.soulPriority??.5)*
     Math.max(0,value+.13):0,
   guardian:kind==='arcane-guardian-heal'?(p.guardianPriority??.55)*
     Math.max(0,value+.13):0,
   position:kind==='switch'?(p.positionDefense??.6)*relief:0,
   safety:(p.riskScale??.65)*relief
  };
  const sum=Object.values(pieces).reduce((n,v)=>n+v,0);
  ranked.push({action:c.action,score:sum,pieces,
   oldScore:pieces.linear+pieces.actualResolved+
    pieces.attackTempo+pieces.endPenalty});
 }
 if(!ranked.length)return null;
 ranked.sort((a,b)=>b.score-a.score);
 if(type==='positions'&&ranked[0].score<.14)return null;
 const winner=ranked[0],reference=[...ranked].sort((a,b)=>b.oldScore-a.oldScore)[0];
 stats.v148Evaluations++;
 if(JSON.stringify(winner.action)!==JSON.stringify(reference.action))
  stats.v148Interventions++;
 stats.v148Chosen[winner.action.type]=(stats.v148Chosen[winner.action.type]||0)+1;
 if(ARCANE147_TRACE&&stats.v148Audit.length<16){
  const valid=ranked.every(r=>Math.abs(
    Object.values(r.pieces).reduce((n,v)=>n+v,0)-r.score)<1e-8);
  if(!valid)stats.traceIntegrityErrors++;
  stats.v148Audit.push({turn:g.turn,phase:type,actor:seat,
   selected:winner.action,priorSameOutcomeAction:reference.action,
   changed:JSON.stringify(winner.action)!==JSON.stringify(reference.action),
   alternatives:ranked.slice(0,10).map(r=>({
    action:r.action,score:r.score,priorScore:r.oldScore,
    decomposition:r.pieces})),
   explanation:'Actual engine-resolved one-action score, not a prediction of match victory'});
 }
 return winner.action;
}
\`;
if(!script.includes('function play(scene'))throw Error('No game function');
script=script.replace('function play(scene',addon+'\nfunction play(scene');
const run=String.raw\`
const history=[
 ['v142','artifacts/history-v142/report.json','arcane-v142-action-override-audit'],
 ['v143','artifacts/history-v143/report.json','arcane-v143-fusion-value-resolution'],
 ['v144','artifacts/history-v144/report.json','arcane-v144-history-driven-followup-training'],
 ['v145','artifacts/history-v145/report.json','arcane-v145-three-strategy-historical-curriculum'],
 ['v146','artifacts/history-v146/report.json','arcane-v146-verified-mirror-explanations'],
 ['v147','artifacts/history-v147/report.json','arcane-v147-final-score-transparent-mirrors']
].map(([generation,path,schema])=>{
 const item=JSON.parse(fs.readFileSync(path,'utf8'));
 assert.equal(item.schema,schema,'Source authenticity failure '+generation);
 return {generation,path,schema};
});
const last=JSON.parse(fs.readFileSync('artifacts/history-v147/report.json','utf8'));
assert.equal(last.promotionEligible,false);
const groups={offense:['predator','tempo'],defense:['guardian','soul'],
 fusion:['fusion','allrounder','hybrid']};
const group=s=>Object.keys(groups).find(g=>groups[g].includes(s.style));
const old=last.selectedProfiles;
const configs={
 offense:[
  {...old.offense,name:'pressure-control',attackPressure:.30,riskScale:.70},
  {...old.offense,name:'targeted-aggression',attackPressure:1.3,riskScale:.35}
 ],
 defense:[
  {...old.defense,name:'guardian-protection',guardianPriority:1.25,
   soulPriority:.45,positionDefense:1.0,riskScale:1.1},
  {...old.defense,name:'soul-drain-counterattack',guardianPriority:.5,
   soulPriority:1.5,positionDefense:.7,riskScale:.7}
 ],
 fusion:[
  {...old.fusion,name:'fusion-safety',attackPressure:.4,
   riskScale:1.1,soulPriority:.5,guardianPriority:.65},
  {...old.fusion,name:'fusion-offense',attackPressure:1.2,
   riskScale:.4,soulPriority:1.2,guardianPriority:.4}
 ]
};
function playWith(s,modes,p0,p1,trace=false){
 return play(s,model.weights,model.weights,'none','positions',false,
  2,'summon-only',2.35,modes,{bySide:[p0,p1]},trace);
}
function mirror(s,p){
 const o=old[group(s)];
 const a=playWith(s,['candidate','prior147'],p,o);
 const b=playWith(s,['prior147','candidate'],o,p);
 return {a,b,wins:Number(a.winner===0)+Number(b.winner===1)};
}
function summary(){return {wins:0,games:0,offers:{},chosen:{},interventions:0,
 evaluations:0,rejected:0}}
function tally(z,x){
 const t=x.tally;
 z.interventions+=t.v148Interventions||0;
 z.evaluations+=t.v148Evaluations||0;
 z.rejected+=t.v148Rejected||0;
 for(const [out,from] of [['offers',t.v148Offers],['chosen',t.v148Chosen]])
  for(const [k,v] of Object.entries(from||{}))z[out][k]=(z[out][k]||0)+v;
}
const trainResults=[],selected={};
for(const g of Object.keys(groups)){
 const cases=train.filter(s=>group(s)===g),rows=[];
 assert.ok(cases.length>=5);
 for(const p of configs[g]){
  const x={group:g,profile:p,...summary()};
  for(const s of cases){
   const pair=mirror(s,p);x.games+=2;x.wins+=pair.wins;
   tally(x,pair.a);tally(x,pair.b);
  }
  rows.push(x);trainResults.push(x);
  console.log('ARCANE_V148_TRAIN '+JSON.stringify({group:g,
   variant:p.name,wins:x.wins,games:x.games,changes:x.interventions,
   evaluated:x.evaluations}));
 }
 rows.sort((a,b)=>b.wins-a.wins||b.interventions-a.interventions);
 selected[g]=rows[0].profile;
}
const holdByGroup={},evidence=[];
for(const g of Object.keys(groups)){
 const sum=summary();
 const cases=holdout.filter(s=>group(s)===g);
 for(let i=0;i<cases.length;i++){
  const s=cases[i],p=selected[g],capture=i<3;
  const o=old[g];
  const a=playWith(s,['candidate','prior147'],p,o,capture);
  const b=playWith(s,['prior147','candidate'],o,p,capture);
  sum.wins+=Number(a.winner===0)+Number(b.winner===1);sum.games+=2;
  tally(sum,a);tally(sum,b);
  if(capture)for(const [seat,match] of [[0,a],[1,b]])
   evidence.push({group:g,seat,seed:s.seed,deckFingerprint:s.deck.fingerprint,
    deck:s.deck.deck,fusionDeck:s.deck.fusionDeck,
    tier:s.tier,style:s.style,winner:match.winner,
    tacticalRankings:match.tally.v148Audit,
    priorSummonRankings:match.tally.finalRankedTraces,
    observedRealActions:match.tally.actualEffects,
    planMismatches:match.tally.changedPlans});
 }
 holdByGroup[g]=sum;
}
const control={wins:0,games:0};
for(const s of holdout){
 const p=selected[group(s)];
 const a=play(s,model.weights,model.weights,'none','positions',false,
  0,'summon-only',2.35,['candidate','champion'],{bySide:[p,{}]},false);
 const b=play(s,model.weights,model.weights,'none','positions',false,
  1,'summon-only',2.35,['champion','candidate'],{bySide:[{},p]},false);
 control.wins+=Number(a.winner===0)+Number(b.winner===1);control.games+=2;
}
const boss={candidate:0,prior147:0,champion:0,games:0,byTier:{}};
for(const s0 of holdout.filter((_,i)=>i%2===0)){
 const s={...s0,boss:true},p=selected[group(s)],o=old[group(s)];
 const a=play(s,model.weights,model.weights,'none','positions',false,
  0,'summon-only',2.35,['candidate','champion'],{bySide:[p,{}]},false);
 const b=play(s,model.weights,model.weights,'none','positions',false,
  0,'summon-only',2.35,['prior147','champion'],{bySide:[o,{}]},false);
 const c=play(s,model.weights,model.weights,'none','positions',false,
  -1,'none',2.35,['champion','champion'],{},false);
 const d=boss.byTier[s.tier]||(boss.byTier[s.tier]=
  {candidate:0,prior147:0,champion:0,games:0});
 boss.games++;d.games++;
 for(const [key,z] of [['candidate',a],['prior147',b],['champion',c]]){
  const win=Number(z.winner===0);boss[key]+=win;d[key]+=win;
 }
}
const league=[];
for(const expert of weightSets.slice(2)){
 let wins=0,games=0;
 for(const s of holdout.slice(0,config.league)){
  const p=selected[group(s)];
  const a=play(s,model.weights,expert.weights,'none','positions',
   false,0,'summon-only',2.35,['candidate','champion'],{bySide:[p,{}]},false);
  const b=play(s,expert.weights,model.weights,'none','positions',
   false,1,'summon-only',2.35,['champion','candidate'],{bySide:[{},p]},false);
  wins+=Number(a.winner===0)+Number(b.winner===1);games+=2;
 }
 league.push({name:expert.name,wins,games,rate:wins/games});
}
const totals={wins:0,games:0,interventions:0,evaluations:0,rejected:0};
for(const x of Object.values(holdByGroup))for(const k of Object.keys(totals))totals[k]+=x[k];
const promote=totals.wins/totals.games>=.53&&control.wins/control.games>=.56&&
 boss.candidate>=boss.champion&&league.every(x=>x.rate>=.45)&&
 Object.values(holdByGroup).every(x=>x.wins/x.games>=.45)&&totals.interventions>0;
const report={schema:'arcane-v148-real-legal-tactical-policy',
 status:'completed',commit:process.env.GITHUB_SHA||'unknown',
 historicalReports:history,
 policyEducation:['predator safe target and attack','guardian DEF and legal healing',
  'soul extraction and survival','fusion and material economy plus followup'],
 training:trainResults.map(x=>({group:x.group,variant:x.profile.name,
  wins:x.wins,games:x.games,evaluations:x.evaluations,
  interventions:x.interventions})),
 selected,
 independentByGroup:holdByGroup,
 vsPrior147:{wins:totals.wins,games:totals.games},
 vsChampion:control,boss,league,decisionStatistics:totals,
 promotionEligible:promote,productionIntegrated:false,
 method:'legal action simulated to exact next state in game engine, old v14.7 summoned policy preserved',
 limits:['not full multi-turn search','immediate board deltas not causal final outcomes',
  'original legal phase advance remains in engine',
  'private opponent cards not inspected',
  'earlier holdout results used for teaching priorities not action labels',
  'old champion frozen and production game unchanged']};
fs.mkdirSync('artifacts/v148',{recursive:true});
fs.writeFileSync('artifacts/v148/report.json',JSON.stringify(report,null,2)+'\n');
fs.writeFileSync('artifacts/v148/replays.json',JSON.stringify({
 schema:'arcane-v148-auditable-example-decisions',examples:evidence,
 note:'Source-legal and observed real game states; cannot infer optimal actions from single seeds'
},null,2)+'\n');
fs.writeFileSync('artifacts/v148/candidate.json',JSON.stringify({
 schema:'arcane-v148-research-only',profiles:selected,weights:model.weights,
 promotionEligible:promote,productionIntegrated:false},null,2)+'\n');
console.log('ARCANE_V148_SUMMARY '+JSON.stringify({
 training:report.training,independent:report.vsPrior147,
 champion:control,boss,league,decisionStatistics:totals,
 promote,productionIntegrated:false}));
\`;
new Function('require','process','console',script+run)(require,process,console);
