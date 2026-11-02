# Arcane Duel · Kartenbaukasten für Windows

Dieser Editor arbeitet mit **den Original-Assets des Spiels** und dem zum Zeitpunkt des Builds
gültigen Solo-/Duo-Kartenkatalog. Ein GitHub-Actions-Build erstellt eine **einzelne EXE für Windows 10/11**.

## Mitgelieferte Asset-Bibliothek

- **20 echte transparente SVG-Kartenrahmen**, aufgeteilt in Standard, Fusion, ACE und Essenz
  mit fünf Ausbaustufen.
- **40 SVG-Level-Ornamente**, je zehn für Standard, Fusion, ACE und Essenz.
- **8 Rollensymbole**, darunter Wächter-Schild und Seelenzehrer-Spirale.
- **Original-Monsterkatalog** (zurzeit 762 Karteneinträge) mit Namen, Level,
  ATK/DEF, Rollen, Elementen, Eigenschaften und Bildpfaden.
- **Kleine Offline-Vorschaubilder aller verfügbaren Monster-Artworks**. Die Vorschaubilder
  werden beim Windows-Build aus den echten Grafiken erzeugt, aber **nie**
  als Ersatz für die Originalbilder in die Spieldaten geschrieben.

Die originalen SVGs werden mit der Bibliothek `Svg.NET` direkt dargestellt.
Die Palette des Kartenhintergrunds ist frei wählbar; eigene transparente
SVG- und PNG-Rahmen lassen sich ergänzen.

## Karten bearbeiten

1. **Bestehende Karten bearbeiten** öffnen und nach Name, ID, Rolle oder Element suchen.
2. Bestehende Karte übernehmen. Ihre ursprüngliche ID, ihre Artwork-Referenz
   und alle unbekannten JSON-Felder bleiben erhalten.
3. Namen, Stufe, ATK/DEF, PvE-Boni, Rolle, Rollenspezialisierung,
   Seltenheit, Art, Element, Fähigkeitstext, Beschreibung, eigene Tags,
   Fusion-/ACE-/Essenz-Kennzeichen oder weitere JSON-Eigenschaften ändern.
4. In **Kartenbaukasten** eine Rahmenvorlage, Levelgravur und ein Rollensymbol wählen.
   Oder einen eigenen SVG-/PNG-Rahmen öffnen. **Aus Katalog** in der Artwork-Zeile
   erlaubt, das vorhandene Bild einer anderen Karte zu verwenden.
5. Über **PNG-Vorschau** ein fertiges Vorschaubild rendern.
6. Über **Save** ein ZIP-Paket mit `card.json`, neuen Bildern und optionalem
   eigenem Rahmen speichern. Das ZIP lässt sich über **Karte öffnen** wieder laden.

Für neue Artworks sind PNG/JPG/JPEG/GIF/BMP unterstützt. Die im Spiel
verwendeten WebP-Monster werden im Editor als eingebettete JPEG-Vorschauen
angezeigt; ihre ursprünglichen WebP-Pfade bleiben unverändert.

## Datensicherheit und Integration

**Es werden keine Live-Karten automatisch verändert.** Ein Export ist ein
**bearbeitbarer Entwicklungsentwurf**, kein sofortiger Eingriff in Spielerprofile,
Kampagnenfortschritt oder Online-2v2-Partien.

Bestehende Karten können durch ihre feste ID in Entwicklungsdateien
aktualisiert werden, aber das erfordert einen gezielten Integrationsschritt:
Solo-Kartenquelle, Fusions-/Levelbudget, eventuell notwendige Loot- und
Deck-Freischaltungen sowie die beiden Duo-Katalogkopien kontrollieren;
anschließend Tests und bei Online-Funktionen ein Backend-Deployment durchführen.
Die Export-ZIP absichtlich **nicht ungeprüft** über ein laufendes Spiel kopieren.
Eigene Freitext-Fähigkeiten sind zunächst Text, keine implementierten Effekte.

