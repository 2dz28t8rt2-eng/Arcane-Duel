# Arcane Duel – Spieltest vom 29.10.2026 (v20.8.1)

Status: Detailbericht aus einem manuellen PvE-Turnier-Test. Die Screenshots dokumentieren die tatsächliche Ansicht; nicht aus bloßen Quellcode-Treffern auf eine bestandene Browserabnahme schließen.

## Sound
- [x] Titelmenü-Klick: aktueller SFX-Code startet den Menüton bereits auf pointerdown und preloaded ihn (im Browser nachprüfen)
- [x] Temporärer Fusions-Berechnungston deaktiviert, da Ersatz gesucht wird
- [ ] Zerstörungssound exakt an die visuelle Explosion bzw. das Verschwinden koppeln, einschließlich Gegenschlag
- [ ] LP-Schadenssound exakt an Einschlag/Explosion koppeln, Seelenstoß erst nach Strahlende
- [ ] Beschwörung direkt auf bestätigten Platzierungsklick statt verzögertes Zustands-Polling legen
- [ ] Starthand sowie jede tatsächlich gezogene Karte einzeln und passend zur Fluganimation vertonen
- [ ] Zerfall: einen einzigen Debuff-Sound pro Runden-Zerfall, andere Schwächungen einzeln – im echten Match prüfen
- [ ] Niederlagen-Sound exakt zur Einblendung von „Niederlage“ justieren
- [x] Musik bei Sieg/Niederlage unverändert laut lassen (aktueller SFX-Code ruft setDuck nicht mehr auf)

## Fusion / Regeln
- [ ] Drehende Hand-Fusionsmaterialien über die gesamte 5,75-s-Soundsequenz animieren, nicht vorzeitig einfrieren; beim Überspringen laufende SFX zuverlässig stoppen
- [ ] Handfusion bei Turniergegner III/IV: alle Quellkarten anzeigen, auch wenn KI-Snapshots nach Phasenwechsel fehlen
- [ ] Mehrere Lv1-Karten: ohne Forschungsfreischaltung keine Lv1-Fusion freigeben; erlaubte Lv2-Fusionsauswahl garantieren, soweit passende Vorlage und Regelbudget
- [ ] Fusionsauswahl/Wegwerfen: auch bei leerer Menge legaler Fusionsvorlagen im Wegwerfen-Modus bleiben und Handkarten-Discard ermöglichen
- [ ] Seelenzehrer mit umgewidmeten Unterstützer-Werten anhand des echten Seelenzehrer-Kartenpools neu abstimmen (nicht bloß ATK/DEF vertauschen)

## Karten, Animationen, UI
- [ ] Schicksalswesen: Lichterscheinung langsam, kontinuierlich pulsieren statt binär schalten
- [x] Erster Layout-Patch: Beschwörungszentrale/Kartenvorschau kompakter und zentriert (CSS v20.8.1); visuelle Abnahme ausstehend
- [x] Erster Layout-Patch: Rudelführer-Fähigkeiten über Wertebereich platzieren und Predator-Prozent oben links (CSS v20.8.1); visuelle Abnahme ausstehend
- [ ] Predator-Prozentanzeige erst NACH abgeschlossener Platzierungsanimation zeigen
- [ ] ACE-Plakette nach Beschwörung kurz zeigen und ausblenden, ATK-/DEF-Modusanzeige freihalten
- [ ] Taktischen Fusionseffekt überall konsistent in „Rudelführer Fähigkeit“ umbenennen (konkreten UI-Ursprung verifizieren)
- [x] Erster Layout-Patch: „Fusionen & Tipps“-Übernehmen-Knöpfe kleiner und zentriert
- [ ] Savegame-Fehlerbanner explizit schließbar machen; Fehler nicht verbergen/verschlucken
- [ ] Level-Up/Rewards erst nach abgeschlossener Duell-Ergebnisansicht zeigen, nicht auf dem Sieg-Bildschirm
- [ ] Seelenzehrer: rückwirkende Seelenenergie-Schadensreaktion mit kleinem, verständlichem Erklärungslabel
- [ ] Questgeber Lv1: Angebot und Sichtbarkeit anhand Voraussetzungen sowie gespeicherten Einladungsstatus überprüfen

## Qualitätssicherung
- Singleplayer gegen Turniergegner III und IV: Hand-/Feldfusion, ACE, level-up und Abbruch des Rituals
- Vergleich regulärer Beschwörung, voller Felder und Weiterfusion
- Test von „kein gültiges Fusionsziel → Wegwerfen“ mit mindestens zwei ausgewählten Handkarten
- Tests für Sounds mit und ohne Musik sowie bei aktivem Gegenschlag, Zerfall und Seelenstoß
- Vor Übernahme in main müssen Browser- und Spielstand-Regressionstests erfolgreich durchlaufen.

Der Produktionsbranch main bleibt unberührt.
