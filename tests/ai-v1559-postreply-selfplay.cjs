'use strict';
/* v14.9.59 research-only: role-scoped defender decision policies against the
 * frozen v14.9.55 champion, with fixed essence-reserve and conditional-reply
 * variants. The live gameplay AI is not changed by this research harness. */
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
" counter.preciseAttackChecks=0;counter.preciseAttackSwing=0;",
" counter.fusionPatienceChecks=0;counter.fusionPatiencePenalties=0;",
" counter.defenseThreatGated=0;counter.defenseThreatEligible=0;",
" counter.defenseAttackLockChecks=0;counter.defenseAttackLocks=0;",
" counter.defenseArmorChecks=0;counter.defenseArmorRejected=0;",
" counter.defenseCardThreatChecks=0;counter.defenseCardThreatRejected=0;",
" counter.defenseScopedAttackChecks=0;counter.defenseScopedAttackLocks=0;",
" counter.defenderAbilityChecks=0;counter.defenderAbilityAlternatives=0;",
" counter.defenderAbilityOverrides=0;counter.defenderAbilityLethals=0;",
" counter.defenderCondenseChosen=0;counter.defenderCondenseApplied=0;",
" counter.defenderCondenseOffered=0;",
" counter.defenderRaidPreferred=0;counter.defenderDischargePreferred=0;",
" counter.defenderScopedSkipped=0;counter.defenderCriticalReplyChecks=0;",
" counter.defenderCriticalReplySkipped=0;counter.defenderReserveEvaluations=0;",
" counter.defenderReservePenaltyTotal=0;",
" counter.defenderFutureEvaluations=0;counter.defenderFuturePenaltyTotal=0;",
" counter.defenderCondenseThreatOpportunities=0;",
" counter.defenderCondenseLegalTrials=0;counter.defenderCondenseRejectedTrials=0;",
" counter.defenderCondenseOfferedSoulTotal=0;",
" counter.defenderDischargeWindowChecks=0;counter.defenderDischargeWindowPenalties=0;",
" counter.defenderCondenseTimingChecks=0;",
" counter.defenderPostReplyForecasts=0;counter.defenderPostReplyLegal=0;",
" counter.defenderPostReplyWins=0;counter.defenderPostReplyValueTotal=0;",
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
"    const selfBefore=game.players[game.active];",
"    const hostilePeak=Math.max(0,...opponent.field.filter(Boolean).map(c=>dataOf(c).atk));",
"    const threatened=selfBefore.field.filter(c=>c&&c.mode==='atk'&&!c.attacked&&!c.switched&&dataOf(c).atk<hostilePeak).length;",
"    const danger=threatened>0&&(opponent.field.filter(Boolean).length>=2||",
"     selfBefore.lp<Math.max(4500,hostilePeak*1.5));",
"    let favorableAttack=false;",
"    if(danger&&defenseCfg.defenseAttackOpportunityLock){",
"     counter.defenseAttackLockChecks++;",
"     const z=JSON.parse(JSON.stringify(game)),mySeat=game.active,foeSeat=1-mySeat;",
"     const beforeEnemies=z.players[foeSeat].field.filter(Boolean).length;",
"     const beforeOwn=z.players[mySeat].field.filter(Boolean).length;",
"     z.active=mySeat;z.aiPhase='attacks';",
"     for(let t=0;t<2&&z.winner===null;t++){",
"      const move=attackPlan(z);",
"      if(!move||!Number.isInteger(move.ai)||!attack(z,move.ai,move.di))break;",
"     }",
"     const removed=beforeEnemies-z.players[foeSeat].field.filter(Boolean).length;",
"     const lost=beforeOwn-z.players[mySeat].field.filter(Boolean).length;",
"     // Preserve legal, immediately profitable attacks; the full enemy turn is unknown.",
"     favorableAttack=z.winner===mySeat||(removed>0&&lost===0);",
"     if(favorableAttack)counter.defenseAttackLocks++;",
"    }",
"    if(defenseCfg.defenseThreatGate){",
"     if(danger)counter.defenseThreatEligible++;else counter.defenseThreatGated++;",
"    }",
"    if((!defenseCfg.defenseThreatGate||danger)&&!favorableAttack){",
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
"      if(defenseCfg.defensePerCardThreatGate){",
"       counter.defenseCardThreatChecks++;",
"       const ownAttack=dataOf(card).atk;",
"       const enemyPeak=Math.max(0,...opponent.field.filter(Boolean).map(c=>dataOf(c).atk));",
"       // Do not shelter a strong attacker merely because an unrelated ally is vulnerable.",
"       // Still permit protection during a genuinely dangerous low-LP board state.",
"       if(enemyPeak<ownAttack*.96&&self.lp>enemyPeak*1.1){",
"        counter.defenseCardThreatRejected++;continue;",
"       }",
"      }",
"      if(defenseCfg.defenseScopedAttackLock){",
"       counter.defenseScopedAttackChecks++;",
"       const trial=JSON.parse(JSON.stringify(game)),foe=1-me;",
"       const initialEnemies=trial.players[foe].field.filter(Boolean).length;",
"       const initialOwn=trial.players[me].field.filter(Boolean).length;",
"       const oldEnemy=trial.players[foe].field.map(c=>c&&{id:c.id,atk:dataOf(c).atk});",
"       trial.active=me;trial.aiPhase='attacks';",
"       let sameAttacker=false,criticalRemoval=false;",
"       for(let n=0;n<2&&trial.winner===null;n++){",
"        const action=attackPlan(trial);",
"        if(!action||!Number.isInteger(action.ai))break;",
"        const before=trial.players[foe].field.filter(Boolean).length;",
"        const atThisCard=action.ai===idx;",
"        if(!attack(trial,action.ai,action.di))break;",
"        if(atThisCard){",
"         sameAttacker=true;",
"         const removed=before>trial.players[foe].field.filter(Boolean).length;",
"         const oldTarget=Number.isInteger(action.di)?oldEnemy[action.di]:null;",
"         if(removed&&oldTarget&&oldTarget.atk>=hostilePeak*.7)criticalRemoval=true;",
"        }",
"       }",
"       const ownSurvived=trial.players[me].field.filter(Boolean).length>=initialOwn;",
"       const removal=initialEnemies>trial.players[foe].field.filter(Boolean).length;",
"       const finishing=trial.winner===me;",
"       if(sameAttacker&&(finishing||(criticalRemoval&&removal&&ownSurvived&&",
"          self.lp>Math.max(2200,hostilePeak*.9)))){",
"        counter.defenseScopedAttackLocks++;continue;",
"       }",
"      }",
"      if(defenseCfg.defenseArmorGate){",
"       counter.defenseArmorChecks++;",
"       const armor=dataOf(card),gain=armor.def-armor.atk;",
"       // DEF must actually protect the card; avoid sacrificing a strong attacker",
"       // to gain negligible armor against visible L10/Guardian/Hybrid threats.",
"       const highGuard=opponent.field.some(c=>c&&dataOf(c).level>=9&&",
"        (role(c)==='guardian'||role(c)==='combatant'));",
"       const minimumGain=Math.max(highGuard?135:90,armor.atk*(highGuard?.13:.09));",
"       if((gain<minimumGain&&self.lp>hostilePeak*.7)||",
"          (highGuard&&armor.def<hostilePeak*.82&&armor.atk>=hostilePeak*.70)){",
"        counter.defenseArmorRejected++;continue;",
"       }",
"      }",
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
"     if(w.fusionPatience&&fusion&&mat.length>=2&&mat.length===(opt.a.uids||[]).length&&",
"        (foeGuard>0||foeSoul>0)){",
"      // Hold costly hand fusion when visible defenders negate its immediate net value.",
"      const left=own.hand.length-mat.length;",
"      const maxGuard=Math.max(0,...foe.field.filter(c=>c&&['guardian','soul'].includes(role(c))).map(c=>dataOf(c).def));",
"      const cannotBreak=(fusion.atk||0)<maxGuard*.90;",
"      const penalty=cannotBreak?(left<=3?140:70):(left<=3?(left<=2?65:25):0);",
"      opt.score-=w.fusionPatience*penalty;",
"      counter.fusionPatienceChecks++;if(penalty)counter.fusionPatiencePenalties++;",
"     }",
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
"    if(w.preciseAttackTrade){",
"     const enemyBefore=g.players[1-g.active],enemyAfter=trial.players[1-g.active];",
"     const ownBeforeCount=g.players[g.active].field.filter(Boolean).length;",
"     const ownAfterCount=trial.players[g.active].field.filter(Boolean).length;",
"     const removed=enemyBefore.field.filter(Boolean).length-enemyAfter.field.filter(Boolean).length;",
"     const lost=ownBeforeCount-ownAfterCount;",
"     const deltaLP=Math.max(0,enemyBefore.lp-enemyAfter.lp);",
"     const lostLP=Math.max(0,ownBefore-trial.players[g.active].lp);",
"     const swing=Math.max(-520,Math.min(520,removed*215-lost*245+deltaLP*.12-lostLP*.16));",
"     opt.score+=w.preciseAttackTrade*swing;",
"     counter.preciseAttackChecks++;counter.preciseAttackSwing+=swing;",
"    }",
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
"          const proposals=[];",
"          for(let ai=0;ai<y.players[op].field.length;ai++){",
"           const attacker=y.players[op].field[ai];",
"           if(!attacker||!canAttack(y,attacker))continue;",
"           for(const di of targets){",
"            const victim=Number.isInteger(di)?ownField[di]:null;",
"            const power=effectiveAttack(y,attacker,victim);",
"            const armor=victim?dataOf(victim)[victim.mode==='def'?'def':'atk']:0;",
"            const priority=roleWeights.prioritizeWorstReplies?",
"             (victim?Math.max(0,power-armor)*1.5+dataOf(victim).atk*.32+",
"              Math.min(power,armor)*.12:power*2):0;",
"            proposals.push({ai,di,priority});",
"           }",
"          }",
"          if(roleWeights.prioritizeWorstReplies)proposals.sort((a,b)=>",
"           b.priority-a.priority||a.ai-b.ai||(a.di??-1)-(b.di??-1));",
"          for(const move of proposals){",
"            if(trials>=cap)break;trials++;",
"            const z=JSON.parse(JSON.stringify(y));",
"            if(!attack(z,move.ai,move.di))continue;",
"            counter.worstReplyLegalTrials++;",
"            const value=utility(z);",
"            if(value<bestUtility){bestUtility=value;best=z;}",
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

