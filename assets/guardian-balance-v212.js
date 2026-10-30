/* Arcane Duel v21.2 – final, once-only normal Guardian template balance.
 * Must run AFTER the full Solo catalogue and late role reassignments. 2v2
 * snapshots are generated from this exact Solo registry, not recalculated
 * separately. No changes to existing saved card instances or progression.
 */
'use strict';
(()=>{
 if(typeof balancedGuardianBaseValues!=='function'||typeof CARDS==='undefined'||
  !Array.isArray(CARDS)||!CARDS.length)
  throw Error('Wächter-Balancing: der vollständige Solo-Kartenkatalog fehlt.');
 if(window.ArcaneGuardianBalanceV212)
  throw Error('Wächter-Balancing darf nur einmal angewendet werden.');
 let changed=0,atkReduced=0;
 for(const card of CARDS){
  const values=balancedGuardianBaseValues(card);
  if(!values)continue;
  if(values.atk<card.atk)atkReduced++;
  card.atk=values.atk;
  card.def=values.def;
  changed++;
 }
 window.ArcaneGuardianBalanceV212=Object.freeze({
  version:'21.2',pool:GUARDIAN_BASE_BALANCE.pool,
  atkShare:GUARDIAN_BASE_BALANCE.atkShare,changed,atkReduced
 });
})();
