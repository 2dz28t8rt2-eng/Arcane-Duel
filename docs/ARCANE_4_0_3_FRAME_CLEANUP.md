# Arcane Duel 4.0.3 – Rahmenbereinigung

**Behobene Ursache:** Die Levelgravur erschien gleichzeitig als Teil des `background-image` und in `::before`; zusätzlich zeichneten ältere 3.0-Rahmen zusätzliche Kupferleisten, Glanzstreifen, ACE-Ecken und doppelte Außenkonturen.

## Eindeutiger Rahmenaufbau

- **Genau ein Grundrahmen:** das vorhandene, offizielle SVG der Familie/Stufe (`normal-01` bis `essence-05`) als Hintergrund des jeweiligen Karten-Containers.
- **Genau ein Levelornament:** `normal-lv01` usw. ausschließlich im transparenten `::before`.
- Alte Rahmen-Pseudo-Elemente, separate Metallränder, Doppel-Outlines, alte Levelmedaillons und Rahmenanimationen werden **nur für Karten mit `ad-template ad-level-frame`** deaktiviert.
- Auswahlmarkierungen, Fusion-Auswahl, Tastaturfokus und Verteidigungsmodus bleiben eigenständig sichtbar; die besonderen Schicksalskarten (`tc-fate`) werden **nicht** verändert.
- Alte CSS-Dateien werden nicht global entfernt, damit andere Oberflächen/ältere Schicksals- und Spezialansichten stabil bleiben. Es gibt **keine zusätzliche Stylesheet-Ebene**; stattdessen wurden die vorhandenen `assets/card-level-frames-v401.css` und `assets/card-level-runtime-v402.css` bereinigt.
- Daten, Monsterbilder, Balance, Werte, Speicherstände, Animationen außerhalb des Rahmens und Encounter-Logik bleiben unverändert.

## Abnahme

`tests/browser-card-templates.html` prüft im echten Browser:
- ACE-L10 und Fusions-L7: ein SVG-Rahmen im Hintergrund und genau eine Levelgravur in `::before`.
- Keine alten ACE-Regalia-Assets, animierten oder verdoppelten Ränder, kein `::after`-Bronzeglyph.
- Einfarbiger Außenrand, keine ACE-Doppelumrandung; Auswahlmarkierung bleibt sichtbar.

Automatisierte Checks: `npm test` und GitHub Actions Browser-Smoke-Test auf Desktop und Mobilansicht. Hauptspiel-Bilder aus dem Nutzer-Screenshot wurden **nicht** ersetzt.
