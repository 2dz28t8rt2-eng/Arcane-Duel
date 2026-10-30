'use strict';
// Shared regression oracle for live cards after v21.6's explicit role transfer.
// Original artwork manifests document the initial release roles, while the
// actual game intentionally reassigns 21 ordinary monsters AFTER v21.2 balance.
const manifest=require('../../assets/role-transfer-v216-manifest.json');
const changes=new Map(Object.entries(manifest).filter(([,ids])=>Array.isArray(ids))
 .flatMap(([role,ids])=>ids.map(id=>[id,role])));
const round10=n=>Math.round(n/10)*10;
const budgets={7:1270,8:1530,9:1830,10:2150};
function roleFor(row){return changes.get(row.id)||row.role;}
function statsFor(row){
 const changed=changes.has(row.id),role=roleFor(row);
 const base=Number.isFinite(row.atk)&&Number.isFinite(row.def)?
  {atk:row.atk,total:row.atk+row.def}:
  {atk:round10(budgets[row.level]*({predator:.76,guardian:.25,soul:.22,combatant:.5}[row.role])),
   total:budgets[row.level]};
 const total=changed?budgets[row.level]:base.total;
 if(!Number.isFinite(total)||!Number.isFinite(base.atk))
  throw Error('No known level budget for card '+row.id);
 const originalAtk=changed?Math.max(50,round10(total*(role==='guardian'?.25:role==='soul'?.22:.5))):base.atk;
 if(role!=='guardian')return{atk:originalAtk,def:total-originalAtk};
 // v21.2 guardian policy applies to preexisting guardians once; for seven
 // transferred guardians it is applied AFTER the v21.6 role conversion.
 const pool=round10(total*.95);
 const floor=Math.min(80,originalAtk,Math.floor(pool/20)*10);
 const target=Math.max(floor,Math.min(pool-floor,round10(pool*.22)));
 const atk=Math.min(originalAtk,target);
 return {atk,def:pool-atk};
}
module.exports={roleFor,statsFor,changes};
