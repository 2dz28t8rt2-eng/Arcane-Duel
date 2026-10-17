/* Arcane Duel – role-inheriting fusion & explicit multi-field synthesis.
 * Only the actual summoned fusion INSTANCE changes role and stat distribution.
 * No card catalog IDs, permanent template stats or PvP rules are mutated.
 */
'use strict';
(()=>{
 const escape=s=>escapeHtml(String(s));
 const roleOf=c=>c?.roleOverride||CARDS[c?.id]?.role||'combatant';
 const roleName={predator:'Predator',guardian:'Verteidiger',soul:'Seelenzehrer'};
 const r10=n=>Math.max(10,Math.round(n/10)*10);
 function inheritance(materials){
  // Equal roles (including two soul eaters) must win over an unrelated template tag.
  if(!Array.isArray(materials)||materials.length<2)return null;
  const roles=materials.map(roleOf);
  if(roles.every(r=>r==='soul'))return 'soul';
  const defense=roles.filter(r=>r==='guardian'||r==='soul').length;
  const predators=roles.filter(r=>r==='predator').length;
  const majority=Math.floor(roles.length/2)+1;
  if(defense>=majority&&defense>predators)return 'guardian';
  if(predators>=majority&&predators>defense)return 'predator';
  return null;
 }
 function soulOdds(materials){
  return Math.min(.75,.20+materials.reduce((n,c)=>n+.035+.007*Math.min(12,Math.max(1,dataOf(c).level)),0));
 }
 function imprint(g,materials){
  if(g?.mode!=='pve'||materials.length<2)return null;
  const inherited=inheritance(materials);
  if(!inherited)return null;
  if(inherited==='predator'||inherited==='soul')return {role:inherited,source:'material',materials:materials.length};
  // Only 3+ guardian materials can roll for a Seelenzehrer awakening.
  if(materials.length===2)return {role:'guardian',source:'material',materials:2,soulOdds:0,soulAwakened:false};
  const field=Array.isArray(g.arcaneFieldInputs)?g.arcaneFieldInputs:[];
  const sameField=field.length>=3&&field.every(x=>['guardian','soul'].includes(roleOf(x)));
  const odds=soulOdds(materials);
  const awakened=sameField||randomInt(g,10000)<Math.floor(odds*10000);
  return {role:awakened?'soul':'guardian',source:'material',materials:materials.length,
   soulOdds:odds,soulAwakened:awakened};
 }
 // Evolution calculates the role *before* the 88–112% stat rolls.
 // This wrapper deliberately no longer multiplies the final card a second time.
 const oldFuse=fusedInstance;
 fusedInstance=function(g,materials,levels){return oldFuse(g,materials,levels);};

 // Legacy saves may include the removed one-off Rush bonus.
 // Clean it once when a resumed PvE duel advances; never grant a new bonus.
 const oldAdvanceTurn=advanceTurn;
 advanceTurn=function(g){
  if(g?.mode==='pve')for(const p of g.players)for(const c of p.field.filter(Boolean)){
   if(c.rushBoostActive){
    c.card.atk=Math.max(0,c.card.atk-c.rushBoostActive);
    delete c.rushBoostActive;delete c.rushUntil;
   }
   delete c.surgeTurn;
  }
  return oldAdvanceTurn(g);
 };
 const oldShowHud=render;
 let fieldPick=false,zones=[];
 function reset(){fieldPick=false;zones=[];}
 function candidates(){
  if(!game||game.mode!=='pve'||game.pending?.kind!=='normal'||game.active!==0)return null;
  const p=game.players[0],hand=game.pending.card;
  if(!p.hand.some(c=>c.uid===hand.uid)||isFateCard(hand))return null;
  return {p,hand};
 }
 function picked(){
  const q=candidates();return q?zones.map(i=>({i,c:q.p.field[i]})).filter(x=>x.c&&!isFateCard(x.c)):[];
 }
 function commitFusion(id){
  const q=candidates(),m=picked();if(!q||!m.length||m.length>4)return false;
  const card=CARDS[id];
  const entries=[q.hand,...m.map(x=>x.c)],levels=entries.map(c=>dataOf(c).level);
  if(!card||!fusionOptions(game,levels).some(c=>c.id===id))return false;
  if(!q.p.remainingFusion.includes(id))return false;
  if(m.some(x=>q.p.field[x.i]!==x.c))return false;
  if(q.p.hand.findIndex(c=>c.uid===q.hand.uid)<0)return false;
  const previousChoice=game.fusionChoice;
  game.fusionChoice=id;
  game.arcaneFieldInputs=m.map(x=>x.c);
  let result;
  try{result=fusedInstance(game,entries,levels);}
  finally{delete game.arcaneFieldInputs;if(previousChoice===undefined)delete game.fusionChoice;else game.fusionChoice=previousChoice;}
  if(!result)return false;
  q.p.hand.splice(q.p.hand.findIndex(c=>c.uid===q.hand.uid),1);
  q.p.graveyard.push(q.hand,...m.map(x=>x.c));
  for(const x of m)q.p.field[x.i]=null;
  q.p.field[m[0].i]=result;
  result.summonedTurn=game.turn;
  game.totalFusions[0]++;
  game.summoned=true;game.pending=null;game.selection=null;game.materials=[];game.lastSummoned=result;
  logEvent(game,'Gezielte Feldfusion: 1 Handkarte + '+m.length+' Feldmonster → '+dataOf(result).name+'.');
  game.cinemaActive=true;reset();render();saveDuelSnapshot();
  return true;
 }
 function launch(){
  const q=candidates(),m=picked();if(!q||!m.length||m.length>4){toast('Wähle ein bis vier eigene Monster auf dem Feld als Fusionsmaterial.');return;}
  const materials=[q.hand,...m.map(x=>x.c)],levels=materials.map(c=>dataOf(c).level);
  const options=fusionOptions(game,levels);if(!options.length){toast('Mit diesen Monsterstufen ist derzeit keine passende Fusionskarte verfügbar.');return;}
  const visualMaterials=materials.map(c=>({art:dataOf(c).art,name:dataOf(c).name,level:dataOf(c).level,field:m.some(x=>x.c.uid===c.uid),soul:Math.max(0,c.essenceCombat?.soul||0)}));
  chooseFusionModal(levels,materials,async id=>{
   if(!commitFusion(id)){toast('Die Feldfusion konnte nicht abgeschlossen werden.');return;}
   const result=game.lastSummoned;if(!result)return;
   busy=true;
   try{await fusionAnimation(dataOf(result).level,visualMaterials,'field');}
   finally{busy=false;game.cinemaActive=false;render();}
  },'Feldmonster werden tatsächlich verbraucht. Gespeicherte Seelenenergie verleiht der neuen Fusion zusätzlich DEF; Seelenzehrer können einen Teil davon als Energie übernehmen.');
 }
 $('ownRow')?.addEventListener('click',ev=>{
  if(!fieldPick||!candidates())return;
  const b=ev.target.closest('[data-mine]');if(!b)return;
  const idx=Number(b.dataset.mine),c=game.players[0].field[idx];
  if(!c||isFateCard(c))return;
  ev.stopImmediatePropagation();ev.preventDefault();
  if(zones.includes(idx))zones=zones.filter(x=>x!==idx);
  else if(zones.length<4)zones.push(idx);
  else toast('Maximal vier Feldmonster zusätzlich zur Handkarte.');
  render();
 },true);
 $('summonStage')?.addEventListener('click',ev=>{
  const button=ev.target.closest('[data-field-synthesis]');if(!button)return;
  ev.preventDefault();ev.stopImmediatePropagation();
  if(button.dataset.fieldSynthesis==='toggle'){fieldPick=!fieldPick;if(!fieldPick)zones=[];render();}
  if(button.dataset.fieldSynthesis==='commit')launch();
 });
 render=function(){
  oldShowHud();
  if(game&&uiMode==='duel'){
   for(const [row,owner,kind] of [['ownRow',game.mode==='pve'?0:game.active,'mine'],['enemyRow',game.mode==='pve'?1:1-game.active,'enemy']]){
    $(row)?.querySelectorAll('[data-'+kind+']').forEach(slot=>{
     const c=game.players[owner].field[Number(slot.dataset[kind])];
     if(c?.rushBoostActive)slot.insertAdjacentHTML('beforeend','<span class="arcane-rush-ready">⚡ VORSTOSS +80</span>');
    });
   }
  }
  const q=candidates();
  if(!q){if(!game?.pending||game.pending.kind!=='normal')reset();return;}
  const stage=$('summonStage');if(!stage)return;
  const count=picked().length;
  const soulStored=picked().reduce((total,x)=>total+Math.min(2000,Math.max(0,x.c.essenceCombat?.soul||0)),0);
  stage.insertAdjacentHTML('beforeend','<section class="arcane-field-synthesis">'+
   '<strong>✧ Freie Feldfusion</strong><p>Die Handkarte eröffnet die Fusion. Wähle danach bis zu vier deiner Feldmonster. Zwei gleichartige Materialien vererben ihre Rolle. Bei gemischten Gruppen entscheidet die Mehrheit. Zwei Seelenzehrer bleiben Seelenzehrer. Gesammelte Seelenenergie auf Feldmaterial wird teilweise zu zusätzlicher DEF der Fusion.</p>'+
   '<button type="button" class="btn" data-field-synthesis="toggle">'+(fieldPick?'Feldmaterialwahl beenden':'Feldmonster auswählen')+'</button>'+
   (fieldPick?'<span class="arcane-synth-status">'+count+' Feldmonster gewählt'+(soulStored?' · ✦ '+soulStored+' Seele → +'+Math.min(250,Math.floor(soulStored*.3/10)*10)+' DEF (max.)':'')+'</span>'+
   '<button type="button" class="btn primary" data-field-synthesis="commit" '+(!count?'disabled':'')+'>Feldfusion mit '+(count+1)+' Materialien</button>':'')+'</section>');
  if(fieldPick)$('ownRow')?.querySelectorAll('[data-mine]').forEach(b=>{
   const idx=Number(b.dataset.mine);
   b.classList.toggle('arcane-synth-picked',zones.includes(idx));
   const soul=Math.max(0,Math.floor(q.p.field[idx]?.essenceCombat?.soul||0));
   if(soul){b.classList.add('arcane-synth-charged');b.style.setProperty('--soul-energy',String(soul));
    if(zones.includes(idx))b.insertAdjacentHTML('beforeend','<span class="arcane-soul-chosen">✦ '+soul+' Seelenenergie · Erbe +'+Math.min(250,Math.floor(soul*.3/10)*10)+' DEF</span>');}
   if(q.p.field[idx])b.classList.add('arcane-synth-available');
  });
 };
 window.ArcaneRoleFusion=Object.freeze({version:'1.2.0',inheritance,soulOdds,imprint,reset});
})();
