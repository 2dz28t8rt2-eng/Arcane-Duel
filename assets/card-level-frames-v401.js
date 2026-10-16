/* Arcane Duel 4.0.1 — one visible frame treatment PER LEVEL (1–10).
 * Builds on the 20 official family/tier templates; no gameplay or save changes.
 * Fate cards retain their dedicated identity.
 */
'use strict';
(()=>{
  const api=window.ArcaneCardTemplates;
  if(!api || typeof frameClassForCard!=='function'){
    console.warn('Arcane Level Frames: Original-Templates fehlen.');
    return;
  }
  const frameBefore=frameClassForCard;
  function resolve(card,instance){
    const level=Number(card?.level);
    if(!Number.isInteger(level)||level<1||level>10)return null;
    const template=api.choose(card,instance);
    if(!template)return null;
    const family=template.family;
    const token=String(level).padStart(2,'0');
    return Object.freeze({
      id:template.id, family, tier:template.tier, level,
      base:template.frame,
      overlay:'assets/card-templates/levels/'+family+'-lv'+token+'.svg',
      className:'ad-level-'+family+'-'+token
    });
  }
  frameClassForCard=function(instance){
    const classes=frameBefore(instance);
    if(typeof isFateCard==='function' && isFateCard(instance))return classes;
    const card=typeof dataOf==='function'?dataOf(instance):instance;
    const result=resolve(card,instance);
    return result?classes+' ad-level-frame '+result.className:classes;
  };
  window.ArcaneLevelFrames=Object.freeze({version:'4.0.1',resolve});
})();
