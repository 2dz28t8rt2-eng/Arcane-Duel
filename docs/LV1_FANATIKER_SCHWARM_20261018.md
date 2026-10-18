# Arcane Duel · Level-1-Fanatiker und Schwarmstrategie · Entwicklungsstand 18.10.2026

Branch: development. Hauptversion main bleibt unberührt.

## Story und Erwerb
- Zufall nach manuellen PvE-Duellen: Turnierstufen I–III 30 %, ab IV 50 %.
- Garantiert bei **einer** der Bedingungen (ODER): Spielerlevel 6, Turniergegner V besiegt, mindestens ein Drittel der regulären Lv1-Basiskartenarten gesammelt.
- Fünf Kapitel; Kapitel I: 2.000 LP, 40 Lv1-Basiskarten des Fanatikers, -30 ATK/-30 DEF auf seine Kreaturen und -50 auf Fusionswerte, nur geringe Erstbelohnung.
- Die Kapitel II–V bieten geliehene Lv1-Decks; der Fanatiker entwickelt ein zunehmend aggressives, aber testweise generisches Deck. Fortgeschrittene Stufen erhalten höhere LP.
- Nach dem Finale: Lv1-Perk, einmaliges ACE Urfunke, zehn unabhängige Boosterwürfe mit 50 % Chance pro 3-Karten-Pack, 30 % Fusionsauswahl pro Karte. Story- und Belohnungsstatus bleiben erhalten.

## Bereits eingebaut
- Floating: echtes Lv1-Feldmaterial erzeugt Wahl zwischen effektlosem Echo und echtem zufälligem Lv1-Monster aus dem Deck; das Deck wird tatsächlich verbraucht.
- Trauerschwarm: verbleibende Lv1-Monster erhalten befristet +8/+8 je echtem Abgang.
- Swarm: echtes Lv1 auf dem Feld erzeugt Echo; effektlose Kopien lösen keine eigene Kette aus. +10 ATK/DEF pro weiterem Lv1 auf dem regulären Feld beziehungsweise stationiertem Geisterslot; aktives Locken blockiert Original für einen Zug zugunsten einer Kopie.
- Triggerlimit derzeit maximal fünf Floating- und fünf Swarm-Auslösungen pro Halbzug; Angebote werden zur Hand/Fusion bereitgestellt.
- Drei wenige Spezialfusionen (Hive, Violettwacht, Schwarmklinge); einzigartige Level-1-ACE-Karte Urfunke.
- Spezialfusionen erhalten Fünfling-Bonus ohne Dopplung plus individuelle Flatstats. Eine tatsächliche reine Lv1-Fünferfusion erhält +5 Prozentpunkte Qualität.
- Hive: Geisterslots bis fünf, Geistererzeugung bei Lv1-Beschwörung und Abgang, Verbrauch belegter Geister für Wiederbelebung, LP-Regeneration pro Geist. Ein Geist kann als neutrales Lv2-Katalysatormaterial in die Hand übernommen werden.
- In den Geisterslots lassen sich alternativ Lv1-Handkarten stationieren und zurückholen. Sie zählen zum Schwarm, sind **noch keine vollständigen zusätzlichen Angriffspositionen**.
- Protector: Umleitung gegnerischer Einzelangriffe, DEF als HP auch in Angriffsposition für geschützte Lv1-Monster, Heilen und stapelnde Schutzorbs.
- Attacker: zwei Angriffe, Wachstum, Kopien und verringerte Ermüdung. Der normale Lv1-Statzerfall wird teilweise kompensiert.
- ACE: fest 111/111, 30%-ATK-Seelenblitz je eigener Runde, LP- und Selbstheilung, einmalige Rettung.
- SVG-Artworks für alle vier Monster, violette Glows, UI-Geschichtsreihe und Kampf-FX.

