'use strict';
/* v14.9.24 research-only five-phase dual-test-AI self-play. Runs the REAL game
 * mechanics and exact v14.9.19 verified simulator hooks, not a mock fight. */
const fs=require('node:fs');
const old=fs.readFileSync('tests/ai-v1519-crossdeck-shards.cjs','utf8');
const split=old.indexOf('\nfunction runStudy(){');
if(split<0)throw Error('Cannot find verified simulator scaffold');
const prefix=old.slice(0,split);
const patchLines=[];
function inject(oldText,lines){
 patchLines.push('patch('+JSON.stringify(oldText)+','+JSON.stringify(lines.join('\n'))+');');
}
inject(' let learner=scene.candidateSeat;',[
' let learner=scene.candidateSeat;',
' const defender=g.players[1-learner],fortCount=[1,2,2,2,2,2,0][scene.siegeStage];',
' g.strategicTraining.siegeStage=scene.siegeStage;',
' if(scene.siegeStage<=2)g.strategicTraining.soulUnlockTurn=99999;',
' if(scene.siegeStage<=1)g.strategicTraining.noAttacksCounterOffense=true;',
' const ranked=defender.deck.map(id=>({id,card:CARDS[id]})).filter(x=>x.card)',
"  .sort((a,b)=>(['guardian','soul'].includes(b.card.role)?150000:0)+b.card.def-",
"   ((['guardian','soul'].includes(a.card.role)?150000:0)+a.card.def)||a.id-b.id);",
" if(ranked.length<fortCount)throw Error('Too few legal defender cards in deck');",
' for(let i=0;i<fortCount;i++){',
'  const picked=ranked[i],pos=defender.deck.indexOf(picked.id);',
"  if(pos<0)throw Error('Fortress source card missing from the actual deck');",
'  defender.deck.splice(pos,1);',
'  const c=newInstance(g,picked.id,1-learner);',
"  c.mode='def';c.summonedTurn=g.turn;defender.field[i]=c;",
' }',
" if(defender.field.filter(Boolean).length!==fortCount)throw Error('Invalid fortress field');"
]);
inject(' const baseChoose=chooseAiAction,baseApply=applyAiAction,baseAdvance=advanceTurn;',[
' counter.siegeEnemyAttackActions=0;counter.siegeEnemySoulOffense=0;',
' counter.siegeSummons=0;counter.siegeOwnCardLosses=0;',
' counter.siegeOpponentCardRemovals=0;counter.siegeOpponentLPDamage=0;',
' counter.siegeOwnLPDamage=0;counter.siegeEnemyActiveTurn=-1;',
' counter.siegeEnemyActionsThisTurn=0;counter.siegeCounterBlocked=0;',
' counter.finishWindows=0;counter.finishAttacks=0;counter.finishSwitches=0;counter.finishEnds=0;',
' counter.readyDirectOpportunities=0;counter.missedDirectOpportunities=0;',
' counter.selfPlayCallsBySeat=[0,0];counter.selfPlayStrategicBySeat=[0,0];',
' counter.selfPlayActionTypesBySeat=[{},{}];',
' counter.fusionReplyEvaluations=0;counter.attackReplyEvaluations=0;',
' counter.fusionOpportunityEvaluations=0;counter.counterfactualFusionEvaluations=0;',
' counter.softFusionEvaluations=0;counter.adaptiveCounterEvaluations=0;',
' counter.attackReplySimulations=0;counter.attackReplyHits=0;',
' counter.attackReplyLoss=0;',
' counter.allrounderGuardChecks=0;counter.allrounderOpeningChecks=0;',
' counter.guardianBreakEvaluations=0;counter.guardianBreakViable=0;',
' counter.guardianSoulEvaluations=0;counter.guardianFacingActions=0;',
' counter.postReplyFusionChecks=0;counter.postReplyFusionSurvivors=0;',
' counter.postReplyFusionLosses=0;counter.postReplyMaterialChecks=0;',
' counter.sequenceFusionChecks=0;counter.sequenceLegalOwnAttacks=0;',
' counter.sequenceLegalEnemyReplies=0;counter.sequenceUtilityGain=0;',
" counter.decayUrgencyChecks=0;",
" counter.worstReplySearches=0;counter.worstReplyLegalTrials=0;",
" counter.worstReplyMoreDangerous=0;counter.worstReplyGuardianSearches=0;",
" counter.defenseProbes=0;counter.defenseLegalSwitches=0;",
" counter.defenseChosen=0;counter.defenseReplyAttacks=0;",
" counter.defenseTradeoffChecks=0;counter.defenseTradeoffOwnAttacks=0;",
" counter.defenseTradeoffSwitches=0;",
" counter.defenseMarginChecks=0;counter.defenseMarginRejected=0;",
" counter.defenseMarginAccepted=0;",
" counter.contextMarginChecks=0;counter.contextMarginTotal=0;",
" counter.contextMarginLow=0;counter.contextMarginHigh=0;counter.contextMarginDecay=0;",
" counter.enemyPostureSearches=0;counter.enemyPostureCandidates=0;",
" counter.enemyPostureLegal=0;counter.enemyPostureWorse=0;",
" counter.enemyPostureGuardianSearches=0;",
" counter.tacticalReplyChecks=0;counter.tacticalReplyCandidates=0;",
" counter.tacticalReplyLegal=0;counter.tacticalReplyWorst=0;",
" counter.tacticalReplyGuardian=0;counter.tacticalReplyAllrounder=0;",
' counter.selfPlayIllegalSwitchesBySeat=[0,0];',
' counter.breachSwitches=0;counter.breachAttacks=0;counter.lastDefenderEliminated=0;',
' const baseChoose=chooseAiAction,baseApply=applyAiAction,baseAdvance=advanceTurn;'
]);
inject(' const baseChoose=chooseAiAction,baseApply=applyAiAction,baseAdvance=advanceTurn;',[
' const baseChoose=chooseAiAction,baseApply=applyAiAction,baseAdvance=advanceTurn;',
' const baseDamagePlayer=damagePlayer,baseAttack=attack;',
' // Training-only switch: suppress defensive LP retaliation in levels 0 and 1.',
' attack=function(game,ai,di){',
'  const d=Number.isInteger(di)?game.players[1-game.active]?.field[di]:null;',
'  const silent=game.strategicTraining?.noAttacksCounterOffense===true&&',
'   game.active===learner&&d?.mode==="def";',
'  if(silent)game.__siegeSilentCounter=true;',
'  try{return baseAttack(game,ai,di);}finally{delete game.__siegeSilentCounter;}',
' };',
' damagePlayer=function(game,id,amount){',
'  if(game.__siegeSilentCounter===true&&game.active===learner&&id===learner){',
'   if(game===g)counter.siegeCounterBlocked++;',
'   return 0;',
'  }',
'  return baseDamagePlayer(game,id,amount);',
' };'
]);
inject(' chooseAiAction=function(game,policy){',[
" chooseAiAction=function(game,policy){",
"  if(game===g&&scene.selfPlay){",
"   scene.finishMode=scene.finishModesBySeat[game.active];",
"   scene.siegeWeights=scene.weightModesBySeat[game.active];",
"   scene.rolePolicy=scene.rolePoliciesBySeat[game.active];",
"   scene.q=scene.qModesBySeat[game.active];",
"   scene.candidateRole=scene.rolesBySeat[game.active];",
"   const defenseCfg=scene.rolePolicy;",
"   const opponent=game.players[1-game.active];",
"   if(game.winner===null&&!game.pending&&defenseCfg?.defensePreview&&",
"      (!defenseCfg.decayOnlyDefense||scene.decayEnabled)&&",
"      [\"positions\",\"guard\"].includes(game.aiPhase)&&opponent.field.some(Boolean)){",
"    const hostileSoulGuard=opponent.field.some(c=>c&&[\"guardian\",\"soul\"].includes(role(c)));",
"    if(!defenseCfg.defenseVsSoulGuard||hostileSoulGuard){",
"     const me=game.active,opponentSeat=1-me;",
"     const value=trial=>{",
"      const own=trial.players[me],foe=trial.players[opponentSeat];",
"      const ownBoard=own.field.filter(Boolean).reduce((v,c)=>v+dataOf(c).atk*.22+dataOf(c).def*.32,0);",
"      const foeBoard=foe.field.filter(Boolean).reduce((v,c)=>v+dataOf(c).atk*.16+dataOf(c).def*.1,0);",
"      // No unverified role bonus: score only the resulting, legally simulated board.",
"      return own.lp-foe.lp*.3+ownBoard-foeBoard;",
"     };",
"     const directReplies=(source,enemySwitchIdx)=>{",
"      const z=JSON.parse(JSON.stringify(source));",
"      if(defenseCfg.defenseAttackTradeoff){",
"       // Equal own attack continuation before enemy replies; real attack() checks legality.",
"       z.active=me;z.aiPhase=\"attacks\";",
"       for(let i=0;i<2&&z.winner===null;i++){",
"        const action=attackPlan(z);",
"        if(!action||!Number.isInteger(action.ai)||!attack(z,action.ai,action.di))break;",
"        counter.defenseTradeoffOwnAttacks++;",
"       }",
"      }",
"      if(z.winner!==null)return value(z);",
"      z.active=opponentSeat;z.turn++;z.aiPhase=\"attacks\";",
"      for(const c of z.players[opponentSeat].field)if(c)c.attacked=false;",
"      if(Number.isInteger(enemySwitchIdx)){",
"       // Opponent switches in its OWN NEXT position phase, after our own attacks.",
"       z.aiPhase=\"positions\";",
"       for(const c of z.players[opponentSeat].field)if(c)c.switched=false;",
"       if(!baseApply(z,{type:\"switch\",idx:enemySwitchIdx}))return null;",
"       z.aiPhase=\"attacks\";",
"       counter.enemyPostureLegal++;",
"      }",
"      // v14.9.50: evaluate up to six real, legal first enemy attacks on cloned",
"      // visible fields, then a second legal reply; compare with greedy continuation.",
"      // Neither opponent deck nor hand is consulted in this counterfactual.",
"      const scope=defenseCfg.legalReplyScope;",
"      const visible=z.players[opponentSeat].field.filter(Boolean);",
"      const guardianThreat=scope?.guardian&&scene.candidateRole==='guardian'&&",
"       visible.some(c=>['predator','allrounder'].includes(role(c)));",
"      const predatorThreat=scope?.allrounder&&scene.candidateRole==='allrounder'&&",
"       visible.some(c=>role(c)==='predator');",
"      if(guardianThreat||predatorThreat){",
"       counter.tacticalReplyChecks++;",
"       if(guardianThreat)counter.tacticalReplyGuardian++;",
"       if(predatorThreat)counter.tacticalReplyAllrounder++;",
"       const targets=z.players[me].field.map((c,idx)=>({c,idx})).filter(x=>x.c);",
"       const proposals=[];",
"       for(let ai=0;ai<z.players[opponentSeat].field.length;ai++){",
"        const striker=z.players[opponentSeat].field[ai];",
"        if(!striker||!canAttack(z,striker))continue;",
"        for(const target of targets.length?targets:[{c:null,idx:null}]){",
"         const armor=target.c?dataOf(target.c)[target.c.mode==='def'?'def':'atk']:0;",
"         const hit=effectiveAttack(z,striker,target.c);",
"         const priority=target.c?(Math.max(0,hit-armor)*1.4+",
"          dataOf(target.c).atk*.33+Math.min(hit,armor)*.12):hit*2;",
"         proposals.push({ai,di:target.idx,priority});",
"        }",
"       }",
"       proposals.sort((a,b)=>b.priority-a.priority||a.ai-b.ai||",
"        (a.di??-1)-(b.di??-1));",
"       let worst=Infinity,trialCount=0;",
"       for(const move of proposals){",
"        if(trialCount>=6)break;trialCount++;counter.tacticalReplyCandidates++;",
"        const branch=JSON.parse(JSON.stringify(z));",
"        if(!attack(branch,move.ai,move.di))continue;",
"        counter.tacticalReplyLegal++;",
"        if(branch.winner===null){",
"         const response=attackPlan(branch);",
"         if(response&&Number.isInteger(response.ai))attack(branch,response.ai,response.di);",
"        }",
"        worst=Math.min(worst,value(branch));",
"       }",
"       if(Number.isFinite(worst)){",
"        const greedy=JSON.parse(JSON.stringify(z));",
"        for(let t=0;t<2&&greedy.winner===null;t++){",
"         const action=attackPlan(greedy);",
"         if(!action||!Number.isInteger(action.ai)||!attack(greedy,action.ai,action.di))break;",
"        }",
"        const greedyValue=value(greedy);",
"        if(worst<greedyValue)counter.tacticalReplyWorst++;",
"        return Math.min(worst,greedyValue);",
"       }",
"      }",
"      for(let t=0;t<2&&z.winner===null;t++){",
"       const action=attackPlan(z);",
"       if(!action||!Number.isInteger(action.ai)||!attack(z,action.ai,action.di))break;",
"       counter.defenseReplyAttacks++;",
"      }",
"      return value(z);",
"     };",
"     const afterReplies=source=>{",
"      const baseline=directReplies(source,null);",
"      if(!defenseCfg.enemyPostureResponse)return baseline;",
"      counter.enemyPostureSearches++;",
"      const foes=source.players[opponentSeat].field;",
"      const hasGuardSoul=foes.some(c=>c&&[\"guardian\",\"soul\"].includes(role(c)));",
"      if(defenseCfg.enemyPostureGuardianOnly&&!hasGuardSoul)return baseline;",
"      if(defenseCfg.enemyPostureGuardianOnly)counter.enemyPostureGuardianSearches++;",
"      let worst=baseline,attempted=0;",
"      for(let idx=0;idx<foes.length&&attempted<3;idx++){",
"       const card=foes[idx];",
"       if(!card||card.mode!==\"atk\")continue;",
"       if(defenseCfg.enemyPostureGuardianOnly&&![\"guardian\",\"soul\"].includes(role(card)))continue;",
"       counter.enemyPostureCandidates++;attempted++;",
"       const score=directReplies(source,idx);",
"       if(score===null)continue;",
"       if(score<worst){worst=score;counter.enemyPostureWorse++;}",
"      }",
"      return worst;",
"     };",
"     const baseScore=afterReplies(game);",
"     // No illegal mid-turn interruption: candidate enemy stance is applied only",
"     // after our own legal attacks in the simulated opponent position phase.",
"     if(defenseCfg.defenseAttackTradeoff)counter.defenseTradeoffChecks++;",
"     let safetyMargin=defenseCfg.defenseSwitchMargin||115;",
"     if(defenseCfg.defenseContextMargin){",
"      // Predeclared formula uses only visible field, own/foe LP and symmetric decay.",
"      const ownCards=game.players[me].field.filter(Boolean);",
"      const enemyCards=game.players[opponentSeat].field.filter(Boolean);",
"      const ready=ownCards.filter(c=>c.mode===\"atk\"&&!c.attacked&&!c.switched);",
"      const ownPeak=Math.max(0,...ready.map(c=>dataOf(c).atk));",
"      const enemyArmor=Math.min(Infinity,...enemyCards.map(c=>dataOf(c)[c.mode===\"def\"?\"def\":\"atk\"]));",
"      const enemyThreat=Math.max(0,...enemyCards.map(c=>dataOf(c).atk));",
"      let adaptive=185;",
"      if(ready.length>=2)adaptive+=40;",
"      if(ready.length>0&&ownPeak>enemyArmor*1.10)adaptive+=35;",
"      if(enemyThreat>0&&game.players[me].lp<Math.max(2500,enemyThreat*1.5))adaptive-=55;",
"      if(enemyCards.length>=3&&ownCards.length<=2)adaptive-=30;",
"      if(scene.decayEnabled){",
"       counter.contextMarginDecay++;",
"       if(game.players[me].lp<5000)adaptive+=30;",
"       if(game.players[opponentSeat].lp<2800)adaptive+=40;",
"      }",
"      safetyMargin=Math.max(105,Math.min(285,adaptive));",
"      counter.contextMarginChecks++;counter.contextMarginTotal+=safetyMargin;",
"      if(safetyMargin<=145)counter.contextMarginLow++;",
"      if(safetyMargin>=245)counter.contextMarginHigh++;",
"     }",
"     let bestScore=baseScore+safetyMargin,bestIdx=-1,maxImprovement=-Infinity;",
"     const self=game.players[me];",
"     for(let idx=0;idx<self.field.length;idx++){",
"      const card=self.field[idx];",
"      if(!card||card.mode!==\"atk\"||card.attacked||card.switched)continue;",
"      counter.defenseProbes++;",
"      const z=JSON.parse(JSON.stringify(game));",
"      if(!baseApply(z,{type:\"switch\",idx}))continue;",
"      counter.defenseLegalSwitches++;",
"      const cost=defenseCfg.defenseAttackTradeoff?0:dataOf(card).atk*.075;",
"      const score=afterReplies(z)-cost;",
"      if(defenseCfg.defenseSwitchMargin)maxImprovement=Math.max(maxImprovement,score-baseScore);",
"      if(score>bestScore){bestScore=score;bestIdx=idx;}",
"     }",
"     if(defenseCfg.defenseSwitchMargin){",
"      counter.defenseMarginChecks++;",
"      if(maxImprovement>115&&maxImprovement<=safetyMargin)counter.defenseMarginRejected++;",
"     }",
"     if(bestIdx>=0){",
"      if(defenseCfg.defenseSwitchMargin)counter.defenseMarginAccepted++;",
"      if(defenseCfg.defenseAttackTradeoff)counter.defenseTradeoffSwitches++;",
"      counter.defenseChosen++;counter.selfPlayStrategicBySeat[me]++;",
"      return {type:\"switch\",idx:bestIdx};",
"     }",
"    }",
"   }",
"  }",
"  if(game===g&&!game.pending&&['breach','safe'].includes(scene.finishMode)&&",
"    game.winner===null&&game.turn>1&&game.players[1-game.active].field.some(Boolean)&&",
"    (game.aiPhase!=='summon'||game.summoned)){",
"   const self=game.players[game.active],enemy=game.players[1-game.active];",
"   const targets=enemy.field.filter(Boolean);",
"   const available=self.field.some(c=>c&&canAttack(game,c));",
"   if(game.aiPhase==='positions'||game.aiPhase==='guard'||game.aiPhase==='attacks'){",
"    if(!available){",
"     const pool=self.field.map((c,i)=>({c,i})).filter(x=>x.c&&x.c.mode==='def'&&",
"      !x.c.switched&&!x.c.attacked&&dataOf(x.c).atk>0);",
"     let viable=pool.filter(x=>targets.some(t=>effectiveAttack(game,x.c,t)>=dataOf(t).def*(scene.finishMode==='safe'?.95:.72)));",
"     if(scene.finishMode==='safe'){",
"      const enemyPeak=Math.max(0,...targets.map(c=>dataOf(c).atk));",
"      viable=viable.filter(x=>self.lp>Math.max(300,enemyPeak*.55));",
"     }",
"     viable.sort((a,b)=>dataOf(b.c).atk-dataOf(a.c).atk||a.i-b.i);",
"     if(viable.length){counter.breachSwitches++;return {type:'switch',idx:viable[0].i};}",
"    }",
"    if(scene.finishMode==='focus'&&game.aiPhase==='attacks'){",
"     const ready=self.field.map((c,i)=>({c,i})).filter(x=>x.c&&canAttack(game,x.c));",
"     const scored=[];",
"     for(const x of ready)for(let di=0;di<5;di++){",
"      const target=enemy.field[di];if(!target)continue;",
"      const value=effectiveAttack(game,x.c,target),armor=target.mode==='def'?dataOf(target).def:dataOf(target).atk;",
"      if(value<armor*.8)continue;",
"      const clone=JSON.parse(JSON.stringify(game));",
"      const before=clone.players[learner].lp,prev=clone.players[1-learner].lp;",
"      if(!attack(clone,x.i,di))continue;",
"      const removed=!clone.players[1-learner].field[di];",
"      const paid=before-clone.players[learner].lp,lp=prev-clone.players[1-learner].lp;",
"      const score=(removed?1200:0)+lp*.8-paid*.9+Math.min(value,armor)*.3;",
"      scored.push({ai:x.i,di,score});",
"     }",
"     scored.sort((a,b)=>b.score-a.score||a.ai-b.ai);",
"     if(scored.length&&scored[0].score>180){",
"      counter.breachAttacks++;return {type:'attack',ai:scored[0].ai,di:scored[0].di};",
"     }",
"    }",
"   }",
"  }",
"  if(game===g&&!game.pending&&scene.finishMode&&",
"    game.winner===null&&game.turn>1&&!game.players[1-game.active].field.some(Boolean)){",
"   const self=game.players[game.active];counter.finishWindows++;",
"   if(game.aiPhase!==\"summon\"||game.summoned){",
"    const ready=self.field.map((c,i)=>({c,i})).filter(x=>x.c&&",
"      canAttack(game,x.c)&&effectiveAttack(game,x.c,null)>0);",
"    if(ready.length){",
"     if(scene.finishMode===\"priority\")ready.sort((a,b)=>effectiveAttack(game,b.c,null)-effectiveAttack(game,a.c,null)||a.i-b.i);",
"     counter.finishAttacks++;return {type:\"attack\",ai:ready[0].i,di:null};",
"    }",
"    if(scene.finishMode!==\"direct\"){",
"     const defenders=self.field.map((c,i)=>({c,i})).filter(x=>x.c&&x.c.mode===\"def\"&&",
"       !x.c.attacked&&!x.c.switched&&dataOf(x.c).atk>0);",
"     if(defenders.length){",
"      if(scene.finishMode===\"priority\")defenders.sort((a,b)=>dataOf(b.c).atk-dataOf(a.c).atk||a.i-b.i);",
"      counter.finishSwitches++;return {type:\"switch\",idx:defenders[0].i};",
"     }",
"    }",
"    counter.finishEnds++;return {type:\"end\"};",
"   }",
"  }",
"  if(game===g&&game.active!==learner&&!game.pending&&!scene.selfPlay){",
'   if(scene.siegeStage===6)return baseChoose(game,policy);',
"   if(scene.siegeStage<=3)return {type:'end'};",
'   const max=scene.siegeStage<5?0:game.turn<10?0:game.turn<20?1:2;',
'   if(game.turn!==counter.siegeEnemyActiveTurn){',
'    counter.siegeEnemyActiveTurn=game.turn;counter.siegeEnemyActionsThisTurn=0;',
'   }',
'   const action=baseChoose(game,policy);',
"   if(['attack','soul-raid','soul-discharge'].includes(action?.type)&&",
'      counter.siegeEnemyActionsThisTurn>=max)',
"    return {type:'end'};",
"   if(action?.type==='switch'&&game.players[game.active].field[action.idx]?.mode==='def')",
"    return {type:'end'};",
'   return action;',
'  }'
]);
inject('  if(scene.summonForecast&&ranking.length>1&&',[
'  if(scene.rolePolicy){',
'   const w=scene.rolePolicy,foe=g.players[1-g.active];',
'   if(scene.candidateRole==="fusion"&&foe.field.some(c=>c&&role(c)==="guardian"))counter.guardianFacingActions++;',
'   const foePred=foe.field.filter(c=>c&&role(c)==="predator").length;',
'   const foeSoul=foe.field.filter(c=>c&&role(c)==="soul").length;',
'   const foeGuard=foe.field.filter(c=>c&&role(c)==="guardian").length;',
'   const roleCounter=w.roleCounter?1:0;',
'   const guardSupport=(w.adaptive&&own.field.some(c=>c&&role(c)==="soul")?1.35:1)*(roleCounter&&foePred?1.24:1);',
'   const soulSupport=(w.adaptive&&own.field.some(c=>c&&role(c)==="guardian")?1.35:1)*(roleCounter&&foeGuard?1.20:1);',
'   const reserveRisk=(w.adaptive&&own.field.filter(Boolean).length<=2?1.35:1)*(roleCounter&&foeSoul?1.18:1);',
'   const threat=Math.max(0,...foe.field.filter(Boolean).map(c=>dataOf(c).atk));',
'   const enemyHigh=foe.field.filter(c=>c&&dataOf(c).level>=9).length;',
'   const highLevelDefense=w.highThreat&&enemyHigh?Math.min(1.3,1+enemyHigh*.12):1;',
'   const economyBonus=w.activeEconomy&&foeSoul&&own.field.filter(Boolean).length<=2?1.15:1;',
'   const guardian=own.field.some(c=>c&&role(c)==="guardian");',
'   const soul=own.field.some(c=>c&&role(c)==="soul");',
'   for(const opt of ranking){',
'    if(opt.a.type==="fusion"){',
'     const mat=(opt.a.uids||[]).map(uid=>own.hand.find(c=>c.uid===uid)).filter(Boolean);',
'     const consumed=mat.reduce((n,c)=>n+dataOf(c).atk*.55+dataOf(c).def*.45,0);',
'     const fusion=CARDS[opt.a.choice],result=fusion?fusion.atk*.55+fusion.def*.45:0;',
'     opt.score-=w.material*reserveRisk*economyBonus*Math.max(0,consumed*.15-Math.max(0,result-consumed)*.05);',
'     if(w.fusionOpportunity&&fusion){',
'      // Public game catalog and visible candidate materials, not hidden opponent cards.',
'      const levelBonus=(fusion.level>=9?145:fusion.level>=7?85:0);',
'      const upgrade=result-consumed;',
'      opt.score+=w.fusionOpportunity*Math.max(-190,Math.min(420,upgrade*.27+levelBonus));',
'      counter.fusionOpportunityEvaluations++;',
'     }',
'     if(w.softFusion&&fusion){',
'      // Offer only a MILD fusion incentive if it produces actual public material improvement.',
'      const net=result-consumed;',
'      const ownCount=own.field.filter(Boolean).length;',
'      const foeCount=foe.field.filter(Boolean).length;',
'      if(net>100&&ownCount<=3&&foeCount>=1){',
'       opt.score+=w.softFusion*Math.min(80,20+net*.025);',
'       counter.softFusionEvaluations++;',
'      }',
'     }',
'     if(w.guardianBreak&&fusion&&foeGuard>0){',
'      // Visible Guardian DEF against public fusion-catalog ATK, with capped reward.',
'      const guardMax=Math.max(0,...foe.field.filter(c=>c&&role(c)==="guardian"&&c.mode==="def").map(c=>dataOf(c).def));',
'      if(guardMax>0){',
'       const gap=(fusion.atk||0)-guardMax;',
'       const score=gap>=0?Math.min(105,30+Math.max(0,gap)*.085):-Math.min(80,Math.abs(gap)*.075);',
'       opt.score+=w.guardianBreak*score;',
'       counter.guardianBreakEvaluations++;',
'       if(gap>=0)counter.guardianBreakViable++;',
'      }',
'     }',
'     if(w.fusionReply&&fusion){',
'      // One-response PUBLIC-BOARD proxy: would a visible enemy outpower the new fusion?',
'      const armor=Math.max(fusion.atk||0,fusion.def||0);',
'      const exposed=Math.max(0,threat-armor);',
'      opt.score-=w.fusionReply*Math.min(450,exposed*.20+Math.max(0,consumed-result)*.07);',
'      counter.fusionReplyEvaluations++;',
'     }',
'    }else{',
'     const c=own.hand.find(x=>x.uid===opt.a.uid);if(!c)continue;',
'     const d=dataOf(c),r=role(c);',
'     if(r==="guardian")opt.score+=w.guardian*guardSupport*highLevelDefense*Math.min(500,d.def*.14+Math.min(threat,d.def)*.04+(soul?140:0));',
'     if(r==="soul")opt.score+=w.soul*soulSupport*Math.min(550,d.def*.11+(guardian?170:0));',
'     if(w.guardianSoul&&r==="soul"&&foeGuard>0){',
'      const hostileDef=Math.max(0,...foe.field.filter(c=>c&&role(c)==="guardian").map(c=>dataOf(c).def));',
'      const safe=Math.max(0,Math.min(110,d.def*.035+hostileDef*.012));',
'      opt.score+=w.guardianSoul*safe;',
'      counter.guardianSoulEvaluations++;',
'     }',
'     if(w.allrounderOpening&&g.turn<=4&&own.field.filter(Boolean).length<=2){',
'      const ownAR=own.field.some(c=>c&&role(c)==="allrounder")||own.hand.some(c=>c&&role(c)==="allrounder");',
'      if(ownAR){',
'       if(r==="allrounder")opt.score+=w.allrounderOpening*75;',
'       if(r==="guardian")opt.score+=w.allrounderOpening*(foePred?110:52);',
'       if(r==="soul")opt.score+=w.allrounderOpening*34;',
'       counter.allrounderOpeningChecks++;',
'      }',
'     }',
'    }',
'   }',
'   ranking.sort((a,b)=>b.score-a.score);',
'  }',
'  if(scene.siegeWeights){',
'   const w=scene.siegeWeights;',
'   for(const opt of ranking){',
"    if(opt.a.type==='fusion')opt.score-=w.reserve*((opt.a.uids?.length||2)-1)*90;",
'    else {',
'     const card=own.hand.find(c=>c.uid===opt.a.uid);',
'     if(card){const d=dataOf(card),r=role(card);',
"      if(['guardian','soul'].includes(r))opt.score+=w.support*d.def*.045;",
"      if(r==='predator')opt.score+=w.breach*d.atk*.032;",
'     }',
'    }',
'   }',
'   ranking.sort((a,b)=>b.score-a.score);',
'  }',
'  if(scene.summonForecast&&ranking.length>1&&'
]);
inject("  if(scene.q&&scene.decision!=='heuristic'&&options.length){",[
'  if(scene.rolePolicy){',
'   const w=scene.rolePolicy,foe=g.players[1-g.active];',
'   const peak=Math.max(0,...foe.field.filter(Boolean).map(c=>dataOf(c).atk));',
'   let attackReplyBudget=0;',
'   for(const opt of options){',
'    const trial=JSON.parse(JSON.stringify(g));',
'    const ownBefore=trial.players[g.active].lp;',
'    if(!attack(trial,opt.a.ai,opt.a.di))continue;',
'    const left=trial.players[g.active].field[opt.a.ai];',
'    const cover=left?dataOf(left)[left.mode==="def"?"def":"atk"]:0;',
'    const risk=(!left?500:Math.max(0,peak-cover)*.22)+',
'      Math.max(0,ownBefore-trial.players[g.active].lp)*.45;',
'    const won=trial.winner===g.active?4200:trial.winner===1-g.active?-4200:0;',
'    const ownLP=g.players[g.active].lp,enemyLP=foe.lp;',
'    const defensivePressure=w.adaptive?(ownLP<enemyLP*.65?1.35:ownLP>enemyLP*1.5?.85:1):1;',
'    const boardPressure=w.adaptive&&foe.field.filter(Boolean).length>=3?1.18:1;',
'    const guarded=foe.field.some(c=>c&&role(c)==="guardian");',
'    const predators=foe.field.filter(c=>c&&role(c)==="predator").length;',
'    const highEnemy=foe.field.filter(c=>c&&dataOf(c).level>=9).length;',
'    const highThreat=w.highThreat&&highEnemy>0?Math.min(1.4,1+highEnemy*.14):1;',
'    const counterFactor=(w.roleCounter?(guarded?1.12:1)*(predators>=2?1.16:1):1)*highThreat;',
'    opt.score+=won-w.risk*counterFactor*defensivePressure*boardPressure*risk;',
'    if(w.allrounderGuard&&trial.winner===null){',
'     const ownAr=trial.players[g.active].field.filter(c=>c&&role(c)==="allrounder");',
'     const enemyPred=trial.players[1-g.active].field.filter(c=>c&&role(c)==="predator");',
'     if(ownAr.length&&enemyPred.length){',
'      const enemyPower=Math.max(...enemyPred.map(c=>dataOf(c).atk));',
'      const exposed=ownAr.filter(c=>dataOf(c)[c.mode==="def"?"def":"atk"]<enemyPower).length;',
'      opt.score-=w.allrounderGuard*Math.min(230,exposed*86+Math.max(0,enemyPower-Math.max(...ownAr.map(c=>dataOf(c).def)))*.075);',
'      counter.allrounderGuardChecks++;',
'     }',
'    }',
'    if(w.attackReplySim&&trial.winner===null&&highEnemy>0&&attackReplyBudget<3){',
'     // Clone-only: apply ONE legally planned visible enemy attack after the candidate attack.',
'     attackReplyBudget++;counter.attackReplySimulations++;',
'     const me=g.active,opp=1-me,meBefore=trial.players[me];',
'     const beforeLP=meBefore.lp,beforeN=meBefore.field.filter(Boolean).length;',
'     const beforePower=meBefore.field.filter(Boolean).reduce((v,c)=>v+dataOf(c).atk*.5+dataOf(c).def*.5,0);',
'     trial.active=opp;trial.turn++;trial.aiPhase="attacks";',
'     for(const c of trial.players[opp].field)if(c)c.attacked=false;',
'     const response=attackPlan(trial);',
'     if(response&&Number.isInteger(response.ai)&&attack(trial,response.ai,response.di)){',
'      counter.attackReplyHits++;',
'      const after=trial.players[me],lost=Math.max(0,beforeN-after.field.filter(Boolean).length);',
'      const afterPower=after.field.filter(Boolean).reduce((v,c)=>v+dataOf(c).atk*.5+dataOf(c).def*.5,0);',
'      const damage=Math.max(0,beforeLP-after.lp);',
'      const replyLoss=Math.min(1000,damage*.38+lost*175+Math.max(0,beforePower-afterPower)*.12);',
'      counter.attackReplyLoss+=replyLoss;',
'      opt.score-=w.attackReplySim*replyLoss;',
'     }',
'    }',
'    if(w.replyRisk&&trial.winner===null){',
'     // One visible-opponent-reply threat estimate, NOT hidden-hand search.',
'     const remainingEnemy=trial.players[1-g.active].field.filter(Boolean);',
'     const remainingOwn=trial.players[g.active].field.filter(Boolean);',
'     const enemyStrong=Math.max(0,...remainingEnemy.map(c=>dataOf(c).atk));',
'     const ownExposed=remainingOwn.map(c=>dataOf(c)[c.mode==="def"?"def":"atk"]);',
'     const fragile=ownExposed.filter(v=>v<enemyStrong).length;',
'     const boardRisk=Math.min(650,Math.max(0,enemyStrong-Math.max(0,...ownExposed))*.14+fragile*70);',
'     opt.score-=w.replyRisk*boardRisk;',
'     counter.attackReplyEvaluations++;',
'    }',
'   }',
'   options.sort((a,b)=>b.score-a.score);',
'  }',
'  if(scene.siegeWeights){',
'   const w=scene.siegeWeights;',
'   const enemyStart=g.players[1-g.active].field.filter(Boolean).length;',
'   const allyStart=g.players[g.active].field.filter(Boolean).length;',
'   for(const opt of options){',
'    const trial=JSON.parse(JSON.stringify(g)),enemyLP=trial.players[1-g.active].lp;',
'    if(!attack(trial,opt.a.ai,opt.a.di))continue;',
'    const cleared=enemyStart-trial.players[1-g.active].field.filter(Boolean).length;',
'    const lost=allyStart-trial.players[g.active].field.filter(Boolean).length;',
'    const damage=Math.max(0,enemyLP-trial.players[1-g.active].lp);',
'    opt.score+=w.breach*(cleared*330+damage*.07)-w.reserve*lost*290;',
'   }',
'   options.sort((a,b)=>b.score-a.score);',
'  }',
"  if(scene.q&&scene.decision!=='heuristic'&&options.length){"
]);
// Reuse the simulator's existing LEGAL cloned opponent attack(s) after a
// candidate summon/fusion. Its before/future utility values refer to the
// same simulated game, so no hidden cards or new hypothetical opponent rules.
inject('     return before*.2+future*.8+entry.score*.2-(scene.roleAware?fragile:0);',[
'     const roleWeights=scene.rolePolicy;',
'     let tacticalCorrection=0;',
'     if(roleWeights?.counterfactualFusion&&entry.a.type==="fusion"){',
'      const responseLoss=Math.max(-750,Math.min(750,future-before));',
'      const hasHighEnemy=x.players[op].field.some(c=>c&&dataOf(c).level>=9);',
'      const riskFactor=roleWeights.adaptiveCounter?(hasHighEnemy?.72:1.08):1;',
'      tacticalCorrection=roleWeights.counterfactualFusion*riskFactor*responseLoss;',
'      if(roleWeights.adaptiveCounter)counter.adaptiveCounterEvaluations++;',
'      counter.counterfactualFusionEvaluations++;',
'     }',
'     if(entry.a.type==="fusion"&&(roleWeights?.postReplyFusion||roleWeights?.postReplyMaterial)){',
'      // The existing legally executed cloned enemy attacks are already present in x.',
'      // Compare final public battlefield and LP with PRE-action state g. No hidden opponent hand.',
'      const guardianBefore=g.players[op].field.some(c=>c&&role(c)==="guardian");',
'      if(guardianBefore){',
'       const fusionId=entry.a.choice;',
'       const beforeSame=g.players[actor].field.filter(c=>c&&c.id===fusionId).length;',
'       const afterSame=x.players[actor].field.filter(c=>c&&c.id===fusionId).length;',
'       const survives=afterSame>beforeSame;',
'       const paid=(entry.a.uids||[]).length;',
'       if(roleWeights.postReplyFusion){',
'        // Value survival and the REAL consequence of legal Guardian counterattacks.',
'        // A survival bonus is capped, and losing the new monster is penalized.',
'        const ownDamage=Math.max(0,g.players[actor].lp-x.players[actor].lp);',
'        const foeDamage=Math.max(0,g.players[op].lp-x.players[op].lp);',
'        const reward=(survives?95:-155)+Math.min(130,foeDamage*.035)-Math.min(140,ownDamage*.045);',
'        tacticalCorrection+=roleWeights.postReplyFusion*Math.max(-260,Math.min(200,reward));',
'        counter.postReplyFusionChecks++;',
'        if(survives)counter.postReplyFusionSurvivors++;else counter.postReplyFusionLosses++;',
'       }',
'       if(roleWeights.postReplyMaterial){',
'        // Do not spend 3-5 cards without a surviving improvement against a visible Guardian.',
'        const handRemaining=x.players[actor].hand.length;',
'        const scarcity=handRemaining<=1?130:handRemaining<=2?75:15;',
'        const penalty=Math.min(200,Math.max(0,paid-2)*36+scarcity)*(survives?.28:1);',
'        tacticalCorrection-=roleWeights.postReplyMaterial*penalty;',
'        counter.postReplyMaterialChecks++;',
'       }',
'      }',
'     }',
'     if(entry.a.type==="fusion"&&roleWeights?.sequenceFusion){',
'      // Genuine two-ply counterfactual: legal own attacks THEN legal enemy replies.',
'      // Unlike a raw ATK bonus, compare final utility with original no-own-attack forecast.',
'      const y=JSON.parse(JSON.stringify(g));',
'      if(applyAiAction(y,entry.a)){',
'       let legalPlacement=true;',
'       if(y.pending){',
'        const idx=y.players[actor].field.findIndex(c=>!c);',
'        legalPlacement=idx>=0&&!!applyAiAction(y,{type:"place",idx});',
'       }',
'       if(legalPlacement){',
'        let ownAttacks=0,enemyReplies=0;',
'        y.active=actor;y.aiPhase="attacks";',
'        // Preserve summoning sickness / attack flags; never grant extra attacks.',
'        for(let i=0;i<2&&y.winner===null;i++){',
'         const ownAction=attackPlan(y);',
'         if(!ownAction||!Number.isInteger(ownAction.ai)||!attack(y,ownAction.ai,ownAction.di))break;',
'         ownAttacks++;counter.sequenceLegalOwnAttacks++;',
'        }',
"        let alternateWorst=null;",
"        if(y.winner===null){",
'         y.active=op;y.turn++;y.aiPhase="attacks";',
"         for(const c of y.players[op].field)if(c)c.attacked=false;",
"         const guardianThreat=y.players[op].field.some(c=>c&&[\"guardian\",\"soul\"].includes(role(c)));",
"         const highL10Threat=y.players[op].field.some(c=>c&&dataOf(c).level>=9);",
"         const searchWorst=(roleWeights.sequenceWorst&&highL10Threat)||",
"          (roleWeights.sequenceGuardianWorst&&guardianThreat&&highL10Threat);",
"         if(searchWorst){",
"          counter.worstReplySearches++;",
"          if(guardianThreat)counter.worstReplyGuardianSearches++;",
"          let best=null,bestUtility=Infinity,trials=0;",
"          const ownField=y.players[actor].field;",
"          const targets=ownField.some(Boolean)?ownField.map((c,j)=>c?j:-1).filter(j=>j>=0):[null];",
"          const cap=roleWeights.worstReplyCap||6;",
"          for(let ai=0;ai<y.players[op].field.length&&trials<cap;ai++){",
"           const attacker=y.players[op].field[ai];",
"           if(!attacker||!canAttack(y,attacker))continue;",
"           for(const di of targets){",
"            if(trials>=cap)break;",
"            trials++;",
"            const z=JSON.parse(JSON.stringify(y));",
"            if(!attack(z,ai,di))continue;",
"            counter.worstReplyLegalTrials++;",
"            const value=utility(z);",
"            if(value<bestUtility){bestUtility=value;best=z;}",
"           }",
"          }",
"          if(best){",
"           if(best.winner===null){",
"            const response=attackPlan(best);",
"            if(response&&Number.isInteger(response.ai))attack(best,response.ai,response.di);",
"           }",
"           alternateWorst=utility(best);",
"          }",
"         }",
'         for(let i=0;i<2&&y.winner===null;i++){',
'          const response=attackPlan(y);',
'          if(!response||!Number.isInteger(response.ai)||!attack(y,response.ai,response.di))break;',
'          enemyReplies++;counter.sequenceLegalEnemyReplies++;',
'         }',
'        }',
'        if(ownAttacks){',
"         const ordinary=utility(y);",
"         const guarded=alternateWorst===null?ordinary:Math.min(ordinary,alternateWorst);",
"         if(alternateWorst!==null&&alternateWorst<ordinary)counter.worstReplyMoreDangerous++;",
"         const gain=Math.max(-850,Math.min(850,guarded-future));",
'         tacticalCorrection+=roleWeights.sequenceFusion*gain;',
'         counter.sequenceFusionChecks++;',
'         counter.sequenceUtilityGain+=gain;',
'         if(roleWeights.decayUrgency&&scene.decayEnabled){',
'          const ownLP=g.players[actor].lp,enemyLP=g.players[op].lp;',
'          const ownDelta=ownLP-y.players[actor].lp;',
'          const enemyDelta=enemyLP-y.players[op].lp;',
'          const urgency=Math.max(.5,Math.min(1.5,1+(5000-ownLP)/7000));',
'          const tempo=Math.max(-200,Math.min(200,(enemyDelta-ownDelta)*.08));',
'          tacticalCorrection+=roleWeights.decayUrgency*urgency*tempo;',
'          counter.decayUrgencyChecks++;',
'         }',
'        }',
'       }',
'      }',
'     }',
'     return before*.2+future*.8+entry.score*.2-(scene.roleAware?fragile:0)+tacticalCorrection;'
]);
inject('      const response=attackPlan(x);',[
'      const response=scene.siegeStage<5?null:attackPlan(x);'
]);
inject('    const response=attackPlan(first);',[
'    const response=scene.siegeStage<5?null:attackPlan(first);'
]);
inject('      if(scene.summonCounterDepth>=2&&x.winner===null){',[
'      if(scene.summonCounterDepth>=2&&x.winner===null&&scene.siegeStage>=5){'
]);
inject('    if(scene.summonCounterDepth>=2&&first.winner===null){',[
'    if(scene.summonCounterDepth>=2&&first.winner===null&&scene.siegeStage>=5){'
]);
inject('  return baseApply(game,action);',[
'  const current=game.active;',
'  const foe=game.players[1-learner],own=game.players[learner];',
'  const enemyN=foe.field.filter(Boolean).length,ownN=own.field.filter(Boolean).length;',
'  const enemyLP=foe.lp,ownLP=own.lp;',
'  if(game===g&&current===learner&&game.turn>1&&!game.pending&&!foe.field.some(Boolean)&&',
'    (game.aiPhase!=="summon"||game.summoned)){',
'   const legal=own.field.some(c=>c&&canAttack(game,c)&&effectiveAttack(game,c,null)>0);',
'   if(legal){counter.readyDirectOpportunities++;',
'    if(action.type!=="attack"||action.di!==null)counter.missedDirectOpportunities++;}',
'  }',
'  const ok=baseApply(game,action);',
'  if(ok&&game===g){',
'   const types=counter.selfPlayActionTypesBySeat[current];',
'   types[action.type]=(types[action.type]||0)+1;',
'  }',
'  if(ok&&game===g){',
'   if(current!==learner){',
"    if(action.type==='attack')counter.siegeEnemyAttackActions++;",
"    if(['soul-raid','soul-discharge'].includes(action.type))counter.siegeEnemySoulOffense++;",
"    if(['attack','soul-raid','soul-discharge'].includes(action.type))",
'     counter.siegeEnemyActionsThisTurn++;',
"    if(['normal','fusion'].includes(action.type))counter.siegeSummons++;",
'   }',
'   if(enemyN>0&&!foe.field.some(Boolean))counter.lastDefenderEliminated++;',
'   counter.siegeOwnCardLosses+=Math.max(0,ownN-own.field.filter(Boolean).length);',
'   counter.siegeOpponentCardRemovals+=Math.max(0,enemyN-foe.field.filter(Boolean).length);',
'   counter.siegeOpponentLPDamage+=Math.max(0,enemyLP-foe.lp);',
'   counter.siegeOwnLPDamage+=Math.max(0,ownLP-own.lp);',
'  }',
'  return ok;'
]);
// CORE SELF-PLAY SWITCH: The true test planner must process BOTH seats.
// The old v14.9.x research harness routed only 'learner' into candidateSummon
// and candidateAttack, while its opponent received the basic AI.
inject('  if(game!==g||game.active!==learner||game.pending)return baseChoose(game,policy);',[
'  if(game===g&&!game.pending)counter.selfPlayCallsBySeat[game.active]++;',
'  if(game!==g||(!scene.selfPlay&&game.active!==learner)||game.pending)return baseChoose(game,policy);'
]);
inject('  if(selected){\n   // The reference is inspected on a clone, never mutating real phase or RNG.',[
'  if(selected){',
'   if(game===g)counter.selfPlayStrategicBySeat[game.active]++;',
'   // The reference is inspected on a clone, never mutating real phase or RNG.'
]);

