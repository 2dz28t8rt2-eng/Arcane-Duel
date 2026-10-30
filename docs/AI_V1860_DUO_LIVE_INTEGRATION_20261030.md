# Arcane Duel – KI v18.6 jetzt in 2v2 (2026-10-30)

## Priorität und Quelle
Der Nutzer wünscht die aktuelle Forschungs-KI v18.6 vorrangig für **beide 2v2-KI-Gegner** (Sitzplätze 1 und 3), mit dem Einzelspieler als strategischem Vorbild und ohne fiktive Sonderrechte. Der bisherige Duo-Automat konnte lediglich die erste Handkarte auf ein freies Feld beschwören und das schwächste gegnerische Monster angreifen.

## Neue KI-Entscheidungen (Live, nicht Forschungssimulation)
- Fortschrittliche **Beschwörungswahl** nach echter Kartenstärke, sieben Slots und möglichem Wächter-/Seelenzehrer-Bund.
- **Echte legale Fusionen**: Hand/Hand oder Hand/Feld, `fusionOptions` und **kanonische** `fusionPreview` für die Bewertung; tatsächliche Würfel und Materialverbrauch ausschließlich über `apply`.
- Wächter/Seelenzehrer in DEF positionieren, tatsächliche legale Seelenfähigkeiten `soulRaid`, `soulDischarge`, `soulCondense` prüfen.
- Für beide menschlichen Felder legale Angriffe mit echten Konsequenzen prüfen, inklusive sicherem Direkt-Finisher. Bei drohendem Duellende ein begrenzter legaler zweiter Zug innerhalb desselben NPC-Zugs.
- Der vollständig vorhandene Duo-Reducer `apply` prüft und führt **jede** wirkliche KI-Aktion aus. Die KI erhält keine nicht vorhandenen Duo-Sonderfähigkeiten.

## Schutzmaßnahmen
- Nur Sitzplätze 1/3; beide menschlichen Spieler unverändert. Die strategische Vorschau entfernt die private gegnerische Hand, Decks und Verstärkungen. Der Prognose-RNG ist unabhängig vom echten RNG: keine Einsicht in zukünftige Serverwürfel.
- Höchstens 24 taktische Erstaktionen, bei kritischer Team-LP maximal sechs Folgeaktionen für die stärksten drei Kandidaten. Maximal 18 Aktionen je NPC-Zug als Schutz vor Endlosschleifen.
- `assets/duo-shared-rules-v160.js` und `supabase/functions/arcane-duo-v2/duo-rules.js` sind weiterhin **bytegenau identisch**. Der Edge-Handler nutzt automatisch die neue `aiTurn`-Funktion, sobald die Edge Function neu deployed wird. Die Browserdatei allein aktualisiert den bereits deployed laufenden Server nicht.
- Keine Veränderungen an Grundwerten, Fusionen, Spieleökonomie, dem separaten Solo-Champion oder der KI-Forschung.

Tests: `node --test tests/duo-ai-v186-integration.test.cjs`, reguläre 2v2-Regressionssuite.
