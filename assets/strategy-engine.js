/* Arcane Duel – Tactical Analysis Core 1.0
 * Pure, deterministic analysis of 40-card main decks. No save mutations.
 * Public API: window.ArcaneStrategy.evaluate(cardIds, cardLookup, fusionIds).
 * Opening hand odds enumerate all combinations of 5 cards WITHOUT replacement.
 * Detects whether a pattern is PRESENT in the five cards; not a claim that
 * the player can actually summon that fusion on the first turn.
 */
(function(root){
 'use strict';
 const PATTERNS=[
  ['pair','Paar'],['lowPair','Stufe-1-Paar'],['twoPairs','Zwei Paare'],
  ['three','Drilling'],['four','Vierling'],['five','Fünfling'],
  ['smallStraight','Kleine Straße'],['bigStraight','Große Straße'],
  ['fullHouse','Full House']
 ];
 function choose(n,k){
  if(!Number.isSafeInteger(n)||!Number.isSafeInteger(k)||k<0||k>n)return 0;
  k=Math.min(k,n-k);let x=1;
  for(let j=1;j<=k;j++)x=x*(n-j+1)/j;
  return Math.round(x);
 }
 function patterns(counts){
  const vals=Object.values(counts).filter(Boolean).sort((a,b)=>b-a);
  const levels=Object.keys(counts).filter(k=>counts[k]>0).map(Number).sort((a,b)=>a-b);
  let lowPair=(counts[1]||0)>=2;
  const checkStreet=length=>levels.some((start,i)=>levels.slice(i,i+length).length===length&&levels.slice(i,i+length).every((v,j)=>v===start+j));
  const matched={
   pair:vals.some(v=>v>=2),lowPair,
   twoPairs:vals.filter(v=>v>=2).length>=2,
   three:vals.some(v=>v>=3),four:vals.some(v=>v>=4),five:vals.some(v=>v>=5),
   smallStraight:checkStreet(3),bigStraight:checkStreet(5),
   fullHouse:(vals[0]>=3&&vals[1]>=2)
  };
  return matched;
 }
 function fiveCardOdds(levelCounts){
  const levels=Object.keys(levelCounts).filter(k=>levelCounts[k]>0).map(Number).sort((a,b)=>a-b);
  const size=levels.reduce((a,l)=>a+levelCounts[l],0);
  const total=choose(size,5);
  const counts={};const weighted=Object.fromEntries(PATTERNS.map(([key])=>[key,0]));
  if(total===0)return {total:0,probabilities:Object.fromEntries(PATTERNS.map(([k])=>[k,0]))};
  function enumerate(i,remaining,ways){
   if(i===levels.length){
    if(remaining!==0)return;
    const hits=patterns(counts);
    for(const [key] of PATTERNS)if(hits[key])weighted[key]+=ways;
    return;
   }
   const level=levels[i],limit=Math.min(levelCounts[level],remaining);
   for(let n=0;n<=limit;n++){
    counts[level]=n;
    enumerate(i+1,remaining-n,ways*choose(levelCounts[level],n));
   }
  }
  enumerate(0,5,1);
  const probabilities={};
  for(const [key] of PATTERNS)probabilities[key]=Math.max(0,Math.min(1,weighted[key]/total));
  return {total,probabilities};
 }
 function evaluate(cardIds,lookup,fusionIds=[]){
  if(!Array.isArray(cardIds)||typeof lookup!=='function')throw new TypeError('Kartenliste und Kartenauflösung erforderlich');
  const cards=cardIds.map(id=>lookup(id));
  const invalid=cards.filter(c=>!c||!Number.isInteger(Number(c.level))||Number(c.level)<1);
  if(invalid.length)throw new Error('Mindestens eine Karte hat keine gültige Stufe');
  const count=cards.length;
  const levels={},elements={},copyCounts=new Map();
  let defHigher=0,atkHigher=0,neutral=0,rawAtk=0,rawDef=0;
  cards.forEach((c,i)=>{
   const level=Number(c.level),el=String(c.element||'UNBEKANNT');
   levels[level]=(levels[level]||0)+1;
   elements[el]=(elements[el]||0)+1;
   const id=cardIds[i];copyCounts.set(id,(copyCounts.get(id)||0)+1);
   const atk=Number(c.atk)||0,def=Number(c.def)||0;
   rawAtk+=atk;rawDef+=def;
   if(def>atk)defHigher++;
   else if(atk>def)atkHigher++;
   else neutral++;
  });
  const odds=fiveCardOdds(levels);
  const distinct=copyCounts.size;
  const hints=[];
  const add=(type,title,details)=>hints.push({type,title,details});
  if(count!==40)add('warning','Deckgröße prüfen','Die folgenden Wahrscheinlichkeiten gelten für eine 5-Karten-Hand aus den derzeit ausgewählten Karten. Für reguläre Duelle werden genau 40 benötigt.');
  const ones=(levels[1]||0)+(levels[2]||0);
  if(ones>=20)add('strength','Niedrige Stufen als Ressource','Viele Stufe-1/2-Karten ermöglichen Paar- und Drillingkombinationen. Dafür solltest du passende Fusionsvorlagen bereithalten.');
  else if(ones<8)add('tradeoff','Wenig Material der Stufen 1–2','Du hast wenig Material für niedrigrangige Kombinationsboni. Das ist nicht grundsätzlich schlecht, verändert aber deine Fusionsmöglichkeiten.');
  if(odds.probabilities.smallStraight>=.2)add('strength','Potenzial für kleine Straßen','Deine Stufenverteilung bietet eine gute Ausgangsbasis, um kleine Straßen zusammenzustellen. Das ist keine Garantie für eine sofort verfügbare Fusion.');
  if(odds.probabilities.pair<.35)add('tradeoff','Seltene Stufengleichheit','Mit diesem Deck liegt in der anfänglichen Fünferhand vergleichsweise selten ein Stufenpaar. Mehr gleiche Stufen können das ändern.');
  if(defHigher>atkHigher)add('tactic','DEF-orientierte Werte','Mehr deiner Karten haben höhere DEF als ATK. Derzeit lebt diese Spielweise vor allem von Gegenangriffsschaden und Überleben, nicht von einem eigenen defensiven Finisher.');
  else if(atkHigher>defHigher*2)add('tactic','Offensiver Schwerpunkt','Dein Deck bevorzugt direkten Druck. Achte auf Gegner mit hohen DEF-Werten und das Risiko des Angriffsverschleißes.');
  if(Array.isArray(fusionIds)&&fusionIds.length<5)add('tradeoff','Fusionsdeck bewusst prüfen','Du nutzt nur wenige Fusionsvorlagen. Prüfe, ob sie zu den Stufen passen, die du tatsächlich häufig auf der Hand hast.');
  if(distinct<14)add('tactic','Viele Kopien, wenig unterschiedliche Arten','Ein konzentriertes Deck ermöglicht wiederholbare Stufenmuster. Einzelne Kartenarten fallen dafür stärker ins Gewicht.');
  if(!hints.length)add('tactic','Ausgewogene Grundlage','Das Deck zeigt keine offensichtliche Konzentration auf eine einzelne Stufe. Vergleiche die möglichen Muster mit deinen Fusionsvorlagen.');
  return {
   count,validDeck:count===40&&Math.max(0,...copyCounts.values())<=3,
   distinct,levelCounts:levels,elementCounts:elements,atkHigher,defHigher,neutral,
   averageAtk:count?Math.round(rawAtk/count):0,averageDef:count?Math.round(rawDef/count):0,
   fusionCount:Array.isArray(fusionIds)?fusionIds.length:0,
   opening:odds,hints:hints.slice(0,5)
  };
 }
 const api=Object.freeze({version:'1.0.0',choose,patterns,fiveCardOdds,evaluate,PATTERNS});
 if(typeof module==='object'&&module.exports)module.exports=api;
 root.ArcaneStrategy=api;
})(typeof window!=='undefined'?window:(typeof globalThis!=='undefined'?globalThis:{}));