# Arcane Duel – Taktischer Verteidiger-Balancetest
**17. Oktober 2026 · `development`**  
**Gameplay:** identischer Stand zum Defender-Update `af4cd803`; seitdem nur zusätzliche QA-Skripte und Workflow-Automatisierung, keine weiteren Kampfwerte verändert.

## Reproduzierbare Läufe
- [384 gleich-seedige Verteidiger-Stresstests](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39050585017) · `tests/qa-soul-pressure-matches.cjs`
- [216 echte Feldfusions-Duelle mit gespeicherter Energie](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39050790114) · `tests/qa-charged-field-fusion-matches.cjs`
- [384 vorausgehende Vergleiche mit schwächerem Gegnerdruck](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39050390413) · `tests/qa-tight-soul-matches.cjs`

Die Tests führen die **tatsächliche JavaScript-Spielruntime** aus, benutzen aber gezielt zusammengestellte, nach Herkunft eingeschränkte Decks und geskriptete, gleiche Verteidiger-Startpositionen. Die verschärfte Gegnerstärke wird nur innerhalb dieser Vergleichstests gesetzt, **nicht im Spiel**. Getestete 'Pressure'-Faktoren 1,5 und 2,0 auf die NPC-Statik, beim Feldfusionstest auf gültiges NPC-Power-Limit 2 gedeckelt. Keine Rückschlüsse auf reale menschliche Siegraten oder legitimen Kartenerwerb möglich.

## 1. Taktische Seelenaktionen: 384 Stress-Einzelduelle

Je 16 festgelegte Seeds pro Turnierstufe, Gegnerdruck und Taktik. Das jeweils identische Startfeld enthält einen Seelenzehrer in DEF. Strategien: passiver Entzug, adaptiv (Seelenraub / Entladen bei möglichem Kill / Verdichten bei hohem Druck), offensiv (Seelenraub und frühes Entladen).

### Faktor 1,5

| Turnierstufe | Passiv (Siege; Ø Züge) | Adaptiv | Offensiv | Fähigkeitsnutzung |
|---|---|---|---|---|
| III | 16/16; 12,56 | 16/16; 11,19 | 16/16; 10,13 | 31 Seelenraub + 7 Entladungen (adaptiv); 25 + 37 (offensiv) |
| V | 16/16; 10,56 | 16/16; 10,50 | 16/16; 10,56 | Selten; adaptiv 4 Raub / 1 Entladung / 2 Verdichtungen |
| VII | 16/16; 12,13 | 16/16; 12,13 | 16/16; 12,13 | Keine |
| IX | 16/16; 13,50 | 16/16; 13,50 | 16/16; 13,50 | Keine |

Auf III verkürzte der offensive Spielstil die durchschnittliche Duelllänge um **19,3 %** (12,56 → 10,13 Züge); die Siegrate war jedoch ohnehin vollständig gesättigt.

### Faktor 2,0

| Turnierstufe | Passiv | Adaptiv | Offensiv | Aktive Nutzungen |
|---|---|---|---|---|
| III | 16/16 | 16/16 | 16/16 | 0 |
| V | 12/16 | 12/16 | 12/16 | 0 |
| VII | 16/16 | 16/16 | 16/16 | 0 |
| IX | 15/16 | 15/16 | 15/16 | 0 |

Keine Runtime-Ausnahmen. Ein Mangel des Testspielers: Aktive Fähigkeiten werden **am Anfang des eigenen Halbzugs** geprüft; der Gegner hat dort häufig kein gültiges Feldziel. Bei Faktor 2 wurde die Fähigkeit kein einziges Mal genutzt. Der Versuch zeigt dann nur die Passivwirkung, nicht den Wert einer optimalen Fähigkeitstaktik.

## 2. Geladene Feldfusionen: 216 Duelle

Echte Transaktionswege `prepareNormal()` + `placePending()` mit identischem Material, gleichem Seed und nur abweichender angesparter Seelenenergie:

| Auf Feldmaterial gespeicherte Energie | DEF-Erbbonus | Übernommene Seelenenergie |
|---:|---:|---:|
| 0 | 0 | 0 |
| 200 | +60 | +60 |
| 400 | +120 | +120 |

