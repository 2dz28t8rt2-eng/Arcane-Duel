/* Arcane Duel 2v2 v21.4 – fusion handbook and read-only contextual explanation.
 * Uses ArcaneDuoRules server-equivalent preview. Never calculates a separate
 * authoritative result and never sends/changes battle actions or saves.
 */
'use strict';
(()=>{
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const fmt=n=>Number(n||0).toLocaleString('de-AT',{maximumFractionDigits:1});
 const pct=n=>fmt(n)+' %';
 const roles={predator:'Predator',guardian:'Wächter',soul:'Seelenzehrer',resonator:'Resonator',combatant:'Allrounder'};
 const chain=levels=>'<span class="ad214-chain">'+levels.map(n=>'<span class="ad214-card">Lv '+n+'</span>').join('<b>+</b>')+'</span>';
 const sub=(id,title,body)=>'<details class="ad214-sub" id="ad214-'+id+'"><summary>'+title+'</summary><div class="ad214-body">'+body+'</div></details>';
 function bookHtml(){
  return '<div class="ad214-lead"><strong>Fusionen · Gemeinsam lernen, selbst entscheiden</strong>'+
   '<p>Die folgenden Regeln gelten für das <b>2v2-Kampagnenspiel</b>. Jeder verwendet seine eigenen Hand- und Geistermaterialien; auf dem Feld dürfen auch die Monster des menschlichen Partners helfen und seine eigenen noch freien Fusionsvorlagen. Das Spiel und die KI prüfen die tatsächliche Fusion auf dem Server.</p></div>'+
   sub('start','1 · Was ist eine Fusion und wie starte ich sie?',
    '<p>Wähle <b>zwei bis fünf</b> Monster als Materialien – aus deiner Hand, deinem Feld oder dem Feld deines menschlichen Partners. Im Kampfbereich „Fusion“ kannst du Hand- und Feldkarten markieren, eine <b>Kernkarte</b>, eine <b>Fusionsvorlage</b> und eine <b>freie Ergebniszone</b> auswählen. Die Materialien werden verbraucht. Jede Fusion benötigt eine noch freie Vorlage aus deinem eigenen Fusionsdeck.</p>'+
    '<p>Eine Fusion ist ein neues Monster für das laufende Duell. Deine gesammelten Karten verschwinden dabei nicht dauerhaft. Dein Duo-Spielstand und dein Solo-Spielstand sind weiterhin getrennt.</p>'+
    '<p><b>Geschützte Karten:</b> ACE-Monster, Schicksalsmonster und Predator-Tokens dürfen niemals als Fusionsmaterial verwendet werden. Besondere Level-1-Forschung kann eigene Geistermaterialien und Rezepte freischalten.</p>'+
    '<div class="ad214-diagram">'+chain([3,3])+'<span>↓ zwei Materialien + freie Vorlage</span><strong>Ein neues Monster, bis Level 4</strong></div>')+
   sub('level','2 · So entsteht das Fusionslevel',
    '<p><b>Kernkarte:</b> Standardmäßig wird die höchste Materialstufe verwendet. Du kannst sonst selbst die Kernkarte wählen. Bei einer <b>vollständigen Straße</b> bestimmt immer die höchste Karte den Kern.</p>'+
    '<p><b>Ausgangsstufe:</b> Ein normaler Kern ab Level 3 startet bei Kernlevel minus 1. Das passendste zweite Material kann den Rang erhöhen: gleiches oder benachbartes Level ergibt bei hohem Kern bis zu +3. Größere Abstände sind weniger wertvoll. Bei Level 1–2 gelten Sondergrenzen.</p>'+
    '<p><b>Weitere Materialien:</b> Bei mindestens drei Karten kann einmalig +1 Level entstehen, wenn der Kern mindestens Level 3 ist und alle anderen Karten maximal zwei Level davon entfernt liegen. Eine vollständige Fünferstraße bekommt bei ausreichend hohem Kern ebenfalls diesen Bonus.</p>'+
    '<p><b>Obergrenzen:</b> höchstens Level 10, normalerweise nicht mehr als die Summe der Materiallevel; zwei echte Resonator-Fusionen können in einer Kette einmalig +1 Level ermöglichen. Nur vorhandene freie Vorlagen darfst du wirklich auswählen.</p>'+
    '<div class="ad214-diagram">'+chain([6,5])+'<span>↓ Kern 6 → Grundstufe 5 → passendes Material +3</span><strong>Materialbudget: bis Lv 8</strong></div>')+
   sub('examples','3 · Levelbeispiele für Einsteiger',
    '<div class="ad214-scroll"><table><thead><tr><th>Materialien</th><th>Maximal</th><th>Warum?</th></tr></thead><tbody>'+
    '<tr><td>1 + 1</td><td>Lv 2</td><td>Startregel bei genau zwei Lv-1-Karten</td></tr>'+
    '<tr><td>2 + 2</td><td>Lv 2</td><td>Frühe Levelbegrenzung</td></tr>'+
    '<tr><td>3 + 3</td><td>Lv 4</td><td>Passendes Paar</td></tr>'+
    '<tr><td>3 + 3 + 3</td><td>Lv 5</td><td>Dritte passende Karte</td></tr>'+
    '<tr><td>6 + 5</td><td>Lv 8</td><td>Guter Abstand</td></tr>'+
    '<tr><td>6 + 5 + 5</td><td>Lv 9</td><td>Zusätzlicher Rangbonus</td></tr>'+
    '<tr><td>6 + 1</td><td>Lv 5</td><td>Großer Abstand</td></tr>'+
    '<tr><td>3 + 4 + 5</td><td>Lv 7</td><td>Kleine Straße</td></tr>'+
    '<tr><td>2 + 3 + 4 + 5 + 6</td><td>Lv 9</td><td>Gigantische Straße</td></tr>'+
    '</tbody></table></div><p><b>Achtung:</b> Die Beispiele meinen gewöhnliche Monster und maximal mögliche Level. Besondere Level-1-Fusionsvorlagen können abweichende Ziellevel haben.</p>')+
   sub('poker','4 · Pokerkombinationen und Qualität',
    '<p>Gleiche oder aufeinanderfolgende Level belohnen dich mit <b>Fusionsqualität</b> und teilweise zusätzlichen Wertewürfen. Die Grundqualität beträgt 100 %, ab der dritten Materialkarte gibt es je +4,5 Prozentpunkte. Unterschiedliche Level können Qualität kosten, aber eine vollständige Straße ist gegen diesen Abstandsabzug geschützt.</p>'+
    '<div class="ad214-scroll"><table><thead><tr><th>Rezept</th><th>Beispiel</th><th>Qualitätsbonus</th><th>Zusatzwürfe</th></tr></thead><tbody>'+
    '<tr><td>Paar</td><td>3 + 3</td><td>+4 %</td><td>0</td></tr><tr><td>Zwei Paare</td><td>3 + 3 + 4 + 4</td><td>+12 %</td><td>1</td></tr>'+
    '<tr><td>Drilling</td><td>3 + 3 + 3</td><td>+8 %</td><td>1</td></tr><tr><td>Kleine Straße</td><td>3 + 4 + 5</td><td>+20 %</td><td>1</td></tr>'+
    '<tr><td>Vierling</td><td>3 + 3 + 3 + 3</td><td>+13 %</td><td>2</td></tr><tr><td>Full House</td><td>3 + 3 + 3 + 4 + 4</td><td>+14 %</td><td>2</td></tr>'+
    '<tr><td>Große Straße</td><td>3 + 4 + 5 + 6</td><td>+30 %</td><td>3</td></tr>'+
    '<tr><td>Fünfling</td><td>3 + 3 + 3 + 3 + 3</td><td>+18 %</td><td>3</td></tr>'+
    '<tr><td>Gigantische Straße</td><td>2 + 3 + 4 + 5 + 6</td><td>+36 %</td><td>4</td></tr>'+
    '</tbody></table></div>'+
    '<p>Materialien der Stufen 1 und 2 können zusätzliche kleine Kombinationsboni liefern. <b>Elementharmonie</b> mit gleichen Elementen gibt weitere +2,5 Prozentpunkte. Eine vollständig gleichartige Spezialistenrolle gibt +5 Prozentpunkte Qualität. Upgrades und Resonanz können ergänzen.</p>'+
    '<div class="ad214-diagram">'+chain([3,4,5])+'<span>↓ 100 % + 4,5 % (dritte Karte) + 20 % (Straße)</span><strong>124,5 % Basisqualität ohne Zusatzboni</strong></div>')+
   sub('stats','5 · ATK und DEF verständlich erklärt',
    '<p><b>Schritt 1:</b> Das Spiel nimmt die ATK- und DEF-Referenz der <em>gewählten Fusionsvorlage</em> auf ihrem Ziellevel. Diese orientiert sich am normalen Monsterpotenzial, nicht einfach an der Summe der Materialwerte.</p>'+
    '<p><b>Schritt 2:</b> Qualitätsfaktor und Rollenprägung werden angewendet. <b>Predator</b>: ATK × 1,20 / DEF × 0,75; <b>Wächter oder Seelenzehrer</b>: ATK × 0,75 / DEF × 1,35; <b>Resonator</b>: beide × 1,00.</p>'+
    '<p><b>Schritt 3:</b> ATK und DEF erhalten jeweils einen eigenen Zufallswert zwischen 88 und 112 Prozent. Das Spiel wiederholt dies abhängig von deinem Rezept bis zu siebenmal und nimmt <b>das gemeinsame Wertepaar mit der höchsten ATK+DEF-Summe</b>. Es mischt nicht die besten Einzelwerte unterschiedlicher Würfe.</p>'+
    '<p><b>Schritt 4:</b> Weitere Materialblöcke, Verstärkungen und gegebenenfalls <b>Seelenerbe</b> aus Feldmaterialien kommen hinzu. Die Vorschau nennt eine <em>Spanne</em>, nicht die später garantierten Werte.</p>'+
    '<div class="ad214-diagram"><strong>Rein rechnerisches Beispiel</strong><span>Referenz 1.000 ATK / 1.000 DEF · Qualität 124,5 % · Predator</span><span>↓ ungefähr 1.494 ATK / 934 DEF vor dem Würfeln</span><strong>88–112 %-Würfe → bestes Wertepaar → Materialboni</strong></div>')+
   sub('role','6 · Kampfrollen, Resonanz und Fusionsketten',
    '<p>Die Mehrheit deiner <b>Spezialistenmaterialien</b> legt die Rolle fest. Predatoren bevorzugen ATK; Wächter und Seelenzehrer bilden die DEF-Seite. Ohne eindeutige Mehrheit wird die Fusion ein neutraler Resonator. Wächterfusionen mit mindestens drei Materialien können zum Seelenzehrer erwachen.</p>'+
    '<p><b>Allrounder</b> geben +4 % Resonanzqualität aus der Hand, auf dem Feld mit Ladungen +8 / +12 / +16 %. <b>Resonator-Fusionen</b> geben +10 % aus der Hand oder +20 / +30 % vom Feld. Die Summen sind auf +24 % für Allrounder und +60 % für Resonatoren begrenzt.</p>'+
    '<p><b>Weiterfusion:</b> Eine bereits existierende Fusion zählt als eine Karte. Als Kern behält sie mindestens ihr Level, steigt aber langsamer. 35 % ihrer neu erworbenen Qualität können bis maximal 15 Prozentpunkte übernommen werden. Bereits geerbte Qualität wird nicht unendlich erneut vererbt. Jede Weiterfusion verbraucht wieder eine Vorlage.</p>')+
   sub('field','7 · Feldmaterialien, Seelenerbe und Fusions-Stomp',
    '<p>Du kannst im Duo <b>Hand- und eigene Feldmonster gemeinsam</b> verwenden. Freigeschaltete Geistermaterialien zählen unter ihren besonderen Regeln. Bereits verbrauchte Angriffe werden nicht durch die Fusion erneut frei.</p>'+
    '<p>Gesammelte Seelenenergie beteiligter Feldmonster kann bis zu <b>250 DEF</b> für die Fusion bringen. Die Live-Vorschau zeigt den möglichen Seelenerbe-Anteil getrennt.</p>'+
    '<p><b>Fusions-Stomp:</b> Mit drei Materialien gibt es bis zu einen Nebenstrahl mit 70 %, mit vier zwei mit 50/50 %, mit fünf drei mit 50/50/30 %. Das Hauptziel bekommt 100 %. Zusätzliche Allrounder und Resonatoren können die Nebentreffer stärken; jedes tatsächlich getroffene Ziel verursacht 3 % ATK- und DEF-Verschleiß.</p>')+
   sub('reading','8 · „Fusion verstehen“: deine aktuelle Vorschau',
    '<p>Öffne im Duell den Fusionsbereich, markiere mindestens zwei Materialien und wähle die Vorlage. Unter <b>„? Fusion verstehen: Level & Werte“</b> findest du eine Auswertung deiner <b>konkreten Karten</b> mit Kernlevel, Rangschritten, Qualitätsfaktor, Rolle, Würfeln und möglichen ATK-/DEF-Werten.</p>'+
    '<p><b>Rechenlimit ≠ verfügbare Vorlage ≠ garantierte Stärke.</b> Auch bei einem hohen rechnerischen Level muss eine entsprechende Vorlage in deinem Duo-Fusionsdeck liegen. Die tatsächlichen Werte werden erst durch den serverseitigen Fusionswurf ermittelt.</p>');
 }
 function installBook(){
  const host=document.querySelector('.duo-guide');
  if(!host||host.querySelector('#ad214-fusions'))return false;
  const chapter=document.createElement('details');
  chapter.id='ad214-fusions';chapter.className='ad214-main';
  chapter.innerHTML='<summary>✦ Kapitel Fusionen · Level, Werte und Weiterfusionen</summary><div class="ad214-chapter-body">'+bookHtml()+'</div>';
  const heading=[...host.querySelectorAll('h3')].find(h=>h.textContent.includes('Fusionen und besondere Fähigkeiten'));
  const section=heading?.nextElementSibling;
  if(section&&section.parentNode===host)section.insertAdjacentElement('afterend',chapter);
  else host.append(chapter);
  return true;
 }
 function clear(details){
  if(!details)return;
  details.querySelector('.ad214-live')?.remove();
 }
 function render({details,availability,result,materials,catalog}={}){
  if(!details||!availability)return null;
  clear(details);
  const {rule,cards}=availability;
  const analysis=result?.analysis||availability.analysis;
  const lv=cards.map(c=>c.level);
  const template=result?catalog?.[result.templateId]:null;
  const best=Math.max(0,...availability.templates.map(id=>Number(catalog?.[id]?.level)||0));
  const actualLv=template?.level??rule.level;
  const role=roles[analysis.role]||'Resonator';
  const special=!!template?.lv1Exclusive;
  const quality=analysis.quality*100;
  const steps=rule.core===1&&lv.length===2&&lv.every(x=>x===1)?
   'Die besondere Einstiegsregel für zwei Level-1-Karten ermöglicht maximal Level 2.':
   'Kern Level '+rule.core+' → geschützte Stufe '+rule.floor+
   ' → passendstes Material liefert '+(rule.gain>=0?'+':'')+rule.gain+
   ' Rangpunkte'+(rule.coreIsFusion?' (bereits fusionierter Kern: langsamerer weiterer Aufstieg)':'')+'.';
  const live=document.createElement('div');live.className='ad214-live';
  const name=template?.name??'Noch keine Vorlage gewählt';
  live.innerHTML='<div class="ad214-facts">'+
    '<span><small>Materialbudget</small><strong>bis Lv '+rule.level+'</strong></span>'+
    '<span><small>Höchste freie Vorlage</small><strong>'+(best?'Lv '+best:'keine')+'</strong></span>'+
    '<span><small>Qualität</small><strong>'+pct(quality)+'</strong></span></div>'+
    '<div class="ad214-diagram">'+chain(lv)+'<small>Kernkarte: Material '+(rule.coreIndex+1)+' (Lv '+rule.core+')</small></div>'+
    '<div class="ad214-live-part"><strong>1 · Warum dieses Level?</strong>'+
    '<p>'+esc(steps)+'</p>'+
    '<p>'+(rule.bonus?'Zusätzlich +1 Rang durch passende Materialien oder eine komplette Fünferstraße. ':'Kein weiterer Material-Levelbonus. ')+
    (rule.resonatorAscent?'Einmaliger Resonator-Kettenbonus: +1 Level. ':'')+
    'Gesamte Materialstufensumme: '+lv.reduce((s,n)=>s+n,0)+'; allgemeines Maximum: Level 10. '+
    (special?'Die ausgewählte Sondervorlage ist ein Level-1-Questrezept. ':'')+
    (template?'Gewählte Vorlage: '+esc(name)+' (Lv '+actualLv+').':
     'Keine geeignete Vorlage ausgewählt.')+'</p></div>'+
    '<div class="ad214-live-part"><strong>2 · Warum diese Qualität?</strong>'+
    '<p>'+esc(analysis.pattern)+' · gewichteter Levelabstandsabzug: '+pct(rule.penalty*100)+
    (rule.street?' (vollständige Straße: geschützt)':'')+
    ' · Runenpräzision +'+pct(analysis.precisionPct||0)+'.</p>'+
    '<p>Resonanz +'+pct(analysis.resonancePct||0)+
    ' · reine Spezialisten +'+pct(analysis.pureRolePct||0)+
    ' · geerbte Qualität +'+pct(analysis.heritagePct||0)+
    (analysis.elemental?' · Elementharmonie aktiv':'')+
    (analysis.loreChainApplied?' · Fusionskunde +3 % Kettenqualität':'')+'.</p></div>'+
    '<div class="ad214-live-part"><strong>3 · Welche Werte sind möglich?</strong>'+
    '<p>Kampfrolle: <b>'+esc(role)+'</b>'+(analysis.soulOdds?' (Seelenzehrer-Erwachen möglich)':'')+
    ' · '+analysis.rolls+' gemeinsame ATK-/DEF-Wertewürfe. Das jeweils beste <em>Wertepaar</em> zählt.</p>'+
    (result?'<div class="ad214-facts ad214-stat"><span><small>ATK-Spanne</small><strong>'+fmt(result.atk[0])+'–'+fmt(result.atk[1])+'</strong></span>'+
     '<span><small>DEF-Spanne</small><strong>'+fmt(result.def[0])+'–'+fmt(result.def[1])+'</strong></span>'+
     '<span><small>Seelenerbe DEF</small><strong>+'+fmt(result.soulDef)+'</strong></span></div>'+
     '<p>Vorlage '+esc(name)+' · '+analysis.materialBlocks+' Materialblöcke à 10 Punkte; Zufallswürfe von 88–112 % der geprägten Grundwerte. Die Grenzen sind keine garantierte Kombination.</p>':
     '<p>Wähle eine verfügbare Vorlage aus, um konkrete ATK-/DEF-Spannen zu sehen.</p>')+
    '</div>'+
    '<p class="ad214-note">Nur Vorschau: Keine Materialien, Ressourcen oder Spielaktionen werden verbraucht. Der Server würfelt erst beim Bestätigen.</p>';
  const jump=document.createElement('button');jump.type='button';
  jump.className='ad214-open-book';jump.textContent='Im Duo-Regelbuch ausführlich nachlesen';
  jump.addEventListener('click',()=>{
   const book=$('ad214-fusions');
   if(!book)return;
   const guide=book.closest('.duo-guide');if(guide)guide.open=true;
   book.open=true;
   const inner=$('ad214-level');if(inner)inner.open=true;
   book.scrollIntoView({behavior:window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches?'auto':'smooth',block:'start'});
  });
  live.append(jump);
  const sum=details.querySelector('summary');
  if(sum)sum.textContent='? Fusion verstehen: Level & Werte';
  details.append(live);
  return {level:rule.level,quality:quality,role,rolls:analysis.rolls};
 }
 installBook();
 window.ArcaneDuoFusionGuide214=Object.freeze({version:'21.4',bookHtml,installBook,render,clear});
})();