## Architektur und Vorsicht
- Neue Kampflogik in assets/lv1-swarm-v43.js, Geschichte in assets/lv1-saga-v43.js, Styling in assets/lv1-saga-v43.css.
- Alle Mechaniken PvE-only; klassisches PvP wird nicht geändert.
- Neues Karteninventar wird nach dem historischen Katalog registriert, damit alte Index-/Boss-Tests stabil bleiben.
- Bei Neustart wird eine konservative Legacy-Projektion validiert; erst nach Registrierung werden neue Lv1-IDs, Kartenbesitz und Storyfortschritt wiederhergestellt.
- Die Fähigkeiten sind absichtlich erste Balancewerte. Insbesondere Endgame-Bossparität, vollständiger Kampf mit Figuren auf Geisterslots, Mehrfach-Fusionen über Geisterslots sowie Spezialeffekte bei übereinanderliegenden Fähigkeiten brauchen weitere Tests und Abstimmung.
- Manuelle Grafik-/Interaktionsabnahme am echten Browser noch empfohlen; automatisierte Node- und Chromium-Checks sind maßgeblich für technische Regressionen.

## Nächste QA
1. Alle fünf Kapitel vom frischen Profil und alten Speicherstand einmal durchspielen.
2. Floating-/Swarm-Ketten samt Deckerschöpfung, Handlimit, Geisterverbrauch und Speicherrückkehr testen.
3. Protector-Hive-Loop gegen starke Gegner; ACE Selbstheilung gegen Angriff und Verteidigung.
4. Exklusive Karten und Belohnungswahrscheinlichkeiten verifizieren.
5. Geisterslots zu vollwertigen interaktiven Kampffeldern ausbauen, falls nach Test gewünscht.

## 18. Oktober · nachgezogene Spielintegration v4.4
- Vier freigegebene hochwertige Illustrationen als eigene WebP-Dateien im GitHub-Repository (768 × 1024 Pixel), eingebunden in die Spezialkarten.
- **Nekroth · König des Seelenschwarms**: Level 1 · 130 ATK / 610 DEF (zusätzlich +100 DEF bei eigener Spezialfusion). Geisterslots, Wiederbelebung, Floating-Verdopplung und 20 LP pro besetztem Geisterslot.
- **Aegurion · Hüter der Funken**: Level 1 · 60 ATK / 780 DEF (zusätzlich +200 DEF). Umleitung gegnerischer Einzelangriffe, DEF-Lebensbalken auf Lv1-Kreaturen in beiden Positionen, Heilung und Schutzorbs.
- **Nyxar · Klinge des Schwarms**: Level 1 · 590 ATK / 170 DEF (zusätzlich +120 ATK). Bis zu zwei Angriffe je Zug, wachsende ATK, effektlose Kopien und halbierter Lv1-Angriffszerfall.
- **Lumira · Der erste Funke**: Level 1 · exakt 111 ATK / 111 DEF. Automatischer Seelenblitz mit 30 % ATK je eigener Runde, Lebensverknüpfung bei LP- und Monster-Schaden, einmaliges Überleben mit 1 DEF.
- Effektbeschwörungen aus Floating/Swarm dürfen trotz bereits verwendeter normaler Beschwörung unmittelbar zur Feldplatzierung oder Feldfusion verwendet werden. Leere Warteschlangenplätze werden vor dem Verbrauch einer Deckkarte geprüft.
- Alle fünf Story-Kapitel sind nicht länger nur Duellsiege: Kapitel II verlangt Floating, Kapitel III Swarm, Kapitel IV eine Klassenfusion und Kapitel V die Kombination aller drei Mechaniken in einem Duell.
- Finale in fünf eigens animierten, einzeln weiterklickbaren Szenen mit Artworks, Runen, Perk-Enthüllung, ACE und Boosterresultat.
- Geisterslots nehmen Level-1-Karten als spielbare Unterstützung auf; sie können von dort angreifen und bei leerem Hauptfeld direkte Angriffe abfangen. Ein besetzter Geisterslot bleibt alternativ Wiederbelebungs-, Heilungs- oder Stufe-2-Materialressource.
- Violette Effekte für Buffs, Wiederbelebungen, Schild- und Heilungsorbs sowie sichtbare Seelenprojektil-Flugbahn.
- Neue Tests: research events, Spezialkarten-Artworks, Effektbeschwörungen, Ghost-Slot-Angriffe und Zielumleitung. Bestehende Spielregel-, Strategie- und Browser-Smoke-Tests bleiben erhalten.

