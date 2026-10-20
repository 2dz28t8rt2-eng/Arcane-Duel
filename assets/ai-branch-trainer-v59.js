/* Arcane Duel 5.9 – public-information engine branching.
 * Training-only. For each legal action, clone the PUBLIC opponent board and
 * the AI's own state; apply the actual game rules to that clone, then sample
 * plausible replies from the publicly visible opposing board. Hidden cards
 * and future draws are NOT copied or consulted. This is not omniscient search.
 */
'use strict';
(()=>{
 const PARAMS=['material','board','tempo','risk','support','future','ace'];
 const STANDARD=Object.freeze({material:.8,board:1.45,tempo:1.1,risk:1.2,support:1.1,future:.6,ace:10});
 const LIMIT=Object.freeze({1:2,2:2,3:3,4:4,5:5,6:6,7:8,8:9,9:11,10:15});
 const SAMPLES=Object.freeze({1:1,2:1,3:1,4:1,5:1,6:1,7:2,8:2,9:2,10:2});
 let sandbox=false,weights=STANDARD,counters={evaluated:0,replies:0,invalid:0},guard={enabled:false,margin:0,fusionPremium:0};
 const ours=g=>g?.mode==='pve'&&g.context==='tournament'&&g.active===1&&
  g.winner===null&&!g.lv1Saga&&!g.showcase&&g.opponentId>=1&&g.opponentId<=10;
 const copy=x=>JSON.parse(JSON.stringify(x));
 const stat=(c,k)=>Math.max(0,Number(dataOf(c)?.[k])||0);
 function publicState(g){
  // Deliberately NEVER touch the human player's hand, main deck, fusion deck,
  // original deck, future draws or hidden enhancement inventory.
  const player=g.players[0],own=g.players[1];
  const safeEnemy={id:0,lp:player.lp,shield:player.shield||0,
   field:copy(player.field),graveyard:[],hand:[],deck:[],originalDeck:[],
   fusionDeck:[],remainingFusion:[],enhancements:{},power:1,flatBonus:0};
  const clone=copy({...g,players:[],log:[]});
  clone.players=[safeEnemy,copy(own)];
  clone.log=[];
  clone.damageDealt=copy(g.damageDealt||[0,0]);
  clone.totalFusions=copy(g.totalFusions||[0,0]);
  clone.selection=null;
  clone.materials=[];
  return clone;
 }
 function features(g){
  const me=g.players[1],foe=g.players[0];
  let meAtk=0,meDef=0,enemyAtk=0,enemyDef=0;
  for(const c of me.field)if(c){meAtk+=stat(c,'atk');meDef+=stat(c,'def');}
  for(const c of foe.field)if(c){enemyAtk+=stat(c,'atk');enemyDef+=stat(c,'def');}
  let links=0;
  for(let i=0;i<me.field.length;i++){
   const a=me.field[i],b=me.field[i+1];
   if(a&&b){
    const roleA=a.roleOverride||CARDS[a.id]?.role||'';
    const roleB=b.roleOverride||CARDS[b.id]?.role||'';
    if(roleA==='guardian'&&roleB==='soul'||roleB==='guardian'&&roleA==='soul')links++;
   }
  }
  return {myLP:me.lp,enemyLP:foe.lp,meAtk,meDef,enemyAtk,enemyDef,
   meCount:me.field.filter(Boolean).length,enemyCount:foe.field.filter(Boolean).length,
   myHand:me.hand.length,links};
 }
 function slotFor(g,candidate){
  const p=g.players[1],incoming=candidate.template||CARDS[g.pending?.card?.id];
  const field=p.field;
  const open=field.flatMap((c,i)=>c?[]:[i]);
  if(!open.length)return -1;
  const role=incoming?.role||incoming?.roleOverride||'';
  const pair=role==='guardian'?'soul':role==='soul'?'guardian':null;
  if(pair!==null){
   const near=open.filter(i=>[field[i-1],field[i+1]].some(c=>c&&
     (c.roleOverride||CARDS[c.id]?.role)===pair));
   if(near.length)return near.sort((a,b)=>Math.abs(a-2)-Math.abs(b-2))[0];
  }
  return open.sort((a,b)=>Math.abs(a-2)-Math.abs(b-2))[0];
 }
 function visibleReply(g){
  if(g.winner!==null)return 0;
  // Model the next *publicly possible* enemy attack with actual combat rules,
  // never draw an unknown card or simulate the real hidden enemy hand.
  const opponent=g.players[0];
  g.active=0;g.aiPhase='attacks';g.pending=null;g.summoned=true;
  for(const c of opponent.field)if(c){c.attacked=false;c.switched=false;}
  const before=g.players[1].lp+g.players[1].field.filter(Boolean).length*250;
  let choice=null,priority=-Infinity;
  for(let i=0;i<opponent.field.length;i++){
   const a=opponent.field[i];
   if(!a||!canAttack(g,a))continue;
   if(!g.players[1].field.some(Boolean)){
    const damage=effectiveAttack(g,a,null);
    if(damage>priority){priority=damage;choice={type:'attack',ai:i,di:null};}
    continue;
   }
   for(let j=0;j<5;j++){
    const t=g.players[1].field[j];if(!t)continue;
    const power=effectiveAttack(g,a,t),resist=t.mode==='def'?stat(t,'def'):stat(t,'atk');
    if(power<resist||power===resist&&t.mode==='def')continue;
    const value=stat(t,'atk')*.5+stat(t,'def')*.3+Math.max(0,power-resist);
    if(value>priority){priority=value;choice={type:'attack',ai:i,di:j};}
   }
  }
  if(choice&&applyAiAction(g,choice)){
   counters.replies++;
   const after=g.players[1].lp+g.players[1].field.filter(Boolean).length*250;
   return Math.max(0,before-after);
  }
  return 0;
 }
 function scoreDelta(before,after,candidate,response,params){
  const a=candidate.action||{};
  const isFusion=a.type==='fusion',isAce=!!candidate.isAce;
  const materialLoss=isFusion?Math.max(0,(candidate.materialCount||2)-1):0;
  const board=((after.meAtk-before.meAtk)*.9+(after.meDef-before.meDef)*.55-
   (after.enemyAtk-before.enemyAtk)*.8-(after.enemyDef-before.enemyDef)*.4)/1050;
  const netDamage=((before.enemyLP-after.enemyLP)*1.5-(before.myLP-after.myLP))/1050;
  const removal=(before.enemyCount-after.enemyCount)*.8+(after.meCount-before.meCount)*.55;
  const links=(after.links-before.links)*.7;
  const handPenalty=Math.max(0,before.myHand-after.myHand)*.12;
  const followupLoss=response/1050;
  return params.board*(board+removal)+params.tempo*netDamage+
   params.support*links-params.material*(materialLoss*.7+handPenalty)-
   params.risk*Math.max(0,(before.myLP-after.myLP)/850)-
   params.future*followupLoss+(isAce?params.ace:0);
 }
 function aceReservationPenalty(g,candidate,params=weights){
  const signature=ACE_CARD_IDS[g.opponentId],ace=CARDS[signature];
  const spec=window.ArcaneAiRevamp55?.profileFor?.(g.opponentId);
  if(!ace?.fusionOnly||!g.players[1].remainingFusion?.includes(signature)||
   candidate.isAce||g.turn<Math.max(2,(spec?.aceTurn||5)-2))return 0;
  const threshold=Math.max(1,ace.level-2);
  const capable=g.players[1].hand.filter(c=>!c.fate&&dataOf(c).level>=threshold);
  if(!capable.length)return 0;
  const action=candidate.action||{},consumed=
    action.type==='fusion'?capable.filter(c=>action.uids?.includes(c.uid)).length:
    action.type==='normal'?capable.filter(c=>action.uid===c.uid).length:0;
  // A material kept in hand can still be used for the legal signature fusion.
  // The extra cost is meaningful only near the declared ACE preparation turn.
  return consumed*(capable.length>=2?Math.min(7,params.ace*.65):
    Math.min(3,params.ace*.28));
 }
 function branch(g,candidate,params=weights){
  if(!ours(g)||!candidate?.action)return null;
  const baseline=features(g);
  const tier=g.opponentId,samples=SAMPLES[tier];
  let total=0,ok=0,chosenSlot=null;
  for(let sample=0;sample<samples;sample++){
   const clone=publicState(g);
   // A fresh, public-observation-derived seed avoids using the actual game's
   // hidden future RNG state as a cheat. Same sample seed for every candidate.
   clone.seed=(Math.imul(tier,2654435761)^(g.turn*8191)^
    Math.imul(baseline.meCount+1,23311)^(sample*104729))>>>0||1;
   const a=candidate.action;
   let accepted=false;
   try{accepted=!!applyAiAction(clone,a);}catch(_){}
   if(!accepted){counters.invalid++;continue;}
   if(clone.pending){
    const slot=slotFor(clone,candidate);
    if(slot<0){counters.invalid++;continue;}
    if(!applyAiAction(clone,{type:'place',idx:slot})){counters.invalid++;continue;}
    chosenSlot=slot;
   }
   const after=features(clone);
   const reply=tier>=4?visibleReply(clone):0;
   total+=scoreDelta(baseline,after,candidate,reply,params);
   ok++;
  }
  if(!ok)return null;
  counters.evaluated++;
  return {action:candidate.action,score:Math.round((total/ok-aceReservationPenalty(g,candidate,params))*1000)/1000,slot:chosenSlot,
   simulationSamples:ok};
 }
 const oldChoose=chooseAiAction;
 let pendingSlot=new WeakMap();
 function candidates(g){
  if(!ours(g)||g.pending)return [];
  if(g.aiPhase==='summon'&&!g.summoned){
   // Start with legal actions from the v5.6 scorer (including actual fusion ID).
   return ArcaneAiLearning56.rank(g);
  }
  if(g.aiPhase==='attacks'){
   return [...ArcaneAiLearning56.rankAttacks(g),
    ...ArcaneAiLookahead58.supportActions(g).map(c=>({...c,score:0}))];
  }
  return [];
 }
 function choose(g){
  const options=candidates(g);
  if(!options.length)return null;
  const limit=LIMIT[g.opponentId],legalAce=options.find(x=>x.isAce);
  if(legalAce){ // Don't discard a signature ACE already in the hand.
   const best=branch(g,legalAce);
   return best||{action:legalAce.action};
  }
  const ranked=options.slice(0,limit).map(c=>branch(g,c))
   .filter(Boolean).sort((a,b)=>b.score-a.score);
  const best=ranked[0]||null;
  if(guard.enabled){
   // Do not override the proven v5.6 scorer on phases where single-ply
   // public reply simulation is insufficient to model support/defense.
   if(g.aiPhase!=='summon'||!best)return null;
   const fallback=ArcaneAiLearning56.rank(g);
   const baseline=fallback.find(c=>c.isAce)||fallback[0];
   if(!baseline)return null;
   // If the proposed action is the same, preserve all baseline side effects.
   if(JSON.stringify(best.action)===JSON.stringify(baseline.action))return null;
   const baselineProjected=branch(g,baseline);
   const fusionPremium=baseline.action.type==='fusion'&&best.action.type==='normal'&&
    window.ArcaneAiRevamp55?.profileFor?.(g.opponentId)?.style==='fusion'?
    guard.fusionPremium:0;
   if(!baselineProjected||best.score<baselineProjected.score+guard.margin+fusionPremium)
    return null; // retain a strong *legal* fusion rather than losing long-term ACE tempo
  }
  return best;
 }
 // Bounded training-only decision explanation. Never reads opponent's
 // hand/deck or any unseen draws; does not modify the live duel.
 function diagnose(g,max=5){
  if(!sandbox||!ours(g)||g.aiPhase!=='summon'||g.pending||g.summoned)
   return {available:false};
  if(!Number.isInteger(max)||max<1||max>15)throw Error('Invalid audit budget');
  const hand=g.players[1].hand,raw=candidates(g).slice(0,Math.min(LIMIT[g.opponentId],max));
  const ranked=raw.map(c=>{
   const result=branch(g,c);
   const materials=c.action.type==='fusion'?
    hand.filter(x=>c.action.uids?.includes(x.uid)).map(x=>({
     id:x.id,level:dataOf(x).level,role:x.roleOverride||CARDS[x.id]?.role||'combatant'
    })):c.action.type==='normal'?
    hand.filter(x=>x.uid===c.action.uid).map(x=>({
     id:x.id,level:dataOf(x).level,role:x.roleOverride||CARDS[x.id]?.role||'combatant'
    })):[];
   return {type:c.action.type,template:c.template?.id??null,
    role:c.role,isAce:!!c.isAce,materials,
    score:result?.score??null,rejected:!result,
    materialPenalty:aceReservationPenalty(g,c),slot:result?.slot??null};
  }).sort((a,b)=>(b.score??-Infinity)-(a.score??-Infinity));
  const baseline=ArcaneAiLearning56.rank(g);
  const selectedBaseline=baseline.find(x=>x.isAce)||baseline[0]||null;
  const selectedScore=selectedBaseline?branch(g,selectedBaseline)?.score??null:null;
  const ace=CARDS[ACE_CARD_IDS[g.opponentId]];
  const nearAce=!!ace?.fusionOnly&&g.players[1].remainingFusion?.includes(ace.id);
  const baseSignature=selectedBaseline?.action??null;
  const best=ranked.find(x=>!x.rejected)||null;
  return {available:true,tier:g.opponentId,turn:g.turn,
   strategy:window.ArcaneAiRevamp55?.profileFor?.(g.opponentId)?.style||null,
   ownHandCount:hand.length,ownBoard:g.players[1].field.filter(Boolean).length,
   enemyVisibleBoard:g.players[0].field.filter(Boolean).length,
   hasRemainingSignatureFusion:nearAce,
   baseline:{type:baseSignature?.type||null,
    template:selectedBaseline?.template?.id??null,
    materialCount:selectedBaseline?.materialCount??null,score:selectedScore},
   best,margin:best&&selectedScore!==null?+(best.score-selectedScore).toFixed(3):null,
   alternatives:ranked};
 }
 chooseAiAction=function(g,policy='balanced'){
  if(!sandbox||!ours(g))return oldChoose(g,policy);
  if(g.aiPhase==='summon'&&!g.summoned&&!g.pending)
   window.ArcaneAiRevamp55?.prepareAce?.(g);
  if(g.pending&&pendingSlot.has(g)){
   const idx=pendingSlot.get(g);pendingSlot.delete(g);
   if(!g.players[1].field[idx]&&Number.isInteger(idx))return {type:'place',idx};
  }
  const result=choose(g);
  if(result){
   if(Number.isInteger(result.slot))pendingSlot.set(g,result.slot);
   return result.action;
  }
  return oldChoose(g,policy);
 };
 function setSandbox(next,active=true,options=null){
  if(next===null){sandbox=false;weights=STANDARD;pendingSlot=new WeakMap();
   guard={enabled:false,margin:0,fusionPremium:0};return;}
  if(!next||PARAMS.some(k=>!Number.isFinite(next[k])||next[k]<0||next[k]>15))
   throw Error('Invalid action branch policy');
  const margin=options?.margin??0;
  if(!Number.isFinite(margin)||margin<0||margin>25)
   throw Error('Invalid confidence-gate margin');
  const fusionPremium=options?.fusionPremium??0;
  if(!Number.isFinite(fusionPremium)||fusionPremium<0||fusionPremium>12)
   throw Error('Invalid fusion-strategy confidence margin');
  weights=Object.freeze(Object.fromEntries(PARAMS.map(k=>[k,next[k]])));
  guard={enabled:options?.guarded===true,margin,fusionPremium};
  sandbox=active===true;
 }
 function resetCounters(){counters={evaluated:0,replies:0,invalid:0};}
 window.ArcaneAiBranches59=Object.freeze({version:'5.9.4',STANDARD,
  publicState,features,slotFor,branch,aceReservationPenalty,candidates,choose,diagnose,
  setSandbox,active:()=>sandbox,guard:()=>({enabled:guard.enabled,margin:guard.margin}),
  strategyGate:()=>({fusionPremium:guard.fusionPremium}),stats:()=>({...counters}),resetCounters});
})();
