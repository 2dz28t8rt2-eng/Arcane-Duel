# Kampagnenstart und Kapitelpakete – 18. Oktober 2026

> **Fortsetzung 26. Oktober 2026 · v16.1 Regelabgleich auf `development`:**
> Der gemeinsame serverseitige 2v2-Regelkern hat jetzt echte DEF-Lebenspunkte,
> Schutzschichten (verdichtete Seele → gespeicherte Seele → Grund-DEF),
> 35 % Rüstung für Wächter/Seelenzehrer, ihren Gegenschlag (50 % ATK),
> 10 % Predator-Rüstungsdurchdringung und den auf das **eigene** Feld
> begrenzten Predator-Schwarmbonus (max. +10 %). Passive Seelenzehrer
> greifen beide gegnerischen Felder an, verursachen Seelenbrand und
> besitzen jetzt servergeprüfte Aktionen: Verdichten, Entladen, gezielter
> Seelenraub und ATK/DEF-Entzugsfokus ab Rang 3. Abklingzeiten und
> Zerfall laufen nur bei eigenen Zügen; Seelenraub setzt den Zerfall
> im Aktivierungszug aus. Wächter regenerieren Grund-DEF von Verbündeten,
> auch auf dem Partnerfeld. Fusionsrollen folgen der Spezialistenmehrheit
> der Materialien (nicht der Vorlage oder dem zuerst gewählten Feldmonster),
> mit materialabhängiger Statverteilung und Seelen-Erbe bei Feldfusion.
> Resonanz bleibt auf eigene Materialien begrenzt. Laufende v16.0-Räume
> können Karten mit den zuvor fehlenden Statusfeldern weiterverwenden.
>
> **Forschungsstopp für die KI:** Weder der Singleplayer-KI-Code noch
> Trainingspipeline oder die bestehende 2v2-Aktionsplanung wurden verändert.
> Die neuen Regeln gelten auch für KI-Monster, aber ihre Strategie wurde
> bewusst nicht erweitert. Offen bleiben insbesondere vollständige
> Spezialwürfe/Elemente/Pokerkombinationen, persönliche Perks und
> Essenz-Bindungsfähigkeiten, Kartenbesitznachweise und Live-Tests mit zwei
> physischen Geräten. Bis dahin ist die v16.1-Seite eine *unranked Beta*.

