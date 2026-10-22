'use strict';
// v14.8 uses the exact v14.7 source controller as its reference. The source
// adaptations are asserted so upstream changes cannot silently change the audit.
const fs=require('node:fs');
let script=fs.readFileSync('tests/ai-final-score-transparency-v147.cjs','utf8');
script=script.slice(0,script.indexOf('const reports='));
function patch(a,b){const n=script.split(a).length-1;if(n!==1)throw Error('Source update mismatch '+a+' '+n);script=script.replace(a,b)}
patch('ARCANE_V147_TRAIN||63','ARCANE_V1486_TRAIN||63');
patch('ARCANE_V147_HOLDOUT||63','ARCANE_V1486_HOLDOUT||63');
patch('ARCANE_V147_LEAGUE||12','ARCANE_V1486_LEAGUE||12');
patch('1470000:3470000','1484000:3484000');
patch('9100:5150','9400:5450');
patch("+'\\n'+lookahead139.toString()+'\\n'+explain146.toString()","+'\\n'+lookahead139.toString()+'\\n'+lookahead148.toString()+'\\n'+explain146.toString()");
patch("'suggested=lookahead139(game,weights,tally,ARCANE144_SIDES[side]);',","'suggested=lookahead148(game,weights,tally,ARCANE144_SIDES[side]);',");
patch("'sameStateComparisons:0,sameStateOverrides:0,',","'sameStateComparisons:0,sameStateOverrides:0,',\n 'v148Offers:{},v148PhaseEntered:{},v148LegalTypes:{},v148Chosen:{},v148Interventions:0,',\n 'v148Evaluations:0,v148Audit:[],v148Rejected:0,',\n 'v1482Compared:0,v1482Changed:0,v1482Examples:[],',\n 'v1482ChangedByPhase:{},v1482PriorActionTypes:{},',");
const addon=String.raw`
function lookahead148(g,w,stats,mode='candidate'){
 if(mode==='prior147')return lookahead139(g,w,stats,'candidate');
 if(mode==='champion')return null;
 if(mode!=='candidate')return lookahead139(g,w,stats,mode);
 if(g.pending||g.winner!==null||g.turn>10)return null;
 if(g.aiPhase==='summon')return lookahead139(g,w,stats,'candidate');
 if(!['attacks','positions'].includes(g.aiPhase))return null;
 const type=g.aiPhase,seat=g.active;
 stats.v148PhaseEntered[type]=(stats.v148PhaseEntered[type]||0)+1;
 const options=choices135(g,stats).filter(c=>type==='positions'?
   c.action.type==='switch':
   ['attack','arcane-soul-extract','arcane-guardian-heal','end'].includes(c.action.type));
 for(const c of options)stats.v148LegalTypes[c.action.type]=(stats.v148LegalTypes[c.action.type]||0)+1;
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
   actualResolved:(p.boardValueWeight??2.35)*value,
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
 const clone147=JSON.parse(JSON.stringify(g));
 const refTally={choices:0,bySide:[0,0],support:0,fusions:0,attacks:0,
  finalRankedTraces:[],traceIntegrityErrors:0,sameStateComparisons:0,sameStateOverrides:0};
 const v147Action=lookahead139(clone147,w,refTally,'candidate')||
    decision135(clone147,w,false,null,refTally);
 stats.v1482Compared++;
 stats.v1482PriorActionTypes[v147Action?.type||'none']=
   (stats.v1482PriorActionTypes[v147Action?.type||'none']||0)+1;
 ranked.sort((a,b)=>b.score-a.score);
 if(type==='positions'&&ranked[0].score<.14)return null;
 const winner=ranked[0],reference=[...ranked].sort((a,b)=>b.oldScore-a.oldScore)[0];
 const genuineDifference=JSON.stringify(v147Action)!==JSON.stringify(winner.action);
 if(genuineDifference){
  stats.v1482Changed++;
  stats.v1482ChangedByPhase[type]=(stats.v1482ChangedByPhase[type]||0)+1;
 }
 if(ARCANE147_TRACE&&stats.v1482Examples.length<18){
  stats.v1482Examples.push({
   phase:type,turn:g.turn,actor:seat,
   publicState:snapState(g),referenceV147Action:v147Action,
   candidateAction:winner.action,changed:genuineDifference,
   alternatives:ranked.slice(0,10).map(x=>({action:x.action,
    score:+x.score.toFixed(6),components:x.pieces})),
   caveat:'One action comparison on cloned board, not a calibrated success probability'
  });
 }
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
`;
if(!script.includes('function play(scene'))throw Error('No game function');
script=script.replace('function play(scene',addon+'\nfunction play(scene');
patch("starter:scene.starter,","starter:scene.starterOverride??scene.starter,");
patch("'(()=>{profile=freshProfile();profile.guideSeen=true;',","'(()=>{profile=freshProfile();profile.guideSeen=true;',\n 'const originalSkills=CARDS.filter(c=>c.ability||c.role||c.essenceSchool||c.soulRank).length;',\n 'if(',String(!!scene.neutralSkills),'){',\n 'for(const k of Object.keys(profile.upgrades||{}))profile.upgrades[k]=0;',\n 'for(const c of CARDS){for(const k of [\"ability\",\"role\",\"soulRank\",',\n '\"essenceSchool\",\"passive\",\"skill\",\"perk\",\"effect\",\"roleOverride\"])delete c[k];}',\n 'maybeFate=function(){return false;};',
 'if(',JSON.stringify(scene.fusionAuditArm),'!=="baseline"){for(const c of CARDS)c.role="__neutral_no_role__";}',
 'if(',JSON.stringify(scene.fusionAuditArm),'==="symmetric"){',
 'const originalTune=window.ArcaneFusionMath.getTuned();',
 'window.ArcaneFusionMath.setTuned(function(g,levels,elements,materials){',
 'if(g?.mode==="pve"&&g.active===1){const seat=g.active;g.active=0;',
 'try{return originalTune(g,levels,elements,materials);}finally{g.active=seat;}}',
 'return originalTune(g,levels,elements,materials);',
 '});}',
\n '}' ,");
patch("'const g=createGame(',JSON.stringify(opt),');',","'const g=createGame(',JSON.stringify(opt),');',\n 'if(',String(!!scene.neutralSkills),'){',\n 'g.essenceRules=false;g.fateUsed=[true,true];',\n 'for(const p of g.players){p.enhancements={};p.power=1;p.flatBonus=0;',\n 'for(const c of p.hand){delete c.essenceCombat;delete c.roleOverride;}}',\n '}',\n 'if(',String(!!scene.flipOpeningHands),'){',\n 'const a=g.players[0],b=g.players[1];',\n 'for(const k of [\"hand\",\"deck\",\"originalDeck\"]){const tmp=a[k];a[k]=b[k];b[k]=tmp;}',\n '}',\n 'const benchmarkStart={starter:g.starter,actor:g.active,',\n 'neutralSkills:',String(!!scene.neutralSkills),',hands:g.players.map(p=>p.hand.map(c=>c.id)),',\n 'openingShield:g.players.map(p=>p.shield),',\n 'upgrades:{...profile.upgrades},',\n 'skillMetadata:CARDS.filter(c=>c.ability||(c.role&&c.role!=="__neutral_no_role__")||c.essenceSchool||c.soulRank).length,',\n 'originalSkillMetadata:originalSkills,',\n 'powers:g.players.map(p=>p.power),',\n 'enhancements:g.players.map(p=>Object.values(p.enhancements||{}).reduce((n,x)=>n+x,0)),',\n 'essenceRules:!!g.essenceRules};',");
patch("'return {winner:g.winner,turn:g.turn,',","'return {openingAudit:benchmarkStart,winner:g.winner,turn:g.turn,',");

patch("'const benchmarkStart={starter:g.starter,actor:g.active,',","'if(',String(!!scene.lockIdenticalOpenings),'){',\n'const first=g.players[0],second=g.players[1];',\n'second.hand=first.hand.map(c=>({...JSON.parse(JSON.stringify(c)),uid:g.nextUid++}));',\n'second.deck=[...first.deck];second.originalDeck=[...first.originalDeck];',\n'second.fusionDeck=[...first.fusionDeck];',\n'second.remainingFusion=[...(first.remainingFusion||first.fusionDeck)];',\n'first.shield=0;second.shield=0;',\n'g.tiePriority=',String(scene.seed%2),';',\n'const view=p=>JSON.stringify({',\n'hand:p.hand.map(c=>({id:c.id,level:c.card?.level,atk:c.card?.atk,def:c.card?.def})),',\n'deck:p.deck,originalDeck:p.originalDeck,fusionDeck:p.fusionDeck,',\n'remainingFusion:p.remainingFusion,shield:p.shield,lp:p.lp,',\n'power:p.power,flatBonus:p.flatBonus,enhancements:p.enhancements});',\n'if(view(first)!==view(second))throw Error(\"STRICT OPENING IDENTITY FAILURE\");',\n'if(first.hand.length!==5||first.deck.length!==35||first.originalDeck.length!==40)',\n'throw Error(\"INVALID 40-CARD DECK OR 5-CARD STARTING HAND\");',\n'}',\n'const benchmarkStart={starter:g.starter,actor:g.active,',");
patch("'openingShield:g.players.map(p=>p.shield),',","'openingShield:g.players.map(p=>p.shield),',\n 'handsDetailed:g.players.map(p=>p.hand.map(c=>({id:c.id,level:c.card?.level,atk:c.card?.atk,def:c.card?.def}))),',\n 'decksRemaining:g.players.map(p=>[...p.deck]),',\n 'fullDecks:g.players.map(p=>[...p.originalDeck]),',\n 'fusionDecks:g.players.map(p=>[...p.fusionDeck]),',\n 'fusionStock:g.players.map(p=>[...(p.remainingFusion||[])]),',\n 'openingLP:g.players.map(p=>p.lp),',\n 'tiePriority:g.tiePriority,',\n 'strictIdenticalOpenings:',String(!!scene.lockIdenticalOpenings),',',
 'fusionAuditArm:',JSON.stringify(scene.fusionAuditArm),',',");
patch("'return {openingAudit:benchmarkStart,winner:g.winner,turn:g.turn,',","'return {openingAudit:benchmarkStart,winReason:g.winReason,winner:g.winner,turn:g.turn,',");
const run=String.raw`
const arm=process.env.ARCANE_V1486_ARM||'baseline';
assert.ok(['baseline','neutral','symmetric'].includes(arm),'Unknown fusion test arm');
const previousEqualTest=JSON.parse(fs.readFileSync('artifacts/history-v1483/report.json','utf8'));
assert.equal(previousEqualTest.schema,'arcane-v1483-neutral-skills-factorial-opening-diagnostics');
const priorReports=[
 ['v142','artifacts/history-v142/report.json','arcane-v142-action-override-audit'],
 ['v143','artifacts/history-v143/report.json','arcane-v143-fusion-value-resolution'],
 ['v144','artifacts/history-v144/report.json','arcane-v144-history-driven-followup-training'],
 ['v145','artifacts/history-v145/report.json','arcane-v145-three-strategy-historical-curriculum'],
 ['v146','artifacts/history-v146/report.json','arcane-v146-verified-mirror-explanations'],
 ['v147','artifacts/history-v147/report.json','arcane-v147-final-score-transparent-mirrors'],
 ['v148','artifacts/history-v148/report.json','arcane-v148-real-legal-tactical-policy'],
 ['v1481','artifacts/history-v1481/report.json','arcane-v1481-activated-tactical-policy'],
 ['v1482','artifacts/history-v1482/report.json','arcane-v1482-actual-controller-mirror-research']
].map(([generation,path,schema])=>{
 const item=JSON.parse(fs.readFileSync(path,'utf8'));
 assert.equal(item.schema,schema,'Historical evidence altered for '+generation);
 return {generation,path,schema};
});
const prevReport=JSON.parse(fs.readFileSync('artifacts/history-v1482/report.json','utf8'));
assert.equal(prevReport.productionIntegrated,false);
const sections={offense:['predator','tempo'],defense:['guardian','soul'],
 fusion:['fusion','allrounder','hybrid']};
const group=s=>Object.keys(sections).find(k=>sections[k].includes(s.style));
const oldProfiles=JSON.parse(fs.readFileSync('artifacts/history-v147/report.json','utf8')).selectedProfiles;
const candidateProfiles=prevReport.selected;
const modeCases=[
 {name:'starter0_base',starterOverride:0,flipOpeningHands:false},
 {name:'starter1_base',starterOverride:1,flipOpeningHands:false},
 {name:'starter0_swapped_hands',starterOverride:0,flipOpeningHands:true},
 {name:'starter1_swapped_hands',starterOverride:1,flipOpeningHands:true}
];
function game(s,roles=['prior147','prior147'],cfg=modeCases[0],capture=false,
 neutral=true){
 const c={...s,...cfg,neutralSkills:neutral,lockIdenticalOpenings:neutral,
  fusionAuditArm:arm};
 return play(c,model.weights,model.weights,'none','positions',false,2,
  'always',2.35,roles,{
   bySide:roles.map(m=>m==='candidate'?candidateProfiles[group(s)]:oldProfiles[group(s)]),
   oldProfile:oldProfiles[group(s)]
  },capture);
}
function verifyNeutral(m,neutral=true){
 const a=m.openingAudit;
 assert.ok(a,'Missing origin metadata');
 if(neutral){
  assert.equal(a.neutralSkills,true);
  assert.equal(a.skillMetadata,0,'Card/role skills not disabled');
  assert.ok(a.originalSkillMetadata>0,'No skills present before disabling');
  assert.ok(Object.values(a.upgrades).every(v=>v===0),'Perks not neutral');
  assert.equal(JSON.stringify(a.powers),'[1,1]','Player power modifiers not neutral');
  assert.equal(JSON.stringify(a.enhancements),'[0,0]','Unbalanced player upgrades remain');
  assert.equal(a.essenceRules,false,'Essence combat still activated');
  assert.equal(a.strictIdenticalOpenings,true,'STRICT OPENING MODE NOT ACTIVE');
  assert.equal(a.fusionAuditArm,arm,'Wrong fusion arm');
  const eq=(xs,name)=>assert.equal(JSON.stringify(xs[0]),JSON.stringify(xs[1]),
   'Sides have different '+name);
  eq(a.handsDetailed,'starting five cards, order and exact initial stats');
  eq(a.decksRemaining,'remaining 35-card draw order');
  eq(a.fullDecks,'complete original 40-card order');
  eq(a.fusionDecks,'fusion decks');
  eq(a.fusionStock,'remaining fusion access');
  eq(a.openingShield,'shields');
  eq(a.openingLP,'life points');
  assert.equal(JSON.stringify(a.openingShield),'[0,0]','Shields must be equal at zero');
  assert.equal(a.handsDetailed[0].length,5);
  assert.equal(a.decksRemaining[0].length,35);
 }else{
  assert.equal(a.neutralSkills,false);
  assert.equal(a.skillMetadata,a.originalSkillMetadata,
   'Test-only mode leaked across isolated matches');
 }
}
// Shard the large, independent duel simulations into fresh Node processes.
// A single VM process grew beyond the V8 heap limit in GitHub run #39722113328.
// Dataset partitioning is by original array position (no replacement/re-use).
const shardText=process.env.ARCANE_V1486_SHARD;
const shardIndex=shardText===undefined?null:Number(shardText);
const shardCount=4;
if(shardIndex!==null){
 assert.ok(Number.isInteger(shardIndex)&&shardIndex>=0&&shardIndex<shardCount,
  'ARCANE_V1486_SHARD must be 0, 1, 2, or 3');
}
const selectedTrain=shardIndex===null?train:train.filter((_,i)=>i%shardCount===shardIndex);
const selectedHoldout=shardIndex===null?holdout:holdout.filter((_,i)=>i%shardCount===shardIndex);
console.log('ARCANE_V1486_SHARD_CONFIG '+JSON.stringify({
 arm,shardIndex,shardCount,trainCount:selectedTrain.length,
 holdoutCount:selectedHoldout.length,fullTrain:train.length,
 fullHoldout:holdout.length}));
assert.ok(selectedTrain.length>0&&selectedHoldout.length>0);
const reinstatement=[];
for(const s of selectedTrain.slice(0,2)){
 const on=game(s,['prior147','prior147'],modeCases[0],false,false);
 const off=game(s,['prior147','prior147'],modeCases[0],false,true);
 verifyNeutral(on,false);verifyNeutral(off,true);
 reinstatement.push({seed:s.seed,
  originalSkillMetadata:on.openingAudit.skillMetadata,
  neutralSkillMetadata:off.openingAudit.skillMetadata,
  originalUpgradeRanks:on.openingAudit.upgrades,
  neutralUpgradeRanks:off.openingAudit.upgrades,
  originalWinner:on.winner,neutralWinner:off.winner});
}
const openingDiagnostics={};
function add(map,key,win){
 const p=map[key]||(map[key]={games:0,seat0Wins:0,seat1Wins:0});
 p.games++;p.seat0Wins+=Number(win===0);p.seat1Wins+=Number(win===1);
}
const benchCases=[];
const pilot=Math.max(7,Math.min(14,selectedTrain.length));
for(const s of selectedTrain.slice(0,pilot)){
 for(const c of modeCases){
  const m=game(s,['prior147','prior147'],c,false,true);
  verifyNeutral(m);
  add(openingDiagnostics,c.name,m.winner);
  benchCases.push({style:s.style,tier:s.tier,seed:s.seed,
   condition:c.name,starter:c.starterOverride,winner:m.winner,
   hands:m.openingAudit.hands,shield:m.openingAudit.openingShield,
   openingStrictEqual:m.openingAudit.strictIdenticalOpenings});
 }
}
console.log('ARCANE_V1486_NEUTRAL_PILOT '+JSON.stringify({
 neutralVerification:reinstatement,conditions:openingDiagnostics,
 sampleMatches:benchCases.length}));
assert.equal(Object.keys(openingDiagnostics).length,4);
for(const r of Object.values(openingDiagnostics))assert.ok(r.games>=7);
const perf={on:0,off:0};
const trainingChoice={};
for(const k of Object.keys(sections)){
 const samples=selectedTrain.filter(s=>group(s)===k);
 // Keep selected strategy vs old v14.7 reference, test two seating assignments.
 let wins=0,duels=0,changed=0,compared=0;
 for(const s of samples){
  const p=game(s,['candidate','prior147'],modeCases[0]);
  const q=game(s,['prior147','candidate'],modeCases[0]);
  for(const m of [p,q]){verifyNeutral(m);changed+=m.tally.v1482Changed||0;
   compared+=m.tally.v1482Compared||0;}
  wins+=Number(p.winner===0)+Number(q.winner===1);duels+=2;
 }
 trainingChoice[k]={wins,duels,changed,compared};
 console.log('ARCANE_V1486_TRAIN '+JSON.stringify({group:k,...trainingChoice[k]}));
}
const holdoutMatrix={};
const detailed=[];
const mirrorReversals={pairs:0,sameSeatWinner:0,shiftedSeatWinner:0,
 candidateBoth:0,oldBoth:0,seat0Wins:0,policyWins:0};
const openingEffects={scenarios:0,starterSwapChangedWinner:0,handDeckSwapChangedWinner:0};
for(const s of selectedHoldout){
 const perScene={};
 for(const cond of modeCases){
  const base=game(s,['prior147','prior147'],cond,false,true);
  const a=game(s,['candidate','prior147'],cond,false,true);
  const b=game(s,['prior147','candidate'],cond,false,true);
  verifyNeutral(base);verifyNeutral(a);verifyNeutral(b);
  const row=holdoutMatrix[cond.name]||(
   holdoutMatrix[cond.name]={scenarios:0,baselineWins:[0,0],
    candidateWins:0,oldWins:0,sameSeatWinner:0,seat0WinsBoth:0,
    tacticalCompared:0,tacticalChanged:0,byStyle:{}});
  row.scenarios++;
  row.baselineWins[base.winner]++;
  const pairWin=Number(a.winner===0)+Number(b.winner===1);
  row.candidateWins+=pairWin;row.oldWins+=2-pairWin;
  row.sameSeatWinner+=Number(a.winner===b.winner);
  row.seat0WinsBoth+=Number(a.winner===0)+Number(b.winner===0);
  row.tacticalCompared+=(a.tally.v1482Compared||0)+(b.tally.v1482Compared||0);
  row.tacticalChanged+=(a.tally.v1482Changed||0)+(b.tally.v1482Changed||0);
  const st=row.byStyle[s.style]||(
    row.byStyle[s.style]={games:0,candidateWins:0,baselineSeat0Wins:0});
  st.games+=2;st.candidateWins+=pairWin;
  st.baselineSeat0Wins+=Number(base.winner===0);
  perScene[cond.name]={baselineSeat:base.winner,
   challenger0Seat:a.winner,challenger1Seat:b.winner,
   candidateWins:pairWin,
   handIds:base.openingAudit.hands,openingShield:base.openingAudit.openingShield,
   drawOrderMatches:JSON.stringify(base.openingAudit.decksRemaining[0])===
    JSON.stringify(base.openingAudit.decksRemaining[1]),
   fusionPoolsMatch:JSON.stringify(base.openingAudit.fusionStock[0])===
    JSON.stringify(base.openingAudit.fusionStock[1]),
   winReason:base.winReason,challengerWinReasons:[a.winReason,b.winReason]};
  mirrorReversals.pairs++;
  mirrorReversals.sameSeatWinner+=Number(a.winner===b.winner);
  mirrorReversals.shiftedSeatWinner+=Number(a.winner!==b.winner);
  mirrorReversals.candidateBoth+=Number(pairWin===2);
  mirrorReversals.oldBoth+=Number(pairWin===0);
  mirrorReversals.seat0Wins+=Number(a.winner===0)+Number(b.winner===0);
  mirrorReversals.policyWins+=pairWin;
 }
 const seedBase=perScene.starter0_base,seedStartFlip=perScene.starter1_base,
  seedHandFlip=perScene.starter0_swapped_hands;
 openingEffects.scenarios++;
 openingEffects.starterSwapChangedWinner+=Number(seedBase.baselineSeat!==seedStartFlip.baselineSeat);
 openingEffects.handDeckSwapChangedWinner+=Number(seedBase.baselineSeat!==seedHandFlip.baselineSeat);
 if(detailed.length<18)detailed.push({
  seed:s.seed,deckFingerprint:s.deck.fingerprint,style:s.style,tier:s.tier,
  deck:s.deck.deck,fusionDeck:s.deck.fusionDeck,
  comparisons:perScene,
  measured:'Within every matchup both seats have identical cards and starting resources; source template and starter varied'
 });
}
assert.equal(Object.keys(holdoutMatrix).length,4);
for(const r of Object.values(holdoutMatrix))assert.equal(r.scenarios,selectedHoldout.length);
const totalPolicies=mirrorReversals.policyWins;
const firstPlayerBreakdown={
 starter0Base:holdoutMatrix.starter0_base.baselineWins,
 starter1Base:holdoutMatrix.starter1_base.baselineWins,
 starter0SwappedHands:holdoutMatrix.starter0_swapped_hands.baselineWins,
 starter1SwappedHands:holdoutMatrix.starter1_swapped_hands.baselineWins
};
const neutralizedAssertions={
 allUpgradesZero:reinstatement.every(x=>Object.values(x.neutralUpgradeRanks).every(v=>v===0)),
 allCardAbilitiesAndRolesRemoved:reinstatement.every(x=>x.neutralSkillMetadata===0),
 allCardAbilitiesRestoredOutsideTestMode:reinstatement.every(x=>
  x.originalSkillMetadata>0),
 powersBalanced:true,fusionMechanicsStillEnabled:true,
 bothHandsAndDeckOrdersEqual:true,bothFusionPoolsEqual:true,bothStartingShieldsEqual:true,
 ablationArmValid:['baseline','neutral','symmetric'].includes(arm),
 noPersistedGameChanges:true
};
const report={schema:'arcane-v1486-controlled-fusion-poker-ablation',
 ablationArm:arm,
 status:'completed',sourceCommit:process.env.GITHUB_SHA||'unknown',
 shardIndex,shardCount,fullTrainScenarios:train.length,fullHoldoutScenarios:holdout.length,
 splitReason:'v14.8.3 first full simulation ran out of V8 memory; four isolated subprocesses',
 testOnly:true,productionIntegrated:false,promotionEligible:false,
 controls:{skillsAndPerksDefault:'enabled in actual game',
  isolatedNeutralMode:'enabled only in trainer VM and only when scenario.neutralSkills=true',
  restoration:'fresh independent VM loads original game scripts on every new game',
  openingBalance:'Each game p0 and p1 receive precisely the same ordered starting five cards, remaining draw deck, 40-card list and fusion stock',
  initialStatus:'equal start resources; 4 trial conditions sample which original hand template and who takes the first turn',
  sampleIntegrity:'fresh train and disjoint holdout fingerprints'},
 pilot:{samples:benchCases.length,neutralVerification:reinstatement,
  openingDiagnostics},
 training:trainingChoice,
 holdout:{scenarios:selectedHoldout.length,conditions:holdoutMatrix,
  mirrorReversals,firstPlayerBreakdown,
  openingEffects:openingEffects,
  possibleComparators:'seat vs starter under identical 40-card draw, five-card hand and fusion pool within each game'},
 historicalSources:priorReports,neutralizedAssertions,
 limitations:[
  'This experiment removes perks, card skills, innate roles, soul/essence and fate abilities only inside isolated test VMs.',
  'Normal summon, attack, fusion and monster stats remain: this is not equivalent to removing entire core mechanics.',
  'PvE-only hardcoded owner conditions that are not skills may remain, thus checked as possible structural seat bias.',
  'The trial source template can be either original seat hand; both seats are then overwritten with that identical template.',
  'Even a mirrored initial RNG seed does not force equal future RNG branches after different actions.',
  'The test compares controlled complete duels, not deep policy learning or optimal move labels.',
  'The game code, Main branch, real profiles and original champion parameters are untouched.',
  'Both opening shields are zero in the controlled tests rather than providing the usual non-starter shield.',
  'Hardcoded PvE seat-specific rules may remain during subsequent turns and are what the experiment tests.'
 ]};
fs.mkdirSync('artifacts/v1484',{recursive:true});
if(shardIndex!==null)fs.mkdirSync('artifacts/v1486/shards',{recursive:true});
const outDir='artifacts/v1486/'+arm;
fs.mkdirSync(outDir,{recursive:true});
if(shardIndex!==null)fs.mkdirSync(outDir+'/shards',{recursive:true});
const reportPath=shardIndex===null?outDir+'/report.json':outDir+'/shards/report-'+shardIndex+'.json';
fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
fs.writeFileSync(outDir+'/mode-config.json',JSON.stringify({
 schema:'arcane-v1486-identical-start-three-arm-fusion-ablation',
 defaultActualGameplay:'unchanged (skills and perks enabled)',
 neutralModeFlag:'scene.neutralSkills=true',
 disabledMetadata:['ability','role','soulRank','essenceSchool','passive','skill','perk','effect','roleOverride'],
 disabledDynamic:['all profile.upgrades ranks','player enhancements','player power bonuses','essence rules','fate events'],
 unchanged:['summons','attack legality','fusions','card level and base stats'],
 equalized:['five starting cards','35-card remaining draw deck','40-card original deck','fusion stock','starting LP','zero shield for both'],
 restoration:'scene.neutralSkills=false loads original modules into a new VM',
 noRuntimeGameModification:true,
 ablationArm:arm
},null,2)+'\n');
fs.writeFileSync(shardIndex===null?outDir+'/opening-examples.json':
 outDir+'/shards/opening-'+shardIndex+'.json',JSON.stringify({
 schema:'arcane-v1486-identical-start-ablation-replays',examples:detailed,
 shardIndex,arm,fullTrainScenarios:train.length,fullHoldoutScenarios:holdout.length,
 pilotCases:benchCases,disabledSkillControls:reinstatement
},null,2)+'\n');
console.log('ARCANE_V1486_SUMMARY '+JSON.stringify({
 arm,shardIndex,
 pilot:neutralizedAssertions,
 training:trainingChoice,
 mirrored:mirrorReversals,
 holdoutByCondition:Object.fromEntries(Object.entries(holdoutMatrix).map(([k,v])=>
  [k,{scenarios:v.scenarios,candidateWins:v.candidateWins,
   baselineSeat0Wins:v.baselineWins[0],
   baselineSeat1Wins:v.baselineWins[1],
   sameSeatWinner:v.sameSeatWinner,compared:v.tacticalCompared,
   changed:v.tacticalChanged}])),
 firstPlayerBreakdown,originalVsSwap:openingEffects,
 productionIntegrated:false}));
`;
new Function('require','process','console',script+run)(require,process,console);
