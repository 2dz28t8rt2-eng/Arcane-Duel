# Online-Update · 2026-10-18

**Supabase-Projekt:** `cvmtmvruutdneyblumgf` · Edge Function `arcane-duo` (aktiv) · private RLS-Tabelle `public.arcane_duo_rooms` (Migration ausgeführt).

**Online-MVP implementiert:** 1 Einladungslink je Raum (Fragmenttoken), Gast kann einen offenen Sitzplatz belegen, danach serverseitige Zugberechtigung 0 oder 2. Beide Clients poll-en den Spielstand alle 2,5 s. Alle gesendeten Aktionen werden gegen aktive Position und Server-Spielstand geprüft; konkurrierende Aktionen werden mittels Revisionsvergleich zurückgewiesen. Die KI führt eigene Züge serverseitig aus. 7 Zonen je Spieler, 16.000 LP pro Team, vier Sitze in der Reihenfolge Host → KI A → Partner → KI B.

**Grenzen:** Weiterhin vereinfachtes Demo-Kampfsystem mit nur acht Demo-Monstern, ohne echte Einzelspieler-Deckimports/Fusionsregeln; noch kein abgeschlossener, geräteübergreifender Live-E2E-Test. Serverfunktion ist deployed und Browser-GitHub-Dateien sind verbunden; ein Live-CORS-/Invite-Test ist noch nötig. Zugangstoken nur im URL-Fragment; aus Sicherheitsgründen den Link nicht öffentlich teilen. Raum verfällt nach 48 h; Zugriff auf denselben Browser-Tab per `sessionStorage` (neuer Tab erfordert erneute Identifizierung).

**Zu verbessern:** Serverautorisierte echte Deckvalidierung und verteilte private Hände, Wiederaufnahme über Geräte-Login oder sicheres persistentes Tokenmanagement, Benutzeridentitäten, zusätzliche Missbrauchsbegrenzung, Bild/Animationen, 1v1-Fusionskompatibilität, Online-Kampagnenfortschritt.

---
# Arcane Duel – 2v2-Kampagne: technische Grundlage

**Stand:** lokaler, bewusst isolierter Prototyp auf `development`.
**Testseite:** [duo-campaign.html](../duo-campaign.html)
**Regelmodul:** [assets/duo-campaign-core.js](../assets/duo-campaign-core.js)
**Automatisierte Tests:** [tests/duo-campaign-core.test.cjs](../tests/duo-campaign-core.test.cjs)

## Spielfluss
- Spielerposition 0: Gastgeber (Mensch), Team 0
- Spielerposition 1: Gegner A (KI), Team 1
- Spielerposition 2: eingeladener Partner (Mensch), Team 0
- Spielerposition 3: Gegner B (KI), Team 1
- Reihenfolge: **Du → Gegner A → Partner → Gegner B → Du ...**.
- Beide Menschen besitzen **unabhängige 40-Karten-Decks, Handkarten und sieben Monsterplätze**. Vier getrennte Felder sind in der Vorschau sichtbar.
- Beide Verbündeten teilen **16.000 Team-LP**, Gegner A und B teilen 16.000 Team-LP. Das ist der festgelegte 2v2-Startwert, doppelt so viel wie die normalen 8.000 LP im Einzelduell.
- Endzug-Aktionen sind sitzplatzgebunden; gegnerische KI-Züge benutzen denselben regelvalidierten Aktionspfad.
- Prototyp: zunächst normales Beschwören, begrenzte Angriffe und vereinfachter Schaden, **noch keine echten 1v1-Fusionen, Resonanz, aktive Spezialfähigkeiten oder Inventarsynchronisation**.

## Warum die Einladung noch nicht online funktioniert
GitHub/GitHack stellen statische HTML-/JavaScript-Dateien bereit. Das ist keine synchronisierte, serverautorisierte Sitzung. **Ein Link allein hält keine Kartenstände, Hände oder Zugrechte auf zwei Geräten synchron.**

Für die Live-Version brauchen wir einen verlässlichen Backend-Dienst (Vorschlag: Cloudflare Durable Objects + WebSocket oder Supabase Realtime mit serverseitiger Aktionsvalidierung). Der reine Browser darf keine gegnerischen Hände übertragen oder Trefferpunkte ohne Prüfung ändern.

Geplanter Ablauf:
1. Gastgeber erstellt einen neuen, nur für das 2v2 bestimmten Raum.
2. Server erzeugt einmalige Raumkennung und geheimen Einladungsnachweis. **Einladungstoken niemals als öffentlicher GitHub-Commit speichern.**
3. Gastgeber teilt eine HTTPS-Einladungs-URL; zweiter Spieler tritt mit dem Link bei und bestätigt seinen Namen.
4. Nur Host und eingeladener Partner werden zur menschlichen Steuerung berechtigt.
5. Server versieht jede Änderung mit einer monoton steigenden Versionsnummer (`revision`). Client sendet `roomId, seat, action, expectedRevision, nonce`.
6. Server validiert Spielerrolle, aktive Zugposition, Kartenzustand und Ziele und führt **nur eine** Aktion aus. Server verteilt an beide Teilnehmer aktualisierte öffentliche Feldinformationen und die jeweilige private Hand getrennt.
7. Nach Verbindungsabbruch kann der Spieler innerhalb einer definierten Schonfrist mit einer neuen kurzlebigen Sitzung erneut verbinden, ohne die Zugreihenfolge zu verändern.
8. Server persistiert Spielstand und Kapitelabschluss; erst danach werden gemeinsame Questbelohnungen ausgezahlt.

## Kampagnenziel und UX
Vier vorläufige Kapitel: Tor, Asche, Siegel, Finale.
- Gemeinsame Bossgegner und Kombo-Momente ohne Verlust der individuellen Deckidentität
- Spätere Teamfähigkeiten: ein Partner richtet Wächter und Schildposition ein, der andere führt den Angriff aus
- Fusionen dürfen nur mit eigenen Materialien stattfinden, außer eine ausdrücklich eingeführte Teamfusion erlaubt Abweichungen
- Debuff und Zerfall gelten pro eigenem Zug, nicht vierfach durch jeden Feldwechsel
- Schicksalszug, Questfortschritt, Savegame und Belohnung verlangen einen gesonderten 2v2-Regelvertrag

## Noch nicht umgesetzt
- Externer Raumserver, realer Einladungslink und simultanes Beitreten von zwei Geräten
- Live-Synchronisierung, Authentifizierung, Datenschutz und Wiederaufnahme
- Vollständige 1v1-Regelengine für zwei Teams, je zwei Decks (nicht mit `game.players[1-g.active]` kompatibel)
- Echtes Gegner-2v2-Design mit vier balancierten Kapiteln, Bossartworks und Testläufen
- Synchronisierung der vorhandenen Einzelspielerprofile; Import oder Zugriff auf bestehende Daten erfordert explizite Zustimmung
- WebRTC/Supabase/Cloudflare Deployment, End-to-End-Mehrgerätetests

## Tests / technische Regeln
Der Kern nutzt einen reinen Reducer für Raum- und Zugzustand, ohne DOM oder 1v1-Globals. `apply` erstellt eine Kopie statt den übergebenen Zustand direkt zu verändern. Spieler können nicht stellvertretend für einen anderen Sitzplatz eine Aktion spielen; diese Zugriffsbeschränkung muss ein späterer Server unabhängig authentifizieren. Prototypdaten werden nicht als geheimer Zugangsschlüssel behandelt.

**Kein echter Online-Raum ist bisher erstellt oder deployed.**
