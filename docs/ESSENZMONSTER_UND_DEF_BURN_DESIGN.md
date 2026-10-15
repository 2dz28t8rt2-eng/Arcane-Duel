# ARCANE DUEL – Essenzmonster, Spezialisierungen, Monsterrollen und DEF-Burn
**Entwicklungsentwurf v0.9 · 15.10.2026 · Branch `development` · noch NICHT implementiert**

Dieses Dokument hält die im Gespräch festgelegten Designentscheidungen für das NÄCHSTE große Gameplay-Update fest. 
**Statuskonvention:** **BESCHLOSSEN** = ausdrücklich vom Nutzer bestätigt; **TESTWERT** = im Balancing zu überprüfen; **OFFEN** = vor Umsetzung auszuhandeln. Keine Zahlen aus TESTWERT/OFFEN heimlich als finale Spielregel behandeln.

## A. Grundlegende Designphilosophie [BESCHLOSSEN]
- Drei konkurrenzfähige Strategien: **Predator/gewöhnliche Monster (Burst/Überzahl)**, **Fusion (Kombination/hochwertige Einzelmonster)**, **Verteidiger/DEF-Burn (Zermürbung, Energieaufnahme, Kontrolle)**.
- Nicht jedes Monster soll dieselbe Fähigkeit haben. Ausgewählte Monsterrollen: **Predator, Seelenzehrer, Wächter, Unterstützer, Fusions-/Runenweber, Jäger**.
- Monsterrollen und Fähigkeiten sollen auch im Lategame relevant bleiben, durch skalierende Fähigkeit, Ausbaustufen und reelle Gegenmaßnahmen. Keine generischen Gratis-Buffs für alle Karten.
- DEF soll taktisch eigenständig gewinnen können, nicht nur auf gegnerische Angriffe warten. **DEF als teilweise abbaubare Monster-HP** ist als fundamentale Regeländerung zur Simulation vorgesehen (nicht ohne Tests live schalten).
- Spezialmechaniken mit bestehendem Kreaturenzerfall, Fusion, Regeln, Kartenleveln, KI, Speicherständen und alten Challenges abstimmen; bestehendes PvP gesondert prüfen.

## B. Erste Spezialisierung & einmalige Kartenwahl [BESCHLOSSEN]
1. Nach einem noch exakt festzulegenden Turniersieg werden **drei einfache Pflichtübungen mit VORDEFINIERTEN LEIHDECKS** freigeschaltet – in dieser Reihenfolge: **Predator → Fusion → Verteidiger**. Gleicher freundlicher Zugang wie die anfänglichen Trainingskämpfe; freies Hauptdeck bleibt unverändert.
2. Erst nach allen drei bestandenen Übungen folgt ein ausführliches, eindeutiges Tutorial: **(a)** eine von drei einzigartigen **Essenzmonster-Karten** wählen, **(b)** einen passiven Spezialisierungs-Perk wählen. Beides sind explizit getrennte Entscheidungen.
3. **Die exklusive Essenzmonster-Karte ist für diesen Spielstand endgültig:** nicht wechseln; die beiden nicht gewählten Essenzmonster sind später nicht erhältlich. In der UI vor Bestätigung ausdrücklich „UNWIDERRUFLICH“ und die Konsequenz nennen. Besitz und Bindung im Spielstand sichern.
4. **Der passive Spezialisierungs-Perk ist grundsätzlich wechselbar**, aber der Wechsel muss aufwendig sein und bewusst erlernt werden. **Essenzmonster bleibt bei Wechsel erhalten**.
5. **Karte + passender Perk** aktivieren eine **einzigartige Resonanzkraft**. Bei anderem Perk entfällt nur die zusätzliche Resonanz; die Karte bleibt vollständig nutzbar und behält ihre Evolution/Grundfähigkeit.
6. Tutorial enthält den subtilen Lore-Hinweis, der Wechsel sei „der Legende nach in alten Schriften verborgen“; **keinen offensichtlich sichtbaren Wechselbutton oder Questauftrag im normalen UI**.

