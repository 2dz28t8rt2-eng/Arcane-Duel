# Arcane Duel – Testprotokoll und priorisierter Entwicklungsrückstand
**Quelle:** Spieler-Testbericht vom 18.10.2026, elf Screenshots.
**Branch:** `development` (nicht `main`). **Status:** erste Fehlerkorrekturen im QA-Sprint; die übrigen Punkte sind noch **NICHT** umgesetzt.

## A · Behobene bzw. bereits angegangene Probleme (Tests abwarten)
- [x] **A1. Positionswechsel nach Angriff**: Kern verbietet die Rotation nach einer Attacke, die NPC-KI wählt in diesem Zustand keinen Wechsel mehr. Bereits beschworene Fusionsmonster dürfen weiterhin regulär angreifen; ausschließlich die ungültige zweite Aktion ist gesperrt.
- [x] **A2. Große Gegnerkarten im Duell**: statt eines separaten Modals erscheint die Karte im vorhandenen linken Inspektor. Leere Hintergrundfläche schließt die Ansicht.
- [x] **A3. Große Deckkarte verschwindet**: beim automatischen Wiederaufbau des Menüs wird eine bereits offene Vorschau wiederhergestellt.
- [x] **A4. Monstertraining**: volle jeweilige Stufenwerte +35/+25/+15/+10/+8/+6/+4/+3/+2/+2 ATK und DEF, insgesamt +110 pro Wert; alte schwammige Spezialisten-Wertung entfernt.
- [x] **A5. Standhaftigkeit**: −3 je Stufe auf ATK-/DEF-Zugwechselzerfall, max. −6, Angriffsmüdigkeit ausgenommen.
- [x] **A6. Level-Meilenstein**: zusätzliche goldene Level-Erreichen-Zeremonie vor der bisherigen Belohnungsauswahl und Boosteranzeige.
- [x] **A7. Aufstieg in der Deckübersicht**: Karten mit genügend freien Kopien und nicht maximalem Rang bekommen ein pulsierendes Upgrade-Signal.
- [x] **A8. Passivquests**: deutlich sichtbares Banner mit Fortschritt und Schnellnavigation im Challenge-Menü.
- [x] **A9. Fanatiker ab Spielerlevel 6**: sobald freigeschaltet, eigene erstmalige Begegnungsmeldung mit direktem Verweis auf Challenges; einmalige Einladung wird im Profil gespeichert. Die reguläre Zufallsbegegnung bleibt erhalten.
- [x] **A10. Beschwörungs-Layout – erster Reparaturschritt**: Anordnung der Karte und Zone-Auswahl responsiv, mit genügend Breite für Fließtext. Vollständige UX-Überarbeitung folgt.
- [x] **A11. Große Straße**: klar bessere Boni als Kleine Straße (+30 % bzw. +36 % reine Kombinationsqualität bei 4/5 Materialien, plus größere Würfel-/Stufenboni); nach Test iterieren.
- [x] **A12. Sortenreine Rollenfusionen**: +5 Prozentpunkte Qualitätsfaktor bei 2–5 materialgleich spezialisierten Predatoren, Wächtern oder Seelenzehrern; gemischte Rollen profitieren nicht.
- [x] **A13. Rollenstempel der Fusionen**: noch unfusionierte Vorlagen werden in der Anzeige als „rollenfrei“ bezeichnet; geerbte Rollen werden nur von der erzeugten Fusionsinstanz angezeigt. Potenzielle weitere Anzeigestellen gründlich prüfen.
- [x] **A14. Unterstützer erklärt**: in Regeln beschrieben, dass Verteidigungs-Unterstützer in Essenzduellen normale Angreifer passiv stärken und sonst derzeit keine eigene aktive Sonderfähigkeit haben. Allrounder/Resonator-Resonanz ebenfalls erklärt.

