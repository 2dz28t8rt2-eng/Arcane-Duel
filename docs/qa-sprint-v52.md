# Arcane Duel – QA Sprint 5.2 (2026-10-18)

## Im development-Branch implementiert (noch nicht vollständig im Browser getestet)
- ACE-Normalmonster: stärkere Wertebudgets (~190 % eines normalen Lv-Budgets statt der zuvor schwachen Werte); Lumira bleibt unverändert bei 111/111.
- Wächter: aktive Fähigkeit **Schildstoß** nur in DEF, einmal pro Zug, 30 % aktuelle ATK als Schaden am ATK-/DEF-Wert der Zielkarte; kein direkter LP-Schaden.
- Erfolgreicher aktiver Seelenraub: einmalige Pause beim natürlichen Werte- und Seelenzerfall in diesem eigenen Zug; Cooldowns laufen weiter.
- Fusion 3+2: Anzeige zwingend *Full House*, keine erneute Würfelberechnung. Die eigentliche Berechnungsfunktion erkennt 3+2 bereits vor Drilling.
- Fusionen mit Rollentag Resonator: sichtbare Rollenbeschriftung im Feld und in der großen Karte.
- Fanatiker: Schicksalszug ausgeschlossen, Lumira als normales oder erzwungenes Fusionsmaterial geschützt; bei zerstörter Lumira zunehmende Zweifel im Dialog. Achtung: alter Finale-Handlungsstrang »Lumiras Fall durch Opferfusion« ist so nicht mehr erreichbar; dramaturgische Anpassung offen.
- Questreihe: erstes Kapitel als normales Duell beschrieben, Forschungsaufgaben werden danach erklärt, Leihdeckhinweis, weniger Belohnungsspoiler, konkretere Ziel-Hinweise, Fortschrittsdiagnose und Button zum Folgekapitel.
- Für Stufe II wird ein fehlender Floating-Zähler bei echter protokollierter Lv1-Feldzerstörung rückwirkend innerhalb des aktuellen Duells rekonstruiert; bloßer Sieg ohne Lernziel zählt weiterhin nicht.
- Schicksalszug: Klick/Escape beendet die Inszenierung; automatische Ausblendung nach 15 Sekunden.
- Gegnerkartenvorschau: Capture-Handler verhindert ältere Vollbild-Modals und nutzt den linken Duellinspektor.
- ACE-Beschwörung: neue elementabhängige Einschlag-, Partikel- und Runenanimation.
- Resonanzwerte **unverändert**: Allrounder 4/8/12/16 %, Resonator 10/20/30 %.

## Noch offen
- Wirklich neue, hochauflösende **einzelne Artwork-Dateien** und Einbindung für Nebelkaiser, Runengeist der Schwelle, Eibenwächter, Rubin-Seraph, Waldgeist Veyra, Bastion Ferrus, Eisenzahn; vorhandene lizenzierte Originalwerke nach Möglichkeit wiederverwenden und Lizenzhinweise prüfen.
- Eiman Huels Deck auf Platzhalterzeichnungen untersuchen und individuell ersetzen.
- Durchgängige Browser-/Gameplay-Tests: Quest II → III mit vorhandenem Save, Turniergegner IV/V, KI-Positionswechsel nach Angriff, Bildschirmpopup, iPhone-Layout, aktive Seelenraub-Ladungen, Schildstoß und Schicksalszug.
- Bossfinale ohne Opferfusion für Lumira dramaturgisch und technisch neu gestalten.
- Qualitätsrelevante Designabwägung: Wächter-Schildstoß verursacht bewusst Kartenstat-Schaden statt LP-Schaden; nach Spieltest neu balancieren.
- Bereits beendete und gespeicherte Duelle ohne erhaltenes Floating-Ereignis können nicht automatisch als erfolgreich zertifiziert werden: entsprechendes Kapitel erneut absolvieren.

## Qualitätsgrenzen
Statische JavaScript-Syntax geprüft. Es gab in diesem Durchlauf keinen vollständigen Browser-End-to-End-Test und keine automatisierte Simulation sämtlicher Gegner. Die Einbindung in `index.html` ist erfolgt; `main` blieb unangetastet.