## Build

```powershell
python -m pip install Pillow==11.3.0
python tools/card-editor/generate_thumbnails.py
dotnet publish tools/card-editor/ArcaneDuelKartenEditor.csproj -c Release -r win-x64 --self-contained true -p:PublishSingleFile=true -o out
out/ArcaneDuelKartenEditor.exe --self-test
```

GitHub Actions führt diese Schritte automatisch aus und veröffentlicht
**Arcane-Duel-Karten-Editor-Windows** als Windows-EXE im Workflow-Artefakt.
Für die Selbsttests werden die **20 Rahmen**, die **40 Level-Verzierungen**, die
**Original-Rollensymbole**, die **Katalogkarten**, ein kompletter
Bearbeitungs-/ZIP-Wiedereinlesezyklus sowie das Rendering mit SVG überprüft.


## Erweiterter Karteneditor: Bedienung und Ablage

- Die Fensteransicht ist in die Reiter Monster & Werte, Artwork, Kartendesign und Erweitert gegliedert.
- Bestehende Karten bearbeiten: Volltextsuche sowie kombinierbare Filter für Rolle, Element, Stufe, Typ, Seltenheit; Sortierung nach Name, Stufe oder ID.
- Wichtige Felder bieten anklickbare Vorlagen und Katalog-Autovervollständigung; die Eingaben bleiben frei bearbeitbar.
- Erweiterte Eigenschaften: JSON-Beispiel, Live-Syntaxindikator und JSON-Strukturprüfung.
- Live-Vorschau: tatsächlicher gemeinsamer HTML-Kartenrenderer aus card-view-v221.js und die Original-CSS/SVG-Frames des Spiels. Name, Artwork, Typ, Level-Medaillon zwischen ATK und DEF sowie Zahlen passen sich sofort an.
- Zur Ablage hinzufügen: Karte dauerhaft lokal zwischenspeichern. Bei gleicher ID fragt der Editor vor dem Überschreiben.
- Ablage öffnen: Karten erneut bearbeiten, duplizieren oder entfernen. Duplikate erhalten zunächst ID -1 und müssen vor einem Export eine echte, eindeutige ID bekommen.
- Alle exportieren (ZIP): getrennte Kartenordner, card.json pro Karte, ggf. mitgeliefertes Artwork und eigener Rahmen, manifest.json sowie CHATGPT_IMPORT.md mit Implementierungsschritten für Solo und 2v2.

### Technische Voraussetzung und Grenzen

Die präzise HTML-Vorschau verwendet Microsoft Edge WebView2 Runtime (Windows 10/11).
Fehlt sie, ist die vereinfachte bisherige GDI-Vorschau als Ersatz verfügbar.
Die im Editor eingebetteten Original-Artworks sind JPEG-Vorschaudateien;
für den späteren Import behalten die echten Grafiken ihre Originalpfade.
Ändert sich in Zukunft die spielseitige Karten-CSS, muss auch die Editor-Assetliste
synchronisiert werden. Unterschiedliche Bildschirmgrößen und kontextspezifische
Spielregeln können die Darstellung geringfügig verändern.

Die Ablage liegt benutzerspezifisch im LocalAppData-Unterordner
ArcaneDuel/CardEditor/Kartenablage.json und wird nicht in das laufende Spiel
geschrieben. Neue Fähigkeitstexte sind reine Beschreibungen und implementieren
noch keine Spiellogik. Alle Änderungen sind ein Entwicklungsentwurf;
das ZIP darf nicht ungeprüft über ein bestehendes Spiel kopiert werden.

Der Windows-CI-Selbsttest überprüft neben Karten-JSON-Roundtrips auch die
eingebettete Spiel-CSS, den kanonischen HTML-Baustein und den zweikartenfähigen
ZIP-Export mit Artwork und Importmanifest.


## v2: Freischaltungen, bestätigte Designs und Clear