> **Stand 26. Oktober 2026 · v16.0 Beta:** Die neue Testseite
> [duo-campaign-v2.html](../duo-campaign-v2.html) verwendet eine getrennte
> Supabase-Funktion `arcane-duo-v2` und die private Tabelle
> `arcane_duo_v2_rooms`. Die alte `arcane-duo`-Funktion, ihre Spielstände
> und das 1v1 bleiben unverändert. Im Hauptmenü zeigt der bisherige 2v2-Link
> weiterhin die stabile v15.8-Seite; von dort ist die Beta erreichbar.
>
> **Fortschritt der Regelangleichung:** Der Spielkarten-Katalog wird mit
> `npm run duo:catalog` reproduzierbar aus allen 93 aktuellen Skripten
> einschließlich Erweiterungen generiert: 762 Karteneinträge, 429 spielbar.
> Host und Gast schicken je ihr aktives 40-Karten-Hauptdeck und ihr separates
> 2–15-Karten-Fusionsdeck. Der Server kontrolliert Karten-IDs, Fusionstyp und
> Kopienzahlen; der Gegner erhält Kapitel-dependente reale Karten. Eigene
> Hand- und Feldmaterialien können fusioniert werden, Fusionslevel folgen dem
> v11.3-Kernlevelmodell, Fusionen verbrauchen vorhandene Vorlagen im Duell.
> Persönliche Ziehphase bis fünf Karten, Deckleer-Niederlage bei Zugbeginn,
> eigene Cooldowns/Zerfall, Positionswechsel, erste Predator-/Wächter- und
> Resonanzberechnungen, sieben Zonen und Team-LP sind als neue reine
> Serverregeln implementiert. Acht neue Regeltests laufen grün.
>
> **Wichtige Grenzen der Beta:** Noch *keine* vollständige Gleichheit:
> vollständiger Seelenzehrer-Aktivzyklus, alle Fusion-Würfel/Elementboni,
> 1v1-Perks/Essenzwesen/Quest-Ausnahmen, trainierte Gegner-KI,
> Echtnachweis des serverseitigen Kartenbesitzes und dauerhafte
> Fortschrittsbelohnungen fehlen. Aus dem lokalen Spielstand gelesene
> Decklisten sind in diesem privaten *unranked* Testmodus nicht
> serverseitig an einen authentifizierten Spieler gebunden. Das ist keine
> Freigabe für Belohnungs-/Wettkampfsysteme. Zwei-Geräte-Praxistest ausstehend.
>
> **Stand 26. Oktober 2026 · Online-Ausbau v15.8:** Das Supabase-Projekt
> `cvmtmvruutdneyblumgf` und `arcane-duo` (Version 2) sind aktiv. Der frühere
> Hinweis am Ende dieses Dokuments, es gebe keinen Server, beschreibt nur
> den ursprünglichen Offline-Prototyp vom 18. Oktober.
>
> **Neu auf `development`:** die verbundene Seite `duo-campaign.html` bietet
> eine klarere dreistufige Lobby, 2v2-Kurzregeln, wählbare eigene Beschwörungszonen,
> freie Angreifer- und Zielwahl auf *beiden* gegnerischen Feldern,
> serverbestätigten Speicherstatus, manuelles Aktualisieren und die Wiederanzeige
> eines noch gültigen Einladungslinks nach Neuladen im **gleichen Tab**.
> Tokens werden nicht in `localStorage` übertragen; die Sitzung bleibt im
> flüchtigeren `sessionStorage` des Tabs. Das Hauptmenü bietet zusätzlich
> einen deutlich sichtbaren Komplett-Export für den **separaten 1v1-Spielstand**.
>
> **Noch offen vor `main`:** Echter Zwei-Geräte-Test; Einbindung der realen
> 1v1-Sammlung und Decks mit serverseitiger Besitz-/Kartenvalidierung;
> Fusions-, Resonanz-, Wächter-, Seelenzehrer- und Predator-Regeln;
> verlässliche geräteübergreifende Wiederaufnahme und klares Kapitel-/Bossdesign.
> KI-Forschung der bestehenden Turniergegner bleibt unberührt. Erst nach den
> Praxis- und Regressionstests soll der große Stand nach `main`.

**Standard:** Ohne jede Kapitelauswahl beginnt »Neue Kampagne« automatisch in **Kapitel I**. Ein optionales Feld »Kapitel direkt auswählen« erlaubt Einstieg in Kapitel I–IV.

| Kapitel | Kapitelstart-Level der Bonuskarten | Kartenpaket (je 3 Karten pro Verbündetem) |
|---|---:|---|
| I – Der Pakt am zerbrochenen Tor | 2 | Wurzelwacht, Glutspäher, Sternenfalter |
| II – Die Zwillinge der Asche | 4 | Runenjäger, Felsbastion, Frostgreif |
| III – Das verlorene Siegel | 6 | Donnerkoloss, Schattenhüter, Himmelsdrache |
| IV – Krone der Vier | 8 | Aetherarchon, Leviathan der Tiefe, Klingenseraph |

**Spielregeln:** Drei Kapitelkarten ersetzen je drei Basiskarten im 40-Karten-Deck, sodass das Deck nicht größer wird; sie stehen in der ersten Hand zur Verfügung. Beide Menschen erhalten dieselbe Kartenmenge, getrennt in eigenen Decks. Die Gegner erhalten eine vergleichbare Kapitelanpassung im Demo-Kampfsystem. Nach einem Sieg darf nur der Gastgeber das nächste Kapitel freischalten. Server setzt dann Spielfeld und 16.000 LP je Team für das nächste Kapitel zurück und verteilt das nächste Paket. Keine Belohnung für ein Kapitel ohne tatsächlichen Sieg; ein einzelner Wechsel darf nicht mehrfach ausgeführt werden.

**Hinweis zum Entwicklungsstand:** Alle Bonuskarten und Kapitelwechsel gelten für den **abgeschlossenen 2v2-Raum**. Sie verändern weder das globale Einzelspielerinventar noch die dauerhafte Sammlung. Die Online-Edge-Funktion ist in Git unter `supabase/functions/arcane-duo/index.ts` dokumentiert und als Version 2 in Supabase aktiv. Für die langfristige Kampagne planen wir künftig echte Deckimports und eine persistente, servergeprüfte Spielersammlung.

---

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