## C. Der geheime Perk-Wechsel [BESCHLOSSEN]
- Nach Erst-Spezialisierung erscheint **unauffällig** im Regel-Lexikon ein neues Kapitel „Spezialisierung / Das Bündnis der Essenzwesen“.
- Lore: Essenzwesen sind **eigenständige, eigennützige Geschöpfe**, die sich von menschlicher Essenz ernähren. Sie sind keine willenlosen Diener; sie kooperieren aus eigenem Entschluss, weil ihnen die Bindung Wachstum bringt. Menschen profitieren von ihren Kräften; das Bündnis ist zugleich eine Abhängigkeit. Das Kapitel erklärt explizit den Bonus der Kombination aus Karte + passendem Perk und dessen Verlust beim Wechsel.
- **Erst nachdem der Spieler dieses Kapitel bewusst gelesen hat**, wird die Option für eine geheime Umspezialisierungsprüfung freigeschaltet. Robust gestalten: nachvollziehbare Lesebestätigung am Kapitelende („Geheime Schrift entziffern“) statt technisch unzuverlässiger Scroll-Erkennung; keine öffentliche Werbung in Tagesquests.
- Der Spieler muss die Wechselreihe **selbst starten**. Fünf aufeinander aufbauende, immer schwierigere **Missionskämpfe mit passenden Leihdecks** lehren die neu gewünschte Strategie; ein paar Essenz als **kleine Fortschrittsbelohnung pro Mission**.
- Reihe jederzeit abbrechbar/pausierbar; alter Perk bleibt bis zu erfolgreichem Abschluss **aller fünf Kämpfe** und Bezahlen einer **spürbaren, progressionsangepassten Essenzgebühr** aktiv. Keine Änderung der exklusiven Karte.
- Wiederholte Wechsel nicht trivial farmbar (Kosten, Übung und ggf. Limit auf manuelle Duelle prüfen). Freie Belohnungs-Exploits mit Leihdecks vermeiden.
- **OFFEN:** genauer Meilenstein der Erstwahl; Essenzkosten-/Wechselkonditionen und Belohnungen; welche Folgequests je Schule.

## D. Essenzmonster: Karrierebegleiter [BESCHLOSSEN]
- Ein einzigartiges, nicht austauschbares **„Essenzmonster“**, das durch die gesamte Turnierprogression begleitet.
- **Automatische Evolution** zu neuen Formen/Stufen bei vorgegebenen Turnier-Meilensteinen, *ohne* zusätzliche Essenzhürde: der Spieler kann alle Formen zuverlässig erleben.
- Verstärkungen der aktuellen Form über **bewusst investierte Essenz**; **harte Verstärkungs- und Level-Caps je Turnierfortschritt**, damit kein endloses Farmen unfairen Frühspiel-Vorsprung ermöglicht.
- Ernährung nur, wenn die Essenzmonster-Karte beim betreffenden Duell tatsächlich im **aktiven Hauptdeck** war. In der Decktruhe/inaktiv: **0**.
- Passive Ernährung: **5 % der tatsächlich nach dem Duell erhaltenen Essenzbelohnung** (z.B. Belohnung 1.000 → mindestens 50 Essenz fürs Monster, wenn im Deck). Zusätzlich **fix +2 Essenz je gegnerischem Monster, das das Essenzmonster selbst zerstört**, und **fix +3 Essenz je Zug, den das Essenzmonster auf dem Feld bleibt**. Keine zusätzlichen Prozent-Sätze für diese aktiven Leistungen.
- Progressionsschwellen in **niedrigen Hunderterbeträgen** skalieren; mit höheren Turnierstufen höhere Caps/Anforderungen. Passive Einspeisung/Verstärkung/Event-Aufzeichnung und UI nachvollziehbar darstellen.
- **OFFEN ZUR IMPLEMENTIERUNG:** Werden +2/+3 vollständig aus der tatsächlich verdienten Duell-Essenz umgebucht (Nahrungsabzug aus Spielerreward) oder als gesonderte geschöpfinterne Ressource erzeugt? Wie werden Verluste/0-Essenz und Auto-Duelle behandelt? Exploits mit wiederholtem Einsatz/Summoning verhindern. 5 % müssen nicht doppelt abgezogen werden, keine Überziehung bei geringen Belohnungen.
- Essenzmonster nicht verkaufen/zerlegen/verlieren können; als Deckkarte entfernbar, ohne die Bindung zu verlieren.
- **Essenzmonster Predator (spezifische Resonanz-/Spezialkraft, Entwurf):** Über große Kreaturenkarte steuerbare Wahl pro EIGENEM Zug: **ein Angriff mit 100 %** ODER **zwei Angriffe mit je 70 % Angriffskraft**; Moduswahl maximal **einmal pro Zug**, Wechsel nur kontrolliert vor Angriffen, kein mehrfaches Zurücksetzen/Ausnutzen von Angriffseffekten.
- **Essenzmonster Verteidiger (Entwurf):** erster vom Gegner deklarierter Angriff muss, sofern legal erreichbar, dieses Monster treffen; Schaden dieses ersten Angriffs gegen es **–50 %**. Erzwungene Zielwahl sauber in KI und PvP berücksichtigen; kein Angriffszwang für Gegner.
- **Essenzmonster Fusion (Entwurf):** solange diese Karte auf Feld liegt, erhalten alle eigenen Fusionen **zusätzliche Qualitäts-/Wertewürfe**; aktuell vorhandenes Maximum (bis vier Würfe) prüfen und Cap transparent festlegen, Stapeln vermeiden.
- Grundfähigkeiten vs. reine **Resonanzkräfte** mit zum Essenzmonster passendem Perk vor Freischaltung klar unterscheiden.
- **OFFEN:** genaue Evolutionen/Level-Bänder/Essenzbedarf/Preisprogression; neue Kartenwerte und Bildrahmen.

