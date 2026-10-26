/* Arcane Duel v18.7 – click-to-select attackers and targets in 2v2.
 * The original dropdowns and their server-confirmed attack button remain
 * authoritative. This module never sends an action or reads hidden cards.
 */
'use strict';
(()=>{
  const sourceKey=source=>(source?.area||'field')+':'+source?.slot;
  const targetKey=target=>target===null?'direct':
    target?.seat+':'+(target?.area||'field')+':'+target?.slot;
  function selectionReady({source,target,targets=[]}={}){
    return !!source&&(targets.length===0||!!target&&target!=='direct');
  }
  function enhancedCell(seat,slot,area='field'){
    const panel=document.querySelector('#duoSeats .seat[data-seat="'+seat+'"]');
    if(!panel)return null;
    return area==='ghost'?panel.querySelector('.duo-ghost-cell[data-slot="'+slot+'"]'):
      panel.querySelector(':scope > .field > .field-cell[data-slot="'+slot+'"]');
  }
  function node(tag,cls,text){
    const element=document.createElement(tag);
    if(cls)element.className=cls;
    if(text!==undefined)element.textContent=text;
    return element;
  }
  function enhance({game,seat,legal,dock,catalog={},busy=false,syncError=''}={}){
    const helper=document.getElementById('ad187-attack-guide');
    if(!helper)return;
    helper.replaceChildren();helper.hidden=true;
    if(!game||game.status!=='active'||game.activeSeat!==seat||busy||syncError||
       !legal?.attackers?.length||!dock)return;
    const sourceSelect=dock.querySelector('[data-ad187-source]');
    const targetSelect=dock.querySelector('[data-ad187-target]');
    const commit=dock.querySelector('[data-ad187-commit]');
    if(!sourceSelect||!targetSelect||!commit)return;
    const originalCommitDisabled=commit.disabled;
    const sources=new Map(legal.attackers.map(item=>[sourceKey(item),item]));
    const targets=new Map((legal.targets||[]).map(item=>[targetKey(item),item]));
    const cardName=card=>catalog?.[card?.id]?.name||card?.name||'Monster';
    const sourceCells=new Map(),targetCells=new Map();
    const chosen={source:null,target:null};
    const description=node('p','ad187-guide-description');
    description.setAttribute('role','status');
    description.setAttribute('aria-live','polite');
    const actions=node('div','ad187-guide-actions');
    const confirm=node('button','ad187-guide-confirm','⚔ Angriff bestätigen');
    confirm.type='button';confirm.disabled=true;
    const cancel=node('button','ad187-guide-cancel','Abbrechen');
    cancel.type='button';
    actions.append(confirm,cancel);helper.append(description,actions);

    function clearPaint(){
      for(const cell of sourceCells.values())cell.classList.remove('ad187-selected-attacker');
      for(const cell of targetCells.values())cell.classList.remove('ad187-targetable','ad187-selected-target');
    }
    function paint(){
      clearPaint();
      if(chosen.source)sourceCells.get(chosen.source)?.classList.add('ad187-selected-attacker');
      if(chosen.source)for(const cell of targetCells.values())cell.classList.add('ad187-targetable');
      if(chosen.target)targetCells.get(chosen.target)?.classList.add('ad187-selected-target');
      const ready=selectionReady({source:chosen.source,target:chosen.target,targets:legal.targets});
      confirm.disabled=!ready||commit.disabled;
      if(!chosen.source){helper.hidden=true;return;}
      helper.hidden=false;
      const attacker=sources.get(chosen.source);
      const sourceName=cardName(attacker?.card);
      if(!legal.targets.length){
        description.textContent='⚔ '+sourceName+' greift direkt die gegnerischen Lebenspunkte an. Bereit?';
      }else if(!chosen.target){
        description.textContent='⚔ '+sourceName+' ist bereit. Wähle jetzt ein gegnerisches Monster als Ziel.';
      }else{
        const target=targets.get(chosen.target);
        description.textContent='⚔ '+sourceName+' greift '+cardName(target?.card)+
          ' an. Bestätige deinen Angriff.';
      }
    }
    function chooseSource(key){
      if(!sources.has(key))return;
      chosen.source=key;sourceSelect.value=key;
      // Changing an attacker must not accidentally keep an old target choice.
      chosen.target=legal.targets.length?null:'direct';
      if(legal.targets.length)targetSelect.selectedIndex=-1;
      commit.disabled=originalCommitDisabled||legal.targets.length>0;
      paint();
      const attackPanel=dock.querySelector('#ad186-attack');
      if(attackPanel&&!attackPanel.open)attackPanel.open=true;
    }
    function chooseTarget(key){
      if(!chosen.source||!targets.has(key))return;
      chosen.target=key;targetSelect.value=key;
      commit.disabled=originalCommitDisabled;paint();
    }
    function activate(cell,fn){
      cell.classList.add('ad187-interactive');cell.tabIndex=0;
      cell.setAttribute('role','button');
      cell.addEventListener('click',fn);
      cell.addEventListener('keydown',event=>{
        if(event.key==='Enter'||event.key===' '){event.preventDefault();fn();}
      });
    }
    for(const [key,item] of sources){
      const cell=enhancedCell(seat,item.slot,item.area);
      if(!cell)continue;
      sourceCells.set(key,cell);cell.classList.add('ad187-valid-attacker');
      cell.setAttribute('aria-label','Angreifer wählen: '+cardName(item.card));
      activate(cell,()=>chooseSource(key));
    }
    for(const [key,item] of targets){
      const cell=enhancedCell(item.seat,item.slot,item.area);
      if(!cell)continue;
      targetCells.set(key,cell);
      cell.setAttribute('aria-label','Angriffsziel wählen: '+cardName(item.card));
      activate(cell,()=>chooseTarget(key));
    }
    sourceSelect.addEventListener('change',()=>chooseSource(sourceSelect.value));
    targetSelect.addEventListener('change',()=>chooseTarget(targetSelect.value));
    confirm.addEventListener('click',()=>{
      if(!confirm.disabled&&!commit.disabled)commit.click();
    });
    cancel.addEventListener('click',()=>{
      chosen.source=null;chosen.target=null;
      sourceSelect.selectedIndex=0;targetSelect.selectedIndex=0;
      commit.disabled=originalCommitDisabled;paint();
      sourceSelect.focus?.();
    });
    // The first attack remains an explicit selection. Merely rendering the
    // arena must never launch or pre-confirm a server action.
  }
  window.ArcaneDuoDirectCards187=Object.freeze({version:'18.7.0',sourceKey,targetKey,selectionReady,enhance});
})();
