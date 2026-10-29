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
    Ihr teilt euch <b>doppelt so viele Lebenspunkte wie in der jeweiligen Solo-Turnierstufe</b> (4.000 / 8.000 / 16.000) und dürft jeweils bis zu sieben
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
    <p>Im Einzelspieler-PvE und in der 2v2-Kampagne kosten Angriffe
    <b>3 % ATK und DEF je tatsächlich getroffenem Ziel</b>.
    Der Kreaturenzerfall am eigenen Zugende ist ein eigener Effekt.
    Predator-Entwicklung erhöht den berechneten Angriffsfaktor;
    sie heilt <b>keine</b> bereits verlorenen ATK oder DEF.</p>
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
    starten. Du darfst jederzeit zurückkehren und eine Übung wiederholen.</p>`],
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
    <p>Ein Rudelführer entsteht <b>nur, wenn mindestens drei tatsächlich
    eingesetzte Fusionsmaterialien Predatoren sind</b> und die neue Fusion
    die Predator-Rolle erhält. Die bloße Fusion von drei beliebigen Karten
    oder zwei Predatoren mit einer fremden Karte reicht nicht aus.
    Eine kleine schimmernde Krone kennzeichnet den aktiven Rudelführer.
    <b>Nur ein Rudelführer je Spieler</b> wirkt gleichzeitig: Die
    neueste Predator-Fusion übernimmt die Führung. Mit Rudelführer
    erhalten <b>alle Predatoren +3 % statt +2 %</b> Schwarmbonus je
    aktivem Predator; mehrere Rudelführer-Boni stapeln sich nicht.</p>
    <h3>Die Anzahl der Materialien entscheidet</h3>
    <p><b>2 Materialien:</b> normale Fusion, kein Rudelführer.<br>
    <b>3 Materialien:</b> Nur drei Predatoren erhalten eine zufällige Sonderfähigkeit.<br>
    <b>4 Materialien:</b> Mindestens drei Predatoren nötig; zwei verschiedene Sonderfähigkeiten.<br>
    <b>5 Materialien:</b> Mindestens drei Predatoren nötig; alle drei Sonderfähigkeiten.</p>
    <p>Nach den echten Wertewürfen erscheint im gleichen Fusionsfenster
    eine gut lesbare, farblich hervorgehobene Enthüllung jedes erhaltenen Perks,
    die anschließend verblasst. Die <b>Materialanzahl</b> bestimmt erst nach
    Erfüllung der Predator-Bedingung die Anzahl der Sonderfähigkeiten.</p>
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
    <p><b>Unterschiede der Modi:</b> Im 2v2 sind Schwarmbonus und
    Predator-Entwicklung ebenfalls im serverseitigen Kampfsystem
    umgesetzt; die besonderen Rudelführer-Fähigkeiten und
    ihre Balance müssen nicht in jedem Modus genau gleich sein.
    Symmetrische KI-Forschung kann eigene Sonderregeln verwenden.</p>`],
  ['combat-controls','24 · Duellbedienung, Feldwerte und neue Animationen',
   `<h3>Tasten und Übersicht</h3>
    <p><b>D</b> wechselt das ausgewählte eigene Monster zwischen ATK und DEF,
    sofern es in diesem Zug noch wechseln darf. <b>A</b> löst einen direkten Angriff
    mit dem ausgewählten Feldmonster aus, wenn das gegnerische Feld frei ist.
    <b>F</b> öffnet die Fusion, <b>Leertaste</b> beendet den Zug. Mit <b>H</b>
    minimierst oder öffnest du die Handkarten. Das geht auch über
    „Hand verbergen/zeigen“ direkt oberhalb deiner Hand.</p>
    <h3>Warum unterscheiden sich Hand- und Feldwerte?</h3>
    <p>Die Handkarte zeigt die Grundwerte. Auf dem Feld können Boni, die Wirkung
    von Kreaturenfähigkeiten, Angriffsermüdung oder Zerfall hinzukommen. Die
    große Kartenansicht zeigt für ein Monster auf dem Feld nun seine
    <b>aktuellen Feldwerte</b> an, damit du nicht zwischen zwei Zahlen rätseln musst.</p>
    <p>Bei normalen Predatoren zeigt die kleine Prozentanzeige jetzt den
    <b>Gesamtfaktor aus Entwicklung und Schwarm</b>: zunächst
    90 % Entwicklung, später schrittweise bis 102 %, plus den
    aktuell wirkenden Rudelbonus. Beispiel: <b>96 % + 4 % = 100 % ATK</b>.
    Wachstum zeigt kurz <b>ENTWICKLUNG</b>; die große Kartenansicht erklärt
    beide Anteile getrennt. Fusionen und Tokens entwickeln sich nicht.
    Ein Rudelführer bleibt zusätzlich durch seine Krone erkennbar.</p>
    <h3>Welche Karten dürfen niemals Fusionsmaterial werden?</h3>
    <p><b>ACE-Monster sind keine Fusionsmaterialien</b> – weder für dich noch
    für Turniergegner. Das gilt für Hand- und Feldfusionen. Auch
    Schicksalskarten und Rudelruf-Tokens sind geschützt. Eine ACE-Fusionskarte
    darf weiterhin als eigene Fusionsvorlage beschworen werden; nur als
    Material für weitere Fusionen ist sie ausgeschlossen. Die einmalige,
    erzählerisch festgelegte Verwandlung <b>„Lumiras Fall“</b> in der
    Fanatiker-Quest ist eine besondere Ausnahme und kein reguläres Rezept.</p>
    <h3>Wie laufen die Kampfanimationen ab?</h3>
    <p>Angreifende Karten preschen schnell bis etwa zur <b>Hälfte der Strecke</b>
    vor. Einschlag, Explosion und Schadenszahlen bleiben länger lesbar.
    Auch Wertverluste durch Zerfall werden sichtbar eingeblendet.
    Nach einem Kampfausgang bleibt das Spielfeld zunächst etwa
    anderthalb Sekunden stehen. Dann erscheint groß <b>Sieg</b> oder
    <b>Niederlage</b>, bevor sich das Ergebnisfenster langsam öffnet – ohne
    schwarzen Zwischenbildschirm.</p>
    <p>Beim Start des Duells und beim Nachziehen erscheinen neue Karten
    <b>nacheinander</b> von rechts in der Hand. Das ändert weder die gezogenen
    Karten noch ihre Chancen. Die Animation zeigt nur den tatsächlichen Zug.</p>
    <h3>Seelenzehrer-Aktionen und deine Hand</h3>
    <p>Wähle einen eigenen Seelenzehrer in DEF, um seine verfügbaren aktiven
    Fähigkeiten zu sehen. Das funktioniert auch, wenn du in diesem Zug noch
    keine andere Karte gespielt hast – vorausgesetzt, die Fähigkeit ist
    freigeschaltet und hat genügend Seelenessenz bzw. ist nicht im Cooldown.
    Bei Verdichten, Entladen oder Seelenraub verblassen die Handkarten
    kurz und erscheinen anschließend wieder.</p>
    <h3>Wann gibt es Dropladungen?</h3>
    <p>Dropladungen schaltest du erst frei, wenn du deinen ersten Gegner oft
    genug besiegt hast, um <b>Autokämpfe</b> gegen ihn spielen zu können.
    Das Spiel erklärt dir die Freischaltung in einem Hinweisfenster.
    Danach füllen manuelle Kämpfe deinen Vorrat auf. Wenn du Dropladungen
    aktivierst, bringt ein Autokampf <b>50 % statt 30 % Essenz und XP</b>
    sowie <b>20 % statt 12 % Kartenchance</b>. Pro Autokampf wird eine Ladung
    verbraucht – auch bei einer Niederlage. Du kannst sie zum Sparen ausschalten.</p>`],
  ['opening-development','25 · Eröffnungsschutz & Predator-Entwicklung',
   `<h3>1 · Eröffnungsschutz – das erste Monster soll eine Chance haben</h3>
<p>Das <b>erste normal beschworene Monster des Startspielers</b> erhält
im ersten Gesamtzug einen einmaligen Schutz gegen einen Angriff, der es
sonst sofort zerstören würde. Dieser Schutz wirkt nur im
<b>zweiten Gesamtzug</b>, aber sowohl in <b>ATK</b> als auch in
<b>DEF</b>. Die Rettung findet direkt während der
Schadensberechnung statt – die Karte wird nicht erst zerstört
und anschließend zurückgebracht.</p>
<p>Bei einer tödlichen DEF-Attacke bleibt das Monster mit
<b>mindestens 1 DEF</b> auf dem Feld, statt auf dem Friedhof zu
landen. Das ist <b>keine vollständige Schadensimmunität</b> und
kein Schild für die Team-LP. Ein nicht tödlicher Treffer
verbraucht die Rettung nicht.</p>
<h3>2 · Einmalig bedeutet einmalig</h3>
<p>Verbraucht wird der Schutz beim ersten <b>tödlichen</b> Treffer
in Zug 2. Ein weiterer tödlicher Angriff kann die Karte anschließend
ganz normal zerstören. Falls der Schutz bis zum Ende des zweiten
Gesamtzugs nicht benötigt wurde, verfällt er automatisch.</p>
<p><b>Ausnahmen:</b> Eine <b>Fusion</b> erhält keinen Eröffnungsschutz.
Auch kurzfristige Predator-Tokens sind nicht geschützt.
Der normale Schutz ersetzt weder Wächter-Fähigkeiten noch
Seelenzehrer-Effekte oder den Kreaturenzerfall.</p>
<p><b>Beispiel:</b> Dein erstes normales Monster besitzt 200 DEF und
wird in Zug 2 so stark angegriffen, dass es sonst zerstört wäre.
Mit Eröffnungsschutz überlebt es mit 1 DEF. Der Schutz verschwindet;
ein zweiter tödlicher Angriff darf es zerstören.</p>
<h3>3 · Predator-Entwicklung: 90 % bis 102 %</h3>
<p><b>Normale Predatoren</b> starten beim Ausspielen mit
<b>90 % Angriffsfaktor</b> und wachsen in <b>vier Schritten
zu je +3 Prozentpunkten</b> auf höchstens <b>102 %</b>.
Das eigene Zugende direkt nach der Beschwörung gibt noch
keinen Fortschritt. Erst nach <b>späteren abgeschlossenen
eigenen Zügen</b> steigt der Faktor von 90 auf 93, 96, 99
und schließlich 102 Prozent. Ein Prozentpunkt ist nicht
dasselbe wie eine Steigerung um 3 % des vorherigen Werts.</p>
<table class="arcane-rule-table"><thead><tr>
<th>Stand</th><th>Entwicklung</th><th>Bei 1.000 Grund-ATK ohne Schwarm</th>
</tr></thead><tbody>
<tr><td>Beschwörung + erstes eigenes Zugende</td><td>90 %</td><td>900 ATK</td></tr>
<tr><td>1. späterer eigener Abschluss</td><td>93 %</td><td>930 ATK</td></tr>
<tr><td>2. späterer eigener Abschluss</td><td>96 %</td><td>960 ATK</td></tr>
<tr><td>3. späterer eigener Abschluss</td><td>99 %</td><td>990 ATK</td></tr>
<tr><td>4. späterer Abschluss und danach</td><td>102 %</td><td>1.020 ATK</td></tr>
</tbody></table>
<p><b>Wichtig:</b> Entwicklung verändert nur die
<b>effektive ATK beim Kampf</b>, nicht die DEF.
Sie schreibt die gespeicherten Grundwerte nicht bei jedem
Schritt um. <b>Fusionen, Predator-Tokens und besondere
Essenzwesen</b> entwickeln sich nicht über diesen Mechanismus.</p>
<h3>4 · Schwarm und Entwicklung addieren sich</h3>
<p>Zusätzlich zur Entwicklung gibt es den <b>Schwarmbonus</b>:
Normalerweise gewährt jeder aktive eigene Predator auf dem Feld
<b>+2 Prozentpunkte</b> Angriffsstärke, höchstens fünf
zählen. Der Predator zählt selbst mit.
Mit aktivem Rudelführer sind es <b>+3 Prozentpunkte</b>
je Predator; mit dessen Rudelinstinkt <b>+3,5</b>.</p>
<p><b>Beispiel A:</b> 96 % Entwicklung und zwei aktive
Predatoren (+4 % Schwarm) ergeben
<b>96 % + 4 % = 100 % Gesamt-ATK</b>.
Bei 1.000 Grund-ATK entspricht das 1.000 effektiver ATK.</p>
<p><b>Beispiel B:</b> Ein frisch beschworener Predator ist
allein: 90 % + 2 % = <b>92 % Gesamt-ATK</b>.
Bei 1.000 Grund-ATK sind das 920 effektive ATK.</p>
<p><b>Beispiel C:</b> Ein voll entwickelter Predator
steht mit zwei anderen Predatoren und einem aktiven
Rudelführer auf dem Feld, ohne dessen Rudelinstinkt.
102 % + (3 × 3 %) = <b>111 % Gesamt-ATK</b>.
Andere Effekte wie Jagdmarkierung, Rüstung und
Spezialfähigkeiten werden getrennt berücksichtigt.</p>
<h3>5 · Was bedeutet die Prozentanzeige?</h3>
<p>Die kleine Anzeige auf einer Predator-Feldkarte zeigt
<b>den Gesamtfaktor</b> aus Entwicklung und Schwarm;
<b>100 % bedeutet normale Angriffsstärke</b>, nicht
+100 % Bonus. Ein Monster mit 96 % Gesamtfaktor schlägt
gegenüber seinem unmodifizierten aktuellen ATK-Wert
um 4 % schwächer zu.</p>
<p>Wenn ein Predator wächst, erscheint kurz
<b>ENTWICKLUNG</b> zusammen mit +3 % und dem neuen
Gesamtwert. Beschwörst du weitere Predatoren oder
verlierst Rudelmitglieder, ändert sich der Schwarmanteil
entsprechend. Deshalb kann ein angezeigter Prozentwert
<b>auch ohne eigene Entwicklung steigen oder sinken</b>.</p>
<p>Klickst du das Monster an, zeigt die
<b>große Kartenansicht</b> die Werte
<b>Entwicklung</b>, <b>Schwarmbonus</b> und
<b>Gesamt-ATK-Faktor</b> einzeln an. Eine
Rudelführer-Fusion wird eigens gekennzeichnet.</p>
<h3>6 · Warum kann die ATK trotz Entwicklung sinken?</h3>
<p>Angriffsverschleiß und Kreaturenzerfall verringern
reale ATK- und DEF-Punkte. Die Entwicklung ist dagegen
ein <b>Faktor auf die aktuelle Angriffsstärke</b>.
Sie ersetzt keinen verlorenen Wert und stellt keine DEF
wieder her. Ein Predator kann von 99 % auf 102 %
wachsen und trotzdem insgesamt weniger Schaden
verursachen, wenn seine ATK inzwischen stark gefallen ist.</p>
<h3>7 · Speichern, Laden und ältere Spielstände</h3>
<p>Der aktuelle <b>Entwicklungsfortschritt</b> wird
im Spielstand mitgeführt. Ebenso bleibt erfasst,
ob der <b>Eröffnungsschutz noch verfügbar oder schon
verbraucht</b> ist. Das Laden soll keinen zusätzlichen
Schutz oder neue Entwicklungszüge erzeugen.
Bei älteren Spielständen ohne diese Angaben startet
die Entwicklung mit einem sicheren Anfangswert.</p>
<h3>8 · Welche Modi verwenden diese Regeln?</h3>
<p><b>Predator-Entwicklung samt addiertem Schwarmbonus</b>
gibt es im Einzelspieler und im <b>2v2-Modus</b>.
Im Duo berechnet der Server die wirksame Angriffsstärke,
und die Kartenansicht erklärt die Prozentanteile.
Der <b>einmalige Eröffnungsschutz</b> ist aktuell
in der Einzelspieler-Kampfberechnung umgesetzt,
<b>im eigenständigen 2v2-Regelkern jedoch noch nicht</b>.
Die KI-Forschung kann eigene Testregeln verwenden.</p>
<p><b>Strategie-Tipp:</b> Ein normaler Predator ist
anfangs schwächer, gewinnt aber nach einigen eigenen
Zügen an Angriffskraft. Schutzmonster helfen ihm,
diese Entwicklung zu überleben; Rudelmitglieder
geben bereits vorher einen sofortigen Schwarmbonus.</p>`],
  ['soul-bond','26 · Seelenbund: Wächter & Seelenzehrer',
   `<h3>Wächter und Seelenzehrer: 20 % allein, 35 % gemeinsam</h3>
    <p>Wächter und Seelenzehrer besitzen allein <b>20 % Schadensminderung in DEF</b>.
    Stehen sie <b>direkt nebeneinander</b>, bilden sie einen Seelenbund.
    Beide gebundenen Monster haben nun <b>35 % DEF-Rüstung</b>.
    In ATK bleibt die Bindung sichtbar, aber die DEF-Rüstung wird
    nur bei einem Angriff auf ein Monster in DEF angewendet.
    Die bisherige Wächter-Heilung bleibt erhalten.</p>
    <h3>Passende Felder erkennen</h3>
    <p>Spielst du einen Wächter, schimmern freie Nachbarfelder
    <b>weiß/silbrig</b> für einen möglichen Seelenzehrer.
    Spielst du zuerst einen Seelenzehrer, leuchten sie
    <b>lila/violett</b> für einen Wächter.
    Nur die Plätze unmittelbar links und rechts zählen.
    Ein Wächter und ein Seelenzehrer dürfen jeweils
    <b>nur eine einzige Verbindung</b> eingehen.
    Mehrere Bindungen auf demselben Monster stapeln sich nicht.
    Bei mehreren möglichen Paaren entscheidet die
    Reihenfolge der Feldplätze von links nach rechts.
    Wird eine Karte zerstört, wird die Bindung neu berechnet.</p>
    <h3>Seelenresonanz: 25 % des zusätzlichen Schutzes</h3>
    <p>Der gebundene Seelenzehrer erhält <b>25 % des durch
    den Seelenbund zusätzlich verhinderten Schadens</b>
    als gespeicherte Seelenessenz, <b>maximal 50 pro
    Bindung und Runde</b>. Diese Energie wird <b>erst nach
    dem aktuellen Treffer</b> gutgeschrieben und erzeugt
    keine zusätzliche direkte LP-Verbrennung. Die normale
    Seelenessenz-Speichergrenze bleibt bestehen.
    Rüstungsdurchschlag von Predatoren und alle anderen
    Schutz- und Gegenschlagregeln gelten weiterhin.</p>
    <h3>Beispiel mit 1.000 Angriffsstärke</h3>
    <table class="arcane-rule-table"><thead><tr>
    <th>Situation</th><th>DEF-Schaden</th><th>Essenzgewinn</th>
    </tr></thead><tbody>
    <tr><td>Allein: 20 % Schutz</td><td>800</td><td>0</td></tr>
    <tr><td>Im Seelenbund: 35 % Schutz</td><td>650</td><td>37</td></tr>
    </tbody></table>
    <p>150 Schaden werden zusätzlich verhindert; davon ein
    Viertel = 37,5, abgerundet auf <b>37 Seelenessenz</b>.
    Weitere Treffer derselben Runde können zusammen
    höchstens 50 Essenz beitragen.</p>
    <h3>Visuelle Rückmeldung</h3>
    <p>Bei der Bindung erscheint kurz <b>SEELENBUND</b>
    mit einem Schildindikator <b>🛡 35 %</b>.
    Weiß-graue und violett-lila Wellen verbinden die beiden
    Karten. Wächter erhalten Licht-Schimmerpartikel,
    Seelenzehrer kleine Totenkopf-Partikel.
    Die große Kartenansicht nennt den Partner und zeigt
    den aktiven Rüstungswert. Wer reduzierte Bewegung
    bevorzugt, sieht die Hinweise ohne ständige Animationen.</p>
    <h3>2v2 und KI-Forschung</h3>
    <p>Im 2v2 wird nur <b>innerhalb des jeweiligen
    Siebener-Feldes eines Spielers</b> verbunden;
    die Teamfelder zweier Partner sind getrennt.
    Schaden und Essenzgewinn berechnet der 2v2-Server.
    Die noch laufende KI-Forschung benötigt eigene
    Trainingsläufe für taktische Seelenbund-Platzierungen.
    Die Mechanik allein garantiert noch keine bessere KI.</p>`],
  ['turn-flow-v207','27 · Beschwören, Seelenstoß, Lebenspunkte und Unterstützer',
   `<h3>So funktioniert die Beschwörungszone</h3>
   <p>Du darfst auch bei einem vollständig belegten Feld eine Handkarte
   vorbereiten. Eine <b>leere Zone</b> beschwört sie normal.
   Klickst du eine <b>besetzte Zone</b>, entscheidest du
   ausdrücklich zwischen <b>Ersetzen</b> und <b>Fusionieren</b>.
   Ersetzen schickt die alte Feldkarte auf den Friedhof und
   spielt die neue Karte; eine Feldfusion nutzt <b>genau ein</b>
   vorhandenes Feldmonster zusammen mit der vorbereiteten Karte.
   Eine normale Beschwörung bleibt durch erneutes Anklicken der
   Karte in der Beschwörungszone oder mit
   <b>Alles abwählen</b> umkehrbar, bis du eine Zone bestätigst.</p>
   <h3>Fusion und Wegwerfen vorbereiten</h3>
   <p>Markiere bis zu fünf Handkarten. In der
   <b>Beschwörungszone</b> sind alle Materialien mit
   Nummern sichtbar. Im Modus <b>Fusion</b> setzt
   der Rechtsklick auf eine Materialkarte sie ans Ende der
   Reihenfolge. Im Modus <b>Wegwerfen</b> bestimmst
   du mit Rechtsklick, <b>welche einzelne Karte du behältst</b>.
   Die übrigen wandern erst bei der endgültigen Beschwörung
   auf den Friedhof. <b>Alles abwählen</b> entfernt die
   gesamte Vorbereitung auf einmal, ohne Karten zu verlieren.
   Bereits vorbereitete Handfusionen können vor dem
   Ausspielen ebenfalls rückgängig gemacht werden; die
   eingesetzten Materialien und die Fusionskopie werden
   zurückgegeben. ACE-Monster bleiben als Fusionsmaterial gesperrt.</p>
   <h3>Seelenstoß und weitere aktive Fähigkeiten</h3>
   <p>Ein Seelenzehrer kann seine <b>aktiven</b>
   Fähigkeiten unmittelbar nach der Beschwörung
   <b>in ATK und DEF</b> einsetzen, sobald die
   jeweiligen Energiekosten und Abklingzeiten erfüllt sind.
   Der <b>passive</b> Seelenentzug bleibt DEF-gebunden.
   Die Buttons findest du in der <b>großen Monsteransicht</b>,
   nicht mehr lose unter den Kampfschaltflächen.
   Bei einer Seelenaktion blendet die gesamte Handkartenleiste
   aus; Seelenstoß bündelt violette Funken zu einem Orb,
   schießt einen Strahl zur gegnerischen LP-Anzeige
   und erzeugt eine violette Explosion mit Totenköpfen.
   Ein Seelenstoß verbraucht ab 40 gespeicherter
   Essenz den gesamten Vorrat und verursacht 130 % davon als
   LP-Schaden, vorbehaltlich Schild und Schutzregeln.</p>
   <h3>Was macht ein Unterstützer?</h3>
   <p>Ein <b>Unterstützer</b> ist ein taktisches
   Hilfsmonster. Solange mindestens ein Unterstützer
   <b>in DEF</b> auf deiner Seite steht, bekommen
   deine <b>normalen, nicht fusionierten</b> Angreifer
   einen <b>festen ATK-Zusatz</b>.
   Dieser beträgt 25 plus 8 Punkte je Level
   des angreifenden Monsters, höchstens 160 Punkte.
   Mehrere Unterstützer stapeln diesen Bonus nicht.
   Fusionierte Monster profitieren nicht davon.
   Beispiel: Ein normaler Angreifer auf Level 5
   erhält <b>+65 ATK</b>. Der Unterstützer
   selbst muss nicht angreifen, um zu helfen.</p>
   <h3>Lebenspunkte im Turnier</h3>
   <p>Training und Turnier I–III starten mit
   <b>2.000 LP</b> je Spieler. Von IV–VIII
   gelten <b>4.000 LP</b>, im Endspiel IX–X
   <b>8.000 LP</b>. Die Duo-Kampagne
   verwendet in denselben Stufen <b>4.000 /
   8.000 / 16.000 gemeinsame Team-LP</b>.
   Die fünf Spezialprüfungen der Fanatiker-Saga
   folgen einer passenden 2.000-/4.000-/8.000-Abstufung.
   Klassisches lokales PvP bleibt ein eigener
   Modus mit 8.000 LP.</p>`],
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