### Abnahmehinweise
Die automatisierten Regressionen sind Voraussetzung, aber keine Garantie für fehlerfreie lange Spielrunden. Event-Balance (insbesondere der Nekroth/Aegurion-Kombination) und die Benutzerführung bei mehreren gleichzeitigen Floating-Auslösungen sollten nach der Abnahme weiterhin durch einen vollständigen manuellen PvE-Durchlauf kontrolliert werden. Das bestehende PvP wird von der Forschung nicht freigeschaltet.

## 18. Oktober · alle vier Spezialkreaturen Level 1
- Nekroth, Aegurion und Nyxar sind künftig **Level-1-Klassenfusionen** (ihre Fusionskartenart und die nötigen Materialien bleiben erhalten). Lumira war bereits Level 1.
- Alle vier werden von der Level-1-Schwarmberechnung, Auren, Buffs und dem allgemeinen Lv1-Zerfall erfasst. Die Klassenfusionen sind keine klonbaren Basismonster: Floating und Swarm erzeugen deshalb keine selbstständig vervielfältigbaren Fusionskopien.
- Alle vier können in erweiterte Geisterslots stationiert werden. Die Auswahl erlaubt, eine normale Level-1-Handkarte zu beschwören oder eine bereits auf dem Feld gespielte Level-1-Fusion dorthin zu verlegen.
- Die stationierten Spezialfusionen halten ihre Fähigkeiten aufrecht; Aegurion kann auch aus dem Geisterslot Gegnerangriffe auf sich ziehen. Bei Rückkehr einer Fusion muss ein normaler Feldplatz frei sein.
- Eine scheidende Level-1-Fusion erteilt übrigen Lv1-Kreaturen den Trauerschwarm-Bonus, löst aber selbst keine Floating-Kopie aus. Gesonderte Regressionstests sichern Status, Geisterslots und Schutzmechanik ab.

## Level-1-Fanatiker mit Lumira – fünf eigenständige Gegnerdecks
Die fünf Fanatiker-Herausforderungen nutzen je ein abgestimmtes 40-Karten-Hauptdeck (maximal drei Exemplare pro normaler Karte). Lumira ist keine der 40 Deckkarten, sondern wird als garantierte fünfte Starthandkarte vergeben. Die KI spielt sie bei erster legaler Gelegenheit zwingend zuerst aus. Ohne Level-1-Erwachen bleibt sie kampftechnisch ohne Spezialeffekte. Nach jeder ihrer fünf Beschwörungen erscheint ein eigener, zunehmend resignierter Dialog mit animierter Kartendarstellung.

| Herausforderung | Spielstil | Maximales Normalmonster-Level | Level-1-Karten | Gegner-Power | LP |
|---|---|---|---|---|---|
| I | Exzentrischer, hoffnungslos schwacher Forscher | 1 | 40 | 0,38 | 2.000 |
| II | Forscher, der erste höhere Wesen ausprobiert | 2 | 32 | 0,49 | 3.000 |
| III | Erste harte Predator-Eskalation aus Neid | 4 | 14 | 0,77 | 4.500 |
| IV | Verbittert, aggressiv, geringere Synergien | 5 | 5 | 0,73 | 5.200 |
| V | Reiner Beatdown, spektakulärer Boss | 7 | 0 | 0,93 | 7.000 |

**Finaler Boss:** Lumiras Fall – Die verderbte Flamme. Einmalige korrumpierte Level-5-Predator-Fusion aus Lumiras Geschichte mit 920 ATK und 220 DEF als Grundwerten (danach die regulären Fusionswürfe und Gegner-Power), individueller WebP-Illustration und eigenem rotem Einmarschdialog. Sie hat bewusst **keine mächtigen eigenen Fähigkeiten** und ist ausschließlich im fünften Gegner-Fusionsdeck erhältlich. Nach Lumiras Hoffnungsmoment versucht die Gegner-KI gezielt, die Verderbnis aus drei bis fünf Materialien zu erschaffen.

Der neue Test lv1-fanatic-ace-v48.test.cjs prüft Kartengarantie, Zwangsbeschwörung, Versiegelung, Deckstruktur und die korrumpierte Fusion. Für endgültige Balance sind längere manuelle Kämpfe weiterhin sinnvoll. Der Branch main wurde nicht geändert.