// Research-only legal ability: exactly the visible amount/cooldown/shield math
// of assets/essence-combat.js::condense, without modifying live PvE or PvP.
inject(' chooseAiAction=function(game,policy){',String.raw`
 function researchCondense(game,action){
  if(!game.essenceRules||!game.strategicTraining?.symmetricSides||
    game.turn<game.strategicTraining.soulUnlockTurn||game.pending||game.winner!==null)return false;
  const c=game.players[game.active].field[action.idx];
  if(!c||role(c)!=='soul'||c.mode!=='def')return false;
  const s=window.ArcaneEssenceCombat.statLayer(c);
  if(s.soul<40||s.cooldown>0||s.lastSoulAction===game.turn)return false;
  const amount=Math.floor(s.soul*.75);
  s.soul-=amount;s.condensed=Math.min(9000,s.condensed+amount);
  s.condenseLeft=3;s.condenseSlice=Math.ceil(s.condensed/3);
  s.cooldown=3;s.lastSoulAction=game.turn;
  return true;
 }
 function defenderScore(game,action,w){
  const me=game.active,opp=1-me,x=JSON.parse(JSON.stringify(game));
  const a=game.players[me],e=game.players[opp],xown=x.players[me],xfoe=x.players[opp];
  const energy=team=>team.field.filter(Boolean).reduce((n,c)=>n+(c.essenceCombat?.soul||0),0);
  const shield=team=>team.field.filter(Boolean).reduce((n,c)=>n+(c.essenceCombat?.condensed||0),0);
  const stats=team=>team.field.filter(Boolean).reduce((n,c)=>n+dataOf(c).atk*.5+dataOf(c).def*.3,0);
  const beforeEnemy=stats(e),beforeOwn=stats(a);
  const beforeEnergy=energy(a),beforeShield=shield(a);
  const ownCount=a.field.filter(Boolean).length,foeCount=e.field.filter(Boolean).length;
  const ok=action.type==='soul-condense'?researchCondense(x,action):
   ['soul-raid','soul-discharge'].includes(action.type)?
    window.ArcaneEssenceCombat.researchSoulAction(x,action):
   action.type==='attack'?attack(x,action.ai,action.di):false;
  if(action.type==='soul-condense'){
   if(ok)counter.defenderCondenseLegalTrials++;
   else counter.defenderCondenseRejectedTrials++;
  }
  if(!ok)return null;
  const immediate=Math.max(0,e.lp-xfoe.lp),ownDamage=Math.max(0,a.lp-xown.lp);
  const removed=foeCount-xfoe.field.filter(Boolean).length;
  const lost=ownCount-xown.field.filter(Boolean).length;
  const energyGain=energy(xown)-beforeEnergy,shieldGain=shield(xown)-beforeShield;
  let value=immediate*.85+Math.max(0,beforeEnemy-stats(xfoe))*.34+
    removed*325-lost*420-ownDamage*.75+
    Math.max(-250,Math.min(250,energyGain))*.21+
    Math.max(-400,Math.min(400,shieldGain))*.22;
  const lethal=x.winner===me||xfoe.lp<=0;
  if(lethal)value+=30000;
  // Deliberate non-lethal discharge sacrifices stored essence and the option
  // to disable a stronger threat next turn. Price that future opportunity
  // without blocking an immediate win. All information is currently public.
  if(w.defenderEssenceReserve&&action.type==='soul-discharge'&&!lethal){
   const spent=Math.max(0,beforeEnergy-energy(xown));
   const penalty=Math.min(440,spent*w.defenderEssenceReserve)*
    (xfoe.lp>=2200?1:.5);
   value-=penalty;
   counter.defenderReserveEvaluations++;
   counter.defenderReservePenaltyTotal+=penalty;
  }
  if(w.defenderFutureDamage&&action.type==='soul-discharge'&&!lethal){
   // A release has immediate value, but depleting the last defensive essence
   // against a visibly dangerous board sacrifices a future raid or shield.
   // No hidden cards, test outcomes or future draws are consulted here.
   const spent=Math.max(0,beforeEnergy-energy(xown));
   const theirThreat=Math.max(0,...e.field.filter(Boolean).map(c=>dataOf(c).atk));
   const ownGuard=Math.max(200,...a.field.filter(c=>c&&c.mode==='def')
    .map(c=>dataOf(c).def+(c.essenceCombat?.soul||0)));
   const urgency=Math.max(.55,Math.min(1.45,theirThreat/ownGuard));
   const scarce=energy(xown)<100?1.20:1;
   const pressure=xfoe.lp<1800?.50:1;
   const penalty=Math.min(300,spent*w.defenderFutureDamage*urgency*scarce)*pressure;
   value-=penalty;
   counter.defenderFutureEvaluations++;
   counter.defenderFuturePenaltyTotal+=penalty;
  }
  if(w.defenderDischargeWindow&&action.type==='soul-discharge'&&!lethal){
   // Near-finishing damage can justify spending soul; weak nonlethal damage
   // under public counterpressure has a future opportunity cost.
   const spent=Math.max(0,beforeEnergy-energy(xown));
   const fraction=immediate/Math.max(1,e.lp);
   const enemyPressure=Math.max(0,...e.field.filter(Boolean).map(c=>dataOf(c).atk));
   const guarded=Math.max(200,...a.field.filter(c=>c&&c.mode==='def')
    .map(c=>dataOf(c).def+(c.essenceCombat?.soul||0)));
   let correction=0;
   if(fraction>=.67&&e.lp<=2200)correction+=Math.min(135,immediate*.14);
   if(fraction<.25&&spent>80&&enemyPressure>guarded*.8)
    correction-=Math.min(180,spent*.24);
   value+=correction;
   counter.defenderDischargeWindowChecks++;
   if(correction<0)counter.defenderDischargeWindowPenalties++;
  }
  if(action.type==='soul-condense'){
   const enemyAttack=Math.max(0,...e.field.filter(Boolean).map(c=>dataOf(c).atk));
   const soul=game.players[me].field[action.idx];
   const layer=window.ArcaneEssenceCombat.statLayer(soul);
   const restored=window.ArcaneEssenceCombat.statLayer(xown.field[action.idx]);
   const beforeArmor=dataOf(soul).def+layer.soul+layer.condensed;
   const afterArmor=dataOf(soul).def+restored.soul+restored.condensed;
   // Shield gain has tactical value only if it prevents a visible breach.
   if(enemyAttack>beforeArmor&&enemyAttack<=afterArmor)value+=280;
   else if(enemyAttack<=beforeArmor)value-=95;
   if(w.defenderCondenseThreatOnly){
    // Condensed energy absorbs an incoming strike *before* unstable soul
    // essence. This can avert soul-loss burn, at the cost of a 3-turn decay
    // and cooldown. Only reward it when an enemy can strike soon.
    const moved=Math.max(0,layer.soul-restored.soul);
    const attackPressure=Math.max(0,Math.min(1.5,
     (enemyAttack-dataOf(soul).def*.5)/Math.max(1,beforeArmor)));
    value+=Math.min(245,moved*.24*attackPressure);
    if(enemyAttack<beforeArmor*.50)value-=150;
   }
   if(w.defenderCondenseTiming){
    // Visible threat guides shield timing; reserve has cooldown and decay.
    const ratio=enemyAttack/Math.max(1,beforeArmor);
    if(ratio<.60)value-=220;
    else if(ratio>=.65&&ratio<=1.25)value+=Math.min(140,100*ratio);
    if(restored.condensed<80)value-=60;
    counter.defenderCondenseTimingChecks++;
   }
  }
  const enemyHighAttack=Math.max(0,...xfoe.field.filter(Boolean).map(c=>dataOf(c).atk));
  const ownLowestDefense=Math.min(...xown.field.filter(c=>c&&c.mode==='def').map(c=>dataOf(c).def),Infinity);
  const urgentReply=xfoe.lp<2500||xown.lp<2500||
   enemyHighAttack>xown.lp*.55||
   ownLowestDefense<enemyHighAttack*.68;
  if(w.defenderDamagePlanner>=2&&x.winner===null&&
     (!w.defenderCriticalReplyOnly||urgentReply)){
   if(w.defenderCriticalReplyOnly)counter.defenderCriticalReplyChecks++;
   const y=JSON.parse(JSON.stringify(x));
   y.active=opp;y.turn++;y.aiPhase='attacks';
   for(const c of y.players[opp].field)if(c)c.attacked=false;
   for(let t=0;t<2&&y.winner===null;t++){
    const reply=attackPlan(y);
    if(!reply||!Number.isInteger(reply.ai)||!attack(y,reply.ai,reply.di))break;
   }
   value-=Math.max(0,a.lp-y.players[me].lp)*.58;
   value-=(ownCount-y.players[me].field.filter(Boolean).length)*210;
   if(y.winner===opp)value-=30000;
   // Research-only bounded post-reply follow-up: inspect the actual visible
   // successor board after legal opponent attacks. This is NOT a full turn:
   // no unseen hand, no newly drawn cards and no hypothetical deck outcomes.
   if(w.defenderPostReplyFollowup&&urgentReply&&y.winner===null){
    counter.defenderPostReplyForecasts++;
    let bestFuture=0;
    const futureOwn=y.players[me],futureFoe=y.players[opp];
    const targets=futureFoe.field.map((c,i)=>({c,i})).filter(t=>t.c)
     .sort((a,b)=>dataOf(b.c).atk-dataOf(a.c).atk).slice(0,1);
    const soulActors=futureOwn.field.map((c,i)=>({c,i}))
     .filter(t=>t.c&&role(t.c)==='soul'&&t.c.mode==='def').slice(0,2);
    for(const actor of soulActors){
     const layer=window.ArcaneEssenceCombat.statLayer(actor.c);
     const followups=[];
     if(layer.soul>=40)followups.push({type:'soul-discharge',idx:actor.i});
     if(layer.raidCooldown<=0&&targets.length)
      followups.push({type:'soul-raid',idx:actor.i,target:targets[0].i});
     for(const followup of followups){
      const z=JSON.parse(JSON.stringify(y));
      z.active=me;z.turn=y.turn+1;z.aiPhase='attacks';
      const beforeLP=z.players[opp].lp,beforeThreat=stats(z.players[opp]);
      const ok=window.ArcaneEssenceCombat.researchSoulAction(z,followup);
      if(!ok)continue;
      counter.defenderPostReplyLegal++;
      const damage=Math.max(0,beforeLP-z.players[opp].lp);
      const threatReduction=Math.max(0,beforeThreat-stats(z.players[opp]));
      const nextScore=damage*.32+threatReduction*.20+
       (z.winner===me?1050:0);
      if(z.winner===me)counter.defenderPostReplyWins++;
      bestFuture=Math.max(bestFuture,nextScore);
     }
    }
    const discounted=Math.min(400,bestFuture*w.defenderPostReplyFollowup);
    value+=discounted;
    counter.defenderPostReplyValueTotal+=discounted;
   }
  }
  else if(w.defenderDamagePlanner>=2&&w.defenderCriticalReplyOnly&&x.winner===null)
   counter.defenderCriticalReplySkipped++;
  return {a:action,score:value,lethal,immediate};
 }
 function chooseDefenderDamageAction(game,w,fallback){
  if(!w?.defenderDamagePlanner||game.aiPhase!=='attacks'||game.pending||game.winner!==null)return fallback;
  if(w.defenderRoleScope&&!['soul','guardian'].includes(scene.candidateRole)){
   counter.defenderScopedSkipped++;return fallback;
  }
  const me=game.active,own=game.players[me],foe=game.players[1-me];
  const souls=own.field.map((c,i)=>({c,i})).filter(({c})=>c&&role(c)==='soul'&&c.mode==='def');
  if(!souls.length)return fallback;
  const options=new Map(),add=a=>{if(a)options.set(JSON.stringify(a),a);};
  if(fallback&&['attack','soul-raid','soul-discharge'].includes(fallback.type))add(fallback);
  const threats=foe.field.map((c,i)=>({c,i})).filter(x=>x.c).sort((a,b)=>
    (dataOf(b.c).atk+dataOf(b.c).def)-(dataOf(a.c).atk+dataOf(a.c).def));
  for(const {c,i} of souls){
   const s=window.ArcaneEssenceCombat.statLayer(c);
   if(s.lastSoulAction===game.turn)continue;
   if(s.raidCooldown===0)for(const t of threats.slice(0,3))add({type:'soul-raid',idx:i,target:t.i});
   if(s.soul>=40&&s.lastDischarge!==game.turn)add({type:'soul-discharge',idx:i});
   if(w.defenderAllowCondense&&s.soul>=40&&s.cooldown===0){
    const danger=threats.some(t=>dataOf(t.c).atk>
     dataOf(c).def+Math.floor(s.soul*.35));
    if(!w.defenderCondenseThreatOnly||danger){
     add({type:'soul-condense',idx:i});counter.defenderCondenseOffered++;
     counter.defenderCondenseOfferedSoulTotal+=s.soul;
     if(danger)counter.defenderCondenseThreatOpportunities++;
    }
   }
  }
  for(let i=0;i<own.field.length;i++){
   const c=own.field[i];if(!c||!canAttack(game,c))continue;
   const targets=threats.length?threats.slice(0,2).map(t=>t.i):[null];
   for(const di of targets)add({type:'attack',ai:i,di});
  }
  counter.defenderAbilityChecks++;counter.defenderAbilityAlternatives+=options.size;
  let best=null;
  for(const option of options.values()){
   const r=defenderScore(game,option,w);
   if(r&&(!best||r.score>best.score))best=r;
  }
  if(!best)return fallback;
  if(JSON.stringify(best.a)!==JSON.stringify(fallback))counter.defenderAbilityOverrides++;
  if(best.lethal)counter.defenderAbilityLethals++;
  if(best.a.type==='soul-condense')counter.defenderCondenseChosen++;
  if(best.a.type==='soul-raid')counter.defenderRaidPreferred++;
  if(best.a.type==='soul-discharge')counter.defenderDischargePreferred++;
  return best.a;
 }
 chooseAiAction=function(game,policy){`.trimStart().split('\n'));
