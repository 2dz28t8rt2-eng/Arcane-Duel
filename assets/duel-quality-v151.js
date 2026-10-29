/* Arcane Duel · Duel Quality 15.1
 * Read-only combat and fusion explanations. Never executes an attack, consumes
 * a template, changes an opponent decision, or changes game/profile balances.
 */
'use strict';
(()=>{
  const $id=id=>document.getElementById(id);
  const esc=x=>escapeHtml(String(x??''));
  const whole=x=>Math.max(0,Math.floor(Number(x)||0));
  const pretty=x=>whole(x).toLocaleString('de-AT');
  const SETTINGS_KEY='arcane-duel-v151-display';
  let openedFusion=false;
  const roleOf=c=>c?.roleOverride||CARDS[c?.id]?.role||'combatant';
  const fromShield=(amount,shield,life)=>Math.min(whole(life),Math.max(0,whole(amount)-whole(shield)));
  function setting(){try{return JSON.parse(window.localStorage?.getItem(SETTINGS_KEY)||'{}')?.forecast===true;}catch(_){return false;}}
  function setSetting(value){try{window.localStorage?.setItem(SETTINGS_KEY,JSON.stringify({forecast:value===true}));}catch(_){}}

  // A side-effect-free forecast of the current PUBLIC battle state. The game's
  // effectiveAttack is a pure read of current combat modifiers; never call attack
  // on a clone since its hooks can update player profile and encounter state.
  function combatForecast(g,attackerIndex,targetIndex){
    if(!g||g.mode!=='pve'||g.active!==0||g.winner!==null||g.pending)
      return {allowed:false,reason:'Derzeit keine reguläre eigene Angriffsaktion.'};
    const mine=g.players?.[0],enemy=g.players?.[1],a=mine?.field?.[attackerIndex];
    if(!Number.isInteger(attackerIndex)||!a||!canAttack(g,a))
      return {allowed:false,reason:'Diese Karte kann momentan nicht angreifen.'};
    if(targetIndex!==null&&(!Number.isInteger(targetIndex)||!enemy?.field?.[targetIndex]))
      return {allowed:false,reason:'Kein gültiges gegnerisches Ziel.'};
    if(targetIndex===null&&enemy.field.some(Boolean))
      return {allowed:false,reason:'Direkter Angriff bei besetztem gegnerischen Feld nicht erlaubt.'};
    const d=targetIndex===null?null:enemy.field[targetIndex];
    const aData=dataOf(a),dData=d?dataOf(d):null;
    const atk=whole(effectiveAttack(g,a,d));
    const outcome={allowed:true,attackerName:aData.name,targetName:dData?.name||'Gegnerische Lebenspunkte',
      attack:atk,ownLoss:0,enemyLoss:0,destroyAttacker:false,destroyDefender:false,
      targetMode:d?.mode||'direct',defenseDamage:0,remainingDefense:null,counter:0,burn:0,
      prevented:0,notes:[]};
    if(!d){
      outcome.enemyLoss=fromShield(atk,enemy.shield,enemy.lp);
      if(enemy.shield)outcome.notes.push('Gegnerischer LP-Schild wird zuerst verbraucht.');
      return outcome;
    }
    if(d.mode==='atk'){
      const resistance=whole(dData.atk);
      outcome.destroyDefender=atk>=resistance;
      outcome.destroyAttacker=atk<=resistance;
      if(atk>resistance)outcome.enemyLoss=fromShield(atk-resistance,enemy.shield,enemy.lp);
      if(atk<resistance)outcome.ownLoss=fromShield(resistance-atk,mine.shield,mine.lp);
      if(atk===resistance)outcome.notes.push('Gleichstand: beide Monster werden zerstört.');
      return outcome;
    }
    if(!g.essenceRules){
      const resistance=whole(dData.def);
      outcome.destroyDefender=atk>resistance;
      if(atk<resistance)outcome.ownLoss=fromShield(resistance-atk,mine.shield,mine.lp);
      if(atk===resistance)outcome.notes.push('Gleichstand gegen DEF: kein Monster wird zerstört.');
      return outcome;
    }
    // Essence defense uses damage to DEF reserves, NOT the classic ATK > DEF
    // one-hit rule. Guardian/Soul mitigation and Predator piercing are live.
    const defenderRole=roleOf(d),attackerRole=roleOf(a);
    const armored=defenderRole==='guardian'||defenderRole==='soul';
    const pierce=attackerRole==='predator'?
      (g.strategicTraining?.symmetricSides?Math.max(0,Number(g.strategicTraining.predatorArmorPierce)||0):.10):0;
    const linked=window.ArcaneEssenceCombat?.soulBonds?.(g,1-g.active)?.some(x=>x.guardian===d||x.soul===d);
    const mitigation=armored?Math.max(0,(linked?.35:.20)-pierce):0;
    const strength=Math.floor(atk*(1-mitigation));
    const shield=d.essenceCombat||{};
    const immune=whole(shield.guardLeft)>0;
    const used=immune?0:strength;
    const condensed=Math.min(whole(shield.condensed),used);
    const souls=Math.min(whole(shield.soul),used-condensed);
    const after=used-condensed-souls;
    const defenseBefore=whole(d.card?.def??dData.def);
    outcome.prevented=atk-strength;
    outcome.defenseDamage=Math.min(defenseBefore,after);
    outcome.remainingDefense=Math.max(0,defenseBefore-outcome.defenseDamage);
    outcome.destroyDefender=outcome.remainingDefense===0;
    if(immune){outcome.destroyDefender=false;outcome.notes.push('Aktive Schutzimmunität: kein DEF-Schaden.');}
    if(mitigation)outcome.notes.push('Rüstung '+Math.round(mitigation*100)+' %'+(pierce?' (Predator-Durchdringung berücksichtigt)':''));
    if(condensed)outcome.notes.push(pretty(condensed)+' Schaden von Verdichtung absorbiert.');
    if(souls)outcome.notes.push(pretty(souls)+' durch Seelenenergie aufgefangen.');
    const soulAvailable=!g.strategicTraining||g.turn>=g.strategicTraining.soulUnlockTurn;
    outcome.burn=soulAvailable?Math.floor(souls*.5):0;
    outcome.counter=armored&&!immune&&!outcome.destroyDefender?Math.floor(whole(dData.atk)*.35):0;
    outcome.ownLoss=fromShield(outcome.burn+outcome.counter,mine.shield,mine.lp);
    if(outcome.counter)outcome.notes.push('Wächter/Seelenzehrer: 35 % ATK als Gegenschlag.');
    if(outcome.burn)outcome.notes.push('Seelenverlust verursacht zusätzlich LP-Burn.');
    // A defender-only late perk can rescue a player guardian at 1 DEF. The
    // opponent is owner 1 in a human PvE attack, so it cannot trigger here.
    return outcome;
  }
  function forecastLine(f){
    if(!f.allowed)return '<small>'+esc(f.reason)+'</small>';
    const outcome=f.targetMode==='direct'?'Direktschaden: '+pretty(f.enemyLoss)+' LP':
      f.targetMode==='def'?(f.destroyDefender?'DEF-Ziel voraussichtlich zerstört':'DEF-Restwert: '+pretty(f.remainingDefense)):
        f.destroyAttacker&&f.destroyDefender?'Beide Monster zerstört':
          f.destroyDefender?'Gegnerisches Monster zerstört':f.destroyAttacker?'Eigenes Monster zerstört':'Kein Monster zerstört';
    return '<strong>'+esc(f.targetName)+'</strong><span>'+esc(outcome)+'</span>'+ 
      '<small>Effektive ATK '+pretty(f.attack)+
      (f.defenseDamage?' · DEF-Schaden '+pretty(f.defenseDamage):'')+
      (f.ownLoss?' · eigener LP-Verlust '+pretty(f.ownLoss):'')+
      (f.enemyLoss?' · gegnerischer LP-Verlust '+pretty(f.enemyLoss):'')+
      (f.counter?' · Gegenschlag '+pretty(f.counter):'')+
      (f.burn?' · Seelen-Burn '+pretty(f.burn):'')+'</small>'+ 
      (f.notes.length?'<small class="ad151-notes">'+f.notes.map(esc).join(' · ')+'</small>':'');
  }
  function drawForecast(){
    const existing=$id('ad151-forecast');
    if(uiMode!=='duel'||!game||game.mode!=='pve'||!$id('turnAdvice')){existing?.remove();return;}
    const parent=$id('turnAdvice').parentElement;
    if(!parent)return;
    let panel=existing;
    if(!panel){panel=document.createElement('section');panel.id='ad151-forecast';parent.appendChild(panel);}
    const enabled=setting();
    let content='';
    if(enabled){
      if(game.active!==0)content='<p>Die Prognose erscheint bei deinem nächsten eigenen Zug.</p>';
      else if(game.selection?.type!=='field')content='<p>Wähle eines deiner ATK-Monster auf dem Feld aus, um Ziele zu vergleichen.</p>';
      else{
        const ai=game.selection.idx,targets=game.players[1].field;
        const indices=targets.some(Boolean)?targets.map((c,i)=>c?i:-1).filter(i=>i>=0):[null];
        content='<div class="ad151-forecast-targets">'+indices.map(di=>
          '<article>'+forecastLine(combatForecast(game,ai,di))+'</article>').join('')+'</div>';
      }
    }
    const markup='<div class="ad151-tools-head"><button type="button" id="ad151-forecast-switch" aria-pressed="'+enabled+'">'+
      '✦ Kampfprognose '+(enabled?'AN':'AUS')+'</button>'+ 
      '<small>Optional · reale sichtbare Feldwerte</small></div>'+content+
      (enabled?'<small class="ad151-disclaimer">Prognose, keine Kampfgarantie: verdeckte Effekte und zukünftige Aktionen werden nicht vorausgesagt.</small>':'');
    // The core renders frequently during animations. Recreating the same DOM
    // on every frame discards focus/scroll and needlessly reflows the sidebar.
    if(panel.__arcaneLastMarkup===markup&&panel.querySelector('#ad151-forecast-switch'))return;
    panel.__arcaneLastMarkup=markup;
    panel.innerHTML=markup;
    $id('ad151-forecast-switch').onclick=()=>{setSetting(!setting());drawForecast();};
  }

  function fusionExplanation(g,materials){
    if(!g||g.mode!=='pve'||!Array.isArray(materials)||materials.length<2||materials.length>5)return null;
    const levels=materials.map(c=>whole(dataOf(c).level));
    const elements=materials.map(c=>dataOf(c).element);
    const math=window.ArcaneFusionMath,logic=window.ArcaneFusionRework113;
    if(!math?.pattern||!logic?.calculate)return null;
    const pattern=math.pattern(levels,elements),rule=logic.calculate(levels,g,materials);
    const cap=fusionBudget(levels,g,materials);
    const result={levels,pattern:pattern.name,rollBonus:pattern.rollBonus,levelCap:cap,
      core:rule.core,bonus:rule.bonus||0,resonatorBonus:rule.resonatorBonus||0,
      coreName:dataOf(materials[rule.coreIndex]||materials[0]).name,
      coreIsFusion:rule.coreIsFusion===true,gain:Number(rule.gain)||0,
      weightedPenalty:Math.round((Number(rule.penalty)||0)*100),
      closedStreet:rule.street===true,partialStreet:/Straße/.test(pattern.name)&&rule.street!==true,
      penalty:Number(rule.penalty)||0,prior:null};
    if(materials.length>2){
      const before=materials.slice(0,-1),beforeLevels=levels.slice(0,-1);
      result.prior={pattern:math.pattern(beforeLevels,elements.slice(0,-1)).name,
        levelCap:fusionBudget(beforeLevels,g,before)};
    }
    return result;
  }
  function drawFusionDetails(){
    if(uiMode!=='duel'||!game||game.mode!=='pve'||game.active!==0||game.pending)return;
    const p=game.players[0];
    const cards=(game.materials||[]).map(uid=>p.hand.find(c=>c.uid===uid)).filter(Boolean);
    if(cards.length<2)return;
    const out=fusionExplanation(game,cards),stage=$id('summonStage');
    if(!out||!stage)return;
    const host=stage.querySelector('.ad120-fusion-preview')||stage;
    if(host.querySelector('#ad151-fusion-explanation'))return;
    const div=document.createElement('details');div.id='ad151-fusion-explanation';div.open=openedFusion;
    const delta=out.prior?out.levelCap-out.prior.levelCap:null;
    div.innerHTML='<summary>Warum Lv '+out.levelCap+'? · '+esc(out.pattern)+'</summary>'+ 
      '<div class="ad151-fusion-content"><p>Materialstufen: <b>'+esc(out.levels.join(' + '))+'</b> · Kernstufe '+pretty(out.core)+
      ' · höchstens Lv '+pretty(out.levelCap)+' als verfügbare Fusionsstufe.</p>'+ 
      '<p>Kernmaterial: <b>'+esc(out.coreName)+'</b> (Lv '+pretty(out.core)+')'+
      (out.coreIsFusion?' · bereits fusioniertes Monster':'')+'. Nächstes passendes Material: '+
      (out.gain>=0?'+':'')+out.gain+' Beitrag zum Kernrang.'+
      (out.bonus?' · '+out.bonus+' zusätzlicher Levelbonus für passende Materialien.':'')+'</p>'+
      '<p>Spezialkombination: <b>'+esc(out.pattern)+'</b> · zusätzliche Qualitätswürfe +'+pretty(out.rollBonus)+'.</p>'+
      (out.partialStreet?'<p class="ad151-fusion-note">Eine zusammenhängende Teilstraße bringt den Spezialbonus. Für die Fusionsstufe zählt sie nicht als vollständige Straße, wenn zusätzliche gleiche Stufen dabei sind.</p>':'')+
      (out.resonatorBonus?'<p class="ad151-fusion-note">Einmaliger Resonator-Kettenbonus: +1 Level.</p>':'')+
      (out.penalty?'<p>Große Materialabstände: bis zu '+out.weightedPenalty+' % rechnerischer Qualitätsabzug vor den Werten.</p>':'')+
      (out.prior?'<p>Letztes Material hinzugefügt: zuvor <b>'+esc(out.prior.pattern)+'</b> und Lv '+pretty(out.prior.levelCap)+
        ', jetzt Lv '+pretty(out.levelCap)+(delta===0?' (unverändert)':delta>0?' (+'+delta+')':' ('+delta+')')+'.</p>':'')+
      '<small>Alle Materialien zählen. Der angezeigte Höchstrang erzeugt keine Vorlage, die nicht im Fusionsdeck ist. Stärke und Rollenboni werden separat gewürfelt.</small></div>';
    div.addEventListener?.('toggle',()=>{openedFusion=div.open;});
    host.appendChild(div);
  }

  const beforeRender=render;
  render=function(){const result=beforeRender.apply(this,arguments);drawForecast();drawFusionDetails();return result;};
  window.ArcaneDuelQuality151=Object.freeze({version:'15.1.0',combatForecast,fusionExplanation,fromShield});
})();