// Prevent an invalid position command from turning an entire self-play run
// into a research engine crash. Legal positions still go through real switchPosition.
// Never allow pending fusion placements to be masked by this guard.
inject('  const ok=baseApply(game,action);',[
'  if(game===g&&action?.type==="switch"){',
'   const c=game.players[game.active]?.field[action.idx];',
'   if(game.pending)throw Error("Invalid pending fusion switch, no fallback allowed");',
'   if(!c||c.switched||c.attacked){',
'    counter.selfPlayIllegalSwitchesBySeat[game.active]++;',
'    throw Error("Illegal strategic switch: seat="+game.active+" idx="+action.idx+" phase="+game.aiPhase);',
'   }',
'  }',
'  const ok=baseApply(game,action);'
]);

// This function is serialized into the SAME scope as the verified simulator.
function study(){
 const fs=require('node:fs'),assert=require('node:assert/strict');
 const {boot}=require('./helpers/game-runtime.cjs');
 const {makeBenchmarkDeck}=require('./helpers/lategame-ai-decks-v72.cjs');
 const catalog=boot({seed:15500042}).run('({cards:CARDS,defaultDeck:RPG_DEFAULT_DECK,startFusions:RPG_START_FUSIONS,opponents:OPPONENTS})');
 const root='artifacts/v1550';fs.mkdirSync(root,{recursive:true});
 const stage=Number(process.argv[2]);
 assert.ok(Number.isInteger(stage)&&stage>=0&&stage<9);
 // Emphasize L10 cross-role and difficult heterogeneous decks after v14.9.30.
 const matchups=stage<=1?[
  ['predator','guardian'],['fusion','guardian'],['soul','guardian'],
  ['allrounder','guardian'],['guardian','soul'],['hybrid','guardian'],
  ['predator','soul'],['fusion','soul']
 ]:stage===2?[
  ['predator','fusion'],['fusion','predator'],['soul','hybrid'],
  ['guardian','predator'],['allrounder','fusion'],['hybrid','soul'],
  ['predator','guardian'],['fusion','allrounder']
 ]:stage===3?[
  ['predator','soul'],['fusion','predator'],['soul','allrounder'],
  ['allrounder','predator'],['guardian','predator'],['hybrid','soul'],
  ['predator','hybrid'],['fusion','guardian']
 ]:stage===8?[
  ['guardian','hybrid'],['guardian','hybrid'],['guardian','hybrid'],['guardian','hybrid'],
  ['allrounder','predator'],['allrounder','predator'],
  ['allrounder','predator'],['allrounder','predator']
 ]:stage===4?[
  ['guardian','hybrid'],['allrounder','predator'],['fusion','guardian'],
  ['fusion','predator'],['guardian','hybrid'],['allrounder','predator'],
  ['soul','fusion'],['predator','soul']
 ]:[
  ['fusion','predator'],['predator','fusion'],['guardian','hybrid'],
  ['hybrid','predator'],['soul','fusion'],['allrounder','predator'],
  ['predator','soul'],['fusion','guardian']
 ];
 const Q=JSON.parse(fs.readFileSync(root+'/training-q-and-examples.json','utf8'));
 const knownQ=Q.find(x=>x.swarm===.02&&x.pierce===.10)?.learnedQ;
 assert.ok(knownQ&&Object.keys(knownQ).length>=160,'Missing prior Q values');
 // Fixed strategies and no stage-to-stage policy inheritance: select only after all five phases.
 const previousQ=JSON.parse(fs.readFileSync(root+'/older-q-checkpoint.json','utf8'));
 const latest=knownQ;
 assert.ok(Object.keys(previousQ).length>=160);
 const prior=JSON.parse(fs.readFileSync(root+'/prior-selfplay-checkpoint.json','utf8'));
 assert.ok(prior.holdoutUsed===false);
 const incumbent=JSON.parse(fs.readFileSync(root+'/incumbent-policy.json','utf8'));
 assert.equal(incumbent.sourceRun,39974390088);
 assert.equal(incumbent.arm,'guardian-soul-board');
 assert.equal(incumbent.holdoutUsedForSelection,false);
 const role=(guardian,soul,material,risk)=>({guardian,soul,material,risk});
 const champion=incumbent.policy;
 assert.deepEqual(champion,role(1.15,1.30,.85,.95));
 const balanced=JSON.parse(fs.readFileSync(root+'/research-balanced-policy.json','utf8'));
 assert.equal(balanced.sourceRun,39983397260);
 assert.equal(balanced.holdoutUsedToSelect,false);
 const balancedPolicy={...role(1.22,1.38,1.30,1.42),adaptive:true};
 assert.deepEqual(balanced.policy,balancedPolicy);
 const economy={...role(1.16,1.38,1.53,1.22),adaptive:true,roleCounter:true};
 const reference={...economy,counterfactualFusion:.40};
 // Preserve the verified v14.9.38 sequence champion unchanged; add bounded ablations.
 const material={...reference,postReplyMaterial:.70};
 const sequence={...material,sequenceFusion:.22};
 const guardedL10={...sequence,sequenceGuardianWorst:true,worstReplyCap:6,
  highThreat:true,guardianBreak:.30,allrounderGuard:.25};
 const materialPreserve={...sequence,postReplyMaterial:1.05,postReplyFusion:.65,
  highThreat:true,guardianSoul:.18};
 const decayDefense={...sequence,decayUrgency:.16,decayOnlyDefense:true,
  defensePreview:true,defenseAttackTradeoff:true,defenseContextMargin:true,
  enemyPostureResponse:true,legalReplyScope:{guardian:true,allrounder:true}};
 const combined={...decayDefense,sequenceGuardianWorst:true,worstReplyCap:6,
  highThreat:true,guardianBreak:.25,allrounderGuard:.25};
 const profiles=[
  {name:'guardian-champion',rolePolicy:champion},
  {name:'fusion-sequence-2ply',rolePolicy:sequence},
  {name:'l10-guarded-worst-reply',rolePolicy:guardedL10},
  {name:'l10-material-preservation',rolePolicy:materialPreserve},
  {name:'decay-aware-legal-defense',rolePolicy:decayDefense},
  {name:'l10-decay-combined',rolePolicy:combined}
 ];
 const shardArg=String(process.argv[3]||'');
 assert.ok(shardArg==='finalize'||/^[0-7]$/.test(shardArg),
  'Supply one pair shard 0..7 or the finalize command');
 const cases=[];
 if(shardArg==='finalize'){
  for(let p=0;p<matchups.length;p++){
   const path=root+'/stage-'+stage+'-pair-'+p+'.json';
   assert.ok(fs.existsSync(path),'Missing pair shard '+p);
   const obj=JSON.parse(fs.readFileSync(path,'utf8'));
   assert.equal(obj.stage,stage);assert.equal(obj.pair,p);
   assert.equal(obj.cases.length,stage===4?432:144,'Each pair must have expected paired matches');
   for(const row of obj.cases){
    assert.equal(row.stage,stage);assert.equal(row.pair,p);
    cases.push(row);
   }
  }
 }else{
 const requestedPair=Number(shardArg);
 for(let pair=0;pair<matchups.length;pair++){
  if(pair!==requestedPair)continue;
  const [roleA,roleB]=matchups[pair];
  const tier=stage===0?8:stage===1?9:stage===2?10:stage===3?8:10;
  const decayActive=stage===3||stage===6;
  // Stages 5 and 6 intentionally share ALL deck, matchup, RNG, seat, starter and policy inputs.
  const pairedStage=stage===6?5:stage;
  const foeTier=tier;
  const scenarios=stage===4?18:6; // Tripled hard-L10 release gate, 6/6/6 independent split.
  for(let scenario=0;scenario<scenarios;scenario++){
   const seedA=4317+pair*117+scenario*127+pairedStage*313;
   const seedB=5107+pair*121+scenario*119+pairedStage*329;
   const a=makeBenchmarkDeck(catalog,tier,roleA,'balanced',seedA);
   const b=makeBenchmarkDeck(catalog,foeTier,roleB,'balanced',seedB);
   assert.equal(a.deck.length,40);assert.equal(b.deck.length,40);
   for(let starter=0;starter<2;starter++)for(let seat=0;seat<2;seat++){
    const matchSeed=15500000+pairedStage*200000+pair*10000+scenario*1550+starter*107;
    const mirror=stage<=1;
    const opp=mirror?a:b;
    const first=seat===0?a:opp,second=seat===0?opp:a;
    for(const profile of profiles){
     const foeQ=stage===7?latest:scenario%2===0?latest:previousQ;
     const foeWeights=null;
     const foeRolePolicy=stage===7?sequence:scenario%2===0?champion:balancedPolicy;
     const m=sceneResult({deck:first.deck,fusionDeck:first.fusionDeck,
      deck1:second.deck,fusionDeck1:second.fusionDeck},
      0,matchSeed,{name:'siege',defense:.85,synergy:1,waitCost:1.1,materialCost:.53,aggression:1},
      starter,seat,{siegeStage:6,studyStage:stage,selfPlay:true,decision:'lookahead',q:latest,
      summonForecast:true,summonCounterDepth:2,summonThreshold:75,forecastBudget:8,
      roleAware:true,siegeWeights:null,finishMode:null,candidateRole:roleA,
      finishModesBySeat:[null,null],
      weightModesBySeat:seat===0?[null,foeWeights]:[foeWeights,null],
      rolePoliciesBySeat:seat===0?[profile.rolePolicy,foeRolePolicy]:[foeRolePolicy,profile.rolePolicy],
      qModesBySeat:seat===0?[latest,foeQ]:[foeQ,latest],
      rolesBySeat:seat===0?[roleA,mirror?roleA:roleB]:[mirror?roleA:roleB,roleA],
      recordReplay:scenario<(stage===4?6:2)||(stage===7&&profile.name==='fusion-sequence-2ply'),
      opponentPolicy:'balanced',
      swarm:.02,pierce:.10,
      decayEnabled:decayActive});
     assert.equal(m.invalid,0,'Illegal actions');
     assert.equal(m.initialLP[0],m.initialLP[1],'Unequal initial LP');
     const enemyAttacks=m.stats.siegeEnemyAttackActions||0;
     const enemySoul=m.stats.siegeEnemySoulOffense||0;
     assert.ok(Number.isFinite(enemyAttacks+enemySoul),'Missing opponent action counters');
     assert.deepEqual(m.stats.selfPlayIllegalSwitchesBySeat,[0,0],
      'Illegal switch emitted from strategic AI');
     assert.ok(m.stats.selfPlayCallsBySeat.every(n=>n>0),
      'Both seats MUST use the experimental AI decision planner');
     const reward=m.candidateWin*100+
      Math.min(35,(m.stats.siegeOpponentLPDamage||0)/180)+
      Math.min(15,(m.stats.siegeOpponentCardRemovals||0)*2)-
      Math.min(18,(m.stats.siegeOwnCardLosses||0)*2.5)-
      Math.min(30,m.turn*.45)-(m.timeout?20:0);
     cases.push({stage,arm:profile.name,rolePolicy:profile.rolePolicy,
      foeCheckpoint:stage===7?'two-ply-v1541':scenario%2?'balanced-v1529':'champion-v1528',symmetric:profile.name==='guardian-champion'&&scenario%2===0,
      pair,roleA,roleB:mirror?roleA:roleB,mirror,tier,foeTier,scenario,
      split:scenario<(stage===4?6:2)?'train':scenario<(stage===4?12:4)?'validation':'holdout',
      starter,seat,seed:matchSeed,seedA,seedB,decayEnabled:decayActive,decayPairStage:pairedStage,
      win:m.candidateWin,reason:m.reason,timeout:m.timeout,turn:m.turn,
      enemyOffense:enemyAttacks+enemySoul,enemyAttacks,enemySoul,
      counterSuppressed:m.stats.siegeCounterBlocked||0,
      illegalSwitchesBySeat:m.stats.selfPlayIllegalSwitchesBySeat,
      selfPlayCallsBySeat:m.stats.selfPlayCallsBySeat,
      selfPlayStrategicBySeat:m.stats.selfPlayStrategicBySeat,
      selfPlayActionTypesBySeat:m.stats.selfPlayActionTypesBySeat,
      fusionReplyEvaluations:m.stats.fusionReplyEvaluations||0,
      attackReplyEvaluations:m.stats.attackReplyEvaluations||0,
      fusionOpportunityEvaluations:m.stats.fusionOpportunityEvaluations||0,
      counterfactualFusionEvaluations:m.stats.counterfactualFusionEvaluations||0,
      softFusionEvaluations:m.stats.softFusionEvaluations||0,
      adaptiveCounterEvaluations:m.stats.adaptiveCounterEvaluations||0,
      attackReplySimulations:m.stats.attackReplySimulations||0,
      attackReplyHits:m.stats.attackReplyHits||0,
      attackReplyLoss:m.stats.attackReplyLoss||0,
      allrounderGuardChecks:m.stats.allrounderGuardChecks||0,
      allrounderOpeningChecks:m.stats.allrounderOpeningChecks||0,
      guardianBreakEvaluations:m.stats.guardianBreakEvaluations||0,
      guardianBreakViable:m.stats.guardianBreakViable||0,
      guardianSoulEvaluations:m.stats.guardianSoulEvaluations||0,
      guardianFacingActions:m.stats.guardianFacingActions||0,
      postReplyFusionChecks:m.stats.postReplyFusionChecks||0,
      postReplyFusionSurvivors:m.stats.postReplyFusionSurvivors||0,
      postReplyFusionLosses:m.stats.postReplyFusionLosses||0,
      postReplyMaterialChecks:m.stats.postReplyMaterialChecks||0,
      sequenceFusionChecks:m.stats.sequenceFusionChecks||0,
      sequenceLegalOwnAttacks:m.stats.sequenceLegalOwnAttacks||0,
      sequenceLegalEnemyReplies:m.stats.sequenceLegalEnemyReplies||0,
      sequenceUtilityGain:m.stats.sequenceUtilityGain||0,
      decayUrgencyChecks:m.stats.decayUrgencyChecks||0,
      worstReplySearches:m.stats.worstReplySearches||0,
      worstReplyLegalTrials:m.stats.worstReplyLegalTrials||0,
      worstReplyMoreDangerous:m.stats.worstReplyMoreDangerous||0,
      worstReplyGuardianSearches:m.stats.worstReplyGuardianSearches||0,
      defenseProbes:m.stats.defenseProbes||0,
      defenseLegalSwitches:m.stats.defenseLegalSwitches||0,
      defenseChosen:m.stats.defenseChosen||0,
      defenseReplyAttacks:m.stats.defenseReplyAttacks||0,
      defenseTradeoffChecks:m.stats.defenseTradeoffChecks||0,
      defenseTradeoffOwnAttacks:m.stats.defenseTradeoffOwnAttacks||0,
      defenseTradeoffSwitches:m.stats.defenseTradeoffSwitches||0,
      defenseMarginChecks:m.stats.defenseMarginChecks||0,
      defenseMarginRejected:m.stats.defenseMarginRejected||0,
      defenseMarginAccepted:m.stats.defenseMarginAccepted||0,
      contextMarginChecks:m.stats.contextMarginChecks||0,
      contextMarginTotal:m.stats.contextMarginTotal||0,
      contextMarginLow:m.stats.contextMarginLow||0,
      contextMarginHigh:m.stats.contextMarginHigh||0,
      contextMarginDecay:m.stats.contextMarginDecay||0,
      enemyPostureSearches:m.stats.enemyPostureSearches||0,
      enemyPostureCandidates:m.stats.enemyPostureCandidates||0,
      enemyPostureLegal:m.stats.enemyPostureLegal||0,
      enemyPostureWorse:m.stats.enemyPostureWorse||0,
      enemyPostureGuardianSearches:m.stats.enemyPostureGuardianSearches||0,
      tacticalReplyChecks:m.stats.tacticalReplyChecks||0,
      tacticalReplyCandidates:m.stats.tacticalReplyCandidates||0,
      tacticalReplyLegal:m.stats.tacticalReplyLegal||0,
      tacticalReplyWorst:m.stats.tacticalReplyWorst||0,
      tacticalReplyGuardian:m.stats.tacticalReplyGuardian||0,
      tacticalReplyAllrounder:m.stats.tacticalReplyAllrounder||0,
      forecastChanges:m.stats.summonForecastChanges||0,
      fusionForecastChanges:m.stats.fusionForecastChanges||0,
      candidateActionMix:m.stats.selfPlayActionTypesBySeat[seat],
      readyDirectOpportunities:m.stats.readyDirectOpportunities||0,
      missedDirectOpportunities:m.stats.missedDirectOpportunities||0,
      breachSwitches:m.stats.breachSwitches||0,breachAttacks:m.stats.breachAttacks||0,
      lastDefenderEliminated:m.stats.lastDefenderEliminated||0,
      finishWindows:m.stats.finishWindows||0,finishAttacks:m.stats.finishAttacks||0,
      finishSwitches:m.stats.finishSwitches||0,finishEnds:m.stats.finishEnds||0,
      soulDisabled:false,counterDisabled:false,
      enemySummons:m.stats.siegeSummons||0,
      enemiesRemoved:m.stats.siegeOpponentCardRemovals||0,
      ownLost:m.stats.siegeOwnCardLosses||0,
      enemyDamage:m.stats.siegeOpponentLPDamage||0,
      ownDamage:m.stats.siegeOwnLPDamage||0,reward,
      actions:scenario<(stage===4?6:2)?m.stats.actionTape||[]:[]});
    }
   }
  }
 }
 assert.equal(cases.length,stage===4?432:144,'One pair shard match count');
 fs.writeFileSync(root+'/stage-'+stage+'-pair-'+requestedPair+'.json',
  JSON.stringify({stage,pair:requestedPair,cases})+'\n');
 console.log('ARCANE_V1550_PAIR '+JSON.stringify({stage,pair:requestedPair,games:cases.length,
  splitCounts:Object.fromEntries(['train','validation','holdout'].map(t=>
   [t,cases.filter(x=>x.split===t).length]))}));
 return;
 }
 assert.equal(cases.length,stage===4?3456:1152,'Stage matched selfplay games');
 function summary(rows){
  const n=rows.length;assert.ok(n>0);
  return {games:n,wins:rows.reduce((v,r)=>v+r.win,0),
   plannerCallsBySeat:[0,1].map(seat=>rows.reduce((v,r)=>v+r.selfPlayCallsBySeat[seat],0)),
   strategicChoicesBySeat:[0,1].map(seat=>rows.reduce((v,r)=>v+r.selfPlayStrategicBySeat[seat],0)),
   timeouts:rows.filter(r=>r.timeout).length,
   meanTurns:rows.reduce((v,r)=>v+r.turn,0)/n,
   meanReward:rows.reduce((v,r)=>v+r.reward,0)/n,
   totalOpponentOffense:rows.reduce((v,r)=>v+r.enemyOffense,0),
   totalOpponentSummons:rows.reduce((v,r)=>v+r.enemySummons,0),
   meanEnemyDamage:rows.reduce((v,r)=>v+r.enemyDamage,0)/n,
   meanRemoved:rows.reduce((v,r)=>v+r.enemiesRemoved,0)/n,
   bySeat:Object.fromEntries([0,1].map(seat=>{const a=rows.filter(r=>r.seat===seat);return [seat,{games:a.length,wins:a.reduce((v,r)=>v+r.win,0),timeouts:a.filter(r=>r.timeout).length}]})),
   finishing:{directAttacks:rows.reduce((v,r)=>v+r.finishAttacks,0),stanceSwitches:rows.reduce((v,r)=>v+r.finishSwitches,0),
    breachSwitches:rows.reduce((v,r)=>v+r.breachSwitches,0),
    breachAttacks:rows.reduce((v,r)=>v+r.breachAttacks,0),
    readyDirectOpportunities:rows.reduce((v,r)=>v+r.readyDirectOpportunities,0),
    missedDirectOpportunities:rows.reduce((v,r)=>v+r.missedDirectOpportunities,0)} };
 }
 const summaries=profiles.map(profile=>{
  const rows=cases.filter(x=>x.arm===profile.name);
  return {arm:profile.name,rolePolicy:profile.rolePolicy,
   train:summary(rows.filter(x=>x.split==='train')),
   validation:summary(rows.filter(x=>x.split==='validation')),
   holdout:summary(rows.filter(x=>x.split==='holdout'))};
 });
 const baseline=summaries[0];
 const result={schema:'arcane-v1550-stage',stage,
  name:['champion-l8-mirror','champion-l9-mirror','champion-l10-crossrole',
   'champion-l8-crossrole-with-decay','expanded-hard-l10-crossrole','paired-no-decay-hard-l10','paired-full-decay-hard-l10',
   'direct-head-to-head-v1541-l10','diagnostic-new-hard-l10-guardian-hybrid-allrounder-predator'][stage],
  learningSource:'v14.9.50 hard-L10 guarded fusion, material survival, and decay-aware legal defense; no holdout-derived weights',
  controls:{pairedSeeds:true,pairedSeats:true,pairedStarters:true,
   independentTrainValidationHoldout:true,priorQCheckpointOpponent:true,
   incumbentChampionPolicyVerified:true,currentOpponentAlsoUsesChampion:stage!==7,
   balancedOpponentFromPriorResearch:true,enemyRoleAdaptationEnabled:true,
   difficultL10CrossRole:true,visibleHighLevelThreatScoring:true,
   oneVisibleReplyEvaluation:true,componentAblation:true,
   clonedLegalAttackResponseUsed:true,fusionValueAblations:true,
   visibleL10AdaptiveCounter:true,limitedContextualFusion:true,
   legalClonedAttackResponseAfterAttack:true,seatRoleDiagnostics:true,
   matchedSeatStarterAudit:true,allrounderPolicyAblation:true,
   guardianBreakEvaluation:true,guardianSoulEvaluation:true,
   postReplyFusionSurvivalAudit:true,postReplyMaterialAudit:true,
   decayExperimentalStage:stage===3||stage===6,nonSelectionDecayStage:[5,6,7,8].includes(stage),
   sameSeedsDecayABPair:true,identicalInitialDecksForDecayAB:true,
   legalTwoPlyOwnAndEnemyReply:true,fullDecayUrgencyAblation:true,
   boundedVisibleWorstReplySearch:true,targetedGuardianSoulReplySearch:true,
   legalDefensiveActionSelection:true,headToHeadFrozenTwoPly:stage===7,
   targetedHardL10Diagnostic:stage===8,activeDecayInPrimaryStage3:stage===3,
   offenseVsDefenseSameHorizon:true,frozenLegacyDefenseControl:false,
   defenseMarginAblation:true,defenseMarginTight:260,
   visibleContextualMargin:true,contextualMarginLow:105,contextualMarginHigh:285,
   legalFutureOpponentPostureReply:true,guardianSoulOpponentPostureAblation:true,
   holdoutNeverUsedForSelection:true,globalSelectionOnly:true,
   noStageToStagePolicyInheritance:true},
  selectionMethod:'NO stage promotion; stages 0-4 TRAIN+VALIDATION including decay stage 3; A/B stages 5-6 excluded from promotion and Q training.',
  chosenArm:'guardian-champion',selectedRolePolicy:champion,
  previousSelectedRolePolicy:null,promoted:false,
  trainCandidate:baseline.train,trainBaseline:baseline.train,
  validationCandidate:baseline.validation,validationBaseline:baseline.validation,
  holdoutCandidate:baseline.holdout,holdoutBaseline:baseline.holdout,
  summaries,allCases:cases.map(({actions,...row})=>row)};
 fs.writeFileSync(root+'/stage-'+stage+'.json',JSON.stringify(result,null,2)+'\n');
 fs.writeFileSync(root+'/stage-'+stage+'-train-actions.json',JSON.stringify({
  schema:'arcane-v1550-training-only-actions',stage,
  examples:cases.filter(x=>x.split==='train').map(x=>({
   arm:x.arm,pair:x.pair,roleA:x.roleA,roleB:x.roleB,
   win:x.win,turn:x.turn,reward:x.reward,actions:x.actions
  }))})+'\n');
 console.log('ARCANE_V1550_STAGE '+JSON.stringify({stage,name:result.name,
  winner:'guardian-champion',policies:profiles.map(p=>p.name),
  training:baseline.train,validation:baseline.validation,holdout:baseline.holdout,
  baselineHoldout:baseline.holdout,games:cases.length}));
}
const inner='\nnew Function("require","process","console",src+"\\n("+'
 +JSON.stringify(study.toString())+'+")()")(require,process,console);';
new Function('require','process','console',
 prefix+'\n'+patchLines.join('\n')+inner)(require,process,console);
