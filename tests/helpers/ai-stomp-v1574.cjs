'use strict';
/* v15.74: TRAIN-only tactical knowledge for real v20.0 Fusion Stomp.
 * No production-policy edits, free monsters or fabricated combat results.
 * Cards are first produced by the game's real fusion reducer, and the
 * resulting role/material/ATK/DEF values determine every forecast.
 */
const assert=require('node:assert/strict');
const {combinations}=require('./ai-multifusion-v1573.cjs');

const roleOf=c=>c?.roleOverride||c?.role||'combatant';
const clamp=(n,low,high)=>Math.max(low,Math.min(high,n));

function forecastStomp({g,monster,enemyField,owner,cardValue,dataOf,stompEngine,role}){
 assert.ok(stompEngine?.adjacent&&stompEngine?.percentByHit&&stompEngine?.fatigue,
  'The actual v20.0 Stomp runtime must be loaded before AI training');
 const count=monster?.materialsUsed||2,power=Math.max(0,dataOf(monster).atk||0);
 const foes=enemyField||[],predators=foes.filter(c=>c&&role(c)==='predator');
 if(count<3||!foes.some(Boolean))return {value:0,targets:0,exposure:0,predatorReply:0};
 let best={value:-Infinity,targets:0,exposure:0,predatorReply:0};
 for(let main=0;main<foes.length;main++){
  const primary=foes[main];if(!primary)continue;
  const center=dataOf(primary),adj=stompEngine.adjacent(foes,main,owner,count);
  const bonus=stompEngine.materialBoost(monster),percent=stompEngine.percentByHit(count,adj.length,bonus);
  const primaryDef=center.def||0,primaryAtk=center.atk||0;
  let value=primary.mode==='def'?
   (power>primaryDef?cardValue(primary)*.47:-(primaryDef-power)*.33):
   (power>=primaryAtk?cardValue(primary)*.50:-(primaryAtk-power)*.32);
  let recoil=0;
  for(let i=0;i<adj.length;i++){
   const victim=foes[adj[i]],stats=dataOf(victim),r=role(victim);
   let raw=Math.floor(power*percent[i]/100);
   if(victim.mode==='atk'&&raw>=stats.atk)value+=cardValue(victim)*.61;
   else{
    if(victim.mode==='def'&&['guardian','soul'].includes(r))raw=Math.floor(raw*.65);
    const lost=Math.min(stats.def||0,Math.max(0,raw));
    value+=lost*.43+(lost>=stats.def?cardValue(victim)*.35:0);
   }
   if(victim.mode==='def'&&['guardian','soul'].includes(r))recoil+=Math.floor(stats.atk*.5*.4);
  }
  const targets=1+adj.length,spent=stompEngine.fatigue(dataOf(monster).atk,dataOf(monster).def,targets);
  const exposure=spent.atk*.49+spent.def*.34;
  const replyPeak=Math.max(0,...predators.map(c=>dataOf(c).atk*1.10));
  const predatorReply=replyPeak>=Math.max(0,power-spent.atk)&&replyPeak<power?1:0;
  // 1. A multi-hit monster pays both stats, not just ATK.
  // 2. An enemy Predator may turn a previously losing duel into a kill.
  // 3. Defensive splash counterstrikes still hit the mage's LP at 40%.
  value-=exposure*.55+recoil*.53+predatorReply*cardValue(monster)*.32;
  if(value>best.value)best={value,targets,exposure,predatorReply};
 }
 return best;
}

function evaluateAttack({game,trial,result,ai,di,cardValue,dataOf,role}){
 if(!result)return {score:0,splashKills:0,splashChip:0,fatigue:0,predatorWindow:0};
 const owner=game.active,attacker=game.players[owner]?.field[ai];
 const next=trial.players[owner]?.field[ai];
 const hits=result.stomp?.hits||[];
 let splashKills=0,splashChip=0,score=0;
 for(const hit of hits){
  const enemy=game.players[1-owner].field[hit.index];
  if(!enemy)continue;
  if(hit.destroyed){splashKills++;score+=cardValue(enemy)*.65;}
  else{splashChip+=hit.defLost||0;score+=(hit.defLost||0)*.62;}
 }
 let fatigue=0,predatorWindow=0;
 if(next&&attacker?.card){
  fatigue=Math.max(0,attacker.card.atk-(next.card?.atk||0))*.47+
   Math.max(0,attacker.card.def-(next.card?.def||0))*.37;
  score-=fatigue*.52;
  if(attacker.fusion){
   const predators=trial.players[1-owner].field.filter(c=>c&&role(c)==='predator');
   const peak=Math.max(0,...predators.map(c=>dataOf(c).atk*1.10));
   if(peak>=dataOf(next).atk&&peak<dataOf(attacker).atk){
    predatorWindow=1;score-=cardValue(attacker)*.26;
   }
  }
 }
 // Pure attack research: if a 2-material or ordinary attack misses the sides,
 // no artificial Stomp bonus is granted. LP counters were already counted by
 // the real trial reducer and are NEVER added a second time.
 return {score:Math.round(score),splashKills,splashChip,fatigue:Math.round(fatigue),predatorWindow};
}

