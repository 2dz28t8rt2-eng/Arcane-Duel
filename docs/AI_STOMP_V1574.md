# Arcane Duel · KI-Lehrplan v15.74: Fusions-Stomp / Energiekosten

Stand: 27.10.2026 · **Forschungs-KI, Singleplayer-Simulation** · Versionsbasis `assets/fusion-stomp-v200.js`.

## Magische Grundregel

Jede Kreatur ist durch gebündelte Essenz aufrechterhalten. Passiver Zerfall verbraucht
Kraft pro Runde; **jeder Angriff** verbraucht zusätzlich gebundene Kraft. Ein
Monster verliert bei jedem tatsächlich getroffenen Ziel **3 % der ATK und 3 %
der DEF** seiner Werte unmittelbar vor dem Angriff. Die Kosten werden für alle
getroffenen Ziele auf derselben Ausgangsbasis berechnet. Die früher pauschalen
30 ATK Angriffskosten gelten nicht mehr. In der Trainingsarena sind passiver
Rundenzerfall und Angriffssperren je Phase gesondert schaltbar; Angriffskosten
dürfen dabei nicht vergessen werden.

## Legale Stomp-Regeln

| Verwendete Materialien | Hauptziel | Nebenziel(e) aus Sicht des Angreifers | maximale Ziele | Angriffskosten |
| --- | ---: | --- | ---: | ---: |
| 2 | 100 % | keine | 1 | 3 % ATK + DEF |
| 3 | 100 % | rechts 70 %, ersatzweise links | 2 | 6 % ATK + DEF |
| 4 | 100 % | rechts 50 %, links 50 % | 3 | 9 % ATK + DEF |
| 5 | 100 % | rechts 50 %, links 50 %, zweites rechts 30 % (Fallback links) | 4 | 12 % ATK + DEF |

- Die Reihenfolge der Plätze ist bei Spieler 2 gespiegelt. Leere Plätze
  verursachen **keinen Treffer und keine zusätzlichen Kosten**. Niemals ein
  Monster zweimal in demselben Stomp treffen.
- Jeder Gegner wird mit seinem **eigenen** effektiven Angriffswert und der
  jeweiligen Nebenquote berechnet. Das Hauptziel folgt den regulären Duellregeln.
- Nebentreffer auf **ATK**: Reicht die Trefferstärke für den gegnerischen
  ATK-Wert, wird das Monster vernichtet. Sonst verliert es DEF, obwohl es in
  ATK-Position bleibt; bei DEF = 0 stirbt es ebenfalls.
- Nebentreffer auf **DEF**: Rüstung und vorhandene Seelen-/Verdichtungsreserven
  beachten. Bei Wächter/Seelenzehrer in DEF kann ein Gegenschlag die LP des
  angreifenden Magiers treffen. Bei Nebentreffern hat er nur **40 %** der
  normalen Gegenschlagstärke (Hauptziel unverändert).
- Resonator-Material: zufällig +2 bis +4 Prozentpunkte auf die **Nebentreffer**.
  Allrounder-Material: +1 bis +2. Zufall bei Fusion, nicht bei jedem Angriff.
  Maximal **+12 Prozentpunkte** aus beiden Quellen zusammen, Hauptziel 100 %.
- Fusionen werden nur über **legale echte Materialien und das Fusionsdeck**
  erzeugt. Materialkosten, verbrauchte Feldmonster, Angriffssperren und
  gegnerische Antwortzüge dürfen niemals durch Testtricks umgangen werden.

## Entscheidungsmatrix für die KI

