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
