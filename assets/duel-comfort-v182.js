/* v18.2 – A quieter battlefield. All actions delegate to the existing game controls. */
'use strict';
(()=>{
  const $id=id=>document.getElementById(id);
  const workspace=$id('ad182-workspace');
  const openButton=$id('ad182-open-workspace');
  const mainAction=$id('ad182-primary');
  const secondaryAction=$id('ad182-secondary');
  if(!workspace||!openButton||!mainAction||!secondaryAction)return;

  // Only the wide desktop layout starts with the expanded fusion workspace.
  // On smaller screens the compact bar keeps the battlefield unobstructed.
  workspace.open=!!window.matchMedia?.('(min-width: 1181px)')?.matches;

  function syncWorkspaceToggle(){
    openButton.setAttribute('aria-expanded',String(workspace.open));
    openButton.textContent=workspace.open?'✧ Fusionen schließen':'✧ Fusionen ansehen';
  }
  workspace.addEventListener('toggle',syncWorkspaceToggle);
  openButton.addEventListener('click',()=>{
    workspace.open=!workspace.open;
    syncWorkspaceToggle();
  });

  const actionButtons=[mainAction,secondaryAction];
  for(const proxy of actionButtons){
    proxy.addEventListener('click',()=>{
      const original=$id(proxy.dataset.ad182Action);
      if(!original||original.disabled||original.hidden)return;
      original.click();
    });
  }
  function offer(proxy,id,label){
    const original=$id(id);
    if(!original||original.disabled||original.hidden){
      proxy.hidden=true;
      proxy.removeAttribute('data-ad182-action');
      return;
    }
    proxy.hidden=false;
    proxy.disabled=false;
    proxy.dataset.ad182Action=id;
    proxy.textContent=label;
  }
  function hide(proxy){
    proxy.hidden=true;
    proxy.removeAttribute('data-ad182-action');
  }
  function snapshot(g){
    const me=g.players[g.mode==='pve'?0:g.active];
    const canPlay=g.mode==='pvp'||g.active===0;
    const materialCount=canPlay?(g.materials||[]).length:0;
    const selected=g.selection;
    if(g.winner!==null)return {title:'Das Duell ist beendet',hint:'Sieh dir das Ergebnis an.'};
    if(!canPlay)return {title:'Der Gegner ist am Zug',hint:'Deine Hand ist gleich wieder bereit.'};
    if(g.pending)return {title:'Wähle eine Zone auf deinem Feld',
      hint:'Tippe auf eine freie Zone zum Beschwören oder auf ein geeignetes Monster zur Weiterfusion.',
      secondary:'clearBtn',secondaryLabel:'Auswahl zurücknehmen'};
    if(selected?.type==='field'){
      const card=me.field[selected.idx];
      const canDirect=!$id('directBtn')?.disabled;
      return {title:card?'Auf dem Feld: '+dataOf(card).name:'Monster ausgewählt',
        hint:card?.mode==='def'?'Du kannst das Monster drehen, falls es in diesem Zug erlaubt ist.':
          'Wähle ein gegnerisches Monster auf dem Feld, um es anzugreifen.',
        primary:canDirect?'directBtn':'switchBtn',primaryLabel:canDirect?'⚡ Direkt angreifen':'↻ Position wechseln',
        secondary:canDirect?'switchBtn':'clearBtn',secondaryLabel:canDirect?'↻ Position wechseln':'Abwählen'};
    }
    if(g.summoned){
      return {title:'Deine Beschwörung ist geschafft',
        hint:'Du kannst jetzt angreifen, ein Monster drehen oder deinen Zug beenden.'};
    }
    if(materialCount>=2)return {title:materialCount+' Materialien für deine Fusion',
      hint:'Deine Kombination steht. Schau sie dir links an oder bereite die Fusion vor.',
      primary:'fusionBtn',primaryLabel:'✧ Fusionieren',secondary:'clearBtn',secondaryLabel:'Materialien lösen'};
    if(materialCount===1)return {title:'Wähle noch eine Karte für die Fusion',
      hint:'Rechtsklick auf eine weitere Handkarte oder Touch-Fusion aktivieren.',
      secondary:'clearBtn',secondaryLabel:'Material lösen'};
    if(selected?.type==='hand'){
      const card=me.hand.find(c=>c.uid===selected.uid);
      return {title:card?'Bereit: '+dataOf(card).name:'Karte ausgewählt',
        hint:'Beschwöre die Karte oder nutze den Fusionsmodus für mehrere Materialien.',
        primary:'summonBtn',primaryLabel:'✦ Beschwören',secondary:'clearBtn',secondaryLabel:'Abwählen'};
    }
    return {title:'Wähle eine Handkarte',
      hint:'Ein Linksklick wählt sie aus. Für eine Fusion markierst du zwei bis fünf Karten.'};
  }
  function sync(){
    if(uiMode!=='duel'||!game)return;
    const state=snapshot(game);
    $id('ad182-next-title').textContent=state.title;
    $id('ad182-next-hint').textContent=state.hint;
    const count=(game.materials||[]).length;
    $id('ad182-material-count').textContent=game.pending?'Feldzone wählen':
      count?count+' / 5 Materialien':'Karten kombinieren';
    if(state.primary)offer(mainAction,state.primary,state.primaryLabel);
    else hide(mainAction);
    if(state.secondary)offer(secondaryAction,state.secondary,state.secondaryLabel);
    else hide(secondaryAction);
    syncWorkspaceToggle();
  }

  const previousRender=render;
  render=function(...args){
    const result=previousRender.apply(this,args);
    try{sync();}catch(error){console.warn('Duellkomfort:',error);}
    return result;
  };
  window.ArcaneDuelComfort182=Object.freeze({version:'18.2.0',snapshot,sync});
})();
