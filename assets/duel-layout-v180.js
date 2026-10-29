/* More breathing room during duels. Presentation only; the duel engine stays untouched. */
'use strict';
(()=>{
  const $id=id=>document.getElementById(id);
  const roleOf=c=>c?.roleOverride||CARDS[c?.id]?.role||'combatant';
  const seen=new WeakMap();

  function placeFusionHelp(){
    const source=$id('summonStage'),host=$id('fusionSideHost'),fold=$id('ad180-fusion-details');
    if(!source||!host||!fold)return;
    const nestedOpen=host.querySelector('.ad156-suggestions')?.open;
    // Long, optional explanations live in the unused left column, not above the hand.
    const moved=[source.querySelector('#ad156-fusion-coach'),source.querySelector('.ad120-fusion-preview'),...source.querySelectorAll('.evo-fusion-preview')].filter(Boolean);
    const detail=source.querySelector('#ad151-fusion-explanation');
    if(detail&&!moved.some(parent=>parent.contains(detail)))moved.push(detail);
    host.replaceChildren(...moved);
    const nested=host.querySelector('.ad156-suggestions');
    if(nested&&typeof nestedOpen==='boolean')nested.open=nestedOpen;
    // Keep the player's chosen fold state. Changing materials must not
    // expand the advice panel and shove other battlefield controls aside.
  }

  function celebratePredators(){
    if(uiMode!=='duel'||!game?.players?.[0])return;
    const mine=game.players[0].field.filter(Boolean);
    const now=new Set(mine.map(card=>card.uid));
    const former=seen.get(game);
    seen.set(game,now);
    if(!former||game.winner!==null||game.mode!=='pve')return;
    const count=mine.filter(card=>roleOf(card)==='predator').length;
    if(!count)return;
    for(const card of mine){
      if(former.has(card.uid)||roleOf(card)!=='predator')continue;
      const slot=game.players[0].field.indexOf(card);
      const element=document.querySelector('#ownRow [data-mine="'+slot+'"]');
      if(!element)continue;
      const badge=document.createElement('span');badge.className='ad180-predator-callout';
      badge.textContent='✦ Predator-Schwarm · +'+Math.min(5,count)*2+' % Angriff';
      badge.title='Für jeden eigenen Predator auf dem Feld steigt der Angriffsschaden deiner Predatoren um 2 %.';
      element.appendChild(badge);
      window.setTimeout(()=>badge.remove(),1600);
    }
  }

  const oldRender=render;
  render=function(...args){
    const result=oldRender.apply(this,args);
    try{placeFusionHelp();celebratePredators();}catch(error){console.warn('Duellansicht:',error);}
    return result;
  };

  window.ArcaneDuelLayout180=Object.freeze({version:'18.0.0',placeFusionHelp});
})();
