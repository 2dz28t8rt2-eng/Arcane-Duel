# Arcane Duel – Monster-Reborn Integrationsprüfung
**Stand 15.10.2026** · Ausschließlich Branch `development` · Preview, keine endgültige Balancefreigabe.

## Eingebaute Systeme und UX
- 32 normale Monsterfamilien mit je zwölf Level-Formen (384 Level-Form-Einträge). Haupt-/Fusions-/Spezialkatalog enthält insgesamt 695 technische Karten-IDs inklusive bisheriger Vorlagen. Level 11/12 sind als späterer Bereich vorgesehen, nicht in der regulären Monsterwerkstatt herstellbar.
- Werkstatt: familiengebundene Normalmonster, genau gleiche Levelsumme bei Verbinden/Zerlegen, keine Fusions-/ACE-/Essenz-/seltenen Karten. Schutz für in aktivem Deck und Deckplätzen verwendete Exemplare. Aktueller Werkstatt-Cap 4/6/8/10 anhand Turnierfortschritt.
- Rollenfusion: echte Materialdifferenz mindestens drei, neutrale Fusionen behalten reguläre Werte. Rollenwerte nur auf der beschworenen Instanz; keine dauerhafte Umschreibung der Fusionsvorlage. Verteidiger-Fusion kann Seelenzehrer werden (20 % Basis, Zusatzchance je Material/Level, Obergrenze 75 %). Bei geplanter Fusion mit mindestens drei geeigneten Feldverteidigern garantiert.
- Gezielte Feldfusion: Eine Handkarte startet die Auswahl; bis zu vier eigene Feldmonster können bewusst als Materialien verwendet werden. Mit ihnen entstehen neue Klassenvarianten.
- Vorstoß verzögert: Der Effekt lädt sich nach dem eigenen Beschwörungszug auf und kommt im folgenden eigenen Zug zum Tragen.
- Duellbedienung: vorbereitete Normalbeschwörung rücknehmbar, Gegnerkarten vergrößerbar, Fusionsauswahl verrät keine ausgewürfelten Zahlen. Vael bleibt arrogant, keine Erklärung einer folgenlosen Niederlage im Eintrittsdialog.
- UI: Kartenrollen auf Bild und Vorschau, größere Namen/Zahlen, Fusionswerte erst nach Entscheidung, sinnvollere Wortwahl, scrollbare linke Navigation, bewegliche Kartenvorschau beim Deckklick, knappe Karten-Dropchancen.
- Neunseitiges Duellantenhandbuch: aktualisierte Erläuterungen zu DEF-HP, Zerfall, Schicksal, Decks und Charakter-Boosterpacks.
- Kein globaler +15-%-Schadensmultiplikator mehr für Jäger gegen Fusionen; alte Regeln und Hilfe entsprechend korrigiert.
- Überlappende Fusionsrollen-Wrapper bereinigt: `assets/arcane-role-fusions.js` ist einzige Berechnungsinstanz für Rollentransfer, `assets/essence-combat.js` berücksichtigt `roleOverride`.

## Reale Engine – isolierte technische Tests
- 100 vollständig bis zum Sieger durchlaufene PVEs inklusive Rollenfusion/Werkstatt-Module: **0 Laufzeitfehler**.
- Anschließend 500 PVEs auf zehn Gegner verteilt: **0 Laufzeitfehler**.
- Abschließend 250 PVEs auf zehn Gegner verteilt: **0 Laufzeitfehler**.
- Gesamt dieser aktuellen neuen Stichproben: **850 technisch abgeschlossene Duelle**. Vorherige Balance-Baselines liegen getrennt vor.
- Dreierfusion 1+1+2 aus drei Verteidigern: ergibt tatsächlich Verteidigerinstanz.
- Vier Verteidigermaterialien mit drei Feldmaterialien: Seelenzehrer-Aufwertung **garantiert**, mit identischem reinem Handmaterial nur wahrscheinlichkeitbasiert. Kein doppelter Bonus durch zwei Rollenfusion-Wrapper.
- Werkstatt-Test: Frühe LV-7-Kombination abgewiesen; nach Freischaltung 7×LV1→LV7 und LV7→LV3+LV3+LV1, exakt gleiche Summe, Bestandsänderungen korrekt und Speicherung erfolgreich. Tests auf Ablehnung belegter Deckkarten ebenfalls im neuen `tests/monster-roles-forge.test.cjs`.
- JavaScript-Syntax der neuen Module vor Integration überprüft. GitHub-Actions-Workflow führt Tests für Essenz, Rollentransfer und Werkstatt bei Entwicklungspushes aus.

## Noch offen, bevor wir die Turnierbalance freigeben
1. **Gegner VIII–X verwenden derzeit teils noch Level-11/12-Signaturmonster.** Die Werkstatt kann nur bis Level 10 erstellen. Diese asymmetrische Kurve muss im nächsten Balancing-Durchgang ausdrücklich neu abgestimmt werden. Der Vorschlag „Turnier maximal Level 10, 11–12 erst Super-Lategame“ ist deshalb noch **nicht vollständig** produktiv umgesetzt.
2. Die neuen Stufenwerte wurden stichprobenartig auf Rollenverteilung geprüft; ein automatischer zehnstufiger Wirtschafts- und Inventarfortschritt (Drops, reale verfügbare Essenz, Erwerb, Upgrades, Essenzwesen) fehlt noch.
3. Browserinteraktion auf unterschiedlichen Bildschirmgrößen, Touch-Fusion, dynamische Modaldialoge, gespeicherte halbfertige Duelle, Speichermigration und lokales PvP wurden **nicht vollständig visuell/end-to-end abgenommen**.
4. Der Gesamtschwierigkeitsgrad der letzten Gegner ist bereits in älteren Simulationen auffällig; 850 technische Duelle beweisen nur Laufstabilität, nicht faire Siegchancen.
5. Nutzeranweisung: Ältere Speicherstände müssen nicht erhalten bleiben. **Trotzdem** gelten künftig neu erstellte Save-Dateien, Inventartransaktionen und exklusive Essenzmonster-Bindungen als konsistent zu haltende Daten.

## Fazit
Das große Monster- und UI-Update ist in `development` testbar. Der zentrale Kampfkern funktioniert in isolierten Duellen; die wichtigste verbleibende Aufgabe ist **fachliches Balancing und vollständige visuelle Abnahme**, insbesondere Turniergegner VIII–X gegenüber den neu erschaffbaren LV10-Normalmonstern.
