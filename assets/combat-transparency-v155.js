/* Arcane Duel v15.5: exact, read-only explanations of values that are
 * explicitly recorded on a creature. Unknown contributions are NOT guessed.
 */
'use strict';
(()=>{
  const fmt=n=>Math.round(Number(n)||0).toLocaleString('de-AT');
  const esc=n=>escapeHtml(String(n??''));
  const signed=n=>(n>0?'+':'')+fmt(n);
  function breakdown(g,card){
    if(!card||!CARDS[card.id])return null;
    const base=CARDS[card.id],current=dataOf(card),attack=effectiveAttack(g,card,null);
    const details=[];
    if(card.fusion)details.push('Fusionsmonster'+(card.qualityRolls?' · '+card.qualityRolls+' Qualitätswürfe':''));
    if(card.materialBonus&&(card.materialBonus.atk||card.materialBonus.def))
      details.push('Vererbter Materialbonus: ATK '+signed(Number(card.materialBonus.atk)||0)+' / DEF '+signed(Number(card.materialBonus.def)||0));
    if(card.roleOverride)details.push('Geerbte Rolle: '+String(card.roleOverride));
    if(Number(card.decayTotal)>0)details.push('Bisheriger Zerfall: '+fmt(card.decayTotal)+' ATK/DEF verloren');
    if(Number(card.attackFatigue)>0)details.push('Angriffsermüdung: '+fmt(card.attackFatigue)+' ATK verloren');
    if(card.essenceCombat&&(card.essenceCombat.soul||card.essenceCombat.condensed))
      details.push('Seelenenergie in DEF: '+fmt((Number(card.essenceCombat.soul)||0)+(Number(card.essenceCombat.condensed)||0)));
    if(Number.isInteger(card.resonance)&&card.resonance>0)
      details.push('Gespeicherte Resonanz: '+card.resonance+' Ladung(en) · beeinflusst Fusionsqualität, nicht direkt ATK');
    if(card.surgeTurn===g?.turn)details.push('Vorstoß ist in diesem Zug aktiv');
    const deltaAtk=Number(current.atk)-Number(base.atk),deltaDef=Number(current.def)-Number(base.def);
    if(deltaAtk||deltaDef)details.push('Unterschied zur Grundkarte: ATK '+signed(deltaAtk)+' / DEF '+signed(deltaDef));
    if(attack!==Number(current.atk))details.push('Aktuelle Angriffsleistung: '+fmt(attack)+' statt Karten-ATK '+fmt(current.atk));
    return {name:current.name,level:current.level,attack:Number(attack),def:Number(current.def),baseAtk:Number(base.atk),
      baseDef:Number(base.def),details};
  }
  function explainSelected(){
    const panel=document.getElementById('selectedInfo');
    if(!panel||!game||uiMode!=='duel'||game.mode!=='pve'||game.selection?.type!=='field')return;
    const card=game.players[0]?.field?.[game.selection.idx];
    const info=breakdown(game,card);if(!info)return;
    const relevant=(game.log||[]).find(line=>typeof line==='string'&&line.includes(info.name));
    panel.insertAdjacentHTML('beforeend','<details class="ad155-breakdown"><summary>✧ Aktuelle Werte erklären</summary>'+ 
      '<p>Grundkarte: ⚔ '+fmt(info.baseAtk)+' · ◆ '+fmt(info.baseDef)+'<br>Jetzt: ⚔ '+fmt(info.attack)+' · ◆ '+fmt(info.def)+'</p>'+ 
      (info.details.length?'<ul>'+info.details.map(item=>'<li>'+esc(item)+'</li>').join('')+'</ul>':
        '<p>Keine getrennt protokollierten Modifikatoren auf dieser Karte.</p>')+
      (relevant?'<small>Ein zugehöriger Originaleintrag aus dem Duelllog: '+esc(relevant)+'</small>':'')+
      '<small>Nur tatsächlich gespeicherte Beiträge werden bezeichnet. Der Grundkartenvergleich kann zusätzlich Forschung, Fusionsergebnisse und andere bereits verrechnete Effekte enthalten.</small></details>');
  }
  const previousRender=render;
  render=function(){const value=previousRender.apply(this,arguments);
    try{explainSelected();}catch(error){console.warn('Werteherkunft nicht verfügbar:',error);}
    return value;
  };
  window.ArcaneCombatTransparency155=Object.freeze({version:'15.5.0',breakdown});
})();
