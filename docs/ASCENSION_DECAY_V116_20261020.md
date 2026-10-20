# Arcane Duel v11.6 – Aufstieg & Zerfall

Stand: Entwicklung auf `development`. `main` bleibt unverändert.

## Regelpaket

**Levelabhängiger Kreaturenzerfall im PvE**: Pro späterem eigenen Zugende −20/25/30/40/55/65/80/105/135/170 ATK **und** DEF für Lv1–10. Frisch gespielte Monster behalten ihre Schonfrist. Zerfall gilt für Spieler und Gegner gleichermaßen; Angriffsverschleiß ist getrennt. **Standhaftigkeit** reduziert den Zerfall auf eigenen Monstern um 10 % oder 20 % (max. zwei Stufen).

**Resonator-Aufstieg**: Zwei real eingesetzte, bereits fusionierte Resonator-Monster in einer Fusionskette schalten +1 erreichbares Fusionslevel frei, höchstens bis Lv10. Bonus gilt pro Kette nur einmal; Kettenstatus wird über Feldfusionen vererbt und in Duell-Snapshots validiert. Normale Allrounder zählen nicht. Die vorhandene Qualitätsresonanz bleibt unverändert; für das höhere Level ist eine eigene noch verfügbare Fusionsvorlage erforderlich.

**Aufstiegsschmiede**: eigener Bereich in der bestehenden Monsterwerkstatt. Nach dem ersten Sieg über V: drei freie, nicht favorisierte Monster-/Fusionskarten eines identischen Levels + Essenzkosten → eine zufällige Karte des nächsten Levels, zunächst bis Lv9. Nach Sieg über VI: bis Lv10. Reguläre Karten 60 %, Fusionsvorlagen 40 %. Zwei normale Ergebnisse beim selben Ziellv garantieren beim dritten Versuch eine Fusionsvorlage; Fortschritt, Einführung und Herstellungshistorie sind im Profil gespeichert. Ein normaler Aufstieg verbraucht exakt drei vorhandene Exemplare und verwendet bereits definierte Karten-IDs aus einem zulässigen Pool. ACEs, Quest-/Essenzmonster und Deck-/Favoritenexemplare sind nicht verfügbar. Die vorhandene familienbasierte Monsterwerkstatt mit Levelpunkte-Erhaltung bleibt unberührt.

**Himmelswächter VII**: echte KI-Archetypklasse Wächter/Seelenzehrer statt vorher fälschlicherweise zugewiesener Predator-Angreifer-Stil. Normaler VII-Fusionspool höchstens Level 9; einzige Level-10-Vorlage im Fusionsdeck ist das bestehende ACE. Das ACE wird weiterhin nach bisherigen Regeln vorbereitet; keine kostenlose Karte hinzugefügt und keine Grundwerte künstlich reduziert.

**Perks**: Runenpräzision stärkt vollständige Straßen etwas mehr; Rang 3 bietet bei Großen und Gigantischen Straßen einen zusätzlichen echten Qualitätswurf (weiterhin bestehende Obergrenzen). Fusionskunde gibt nach seinem bisherigen ersten Zusatzwurf einmalig +3 % Qualität zur ersten echten Kettenfusion des PvE-Duells; der Bonusverbrauch ist im Duellspeicherstand abgesichert. Neuer Perk **Schmiedekunst** reduziert nur die Essenzkosten der Aufstiegsschmiede um 10/20/30 %, nicht die erforderlichen drei Materialkarten.

## Einsteigerführung

Die neue Werkstatt erklärt die benötigten Materialien, Gebühren, Ergebnischancen und den Glücksschutz. Nach Turniersieg V erscheint einmalig ein Einführungspop-up. Das Regellexikon enthält Beispiele für Lv3/Lv6/Lv9/Lv10-Zerfall, Resonatoraufstieg sowie das Spielkonzept des Himmelswächters. Das Zerfall-Tooltip in Duellen zeigt den tatsächlichen nächsten ATK/DEF-Abzug.

## Regressionen

`tests/ascension-balance-v116.test.cjs` überprüft Zerfall, Perks, tatsächliche Verwendung einer Lv9-Fusionsvorlage durch zwei Resonatoren, einmalige Vererbung beim Neuladen, VII-Decklimits, Schmiedefreischaltung, Glücksschutz, Inventarsicherheit und Save-Kompatibilität. Alte Regressionen und Strategie-Stresstests werden durch GitHub Actions erneut ausgeführt. Gesonderte Chrome-UI-Prüfung: `tests/browser-ascension-v116.html`.

Wichtiger Vorbehalt: Eine **vollständige neue Karrieresimulation mit der v11.6-Werkstattnutzung durch die KI** muss noch separat aufgebaut werden. Vorherige Trainingslauf-Ergebnisse aus v11.5 sind kein neuer Balancingnachweis für v11.6.

## Implementierungsstellen

- `assets/game.js`: Zerfall/Perktexte, UI-Rate.
- `assets/fusion-rework-v113.js`: Resonator-Linie und Fusionskunde.
- `assets/evolution.js`: Runenpräzision.
- `assets/ai-revamp-v55.js`: Wächter-VII und ACE-Begrenzung.
- `assets/ascension-forge-v116.js` und `.css`: neue Spielmechanik, UI, Pity und Regeln.
