/* Arcane Duel v20.1: complete, searchable PvE Fusion-Stomp handbook and
 * two lesson success gates. Loaded AFTER the v20.0 combat extension.
 * No game balance, attack damage or persistent profile state is changed.
 */
'use strict';
(()=>{
 const title='23 · Fusions-Stomp: Elementarstrahl, Nebentreffer und Essenzkosten';
 const handbook=`
  <h3>Was ist der Fusions-Stomp?</h3>
  <p>Im <b>Einzelspieler-PvE</b> erzeugt eine Fusion aus <b>drei bis fünf echten
  Materialien</b> beim Angriff einen mächtigen Elementarstrahl. Erst trifft ein
  dicker Strahl das gewählte Hauptziel mit dem <b>normalen Angriffsschaden
  (100 %)</b>. Danach teilt er sich in kleinere Strahlen, die weitere besetzte
  Monsterplätze des Gegners treffen. Das Element der Fusion bestimmt Farbe
  und Licht des Effekts; die Optik verändert den Schaden nicht zusätzlich.</p>
  <p>Eine Fusion aus <b>zwei Materialien</b> erzeugt keinen zusätzlichen Strahl.
  Auch bei einer größeren Fusion entstehen Nebentreffer nur, wenn tatsächlich
  weitere Gegner auf dem Feld stehen.</p>

  <h3>Materialzahl und Reichweite</h3>
  <table class="arcane-rule-table"><thead><tr><th>Materialien</th><th>Hauptziel</th>
  <th>Weitere Ziele</th><th>Grundstärke der Nebenstrahlen</th></tr></thead><tbody>
  <tr><td>2</td><td>100 %</td><td>0</td><td>Kein Stomp</td></tr>
  <tr><td>3</td><td>100 %</td><td>bis zu 1</td><td>70 %</td></tr>
  <tr><td>4</td><td>100 %</td><td>bis zu 2</td><td>50 % / 50 %</td></tr>
  <tr><td>5</td><td>100 %</td><td>bis zu 3</td><td>50 % / 50 % / 30 %</td></tr>
  </tbody></table>
  <p><b>Beispiel:</b> Eine Fusion mit fünf Materialien und 1.000 effektiver ATK
  greift an. Ohne zusätzliche Boni oder Rüstung erhält das Hauptziel 1.000
  Trefferstärke. Bei genügend Gegnern erhalten drei unterschiedliche Nebenziele
  500, 500 und 300 Trefferstärke. Das sind getrennte Treffer: Es wird nicht
  dieselbe Karte mehrfach von den Nebenstrahlen getroffen.</p>

  <h3>Welche Gegner werden getroffen?</h3>
  <p>Die Nebenstrahlen springen zu den <b>nächsten besetzten Feldplätzen</b>.
  Aus Spielersicht wird zuerst rechts vom Hauptziel gesucht, dann links,
  anschließend wieder rechts; für die KI ist die Blickrichtung gespiegelt.
  Leere Plätze werden übersprungen. Ein Monster wird pro Stomp höchstens
  einmal als Nebenziel gewählt. Werden nur zwei Gegner erreicht, gibt es
  auch nur zwei Treffer – die übrige mögliche Reichweite bleibt ungenutzt.</p>
  <p>Lenkt eine Schutzfähigkeit den Hauptangriff auf ein anderes Feldmonster um,
  orientieren sich die Nebenstrahlen am <b>tatsächlichen Hauptziel</b>.</p>

  <h3>Resonatoren und Allrounder verstärken die Verzweigung</h3>
  <p>Bei der Fusion wird für jeden <b>Resonator als Material</b> ein Bonus von
  <b>+2 bis +4 Prozentpunkten</b> auf jeden Nebenstrahl ausgewürfelt.
  Jedes <b>Allrounder-Material</b> gibt <b>+1 bis +2 Prozentpunkte</b>.
  Insgesamt sind höchstens <b>+12 Prozentpunkte</b> möglich. Die Würfe finden
  <b>einmal bei der Entstehung der Fusion</b> statt und bleiben auch nach dem
  Speichern erhalten; sie ändern sich nicht bei jedem Angriff.</p>
  <p><b>Beispiel mit maximalem Bonus:</b> Eine Fünferfusion verursacht dann
  100 % am Hauptziel und <b>62 % / 62 % / 42 %</b> auf drei Nebenzielen.
  Der Bonus verändert <b>nicht</b> die 100 % des Hauptstrahls. Das bisherige
  Qualitäts- und Resonanzsystem beim Fusionieren bleibt zusätzlich erhalten.</p>

  <h3>Angriff, Verteidigung und Gegenschläge</h3>
  <p>Ein Nebenstrahl gegen ein Ziel in <b>ATK-Position</b> zerstört dieses nur,
  wenn seine eigene Trefferstärke mindestens dessen aktuelle ATK erreicht.
  Reicht sie nicht aus, bleibt das Monster stehen und verliert stattdessen
  verbleibende <b>DEF</b>. Ein Nebentreffer ist also kein zweites vollwertiges
  ATK-Duell mit gewöhnlichem LP-Differenzschaden.</p>
  <p>Ein <b>Wächter oder Seelenzehrer in DEF</b> reduziert auch Nebenschaden
  um <b>35 %</b>. Vor der Grund-DEF werden vorhandene Verdichtungs- und
  Seelenschichten aufgebraucht. Ein solcher Verteidiger kann selbst nach
  seiner Zerstörung noch einen Gegenschlag auslösen: Beim Nebentreffer beträgt
  dieser nur <b>40 % des gewöhnlichen Gegenschlags</b>, also rechnerisch
  20 % seiner aktuellen ATK statt der normalen 50 %. Vollständig geschützte
  Ziele werden nicht zusätzlich verletzt oder zum Gegenangriff aktiviert.</p>

  <h3>Die Kehrseite: 3 % ATK UND DEF pro getroffenem Ziel</h3>
  <p>Mit dem neuen System wurde im Einzelspieler-PvE der frühere feste
  Angriffsabzug von 30 ATK ersetzt. <b>Jeder überlebende Angreifer</b> verliert
  jetzt pro <b>tatsächlich getroffenem Ziel 3 % seiner eigenen ATK und 3 %
  seiner eigenen DEF</b>. Das gilt auch für normale Monster und
  Zweierfusionen bei einem gewöhnlichen Einzelangriff.</p>
  <p>Ein Ziel kostet 3 %, zwei Ziele 6 %, drei Ziele 9 % und vier Ziele 12 %.
  Die Berechnung verwendet jeweils die Werte <b>vor dem Angriff</b>; die
  Prozente werden nicht nacheinander miteinander multipliziert.
  Die einzelnen Abzüge werden auf ganze Punkte aufgerundet.</p>
  <p><b>Rechenbeispiel:</b> Eine Fünferfusion hat vor dem Angriff
  <b>1.000 ATK und 1.200 DEF</b>. Trifft sie ein Hauptziel und drei
  Nebenziele, verliert sie <b>120 ATK und 144 DEF</b>. Danach besitzt sie
  <b>880 ATK und 1.056 DEF</b>, sofern keine weiteren Effekte eingreifen.
  Trifft sie nur das Hauptziel, beträgt der Verlust dagegen nur
  30 ATK und 36 DEF.</p>
  <p>Dadurch können große Fusionen in einem Zug mehrere Gegner ausschalten,
  verlieren aber bei einem vollen Gegnerfeld spürbar Kampfkraft.
  <b>Predatoren</b> können eine nach vier Treffern geschwächte Fusion
  mit einem gezielten Gegenangriff bestrafen. Ein Stomp ist deshalb
  besonders wertvoll, wenn er wichtige Feinde sofort ausschaltet.</p>
  <p><b>Wichtig zum Ausbau Kampfdisziplin:</b> Seine frühere Verminderung
  des festen ATK-Abzugs wird vom neuen PvE-Prozentverschleiß derzeit
  <b>nicht angewendet</b>. Die Neugewichtung dieses Ausbaus ist noch offen.
  Der gewöhnliche Kreaturenzerfall am Zugende ist eine <b>andere</b>
  Mechanik und wird durch den Stomp nicht ersetzt.</p>

  <h3>Was gilt in anderen Spielmodi?</h3>
  <p>Der beschriebene Fusions-Stomp ist derzeit im <b>Singleplayer-PvE</b>
  aktiv – sowohl für den Spieler als auch für die gegnerische KI.
  <b>Lokales klassisches PvP und die unabhängige 2v2-Kampagne</b> nutzen
  diese Mehrfachtreffer- und Verschleißregeln noch nicht. Insbesondere
  das 2v2 berechnet den Angriff weiterhin im eigenen serverseitigen
  Regelkern. Die Angleichung wird gesondert geprüft und getestet.</p>
  <h3>Zum Ausprobieren</h3>
  <p>Unter <b>Herausforderungen → Lernherausforderungen</b> gibt es
  <b>Der geteilte Strahl</b> und <b>Prisma der Fünf</b>. Du erhältst
  leihweise passende Decks. Für den Abschluss musst du einen wirklichen
  Nebentreffer ausführen und anschließend das Übungsduell gewinnen.
  Dein eigenes Deck und deine Sammlung werden dabei nicht verändert.</p>`;

 // A purchased legacy perk must not claim to reduce the new proportional
 // fatigue when the combat implementation presently resets that reduction.
 if(typeof UPGRADES!=='undefined'&&UPGRADES.combatDiscipline)
  UPGRADES.combatDiscipline.desc='Früher: −2 ATK Verschleiß je Rang bei festen Angriffskosten. Das neue Einzelspieler-PvE verbraucht stattdessen 3 % ATK und DEF je tatsächlich getroffenem Ziel; Kampfdisziplin senkt diese Prozentkosten derzeit nicht. Neugewichtung ausstehend.';

 const oldAttack=attack;
 attack=function(g,ai,di){
  const result=oldAttack(g,ai,di);
  if(g?.mode!=='pve'||g.active!==0||!['stomp3','stomp5'].includes(g.lessonId)||
    !Array.isArray(g.lessonPatterns)||
    !Array.isArray(result?.stomp?.hits)||!result.stomp.hits.length)return result;
  const record=id=>{if(!g.lessonPatterns.includes(id)&&g.lessonPatterns.length<100)
   g.lessonPatterns.push(id);};
  if(result.stomp.count>=3)record('stomp3');
  if(result.stomp.count===5&&result.stomp.hits.length>=2)record('stomp5');
  return result;
 };

 function addRules(){
  const book=document.getElementById('modal')?.querySelector('.arcane-handbook');
  if(!book||book.querySelector('#ad201-fusion-stomp'))return;
  // Two historical prose chapters still describe the replaced fixed cost.
  // Keep them accurate without changing the unrelated core handbook engine.
  for(const p of book.querySelectorAll('p')){
   if(p.textContent?.includes('Ein überlebender Angreifer verliert nach dem Angriff normalerweise'))
    p.innerHTML='Im aktuellen Einzelspieler-PvE verliert ein überlebender Angreifer nach dem Angriff <b>3 % ATK und DEF pro tatsächlich getroffenem Ziel</b>. Kampfdisziplin vermindert den neuen Prozentabzug derzeit nicht. Eine Position kann normalerweise einmal pro Zug gewechselt werden.';
   else if(p.textContent?.includes('Nach einem Angriff verliert ein überlebender Angreifer normalerweise 30 ATK'))
    p.innerHTML=p.innerHTML.replace('Nach einem Angriff verliert ein überlebender Angreifer normalerweise 30 ATK.',
     'Nach einem Angriff verliert ein überlebender Angreifer im Einzelspieler-PvE 3 % seiner ATK und DEF je tatsächlich getroffenem Ziel.');
  }
  const node=document.createElement('details');node.className='arcane-rule-chapter';
  node.id='ad201-fusion-stomp';
  const summary=document.createElement('summary');summary.textContent=title;
  const body=document.createElement('div');body.className='arcane-rule-body';
  body.innerHTML=handbook;node.append(summary,body);book.append(node);
 }
 const oldRules=showRules;
 showRules=function(...args){const result=oldRules.apply(this,args);addRules();return result;};
 window.ArcaneFusionStompGuide201=Object.freeze({version:'20.1',title,handbook,
  lessonGoals:['stomp3','stomp5']});
})();