## E. Seelenzehrer / DEF-Burn [BESCHLOSSEN mit TESTWERTEN]
- Nur **ausgewählte Monster mit Seelenzehrer-Fähigkeit** erhalten diese Funktion, **nicht alle DEF-Monster**.
- In DEF-Position zehrt ein Seelenzehrer **von jedem gegnerischen Monster**, auch wenn der Gegner selbst nicht angreift. Zu Beginn **–10 ATK UND –10 DEF je gegnerischem Monster und betreffendem Auslösezug**, plus **ein Würfelwurf pro eigenem Monster-Level je gegnerischem Monster**; jeder Wurf entzieht **weitere 5 von zufällig ATK ODER DEF**. Beispiel LV4 insgesamt 20+4×5=40 Punkte *je gegnerischem Monster*, LV10: 20+10×5=70 (mit Maximumsgrenzen der Zielwerte).
- Zufallswürfe dürfen keine bereits auf 0 gefallenen Werte weiter „leer“ absaugen. **Nur wirklich verlorene Werte** erzeugen absorbierte Energie. Weder natürlicher Zerfall noch zusätzlicher Energieentzug soll doppelt gezählt werden.
- Absorbierte Seelenenergie verleiht dem Seelenzehrer **temporäre zusätzliche DEF**, separat von Grund-DEF protokollieren; die erworbene Bonus-DEF hat **erhöhten besonderen Zerfall** und ihr Verlust verwandelt sich in Burn.
- **Natürlicher Verfall der gespeicherten Seelen-DEF:** 100 % der verlorenen Seelen-DEF als LP-Burn beim gegnerischen Duellanten (TESTWERT für Umwandlung 1:1).
- **Seelen-DEF durch gegnerischen Angriff zerstört:** die verlorene Energie darf nicht „verpuffen“; nur **50 %** davon wird zu LP-Burn beim Angreifer-Duellanten (TESTWERT). Diese Energie ist danach weg und darf NICHT erneut natürlich verfallen.
- Keine vorschnelle pauschale Reduktion auf 30–50 % Speicherwirkungsgrad oder globales Burn-Limit: spätes PvE hat Burst, starke Fusionen, bis zu ~10.000 LP als mögliche Zielgröße; reale aktuelle PvE-LP-Kurve und anvisierte 10.000 explizit auseinanderhalten.
- Mehrere Seelenzehrer synergetisch, aber ohne negative Statwerte, Bonus-Energie aus Nullwerten oder unbegrenzte Mehrfachverbuchung.