Drei Turnierstufen IV/VI/VIII, zwei künstliche Druckniveaus, je zwölf Seeds und drei Energievarianten. **216/216 echte Feldfusionen korrekt abgeschlossen**, 0 Exceptions, 0 ungültige Snapshots. Verbrauchte Materialien trugen die benutzte Energie danach nicht mehr.

- Bei Druck 1,5: **12/12 Siege** auf allen Stufen und mit allen drei Energiemengen.
- Bei Druck 2,0: IV jeweils **11/12**, VI und VIII **12/12**, ebenfalls ohne Unterschied zwischen den Energiemengen.
- Laufzeit und verbleibende LP änderten sich leicht und nicht konsistent mit höherer Ladung.
- Die geringe beobachtete Differenz ist **kein Beleg**, dass Feldfusions-Energie strategisch nutzlos ist: Der Fusionsbot spielt weiterhin wenig ressourcenbewusst, und die synthetisch wählbaren Fusionen können die Gegner schon ohne Bonus besiegen.

### Korrigierter Testfehler
Der erste Test setzte NPC-Power oberhalb der ausdrücklich erlaubten Save-Grenze von 2,0. Dadurch scheiterten ausschließlich die künstlichen Snapshots. Das **war kein Fehler der normalen Spielmechanik**; nach der gültigen Testbegrenzung liefen alle 216 Vergleichsduelle erfolgreich.

## 3. Technische Erkenntnisse

- **Keine bestätigte neue Runtime-Fehlerquelle** aus den gültigen Versuchen.
- Die aktive Fähigkeit `soulRaid` wird von der Standard-KI nicht benutzt. Daher unterschätzen reguläre Turniersimulationen offensive Seelenzehrerstrategien.
- Für die Bewertung des aktiven Seelenraubs ist die Verfügbarkeit eines gegnerischen Ziels der entscheidende Engpass.
- Die Fähigkeit `Verdichten` wurde im Stresstest äußerst selten gewählt; dieser Bot ist dafür **kein** valider Balancetest.
- Charged-Feldfusionen werden korrekt gespeichert, der zusätzliche DEF-Bonus und Soul-Transfer sind begrenzt und reproduzierbar.

## 4. Empfohlene Reihenfolge für das nächste Update

1. **Taktik-Tester verbessern (kein Gameplay-Buff):** Im isolierten Simulationsbot Fähigkeitswahl nach eigenen Feldaktionen und gegnerischer Beschwörung testen; nach gegnerischem Angriff die Seelenenergie/Positionen beobachten. Getrennte Entscheidungslogik für Seelenraub, Verdichten und Entladen; Aktivitätsquote als eigene Metrik.
2. **Echte Deckinventare:** Vom gespeicherten Fortschritt aus Fusions-/Shop-/Questkarrieren Gegner und Spieler mit vergleichbarer Gesamtstärke paaren. Dabei Defensiv- und Offensivduelle in knappem Leistungsband untersuchen statt bereits übermächtiger Decks.
3. **Benutzerführung:** Gesammelte Seelenenergie und erwarteten Bonus bereits in der Feldfusionsauswahl einblenden; nach der Fusion eine klare Anzeige, was genau übernommen wurde. Das hat unmittelbaren Nutzen ohne Balancing-Risiko.
4. **Vorläufig keine pauschale Erhöhung der Zahlen:** DEF-Faktor 1,35, Umwandlung 1,5 und 30%-Feldfusionserbe beibehalten, bis man beim sinnvollen aktiven Einsatz einen stabilen Vor- oder Nachteil messen kann.
5. **Weitere gesonderte QA:** Zielauswahl der neuen Fähigkeiten und Fusion mit Seelenenergie in einem echten Mobilbrowser (Touch und Animationen).
6. **Turnierstufen IV/V/IX unverändert lassen**, wie vom Nutzer entschieden; Progressionshinweise weiter evaluieren.

**Essenzbelohnung bei verlorenen Turnieren** und **Niedrigrang-Kombosystem** wurden in diesen QA-Commits nicht verändert.