## B · Kritische offene Themen (NÄCHSTER Entwicklungsschritt)
- [ ] **B1. Werteparität Deck/Kampf**: dieselbe Karte mit derselben Verstärkung prüfen; realen Basiswert von bereits erfolgtem Kampfzerfall unterscheiden; alle Faktor- und Rollen-Boni angleichen.
- [ ] **B2. Kombinierte Beschwörungs-/Fusionsauswahl vollständig neu layouten**: separate Felder für Material, aktuelle Karte, Vorschau, Feldzone, Spezialrollen und Effekte; für PC & Handy, ohne Textüberlagerungen. Screenshot 2.
- [ ] **B3. Fusions-Rollenstempel im kompletten UI**: Template zeigt nie ungeerbte Rollen; auch große Vorschau, Feldkarte, Dropdown, Nach-Fusionsstempel und wiederholte Aktualisierungen.
- [x] **B4. Seelenraub-Aktivierung visualisieren**: passive Saug-Orb-Animation für aktives Seelenraub rezyklieren; Angriff und LP-/ATK-/DEF-Verlust optisch korrekt lesen.
- [x] **B5. Gegenschlag-Animation**: eindeutige rote Schadensrichtung zum Angreifer statt versehentlichem grünem Heilungseindruck, wuchtiger Impact.
- [ ] **B6. Essenzfähigkeiten und Orb**: größere Orb-Effekte und Animationen unabhängig von der weit unten befindlichen Fähigkeitsauswahl sichtbar machen.
- [ ] **B7. ATK-/DEF-Boxen und redundant schwebende Level-Symbole**: Boosterbelohnung, Meilenstein, ACE-Kaufhinweis und Kartendrop sauber angleichen, auch Mobil.
- [x] **B8. Zufallsbegegnungsstart**: das gleiche „Duell startet“-Overlay und langsam auffüllende LP-Balken wie Turniergegner.
- [ ] **B9. Eiman Huel**: schimmernder Begegnungshinweis, verschwindet nach *einem* anderen manuellen Duell unabhängig vom Ergebnis; danach erneut zufällig. Vorhandenes Streak-/Offer-System gezielt abnehmen. Mindestens ein generisches Artwork im Bossdeck aufspüren/ersetzen.
- [ ] **B10. Fanatiker-Story**: ab Level 6 proaktiv auffindbar, von Spielern tatsächlich gestartete Kapitel 1–5 abnehmen.

## C · Artworkpaket (noch NICHT als einzelne fertige Monsterbilder erstellt/integriert)
- [ ] **C1. Eibenwächter** – altes Baum-/Frauenmotiv durch hochwertige Waldwächter-Illustration ersetzen.
- [ ] **C2. Rubin-Seraph** – neues hochwertiges magisches Seraphen-Artwork.
- [ ] **C3. Waldgeist Veyra** – neues Charakter-Artwork.
- [ ] **C4. Bastion Ferrus** – schwerer gepanzerter Wächter statt altem Monsterbild.
- [ ] **C5. Eisenzahn** – neuartiger bedrohlicher Metall-/Raubtiercharakter.
- [ ] **C6. Eiman Huel** – noch mindestens ein generisches Bild im Haupt-/Fusionsdeck, IDs und Asset-Fallbacks prüfen.
- [ ] **C7. Elementfarbiger pulsierender Glow und größere Spezialanimationen für ACE-Karten**.

## D · Balanceideen – vor Implementierung abgestimmt entscheiden
- [ ] **D1. Levelabhängiger Kreaturenzerfall**: höheres Level = stärkerer Zugwechselzerfall. Vorschlag erst mit Lv-IV/V-Vergleich simulieren, da gerade Turniergegner IV spannend und V absichtlich anspruchsvoll.
- [ ] **D2. Höhere Angriffsermüdung beim Schlag auf DEF-Kreaturen**: beispielsweise zusätzlicher −10 ATK nur auf tatsächliche DEF-Ziele, aber erst zusammen mit D1 simulieren.
- [ ] **D3. Große Straße erneut im Live-Spiel testen**: prüfen, ob numerischer Qualitätsbonus trotz Materialstufenspreizung wirklich stärker als Kleine Straße ist.
- [ ] **D4. Reine Rollensynergien +5 % abnehmen**: keine Aushebelung vorhandener Qualitätsdeckel.

## E · Usability / Animationen
- [ ] **E1. Beschwörungsauswahl zusätzlich zur CSS-Reparatur logisch neu ordnen und beschriften.**
- [ ] **E2. Level-Animation zeitlich vom Booster-/Meilenstein-Fenster abheben, auf Handy und Desktop optisch prüfen.**
- [ ] **E3. Seelenzehrer-Orb deutlich vergrößern, Flugbahn/Kameraposition und Seelenraub abgleichen.**
- [ ] **E4. ACE-Glow an Elemente koppeln, nicht pauschal violett; bei Animationen `prefers-reduced-motion` berücksichtigen.**

## Regression / Leitplanken
- Nach jedem Update beide GitHub-Workflows abwarten: „Code & Strategy Checks“ und Chrome-Smoke-Tests.
- Bei Änderungen an rechtmäßigen Spielzügen die NPC-KI immer mit ändern und komplette Seed-Simulationen durchführen.
- Keine unbemerkt falschen Erfolgsbehauptungen. Offen/teilweise sind kein „fertig“.
- Bei den fünf neuen Artworks erst hochwertige Einzelbilder erstellen und im Kartenrahmen prüfen, dann Commit.
- Keine Änderung an `main` bis zur gemeinsamen Abnahme.

## Nachtrag – zweite QA-Runde (18.10.2026)

