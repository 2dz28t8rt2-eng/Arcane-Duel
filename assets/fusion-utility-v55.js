/* Arcane Duel 5.5 — utility that makes lower-tier fusions tactically relevant.
 * Effects resolve ONCE after a successful, real fusion placement.
 */
'use strict';
(()=>{
 const type=c=>c?.roleOverride||CARDS[c?.id]?.role||'combatant';
 const eligible=c=>{
  const d=c&&dataOf(c);
  return !!d&&!!c.fusion&&d.level>=3&&d.level<=5&&
   !d.ace&&!d.lv1Exclusive&&!c.fate&&!d.essenceMonster;
 };
 function grant(g,c){
  if(g?.mode!=='pve'||!eligible(c)||c.arcaneUtilityTriggered)return false;
  const p=g.players[g.active],e=g.players[1-g.active],d=dataOf(c),lvl=d.level;
  c.arcaneUtilityTriggered=true;
  let message='';
  const r=type(c);
  if(r==='predator'){
   const allies=p.field.filter(x=>x&&x!==c&&!x.fusion&&type(x)==='predator').slice(0,3);
   const amount=15+lvl*5;
   for(const ally of allies)ally.card.atk+=amount;
   message='Jagdimpuls: '+allies.length+' normale Predatoren erhalten +'+amount+' ATK.';
  }else if(r==='guardian'){
   const patient=p.field.filter(x=>x&&x!==c&&type(x)==='soul')
    .sort((a,b)=>a.card.def-b.card.def)[0];
   const restore=60+lvl*25;
   if(patient)patient.card.def+=restore;
   const hp=50+20*lvl;
   p.lp=Math.min(g.maxLP,p.lp+hp);
   message='Schutzritual: '+hp+' Team-LP geheilt'+
    (patient?' und '+restore+' DEF auf '+dataOf(patient).name:'')+'.';
  }else if(r==='soul'){
   const amount=Math.min(e.lp,50+lvl*20);
   e.lp-=amount;
   p.lp=Math.min(g.maxLP,p.lp+amount);
   message='Seelensog: '+amount+' Gegner-LP entzogen und eigene LP geheilt.';
   if(e.lp===0)conclude(g,g.active,'Seelensog einer niedrigen Fusion');
  }else{
   // Allrounder and Resonator retain their existing 4/8/12/16 and
   // 10/20/30 resonance rules. This is a separate one-time utility.
   if(p.deck.length&&p.hand.length<6){
    p.hand.push(newInstance(g,p.deck.shift(),g.active));
    message='Runenblick: eine zusätzliche Karte gezogen.';
   }else{
    p.shield=Math.min(800,(p.shield||0)+100);
    message='Runenblick: +100 Schildpunkte statt Kartenziehen.';
   }
  }
  c.arcaneUtilityText=message;
  logEvent(g,d.name+' · '+message);
  return true;
 }
 const previous=placePending;
 placePending=function(g,idx,choice){
  const result=previous(g,idx,choice);
  if(result?.fused&&result.card&&g?.mode==='pve')grant(g,result.card);
  return result;
 };
 const rules={
  predator:'Jagdimpuls: Verstärkt bei der Beschwörung bis zu drei normale Predatoren im Feld.',
  guardian:'Schutzritual: Heilt Team-LP und stärkt einen verbündeten Seelenzehrer.',
  soul:'Seelensog: Entzieht gegnerische Lebenspunkte und heilt die eigenen.',
  combatant:'Runenblick: Zieht sofort eine zusätzliche Karte oder erzeugt Schildpunkte.',
  resonator:'Runenblick: Zieht sofort eine zusätzliche Karte oder erzeugt Schildpunkte.'
 };
 for(const c of RPG_FUSIONS){
  if(!c?.rpg||!c.fusionOnly||c.ace||c.lv1Exclusive||c.essenceMonster||
     c.retired||c.level<3||c.level>5)continue;
  const desc=rules[c.role]||rules.combatant;
  if(!String(c.desc||'').includes('Niedrigstufige Fusion:'))
   c.desc=String(c.desc||'')+' Niedrigstufige Fusion: '+desc;
 }
 window.ArcaneFusionUtility55=Object.freeze({version:'5.5.0',eligible,grant,rules});
})();
