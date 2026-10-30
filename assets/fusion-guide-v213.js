/* Arcane Duel v21.3 · Fusionen verstehen: handbook and live, read-only explanation.
 * No modifications to duel rules, saved data, rolls, inventory or fusion permissions.
 */
'use strict';
(()=>{
 const esc=value=>escapeHtml(String(value??''));
 const nf=value=>Number(value||0).toLocaleString('de-AT',{maximumFractionDigits:1});
 const pct=value=>nf(value)+' %';
 const label={predator:'Predator',guardian:'Wächter',soul:'Seelenzehrer',resonator:'Resonator',combatant:'Allrounder'};
 const section=(id,title,html)=>'<details class="ad213-subchapter" id="ad213-section-'+id+'"><summary>'+title+'</summary><div class="ad213-section-body">'+html+'</div></details>';
 const mini=levels=>'<span class="ad213-mini-chain">'+levels.map(n=>'<span class="ad213-mini-card">Lv '+n+'</span>').join('<b>+</b>')+'</span>';
 function bookContent(){
  return '<div class="ad213-book-lead"><strong>Fusionen – von der ersten Karte bis zum fertigen Monster</strong>'+
   '<p>Du kannst direkt mit dem ersten Unterkapitel anfangen. Die Beispiele gelten für gewöhnliche Einzelspieler-Fusionen. Besondere Level-1-Questrezepte und klassisches PvP haben eigene Regeln.</p></div>'+
   section('start','1 · Was ist eine Fusion? Wie starte ich sie?',
    '<p>Aus <b>zwei bis fünf echten Monsterkarten</b> entsteht <b>ein neues Fusionsmonster</b>. Die verwendeten Karten gehen für dieses Duell als Materialien verloren; dein dauerhafter Kartenbesitz bleibt erhalten. Du benötigst zusätzlich eine <b>noch verfügbare Vorlage</b> im Fusionsdeck. Jede Fusion verbraucht eine Vorlagenkopie für die Partie.</p>'+
    '<p><b>Handfusion:</b> Karten in der Hand markieren, Fusion wählen, Vorlage auswählen und eine Feldzone bestätigen. <b>Feldfusion:</b> Eine vorbereitete Handkarte mit einer eigenen Feldkarte verbinden; über „Freie Feldfusion“ sind insgesamt bis zu fünf Materialien möglich. Schon beschworene Fusionen können später erneut als Material dienen.</p>'+
    '<p><b>Nicht verwendbar:</b> ACE-Karten, Schicksalsmonster und beschworene Predator-Tokens. „Lumiras Fall“ ist eine Sonderausnahme der Geschichte.</p>'+
    '<div class="ad213-diagram">'+mini([3,3])+'<span class="ad213-arrow">↓ Fusion + verfügbare Vorlage</span><strong>Ein neues Monster (maximal Lv 4)</strong></div>')+
   section('level','2 · Wie wird das Fusionslevel berechnet?',
    '<p><b>Schritt 1 – Kernkarte:</b> Du wählst ein Monster als Kern. Ohne eigene Wahl verwendet das Spiel die höchste Materialstufe. Bei einer vollständigen Straße zählt automatisch das höchste Level, damit die Klickreihenfolge keinen Vorteil verschafft.</p>'+
    '<p><b>Schritt 2 – Ausgangsstufe:</b> Bei einer normalen Kernkarte ab Lv 3 beginnt die Rechnung mit <b>Kernlevel minus 1</b>. Für Lv 1 und 2 gelten besondere Grenzen. Eine bereits existierende Fusion als Kern behält dagegen mindestens ihren bisherigen Rang.</p>'+
    '<p><b>Schritt 3 – Passendstes Material:</b> Das weitere Material mit dem kleinsten Levelabstand zum Kern bestimmt den ersten Ranggewinn. Bei einer Kernkarte ab Lv 5 sind es bis zu <b>+3 Ränge</b> bei gleichem oder benachbartem Level, bei Lv 3–4 bis zu +2. Große Unterschiede nützen wenig oder verursachen Abzüge; der Kernschutz bleibt bestehen.</p>'+
    '<p><b>Schritt 4 – Zusätzliche Materialien:</b> Ab drei Karten ist <b>einmalig +1 Rang</b> möglich, wenn der Kern mindestens Lv 3 besitzt und alle anderen Materialien höchstens zwei Level davon entfernt sind. Eine vollständige Fünferstraße mit ausreichend hoher Kernkarte bekommt diesen Bonus als Sonderregel.</p>'+
    '<p><b>Schritt 5 – Grenzen:</b> Das Ergebnis ist höchstens Lv 10 und bei normalen Fusionen niemals höher als die Summe der Materiallevel. Zwei echte Resonator-Fusionen können einmalig in ihrer Kette +1 gewähren. Für jedes erlaubte Level brauchst du trotzdem eine tatsächlich vorhandene Fusionsvorlage.</p>'+
    '<div class="ad213-diagram">'+mini([6,5])+'<span class="ad213-arrow">↓ Kern Lv 6 → Ausgangsstufe 5 → passendstes Material +3</span><strong>Bis Level 8</strong></div>')+
   section('examples','3 · Einfache Levelbeispiele',
    '<div class="ad213-table-scroll"><table class="arcane-rule-table"><thead><tr><th>Materialstufen</th><th>Höchstes mögliches Level</th><th>Warum?</th></tr></thead><tbody>'+
    '<tr><td>1 + 1</td><td>Lv 2</td><td>Besondere Einstiegsregel</td></tr>'+
    '<tr><td>2 + 2</td><td>Lv 2</td><td>Frühe Levelgrenze</td></tr>'+
    '<tr><td>3 + 3</td><td>Lv 4</td><td>Gute Zweierkombination</td></tr>'+
    '<tr><td>3 + 3 + 3</td><td>Lv 5</td><td>Passende dritte Karte</td></tr>'+
    '<tr><td>6 + 5</td><td>Lv 8</td><td>Nur ein Level Abstand</td></tr>'+
    '<tr><td>6 + 5 + 5</td><td>Lv 9</td><td>Zusätzlicher Rang durch drei passende Karten</td></tr>'+
    '<tr><td>6 + 1</td><td>Lv 5</td><td>Großer Levelabstand</td></tr>'+
    '<tr><td>3 + 4 + 5</td><td>Lv 7</td><td>Kleine Straße</td></tr>'+
    '<tr><td>2 + 3 + 4 + 5 + 6</td><td>Lv 9</td><td>Gigantische Straße</td></tr>'+
    '</tbody></table></div><p><b>Achtung:</b> Die Tabelle zeigt das <em>maximal erlaubte</em> Level für normale Materialien, nicht eine garantierte Vorlage und keine garantierten ATK-/DEF-Werte.</p>')+
   section('poker','4 · Pokerkombinationen und die Fusionsqualität',
    '<p>Eine Fusion bekommt einen <b>Qualitätsfaktor</b>. Er beeinflusst ATK und DEF vor dem Würfeln. Mehr Material gibt zunächst +4,5 Prozentpunkte je Material ab dem dritten; passende Pokerkombinationen verbessern die Qualität. Unpassende Levelabstände können sie senken. Bei einer <b>vollständigen Straße</b> entfällt der übliche Abstandsabzug.</p>'+
    '<div class="ad213-table-scroll"><table class="arcane-rule-table"><thead><tr><th>Kombination</th><th>Beispiel</th><th>Grundbonus</th><th>Extra-Würfe</th></tr></thead><tbody>'+
    '<tr><td>Paar</td><td>3 + 3</td><td>+4 %</td><td>0</td></tr>'+
    '<tr><td>Zwei Paare</td><td>3 + 3 + 4 + 4</td><td>+12 %</td><td>1</td></tr>'+
    '<tr><td>Drilling</td><td>3 + 3 + 3</td><td>+8 %</td><td>1</td></tr>'+
    '<tr><td>Kleine Straße</td><td>3 + 4 + 5</td><td>+20 %</td><td>1</td></tr>'+
    '<tr><td>Vierling</td><td>3 + 3 + 3 + 3</td><td>+13 %</td><td>2</td></tr>'+
    '<tr><td>Full House</td><td>3 + 3 + 3 + 4 + 4</td><td>+14 %</td><td>2</td></tr>'+
    '<tr><td>Große Straße</td><td>3 + 4 + 5 + 6</td><td>+30 %</td><td>3</td></tr>'+
    '<tr><td>Fünfling</td><td>3 + 3 + 3 + 3 + 3</td><td>+18 %</td><td>3</td></tr>'+
    '<tr><td>Gigantische Straße</td><td>2 + 3 + 4 + 5 + 6</td><td>+36 %</td><td>4</td></tr>'+
    '</tbody></table></div>'+
    '<p>Weitere kleine Boni sind möglich: in passenden Kombinationen für Lv-1-/Lv-2-Materialien, <b>+2,5 Prozentpunkte Elementharmonie</b> bei identischem Element und <b>+5 Punkte reine Spezialistenqualität</b> bei vollständig gleichen Predator-, Wächter- oder Seelenzehrer-Materialien. Zusätzliche Upgrades und Resonanz wirken ebenfalls.</p>'+
    '<div class="ad213-diagram">'+mini([3,4,5])+'<span class="ad213-arrow">↓ 100 % + 4,5 % (3. Material) + 20 % (Straße) − 0 % (Abstand)</span><strong>124,5 % Qualität – vor weiteren Boni</strong></div>')+
   section('stats','5 · Wie entstehen ATK und DEF?',
    '<p><b>1. Referenz:</b> Das Spiel ermittelt aus gewöhnlichen Monstern des Ziellevels getrennte ATK- und DEF-Mittelwerte (Mitte von Minimum und Maximum). Die hohen alten Werte einer Fusionsvorlage werden nicht einfach übernommen.</p>'+
    '<p><b>2. Qualität und Rolle:</b> Die Referenz wird mit der errechneten Qualität und der Kampfrolle multipliziert. <b>Predator:</b> ATK × 1,20 und DEF × 0,75. <b>Wächter / Seelenzehrer:</b> ATK × 0,75 und DEF × 1,35. <b>Resonator:</b> jeweils × 1,00. Eine Rolle wird nicht später nochmals aufmultipliziert.</p>'+
    '<p><b>3. Wertewürfe:</b> Jeder Versuch würfelt für ATK und DEF getrennt <b>88–112 %</b> der so geprägten Werte. Der gesamte ATK+DEF-Wurf mit der höchsten Summe gewinnt. Man darf nicht den besten ATK-Wert eines Wurfs mit der DEF eines anderen kombinieren. Höchstens sieben Würfe werden berücksichtigt.</p>'+
    '<p><b>4. Materialboni:</b> Verstärkungen der Materialien und frühere Fusionsstufen geben eventuell kleine Bonusblöcke. Jeder Block landet zufällig auf ATK <em>oder</em> DEF. Sonderabzüge und gegebenenfalls aus Feldmonstern übertragene Seelenenergie werden danach getrennt berücksichtigt.</p>'+
    '<div class="ad213-diagram"><strong>Beispiel mit erfundenen Referenzwerten</strong><span>1.000 ATK / 1.000 DEF · Qualität 124,5 % · Predator</span><span class="ad213-arrow">↓ Vor dem Würfeln ungefähr 1.494 ATK / 934 DEF</span><span>Mehrere Würfe zwischen 88–112 % → bestes gemeinsames Wertepaar</span><strong>Danach Materialboni und mögliche Abzüge</strong></div>'+
    '<p><b>Wichtig:</b> Mehr Qualität und mehr Würfe erhöhen die Chancen, garantieren aber keine bestimmte Stärke. Eine schlechte Fusion kann schwächer als ihr stärkstes Ausgangsmaterial sein.</p>')+
   section('roles','6 · Vererbte Rollen, Resonanz und Weiterfusionen',
    '<p><b>Rollenvererbung:</b> Die Mehrheit der spezialisierten Materialien entscheidet. Predator-Materialien erzeugen offensive Fusionen; Wächter und Seelenzehrer zählen zusammen zur Verteidigerseite. Ohne eindeutige Spezialistenmehrheit wird die Fusion zum neutralen Resonator. Ab drei passenden Verteidigermaterialien kann ein Wächter zum Seelenzehrer erwachen.</p>'+
    '<p><b>Allrounder:</b> +4 % Resonanzqualität aus der Hand oder +8/+12/+16 % mit ein bis drei Feldladungen; zusammen maximal +24 % für normale Allrounder. <b>Resonator-Fusionen:</b> +10 % aus der Hand oder +20/+30 % mit Feldladungen; zusammen maximal +60 % aus Resonatoren. Eine schwache Allrounder-Beigabe soll die bestehende Qualitätsbasis nicht verschlechtern.</p>'+
    '<p><b>Kettenfusion:</b> Eine vorhandene Fusion zählt als <em>eine eigenständige Karte</em> statt als all ihre ursprünglichen Materialien. Als Kern behält sie mindestens ihr Level; sie steigt aber langsamer auf. Von ihrer neu erarbeiteten Zusatzqualität werden <b>35 % (maximal 15 Prozentpunkte)</b> vererbt, ohne zuvor geerbte Qualität endlos zu vervielfachen. Eine neue Fusionsvorlage wird wieder verbraucht.</p>'+
    '<p><b>Zwei echte Resonator-Fusionen</b> können innerhalb einer Kette einmalig +1 Level ermöglichen – niemals endlos wiederholt.</p>')+
   section('field','7 · Feldfusion, Seelenerbe und Fusions-Stomp',
    '<p>Für eine <b>Freie Feldfusion</b> wählst du eine Handkarte und bis zu vier eigene Feldmonster. Alle ausgewählten Feldmonster werden verbraucht. Aus gespeicherter Seelenenergie kann die neue Fusion zusätzlich bis zu <b>250 DEF</b> erben; Seelenzehrer können außerdem begrenzt Seelenenergie weitertragen.</p>'+
    '<p>Ab <b>drei Materialien</b> kann eine Fusion beim Angreifen neben dem Hauptziel weitere Gegner treffen: <b>3 Karten:</b> ein Nebenziel mit 70 %, <b>4 Karten:</b> zwei mit 50/50 %, <b>5 Karten:</b> drei mit 50/50/30 %. Nur tatsächlich vorhandene Gegner werden getroffen. Resonator- und Allrounder-Materialien können die Nebenstrahlen zusätzlich verstärken; jeder getroffene Gegner kostet dafür Kampfessenz beziehungsweise ATK-/DEF-Verschleiß.</p>'+
    '<p>Eine große Fusion ist nicht immer die beste Entscheidung. Bedenke, welche Karten du dafür opferst und wie viele Monster danach auf deinem Feld bleiben.</p>')+
   section('check','8 · Vorschau richtig lesen und typische Fehler vermeiden',
    '<p><b>„Bis Level X“</b> ist das höchste rechnerisch erlaubte Level, noch keine tatsächlich verfügbare Karte. <b>„Verfügbare Vorlage“</b> berücksichtigt deine noch ungenutzten Kopien im Fusionsdeck. <b>„Qualität“</b> verändert die Ausgangswerte, und eine <b>ATK-/DEF-Spanne</b> zeigt mögliche Würfelergebnisse – kein garantiertes Ergebnis.</p>'+
    '<p>Vergiss nicht: <b>Level ≠ Stärke</b>, <b>Qualitätsbonus ≠ garantierter ATK-Zuwachs</b> und <b>mehr Materialien ≠ automatisch besser</b>. Verwende im Duell <b>„Fusion verstehen: Level & Werte“</b>, bevor du etwas verbrauchst.</p>');
 }
 function installBook(){
  const book=document.querySelector('#modal .arcane-handbook');
  if(!book||book.querySelector('#ad213-rule-fusion'))return;
  // The former one-page tutorial is now covered by a structured, searchable chapter.
  book.querySelector('.ad113-handbook')?.remove();
  const node=document.createElement('details');
  node.id='ad213-rule-fusion';node.className='arcane-rule-chapter ad213-fusion-chapter';
  node.innerHTML='<summary>✧ Fusionen · Level, Werte und Strategien</summary><div class="arcane-rule-body">'+bookContent()+'</div>';
  const old=book.querySelectorAll('.arcane-rule-chapter');
  if(old.length>3)book.insertBefore(node,old[3]);else book.append(node);
  // Legacy poker table column called "Budgetbonus" is no longer a level rule
  // since v11.3 switched to the material-sensitive core calculation.
  const legacy=book.querySelectorAll('.arcane-rule-chapter')[4];
  const table=[...legacy?.querySelectorAll('table')||[]].find(t=>t.textContent.includes('Budgetbonus'));
  if(table){
   for(const row of table.querySelectorAll('tr'))row.children[4]?.remove();
   const note=document.createElement('p');note.className='ad213-legacy-note';
   note.innerHTML='<b>Aktueller Hinweis:</b> Die Bonusspalten dieser Tabelle beschreiben Pokerqualität und Wertewürfe. Das erreichbare Level wird seit dem Fusions-Rework ausschließlich über die Kern- und Materialberechnung ermittelt. Die vollständige Erklärung steht im neuen Kapitel „Fusionen“.';
   table.parentElement?.insertAdjacentElement('beforebegin',note);
  }
  for(const p of legacy?.querySelectorAll('p')||[]){
   if(p.textContent.includes('durchschnittliche Stufe')&&p.textContent.includes('Materialbudget')){
    p.innerHTML='Das <b>aktuelle Fusionslevel</b> richtet sich nach Kernkarte, nächstem Material, passenden Zusatzkarten und Sonderregeln. Die Höhe der Poker-Qualitätsboni ist <b>nicht</b> der direkt verwendete Levelbonus. Siehe „Fusionen → Wie wird das Fusionslevel berechnet?“';
   }
  }
  const first=book.querySelectorAll('.arcane-rule-chapter')[2];
  for(const p of first?.querySelectorAll('p')||[]){
   if(p.textContent.includes('Ohne passende Mehrheit bleibt die Rolle')){
    p.innerHTML=p.innerHTML.replace('Ohne passende Mehrheit bleibt die Rolle der Vorlage maßgeblich.','Ohne eindeutige Spezialistenmehrheit wird die Fusion zum neutralen Resonator.');
   }
  }
 }
 function currentSet(){
  const g=typeof game==='undefined'?null:game;
  if(!g||g.mode!=='pve'||g.active!==0)return null;
  if(g.pending){
   if(g.pending.kind!=='fusion')return null;
   return {g,pending:true,levels:g.pending.levels||[],materials:[],card:g.pending.card};
  }
  const p=g.players[g.active];
  const materials=(g.materials||[]).map(uid=>p.hand.find(c=>c.uid===uid)).filter(Boolean);
  if(materials.length<2||materials.length>5)return null;
  return {g,pending:false,levels:materials.map(c=>dataOf(c).level),materials};
 }
 function actualInfo(set){
  const {g,levels,materials,pending}=set;
  if(pending)return {pending:true,level:dataOf(set.card).level,levels};
  const q=window.ArcaneFusionRework113.calculate(levels,g,materials);
  const pattern=window.ArcaneFusionMath.pattern(levels,materials.map(c=>dataOf(c).element));
  const quality=window.ArcaneFusionMath.tuned(g,levels,materials.map(c=>dataOf(c).element),materials);
  const budget=fusionBudget(levels,g,materials);
  const options=fusionOptions(g,levels,materials).filter(c=>c.level>=2).sort((a,b)=>b.level-a.level||b.atk-a.atk);
  const best=options[0]||null;
  const forecast=best&&typeof fusionPreview==='function'?fusionPreview(g,best,materials,levels):null;
  const role=window.ArcaneRoleFusion?.inheritance?.(materials)||'resonator';
  return {q,pattern,quality,budget,best,forecast,role,levels,materials,pending:false};
 }
 function explanationText(info){
  if(info.pending)return '<p>Die Handfusion ist schon vorbereitet: <b>Level '+info.level+'</b>. Die Vorlage wurde dabei verbraucht. Die endgültigen Kampfwerte werden erst bei der Enthüllung beziehungsweise Platzierung angezeigt. Für eine neue Materialanalyse kannst du die vorbereitete Fusion gegebenenfalls zurücknehmen.</p>';
  const {q,pattern,quality,budget,best,forecast,role,levels,materials}=info;
  const core=materials[q.coreIndex];
  const sum=levels.reduce((a,b)=>a+b,0);
  const main='<div class="ad213-status">'+
    '<span><small>Materialbudget</small><strong>bis LV '+budget+'</strong></span>'+
    '<span><small>Beste freie Vorlage</small><strong>'+(best?'LV '+best.level:'keine')+'</strong></span>'+
    '<span><small>Aktuelle Qualität</small><strong>'+pct(quality.factor*100)+'</strong></span></div>';
  const cards='<div class="ad213-materials">'+materials.map((c,i)=>
    '<span class="ad213-material '+(i===q.coreIndex?'is-core':'')+'">'+
    '<small>'+(i===q.coreIndex?'✦ Kernkarte':'Material '+(i+1))+'</small>'+
    '<b>LV '+levels[i]+'</b><small>'+esc(dataOf(c).name)+'</small></span>').join('')+'</div>';
  const coreStep=levels.every(x=>x===1)?'Sonderstart: reine Lv-1-Materialien ermöglichen normalerweise Lv 2.':
   'Kernlevel '+q.core+' → geschützte Ausgangsstufe Lv '+q.floor+
   '. Passendstes Material: Lv '+q.first+'; Rangbeitrag '+(q.gain>=0?'+':'')+q.gain+
   (q.coreIsFusion?' (Kettenfusion steigt langsamer)':'')+'.';
  const levelSteps='<div class="ad213-reason"><h3>1 · Woher kommt dieses Level?</h3>'+
   '<p><b>Ausgewählter Kern:</b> '+esc(dataOf(core).name)+' (Lv '+q.core+'). '+esc(coreStep)+'</p>'+
   '<p><b>Zusätzliche Karten:</b> '+(q.bonus?'+1 Level durch passende Zusatzmaterialien beziehungsweise vollständige Fünferstraße.':'Kein weiterer Levelbonus.')+
   (q.resonatorBonus?' <b>+1 einmaliger Resonator-Kettenbonus.</b>':'')+'</p>'+
   '<p><b>Grenzen:</b> Materialsumme '+sum+'; allgemeine Grenze Lv 10. Damit ist maximal Lv '+budget+' erreichbar.'+
   (best?' Die höchste noch freie Vorlage ist '+esc(best.name)+' auf Lv '+best.level+'.':' Es ist keine passende freie Vorlage vorhanden.')+'</p></div>';
  const weights=q.others?.length?'<p>Abstand der anderen Materiallevel zum Kern: '+
   q.others.map((lv,i)=>'Lv '+lv+' ('+Math.round((q.weights[i]||0)*100)+' % Gewicht)').join(' · ')+
   '. Die Gewichte betreffen den <b>Qualitätsabzug</b>, nicht direkte ATK-Boni.</p>':'';
  const combos='<div class="ad213-reason"><h3>2 · Woher kommt die Qualität?</h3>'+
   '<p><b>'+esc(pattern.name)+'</b>: '+(quality.rollBonus||0)+' zusätzliche Poker-Wertewürfe. '+
   'Anzahl der Materialien: '+levels.length+' (ab dem dritten jeweils +4,5 Prozentpunkte vor Abzügen). '+
   'Kombinationsboni einschließlich möglicher Niedriglevel- und Elementeffekte: '+
   pct((quality.qualityBonus||0)*100)+'.</p>'+
   '<p>Gewichteter Levelabstandsabzug: '+pct(q.penalty*100)+
   (q.street?' – <b>vollständige Straße: kein Abstandsabzug</b>.':'.')+
   ' Die angezeigte Gesamtqualität enthält gegebenenfalls zusätzlich Spezialistenboni, Resonanz, Upgrades und Vererbung.</p>'+
   weights+
   '<p><b>Zusatzboni:</b> '+(quality.pureRoleBonusPct?'Reine Spezialistenrolle +'+quality.pureRoleBonusPct+' %. ':'')+
   (quality.resonancePct?'Resonanz +'+quality.resonancePct+' %. ':'')+
   (quality.heritagePct?'Geerbte Qualität +'+nf(quality.heritagePct)+' %. ':'')+
   (quality.fusionLoreChainPct?'Fusionskunde +'+quality.fusionLoreChainPct+' %. ':'')+
   (!quality.pureRoleBonusPct&&!quality.resonancePct&&!quality.heritagePct&&!quality.fusionLoreChainPct?'Keine der hier gesondert ausgewiesenen Boni.':'')+
   '</p></div>';
  let stats='<p>Es gibt derzeit keine passende freie Fusionsvorlage. Die Werte können erst mit einer legalen Vorlage vorhergesagt werden.</p>';
  if(best&&forecast){
   stats='<p><b>Beispielvorlage:</b> '+esc(best.name)+' (Lv '+best.level+'). '+
    'Die Materialien prägen die Rolle <b>'+esc(label[role]||'Resonator')+'</b>'+
    (role==='guardian'&&levels.length>=3?' (Erwachen zum Seelenzehrer möglich)':'')+'.</p>'+
    '<div class="ad213-stat-grid"><span><small>ATK-Vorschau</small><strong>'+nf(forecast.atk[0])+'–'+nf(forecast.atk[1])+'</strong></span>'+
    '<span><small>DEF-Vorschau</small><strong>'+nf(forecast.def[0])+'–'+nf(forecast.def[1])+'</strong></span>'+
    '<span><small>Wertewürfe</small><strong>'+forecast.rolls+'</strong></span>'+
    '<span><small>Materialwertblöcke</small><strong>+'+nf(forecast.bonus)+'</strong></span></div>'+
    '<p>Das Spiel würfelt ATK und DEF je Wurf mit <b>88–112 %</b> ihrer Rollen-/Qualitätsbasis. '+
    'Gewählt wird das gemeinsame Wertepaar mit der höchsten ATK+DEF-Summe. Erst danach werden Materialboni zufällig zu ATK oder DEF verteilt. '+
    'Die beiden Spannen sind Einzelspannen, kein garantiert gleichzeitig erreichbares Wertepaar; Feld-Seelenerbe und weitere spätere Kampfeffekte können hinzukommen.</p>';
  }
  const values='<div class="ad213-reason"><h3>3 · Welche Kampfwerte kann die Fusion bekommen?</h3>'+stats+'</div>';
  const advice='<div class="ad213-next"><strong>Was wäre jetzt sinnvoll?</strong><p>'+
   (!best?'Du brauchst eine noch verfügbare, ausgerüstete Fusionsvorlage für ein erlaubtes Level.':
   best.level<budget?'Dein Materialbudget kann bereits mehr: Eine passende Fusionsvorlage auf einer höheren erlaubten Stufe würde das zusätzliche Level nutzbar machen.':
   q.penalty>.04?'Versuche Materiallevel näher an das Kernlevel zu bringen oder eine vollständige Straße zu bilden, um den Qualitätsabzug zu senken.':
   budget<10?'Mit einem höheren Kern oder weiteren gut passenden Materialien kann das erlaubte Level steigen. Prüfe aber auch die Qualitäts- und Würfelboni.':
   'Du erreichst bereits die Levelobergrenze. Verbessere stattdessen Materialmuster, Qualität, Rolle oder die Würfelanzahl.')+
   '</p></div>';
  return main+cards+levelSteps+combos+values+advice;
 }
 function openExplanation(){
  const set=currentSet();
  if(!set){toast('Wähle zuerst zwei bis fünf Fusionsmaterialien.');return;}
  const info=actualInfo(set);
  const html='<div class="ad213-explanation">'+explanationText(info)+
   '<p class="ad213-fine">Die Vorschau liest die aktuelle Spielberechnung, verändert keine Karten und führt keine Fusion aus. Werte bleiben bis zum eigentlichen Fusionswurf ungewiss.</p></div>';
  openModal(modalHtml('✧ FUSION VERSTEHEN','Level, Qualität und mögliche Werte','✦',
   'Deine ausgewählten Materialien – Schritt für Schritt erklärt.',html,
   '<button class="btn" id="ad213OpenBook">Im Regelbuch nachlesen</button>'+
   '<button class="btn primary" id="ad213Close">Verstanden</button>'));
  $('ad213Close').onclick=hideModal;
  $('ad213OpenBook').onclick=()=>{
   showRules();
   const chapter=document.getElementById('ad213-rule-fusion');
   if(chapter){chapter.open=true;const level=chapter.querySelector('#ad213-section-level');if(level)level.open=true;}
  };
 }
 // Intercept the previous button in capture phase before its old explanation opens.
 document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-ad113-explain]');
  if(!button||!button.closest('#summonStage'))return;
  event.preventDefault();event.stopImmediatePropagation();
  openExplanation();
 },true);
 const priorRender=render;
 render=function(...args){
  const result=priorRender.apply(this,args);
  const button=document.querySelector('#summonStage [data-ad113-explain]');
  if(button){button.textContent='? Fusion verstehen: Level & Werte';
   button.setAttribute('aria-label','Erklärt Fusionslevel, Qualitätsfaktor und mögliche ATK-/DEF-Werte');}
  return result;
 };
 const priorRules=showRules;
 showRules=function(...args){const result=priorRules.apply(this,args);installBook();return result;};
 window.ArcaneFusionGuide213=Object.freeze({version:'21.3',bookContent,actualInfo,explanationText,installBook,openExplanation});
})();