/* Arcane Duel 5.6 – offline-trainable legal-action scorer.
 * Real decision alternatives; no access to the opposing hidden hand or deck.
 * Disabled for players until holdout evaluation demonstrates improvement.
 */
'use strict';
(()=>{
 const KEYS=['attack','defense','tempo','quality','ace','cost','counter'];
 const PRESETS=Object.freeze({
  predator:{attack:1.9,defense:.25,tempo:1.35,quality:.25,ace:9,cost:.18,counter:.5},
  bastion:{attack:.65,defense:1.8,tempo:.6,quality:.4,ace:9,cost:.34,counter:1.1},
  alchemist:{attack:1,defense:1.05,tempo:.3,quality:1.3,ace:9,cost:.18,counter:.7},
  tempo:{attack:1.25,defense:.65,tempo:2.4,quality:.12,ace:9,cost:.85,counter:.4},
  balanced:{attack:1,defense:1,tempo:.9,quality:.55,ace:9,cost:.4,counter:.7}
 });
 const limits=Object.freeze({
  1:{alternatives:2,materials:2,enabled:false},2:{alternatives:2,materials:2,enabled:false},
  3:{alternatives:3,materials:2,enabled:false},4:{alternatives:4,materials:2,enabled:false},
  5:{alternatives:5,materials:2,enabled:false},6:{alternatives:6,materials:3,enabled:false},
  7:{alternatives:8,materials:3,enabled:false},8:{alternatives:9,materials:3,enabled:false},
  9:{alternatives:11,materials:3,enabled:false},10:{alternatives:15,materials:3,enabled:false}
 });
 let sandbox=false,weights=PRESETS.balanced;
 const isOwnTurn=g=>g?.mode==='pve'&&g.context==='tournament'&&g.active===1&&
  !g.lv1Saga&&!g.showcase&&g.opponentId>=1&&g.opponentId<=10;
 const role=c=>c?.roleOverride||CARDS[c?.id]?.role||'combatant';
 function legalCandidates(g){
  if(!isOwnTurn(g)||g.winner!==null||g.pending||g.summoned||g.aiPhase!=='summon')return [];
  const p=g.players[1],empty=p.field.some(c=>!c);
  if(!empty)return []; // Field-fusion remains handled by the battle engine.
  const hand=p.hand.filter(x=>!x.fate);
  const options=[];
  for(const card of hand){
   const c=dataOf(card);if(!c)continue;
   options.push({action:{type:'normal',uid:card.uid},template:c,
    materialCount:1,quality:0,role:role(card),isAce:card.id===ACE_CARD_IDS[g.opponentId]});
  }
  const cap=limits[g.opponentId].materials;
  function consider(cards){
   const levels=cards.map(c=>dataOf(c).level);
   const unique=new Set(p.remainingFusion||[]);
   const templates=fusionOptions(g,levels,cards).filter(t=>unique.has(t.id)&&
    canCompleteHandFusion(g,levels,t.id));
   for(const c of templates){
    options.push({action:{type:'fusion',uids:cards.map(x=>x.uid),choice:c.id},
     template:c,materialCount:cards.length,quality:qualityRolls(levels),
     role:role(c),isAce:c.id===ACE_CARD_IDS[g.opponentId]});
   }
  }
  for(let a=0;a<hand.length;a++)for(let b=a+1;b<hand.length;b++){
   consider([hand[a],hand[b]]);
   if(cap>=3)for(let c=b+1;c<hand.length;c++)consider([hand[a],hand[b],hand[c]]);
  }
  return options;
 }
 function featureVector(g,o){
  const enemy=g.players[0].field.filter(Boolean),
   p=g.players[1],card=o.template;
  const atk=Math.max(0,Number(card.atk)||0),def=Math.max(0,Number(card.def)||0);
  const defenseCount=enemy.filter(c=>c.mode==='def'&&['guardian','soul'].includes(role(c))).length;
  const predatorCount=enemy.filter(c=>role(c)==='predator'&&!c.fusion).length;
  const isFusion=o.action.type==='fusion';
  return {
   attack:atk/1300,
   defense:def/1300*(o.role==='soul'||o.role==='guardian'?1.16:1),
   tempo:isFusion?.18:1,
   quality:o.quality/5,
   ace:o.isAce?1:0,
   cost:isFusion?(o.materialCount-1):0,
   counter:Math.min(2,(defenseCount*atk+predatorCount*def)/2600)
  };
 }
 function score(g,candidate,policy=weights){
  const vector=featureVector(g,candidate);
  const total=KEYS.reduce((sum,k)=>sum+vector[k]*(k==='cost'?-1:1)*policy[k],0);
  return Math.round(total*1000)/1000;
 }
 function rank(g,policy=weights){
  const p=limits[g.opponentId],candidates=legalCandidates(g);
  const evaluated=candidates.map(c=>({...c,score:score(g,c,policy)}))
   .sort((a,b)=>b.score-a.score||b.template.level-a.template.level||
    a.materialCount-b.materialCount||a.template.id-b.template.id);
  // Limitation based on actual candidate evaluation budget: novice NPCs see
  // only a small fixed set; masters may inspect more.
  if(!p)return [];
  const budget=p.alternatives;
  const visible=candidates.slice(0,budget);
  return visible.map(c=>({...c,score:score(g,c,policy)}))
   .sort((a,b)=>b.score-a.score||b.template.level-a.template.level||
    a.materialCount-b.materialCount||a.template.id-b.template.id);
 }
 const oldChoose=chooseAiAction;
 chooseAiAction=function(g,policy='balanced'){
  if(!sandbox||!isOwnTurn(g))return oldChoose(g,policy);
  const possible=rank(g);
  if(possible.length){
   const ace=possible.find(x=>x.isAce);
   if(ace)return ace.action; // ACE pursuit never de-prioritized by training.
   return possible[0].action;
  }
  return oldChoose(g,policy);
 };
 function setSandbox(input,active=true){
  if(input===null){sandbox=false;weights=PRESETS.balanced;return;}
  if(!input||KEYS.some(k=>!Number.isFinite(input[k])||input[k]<0||input[k]>15))
   throw Error('Ungültige trainierte KI-Gewichte');
  weights=Object.freeze(Object.fromEntries(KEYS.map(k=>[k,input[k]])));
  sandbox=active===true;
 }
 window.ArcaneAiLearning56=Object.freeze({version:'5.6.0',PRESETS,limits,
  featureVector,legalCandidates,score,rank,setSandbox,active:()=>sandbox});
})();
