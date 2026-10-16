/* Arcane Duel 4.0.2 — live frame sync. Visual layer only.
   Repairs cards created during the early game bootstrap, before frame modules load,
   and cards replaced later by menu, duel, collection and inspector rendering.
   No listeners for gameplay actions, no mutation of card data, no storage writes. */
'use strict';
(()=>{
  const api=window.ArcaneCardTemplates;
  const frames=window.ArcaneLevelFrames;
  if(!api||!frames){
    console.warn('Arcane Duel 4.0.2: Kartentemplates nicht geladen');
    return;
  }
  const selector='.hand-card.tc-card,.board-creature.tc-card';
  const romanLevel=/\b(?:lv\.?|level)\s*(\d{1,2})\b/i;
  function levelOf(node){
    let level=Number(node.getAttribute('data-level'));
    if(!Number.isInteger(level)||level<1||level>10){
      const label=node.querySelector('.board-level,.card-level-badge')?.textContent||'';
      const match=romanLevel.exec(label);
      level=match?Number(match[1]):0;
    }
    return level>=1&&level<=10?level:0;
  }
  function familyOf(node){
    if(node.classList.contains('tc-ace'))return 'ace';
    if(node.classList.contains('tc-essence'))return 'essence';
    if(node.classList.contains('tc-fusion'))return 'fusion';
    return 'normal';
  }
  function isSpecialFate(node){
    return node.classList.contains('tc-fate')||
      node.classList.contains('fate-sparkle')||
      [...node.classList].some(name=>name.startsWith('fate-identity-'));
  }
  function sync(node){
    if(!node.matches(selector)||isSpecialFate(node))return false;
    const level=levelOf(node);
    if(!level)return false;
    const family=familyOf(node),tier=api.rank(level);
    if(!api.definitions.some(t=>t.family===family&&t.tier===tier))return false;
    const levelToken=String(level).padStart(2,'0');
    const base='ad-template-'+family+'-0'+tier;
    const trim='ad-level-'+family+'-'+levelToken;
    if(node.classList.contains(base)&&node.classList.contains(trim))return false;
    // If stale classes remained after a card node was recycled, replace only
    // our own visual classes; leave all game state/mode/role classes untouched.
    for(const name of [...node.classList]){
      if(name==='ad-template'||name==='ad-level-frame'||
        name.startsWith('ad-template-family-')||
        name.startsWith('ad-template-tier-')||
        /^ad-template-(normal|fusion|ace|essence)-0[1-5]$/.test(name)||
        /^ad-level-(normal|fusion|ace|essence)-\d\d$/.test(name)){
        node.classList.remove(name);
      }
    }
    node.classList.add('ad-template','ad-template-family-'+family,
      'ad-template-tier-'+tier,base,'ad-level-frame',trim);
    return true;
  }
  function scan(root=document){
    let patched=0;
    if(root.nodeType===1&&root.matches?.(selector))patched+=Number(sync(root));
    root.querySelectorAll?.(selector).forEach(node=>patched+=Number(sync(node)));
    return patched;
  }
  // Use childList only: our class changes must NOT trigger observer recursion.
  // Multiple menu updates within a frame cause just one cheap scan.
  let queued=false;
  function schedule(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;scan();});
  }
  function mount(){
    scan();
    const observer=new MutationObserver(schedule);
    observer.observe(document.body,{childList:true,subtree:true});
    window.ArcaneFrameRuntime=Object.freeze({
      version:'4.0.2',scan,
      audit:()=>{
        const nodes=[...document.querySelectorAll(selector)].filter(x=>!isSpecialFate(x)&&levelOf(x));
        return {visible:nodes.length,unframed:nodes.filter(x=>!x.classList.contains('ad-level-frame')).length};
      }
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
})();