function enumerateLargeFusions({game,own,profile,cardValue,dataOf,isFateCard,
 fusionOptions,canCompleteHandFusion,applyAiAction,role,guardianCount=0,soulCount=0,
 maxPerSize=3,stompEngine}){
 const bySize={3:{legal:0,previewed:0,accepted:0,stompForecasts:0,predatorWindows:0},
  4:{legal:0,previewed:0,accepted:0,stompForecasts:0,predatorWindows:0},
  5:{legal:0,previewed:0,accepted:0,stompForecasts:0,predatorWindows:0}};
 const hand=own.hand.filter(c=>!isFateCard(c));
 if(hand.length<3)return {choices:[],bySize};
 const choices=[],actor=game.active;
 for(let size=3;size<=Math.min(5,hand.length);size++){
  const pool=[];
  for(const materials of combinations(hand,size)){
   const levels=materials.map(c=>dataOf(c).level);
   const templates=fusionOptions(game,levels,materials)
    .filter(c=>canCompleteHandFusion(game,levels,c.id))
    .sort((a,b)=>b.level-a.level||b.atk-a.atk).slice(0,3);
   for(const template of templates){
    bySize[size].legal++;
    pool.push({materials,template,pattern:[...levels].sort((a,b)=>a-b).join(','),
     estimate:cardValue({id:template.id,card:{...template}})-
      materials.reduce((n,c)=>n+cardValue(c),0)*profile.materialCost});
   }
  }
  pool.sort((a,b)=>b.estimate-a.estimate||a.template.id-b.template.id);
  const selected=[],patterns=new Set();
  for(const c of pool){
   if(selected.length>=maxPerSize)break;
   if(patterns.has(c.pattern)&&pool.some(x=>!patterns.has(x.pattern)))continue;
   patterns.add(c.pattern);selected.push(c);
  }
  for(const c of selected){
   bySize[size].previewed++;
   const action={type:'fusion',uids:c.materials.map(m=>m.uid),choice:c.template.id};
   const trial=JSON.parse(JSON.stringify(game));let ok=false;
   try{
    ok=!!applyAiAction(trial,action);
    if(ok&&trial.pending){const slot=trial.players[actor].field.findIndex(x=>!x);
     ok=slot>=0&&!!applyAiAction(trial,{type:'place',idx:slot});}
   }catch(_){ok=false;}
   if(!ok)continue;
   const formed=trial.players[actor].field.find(x=>x&&x.id===c.template.id&&
    !own.field.some(previous=>previous?.uid===x.uid));
   if(!formed)continue;
   assert.equal(formed.materialsUsed,size);
   const paid=c.materials.reduce((n,m)=>n+cardValue(m),0),kind=role(formed);
   const synergy=kind==='soul'?guardianCount*profile.synergy*260:
    kind==='guardian'?soulCount*profile.synergy*260:0;
   const tactical=forecastStomp({g:trial,monster:formed,
    enemyField:trial.players[1-actor].field,owner:actor,cardValue,dataOf,stompEngine,role});
   bySize[size].stompForecasts++;
   bySize[size].predatorWindows+=tactical.predatorReply;
   // Keep the strategic future reward bounded. Resources still have their
   // original FULL cost; tactical value can never counterfeit materials.
   const tacticalBonus=clamp(tactical.value*.26,-370,670);
   choices.push({a:action,score:cardValue(formed)+synergy-
    paid*profile.materialCost+tacticalBonus});
   bySize[size].accepted++;
  }
 }
 assert.ok(choices.every(c=>c.a.uids.length>=3&&c.a.uids.length<=5));
 return {choices,bySize};
}

module.exports={forecastStomp,evaluateAttack,enumerateLargeFusions};
