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
- **Nekroth · König des Seelenschwarms**: Level 3 · 130 ATK / 610 DEF (zusätzlich +100 DEF bei eigener Spezialfusion). Geisterslots, Wiederbelebung, Floating-Verdopplung und 20 LP pro besetztem Geisterslot.
- **Aegurion · Hüter der Funken**: Level 3 · 60 ATK / 780 DEF (zusätzlich +200 DEF). Umleitung gegnerischer Einzelangriffe, DEF-Lebensbalken auf Lv1-Kreaturen in beiden Positionen, Heilung und Schutzorbs.
- **Nyxar · Klinge des Schwarms**: Level 3 · 590 ATK / 170 DEF (zusätzlich +120 ATK). Bis zu zwei Angriffe je Zug, wachsende ATK, effektlose Kopien und halbierter Lv1-Angriffszerfall.
- **Lumira · Der erste Funke**: Level 1 · exakt 111 ATK / 111 DEF. Automatischer Seelenblitz mit 30 % ATK je eigener Runde, Lebensverknüpfung bei LP- und Monster-Schaden, einmaliges Überleben mit 1 DEF.
- Effektbeschwörungen aus Floating/Swarm dürfen trotz bereits verwendeter normaler Beschwörung unmittelbar zur Feldplatzierung oder Feldfusion verwendet werden. Leere Warteschlangenplätze werden vor dem Verbrauch einer Deckkarte geprüft.
- Alle fünf Story-Kapitel sind nicht länger nur Duellsiege: Kapitel II verlangt Floating, Kapitel III Swarm, Kapitel IV eine Klassenfusion und Kapitel V die Kombination aller drei Mechaniken in einem Duell.
- Finale in fünf eigens animierten, einzeln weiterklickbaren Szenen mit Artworks, Runen, Perk-Enthüllung, ACE und Boosterresultat.
- Geisterslots nehmen Level-1-Karten als spielbare Unterstützung auf; sie können von dort angreifen und bei leerem Hauptfeld direkte Angriffe abfangen. Ein besetzter Geisterslot bleibt alternativ Wiederbelebungs-, Heilungs- oder Stufe-2-Materialressource.
- Violette Effekte für Buffs, Wiederbelebungen, Schild- und Heilungsorbs sowie sichtbare Seelenprojektil-Flugbahn.
- Neue Tests: research events, Spezialkarten-Artworks, Effektbeschwörungen, Ghost-Slot-Angriffe und Zielumleitung. Bestehende Spielregel-, Strategie- und Browser-Smoke-Tests bleiben erhalten.

### Abnahmehinweise
Die automatisierten Regressionen sind Voraussetzung, aber keine Garantie für fehlerfreie lange Spielrunden. Event-Balance (insbesondere der Nekroth/Aegurion-Kombination) und die Benutzerführung bei mehreren gleichzeitigen Floating-Auslösungen sollten nach der Abnahme weiterhin durch einen vollständigen manuellen PvE-Durchlauf kontrolliert werden. Das bestehende PvP wird von der Forschung nicht freigeschaltet.
