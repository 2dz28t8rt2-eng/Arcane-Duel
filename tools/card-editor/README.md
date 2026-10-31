# Arcane Duel · Karten-Editor

Windows-Editor zum Erstellen einzelner Kartenentwürfe mit Vorschau, Bildauswahl und Kartenpaketen.

## Bedienung

1. Werte eingeben und ein PNG-, JPEG-, BMP- oder GIF-Bild auswählen.
2. Eindeutige ID mit dem bestehenden Projekt abgleichen.
3. Oben auf „Save“ klicken und ein ZIP-Kartenpaket speichern. Es enthält die Kartendaten und das Bild.
4. Der anschließende Dialog zeigt den Speicherpfad und kopiert ihn auf Wunsch in die Zwischenablage. Er sendet oder teilt nichts automatisch. Ein Pfad funktioniert für die Unterhaltung nur, wenn sie auf demselben Computer läuft und den Ordner lesen darf; andernfalls das ZIP im Chat hochladen.
5. Über „Karte öffnen“ kann das gespeicherte ZIP später mitsamt Bild wieder geöffnet werden.

Weitere Felder wie `source`, `lv1Special` oder `fusionReference` können als JSON eingegeben werden. Beim Öffnen einer einzelnen JSON-Karte bleiben unbekannte Felder erhalten. Die Vorschau ist eine eigenständige Annäherung, nicht die Spielfront.

**Wichtig:** Das Paket integriert Karten nicht automatisch ins Spiel. Das Projekt erzeugt seinen Duo-Katalog aus bestehenden Spieldaten; der Entwickler muss die maßgebliche Datenquelle, ID, Artwork, Verfügbarkeit, Fusionen und gegebenenfalls das Online-Backend anpassen und testen. Fähigkeitstext implementiert keine Spiellogik. Den bestehenden Katalog nicht überschreiben.

## Build

`dotnet publish tools/card-editor/ArcaneDuelKartenEditor.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true`

Der GitHub-Actions-Lauf stellt die Windows-EXE als zeitlich begrenztes Build-Artefakt bereit. Der Download erfordert eine GitHub-Anmeldung und ausreichenden Zugriff auf den Lauf.
