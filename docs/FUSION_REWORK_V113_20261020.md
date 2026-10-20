# Arcane Duel v11.3 – Fusions-Rework und UI (20. Oktober 2026)

Entwicklungszweig: **development**; **main** wurde nicht verändert.

## Motivation
Das bisherige Fusionsbudget bestrafte große Materiallevel-Abstände auch bei absichtlich gesammelten Pokerstraßen. Eine LV-6-Fusion mit LV-3-Feldmaterial konnte deshalb auf maximal LV 5 zurückfallen. Zwei bis fünf Materialmonster, Kernkartenwahl, echte zweite Feldfusion und übertragene Fusionsqualität brauchen eine gemeinsame Regel.

## Vereinbarte Spielregeln
- Im PvE markiert der Spieler eines der bis zu fünf Handmaterialien ausdrücklich als **Kernkarte**. Standardmäßig wird das höchste Monster als Kern ausgewählt. Bei gültigen Pokerstraßen wird die höchste Levelkarte automatisch Referenz: Klickreihenfolge darf nicht die Belohnung beeinflussen.
- Kernmonster-Level und nächstes möglichst passendes Material bestimmen den Grundrang; Materialien 3, 4 und 5 gehen zusätzlich mit Gewichten von **75 %, 55 % und 40 %** in die Materialqualität ein. Bei drei bis fünf insgesamt gut passenden Materialien kann einmalig **+1 Level** gewährt werden.
- Level 1+1 erlaubt weiterhin den legalen LV-2-Einstieg. Zwei LV-2-Karten können nicht direkt eine LV-6-Vorlage erzeugen.
- Vollständige aufeinanderfolgende Reihen: **Kleine Straße** (3 Karten), **Große Straße** (4 Karten), **Gigantische Straße** (5 Karten). Die Levelabstandsstrafe entfällt für die abgeschlossene Straße. Die bereits existierenden Pokerwürfe, Elementharmonie und Spezialboni bleiben erhalten.
- Bestehende Fusionen werden als eigene weiterverwendbare Monster statt als ihre sämtlichen ursprünglichen Einzelmaterialien behandelt. Fusionen als Kern erhalten mindestens ihren erreichten Rang; ihr Levelaufstieg ist langsamer. **35 %** der zuvor *neu erworbenen* zusätzlichen Qualität werden vererbt, höchstens **15 %**. Bereits vererbte Qualität wird nicht erneut vererbt.
- Der erreichbare Rang ist höchstens LV 10 und weiterhin durch tatsächlich vorhandene und nicht verbrauchte Fusion-Templates begrenzt. Pro Fusion wird eine echte Vorlage verbraucht; eine Handfusion und anschließende Feldfusion kosten jeweils eine Vorlage. Die besonderen LV-1-Questrezepte und klassisches PvP behalten ihre gesonderten Regeln.
- Die bestehende Engine prägt die aus Materialien ermittelte **Kampfrolle vor ATK/DEF-Würfen**. Danach greifen die vorhandenen Pokerwürfe, Materialboni, Elementharmonie, Allrounder-/Resonator-Resonanz und begrenzte Vererbung; keine zweite Rollenmultiplikation.
- Ein individuelles, über Materialien erhaltenes Rollen-Tag übersteuert zur Anzeige und in Kampfregeln das eventuell anders lautende Rollenetikett des Katalogtemplates.

## Spielerfreundliche Oberfläche
- Direkt in der Beschwörungszentrale **Als Kernkarte** wählen; die Vorhersage zeigt das tatsächliche Materialbudget.
- Klick auf **? Warum dieses Level?** erklärt Kernniveau, Materialbeiträge, Poker, Rollen, Resonanz, geerbte Qualität und eine konkrete Möglichkeit, ein höheres Level zu erreichen. Das Ansehen verbraucht keinerlei Material.
- In-game Handbuch **Fusionen meistern** mit unterschiedlichen Materialbeispielen und Schritt-für-Schritt-Hilfe.
- Eigenständiger stärkerer Spezialstempel für die **Gigantische Straße** sowie optisch zelebrierter Levelauftakt.
- Angriffe: sichtbarer Karten-Vorstoß und Trefferexplosion, mit verzögerter Bewegung frisch gespielter Monster; Steuerung wird selbst bei gedrosselter/angehaltener Web Animation zeitlich sicher freigegeben.
- Ältere v11.2-Verbesserungen (Booster-Popup, Währungsglühen, kompakter Summon-Bereich, Rollenforschung, korrigierte Turnierverlust-Dropladungen) bleiben bestehen.

## Absicherung
- \`tests/fusion-rework-v113.test.cjs\`: Muster in unterschiedlicher Reihenfolge, Schwachmaterialien und Stufengrenzen, tatsächliche Feldweiterfusionen, Vererbung, Rollenprägung, Erklärhelfer, unverändertes PvP.
- \`tests/fusion-save-stress-v113.test.cjs\`: synthetisches Turnier-Szenario, bei dem ein seltenes gebrochenes DEF-Heilergebnis aus der Wächter-KI zuvor den Speicherstandsvalidator scheitern ließ.
- \`tests/browser-fusion-tutorial-v113.html\`: reale Desktop/Mobil-Klicks auf Kernkarte und Hilfebutton.
- Ältere umfassende strategische und visuelle GitHub-Actions-Workflows bleiben als Gegenprüfung aktiv.

## Weiterführendes Balancing
Das neue System macht Endgame-Fusionen **erreichbarer**, ohne Karten oder Ressourcen zu verschenken. Seine Auswirkungen auf wirklich erspielte LV-7–10-Decks und Gegner VII–X sind noch separat mit holdout-basierten Karrieren zu messen; ein grüner Komponententest ist keine solche Balancing-Bestätigung.
