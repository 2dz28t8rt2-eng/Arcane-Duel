# Arcane Duel – Alpha 2.0 DEV

## Umfang

Dieser Stand ergänzt Alpha 1.9 um einen sicheren **Spielstand-Reset** und aktualisiert die Versionskennzeichnung auf **Alpha 2.0 DEV**. Änderungen wurden ausschließlich in `development` vorgenommen. Die öffentliche `main`-Version bleibt unverändert, bis der Nutzer sie freigibt.

## Bedienung

Im Hauptmenü unter **Spielstand → Spielstand zurücksetzen …**:

1. **Sicherheitsabfrage 1/2:** Der Spieler liest, welche Daten verloren gehen, und kann abbrechen.
2. **Sicherheitsabfrage 2/2:** Die konkrete Profilvariante wird erneut genannt. Der Spieler muss das Wort **ZURÜCKSETZEN** eintippen, erst dann wird die endgültige Schaltfläche aktiv.
3. Nach der endgültigen Bestätigung wird **nur der aktuelle Profil-Speicherschlüssel** mit einem vollständig neuen, validierten Profil ersetzt. Anschließend lädt die Seite neu.

### Regulärer Spielstand

- Normalversion `index.html`: startet wieder beim ursprünglichen Stand mit Startkarten und Fortschritt 0, inklusive Handbuch beim ersten Start.
- Weder `localStorage.clear()` noch das Löschen anderer Browserdaten wird verwendet.
- Es gibt **kein automatisches Backup**. Der Nutzer wird vorab zum JSON-Export aufgefordert. Abbrechen verändert keine Spielfortschrittswerte.

## Datensicherheit und Abbruchregeln

- Vor der Änderung wird geprüft, dass der Browser denselben Datensatz gespeichert hat wie beim Laden bzw. letzten Speichern durch diesen Tab. Hat ein zweiter Tab dazwischen gespeichert, **bricht der Reset ab**.
- Bei gemeldeten Speicherkonflikten oder Schreibblockaden wird nicht zurückgesetzt.
- Der neue Stand wird vor der Änderung durch die vorhandene Profilvalidierung geprüft und anschließend in **einem einzelnen Schreibvorgang** gespeichert.
- Nach erfolgreichem Speichern wird die Seite neu geladen, damit keine alten Duell-Timer, Deckentwürfe, Paketzustände oder Modals erhalten bleiben.

## Qualitätssicherung

- **69 automatische Tests** in GitHub Actions, einschließlich sieben neuer gezielter Reset-Tests.
- Echte Chrome-Tests für Kartenlayout auf Desktop und Mobilgröße, das Einsteigerhandbuch sowie bestehende Alpha-1.9-Interaktionen.
- Zusätzlicher **echter Chrome-Reset-Test**: Zwei Dialoge, Abbrechen, falscher Bestätigungstext, korrekter Bestätigungstext, Neuladen und getrennte Profile.
- Der potenziell noch bestehende Fusionsfehler nach „Wiederholen“ bleibt als separater manueller Testfall offen.

## Vorschau

- Normal: `https://raw.githack.com/2dz28t8rt2-eng/Arcane-Duel/development/index.html`

Hinweis: Browser-Speicher sind an die exakte Website-Domain gebunden. Hauptversion (GitHub Pages) und externe DEV-Vorschau können deshalb unterschiedliche Spielstände besitzen.

## Nachtrag: Fusionskarten direkt auswählen

- In der manuellen Fusionsvorschau sind die Karten selbst echte Auswahlschaltflächen: Klicken bzw. Tippen auf **Artwork oder Kartenkörper** löst dieselbe Auswahl aus wie der Button „Dieses Monster wählen“. Der bestehende legale Fusionspool wird nicht verändert; Doppelklick wird abgefangen.
- Die Vorschau zeigt ATK/DEF-Bereich, Wertewürfe, +/-6 %-Schwankung je Wurf, Materialbonus und verbleibende Fusionskarten in kompakter Form.
- Die längere Erklärung der Wertewürfe und Materialboni erscheint nur auf Wunsch über „Wertewürfe und Materialbonus verstehen“.
- Im Menü „Fusionsdeck“ ergänzt oder entfernt ein Klick auf das Kartenbild eine verfügbare Fusionskarte. Plus/Minus-Buttons bleiben erhalten.
- Das Auswahlfenster ist auf breite und schmale Bildschirme abgestimmt. Karten erhalten deutliche Hover-/Fokussierungseffekte. Die Bedienung funktioniert durch echte HTML-Buttons auch mit Tastatur.
- Zusätzlicher echter Chrome-Interaktionstest: Bildklick, korrekte Karten-ID, Modal schließen, keine Doppelwahl, Fusionsdeck-Bildklick. Auf `development` geprüft.

**Unverändert:** Die öffentliche Spielversion unter `main`, die Fusionsberechnung, die Regel zu legalen Vorlagen sowie der separat vorgemerkte Fehler beim Turnier-„Wiederholen“.

> **Aktueller Hinweis:** Die separate Admin-Version wurde entfernt. Es gibt nur noch `index.html` mit dem regulären Spielstand unter `arcane-duel-rpg-profile-v3`. Alte Admin-Daten werden weder importiert noch gelöscht.
