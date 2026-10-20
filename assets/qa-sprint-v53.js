/* Arcane Duel QA 5.3: validated attacks, cancellable targeting, intuitive field fusion and role details.
 * Presentation and input guards only; no save-schema or card-value migration.
 */
'use strict';
(()=>{
 const oldAttackUI=performAttack;
 performAttack=async function(ai,di){
  if(!inputAllowed())return;
  const g=game,a=g.players[g.active]?.field?.[ai],foe=g.players[1-g.active];
  if(!a||!canAttack(g,a)||(di!==null&&!foe.field[di])||
     (di===null&&foe.field.some(Boolean))){
   // An already spent attack may not play a fake projectile.
   g.selection=null;render();toast('Dieser Angriff ist nicht mehr möglich. Wähle eine andere Kreatur.');return;
  }
  return oldAttackUI(ai,di);
 };
 function cancelTarget(){
  if(!inputAllowed()||game.selection?.type!=='field')return false;
  game.selection=null;enemyPreviewIndex=null;render();
  return true;
 }
 const oldOwn=onOwnSlot;
 onOwnSlot=async function(idx,choice){
  if(!inputAllowed())return;
  const g=game,chosen=g.selection,target=self().field[idx];
  if(!g.pending&&chosen?.type==='field'&&chosen.idx===idx){
   // Clicking the selected attacker again explicitly cancels the target.
   // No combat action, fatigue or animation is consumed.
   cancelTarget();return;
  }
  // A single click on an occupied field cell while a hand creature is chosen
  // is a hand + field fusion, not a change of inspection focus.
  if(g.mode==='pve'&&!g.pending&&!g.summoned&&chosen?.type==='hand'&&target){
   const hand=self().hand.find(x=>x.uid===chosen.uid);
   if(!hand){g.selection=null;render();return;}
   const levels=[dataOf(hand).level,dataOf(target).level];
   const opts=fusionOptions(g,levels,[hand,target]);
   if(!opts.length){
    toast(fusionFailureReason(g,levels));return;
   }
   if(!prepareNormal(g,hand.uid)){
    toast('Die gewählte Handkarte kann nicht vorbereitet werden.');return;
   }
   render();
   return oldOwn(idx,choice);
  }
  if(g.pending&&target&&g.mode==='pve'&&choice===undefined){
   const levels=[dataOf(g.pending.card).level,dataOf(target).level];
   const opts=fusionOptions(g,levels,[g.pending.card,target]);
   if(!opts.length){toast(fusionFailureReason(g,levels));return;}
  }
  return oldOwn(idx,choice);
 };
 const previousPreview=renderCardPreview;
 const roleNotes={
  predator:{title:'PREDATOR · Offensive',body:'Angriffsorientierte Kreatur. Viele normale Predatoren auf dem Feld erzeugen gemeinsam Druck: +2 % ATK je weiterem normalen Predator (maximal +8 %). Dieser Schwarmbonus ist von den bisherigen Predator-Fähigkeiten getrennt.'},
  guardian:{title:'WÄCHTER · Verteidigerfamilie',body:'Im DEF-Modus: 35 % weniger eingehender Verteidigerschaden, bei geeigneten Angriffen Gegenschlag mit 50 % eigener ATK als LP-Schaden. Wächter können andere verteidigende Verbündete heilen. Aktiver Schildstoß: einmal pro Zug, 30 % ATK als Schaden am ATK-/DEF-Wert eines gegnerischen Monsters; verbraucht die Angriffsaktion und verursacht keine direkten LP-Schäden.'},
  soul:{title:'SEELENZEHRER · Verteidigerfamilie',body:'Teilt den DEF-Schutz und Gegenschlag der Wächter. In DEF kann Seelenenergie passiv aus gegnerischen Monsterwerten absorbiert und für Burn oder Schutz gespeichert werden. Verfügbare aktive Fähigkeiten: Seelenraub (ein Ziel, drei eigene Züge Abklingzeit), Seelenstoß/Entladen (verbraucht Seelenessenz für direkten Schaden), Verdichten (Seelenenergie in stabile DEF, drei eigene Züge Abklingzeit).'},
  combatant:{title:'ALLROUNDER · Resonanz',body:'Ausgewogene ATK und DEF. Die bisherige Materialresonanz bleibt bei 4 %, 8 %, 12 % und 16 % mit steigender Feldpräsenz. Aus gemischten Fusionen kann stattdessen ein Resonator entstehen.'},
  resonator:{title:'RESONATOR · Fusionsrolle',body:'Entsteht bei Fusionen ohne eindeutige Spezialistenmehrheit. Die Qualitätsresonanz beträgt 10 %, 20 % oder 30 % abhängig von den Resonanzladungen.'}
 };
 function shownMonster(){
  if(!game)return null;
  const g=game,owner=g.mode==='pve'?0:g.active,p=g.players[owner],s=g.selection;
  const uid=g.materials?.at(-1);
  return g.pending?.card||(s?.type==='field'?p.field[s.idx]:
    s?.type==='hand'?p.hand.find(c=>c.uid===s.uid):
    p.hand.find(c=>c.uid===uid))||
    (enemyPreviewIndex!==null?g.players[1-owner].field[enemyPreviewIndex]:null);
 }
 renderCardPreview=function(...args){
  const result=previousPreview(...args);
  const host=$('largeCardPreview'),c=shownMonster();
  if(!host||!c||game?.cinemaActive||game?.pending?.kind==='fusion')return result;
  host.querySelector('.ad53-role-help')?.remove();
  const spec=CARDS[c.id];
  const role=c.roleOverride||spec?.role||'combatant';
  const note=roleNotes[role];
  if(!note)return result;
  const special=spec?.roleStyle==='defender'&&role==='guardian'?
   'Spezialisierung: Panzerwächter. Die Kampfrolle bleibt WÄCHTER. „Verteidiger“ bezeichnet die übergeordnete DEF-Strategie aus Wächtern und Seelenzehrern, nicht eine dritte Rolle.':'';
  const box=document.createElement('section');
  box.className='ad53-role-help';
  const head=document.createElement('h4');head.textContent=note.title;box.append(head);
  const p=document.createElement('p');p.textContent=note.body;box.append(p);
  if(special){const small=document.createElement('p');small.textContent=special;box.append(small);}
  if(c.essenceCombat){const e=c.essenceCombat,x=document.createElement('p');
   x.textContent='Aktueller Zustand: '+(e.soul||0)+' Seelenessenz · Verdichten '+(e.cooldown||0)+' Züge · Seelenraub '+(e.raidCooldown||0)+' Züge Abklingzeit.';
   box.append(x);
  }
  host.append(box);return result;
 };
 const previousRender=render;
 render=function(...args){
  const value=previousRender(...args);
  if(uiMode!=='duel'||!game)return value;
  const hint=$('actionHint'),selected=game.selection?.type==='field',p=game.players[game.active],c=selected?p.field[game.selection.idx]:null;
  if(hint&&selected)hint.textContent=canAttack(game,c)?
   'Gegner als Ziel wählen · Angriff abbrechen: ESC oder gewähltes Monster erneut anklicken.':
   'Dieses Monster hat seinen Angriff verbraucht. ESC zum Abwählen.';
  const panel=$('duelScreen')?.querySelector('.control-stack');
  panel?.querySelector('#ad53CancelAttack')?.remove();
  if(panel&&selected){
   const b=document.createElement('button');
   b.id='ad53CancelAttack';b.type='button';b.className='btn wide';
   b.textContent='✕ Auswahl / Angriff abbrechen [ESC]';
   b.disabled=!inputAllowed();
   b.addEventListener('click',cancelTarget);
   panel.insertBefore(b,panel.firstChild);
  }
  return value;
 };
 // Keydown is captured before the old global hotkey dispatcher.
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&inputAllowed()&&game?.selection?.type==='field'){
   event.preventDefault();event.stopImmediatePropagation();cancelTarget();
  }
 },true);
 window.ArcaneQaSprint53=Object.freeze({version:'5.3',cancelTarget});
 if(uiMode==='duel')render();
})();