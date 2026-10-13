# Arcane Duel – Alpha 2.0 DEV

## Umfang

Dieser Stand ergänzt Alpha 1.9 um einen sicheren **Spielstand-Reset** und aktualisiert die Versionskennzeichnung auf **Alpha 2.0 DEV**. Änderungen wurden ausschließlich in `development` vorgenommen. Die öffentliche `main`-Version bleibt unverändert, bis der Nutzer sie freigibt.

## Bedienung

Im Hauptmenü unter **Spielstand → Spielstand zurücksetzen …**:

1. **Sicherheitsabfrage 1/2:** Der Spieler liest, welche Daten verloren gehen, und kann abbrechen.
2. **Sicherheitsabfrage 2/2:** Die konkrete Profilvariante wird erneut genannt. Der Spieler muss das Wort **ZURÜCKSETZEN** eintippen, erst dann wird die endgültige Schaltfläche aktiv.
3. Nach der endgültigen Bestätigung wird **nur der aktuelle Profil-Speicherschlüssel** mit einem vollständig neuen, validierten Profil ersetzt. Anschließend lädt die Seite neu.

### Normal und Admin

- Normalversion `index.html`: startet wieder beim ursprünglichen Stand mit Startkarten und Fortschritt 0, inklusive Handbuch beim ersten Start.
- Adminversion `admin.html`: beginnt nach dem Reset mit dem eingerichteten **Admin-Teststand**, einschließlich freigeschalteter Karten, Turniergegner, Ressourcen und Skills.
- Normal und Admin verwenden unterschiedliche Schlüssel: `arcane-duel-rpg-profile-v3` und `arcane-duel-admin-profile-v3`. Ein Reset verändert **nicht** den anderen Schlüssel.
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
- Admin: `https://raw.githack.com/2dz28t8rt2-eng/Arcane-Duel/development/admin.html`

Hinweis: Browser-Speicher sind an die exakte Website-Domain gebunden. Hauptversion (GitHub Pages) und externe DEV-Vorschau können deshalb unterschiedliche Spielstände besitzen.
