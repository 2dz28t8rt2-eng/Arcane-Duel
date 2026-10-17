# Arcane Duel – QA und Balanceprüfung vom 17.10.2026

**Getesteter Commit:** `ea857556405061377d1d5d00c07ad3aca09f0c59` auf `development`  
**Automatische Tests:** 329/329 bestanden; Headless-Chromium-Prüfungen erfolgreich.  
**GitHub Actions:** [Strategietests](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39028699708) · [Node- und Browser-Suite](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39028699690).

## Reproduzierbare Versuche

### 600 einzelne PvE-Turnierduelle

Auf allen Stufen I–X jeweils 15 Seeds pro Ansatz (`node tests/battle-simulator.cjs --samples 15 --json`):

| Strategie | Siege / 150 | Hinweis |
|---|---:|---|
| Angriff | 150 | Nahezu keine Fusionen nötig |
| Ausgewogen | 150 | Nahezu keine Fusionen nötig |
| Verteidigung | 144 | Mehr Züge und häufiger Fusionen, IX nur 11/15 und X 13/15 |
| Niedrigstufiges Deck | 1 | Ohne gezielte Spezialtaktik fast wirkungslos |

Die Decks sind **synthetisch optimiert**, mit stufenabhängigem Quellenpool statt real erworbenem Inventar. Keine Aussage über tatsächliche Human-Winrates; die KI kann Fusionen auch für defensive Ansätze einsetzen. Keine Engine-Ausnahmen.

### 24 einfache zusammenhängende Turnierrouten

`node tests/evolution-full-tournament-audit.cjs` mit maximal 35 Versuchen pro Stufe, Duellbelohnungen und automatischem Decktausch aus Inventar (aber **ohne** vollwertige Kauf-/Werkstattplanung):

| KI | I–X vollständig |
|---|---:|
| Balanced | 1/8 |
| Offensive | 0/8 |
| Economy | 0/8 |

0 Engine-Ausnahmen. Diese Methode unterschätzt aktive Investitionsstrategien.

### 42 zusätzliche Fortschrittskarrieren aus der vollständigen 329er-Testsuite

Aus `tests/progression-real-inventory-audit.test.cjs` mit echten Belohnungs-/Inventar-/Kauf-/Werkstattfunktionen:

| Szenario | Vollständige Abschlüsse |
|---|---:|
| 12 Versuche je Stufe, Spar-/Investitionspläne ohne erweiterte Quest- und Pack-Auswertung | 0/12; alle scheitern an IV |
| Bis zu 30 Versuche je Stufe, Einkäufe, Crafting, Quests und Charakterpacks | 3/6 |
| Fusion-3.1-Inventarprogression, 30 Versuche je Stufe | 9/12 |
| Rollenspezialisierte Inventarprogression, 30 Versuche je Stufe | 9/12 |

Im Fusion-3.1-Szenario waren die durchschnittlichen Turnierversuche bei Stufe IV **15,3** und V **11,5**; im Spezialisten-Szenario IV **16,8**, V **13,0** und IX **14,6**. Das sind konkrete Hindernisse trotz möglicher Gesamtabschlüsse. Alle Spielstandsvalidierungen bestanden, keine Runtime-Ausnahmen.

## Priorisierte Balancebefunde

1. **P1 – Problem beim Übergang III → IV und bei V:** Mit kurzer, oberflächlicher Progression 12/12 Karrieren an IV blockiert. Erst gezielter Ressourceneinsatz, mehr Versuche und Nutzung zusätzlicher Rewards erleichtern den weiteren Fortschritt. Einsteigerführung für Shop, Werkstatt, Packs und Fusionen sowie bezahlbare, garantierte Zwischenziele prüfen, bevor Gegner pauschal geschwächt werden.
2. **P1 – Stufe IX als zweiter Engpass:** Rollenspezialisierte Läufe benötigten im Mittel 14,6 Versuche und zwei Karrieren stoppten nach VIII; ein gezielter Stufen-IX-Vergleich mit realistisch erreichbaren Karten und Upgrades wird empfohlen.
3. **P1 – Niedrigrangige Strategien nicht konkurrenzfähig im Standardbot:** nur 1/150 Siege. Poker-/Kombinationsboni mit einer **eigenen spezialisierten KI** und zugehörigen Herausforderungen prüfen; der gegenwärtige Economy-Bot optimiert nicht gezielt auf alle Sonderboni.
4. **P2 – Offensivstrategie übertrifft DEF im synthetischen Vergleich:** Angriff 150/150 und meist ohne Fusion; Verteidigung 144/150 mit oft 4–7 Fusionen. IX: DEF 11/15 vs. Angriff 15/15, X: DEF 13/15 vs. 15/15. Überleben, Seelenentzug, Gegenstoß und defensive Siegpfade isoliert messen.
5. **P2 – Verlierer-Belohnungslogik kann Grind-Spiralen begünstigen:** Laut `rewardMatchCore` in `assets/game.js` erhalten Niederlagen in Turnierkämpfen 0 Münzen, nur einen reduzierten XP-Anteil und normalerweise keinen Loot. Eine scheiternde Person muss aktiv zu Freiduellen zurückkehren. Vorschlag: deutlich sichtbare Hilfestellung, Farm-/Upgrade-Navigation oder kleine begrenzte Lern-/Trostressourcen, ohne sie unbegrenzt farmbar zu machen.
6. **P2 – Tests decken Korrektheit, nicht gewünschte Siegchancen ab:** Die wirtschaftlichen Regressionstests sichern derzeit vor allem Fehlerfreiheit, Training und Save-Validität ab. Erwartungsfenster für erreichbare Turnierfortschritte, Aktionszahlen und getrennte Rollen-KIs ergänzen.

## Technische Fehlerprüfung und offene Grenzen

- **0 Laufzeitfehler** in den 600 Einzelduellen, 24 einfachen Turnierläufen und 42 weitergehenden Karrieren.
- **329/329 Node-Tests bestanden**, Desktop-/Smartphone-Breiten im Chromium-Smoketest erfolgreich.
- Keine reproduzierte Absturzstelle in diesen automatisierten Stichproben. Das ist **kein** Beweis für Fehlerfreiheit, besonders nicht auf realen Touch-Geräten, bei seltenen Timing-Rennen, Import/Export oder Mehrspielersitzungen.
- Die automatisierten Simulations-KIs sind keine menschlichen Spieler. Insbesondere die Unterschiede zwischen 1/24 und 9/12 entstehen teilweise durch abweichende wirtschaftliche Planung und Versuchsbudgets: Prozentwerte nicht unkritisch gegeneinander vergleichen.

## Namensänderung

Der Schaukämpfer heißt nun **Eiman Huel Stalker · Der Hochmütige**. Textstellen in `assets/game.js` und `assets/evolution.js` sowie der Regressionstest `tests/showcase-visitor.test.cjs` wurden angepasst. `main` wurde nicht geändert.
