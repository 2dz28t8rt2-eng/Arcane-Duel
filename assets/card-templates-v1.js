/* Arcane Duel – automatic 20-layout renderer, without changing game values. */
'use strict';
(()=>{
 const definitions=Object.freeze([{"id":"normal-01","family":"normal","tier":1,"label":"Standard · Initiat","frame":"assets/card-templates/normal-01.svg"},{"id":"normal-02","family":"normal","tier":2,"label":"Standard · Adept","frame":"assets/card-templates/normal-02.svg"},{"id":"normal-03","family":"normal","tier":3,"label":"Standard · Elite","frame":"assets/card-templates/normal-03.svg"},{"id":"normal-04","family":"normal","tier":4,"label":"Standard · Mythisch","frame":"assets/card-templates/normal-04.svg"},{"id":"normal-05","family":"normal","tier":5,"label":"Standard · Souverän","frame":"assets/card-templates/normal-05.svg"},{"id":"fusion-01","family":"fusion","tier":1,"label":"Fusion · Initiat","frame":"assets/card-templates/fusion-01.svg"},{"id":"fusion-02","family":"fusion","tier":2,"label":"Fusion · Adept","frame":"assets/card-templates/fusion-02.svg"},{"id":"fusion-03","family":"fusion","tier":3,"label":"Fusion · Elite","frame":"assets/card-templates/fusion-03.svg"},{"id":"fusion-04","family":"fusion","tier":4,"label":"Fusion · Mythisch","frame":"assets/card-templates/fusion-04.svg"},{"id":"fusion-05","family":"fusion","tier":5,"label":"Fusion · Souverän","frame":"assets/card-templates/fusion-05.svg"},{"id":"ace-01","family":"ace","tier":1,"label":"ACE · Initiat","frame":"assets/card-templates/ace-01.svg"},{"id":"ace-02","family":"ace","tier":2,"label":"ACE · Adept","frame":"assets/card-templates/ace-02.svg"},{"id":"ace-03","family":"ace","tier":3,"label":"ACE · Elite","frame":"assets/card-templates/ace-03.svg"},{"id":"ace-04","family":"ace","tier":4,"label":"ACE · Mythisch","frame":"assets/card-templates/ace-04.svg"},{"id":"ace-05","family":"ace","tier":5,"label":"ACE · Souverän","frame":"assets/card-templates/ace-05.svg"},{"id":"essence-01","family":"essence","tier":1,"label":"Essenz · Initiat","frame":"assets/card-templates/essence-01.svg"},{"id":"essence-02","family":"essence","tier":2,"label":"Essenz · Adept","frame":"assets/card-templates/essence-02.svg"},{"id":"essence-03","family":"essence","tier":3,"label":"Essenz · Elite","frame":"assets/card-templates/essence-03.svg"},{"id":"essence-04","family":"essence","tier":4,"label":"Essenz · Mythisch","frame":"assets/card-templates/essence-04.svg"},{"id":"essence-05","family":"essence","tier":5,"label":"Essenz · Souverän","frame":"assets/card-templates/essence-05.svg"}]);
 const families=Object.freeze(['normal','fusion','ace','essence']);
 const tiers=Object.freeze(['Initiat','Adept','Elite','Mythisch','Souverän']);
 function rank(level){const lv=Math.max(1,Math.min(12,Math.floor(Number(level)||1)));return lv<=2?1:lv<=4?2:lv<=6?3:lv<=8?4:5;}
 function family(card,instance){
  if(card?.ace)return 'ace';
  if(card?.essenceMonster)return 'essence';
  if(card?.fusionOnly||instance?.fusion||instance?.fused)return 'fusion';
  return 'normal';
 }
 function choose(card,instance=null){
  if(!card)return null;
  const name=family(card,instance),tier=rank(card.level);
  return definitions.find(d=>d.family===name&&d.tier===tier)||null;
 }
 const nativeFrame=frameClassForCard;
 frameClassForCard=function(instance){
  const old=nativeFrame(instance);
  if(isFateCard(instance))return old; // dedicated Fate identity stays intact.
  const layout=choose(dataOf(instance),instance);
  return layout?old+' ad-template ad-template-family-'+layout.family+
   ' ad-template-tier-'+layout.tier+' ad-template-'+layout.id:old;
 };
 window.ArcaneCardTemplates=Object.freeze({version:'1.0.0',families,tiers,definitions,choose,rank,family});
})();