/* Arcane Duel v15.5 – complete the element palette on BOARD cards and
 * offer player-controlled visual intensity, without altering card data.
 */
'use strict';
(()=>{
  const KEY='arcane-duel-v155-effect-prefs';
  const allowed=['subtle','normal','epic'];
  const $id=id=>document.getElementById(id);
  function readIntensity(){
    try{const value=JSON.parse(window.localStorage?.getItem(KEY)||'{}').intensity;
      return allowed.includes(value)?value:'normal';}catch(_){return 'normal';}
  }
  function setIntensity(value){
    if(!allowed.includes(value))return false;
    document.body.dataset.ad155Fx=value;
    try{window.localStorage?.setItem(KEY,JSON.stringify({intensity:value}));}catch(_){}
    return true;
  }
  function syncBoard(){
    if(!game||uiMode!=='duel')return;
    const viewer=game.mode==='pve'?0:game.active;
    for(const [rowId,side,player] of [['ownRow','mine',game.players[viewer]],['enemyRow','enemy',game.players[1-viewer]]]){
      const row=$id(rowId);if(!row||!player)continue;
      player.field.forEach((c,i)=>{
        const body=row.querySelector('[data-'+side+'="'+i+'"] .board-creature.tc-card');
        if(!body||!c)return;
        const data=dataOf(c);
        if(data.element)body.dataset.element=String(data.element).toUpperCase();
        body.classList.toggle('ad155-ace-glow',data.ace===true);
        body.classList.toggle('ad155-fusion-glow',c.fusion===true);
      });
    }
  }
  function extendMenu(){
    if(uiMode!=='menu'||menuTab!=='settings')return;
    const host=$id('ad154-save-safety')?.parentElement||$id('menuContent');
    if(!host||$id('ad155-fx-options'))return;
    const panel=document.createElement('section');panel.className='menu-panel';panel.id='ad155-fx-options';
    panel.innerHTML='<h3>✦ Level-Auren & Partikel</h3><p>Effektstufe der Monsterkarten. Die Systemeinstellung für reduzierte Animationen hat immer Vorrang.</p>'+ 
      '<label for="ad155-fx-select">Partikelintensität</label> <select id="ad155-fx-select">'+ 
      '<option value="subtle">Dezent · wenig Bewegung</option>'+ 
      '<option value="normal">Normal · ausgewogen</option>'+ 
      '<option value="epic">Episch · zusätzliche Highlights</option></select>'+ 
      '<small>Keine Wirkung auf Level, Kampfwerte, Kartenstärke oder Spiellogik.</small>';
    host.appendChild(panel);
    const select=$id('ad155-fx-select');select.value=readIntensity();
    select.onchange=()=>setIntensity(select.value);
  }
  function mount(){document.body.dataset.ad155Fx=readIntensity();}
  const oldRender=render;
  render=function(){const value=oldRender.apply(this,arguments);syncBoard();return value;};
  const oldMenu=renderMenu;
  renderMenu=function(){const value=oldMenu.apply(this,arguments);extendMenu();return value;};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
  else mount();
  if(uiMode==='menu')extendMenu();
  window.ArcaneElementAura155=Object.freeze({version:'15.5.0',readIntensity,setIntensity,syncBoard});
})();