### Energiearten / Alternative [BESCHLOSSEN, Umsetzungsschnittstelle OFFEN]
- **Automatischer Burn** beim besonderen Seelen-DEF-Verfall ist Standard.
- Einzelne Elite-Seelenzehrer dürfen **aktiv entladen**. Ein besonderer **Wächter-/Buffer-Typ** kann anderen Seelenzehrern die aktive Entladung temporär verleihen. Aktive Entladung verbraucht Energie genau einmal; keine Doppelverwertung.
- **„Verdichten“:** bewusster DEF-Modus. Vorübergehender zusätzlicher Schutz wird über drei **eigene Zugenden** zu jeweils **1/3 des ursprünglichen Verdichtungsbonus** abgebaut, ohne zusätzlichen Zerfall/Burn für diesen verdichteten Anteil. Kein sofortiges Wiederauffüllen/Spammen.
- Die Nutzerforderung „Verdichten nur, wenn keine überschüssige DEF existiert“ und die Idee „vorhandene Seelenenergie zu DEF verdichten“ widersprechen sich wörtlich. **OFFEN: sauber unterscheiden zwischen absorbierter Seelen-DEF, verfügbarem Energievorrat und bereits laufender Verdichtung.** Plausibler Lösungsansatz: Verdichtung einmal bei verfügbaren Seelenpunkten möglich, aber kein Recast, solange verdichtete DEF aktiv ist. Vor Coding ausdrücklich festlegen.

### Stufe, Priorität, Lebensraub [BESCHLOSSEN / TESTWERTE]
- Seelenzehrer-Fähigkeit hat **Ausbauränge 1–5**, mit wachsender Lategame-Relevanz und Spezialvarianten (Schwarm-, gezielter ATK-, gezielter DEF-Zehrer).
- Bei **Rang 3** darf der Spieler eine ATK-/DEF-Entzugspräferenz wählen. Keine vollständige Ausschaltung des anderen Werts; z.B. **75/25-Würfelgewichtung** als Testwert.
- **DEF-Zehrer heilt den eigenen Duellanten** zunächst um **30 % der tatsächlich entzogenen DEF** (Testwert; mögliche 50 % später), maximal bis zum regulären LP-Limit. Besonders **Blocker-vs-Blocker** und DEF als Monster-HP ausbalancieren, da DEF-Entzug bereits gegnerische Widerstandskraft mindert.
- Rang 4–5/hohe Monsterlevel müssen skalieren, ohne jede Runde unendlich LP zu heilen.

## F. Verteidiger-Perk „Bollwerk“ [BESCHLOSSEN]
- Gilt **nur für als Verteidiger klassifizierte Monster**, nicht jeden beliebigen ATK-Predator, der kurz in DEF gedreht wurde.
- **Perk-Rang 1:** **–15 % normaler Grundwertzerfall** in DEF.
- **Rang 2:** Zerfallsreduktion bleibt **15 %**, plus **kleiner Energieaufnahmebonus**.
- **Rang 3:** **–25 % normaler Grundwertzerfall**.
- **Rang 4:** **stärkerer Energieaufnahmebonus**.
- **Rang 5:** zusätzliche im Lategame signifikante **passive Fähigkeit**, nicht bloß +5/10 Statuspunkte; konkreten Mechanismus mit Lategame-Tests entscheiden.
- Grundwertzerfall ist separat von dem bewusst beschleunigten Zerfall der gespeicherten Seelen-DEF; ersteren reduziert der Perk, letzteren **nicht**.