Der neue Reiter **Freischaltung** trennt Katalogdaten und die Entscheidung,
ob eine Karte jemals freigeschaltet werden soll. Neue Karten werden
standardmäßig nur als Katalogeintrag vorbereitet; vorhandene Karten
behalten ihre bestehenden Freischaltungsregeln. Bei einer ausdrücklichen
Freischaltungsanforderung müssen Ziel (Booster, Startdeck oder Quest/Turnier)
und die exakten Bedingungen angegeben werden.

Abweichungen in Kartentyp, manuellem Rahmen, Levelgravur, Rollensymbol
oder unbekannten Bildreferenzen lösen vor dem Datenexport ein Warnfenster
mit verpflichtender Bestätigungs-Checkbox aus. Die Änderungen werden nicht
korrigiert, sondern als bewusstes Design verbindlich festgeschrieben.

Jede Karte hat im Export zusätzlich eine integration.json mit dem
Freischaltungswunsch, den bestätigten Designabweichungen und dem
Artwork-Status. Die manifest.json listet diese Datei. Die zentrale Datei
CHATGPT_IMPORT.md verlangt eine 1:1-Übernahme, Trennung von Katalogeintrag
und Freischaltung, Import neuer Originalbilder und einen ausführlichen
Fehler- und Integrationsbericht mit ausgeführten Tests, geänderten
Dateien, möglichen Blockern und PR-Link.

**Neue lokal ausgewählte Original-Artworks** werden in die Einzelkarten-
und Sammel-ZIP eingeschlossen. Fehlt bei neuen Editor-Bildpfaden die
Originaldatei, wird der Export abgelehnt. Bestehende Spielbilder werden
referenziert und niemals durch kleine JPEG-Vorschaubilder ersetzt.

**Clear – Ablage leeren** steht in der oberen Werkzeugleiste und im
Ablage-Fenster. Das vollständige Löschen aller zwischengespeicherten
Karten verlangt eine ausdrückliche Bestätigung; aktuell bearbeitete
Karten und bereits exportierte ZIP-Dateien bleiben unberührt.

Beide Exportarten enthalten außerdem die getrennten Vorlagen
VORLAGE_INTEGRATIONSPROTOKOLL.md und VORLAGE_FEHLERBERICHT.md.
Beim späteren Import soll ChatGPT zwei tatsächlich ausgefüllte Berichte
mit geänderten Dateien, Testergebnissen, Risiken und Blockern liefern.


## Freischaltung – besonders einfache Bedienung

Im Reiter **Freischaltung** gibt es bewusst nur noch zwei große Auswahlmöglichkeiten:

1. **Nur die Karte erstellen oder bearbeiten:** Die Karte wird beim späteren
   Import gespeichert, aber es wird keine neue Freischaltung eingerichtet.
   Für eine bereits bestehende Karte bleiben bisherige Freischaltungen
   bestehen. Bei einer neuen Karte ist sie zunächst nicht über Booster,
   Startdeck oder Belohnungen erhältlich.
2. **Die Karte zusätzlich für Spieler freischalten:** Es erscheinen
   gut lesbare Auswahlkästchen samt Erklärung für Booster, Startdeck/
   Startsammlung und Quest-, Turnier- oder Gegnerbelohnungen.
   Mindestens eine Auswahl und eine präzise Beschreibung, wann und wo
   die Karte erhältlich wird, sind Pflicht.

Der Editor zeigt verständlich an, ob die eingegebene ID bereits im
eingebetteten Katalog vorkommt, und fasst das Ergebnis der Auswahl
in einfacher Sprache direkt im Reiter zusammen. Neue Karten
erhalten keine unbemerkte ID 0 mehr; die ID ist beim Anlegen
zunächst leer und muss bewusst vergeben werden.

Die gespeicherten Integrationseinstellungen und die Importanweisung
bleiben zum bisherigen JSON-/ZIP-Format kompatibel.