inject("   selected=ability&&['soul-raid','soul-discharge'].includes(ability.type)?\n    ability:candidateAttack();",[
"   selected=ability&&['soul-raid','soul-discharge'].includes(ability.type)?",
"    ability:candidateAttack();",
"   if(scene.rolePolicy?.defenderDamagePlanner)",
"    selected=chooseDefenderDamageAction(game,scene.rolePolicy,selected);"
]);
inject('  const ok=baseApply(game,action);',[
"  const ok=action?.type==='soul-condense'?researchCondense(game,action):baseApply(game,action);",
"  if(ok&&game===g&&action?.type==='soul-condense')counter.defenderCondenseApplied++;"
]);

// This function is serialized into the SAME scope as the verified simulator.
function study(){
 const fs=require('node:fs'),assert=require('node:assert/strict');
 const {boot}=require('./helpers/game-runtime.cjs');
 const {makeBenchmarkDeck}=require('./helpers/lategame-ai-decks-v72.cjs');
 const catalog=boot({seed:15590042}).run('({cards:CARDS,defaultDeck:RPG_DEFAULT_DECK,startFusions:RPG_START_FUSIONS,opponents:OPPONENTS})');
 const root='artifacts/v1559';fs.mkdirSync(root,{recursive:true});
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
  ['soul','guardian'],['soul','predator'],['guardian','soul'],['soul','fusion'],
  ['guardian','predator'],['soul','allrounder'],['fusion','soul'],['predator','guardian']
 ]:stage===4?[
  ['soul','guardian'],['guardian','soul'],['soul','predator'],
  ['soul','fusion'],['guardian','predator'],['guardian','hybrid'],
  ['fusion','guardian'],['predator','soul']
 ]:[
  ['fusion','predator'],['predator','fusion'],['guardian','hybrid'],
  ['hybrid','predator'],['soul','fusion'],['allrounder','predator'],
  ['predator','soul'],['fusion','guardian']
 ];
 const Q=JSON.parse(fs.readFileSync(root+'/training-q-and-examples.json','utf8'));
 const knownQ=Q.find(x=>x.swarm===.02&&x.pierce===.10)?.learnedQ;
 assert.ok(knownQ&&Object.keys(knownQ).length>=160,'Missing prior Q values');
 const frozenQRecord=JSON.parse(fs.readFileSync(root+'/previous-training-q.json','utf8'));
 const frozenQ=frozenQRecord.find(x=>x.swarm===.02&&x.pierce===.10)?.learnedQ;
 assert.ok(frozenQ&&Object.keys(frozenQ).length>=160,'Missing frozen v14.9.53 Q');
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
 const frozen=JSON.parse(fs.readFileSync(root+'/frozen-v1555-champion.json','utf8'));
 assert.equal(frozen.sourceRun,40258011184);
 assert.equal(frozen.arm,'l10-guarded-worst-reply');
 assert.equal(frozen.holdoutUsed,false);
 assert.deepEqual(frozen.policy,guardedL10,'Frozen champion carried forward from v14.9.55 changed');
 // Freeze the selected prior champion and v14.9.56's best *unpromoted*
 // research candidate. Separate future-essence and condense ablations.
 const scopedOne={...guardedL10,defenderDamagePlanner:1,defenderRoleScope:true};
 const scopedCritical={...guardedL10,defenderDamagePlanner:2,
  defenderRoleScope:true,defenderCriticalReplyOnly:true};
 const scopedReserve={...scopedCritical,defenderEssenceReserve:.48};
 const futureReserve={...scopedReserve,defenderFutureDamage:.34};
 const followup={...futureReserve,defenderPostReplyFollowup:.70};
 const tacticalCondense={...followup,defenderAllowCondense:true,
  defenderCondenseThreatOnly:true,defenderCondenseTiming:true};
 const profiles=[
  {name:'guardian-champion',rolePolicy:champion},
  {name:'fusion-sequence-2ply',rolePolicy:sequence},
  {name:'l10-guarded-worst-reply',rolePolicy:guardedL10},
  {name:'defender-v1558-future-control',rolePolicy:futureReserve},
  {name:'defender-postreply-followup',rolePolicy:followup},
  {name:'defender-followup-condense',rolePolicy:tacticalCondense}
 ];
 const shardArg=String(process.argv[3]||'');
 assert.ok(shardArg==='finalize'||/^[0-7]$/.test(shardArg),
  'Supply one pair shard 0..7 or the finalize command');
 const chunkCount=stage===4?4:stage===7?4:stage===8?2:1;
 const chunkArg=process.argv[4];
 if(shardArg!=='finalize'&&chunkCount>1)
  assert.ok(/^\d+$/.test(String(chunkArg))&&Number(chunkArg)<chunkCount,
   'Extended hard-L10 stage requires a numbered six-scenario chunk');
 else assert.equal(chunkArg,undefined,'Unexpected scenario chunk argument');
 const cases=[];
 if(shardArg==='finalize'){
  for(let p=0;p<matchups.length;p++){
   for(let chunk=0;chunk<chunkCount;chunk++){
    const path=root+'/stage-'+stage+'-pair-'+p+(chunkCount>1?'-chunk-'+chunk:'')+'.json';
    assert.ok(fs.existsSync(path),'Missing stage pair/chunk '+stage+'/'+p+'/'+chunk);
    const obj=JSON.parse(fs.readFileSync(path,'utf8'));
    assert.equal(obj.stage,stage);assert.equal(obj.pair,p);
    assert.equal(obj.chunk,chunk);
    assert.equal(obj.cases.length,144,'Each bounded shard must have 144 mirrored duels');
    for(const row of obj.cases){
     assert.equal(row.stage,stage);assert.equal(row.pair,p);
     cases.push(row);
    }
   }
  }
 }else{
 const requestedPair=Number(shardArg);
 const requestedChunk=chunkCount>1?Number(chunkArg):0;
 for(let pair=0;pair<matchups.length;pair++){
  if(pair!==requestedPair)continue;
  const [roleA,roleB]=matchups[pair];
  const tier=stage===0?8:stage===1?9:stage===2?10:stage===3?8:10;
  const decayActive=stage===3||stage===6;
  // Stages 5 and 6 intentionally share ALL deck, matchup, RNG, seat, starter and policy inputs.
  const pairedStage=stage===6?5:stage;
  const foeTier=tier;
  const scenarios=stage===4?24:stage===7?24:stage===8?12:6;
  for(let scenario=requestedChunk*6;scenario<Math.min(scenarios,(requestedChunk+1)*6);scenario++){
   const seedA=5351+pair*157+scenario*79+pairedStage*241;
   // The constructed-deck helper accepts only seed integers in 0..9999.
   // Longer phase 7 uses a smaller fixed stage offset (no outcome-based tuning).
   const seedB=5609+pair*151+scenario*91+pairedStage*(stage===7?170:231);
   assert.ok(seedA>=0&&seedA<=9999&&seedB>=0&&seedB<=9999,
    'Benchmark seed must remain within the deck builder 0..9999 contract');
   const a=makeBenchmarkDeck(catalog,tier,roleA,'balanced',seedA);
   const b=makeBenchmarkDeck(catalog,foeTier,roleB,'balanced',seedB);
   assert.equal(a.deck.length,40);assert.equal(b.deck.length,40);
   for(let starter=0;starter<2;starter++)for(let seat=0;seat<2;seat++){
    const matchSeed=15590000+pairedStage*200000+pair*10000+scenario*1550+starter*107;
    const mirror=stage<=1;
    const opp=mirror?a:b;
    const first=seat===0?a:opp,second=seat===0?opp:a;
    for(const profile of profiles){
     const foeQ=stage===7?frozenQ:scenario%2===0?latest:previousQ;
     const foeWeights=null;
     const foeRolePolicy=stage===7?guardedL10:scenario%2===0?champion:balancedPolicy;
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
      recordReplay:scenario<(stage===4?8:stage===7?8:stage===8?4:2),
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
      foeCheckpoint:stage===7?'guarded-v1555':scenario%2?'balanced-v1529':'champion-v1528',symmetric:profile.name==='guardian-champion'&&scenario%2===0,
      pair,roleA,roleB:mirror?roleA:roleB,mirror,tier,foeTier,scenario,
      split:scenario<(stage===4?8:stage===7?8:stage===8?4:2)?'train':scenario<(stage===4?16:stage===7?16:stage===8?8:4)?'validation':'holdout',
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
      preciseAttackChecks:m.stats.preciseAttackChecks||0,
      preciseAttackSwing:m.stats.preciseAttackSwing||0,
      fusionPatienceChecks:m.stats.fusionPatienceChecks||0,
      fusionPatiencePenalties:m.stats.fusionPatiencePenalties||0,
      defenseThreatGated:m.stats.defenseThreatGated||0,
      defenseThreatEligible:m.stats.defenseThreatEligible||0,
      defenseAttackLockChecks:m.stats.defenseAttackLockChecks||0,
      defenseAttackLocks:m.stats.defenseAttackLocks||0,
      defenseArmorChecks:m.stats.defenseArmorChecks||0,
      defenseArmorRejected:m.stats.defenseArmorRejected||0,
      defenseCardThreatChecks:m.stats.defenseCardThreatChecks||0,
      defenseCardThreatRejected:m.stats.defenseCardThreatRejected||0,
      defenseScopedAttackChecks:m.stats.defenseScopedAttackChecks||0,
      defenseScopedAttackLocks:m.stats.defenseScopedAttackLocks||0,
      defenderAbilityChecks:m.stats.defenderAbilityChecks||0,
      defenderAbilityAlternatives:m.stats.defenderAbilityAlternatives||0,
      defenderAbilityOverrides:m.stats.defenderAbilityOverrides||0,
      defenderAbilityLethals:m.stats.defenderAbilityLethals||0,
      defenderCondenseChosen:m.stats.defenderCondenseChosen||0,
      defenderCondenseApplied:m.stats.defenderCondenseApplied||0,
      defenderCondenseOffered:m.stats.defenderCondenseOffered||0,
      defenderRaidPreferred:m.stats.defenderRaidPreferred||0,
      defenderDischargePreferred:m.stats.defenderDischargePreferred||0,
      defenderScopedSkipped:m.stats.defenderScopedSkipped||0,
      defenderCriticalReplyChecks:m.stats.defenderCriticalReplyChecks||0,
      defenderCriticalReplySkipped:m.stats.defenderCriticalReplySkipped||0,
      defenderReserveEvaluations:m.stats.defenderReserveEvaluations||0,
      defenderReservePenaltyTotal:m.stats.defenderReservePenaltyTotal||0,
      defenderFutureEvaluations:m.stats.defenderFutureEvaluations||0,
      defenderFuturePenaltyTotal:m.stats.defenderFuturePenaltyTotal||0,
      defenderCondenseThreatOpportunities:m.stats.defenderCondenseThreatOpportunities||0,
      defenderCondenseLegalTrials:m.stats.defenderCondenseLegalTrials||0,
      defenderCondenseRejectedTrials:m.stats.defenderCondenseRejectedTrials||0,
      defenderCondenseOfferedSoulTotal:m.stats.defenderCondenseOfferedSoulTotal||0,
       defenderDischargeWindowChecks:m.stats.defenderDischargeWindowChecks||0,
       defenderDischargeWindowPenalties:m.stats.defenderDischargeWindowPenalties||0,
       defenderCondenseTimingChecks:m.stats.defenderCondenseTimingChecks||0,
       defenderPostReplyForecasts:m.stats.defenderPostReplyForecasts||0,
       defenderPostReplyLegal:m.stats.defenderPostReplyLegal||0,
       defenderPostReplyWins:m.stats.defenderPostReplyWins||0,
       defenderPostReplyValueTotal:m.stats.defenderPostReplyValueTotal||0,
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
      actions:scenario<(stage===4?8:stage===7?8:stage===8?4:2)?m.stats.actionTape||[]:[]});
     // Explicitly release clone-heavy combat simulations between bounded shards.
     if(cases.length%48===0&&typeof global.gc==='function')global.gc();
    }
   }
  }
 }
 assert.equal(cases.length,144,'One bounded pair/chunk must contain 144 duels');
 fs.writeFileSync(root+'/stage-'+stage+'-pair-'+requestedPair+(chunkCount>1?'-chunk-'+requestedChunk:'')+'.json',
  JSON.stringify({stage,pair:requestedPair,chunk:requestedChunk,cases})+'\n');
 console.log('ARCANE_V1559_PAIR '+JSON.stringify({stage,pair:requestedPair,chunk:requestedChunk,games:cases.length,
  splitCounts:Object.fromEntries(['train','validation','holdout'].map(t=>
   [t,cases.filter(x=>x.split===t).length]))}));
 return;
 }
 assert.equal(cases.length,stage===4?4608:stage===7?4608:stage===8?2304:1152,'Stage matched selfplay games');
 // Case-matched action traces from TRAIN only. First divergence is a diagnostic,
 // not proof of causality; validation/holdout decisions are never inspected.
 const train=cases.filter(x=>x.split==='train');
 const key=x=>[x.pair,x.scenario,x.starter,x.seat].join('|');
 const baselineCases=new Map(train.filter(x=>x.arm==='l10-guarded-worst-reply').map(x=>[key(x),x]));
 const actionSig=x=>[x?.phase,x?.type,x?.actorRole,x?.targetId,x?.fusionChoice,x?.fusionSize].join('|');
 const matched=train.filter(x=>profiles.slice(3).some(p=>p.name===x.arm)).map(x=>{
  const priorCase=baselineCases.get(key(x));
  assert.ok(priorCase,'Missing case-matched incumbent TRAIN replay');
  assert.equal(x.seed,priorCase.seed);
  assert.equal(x.seedA,priorCase.seedA);assert.equal(x.seedB,priorCase.seedB);
  const a=x.actions||[],b=priorCase.actions||[];
  let i=0;while(i<Math.min(a.length,b.length)&&actionSig(a[i])===actionSig(b[i]))i++;
  const divergent=i<a.length||i<b.length;
  return {arm:x.arm,pair:x.pair,scenario:x.scenario,starter:x.starter,seat:x.seat,
   split:'train',roleA:x.roleA,roleB:x.roleB,candidateWin:x.win,incumbentWin:priorCase.win,
   firstDifferentIndex:divergent?i:null,
   candidateAction:divergent?{phase:a[i]?.phase||null,type:a[i]?.type||null,
    actorRole:a[i]?.actorRole||null}:null,
   incumbentAction:divergent?{phase:b[i]?.phase||null,type:b[i]?.type||null,
    actorRole:b[i]?.actorRole||null}:null};
 });
 assert.equal(matched.length,stage===4?768:stage===7?768:stage===8?384:192);
 const decisionAudit={schema:'arcane-v1559-train-only-decision-diffs',stage,
  controls:{trainOnly:true,caseMatched:true,holdoutNeverInspected:true,
   firstDivergenceDoesNotEstablishCausality:true},
  rows:matched};
 fs.writeFileSync(root+'/stage-'+stage+'-decision-diffs.json',JSON.stringify(decisionAudit)+'\n');
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
 const result={schema:'arcane-v1559-stage',stage,
  name:['champion-l8-mirror','champion-l9-mirror','champion-l10-crossrole',
   'champion-l8-crossrole-with-decay','expanded-hard-l10-crossrole','paired-no-decay-hard-l10','paired-full-decay-hard-l10',
   'expanded-direct-head-to-head-frozen-v1555-l10','diagnostic-hard-l10-defender-sequences-and-fusion-controls'][stage],
  learningSource:'v14.9.59 frozen v14.9.55 champion, v14.9.56 unpromoted reserve control; TRAIN-only first-divergence diagnosis, future essence cost and tactical condense legality',
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
   decayExperimentalStage:stage===3||stage===6,nonSelectionDecayStage:[5,6].includes(stage),
   sameSeedsDecayABPair:true,identicalInitialDecksForDecayAB:true,
   legalTwoPlyOwnAndEnemyReply:true,fullDecayUrgencyAblation:true,
   boundedVisibleWorstReplySearch:true,targetedGuardianSoulReplySearch:true,
   legalDefensiveActionSelection:true,headToHeadFrozenV1555:stage===7,
   targetedHardL10Diagnostic:stage===8,activeDecayInPrimaryStage3:stage===3,
   candidateDefenderDamagePlanner:true,candidateDefenderRoleScope:true,
   candidateCriticalReplyOnly:true,candidateEssenceReserve:true,
   expandedHardL10Scenarios:stage===4?24:stage===7?24:stage===8?12:6,
   offenseVsDefenseSameHorizon:true,frozenLegacyDefenseControl:false,
   defenseMarginAblation:true,defenseMarginTight:260,
   visibleContextualMargin:true,contextualMarginLow:105,contextualMarginHigh:285,
   legalFutureOpponentPostureReply:true,guardianSoulOpponentPostureAblation:true,
   holdoutNeverUsedForSelection:true,globalSelectionOnly:true,
   noStageToStagePolicyInheritance:true},
  selectionMethod:'NO stage promotion; stages 0-4 plus stage 7 direct-head-to-head and stage 8 focused hard-L10 use TRAIN+VALIDATION; A/B stages 5-6 excluded.',
  chosenArm:'guardian-champion',selectedRolePolicy:champion,
  previousSelectedRolePolicy:null,promoted:false,
  trainCandidate:baseline.train,trainBaseline:baseline.train,
  validationCandidate:baseline.validation,validationBaseline:baseline.validation,
  holdoutCandidate:baseline.holdout,holdoutBaseline:baseline.holdout,
  summaries,allCases:cases.map(({actions,...row})=>row)};
 fs.writeFileSync(root+'/stage-'+stage+'.json',JSON.stringify(result,null,2)+'\n');
 fs.writeFileSync(root+'/stage-'+stage+'-train-actions.json',JSON.stringify({
  schema:'arcane-v1559-training-only-actions',stage,
  examples:cases.filter(x=>x.split==='train').map(x=>({
   arm:x.arm,pair:x.pair,roleA:x.roleA,roleB:x.roleB,
   win:x.win,turn:x.turn,reward:x.reward,actions:x.actions
  }))})+'\n');
 console.log('ARCANE_V1559_STAGE '+JSON.stringify({stage,name:result.name,
  winner:'guardian-champion',policies:profiles.map(p=>p.name),
  training:baseline.train,validation:baseline.validation,holdout:baseline.holdout,
  baselineHoldout:baseline.holdout,games:cases.length}));
}
const inner='\nnew Function("require","process","console",src+"\\n("+'
 +JSON.stringify(study.toString())+'+")()")(require,process,console);';
new Function('require','process','console',
 prefix+'\n'+patchLines.join('\n')+inner)(require,process,console);