**Technisch integriert (manuelle Grafikabnahme noch ausstehend):**
- Aktiver Seelenraub: die bereits bestehende violette Soul-Absorb-FX-Warteschlange wird unmittelbar nach dem Zielabzug sichtbar abgespielt, mit der eigenen Markierung „SEELENRAUB“. Passive Entzüge bleiben unverändert.
- Gegenschlag: kräftiger roter Treffer in Richtung gegnerischer LP-Anzeige, sichtbare negative LP-Zahl, Impact-/Shake-Effekt. Frühere goldfarbene Heilanmutung entfällt.
- Orb der Seelenzehrer: von 27 auf 58 px vergrößert; höhere Partikelhelligkeit.
- Belohnungskarten: ATK-/DEF-Zahlenboxen bei Booster, Meilenstein, Drop und ACE-Hinweisen mit eigenen hoch priorisierten CSS-Regeln sichtbar; oberes redundantes Levelbadge in diesen Panels ausgeblendet. Die Levelanzeige in der eigentlichen Karte unten bleibt.
- Zufallsbegegnungen: eigenes Startmodal mit Namen, LP und erst nach Bestätigung die bekannte Arena-Animation inklusive LP-Auffüllung (statt sofortiger KI-Aktion).
- Eiman Huel: Angebote verschwinden nach dem nächsten anderen abgeschlossenen PvE-Duell unabhängig von Sieg, Niederlage oder Aufgabe; Begegnungspanel leuchtet und schimmert. Das generische Kartenartwork ist noch nicht ersetzt.
- ACE-Monster: dezentes Pulsieren gemäß Element (Feuer, Wasser, Erde, Wind, Licht, Dunkel) in Hand, großer Vorschau und Feld; keine Werteveränderungen. Ein größeres individuelles Beschwörungsritual bleibt offen.
- QA-Werteparität: automatischer Test für gewöhnliche RPG-Monster mit mehreren Upgrade-/Rollen-Spezialisierungen zeigt Deck-Startwerte identisch mit unbeschädigten Startwerten frisch erzeugter Duellkarten. **Weiter offen:** Abweichungen nach Zerfall, Spezialfähigkeiten, Fusionsrunden und Überladung; erst nach reproduziertem Gegenbeispiel spielmechanisch ändern.

**Nicht abgeschlossen:** Komplettes Redesign der Beschwörungsauswahl (nur erste CSS-Reparatur), neue Monsterartworks, Eiman-Deckgrafiken, individuell größere ACE-Rituale, dezidierte Tests sämtlicher Booster-/ACE-Layouts auf mobilen Geräten sowie Level-/DEF-abhängiger Balancezerfall (bewusst nicht ohne vorherige Tests geändert).

## Nachtrag 19.10.2026 · Update 5.6
- **B2 / E1 – technisch umgesetzt, visuelle Spielabnahme offen:** neue gegliederte Beschwörungszentrale statt überfülltem Fließtext; große Vorschau, Fusionsmaterial, Qualitätsinformation und Feldzone separat. Browser-Smoke einschließlich Fusionskino und Node-Tests grün. Noch echte Nutzerinteraktionen auf Handy und Desktop prüfen.
- **Verteidiger-KI:** Die Heilreichweite von Wächtern beträgt jetzt exakt einen Feldplatz nach links oder rechts. Globale Wächterheilung war ein Balancefehler und wurde in Plan- und Aktionsprüfung korrigiert.
- **C – weiterhin offen:** Drei Monsterillustrationen (Nebelkaiser, Leerenorakel, Runengeist der Schwelle) als externe Originalentwürfe erzeugt; **keines dieser Bilder ist bisher als lokale WebP-Kartengrafik integriert**. Kein C-Eintrag als abgeschlossen markieren.
- **Regression:** Commit `f9bea3c` grün in Code-/Strategietests und Chrome-Smoke. `main` bleibt unangetastet.

## Artwork: drei konkrete Quellen integriert (5.6)
- [x] Nebelkaiser: echte individuelle hochformatige WebP-Illustration; im Schicksalszug und in Kartenansichten gleicher lokaler Pfad.
- [x] Leerenorakel, Fusions-ACE-ID 322: neues eigenständiges WebP, Kollektion/Spiel-IDs bleiben erhalten.
- [x] Runengeist der Schwelle, Fusions-ID 695: SVG durch echtes WebP ersetzt.
- [ ] Weitere neun Schicksalsmonster als einzelne originäre WebP-Illustrationen erstellen und integrieren.
- [ ] Visuelle Stil-/Crop-Abnahme aller drei neuen Motive, weitere fünf ursprüngliche QA-Artworkfälle (Eibenwächter usw.) offen.
