/* Arcane Duel v18.0 – the player's handbook: friendly wording and current rules.
 * Presentation only. No duel, reward, or savegame state changes.
 */
'use strict';
(()=>{
 const previous=showRules;
 const chapter=(id,title,body)=>{
  const node=document.createElement('details');
  node.className='arcane-rule-chapter';node.id='ad180-rule-'+id;
  const heading=document.createElement('summary');heading.textContent=title;node.append(heading);
  const content=document.createElement('div');content.className='arcane-rule-body';
  content.innerHTML=body;node.append(content);
  return node;
 };
 const content=[
  ['soul','15 · Seelenzehrer: Verdichten, Entladen und Seelenraub',
   `<h3>Eine Verteidigung, die zurückschlagen kann</h3>
    <p>Seelenzehrer sind keine gewöhnlichen Verteidiger. Während Wächter sie schützen,
    schwächen sie gegnerische Monster und sammeln Seelenkraft. In Verteidigungsposition
    können sie gegnerische Angriffe abfangen und mit der Hälfte ihrer Angriffskraft zurückschlagen.</p>
    <h3>Verdichten: Schutz und Angriff zugleich</h3>
    <p>Hast du genug Seelenkraft gesammelt, kannst du <b>Verdichten</b> einsetzen.
    Ein Teil der gespeicherten Kraft wird zu einem Schutzschild auf deiner DEF.
    Gleichzeitig steigt die <b>ATK um die Hälfte des noch vorhandenen Verdichtungswerts</b>.
    So wird auch ein vermeintlich harmloser Verteidiger plötzlich gefährlich.</p>
    <p><b>Wichtig:</b> Verdichten verbraucht nicht den Angriff des Monsters.
    Du kannst anschließend in Angriffsposition wechseln und angreifen,
    sofern der Positionswechsel und der Angriff noch möglich sind.
    Der Bonus nimmt über drei eigene Züge wieder ab. Die Fähigkeit braucht drei Züge,
    bevor du sie erneut einsetzen kannst.</p>
    <h3>Wann sind Entladen und Seelenraub sinnvoll?</h3>
    <p>Mit <b>Entladen</b> setzt du gesammelte Seelenkraft als direkten Schaden gegen
    die gegnerischen Lebenspunkte ein. Mit <b>gezieltem Seelenraub</b> schwächst du
    ein wichtiges gegnerisches Monster besonders stark. Verdichten lohnt sich eher,
    wenn dein Monster noch länger kämpfen oder einen überraschenden Angriff starten soll.</p>
    <p><b>Einsteiger-Tipp:</b> Stell einen Wächter und einen Seelenzehrer gemeinsam auf.
    Der Wächter hält die Verteidigung aufrecht, während der Seelenzehrer die Gegner
    langsam unter Druck setzt.</p>`],
  ['chain','16 · Weiterfusionen, Kernmonster und Resonanz',
   `<h3>Eine Fusion kann der Anfang sein</h3>
    <p>Du kannst ein bereits fusioniertes Monster später erneut als Material verwenden.
    So entsteht eine <b>Fusionskette</b>. Dabei entscheidet nicht nur die Anzahl der Karten,
    sondern auch, wie gut ihre Level zueinander passen.</p>
    <h3>Warum ist die Kernkarte wichtig?</h3>
    <p>Bei vielen Fusionen wählst du ein <b>Kernmonster</b>. Seine Stufe bildet den Ausgangspunkt.
    Die übrigen Materialien können die erreichbare Stufe verbessern oder verschlechtern.
    Ähnlich starke Monster passen meistens besser zusammen als eine sehr hohe Karte
    mit mehreren deutlich schwächeren.</p>
    <p>Ein Beispiel: Mit aufeinanderfolgenden Stufen wie <b>1 + 2 + 3</b> bildest du
    eine kleine Straße. Mit vier Karten wird daraus eine große, mit fünf eine
    gigantische Straße. Auch Paare, Drillinge und ein Full House bringen Vorteile.
    Welche Vorlagen tatsächlich möglich sind, zeigt dir das Spiel vor dem Fusionieren.</p>
    <h3>Was bringen Resonatoren?</h3>
    <p>Resonatoren unterstützen deine Fusionen mit zusätzlicher Qualität.
    Setzt du <b>zwei echte Resonator-Fusionen in derselben Kette</b> ein, kann die
    erreichbare Stufe <b>einmalig um eins steigen</b>. Das lässt sich in derselben
    Kette nicht beliebig wiederholen. Du brauchst weiterhin eine passende Vorlage
    in deinem Fusionsdeck.</p>
    <p><b>Einsteiger-Tipp:</b> Eine große Fusion ist nicht immer die beste Entscheidung.
    Wenn du dafür alle Monster aufgibst, kann dein Feld danach zu leer sein.
    Schau deshalb vor dem Bestätigen auf die Vorschau und deine übrigen Handkarten.</p>`],
  ['spirits','17 · Level-1-Fusionen und verbotene Forschung',
   `<h3>Auch kleine Monster haben große Möglichkeiten</h3>
    <p>In der besonderen Level-1-Questreihe lernst du eine völlig andere Spielweise kennen:
    Viele kleine Monster arbeiten zusammen und wachsen durch ihre Anzahl.
    Erst nach der Freischaltung kannst du besondere <b>Level-1-Fusionen</b> einsetzen.
    Sie bestehen aus drei bis fünf geeigneten Level-1-Materialien und bleiben
    selbst auf Level 1.</p>
    <h3>Was sind Geisterzonen?</h3>
    <p>Mit der verbotenen Forschung kannst du zusätzliche <b>Geisterplätze</b>
    nutzen. Ein Monster dort schützt dein Team vor direkten Angriffen und kann
    später wieder auf das normale Feld zurückkehren. Das Verlegen kostet in der
    Regel die Aktion des Monsters.</p>
    <p><b>Geisterfunken</b> helfen beim Fusionieren und zählen als Material der
    Stufe 2 – nicht als echtes Level-1-Monster. Schwarm-Echos können dir helfen,
    rasch mehr Monster ins Spiel zu bringen. Achte bei speziellen Level-1-Fusionen
    deshalb genau darauf, welche Materialien verlangt werden.</p>
    <p>Die Questreihe führt dich Schritt für Schritt an diese Spielweise heran.
    Du musst sie nicht abschließen, um im normalen Turnier weiterzukommen.</p>`],
  ['loot','18 · Karten sammeln, Booster und die Schmiede',
   `<h3>Wiederholen ist ausdrücklich erlaubt</h3>
    <p>Wenn du an einem Gegner festhängst, darfst du frühere Duelle so oft wiederholen,
    wie du möchtest. So sammelst du neue Karten, Essenz und Splitter und kannst
    dein Deck gezielt verbessern. Du musst nicht jede Prüfung beim ersten Versuch schaffen.</p>
    <h3>Was steckt in welchem Paket?</h3>
    <p><b>Booster</b> schenken dir neue Karten für deine Sammlung.
    Welche Monster du finden kannst, hängt davon ab, wie weit du im Turnier gekommen bist.
    <b>Charakterpacks</b> lassen dich aus drei angebotenen Karten wählen.
    Du behältst die erste kostenlos; weitere können Essenz kosten.
    Wenn du Karten gezielt suchst, helfen dir außerdem Rollenforschung und Herstellung.</p>
    <h3>Werkstatt oder Aufstiegsschmiede?</h3>
    <p>In der <b>Monsterwerkstatt</b> formst du Karten derselben Familie um.
    Die Summe ihrer Stufen bleibt gleich. Die <b>Aufstiegsschmiede</b> funktioniert
    anders: Aus drei freien Karten derselben Stufe entsteht eine zufällige Karte
    eine Stufe höher. Diese drei Karten werden dauerhaft verbraucht.
    Karten in deinem Deck und geschützte Lieblinge bleiben erhalten.</p>
    <p><b>Einsteiger-Tipp:</b> Sammle zunächst eine zuverlässige Mischung aus Angreifern,
    Verteidigern und passenden Fusionsmaterialien. Ein Deck voller hoher Stufen
    ist nicht automatisch stärker.</p>`],
  ['duo','19 · Gemeinsam spielen: 2 Menschen gegen 2 Gegner',
   `<h3>Ein Team, zwei eigene Decks</h3>
    <p>Im 2v2 kämpfst du mit einem Freund gegen zwei Computergegner.
    Ihr teilt euch <b>16.000 Lebenspunkte</b> und dürft jeweils bis zu sieben
    Monster auf dem Feld haben. Die Zugfolge ist immer gleich:
    <b>Gastgeber → Gegner → Partner → Gegner</b>.</p>
    <p>Ihr ergänzt euch gegenseitig: Einer kann eine schützende Stellung aufbauen,
    während der andere auf Angriff oder Fusionen setzt. Jeder spielt mit seinen
    eigenen Handkarten und Fusionsvorlagen.</p>
    <h3>Deine 2v2-Sammlung gehört nur dir</h3>
    <p>Der Einzelspieler und das gemeinsame Abenteuer haben <b>getrennte Spielstände</b>.
    Jeder startet im 2v2 mit einem eigenen Deck und verdient sich dort Karten,
    Verbesserungen und besondere Fähigkeiten. Was du im Einzelspieler bereits
    freigeschaltet hast, wird nicht ins 2v2 übernommen – und umgekehrt.</p>
    <p>Du darfst abgeschlossene Kapitel wiederholen, um Ressourcen zu sammeln.
    Beim ersten Sieg warten besondere Kapitelbelohnungen auf dich.
    Euer laufendes Duell wird nach jedem bestätigten Zug automatisch gespeichert.</p>
    <h3>Was passiert, wenn ich den Raum verlasse?</h3>
    <p>Mit deinem persönlichen 2v2-Profil kannst du dich später wieder anmelden.
    Für ein bestimmtes Duell lässt sich zusätzlich ein privater Zugangslink sichern.
    <b>Teile diesen Link nicht</b>, denn damit könnte jemand deinen Platz übernehmen.</p>`],
  ['faq','20 · Häufige Fragen und Tipps für den Einstieg',
   `<h3>Warum sehe ich beim Duellstart keine Karten?</h3>
    <p>Die Arena füllt zunächst die Lebenspunkte auf. Erst danach fliegen deine
    fünf Startkarten in die Hand. Auch neue Karten werden beim Nachziehen sichtbar
    hineingezogen. An deinen Regeln oder Chancen ändert die Animation nichts.</p>
    <h3>Warum kann ich nicht angreifen?</h3>
    <p>Im allerersten Spielerzug wird noch nicht angegriffen.
    Später muss dein Monster bereit sein und in Angriffsposition liegen.
    Ein bereits verbrauchter Angriff wird durch einen Positionswechsel nicht erneuert.</p>
    <h3>Warum wird mein Monster schwächer?</h3>
    <p>Angriffe kosten normalerweise etwas ATK. Außerdem verlieren Monster nach
    ihrem geschützten ersten Zug mit der Zeit ATK und DEF. Das ist der
    <b>Kreaturenzerfall</b>. Auf höheren Stufen ist er stärker.</p>
    <h3>Warum sehe ich eine Fusion, kann sie aber nicht beschwören?</h3>
    <p>Du brauchst die passende Vorlage in deinem Fusionsdeck und geeignete
    Materialien. Eine im Lexikon entdeckte Karte gehört dir nicht automatisch.</p>
    <h3>Was sollte ich nach einer Niederlage tun?</h3>
    <p>Schau dir an, wie der Gegner gewonnen hat. Brauchst du mehr Angriffskraft,
    besseren Schutz oder eine passende Fusion? Sammle ruhig in leichteren Duellen,
    verbessere dein Deck und versuch es erneut.</p>
    <h3>Wie schütze ich meinen Fortschritt?</h3>
    <p>Im Einzelspieler kannst du deinen Spielstand sichern und als Datei
    exportieren. Im 2v2 wird automatisch gespeichert; dort ist dein privater
    Profilzugang besonders wichtig.</p>`],
  ['tutorial','21 · Deine ersten drei Lernduelle',
   `<h3>Du musst nicht alles sofort wissen</h3>
    <p>Im Hauptmenü findest du <b>Drei Lernduelle</b>. Hier lernst du mit deinem
    eigenen Deck die wichtigsten Handgriffe. Die Gegner beginnen mit nur
    <b>2.000 LP</b>, damit du schnell etwas ausprobieren kannst.</p>
    <h3>Was lernst du in welcher Übung?</h3>
    <ol><li><b>Deine ersten Karten:</b> Eine Handkarte mit <b>Linksklick</b>
    auswählen, beschwören, den Zug beenden und kämpfen.</li>
    <li><b>Fusionen entdecken:</b> Zwei bis fünf Handkarten mit
    <b>Rechtsklick</b> oder dem Touch-Fusionsmodus markieren, eine passende
    Vorlage wählen und das neue Monster aufs Feld setzen.</li>
    <li><b>Angreifen und verteidigen:</b> Dein Feld schützen, auf den Gegner
    reagieren und den Gegenangriff versuchen.</li></ol>
    <p>Jede Übung endet erst mit einem Sieg. Danach kannst du sofort die nächste
    starten. Du darfst jederzeit zurückkehren und eine Übung wiederholen.</p>`]
  ['predator-pack','22 · Predatoren: Rudelführer, Jagdmarkierung und Rudelruf',
   `<h3>Das Rudel kämpft gemeinsam</h3>
    <p>Aktive Predatoren erhalten <b>+2 % Angriffsschaden je eigenem Predator auf dem Feld</b>
    (maximal fünf). Auch Predator-Tokens zählen. Der Bonus verändert die Kartenwerte nicht dauerhaft.</p>
    <h3>Überwältigung und Jagdmarkierung</h3>
    <p>Der erste Predator-Angriff markiert ein gegnerisches Monster mit einem
    schimmernden Fadenkreuz. Greift ein <b>anderer Predator</b> dasselbe Ziel
    im selben Zug an, erhält der zweite Angriff <b>+5 % Schaden</b>,
    der dritte und weitere unterschiedliche Angreifer <b>+10 %</b>.
    Mehrfachangriffe desselben Predators zählen nicht erneut.
    Beim Zielwechsel und am Zugende verfällt die Markierung.
    Folgeangriffe erhalten stärkere Einschläge; markierte zerstörte Monster
    werden mit einer Klauenhieb-Animation besiegt. Die Animation ist rein visuell.</p>
    <h3>Rudelführer aus einer Predator-Fusion</h3>
    <p>Jede neu entstandene Predator-Fusion kann das Rudel anführen.
    Eine kleine schimmernde Krone kennzeichnet den aktiven Rudelführer.
    <b>Nur ein Rudelführer je Spieler</b> wirkt gleichzeitig: Die
    neueste Predator-Fusion übernimmt die Führung. Mit Rudelführer
    erhalten <b>alle Predatoren +3 % statt +2 %</b> Schwarmbonus je
    aktivem Predator; mehrere Rudelführer-Boni stapeln sich nicht.</p>
    <h3>Die Anzahl der Materialien entscheidet</h3>
    <p><b>2 Materialien:</b> Basis-Rudelführerbonus, keine Sonderfähigkeit.<br>
    <b>3 Materialien:</b> Eine zufällig ausgewählte Sonderfähigkeit.<br>
    <b>4 Materialien:</b> Zwei verschiedene zufällig ausgewählte Sonderfähigkeiten.<br>
    <b>5 Materialien:</b> Alle drei Sonderfähigkeiten.</p>
    <p>Nach den echten Wertewürfen erscheint im gleichen Fusionsfenster
    eine kurze Enthüllung jeder erhaltenen Fähigkeit. Entscheidend
    ist die <b>Materialanzahl</b>, nicht die Stufe des Anführers.</p>
    <h3>Drei kleine Sonderfähigkeiten</h3>
    <p><b>Rudelinstinkt:</b> Schwarmbonus +0,5 Prozentpunkte je Predator:
    mit Anführer insgesamt <b>+3,5 %</b> statt +3 %.<br>
    <b>Blutspur:</b> weitere <b>+3 % Schaden</b> bei markierten Folgeangriffen.<br>
    <b>Rudelruf:</b> Nach jeweils <b>3 eigenen Zügen</b> mit einem
    aktiven Rudelführer erscheint bei freiem Feldplatz ein Predator-Token.</p>
    <h3>Predator-Tokens</h3>
    <p>Der Token übernimmt die Stufe der Rudelführer-Fusion, besitzt
    aber deutlich schwächere ATK und DEF als normale Predatoren.
    Er kann regulär angreifen, Ziele markieren und zum Schwarmbonus
    beitragen. <b>Er ist niemals Fusionsmaterial</b>, gelangt nicht
    ins Deck oder in die Sammlung und verschwindet nach seiner Zerstörung.
    Bei vollem Feld wird die Token-Erschaffung auf einen späteren
    eigenen Zug verschoben.</p>
    <p>Diese neue Rudelführer-Mechanik gilt derzeit im
    <b>Einzelspieler-PvE</b>. Klassisches PvP, 2v2 und symmetrische
    KI-Forschungsduelle bleiben unverändert.</p>`],
 ];
 function refresh(){
  const modal=document.getElementById('modal'),book=modal?.querySelector('.arcane-handbook');
  if(!book)return;
  const intro=book.querySelector('.arcane-rule-intro');
  if(intro)intro.innerHTML='<b>Ein guter Duellant lernt mit jedem Kampf.</b> '+
   'Wähle ein Thema oder suche nach einer Frage. Für deinen ersten Kampf reicht Kapitel 1.';
  const chapters=[...book.querySelectorAll('.arcane-rule-chapter')];
  const special=chapters[7];
  if(special){
   const old=[...special.querySelectorAll('p')].find(p=>p.textContent.includes('Ursprüngliche Startkarten beginnen'));
   if(old)old.innerHTML='Beim ersten eigenen Zugende nach der Beschwörung ist ein Monster noch geschützt. '+
    'Danach verliert es an jedem eigenen Zugende ATK und DEF. Die Höhe hängt vom Level ab: '+
    '<b>Lv1: 20, Lv2: 25, Lv3: 30, Lv4: 40, Lv5: 55, Lv6: 65, Lv7: 80, '+
    'Lv8: 105, Lv9: 135, Lv10: 170</b> Punkte je Wert. Standhaftigkeit reduziert diesen Verlust.';
   for(const block of special.querySelectorAll('.ad119-rule-section')){
    if(block.querySelector('h3')?.textContent.includes('Der neue levelabhängige Kreaturenzerfall'))block.remove();
   }
  }
  const combinations=chapters[3];
  for(const p of combinations?.querySelectorAll('p')||[]){
   if(p.textContent.includes('vier oder fünf eine große'))p.innerHTML=p.innerHTML.replace(
    'Drei ergeben eine kleine Straße, vier oder fünf eine große.',
    'Drei ergeben eine kleine Straße, vier eine große und fünf eine gigantische Straße.');
  }
  for(const block of book.querySelectorAll('.ad119-rule-section')){
   if(block.querySelector('h3')?.textContent.includes('Fusionspacks statt reinem Zufallsfarming'))
    block.querySelector('h3').textContent='Fusionsvorlagen gezielt sammeln';
  }
  for(const [id,title,html] of content){
   if(!book.querySelector('#ad180-rule-'+id))book.append(chapter(id,title,html));
  }
 }
 showRules=function(...args){const result=previous.apply(this,args);refresh();return result;};
 window.ArcaneHandbookHuman180=Object.freeze({version:'18.0',chapterIds:content.map(x=>x[0]),refresh});
})();
