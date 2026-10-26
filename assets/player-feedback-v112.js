/* Arcane Duel 11.2: requested economy and deck interaction polish.
 * Game balance and profile schema intentionally unchanged.
 */
'use strict';
(()=>{
 const safe=txt=>escapeHtml(String(txt??''));
 const priorHud=renderHud;
 renderHud=function(){
  priorHud();
  const hud=$('profileHud');
  if(!hud)return;
  const parts=[...hud.children];
  const seal=parts.find(e=>e.textContent?.includes('Booster-Siegel'));
  if(seal){
   seal.classList.add('ad112-currency','ad112-seals');
   // Physically move the existing node, preserving all other HUD event listeners.
   hud.insertBefore(seal,hud.children[2]||null);
  }
  [...hud.children].forEach(e=>{
   if(e.textContent?.includes('Essenz'))e.classList.add('ad112-currency','ad112-essence');
   else if(e.textContent?.includes('Splitter'))e.classList.add('ad112-currency','ad112-shards');
   else if(e.classList?.contains('hud-xp'))e.classList.add('ad112-currency','ad112-experience');
  });
 };
 const oldShop=shopMarkup;
 function polishShop(html){
  const start=html.indexOf('<section class="menu-panel fusion-market">');
  if(start!==-1){
   const end=html.indexOf('</section>',start);
   if(end!==-1){
    let inside=html.slice(start+'<section class="menu-panel fusion-market">'.length,end);
    inside=inside.replace('<h2>✧ Gemischte Fusionsbooster</h2>','<h3>✧ Fusionspacks</h3>');
    let before=html.slice(0,start),after=html.slice(end+'</section>'.length);
    const firstEnd=before.indexOf('</section>');
    if(firstEnd!==-1){
     before=before.slice(0,firstEnd)+'<div class="ad112-fusion-inline">'+inside+'</div>'+before.slice(firstEnd);
     html=before+after;
    }
   }
  }
  // The shop is already open; a second "go to shop" control here is redundant.
  html=html.replace(/<button\b[^>]*>\s*Zum Booster[- ]Shop\s*<\/button>/gi,'');
  if(profile.shardResearch?.offers?.length){
   const first=html.indexOf('◆ Rollenforschung · Auswahl ausstehend');
   const end=first<0?-1:html.indexOf('</section>',first);
   if(end>first){
    let idx=0;
    const research=html.slice(first,end).replace(/<div class="booster-choice">/g,()=>(
     '<div class="booster-choice ad112-research-select" role="button" tabindex="0" data-ad112-research="'+idx+++'" title="Karte anklicken und auswählen">'
    ));
    html=html.slice(0,first)+research+html.slice(end);
   }
  }
  return html;
 }
 shopMarkup=function(){return polishShop(oldShop());};
 function showBoosterCards(cards,title){
  const intro=cards.length+' tatsächlich erhaltene '+(cards.length===1?'Karte':'Karten')+
   ' – sofort deiner Sammlung gutgeschrieben.';
  const art=cards.map((id,i)=>{
   const c=CARDS[id];
   return '<div class="ad112-booster-pull '+(c.fusionOnly?'ad112-booster-fusion':'')+'" style="--pull:'+i+'">'+
    fullCardHtml(profileCard(c))+'<strong>'+safe(c.name)+'</strong>'+
    '<small>Stufe '+c.level+(c.fusionOnly?' · FUSION':' · MONSTER')+'</small></div>';
  }).join('');
  const sparks=Array.from({length:36},(_,i)=>
   '<i class="ad112-reveal-spark" style="--spark:'+i+'"></i>').join('');
  openModal(modalHtml('✦ BOOSTER GEÖFFNET',title,'✧',intro,
   '<div class="ad112-booster-stage"><div class="ad112-reveal-aura" aria-hidden="true"></div>'+
   '<div class="ad112-reveal-sparks" aria-hidden="true">'+sparks+'</div>'+
   '<div class="ad112-reveal-cards">'+art+'</div></div>',
   '<button class="btn primary" id="ad112CloseBooster">KARTEN ÜBERNEHMEN ✓</button>'));
  $('modal').classList.add('ad112-booster-modal');
  $('ad112CloseBooster').onclick=hideModal;
 }
 const oldAction=menuAction;
 menuAction=function(d){
  if(d.action==='booster'||d.action==='fusion-pack'){
   const count=Number(d.count)||1;
   if(![1,3,5,10].includes(count))return oldAction(d);
   const fusion=d.action==='fusion-pack';
   const success=fusion
    ?window.ArcaneFusionPackV109?.buyFusionPack(count)
    :buyBooster(count);
   if(success){
    const ids=[...profile.lastBooster.cards];
    renderMenu();
    // Ordinary boosters are opened by the solo pack bridge as soon as their
    // real rewards are granted. Fusion packs use the same cinema here.
    if(fusion&&window.ArcanePackCinema178?.open){
     window.ArcanePackCinema178.open(ids.map(id=>{
      const c=CARDS[id];
      return {name:c.name,level:c.level,art:typeof dataOf==='function'?dataOf({id}).art:c.art,
       fusion:!!c.fusionOnly,ace:!!c.ace};
     }),{title:'GEMISCHTES FUSIONSPACK',subtitle:'Deine neuen Karten'});
    }else if(!window.ArcanePackCinema178?.open){
     showBoosterCards(ids,fusion?'Gemischtes Fusionspack':'Monster-Booster');
    }
    return;
   }
   return oldAction(d);
  }
  return oldAction(d);
 };
 function chooseResearch(evt){
  const card=evt.target?.closest?.('[data-ad112-research]');
  if(!card||!profile.shardResearch)return false;
  if(evt.target.closest?.('[data-action]'))return false;
  menuAction({action:'shard-choose',index:card.dataset.ad112Research});
  return true;
 }
 document.addEventListener('click',event=>{chooseResearch(event);});
 document.addEventListener('keydown',event=>{
  if(event.key==='Enter'||event.key===' '){
   if(chooseResearch(event))event.preventDefault();
  }
 });
 window.ArcaneFeedback112=Object.freeze({version:'11.2.0',polishShop});
})();