| Strategie | Vorteile | Nachteile / Konter | Anweisung |
| --- | --- | --- | --- |
| Große Fusion (3–5) | Mehrere Feldgegner, hohe Gesamtschadenswirkung, bedroht schwache Predator-Rudel | 3–4 Materialkarten gebunden, 6–12 % Selbstverbrauch, Wächter-Gegenschläge auf LP, ein geschwächter Einzelkörper wird angreifbar | Stomp-Nutzen **aller** Ziele minus Materialkosten, Gegenschläge, Kraftverlust und beste gegnerische Predator-Antwort rechnen; nicht automatisch die größte Fusion wählen |
| Kleine Fusion (2) | Schonender Ressourceneinsatz, flexible zweite Fusion, nur 3 % Angriffskosten | Kein Flächenschaden, weniger Druck gegen breite Felder | Besser, wenn nur ein gegnerisches Ziel oder wenige Materialien verfügbar sind |
| Predator | Rudel-/Alpha-Angriffsboni, Markierung und Folgeangriffe, Rüstungsdurchdringung gegen DEF-Wächter | Niedrige DEF wird von Nebentreffern beschädigt; breites Rudel ist anfällig gegen Stomp | Vor Stomp-Explosion möglichst Hauptfusion angreifen; **nach** ihrem Stomp die gesunkene ATK mit eigenen Angriffswerten vergleichen und Schwächefenster ausnutzen |
| Wächter | Hohe DEF, reduziert einschlagende DEF-Schäden, normale bzw. abgeschwächte Stomp-Gegenschläge wirken auf Spieler-LP | Predator-Rüstungsdurchdringung, Seelenzerfall, massiver Fokus-Druck | Hohe DEF und LP-Gegenschlagsrisiko beim Angriff vorab simulieren; nicht blind alles in DEF stellen |
| Seelenzehrer | Verdichten, Seelenreserve/Seelenentzug, zeitlicher Durchhaltewert | Niedrige ATK kann von Stomp trotz Seelenreserve zerstört werden; Fähigkeiten und Cooldowns binden Aktionen | Defensive Schichten und erlaubte Aktivfähigkeiten real rechnen, Wert über mehrere Züge beurteilen |
| Resonator / Allrounder | Resonanz und Materialbonus auf Nebenstrahlen, flexibler Fusionsaufbau | Eingesetzte Karten sind echte Ressourcen; +12-Punkte-Deckel begrenzt Stapeln | Nur den **tatsächlich gewürfelten** Stomp-Bonus der entstandenen Fusion verwenden, keine Fantasie-Prozente |

## Vier Prioritäten für die Test-KI

1. **Legalität**: Kandidaten aus realen Zuständen und legalen 2–5-Material-
   Beschwörungen, getrennte Rollen und korrektes Starthand-/Deck-Mirroring.
2. **Gleichzeitige Wirkungen**: Erst Primärziel, dann eindeutige Nachbarziele,
   zerstörte Monster / reduzierte DEF, Spieler-LP-Rückschläge.
3. **Nachhaltigkeit**: 3 % ATK/DEF *tatsächlich* getroffene Ziele; 3–5 Karten
   einzusetzen muss durch zukünftigen Nutzen aufgewogen werden.
4. **Antwort des Gegners**: Mindestens den nächsten legalen Angriff und die
   besonders gefährlichen Predator-Gegenangriffe auf die geschwächte Fusion
   durchrechnen. Treffer auf Wächter dürfen keine kostenlosen Multikills sein.

## Forschungsdesign (keine Spieländerungen)

- Vergleichsanker: bisher eingefrorener Champion und sein Q-/Endgame-Stand,
  identische Gegner-/Seed- und Startspieler-Paare, getrennte ARM-Kandidaten.
- Challenger: legaler 3–5-Material-Fusionssucher **plus** tatsächlich
  ausgeführte Stomp-Nebentreffer, Kraftkosten, Defender-LP-Gegenschläge,
  Predator-Antwortfenster in seiner Kandidaten- und Angriffsbewertung.
- Gleiche ausgereizte Trainingsszenarien für Predator-Rudel, gemischte
  Verteidigung, Level-10-Decks, Feldaufbau und spätere Zugfolgen.
- Phase TRAIN lernt; VALIDATION wählt unter unveränderten Sicherheitskriterien.
  HOLDOUT bleibt bis zur festgelegten Endauswertung versiegelt.
- Erfassung nach Materialanzahl: legal / simuliert / angeboten, tatsächlich
  gewählt, Treffer pro Ziel, Monster-Vernichtungen, DEF-Schaden, LP-Gegenschlag,
  Selbstverbrauch, Predator-Gegenkills, Gewinnrate und Startspieler-Differenz.
- Ein positiver Effekt gegen einen Gegner wird **nicht** als allgemeiner
  Balancing-Beweis interpretiert. Besonders Predator-Folgeangriff und
  Verteidiger-/Seelen-Untergruppen separat prüfen.

**Nicht bereits implementiert:** Spezielle zusätzliche rohwertbasierte
Predator-/Wächter-Materialprozente und ein neuer dreirundiger
Seelenzehrer-Materialbuff sind Designideen, kein Bestandteil des v20.0-Stomps.
Es wird weder im Training noch im Bericht behauptet, dass sie schon wirken.
Die separate 2v2-Kampflogik verwendet noch nicht die neue Stomp-Regel.