## G. DEF als Monster-HP, Gegenschlag und Wächter [BESCHLOSSEN als Ziel; Details OFFEN]
- DEF als angreifbare **Monster-HP**, sodass auch mehrere schwächere Predator-Angriffe einen großen Verteidiger zerstören können. One-Hit bei ausreichendem Schaden möglich. Normale ATK-Zerstörung, DEF-Stellungen, Angriffshäufigkeit und Altsystem-Rückstoß neu abstimmen.
- Verteidiger erhalten sinnvolle **moderate ATK** statt 0 (früh etwa 100–300, spät bis etwa 500 als Richtung), die Gegenangriffe ermöglicht.
- **Regeltext Gegenschlag (vorläufig):** „Wird ein Monster mit der Fähigkeit 'Gegenschlag' in Verteidigungsposition von einem gegnerischen Monster angegriffen, erleidet der angreifende Duellant direkten LP-Schaden in Höhe von **50 % der Grund-ATK** des Verteidigers.“ Schildinteraktion und Rundung festlegen; nicht versehentlich **zusätzlich** zum klassischen Rückstoß denselben Angriff doppelt verrechnen.
- **OFFEN:** Haben alle Verteidiger nativ Gegenschlag oder gewährt ein Wächter manchen Verteidigern diese Fähigkeit? Anzugsmoment bei One-Hit, PvP, Schilde und Wiederholungsangriffe festlegen.
- **Bastionswächter**: schützt andere Monster, reduziert deren Zerfall und **heilt beschädigte Monster-HP/Grund-DEF** im Laufe eigener Züge; skaliert mit Monsterlevel, keine Überheilung über zulässigen Grundwert.
- **Runen-/Unterstützungswächter**: verleiht ausgewählten Seelenzehrern aktives Entladen.
- Beide Wächter müssen eigene Schwächen besitzen und selbst anvisierbar sein; Anti-Stall und Counterplay gegen geschützte Burn-Schwärme unbedingt prüfen.

## H. Balance und technische Qualität [BESCHLOSSEN]
- **Nichts blind global buffen.** Getrennte Regeln/isolierter Prototyp, anschließend Simulationen mit echten Fortschrittsdecks, mehreren KI-Rollen, 4k/6k/8k LP und ggf. anvisierten 10k LP.
- Besonders testen: late-game Burst vs. DEF-Setup, Seelenzehrer-Schwarm vs. Schwarmgegner, gegnerische Monster mit null Werten, Heilung Blocker-vs.-Blocker, Energiedoppelverbrauch, Guard-Loop, Attacken gegen mehrteilige Monster-HP, alte Fusionsboni und 4-Würfel-Grenze.
- Bestehender Analyse-Testläufer: `tests/battle-simulator.cjs`; Benchmarkprotokoll `tests/BALANCE_BASELINE.md`; isolierter Berechnungskern `assets/strategy-engine.js`. Kontrollgruppe anhand derselben Seeds, kein Missbrauch synthetischer Winrates als Spielererfahrung.
- Save-Validierung/Migration, **einmalige** exklusive Kartenwahl, unverlierbare Essenzmonster-ID, Game-Over, Spielstand-Export/-Import und geheimen Queststatus als Integrations- und Regressionstests hinzufügen.
- Aktuelle Challenges/Deckberater/Fusionsvorschau bewahren, Lexikon aktualisieren. `development` zuerst, `main` nur auf gesondertes Go.

## I. Noch vor Implementierung eindeutig klären [OFFEN]
1. Verdichten vs. „nur wenn keine überschüssige DEF“: Wie genau werden Reservoire/Soul-DEF/verdichtete DEF voneinander getrennt?
2. Gegenschlag: per Monsterfähigkeit ODER nur über Wächter an ausgewählte Verteidiger? Ob tödliche Treffer Gegenschlag auslösen, und Verhältnis zum alten Rückstoß.
3. Wann genau sind Erst-Spezialisierungsübungen verfügbar, wie hoch sind Umspezialisierungskosten/Belohnungen?
4. Essenz-Bonus +2 je Kill/+3 je Feldzug: ausschließlich Umverteilung der Duellbelohnung oder zusätzliche eigens gespeicherte Energie? 5 % sicher aus Belohnung und auf aktive Deckteilnahme beschränkt.
5. Werte/Stufen/Schutz/Healing-/Energy-Caps und Lategame-Rang-5-Effekt erst nach Simulation festlegen.

**WICHTIG:** Dieses Dokument hält Gesprächsbeschlüsse und offene Designfragen fest. Es löst ausdrücklich KEINE automatische Implementierung aus.
