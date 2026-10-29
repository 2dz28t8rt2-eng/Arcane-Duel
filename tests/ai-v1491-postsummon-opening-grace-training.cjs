'use strict';
/* v14.9.1 – research only, never edits the playable NPC AI or main.
 * Matched grace A/B + active guardian/soul combo probe + post-summon planner.
 */
const fs=require('node:fs'),assert=require('node:assert/strict');
const {boot}=require('./helpers/game-runtime.cjs');

function roleProbe1491(){
 profile=freshProfile();profile.guideSeen=true;
 const ids={guardian:CARDS.filter(c=>c.role==='guardian'&&!c.fusionOnly&&!c.ace).map(c=>c.id),
  soul:CARDS.filter(c=>c.role==='soul'&&!c.fusionOnly&&!c.ace).map(c=>c.id)};
 if(!ids.guardian.length||!ids.soul.length)throw Error('Guardian/soul ordinary monster unavailable');
 function scenario(withGuard){
  const g=createGame({mode:'pve',context:'free',opponentId:1,seed:1491700,starter:0});
  g.essenceRules=true;g.turn=4;g.active=1;g.pending=null;g.winner=null;g.fateUsed=[true,true];
  const soul=newInstance(g,ids.soul[0],0),guard=newInstance(g,ids.guardian[0],0);
  soul.mode='def';guard.mode='def';soul.summonedTurn=1;guard.summonedTurn=1;
  const max=soul.card.def;
  window.ArcaneEssenceCombat.statLayer(soul); // snapshot true maximum BEFORE applying the simulated wound
  soul.card.def=Math.max(5,max-270);
  g.players[0].field=[soul,withGuard?guard:null,null,null,null];
  g.players[1].field.fill(null);
  const before=soul.card.def;
  const ok=advanceTurn(g);
  if(!ok)throw Error('Real role combo did not advance');
  return {before,after:soul.card.def,delta:soul.card.def-before,
   guardian:withGuard,essenceRules:g.essenceRules,
   actualRoles:[CARDS[soul.id].role,CARDS[guard.id].role]};
 }
 return {actualRolesEnabled:true,ordinaryCards:{guardian:ids.guardian.length,soul:ids.soul.length},
  mixed:scenario(true),solo:scenario(false)};
}
function lookahead1491(g,w,stats,mode='candidate'){
 if(mode!=='candidate'||g.pending||g.winner!==null||g.turn>9||
    !['positions','attacks'].includes(g.aiPhase))
  return lookahead1488(g,w,stats,mode);
 const phase=g.aiPhase,actor=g.active;
 const old=lookahead1488(g,w,stats,mode);
 const options=choices135(g,stats).filter(x=>phase==='positions'?
  x.action.type==='switch':
  ['attack','arcane-soul-extract','arcane-guardian-heal','end'].includes(x.action.type));
 if(g.summoned)stats.v1491AfterSummon=(stats.v1491AfterSummon||0)+1;
 const ranked=options.map(x=>({action:x.action,
  linear:x.base+x.features.reduce((v,f,i)=>v+f*w[i],0)}))
  .sort((a,b)=>b.linear-a.linear).slice(0,10);
 if(ranked.length<2)return old;
 const base=boardValue139(g,actor),danger=tacticalThreat144(g,actor);
 const cfg=ARCANE1491_CONFIG||{},weight=Number(cfg.replyWeight)||.5,scored=[];
 for(const x of ranked){
  const next=JSON.parse(JSON.stringify(g));
  let ok=false;try{ok=!!applyAiAction(next,x.action)}catch(e){}
  if(!ok)continue;
  const gain=boardValue139(next,actor)-base;
  const saved=danger-tacticalThreat144(next,actor);
  let following=0;
  if(phase==='attacks'&&x.action.type==='attack'&&next.winner===null){
   for(const c of choices135(next,stats).filter(k=>[
    'attack','arcane-soul-extract','arcane-guardian-heal'].includes(k.action.type)).slice(0,4)){
    const trial=JSON.parse(JSON.stringify(next));
    try{if(!applyAiAction(trial,c.action))continue;
      following=Math.max(following,boardValue139(trial,actor)-boardValue139(next,actor));
    }catch(e){}
   }
  }
  const reply=visibleReply1487(next,actor,1);
  const dmg=Math.max(0,g.players[1-actor].lp-next.players[1-actor].lp);
  const score=.12*x.linear+2.7*gain+.65*following+.4*saved+
   .3*dmg/300-weight*reply.penalty+
   (next.winner===actor?300:next.winner===1-actor?-300:0)+
   (x.action.type==='end'?-.12:0);
  scored.push({action:x.action,score,gain,following,saved,reply:reply.penalty});
 }
 if(!scored.length)return old;
 scored.sort((a,b)=>b.score-a.score);
 if(phase==='positions'&&scored[0].score<.14)return old;
 const selected=scored[0].action,changed=JSON.stringify(old)!==JSON.stringify(selected);
 stats.v1491Evaluations=(stats.v1491Evaluations||0)+1;
 stats.v1491Options=(stats.v1491Options||0)+scored.length;
 if(changed)stats.v1491Changed=(stats.v1491Changed||0)+1;
 if(changed&&g.summoned)stats.v1491ChangedAfterSummon=(stats.v1491ChangedAfterSummon||0)+1;
 if(ARCANE147_TRACE){
  const ex=stats.v1491Examples||(stats.v1491Examples=[]);
  if(ex.length<10)ex.push({phase,turn:g.turn,afterSummon:!!g.summoned,
   publicState:snapState(g),previous:old,selected,changed,
   evaluated:scored.slice(0,6).map(x=>({...x,score:+x.score.toFixed(5)}))});
 }
 return selected;
}
function run1491(){
 const old=JSON.parse(fs.readFileSync('artifacts/history-v147/report.json','utf8'));
 assert.equal(old.schema,'arcane-v147-final-score-transparent-mirrors');
 const profiles=old.selectedProfiles;
 const groups={offense:['predator','tempo'],defense:['guardian','soul'],
  fusion:['fusion','allrounder','hybrid']};
 const group=s=>Object.keys(groups).find(k=>groups[k].includes(s.style));
 const seven=['predator','guardian','fusion','soul','allrounder','tempo','hybrid'];
 const ts=train.filter((_,i)=>i%3===0).slice(0,7),hs=holdout.slice(0,21);
 assert.deepEqual([...new Set(ts.map(x=>x.style))].sort(),[...seven].sort());
 assert.deepEqual([...new Set(hs.map(x=>x.style))].sort(),[...seven].sort());
 assert.equal(new Set([...ts,...hs].map(s=>s.deck.fingerprint)).size,28);
 assert.ok(ROLE_PROBE.actualRolesEnabled);
 assert.ok(ROLE_PROBE.mixed.delta>ROLE_PROBE.solo.delta,
  'Guardians must truly heal their Soul partner in enabled role probe');
 const starts=[{starterOverride:0,flipOpeningHands:false,name:'starter0'},
  {starterOverride:1,flipOpeningHands:false,name:'starter1'}];
 function game(s,roles,grace,c,risk,trace=false){
  const scene={...s,...c,neutralSkills:true,
   lockIdenticalOpenings:true,fusionAuditArm:'symmetric',
   openingDecayGrace:grace,policy1487:{risk:.2},
   policy1488:{materialCost:.35},policy1491:{replyWeight:risk}};
  const m=play(scene,model.weights,model.weights,'none','positions',false,
   2,'always',2.35,roles,{bySide:roles.map(()=>profiles[group(s)]),
    oldProfile:profiles[group(s)]},trace);
  const a=m.openingAudit;
  assert.ok(a?.strictIdenticalOpenings);
  assert.equal(a.skillMetadata,0);assert.equal(a.fusionAuditArm,'symmetric');
  assert.deepEqual(a.openingShield,[0,0]);
  for(const k of ['handsDetailed','decksRemaining','fusionStock'])
   assert.equal(JSON.stringify(a[k][0]),JSON.stringify(a[k][1]),'Mismatch '+k);
  assert.equal(m.invalid,0);
  return m;
 }
 function paired(s,c,grace,risk,trace){
  const a=game(s,['candidate','prior147'],grace,c,risk,trace);
  const b=game(s,['prior147','candidate'],grace,c,risk,trace);
  const sum=k=>(a.tally[k]||0)+(b.tally[k]||0);
  return {games:2,wins:Number(a.winner===0)+Number(b.winner===1),
   seat0Wins:Number(a.winner===0)+Number(b.winner===0),
   starterWins:Number(a.winner===c.starterOverride)+Number(b.winner===c.starterOverride),
   afterSummon:sum('v1491AfterSummon'),evaluations:sum('v1491Evaluations'),
   changed:sum('v1491Changed'),changedAfterSummon:sum('v1491ChangedAfterSummon'),
   options:sum('v1491Options'),invalid:a.invalid+b.invalid,
   examples:trace?[...(a.tally.v1491Examples||[]),...(b.tally.v1491Examples||[])].slice(0,6):[]};
 }
 function agg(rows){
  const keys=['games','wins','seat0Wins','starterWins','afterSummon','evaluations',
   'changed','changedAfterSummon','options','invalid'];
  const r=Object.fromEntries(keys.map(k=>[k,rows.reduce((v,x)=>v+(x[k]||0),0)]));
  return {...r,winRate:r.games?r.wins/r.games:0,
   starterWinRate:r.games?r.starterWins/r.games:0};
 }
 const trials=[.25,.8].map(risk=>{
  const rows=[];for(const s of ts)for(const c of starts)
   rows.push(paired(s,c,false,risk,false));
  return {risk,...agg(rows)};
 }).sort((a,b)=>b.winRate-a.winRate||a.risk-b.risk);
 const chosen=trials[0].risk;
 console.log('ARCANE_V1491_TRAIN '+JSON.stringify({selectedRisk:chosen,trials}));
 fs.mkdirSync('artifacts/v1491',{recursive:true});
 fs.writeFileSync('artifacts/v1491/selection.json',JSON.stringify({
  selectedRisk:chosen,trials,selectedBeforeHoldout:true,
  trainFingerprints:ts.map(s=>s.deck.fingerprint)},null,2)+'\n');
 const rows=[],control=[];
 for(const s of hs)for(const c of starts)for(const grace of [false,true]){
  const m=paired(s,c,grace,chosen,rows.length<6);
  rows.push({style:s.style,seed:s.seed,fingerprint:s.deck.fingerprint,
   starter:c.starterOverride,grace,...m});
  const base=game(s,['prior147','prior147'],grace,c,chosen,false);
  control.push({style:s.style,seed:s.seed,starter:c.starterOverride,
   grace,winner:base.winner});
 }
 assert.equal(rows.length,84);assert.equal(control.length,84);
 const byGrace=Object.fromEntries([false,true].map(grace=>{
  const selected=rows.filter(x=>x.grace===grace);
  const mirror=control.filter(x=>x.grace===grace);
  return [String(grace),{...agg(selected),baseline:{
   games:mirror.length,starterWins:mirror.filter(x=>x.winner===x.starter).length,
   seat0Wins:mirror.filter(x=>x.winner===0).length}}];
 }));
 assert.equal(byGrace.true.games,84);assert.equal(byGrace.false.games,84);
 const byStyle=Object.fromEntries(seven.map(style=>[style,
  Object.fromEntries([false,true].map(grace=>[String(grace),
   agg(rows.filter(x=>x.style===style&&x.grace===grace))]))]));
 for(const style of seven)assert.equal(byStyle[style].true.games,12);
 const report={schema:'arcane-v1491-symmetric-opening-grace-postsummon-research',
  sourceCommit:process.env.GITHUB_SHA||'unknown',status:'completed',
  productionIntegrated:false,championPromoted:false,promotionEligible:false,
  selectedRisk:chosen,training:trials,
  holdout:{byGrace,byStyle,examples:rows.flatMap(r=>r.examples).slice(0,25)},
  guardianSoulActiveRuleProbe:ROLE_PROBE,
  controls:{trainScenes:7,holdoutScenes:21,matchedHoldoutGames:168,
   baselineVsBaselineGames:84,strictIdenticalOpenings:true,
   symmetricFusion:true,neutralSkillsInMirror:true,actualRoleProbeSeparate:true,
   bothStartSeats:true,bothPolicySeats:true,testOnlyGraceFlag:true},
  limitations:[
   'Live guardian/soul role interaction was measured separately, not inferred from a neutralized soul-only win rate.',
   'Active-role mixed-deck win rates were not established by these skill-neutralized mirror matches.',
   'The grace flag is disabled in production gameplay and only set per test game.',
   'Opponent hidden hands/draws are not modeled by the post-summon policy.',
   'Mirrored test games share deck and seed and cannot be treated as fully independent samples.',
   'This is parameter selection with engine rollouts, not continuously learned neural weights.'
  ]};
 fs.writeFileSync('artifacts/v1491/report.json',JSON.stringify(report,null,2)+'\n');
 console.log('ARCANE_V1491_RESULT '+JSON.stringify({
  selectedRisk:chosen,training:trials,byGrace,roleProbe:ROLE_PROBE,
  productionIntegrated:false}));
}
const probe=boot({seed:1491008}).run('('+roleProbe1491.toString()+')()');
assert.equal(probe.actualRolesEnabled,true);
const original=fs.readFileSync('tests/ai-v1486-three-arm-symmetric-training.cjs','utf8');
const cutoff=original.indexOf('const run=String.raw');
assert.ok(cutoff>0);
const prelude=original.slice(0,cutoff);
const v1487=fs.readFileSync('tests/ai-v1487-two-ply-training.cjs','utf8');
const base1487=v1487.slice(v1487.indexOf('function visibleReply1487('),v1487.indexOf('function run1487(){'));
const v1488=fs.readFileSync('tests/ai-v1488-mechanic-curriculum.cjs','utf8');
const base1488=v1488.slice(v1488.indexOf('function lookahead1488('),v1488.indexOf('function run1488(){'));
const policy=base1487+'\n'+base1488+'\n'+lookahead1491.toString();
const glue=[
 'patch('+JSON.stringify("+'\\n'+lookahead148.toString()+'\\n'+explain146.toString()")+','+
  JSON.stringify("+'\\n'+lookahead148.toString()+'\\n'+visibleReply1487.toString()+'\\n'+lookahead1487.toString()+'\\n'+lookahead1488.toString()+'\\n'+lookahead1491.toString()+'\\n'+explain146.toString()")+');',
 'patch('+JSON.stringify("'suggested=lookahead148(game,weights,tally,ARCANE144_SIDES[side]);',")+','+
  JSON.stringify("'suggested=lookahead1491(game,weights,tally,ARCANE144_SIDES[side]);',")+');',
 'patch('+JSON.stringify("vm.exec('var ARCANE147_TRACE='+String(auditCapture)+';');")+','+
  JSON.stringify("vm.exec('var ARCANE147_TRACE='+String(auditCapture)+';');\n vm.exec('var ARCANE1487_CONFIG='+JSON.stringify(scene.policy1487||{})+';');\n vm.exec('var ARCANE1488_CONFIG='+JSON.stringify(scene.policy1488||{})+';');\n vm.exec('var ARCANE1491_CONFIG='+JSON.stringify(scene.policy1491||{})+';');")+');',
 'patch('+JSON.stringify("const opt={id:'v138-'+scene.seed,mode:'pve',")+','+
  JSON.stringify("const opt={id:'v138-'+scene.seed,mode:'pve',openingDecayGrace:!!scene.openingDecayGrace,")+');',
 'script=script.replace("function play(scene",POLICY_SOURCE+"\\nfunction play(scene");',
 "new Function('require','process','console',script+RUN_SOURCE)(require,process,console);"
].join('\n');
new Function('require','process','console','POLICY_SOURCE','RUN_SOURCE',
 prelude+'\n'+glue)(require,process,console,policy,
 'const ROLE_PROBE='+JSON.stringify(probe)+';\n('+run1491.toString()+')();');
