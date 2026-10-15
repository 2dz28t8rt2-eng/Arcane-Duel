# Arcane Duel 3.0 · Klarheits- und Komfortupdate – QA

**Datum:** 15.10.2026 · **Branch:** `development` · **Release-Status:** Noch nicht nach `main` übernommen.

## Umgesetzte Korrekturen

| Bereich | Verhalten |
|---|---|
| Pokerfusion | Vier direkt aufeinanderfolgende Stufen gelten als **Große Straße**. Fünf passende Stufen behalten den größeren Bonus; drei sind **Kleine Straße**. |
| Fusionsgeheimnis | In Fusionsanimation, vorbereiteter Beschwörung, großer linker Vorschau und Fusionslog stehen keine finalen ATK-/DEF-Werte; sie erscheinen erst nach Feldplatzierung. |
| Kartenrollen | Rollenplaketten stehen im Deckmenü außerhalb des Kartenbilds statt vor dem Element; Preview zeigt vergrößerte Namen und Beschreibung. Farbe und Kontrast nach Rolle differenziert. |
| Navigation | Desktop-Menü scrollt separat, aktive Menükategorie lässt sich per erneutem Klick schließen und wieder öffnen. |
| Text | Klarere Bezeichnungen für Monsterfamilien, ATK-/DEF-starke Karten, Einstellungen, Animationen und Reset-Sicherung. |
| Animationen | Benutzerauswahl: **An** oder **Aus**; die Speicherung bleibt über bestehende Werte kompatibel. Es wird kein künstlich beschleunigter Modus angeboten. |
| Splitter | **Ein einziger gemeinsamer Splittervorrat** für alle Kartentypen, Preis: **30 Splitter plus Essenz** pro Kartenherstellung. Die vorhandenen 11 internen Bestandsfelder bleiben für alte Spielstände erhalten und werden vollständig zusammen nutzbar. |
| Niederlagen | Aufgabe wird zusätzlich zum Niederlagenzähler in den letzten Duellen/der Chronik festgehalten; kein Reward bei Aufgabe. |
| Hinweise | Taktische Kaufhinweise sind aus linker Navigation und Niederlagenbildschirm erreichbar. |
| Belohnungen | Tatsächlich gedroppte Karten werden mit Artwork gezeigt. Bei Turniersieg wird das ACE **als freigeschaltetes Kaufangebot** mit Bild vorgestellt, ausdrücklich kein Gratisgewinn. |
| Fusionsdeckeditor | Zeigt nur **bereits besessene** Fusionsvorlagen. Kartenlexikon und Belohnungsübersichten dürfen unbekannte Vorlagen weiter vorstellen. |
| Essenzwesen | Nach Turnier III erscheint Hinweis auf die drei Leihdeck-Schulprüfungen. Nach der dritten bestandenen Prüfung folgt ein hervorgehobener Übergang zur einmaligen, unwiderruflichen Wahl des Essenzwesens. |
| Hauptmenü | Drei Artwork-Karten wechseln alle ca. 12 Sekunden; Vorschau kann alle **aktiven** RPG-Karten inkl. Level 10 und seltene Fusionen zeigen. LV11/12 bleiben vorerst reserviert, nicht aktiv. |
| Einzelboni | Veraltete einmalige Monster-Sondereffekte (Rush, Guard, Pierce, Hunt, Guide, Aegis) aus dem spielbaren PvE-Katalog und den Kampfprüfungen entfernt. Übergreifende Predator-/Wächter-/Seelenzehrer-Klassenmechaniken bleiben aktiv. |

## Teststrategie

- Die Tests wurden erweitert: Viererstraße, einheitliche Splitter auch aus früher getrennten Beständen, aufgegebene Turnierniederlage, ausschließlich besessene Fusionen im Editor und verbliebene Legacy-Sonderfähigkeiten.
- Der vollständige Browser-Test verifiziert u. a. separat scrollende Desktopnavigation, doppeltes Umschalten aktiver Menügruppen und die außerhalb der Kartenbilder liegenden Rollenanzeigen.
- Jede Änderung wurde zuerst auf `development` vorgenommen, nicht auf der stabilen `main`.

## Balance: Anmerkung aus dem realen Spieltest

Im manuellen Durchgang wurde das Turnier bis Gegner VI ohne Niederlage gespielt und Fusionen stark priorisiert. Frühere Engine-Simulationen ohne taktische Fusionslehre sahen dagegen einen Engpass bei Gegner IV. **Beides ist möglich und ein starkes Signal, dass die Simulationsspieler wichtige Fusionsentscheidungen unterbewerten.**

Die Grundwerte illustrieren den Vorteil: Eine neu hergestellte LV10-Predator-Karte besitzt in der Werkstattkurve ungefähr **2.390 ATK**. Eine gegnerische hochrangige LV10-Signaturfusion erhält als Kartengrundwert ungefähr **2.870 ATK**, noch bevor Fusionseffekte/Materielwertwürfe hinzukommen. Das ist kein allgemein repräsentatives Kartenpaar, erklärt aber die mögliche Dominanz von hohen Fusionen.

**Bewusst noch keine pauschale Statkorrektur:** Es muss getrennt gemessen werden, wie sich normale Predator/Wächter, einfache Zweikartenfusionen, gezielte Vierer-/Fünferkombinationen, Rollenfusionen und die exklusiven Essenzwesen bei **identischem Ressourcenbudget** schlagen. Erst auf dieser Basis können wir normale Monster sinnvoll konkurrenzfähig machen, ohne anspruchsvolle Pokerkombinationen zu entwerten.

## Bekannte Grenzen

1. Durch das Zusammenführen der Splitterwährung ändert sich die Herstellungseffizienz. Der Preis 30 ist ein erster konservativer Balancingwert; vollständige Wirtschaftsvergleiche sind noch nötig.
2. Reale Touchgeräte benötigen eine manuelle Abnahme trotz erfolgreicher Headless-Chromium-Tests für 1200px und 410px.
3. Alte Spielstände werden nicht automatisch auf ein neues Speicherschema umgeschrieben, damit keine Splitter verloren gehen. Ihre Ressourcen sind für die Benutzeroberfläche trotzdem vollständig vereinheitlicht.
4. Die Daten belegen technische Funktion, nicht abschließende Ausgewogenheit der drei Klassen.

## Testausführung

```bash
npm test
```

GitHub Actions: `Arcane Duel smoke tests` und `Arcane Duel – Code & Strategy Checks` auf `development`. Die Auslieferung auf `main` erfolgt erst nach spielerischer Abnahme.