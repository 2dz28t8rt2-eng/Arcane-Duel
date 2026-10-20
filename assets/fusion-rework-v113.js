/* Arcane Duel v11.3: material-sensitive fusion levels and preserved earned quality.
 * Live PvE uses the existing template inventory, poker/role/element/resonance
 * rolls and Lv1-quest permission checks; classic PvP remains untouched.
 */
'use strict';
(()=>{
 const math=window.ArcaneFusionMath;
 if(!math)throw Error('v11.3 requires the shared Evolution poker calculator');
 const old={budget:fusionBudget,options:fusionOptions,fuse:fusedInstance,
   quality:math.getQuality(),pattern:math.getPattern(),preview:math.getTuned(),
   validate:validateDuelSnapshot};
 // The optional audit mask exists only in the offline test harness.
 // Normal gameplay has no mask and continues to apply v11.3 to both sides.
 const enabled=g=>!g||g.mode!=='pve'||!(window.__arcaneFusionAuditMask)
   ||(g.active===0?window.__arcaneFusionAuditMask.player:window.__arcaneFusionAuditMask.npc);
 let legacyQualityDepth=0;
 const withLegacyQuality=fn=>{
   legacyQualityDepth++;
   try{return fn();}finally{legacyQualityDepth--;}
 };
 const clamp=(n,low,high)=>Math.min(high,Math.max(low,n));
 const levelsOf=cards=>cards.map(c=>dataOf(c).level);
 const isStreet=lv=>lv.length>=3&&new Set(lv).size===lv.length&&
  [...lv].sort((a,b)=>a-b).every((x,i,a)=>i===0||x===a[i-1]+1);
 function specialLv1(g,levels){
  return g?.mode==='pve'&&g?.active===0&&levels.length>=3&&
   levels.every(n=>n===1)&&window.ArcaneLv1Swarm?.enabled?.(g);
 }
 function flattenPending(g,levels,materials=[]){
  if(g?.mode!=='pve'||!g.pending||g.pending.kind!=='fusion'||
     levels.length!==g.pending.levels?.length+1||materials.length>2)return levels;
  if(levels.slice(0,-1).some((n,i)=>n!==g.pending.levels[i]))return levels;
  // The all-Level-1 quest has a deliberate 3-5 ORIGINAL-material exception.
  if(specialLv1(g,levels))return levels;
  return [dataOf(g.pending.card).level,levels.at(-1)];
 }
 function contextMaterial(g,levels,material=[]){
  if(material.length===levels.length)return material;
  if(g?.arcaneResonatorBudgetMaterials?.length===levels.length)return g.arcaneResonatorBudgetMaterials;
  if(g?.pending?.kind==='fusion'&&levels.length===2){
   const field=g.players[g.active].field.find(x=>x&&dataOf(x).level===levels[1]);
   if(field)return [g.pending.card,field];
  }
  const p=g?.players?.[g.active],sel=g?.materials;
  if(Array.isArray(sel)&&p&&sel.length===levels.length){
   const cards=sel.map(id=>p.hand.find(c=>c.uid===id));
   if(cards.every(Boolean)&&cards.every((c,i)=>dataOf(c).level===levels[i]))return cards;
  }
  return material;
 }
 function coreIndex(levels,materials,g,street){
  if(street)return levels.indexOf(Math.max(...levels));
  const uid=g?.arcaneFusionCoreUid;
  if(uid&&materials.length===levels.length){
   const index=materials.findIndex(x=>x.uid===uid);
   if(index!==-1)return index;
  }
  return levels.indexOf(Math.max(...levels));
 }
 function pairGain(core,other){
  const difference=Math.abs(core-other);
  const base=core>=5?3:core>=3?2:core===2?1:0;
  if(difference===0||difference===1)return base;
  if(difference===2)return Math.min(base,2);
  if(difference===3)return Math.min(base,1);
  return difference>=5?-2:-1;
 }
 // Explicit lineage: only actual resonator fusion instances count. Any existing
 // paid bonus blocks a second one even after two chains merge.
 function resonatorLineage(materials){
  let count=0,used=false;
  for(const card of materials){
   if(!card)continue;
   const prior=card.fusionResonatorLineage;
   if(prior&&Number.isInteger(prior.count)){count+=Math.min(2,Math.max(0,prior.count));used=used||prior.used===true;}
   else if(card.fusion&&card.roleOverride==='resonator')count++;
  }
  count=Math.min(2,count);
  return {count,used,granted:!used&&count>=2};
 }
 function calculate(levels,g,materials=[]){
  if(!Array.isArray(levels)||levels.length<2||levels.length>5||
     levels.some(x=>!Number.isInteger(x)||x<1||x>12))
   return {level:0,reason:'Mindestens zwei und höchstens fünf gültige Materialien nötig.'};
  const street=isStreet(levels),coreI=coreIndex(levels,materials,g,street),
    core=levels[coreI],other=levels.filter((_,i)=>i!==coreI).sort((a,b)=>Math.abs(a-core)-Math.abs(b-core)||b-a);
  const chain=materials.length===levels.length&&materials[coreI]?.fusion===true;
  const floor=chain?core:Math.max(1,core-1);
  const first=other[0],gain=pairGain(core,first);
  const base=core<=2?Math.min(core,Math.max(1,floor+Math.max(0,gain))):
   Math.max(floor,floor+gain-(chain?1:0));
  // All 3-5 cards participate in the level and quality eligibility:
  // A fifth filler cannot be used to force a bonus and be ignored.
  const support=other.slice(1),strong=other.length>=2&&
   other.every(x=>Math.abs(x-core)<=2)&&core>=3;
  const bonus=street?(levels.length===5&&core>=4?1:0):(strong?1:0);
  // For a 5-card straight the missing lower links are a reward, not a spread penalty.
  // A four-card straight already gets its substantial poker rolls and quality.
  const startPair=core===1&&levels.length===2&&levels.every(l=>l===1)?2:base+bonus;
  const lineage=materials.length===levels.length?resonatorLineage(materials):{count:0,used:false,granted:false};
  // Rank from 2 actual Resonators is supernatural: it is not cancelled by
  // the ordinary total-material-level cap. Still obey absolute Lv10 cap.
  const natural=clamp(Math.min(levels.reduce((a,b)=>a+b,0),startPair),1,10);
  const result=clamp(natural+(lineage.granted?1:0),1,10);
  const weights=[1,.75,.55,.40];
  const weighted=other.reduce((sum,lv,i)=>sum+Math.max(0,Math.abs(core-lv)-1)*weights[i],0);
  const weightedMax=other.reduce((sum,_,i)=>sum+weights[i],0);
  const distance=weightedMax?weighted/weightedMax:0;
  const penalty=street?0:Math.min(.22,distance*.055);
  return {level:result,core,coreIndex:coreI,coreIsFusion:chain,first,floor,
   gain,bonus,resonatorBonus:lineage.granted?1:0,resonatorLineage:lineage,street,streetName:street?(levels.length===5?'Gigantische Straße':
      levels.length===4?'Große Straße':'Kleine Straße'):null,
   distance,penalty,weights:weights.slice(0,other.length),others:other,
   materialCount:levels.length,reason:'Kernlevel, Materialabstände und Kombination'};
 }
 // Change only the PvE level eligibility, not acquired templates.
 fusionBudget=function(levels,g,materials=[]){
  if(g?.mode!=='pve'||!enabled(g))return withLegacyQuality(()=>old.budget(levels,g,materials));
  const actual=flattenPending(g,levels,materials);
  if(specialLv1(g,levels))return old.budget(levels,g,materials);
  const used=contextMaterial(g,actual,materials);
  return calculate(actual,g,used).level;
 };
 // Unique source of truth for previews, selected template validation and NPC placements.
 fusionOptions=function(g,levels,materials=[]){
  if(g?.mode!=='pve'||!enabled(g)||specialLv1(g,levels))return old.options(g,levels,materials);
  const normalized=flattenPending(g,levels,materials);
  return old.options(g,normalized,contextMaterial(g,normalized,materials));
 };
 math.setPattern(function(levels,elements=[]){
  const out=old.pattern(levels,elements);
  if(isStreet(levels)&&levels.length===5)out.name=out.name.replace('Große Straße','Gigantische Straße');
  return out;
 });
 math.setQuality(function(levels,elements=[]){
  const oldQuality=old.quality(levels,elements);
  if(legacyQualityDepth>0)return oldQuality;
  const rule=calculate(levels,null,[]);
  if(rule.level===0)return oldQuality;
  // Keep original poker combination rewards; replace the indiscriminate range
  // penalty with weighted contribution from EVERY supplementary card.
  const spreadCharge=rule.street?0:rule.penalty;
  oldQuality.factor=clamp(1+.045*(levels.length-2)-spreadCharge+oldQuality.qualityBonus,.72,1.48);
  oldQuality.materialDistance=rule.distance;
  oldQuality.streetProtection=rule.street;
  return oldQuality;
 });
 // Insert inherited earned quality into the existing tuned calculation BEFORE
 // all role weights and the real 88-112% rolls. Never stack past the 15% cap.
 math.setTuned(function(g,levels,elements=[],materials=[]){
  if(!enabled(g))return withLegacyQuality(()=>old.preview(g,levels,elements,materials));
  const value=old.preview(g,levels,elements,materials);
  if(g?.mode!=='pve'||!materials.length)return value;
  const inherited=materials.reduce((sum,c)=>{
   if(!c?.fusion)return sum;
   const earned=Number.isFinite(c.fusionHeritage?.earnedPct)
    ?c.fusionHeritage.earnedPct
    :Math.max(0,Math.min(30,((c.rollMath?.quality||1)-1)*100));
   return sum+Math.max(0,Math.min(30,earned))*.35;
  },0);
  value.heritagePct=Math.min(15,inherited);
  value.factor=clamp(value.factor+value.heritagePct/100,.72,2.2);
  return value;
 });
 const oldFused=fusedInstance;
 fusedInstance=function(g,instances,levels){
  if(!enabled(g))return withLegacyQuality(()=>oldFused(g,instances,levels));
  let actual=levels;
  if(g?.mode==='pve'&&g.pending?.kind==='fusion'&&instances.length===2&&
     levels.length>instances.length&&!specialLv1(g,levels))
   actual=levelsOf(instances);
  const before=g.arcaneResonatorBudgetMaterials;
  g.arcaneResonatorBudgetMaterials=instances.length===actual.length?instances:null;
  let result;
  try{result=oldFused(g,instances,actual);}
  finally{g.arcaneResonatorBudgetMaterials=before;}
  if(!result?.fusion||g.mode!=='pve')return result;
  const rule=calculate(actual,g,instances.length===actual.length?instances:[]);
  const carried=Math.max(0,Math.min(15,instances.reduce((sum,c)=>{
   if(!c.fusion)return sum;
   const earned=Number.isFinite(c.fusionHeritage?.earnedPct)?c.fusionHeritage.earnedPct:
      Math.max(0,Math.min(30,((c.rollMath?.quality||1)-1)*100));
   return sum+Math.min(30,Math.max(0,earned))*.35;
  },0)));
  // Record fresh quality separately: inherited bonuses do not inherit themselves.
  const totalQuality=(result.rollMath?.quality||1);
  const earned=Math.max(0,Math.min(30,(totalQuality-1)*100-carried));
  result.fusionHeritage={earnedPct:+earned.toFixed(2),carriedPct:+carried.toFixed(2)};
  result.fusionCoreLevel=rule.core;
  result.fusionResonatorLineage={
   count:rule.resonatorLineage.count,
   used:rule.resonatorLineage.used||rule.resonatorLineage.granted
  };
  if(rule.resonatorBonus)logEvent(g,'✦ Resonator-Aufstieg: zwei Resonatoren ermöglichen einmalig +1 Fusionslevel in dieser Kette.');
  if(rule.streetName&&result.pattern?.includes('Straße'))
   result.pattern=result.pattern.replace('Große Straße',rule.streetName);
  if(result.rollMath?.combo&&rule.streetName)
   result.rollMath.combo.name=result.rollMath.combo.name.replace('Große Straße',rule.streetName);
  return result;
 };
 // Legal post-chain zone previews when a first hand fusion is awaiting placement.
 const oldCan=canCompleteHandFusion;
 canCompleteHandFusion=function(g,levels,choice){
  if(g?.mode!=='pve'||!enabled(g)||specialLv1(g,levels))return oldCan(g,levels,choice);
  const p=g.players[g.active];if(p.field.some(c=>!c))return true;
  const remaining=p.remainingFusion.slice(),index=remaining.indexOf(choice);
  if(index<0)return false;remaining.splice(index,1);
  const selected=CARDS[choice];if(!selected)return false;
  return p.field.some(old=>old&&!isFateCard(old)&&remaining.some(id=>
   CARDS[id]?.level<=calculate([selected.level,dataOf(old).level],g,[
    {uid:-1,id:choice,fusion:true,card:{level:selected.level}},
    old
   ]).level));
 };
 const oldValidate=validateDuelSnapshot;
 validateDuelSnapshot=function(raw){
  const restored=oldValidate(raw);
  const resume=(from,to)=>{
   if(!from||!to||from.uid!==to.uid||from.id!==to.id||!to.fusion)return;
   const h=from.fusionHeritage;
   if(h&&Number.isFinite(h.earnedPct)&&h.earnedPct>=0&&h.earnedPct<=30&&
       Number.isFinite(h.carriedPct)&&h.carriedPct>=0&&h.carriedPct<=15)
    to.fusionHeritage={earnedPct:h.earnedPct,carriedPct:h.carriedPct};
   if(from.fusionResonatorLineage&&Number.isInteger(from.fusionResonatorLineage.count)&&
       from.fusionResonatorLineage.count>=0&&from.fusionResonatorLineage.count<=2&&
       typeof from.fusionResonatorLineage.used==='boolean')
    to.fusionResonatorLineage={count:from.fusionResonatorLineage.count,used:from.fusionResonatorLineage.used};
   if(Number.isInteger(from.fusionCoreLevel)&&from.fusionCoreLevel>=1&&from.fusionCoreLevel<=12)
    to.fusionCoreLevel=from.fusionCoreLevel;
  };
  for(let i=0;i<2;i++){
   const a=raw.players?.[i],b=restored.players?.[i];if(!a||!b)continue;
   for(const slot of ['hand','graveyard','field']){
    const from=a[slot]||[],to=b[slot]||[];
    for(let j=0;j<from.length;j++)resume(from[j],to[j]);
   }
  }
  resume(raw.pending?.card,restored.pending?.card);
  return restored;
 };
 window.ArcaneFusionRework113=Object.freeze({version:'11.6.0',calculate,flattenPending,isStreet,resonatorLineage});
})();
