/* Arcane Duel v15.3: mobile-only shortcuts to the existing duel buttons.
 * No new duel actions, state transitions, or AI behavior are introduced.
 */
'use strict';
(()=>{
  const controls=[
    ['summonBtn','Beschwören','✦ Beschwören'],
    ['fusionBtn','Fusionieren','✧ Fusion'],
    ['switchBtn','Position wechseln','↻ Position'],
    ['endTurnBtn','Zug beenden','→ Zugende']
  ];
  const $id=id=>document.getElementById(id);
  function ensure(){
    const tray=$id('hand')?.closest?.('.cardtray');
    if(!tray)return null;
    let bar=$id('ad153-mobile-actions');
    if(bar)return bar;
    bar=document.createElement('nav');
    bar.id='ad153-mobile-actions';
    bar.className='ad153-mobile-actions';
    bar.setAttribute('aria-label','Schnelle Duellaktionen');
    for(const [id,label,caption] of controls){
      const button=document.createElement('button');
      button.type='button';
      button.className='btn';
      button.textContent=caption;
      button.dataset.arcaneAction=id;
      button.setAttribute('aria-label',label);
      button.addEventListener('click',()=>{
        const original=$id(id);
        if(original&&!original.disabled&&!original.hidden)original.click();
      });
      bar.appendChild(button);
    }
    tray.insertAdjacentElement('afterend',bar);
    return bar;
  }
  function sync(){
    if(uiMode!=='duel')return;
    const bar=ensure();
    if(!bar)return;
    for(const [id] of controls){
      const original=$id(id),button=bar.querySelector('[data-arcane-action="'+id+'"]');
      if(!button)continue;
      button.disabled=!original||original.disabled||original.hidden;
      button.setAttribute('aria-disabled',String(button.disabled));
    }
  }
  const priorRender=render;
  render=function(){const result=priorRender.apply(this,arguments);sync();return result;};
  window.ArcaneMobileQuality153=Object.freeze({version:'15.3.0',sync,actions:controls.map(x=>x[0])});
})();
