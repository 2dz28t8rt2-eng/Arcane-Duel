/* Fusion templates no longer carry a permanent role tag.
 * The played fusion instance receives roleOverride through
 * ArcaneRoleFusion.imprint(materials) in evolution.js, and still displays it.
 */
'use strict';
(()=>{
 let cleared=0,migrated=0;
 for(const c of CARDS){
  if(!c)continue;
  if(c.fusionOnly){
   if(Object.prototype.hasOwnProperty.call(c,'role')){delete c.role;cleared++;}
   if(Object.prototype.hasOwnProperty.call(c,'roleStyle'))delete c.roleStyle;
   c.fusionRoleFree=true;
  } else if(c.role==='hunter'){
   c.role='predator';migrated++;
  }
 }
 window.ArcaneFusionRoleNeutralV129=Object.freeze({cleared,migrated,roleSource:'materials-only'});
})();
