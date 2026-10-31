/* The same read-only bestiary in solo and online; inventory is supplied by its owner. */
'use strict';
(()=>{
 const esc=window.ArcaneCardView221.safe,fmt=v=>Number(v).toLocaleString('de-AT');
 const labels={predator:'Predator',guardian:'Wächter',soul:'Seelenzehrer',resonator:'Resonator',allrounder:'Allrounder',combatant:'Allrounder'};
 const types={normal:'Normales Monster',fusion:'Fusionsvorlage',ace:'ACE-Karte',essence:'Essenzwesen',special:'Sondermonster'};
 const roleOf=c=>c.role||'combatant';
 const typeOf=c=>c.ace?'ace':c.essenceMonster?'essence':c.fusionOnly?'fusion':c.lv1Exclusive||c.questOnly?'special':'normal';
 const pageSize=12;
 const pickOptions=(values,current,all)=>'<option value="">'+esc(all)+'</option>'+
  values.map(x=>'<option value="'+esc(x[0])+'"'+(current===String(x[0])?' selected':'')+'>'+esc(x[1])+'</option>').join('');
 const cardRole=c=>labels[roleOf(c)]||'Allrounder';

 function detail(c,{inventory={},deck=[],fusions=[]}={}){
  const profile={inventory,activeDeck:deck,fusionDeck:fusions};
  const k=typeOf(c);
  const desc={predator:'Greift besonders gerne an. Gut, um Lücken in der gegnerischen Stellung zu schaffen.',
   guardian:'Hält die Stellung. In DEF schützt er Verbündete und kann nach Angriffen zurückschlagen.',
   soul:'Nutzt Seelenentzug, um gegnerische Monster zu schwächen und die eigene Stellung zu stärken.',
   resonator:'Wird bei Fusionen besonders interessant: Resonanz hilft der Qualität und mit zwei echten Resonator-Fusionen auch dem Level.',
   allrounder:'Flexibler Begleiter, der je nach Kombination verschiedene Fusionen unterstützt.',
   combatant:'Vielseitige Karte, deren Nutzen von deiner Deckstrategie abhängt.'};
  const explanatory=k==='ace'?'Ein besonderes Monster eines Turniergegners. Eine eigene ACE-Karte darf bei den Gegnern nur einmal im Deck liegen.':
   k==='fusion'?'Diese Vorlage muss im ausgerüsteten Fusionsdeck liegen. Deine Materialien und die Rolle bestimmen später ihre tatsächlichen Werte.':
   k==='essence'?'Ein besonderes, dauerhaft gewähltes Essenzwesen. Seine Schule und deine Perks können zusammenarbeiten.':
   k==='special'?'Eine Sonderkarte mit zusätzlichen Bedingungen. Schau dir die zugehörige Quest an.':
   'Eine normale Monsterkarte. Sie kann einzeln kämpfen, für Fusionen eingesetzt oder in der Werkstatt verwendet werden.';
  const count=Number(profile.inventory?.[c.id]||0);
  const inMain=(profile.activeDeck||[]).filter(id=>id===c.id).length;
  const inFusion=(profile.fusionDeck||[]).filter(id=>id===c.id).length;
  return '<div class="ad119-detail">'+
    '<div class="ad119-detail-art"><img src="'+esc(c.art)+'" alt="'+esc(c.name)+'"></div>'+
    '<div><p class="ad119-eyebrow">'+esc(types[k])+' · '+esc(cardRole(c))+'</p><h3>'+esc(c.name)+'</h3>'+
    '<p>Level <strong>'+c.level+'</strong> · Element <strong>'+esc(c.element)+'</strong></p>'+
    '<div class="ad119-detail-stats"><strong>⚔ ATK '+fmt(c.atk)+'</strong><strong>◆ DEF '+fmt(c.def)+'</strong></div>'+
    '<p>'+esc(explanatory)+'</p><p>'+esc(desc[roleOf(c)]||desc.combatant)+'</p>'+
    (c.desc?'<p class="ad119-flavor">'+esc(c.desc)+'</p>':'')+
    '<p class="ad119-stock">In deinem Besitz: <b>'+count+'</b> · Hauptdeck: <b>'+inMain+
    '</b> · Fusionsdeck: <b>'+inFusion+'</b></p></div></div>';
 }
 function mount(root,{cards,known:discovered,inventory={},deck=[],fusions=[],state,onDetail}){
  const profile={inventory,activeDeck:deck,fusionDeck:fusions},catalog=()=>cards;
  const knownIds=new Set(discovered),seen=c=>knownIds.has(c.id),owned=c=>Number(inventory[c.id]||0)>0,detail=onDetail;
  const all=catalog(),known=all.filter(seen),ownedCount=known.filter(owned).length;
  root.classList.add('ad119-lexicon');
  root.innerHTML='<div class="ad119-lexicon-intro"><div><p class="ad119-eyebrow">DEINE ENTDECKUNGEN</p>'+
   '<h2>Monsterlexikon</h2><p>Hier kannst du deine entdeckten Monster in Ruhe kennenlernen – auch die neuen höheren Stufen und Fusionsvorlagen. '+
   'Du siehst nur Namen und Bilder von Karten, die du schon kennst. Geheimnisse bleiben Geheimnisse.</p></div>'+
   '<div class="ad119-count"><strong>'+known.length+'</strong><span>entdeckt von '+all.length+' Kartenvarianten</span></div></div>'+
   '<p class="ad119-lexicon-tip">✧ <b>So liest du eine Karte:</b> ATK hilft beim Angriff, DEF schützt in der Verteidigung. '+
   'Noch wichtiger sind Rolle, Element und die Frage, ob die Karte zu deiner Strategie passt. '+
   'Eine Fusion kann im Duell andere Werte bekommen als ihre Vorlage im Lexikon.</p>'+
   '<div class="ad119-filters">'+
   '<label>Monster suchen<input type="search" id="ad119Search" placeholder="Zum Beispiel Funkenwyrm" value="'+esc(state.query)+'"></label>'+
   '<label>Kartentyp<select id="ad119Type">'+pickOptions(Object.entries(types),state.type,'Alle Arten')+'</select></label>'+
   '<label>Rolle<select id="ad119Role">'+pickOptions(Object.entries(labels).filter(([id])=>id!=='combatant'),state.role,'Alle Rollen')+'</select></label>'+
   '<label>Element<select id="ad119Element">'+pickOptions([...new Set(known.map(c=>c.element))].sort().map(x=>[x,x]),state.element,'Alle Elemente')+'</select></label>'+
   '<label>Level<select id="ad119Level">'+pickOptions(Array.from({length:10},(_,i)=>[i+1,'Level '+(i+1)]),state.level,'Alle Level')+'</select></label>'+
   '<label>Sammlung<select id="ad119Status">'+pickOptions([['known','Entdeckte Karten'],['owned','Nur Karten im Besitz']],state.status,'Alle bekannten')+'</select></label>'+
   '</div><p class="ad119-results" id="ad119Count" role="status"></p><div class="ad119-monster-grid" id="ad119Grid"></div>'+
   '<div class="ad119-pages"><button type="button" class="btn" id="ad119Prev">← Zurück</button><span id="ad119Page"></span>'+
   '<button type="button" class="btn" id="ad119Next">Weiter →</button></div>'+
   '<details class="ad119-lexicon-roles"><summary>Welche Rolle passt zu meinem Deck?</summary>'+
   '<p><b>Predatoren</b> setzen Gegner unter Druck. <b>Wächter</b> schützen und kontern. '+
   '<b>Seelenzehrer</b> sammeln Seelenessenz und schaden durch Seelenbrand. '+
   '<b>Allrounder</b> sind flexible Materialien; <b>Resonatoren</b> sind besonders bei Kettenfusionen interessant. '+
   'Ein starkes Team kann mehrere Rollen verbinden.</p></details>';
  function filtered(){
   const q=state.query.trim().toLocaleLowerCase('de');
   return known.filter(c=>(state.status!=='owned'||owned(c))&&
    (!q||(c.name+' '+c.element+' '+cardRole(c)).toLocaleLowerCase('de').includes(q))&&
    (!state.role||roleOf(c)===state.role)&&(!state.type||typeOf(c)===state.type)&&
    (!state.element||c.element===state.element)&&(!state.level||c.level===Number(state.level)))
    .sort((a,b)=>a.level-b.level||a.name.localeCompare(b.name,'de')||a.id-b.id);
  }
  function draw(){
   const list=filtered(),pages=Math.max(1,Math.ceil(list.length/pageSize));
   state.page=Math.max(0,Math.min(state.page,pages-1));
   const cards=list.slice(state.page*pageSize,(state.page+1)*pageSize);
   root.querySelector('#ad119Count').textContent=list.length+' passende Karten · '+ownedCount+' Kartenvarianten im Besitz · '+(all.length-known.length)+' noch unbekannt';
   root.querySelector('#ad119Grid').innerHTML=cards.map(c=>'<button type="button" class="ad119-card" data-ad119-card="'+c.id+'" aria-label="'+esc(c.name)+' im Lexikon ansehen">'+
    '<span class="ad119-art"><img src="'+esc(c.art)+'" loading="lazy" alt=""></span>'+
    '<strong>'+esc(c.name)+'</strong><small>'+esc(types[typeOf(c)])+' · Lv '+c.level+'</small>'+
    '<span class="ad119-role">'+esc(cardRole(c))+' · '+esc(c.element)+'</span>'+
    '<span class="ad119-stats">⚔ '+fmt(c.atk)+' <span>◆ '+fmt(c.def)+'</span></span>'+
    '<span class="ad119-inventory">'+(owned(c)?'Im Besitz: '+Number(profile.inventory[c.id]||0):'Entdeckt · noch nicht im Besitz')+'</span></button>').join('')||
    '<p class="ad119-empty">Dazu hast du noch keine Karte entdeckt. Probiere eine andere Stufe oder einen anderen Filter – oder entdecke neue Monster im Spiel.</p>';
   root.querySelector('#ad119Page').textContent='Seite '+(state.page+1)+' von '+pages;
   root.querySelector('#ad119Prev').disabled=state.page===0;
   root.querySelector('#ad119Next').disabled=state.page===pages-1;
  }
  const binds={ad119Search:'query',ad119Type:'type',ad119Role:'role',ad119Element:'element',ad119Level:'level',ad119Status:'status'};
  for(const [id,key] of Object.entries(binds))root.querySelector('#'+id).addEventListener(id==='ad119Search'?'input':'change',e=>{
    state[key]=e.target.value;state.page=0;draw();
   });
  root.querySelector('#ad119Prev').onclick=()=>{state.page--;draw();};
  root.querySelector('#ad119Next').onclick=()=>{state.page++;draw();};
  root.querySelector('#ad119Grid').addEventListener('click',e=>{
   const btn=e.target.closest('[data-ad119-card]');if(btn)detail(Number(btn.dataset.ad119Card));
  });
  draw();
 }

 window.ArcaneBestiaryView228=Object.freeze({mount,detail});
})();
