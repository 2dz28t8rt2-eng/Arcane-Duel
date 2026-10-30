/* Arcane Duel v21.6 – 21 existing Predator cards become role specialists.
 * AFTER guardian-balance-v212: old Guardian cards keep their prior stats;
 * the seven newly tagged Guardians use the same one-time 95%/22% policy.
 * No IDs, art, ownership or saved decks are reset.
 */
'use strict';
(()=>{
 const roles={"guardian":[342,343,344,375,706,720,734],"soul":[336,337,338,361,362,732,727],"combatant":[339,340,341,352,370,716,729]};
 if(window.ArcaneRoleTransferV216)throw Error('Rollenwechsel v21.6 doppelt geladen.');
 const all=Object.entries(roles).flatMap(([role,ids])=>ids.map(id=>({id,role})));
 if(all.length!==21||new Set(all.map(x=>x.id)).size!==21||
    Object.values(roles).some(ids=>ids.length!==7))
  throw Error('Rollenwechsel v21.6: 21 eindeutige Karten erforderlich.');
 if(!window.ArcaneLevelBudget||!window.ArcaneGuardianBalanceV212)
  throw Error('Rollenwechsel v21.6: Werte- und Wächter-Balance fehlt.');
 const round10=n=>Math.round(n/10)*10,policy=window.ArcaneLevelBudget;
 const prepared=all.map(({id,role})=>{
  const c=CARDS[id];
  if(!c||c.id!==id||c.role!=='predator'||!c.rpg||c.retired||c.fusionOnly||
     c.ace||c.essenceMonster||c.enemyOnly||c.fateOnly||c.lv1Special||
     !Number.isInteger(c.level)||c.level<1||c.level>10)
   throw Error('Rollenwechsel v21.6: ungeeignete Predator-Karte '+id);
  return {c,id,role,old:{role:c.role,atk:c.atk,def:c.def,art:c.art,name:c.name,level:c.level}};
 });
 const roster=[];
 for(const {c,id,role,old} of prepared){
  const total=round10(policy.budget(c.level)*policy.rarityFactor(c));
  const share=role==='guardian'?.25:role==='soul'?.22:.50;
  c.role=role;
  c.roleStyle=role==='combatant'?'allrounder':role;
  c.atk=Math.max(50,round10(total*share));
  c.def=Math.max(50,total-c.atk);
  if(role==='guardian'){
   const value=balancedGuardianBaseValues(c);
   if(!value)throw Error('Rollenwechsel v21.6: Wächterwerte fehlen '+id);
   c.atk=value.atk;c.def=value.def;
  }
  if(role==='soul')c.soulRank=Math.min(5,Math.max(1,Math.ceil(c.level/2)));
  else delete c.soulRank;
  if(/\bPredator\b/i.test(c.desc||''))c.desc=c.desc.split(/\bPredator\b/i)[0].trim();
  if(c.id!==id||c.art!==old.art||c.name!==old.name||c.level!==old.level)
   throw Error('Rollenwechsel v21.6: Kartenidentität verändert '+id);
  roster.push(Object.freeze({id,level:c.level,name:c.name,from:old.role,to:role,
   oldAtk:old.atk,oldDef:old.def,atk:c.atk,def:c.def,art:c.art}));
 }
 window.ArcaneRoleTransferV216=Object.freeze({
  version:'21.6',count:roster.length,
  guardian:Object.freeze([...roles.guardian]),soul:Object.freeze([...roles.soul]),
  allrounder:Object.freeze([...roles.combatant]),
  byRole:Object.freeze({guardian:7,soul:7,combatant:7}),roster:Object.freeze(roster)});
})();
