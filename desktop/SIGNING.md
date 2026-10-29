# Arcane Duel: Windows-Code-Signing

## Aktueller Status

Die automatisch aus dem `development`-Branch gebaute portable EXE ist
**unsigniert**. Das ist beabsichtigt: Auf einem Entwicklungsbranch dürfen keine
Herausgeber-Zertifikate oder Cloud-Signierungsrechte verwendet werden. Das neue
Programmsymbol ist **keine digitale Signatur**.

Ein Windows-Code-Signing-Zertifikat oder ein Signing-Dienst muss erst durch den
Herausgeber eingerichtet und dessen Identität geprüft werden. Eine
selbstsignierte Signatur hilft beim lokalen Test, wird aber von Windows auf
fremden PCs nicht automatisch vertraut.

## Empfohlener Weg zur späteren signierten Veröffentlichung

1. Eine Herausgeberidentität festlegen (Privatperson oder Organisation).
2. Einen vertrauenswürdigen Signing-Weg einrichten:
   - Code-Signing-Zertifikat einer anerkannten Zertifizierungsstelle (CA),
     sofern als nutzbare `.pfx`-Datei verfügbar, oder
   - Microsoft **Artifact Signing** (vormals Trusted Signing) als Cloud-Dienst,
     falls der Account und das Land für die Identitätsprüfung zugelassen sind.
3. Signing-Zugangsdaten **niemals** in Git, Quellcode, Chat oder Logs ablegen.
4. Ausschließlich für geprüfte Release-Tags / einen geschützten Release-Job
   die nötigen GitHub-Actions-Secrets bereitstellen. Nicht im automatischen
   `development`-Workflow.
5. Die EXE während des Packaging-Prozesses signieren, damit sowohl das
   eingebettete Programm als auch die portable Ausgabe korrekt signiert werden.
6. Vor Veröffentlichung die Signatur prüfen und die endgültige EXE nach dem
   Signieren nicht mehr verändern.

### Zertifikatsdatei mit electron-builder

Für ein geeignetes Windows-Code-Signing-Zertifikat kann electron-builder v26
folgende Umgebungsvariablen verwenden:

- `WIN_CSC_LINK`: Pfad oder Base64-Inhalt einer Zertifikatsdatei `.pfx`/`.p12`
- `WIN_CSC_KEY_PASSWORD`: Passwort für das Zertifikat

Wenn diese Werte sicher in einer **geschützten Release-Umgebung** verfügbar
sind, signiert electron-builder beim `npm run dist:portable` automatisch.
In einem Release-Build muss `forceCodeSigning: true` gesetzt werden, damit
fehlende oder ungültige Signierung den Build fehlschlagen lässt. Für den
bestehenden unsignierten Dev-Build ist das **nicht** gesetzt.

Microsoft Artifact Signing braucht eine eigene Cloud-Einrichtung und eine
passende Konfiguration für electron-builder. Wir legen diese erst nach der
Entscheidung für den Anbieter an; bis dahin existieren keine gültigen
Signierungszugänge.

### Bereits gebaute EXE lokal signieren

Hat man ein gültiges Zertifikat im Windows-Zertifikatspeicher, kann Microsofts
`signtool.exe` aus dem Windows SDK auch eine bestehende EXE signieren:

```powershell
signtool sign /a /fd SHA256 /tr http://timestamp.digicert.com /td SHA256 "ArcaneDuel-0.1.1-portable.exe"
signtool verify /pa /v "ArcaneDuel-0.1.1-portable.exe"
```

Das ist für Einzeldateien praktikabel. Für produktive Electron-Releases ist
die Signierung **während** des Builds vorzuziehen, da das portable Paket
weitere ausführbare Dateien enthalten kann.

Ohne Signing-Zertifikat lässt sich der aktuelle Status unter Windows mit
PowerShell prüfen:

```powershell
Get-AuthenticodeSignature .\ArcaneDuel-0.1.1-portable.exe | Format-List Status,SignerCertificate
```

Auch eine gültige Signatur garantiert nicht, dass Microsoft SmartScreen bei
einer komplett neuen Anwendung sofort keine Warnung zeigt. Dafür muss sich
häufig erst eine positive Download-/Herausgeber-Reputation entwickeln.

## Dokumentation

- Microsoft SignTool: <https://learn.microsoft.com/en-us/windows/win32/seccrypto/signtool>
- Microsoft SmartScreen: <https://learn.microsoft.com/en-us/windows/apps/package-and-deploy/smartscreen-reputation>
- electron-builder v26 Code Signing: <https://www.electron.build/v26/docs/features/code-signing/>
- electron-builder v26 Windows Signing: <https://www.electron.build/v26/docs/features/code-signing/code-signing-win/>
