# Arcane Duel 3.0 – Turnier-Level-10 / Regression & Strategie-QA
**Datum:** 15.10.2026 · **Branch:** `development` · **Stabiler Branch:** `main` nicht verändert

## Entscheidung und Spielregeln

- Das reguläre Turnier I–X endet bei **Level 10**. Die Turniergegner VIII, IX und X verwenden als Signaturstufe jeweils Level 10 statt zuvor 11/12.
- Auch Hardmode-Fusionskarten werden beim Erstellen auf Level 10 begrenzt; die Obergrenze gilt für ausrüstbare Spielerdecks, gewöhnliche Fusionsdecks, NPC-Decks und aktive Kartenpools.
- Die Werkstatt zeigt bzw. verarbeitet nur Stufen 1–10 und behält ihre Fortschritts-Caps 4/6/8/10.
- Level 11 und 12 **existieren ausschließlich noch als reservierte technische Karten-IDs**, damit bestehende IDs nicht verrutschen. Sie erscheinen nicht in `ARCANE_STAGE_IDS`, den normalen Deck-/Fusionspools, Boostern, Beutepools oder der Werkstatt. Späteres Post-Turnier-Lategame bleibt eigenständigen Updates vorbehalten.
- Die bereits verwendeten Monster-Kampfwerte wurden **nicht blind herabgesetzt**. Änderungen betreffen Levelzugang und die darauf basierende Stufenbestimmung für Endgegner/Hardmode.

## Korrigierte Probleme

1. Gegner VIII–X und höhere Hardmode-Fusionen konnten den vorgesehenen Level-10-Cap überschreiten.
2. Das Registrieren älterer Kartenvarianten in der neuen Werkstatt überschrieb die frühere Freischaltstufe und konnte Karten in zu frühe Boosterpools gelangen lassen. Die höchste bestehende Sperre bleibt nun erhalten.
3. Alte automatisierte Tests prüften feste Kataloggrößen (390 statt 695 technischen Karten-IDs), das frühere Handbuch mit acht statt neun Seiten, alte Release-Bezeichnungen und frühere LP-Grenzen.
4. Ein Browser-Test erwartete den alten Handbuch-Kapiteltext.
5. Ein Browser-Test erwartete sichtbare ATK/DEF-Fusionswerte und ein altes HTML-Layout; das neue Produktdesign verbirgt diese Werte bewusst bis zur Beschwörung. Der Test prüft nun den tatsächlich beabsichtigten, verdeckten Auswahlprozess inklusive Bildklick und Einmalauswahl.
6. Alte Werkstatt-Tests forderten registrierte LV11/12-Karten, obwohl diese für spätere Inhalte zurückgehalten werden sollen.

## Automatisierte Verifikation

- **227 von 227 Node-Tests bestanden** (`npm test`), einschließlich neuer Levelgrenzen, Werkstatt, Materialien, NPC-Decks, Booster-/Loot-Pools sowie strategischer Duellsimulation.
- **GitHub „Code & Strategy Checks“ erfolgreich** und **„Arcane Duel smoke tests“ erfolgreich** auf Commit `bec217ac3a46c99631a28ddedf4270ab058fa94e`.
- Chromium-Smoke-Prüfung: Layout mit 1200 px und 410 px, erste Handbuchanzeige, Menü-/Shop-/Deck-Funktionen, Reset und Fusionsauswahl inklusive Artwork-Klick. **Keine vollständige Prüfung realer Touch-Geräte.**

CI-Bericht: https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/38755189908

## Erste vergleichende Level-10-Duelle

`tests/monster-roles-forge.test.cjs` enthält einen reproduzierbaren Vergleich für drei **synthetische 40-Karten-Decks** gegen Gegner VIII, IX und X. Die 24 Seeds pro Gegner werden über die drei Ansätze gepaart; insgesamt **216 abgeschlossene Duelle**, kein Enginefehler. Die Fusionsliste enthält niedrige, mittlere und hohe Fusionslevel. Dieser Test modelliert **nicht** die tatsächlichen Karten-Drops, Kaufkosten, Werkstattinvestitionen, Essenz-Upgrades oder bewusst ausgespielte menschliche Taktiken.

| Spielweise (KI-Näherung) | Gegner VIII | Gegner IX | Gegner X | Ø Fusionen VIII / IX / X |
|---|---:|---:|---:|---|
| Predator, starkes LV10-Deck | 24/24 (100 %) | 24/24 (100 %) | 24/24 (100 %) | 3,0 / 3,2 / 3,3 |
| Wächter/Seelenzehrer, starkes LV10-Deck | 24/24 (100 %) | 24/24 (100 %) | 24/24 (100 %) | 3,0 / 3,1 / 3,2 |
| Niedrig-/Mittelstufen-Deck mit Fusionsfokus | 24/24 (100 %) | 15/24 (63 %) | 18/24 (75 %) | 4,4 / 4,5 / 4,7 |

**Interpretation:** Die Tests zeigen, dass LV10-Normalmonsterdecks die letzten Gegner unter diesen synthetischen Idealbedingungen sehr schnell besiegen können; der Fusionsansatz ist gegen IX/X weniger dominant und benötigt mehr Halbzüge. Achtung: **Alle drei KI-Profile fusionieren weiterhin**; die Ergebnisse beweisen daher weder die Eigenständigkeit der Predator-/DEF-Rollen noch reale, gleichwertige Siegchancen. Insbesondere fehlt die realistisch finanzierbare Deckentwicklung ab Turnier I.

## Vor der endgültigen Balancefreigabe weiter offen

1. Ein echter Fortschrittssimulator von I bis X mit Kartenbesitz, Drops, verfügbaren Ressourcen, Käufen, Werkstatt, Evolutions-/Essenz-Upgrades und Verlustversuchen.
2. Drei **wirklich eigenständige** Strategie-KIs: Predator-Druck, aktiv defensive Seelenzehrer-/Wächterzüge und gezielte Multi-/Feldfusionen. Der vorhandene Basissimulator fusioniert bei allen drei Decktypen.
3. Statistisch aussagekräftige und wirtschaftlich erreichbare Vergleichsdecks pro Turnierstufe, besonders VIII–X; erst anschließend Feinabstimmung von Levelbudget, LP, Signaturen und Endgegnerfähigkeiten.
4. Visuelle manuelle Endabnahme auf tatsächlichen Smartphones, Touch-Feldfusionen, Scroll-/Modaldialoge, Import/Export und lokale PvP-Bedienung.

**Fazit:** Die verbindliche Level-10-Grenze und die aktuellen Regressionstests sind umgesetzt und CI-grün. Die endgültige spielökonomische und strategische Turnierbalance ist noch **nicht freigegeben**.
