/* Arcane Duel 15.5: exhaustive 2–5 ORIGINAL material-level multisets,
 * plus conservative two-stage chain examples. The live fusion calculator is
 * reused; nothing in the engine, saved deck or AI is changed.
 */
'use strict';
(()=>{
  const $id=id=>document.getElementById(id);
  const esc=x=>escapeHtml(String(x??''));
  const engine=()=>window.ArcaneFusionRework113;
  function liveDeck(slot,kind){
    if(slot===profile.activeSlot){
      if(kind==='main'&&menuTab==='collection')return deckDraft;
      if(kind==='fusion'&&menuTab==='fusions')return fusionDraft;
      return kind==='main'?profile.activeDeck:profile.fusionDeck;
    }
    return profile.slots?.[slot]?.[kind]||[];
  }
  function grouped(deck){
    const counts=new Map();
    for(const cardId of deck){
      const card=CARDS[cardId];
      if(!card||card.fusionOnly||card.level<1||card.level>10)continue;
      const entry=counts.get(card.level)||[];entry.push(cardId);counts.set(card.level,entry);
    }
    return [...counts].sort((a,b)=>a[0]-b[0]);
  }
  function enumeratePatterns(deck,min=2,max=5){
    const groups=grouped(deck),result=[],levels=[],materials=[];
    function visit(start){
      if(levels.length>=min){result.push({levels:[...levels],materials:[...materials]});}
      if(levels.length>=max)return;
      for(let i=start;i<groups.length;i++){
        const [level,ids]=groups[i];
        const consumed=levels.filter(x=>x===level).length;
        if(consumed>=ids.length)continue;
        levels.push(level);materials.push(ids[consumed]);visit(i);levels.pop();materials.pop();
      }
    }
    visit(0);return result;
  }
  function budget(levels,materials=[]){
    const result=engine()?.calculate?.(levels,null,materials);
    return Number.isInteger(result?.level)?result.level:0;
  }
  function eligibleQuest(levels,target){
    return target?.level===1&&profile.lv1Saga?.perk===true&&levels.length>=3&&levels.length<=5&&levels.every(n=>n===1);
  }
  function rankFor(levels,materials,target){
    if(target?.level===1)return {rank:eligibleQuest(levels,target)?1:0,quest:eligibleQuest(levels,target)};
    if(levels.length>=3&&levels.every(x=>x===1))return {rank:0,quest:false};
    return {rank:budget(levels),quest:false};
  }
  const scoreRoute=(route,target)=>
    (route.rank-target.level)*13+route.materials.length*5+route.levels.reduce((a,b)=>a+b,0)*.1;
  function directRoutes(deck,targetId,limit=6){
    const target=CARDS[targetId];if(!target?.fusionOnly)return [];
    const plans=[];
    for(const item of enumeratePatterns(deck)){
      const {rank,quest}=rankFor(item.levels,[],target);
      if(rank<target.level)continue;
      plans.push({...item,rank,quest,score:scoreRoute({...item,rank},target)});
    }
    return plans.sort((a,b)=>a.score-b.score||a.rank-b.rank).slice(0,limit);
  }
  // Missing levels count only cards that the player already owns. This cannot
  // leak future monsters, hidden recipes, or speculative loot probabilities.
  function ownedPool(){
    const result=[];
    for(const [id,value] of Object.entries(profile.inventory||{})){
      const card=CARDS[Number(id)],n=Math.min(3,Number(value)||0);
      if(!card||!card.rpg||card.fusionOnly||card.enemyOnly||card.fateOnly||n<=0)continue;
      for(let i=0;i<n;i++)result.push(Number(id));
    }
    return result;
  }
  function missingSuggestion(main,targetId){
    const target=CARDS[targetId];if(!target?.fusionOnly)return null;
    const mainCounts=new Map();for(const [lv,ids] of grouped(main))mainCounts.set(lv,ids.length);
    let best=null;
    for(const pattern of enumeratePatterns(ownedPool())){
      const {rank}=rankFor(pattern.levels,[],target);
      if(rank<target.level)continue;
      const used=new Map();let missing=0;
      for(const lv of pattern.levels){const n=(used.get(lv)||0)+1;used.set(lv,n);
        if(n>(mainCounts.get(lv)||0))missing++;}
      if(missing===0)continue;
      const score=missing*100+pattern.levels.length*5+(rank-target.level)*3;
      if(!best||score<best.score)best={...pattern,missing,rank,score};
    }
    return best;
  }
  function remainingDeck(main,used){
    const result=[...main];
    for(const cardId of used){const i=result.indexOf(cardId);if(i>=0)result.splice(i,1);}
    return result;
  }
  function chainRoutes(main,fusion,targetId){
    const target=CARDS[targetId];if(!target?.fusionOnly)return [];
    const results=[];
    const intermediateIds=[...new Set(fusion)].filter(id=>id!==targetId&&CARDS[id]?.fusionOnly&&CARDS[id].level>=2);
    for(const firstId of intermediateIds){
      const first=directRoutes(main,firstId,2);
      for(const route of first){
        const rest=remainingDeck(main,route.materials);
        // One or two supplementary original materials can then be fused with
        // the first fusion. We never promise hidden role-roll bonuses.
        const supports=enumeratePatterns(rest,1,2);
        for(const extra of supports){
          const levels=[CARDS[firstId].level,...extra.levels];
          const materials=[{fusion:true},...extra.materials.map(id=>({id,fusion:false}))];
          const rank=budget(levels,materials);
          if(rank<target.level)continue;
          results.push({firstId,first:route,extra,rank,
            score:route.materials.length*8+extra.materials.length*6+(rank-target.level)*8});
        }
      }
    }
    return results.sort((a,b)=>a.score-b.score).slice(0,3);
  }
  function openPlanner(){
    if(uiMode!=='menu'||game)return;
    openModal('<section class="ad155-fusion"><div class="modal-kicker">DECKLABOR · VOLLSTÄNDIGE MATERIALWEGE</div>'+ 
      '<h2>Strategischer Fusionsplaner</h2><p>Alle vorhandenen Levelkombinationen aus 2 bis 5 Originalmaterialien; '+
      'zusätzlich nachvollziehbare Beispiele für Kettenfusionen. Die tatsächliche Ausführung benötigt gezogene Karten, offene Monsterzonen und eine verfügbare Vorlage.</p>'+ 
      '<div class="ad155-fusion-controls"><label>Deckplatz<select id="ad155-slot"></select></label>'+ 
      '<label>Fusionsziel<select id="ad155-target"></select></label></div>'+ 
      '<div id="ad155-fusion-results" aria-live="polite"></div>'+ 
      '<p class="ad155-fusion-note">Die angezeigte Stufe ist die rechnerische Vorlagenobergrenze. Qualität, Rollenstempel, Würfe, Kettenzustand und Questregeln können im echten Duell weitere Bedingungen setzen. Es werden weder Karten erstellt noch Decks verändert.</p>'+ 
      '<div class="modal-actions"><button class="btn" type="button" id="ad155-close">Schließen</button></div></section>');
    $id('ad155-close').onclick=hideModal;
    $id('ad155-slot').innerHTML=[0,1,2].map(x=>'<option value="'+x+'"'+(x===profile.activeSlot?' selected':'')+'>Deck '+(x+1)+'</option>').join('');
    function changeTarget(){
      const slot=Number($id('ad155-slot').value),targets=[...new Set(liveDeck(slot,'fusion'))]
        .filter(id=>CARDS[id]?.fusionOnly);
      $id('ad155-target').innerHTML=targets.map(id=>'<option value="'+id+'">'+esc(CARDS[id].name)+' · Lv '+CARDS[id].level+'</option>').join('');
      renderResults();
    }
    function renderResults(){
      const slot=Number($id('ad155-slot').value),main=liveDeck(slot,'main'),fusion=liveDeck(slot,'fusion'),
        targetId=Number($id('ad155-target').value),host=$id('ad155-fusion-results');
      if(!fusion.includes(targetId)){host.innerHTML='<p>Dieser Deckplatz enthält noch keine ausgerüstete Fusionsvorlage.</p>';return;}
      const routes=directRoutes(main,targetId,5),chains=chainRoutes(main,fusion,targetId),missing=routes.length?null:missingSuggestion(main,targetId);
      host.innerHTML='<div class="ad155-fusion-summary"><b>'+esc(CARDS[targetId].name)+' · Lv '+CARDS[targetId].level+'</b>'+ 
        '<span>'+main.length+' Materialkarten · '+routes.length+' angezeigte Direktwege</span></div>'+ 
        '<h3>Direkte Fusion</h3>'+(routes.length?'<ol class="ad155-paths">'+routes.map(route=>'<li><b>'+ 
          route.materials.map(id=>esc(CARDS[id].name)).join(' + ')+'</b><small>'+route.levels.map(l=>'Lv '+l).join(' · ')+
          ' → maximal Lv '+route.rank+(route.quest?' · Verbotene Forschung':'')+'</small></li>').join('')+'</ol>':
          '<p>Keine direkte Route mit den aktuell eingetragenen Hauptdeckkarten gefunden.</p>')+
        (missing?'<p class="ad155-material-gap"><b>Deckbau-Hinweis:</b> Eine mögliche Route aus bereits besessenen Karten benötigt '+
          missing.missing+' zusätzliche Materialkopie(n) im Hauptdeck: '+missing.levels.map(x=>'Lv '+x).join(' · ')+'.</p>':'')+
        '<h3>Kettenfusionen</h3>'+(chains.length?'<ol class="ad155-paths">'+chains.map(route=>'<li><b>'+ 
          esc(CARDS[route.firstId].name)+' aus '+route.first.materials.map(id=>esc(CARDS[id].name)).join(' + ')+'</b>'+ 
          '<small>Danach mit '+route.extra.materials.map(id=>esc(CARDS[id].name)).join(' + ')+
          ' → rechnerische Obergrenze Lv '+route.rank+'</small></li>').join('')+'</ol>':
          '<p>Keine konservativ berechenbare Zweistufen-Route mit den aktuell ausgerüsteten Vorlagen gefunden.</p>');
    }
    $id('ad155-slot').onchange=changeTarget;
    $id('ad155-target').onchange=renderResults;
    changeTarget();
  }
  function extend(){
    if(uiMode!=='menu')return;
    const button=$id('ad154-planner-open');
    if(button){button.textContent='⚗ Fusionsplaner 2–5';button.onclick=openPlanner;}
  }
  const previousMenu=renderMenu;
  renderMenu=function(){const result=previousMenu.apply(this,arguments);extend();return result;};
  if(uiMode==='menu')extend();
  window.ArcaneFusionPlanner155=Object.freeze({version:'15.5.0',enumeratePatterns,budget,rankFor,directRoutes,chainRoutes,missingSuggestion,openPlanner});
})();
