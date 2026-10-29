/* Arcane Duel 15.4: cosmetic level shimmer. No progression or combat mutations. */
'use strict';
(()=>{
  const SELECTOR='.hand-card.tc-card,.board-creature.tc-card';
  const RANGE=/\b(?:lv\.?|level)\s*(\d{1,2})\b/i;
  const tierOf=level=>!Number.isInteger(level)||level<1||level>10?0:level>=9?4:level>=7?3:level>=4?2:1;
  function levelOf(node){
    let level=Number(node.getAttribute('data-level'));
    if(!Number.isInteger(level)||level<1||level>10){
      const match=RANGE.exec(node.querySelector('.board-level,.card-level-badge')?.textContent||'');
      level=match?Number(match[1]):0;
    }
    return Number.isInteger(level)&&level>=1&&level<=10?level:0;
  }
  function fate(node){return node.matches('.tc-fate,.fate-sparkle,[class*="fate-identity-"]');}
  function apply(node){
    if(!node.matches(SELECTOR))return;
    const level=fate(node)?0:levelOf(node),tier=tierOf(level),prior=Number(node.dataset.ad154Tier)||0;
    if(tier===prior&&(!tier||node.querySelector(':scope > .ad154-aura')))return;
    node.querySelector(':scope > .ad154-aura')?.remove();
    for(let n=1;n<=4;n++)node.classList.remove('ad154-tier-'+n);
    if(tier){
      node.classList.add('ad154-tier-'+tier);
      const aura=document.createElement('span');aura.className='ad154-aura';aura.setAttribute('aria-hidden','true');
      aura.innerHTML='<span class="ad154-motes"></span><span class="ad154-runes"></span>';
      node.appendChild(aura);
    }
    node.dataset.ad154Tier=String(tier);
  }
  function scan(root=document){
    if(root.nodeType===1&&root.matches?.(SELECTOR))apply(root);
    root.querySelectorAll?.(SELECTOR).forEach(apply);
  }
  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;scan();});
  }
  function mount(){
    scan();
    new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
  window.ArcaneLevelAura154=Object.freeze({tierOf,levelOf,scan,version:'15.4.0'});
})();
