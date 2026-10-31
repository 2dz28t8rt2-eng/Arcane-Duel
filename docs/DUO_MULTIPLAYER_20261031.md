# Online-2v2: Umsetzung und Prüfbericht

Stand: 31. Oktober 2026. Zielbranch: development. main bleibt bis zur ausdrücklichen Abnahme unverändert.

## Verbindliche Ergänzung zur Übergabe

Der Nutzer hat im laufenden Auftrag ausdrücklich bestätigt:

- **Sieben gemeinsame Monsterzonen je Team**, insgesamt vier Duellanten auf zwei Reihen. Diese Entscheidung ersetzt die ursprüngliche Übergabe mit sieben Zonen je Duellant.
- **Beide Menschen dürfen Duelle anfragen.** Der andere Mensch muss zustimmen. Der ursprüngliche Host bleibt Gruppenleiter; es gibt keine automatische Host-Übernahme.
- Persönliche Hände, Decks, Kartenkontrolle, Profile und Zugrechte bleiben getrennt. Partner-Feldmonster sind weiterhin erlaubtes Fusionsmaterial.

## Umsetzung

Singleplayer und Duo verwenden gemeinsame Navigations- und Kartenansichtskomponenten. Die Datenadapter bleiben getrennt: Duo liest oder überschreibt keinen Singleplayer-Spielstand. Ein wartender Host kann sein Menü bereits verwenden. Lokale Navigation, Suche, Deckauswahl und Fokus werden bei Raumaktualisierungen erhalten.

Die Teamreihe verwendet sieben gemeinsame physische Indizes. Die Eigentümerdaten bleiben beim jeweiligen Sitz, sodass Angriffe, Fähigkeiten, Friedhof und Animationsziele eindeutig zugeordnet sind. Partnerbelegung sperrt normale Beschwörungen, Ersetzungen und Lv1-Rückverlegungen. Eine Fusion darf eine Partnerzone belegen, wenn das dortige Monster wirklich verbraucht wird. KI-Beschwörungen und Rudelruf beachten dieselbe Belegung. Stomp folgt der gemeinsamen Reihe; benachbarte Wächter und Seelenzehrer bilden auch bei verschiedenen Besitzern einen Seelenbund. Geisterreserven bleiben separate, freigeschaltete persönliche Zonen.

Bereits laufende ältere Räume werden nicht mitten im Kampf umsortiert. Ein neu angenommener Kampf verwendet das gemeinsame Feld. Team-LP bleiben das Doppelte des passenden aktuellen Singleplayer-Startwerts. Zugfolge: Host → KI 1 → Gast → KI 2.

Einladungen besitzen eine eindeutige Kennung und laufen nach zwei Minuten ab. Nur der adressierte Partner kann die aktuelle Anfrage bestätigen. Bei Annahme werden beide aktuellen gespeicherten Builds geladen. Ablehnen, Rücknahme und Wiederholungen vergeben keine Belohnungen. Ergebnis schließen beziehungsweise Escape führt ins persönliche Menü; ein weiteres Duell braucht neue Zustimmung.

Ein zusätzlicher Fehler in der Erzeugung gültiger NPC-Fusionsvorlagen wurde korrigiert: Die Instanz erhält den tatsächlichen NPC-Besitzer. Nicht spielbare NPC-Vorlagen werden dadurch nicht für menschliche Decks freigeschaltet.

## Unterschiedliche Fortschritte und Verbindung

Beide Profile müssen das angefragte Ziel freigeschaltet haben. Diese bereits vorhandene serverseitige Regel bleibt erhalten und wird bei Anfrage und Annahme geprüft. Belohnungen werden dagegen persönlich berechnet: Ein Mitglied kann einen Erstabschluss, das andere einen Wiederholungssieg erhalten.

Authentifizierte Raumabfragen melden Anwesenheit getrennt von der Kampfrevision. Nach 45 Sekunden ohne Meldung gilt das Mitglied als derzeit nicht erreichbar. Das ist eine Verbindungsanzeige, kein automatischer Ausschluss. Es gibt weder Sitzübernahme noch automatischen Zugverlust. Ein anwesender Spieler kann seinen eigenen legalen Zug abschließen; beim abwesenden Menschen wartet der Kampf. Neuladen und Wiederverbinden verwenden den bestehenden Raumzugang.

## Backend

Supabase-Projekt: cvmtmvruutdneyblumgf; Edge Function: arcane-duo-v2, Version 32.
Alle sechs bereitgestellten Quelldateien wurden nach dem Deployment erneut abgerufen und mit dem vorgesehenen Stand verglichen.

Migrationen:

- `20261031015137_duo_independent_menu_match_rewards.sql`: persönliche Belohnungsbelege zusätzlich nach Duellnummer; bestehende Belege und Saga-Fortschritt bleiben erhalten.
- `20261031022130_duo_member_presence.sql`: getrennte Anwesenheitszeitstempel ohne Änderung der Sitzzuordnung oder Kampfrevision.

Die vorhandene private Token-Authentifizierung bleibt bestehen; keine zusätzlichen öffentlichen Tabellenzugriffe. Der Sicherheitsberater meldet weiterhin private RLS-Tabellen ohne öffentliche Policies. Zusätzlich meldet er bestehende EXECUTE-Rechte der allgemeinen Funktion `rls_auto_enable()` für anon/authenticated; diese projektweite Funktion wurde in diesem Auftrag nicht geändert. Hinweise: https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable und https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable.

## Tatsächlich ausgeführte Prüfungen

- Gesamte Node-Suite nach der Regeländerung: **1.322 Tests, 1.310 bestanden, 12 übersprungen, 0 Fehler**.
- Elf gezielte Online-Regeltests einschließlich gemeinsamer Belegung, Besitzerrechte, Partnerfusion, Seelenbund über Besitzergrenzen, vollem KI-Feld, Einladungskonflikten, Duell-Neustart und NPC-Fusionen.
- Zwei getrennte DOM-Dokumente mit getrennten Speichern: wartender Host, unabhängige Menüs/Suche/Fokus, Einladungen in beiden Richtungen, gemeinsame 14 sichtbare Zonen, Gastperspektive, Geisterreserve und Ergebnis/Escape.
- Reales Chromium mit zwei getrennten Browserkontexten und deterministischem Testserver: Desktop/Mobil, sichtbare Klickabläufe, Beschwörung auf Index 6, Positionswechsel, private Hände, unabhängige Menübedienung und erneute Duellzustimmung bestanden bei Prüfcommit fef155fe0fb3f3efc52546985e357f36ec9bba89.
- SQL-Test gegen das tatsächliche Datenbankschema: beide Erstbelohnungen, idempotentes Reload/Ablehnen, neue Wiederholungsbelohnung je Duellnummer sowie unterschiedliche Erst-/Wiederholungsbelohnung im selben Duell bestanden. Sämtliche Testdaten wurden innerhalb einer Transaktion zurückgerollt. Dies ist ein Datenbanknachweis, kein erspielter Browser-Sieg.

## Live-Browsernachweis

Lauf https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/41159893343 bestand gegen Edge-Version 32 mit zwei unabhängigen Chromium-Kontexten und echten getrennten Testprofilen. Keine Fixture-Antworten im Live-Modus:

| Durchlauf | Menschliche Aktionen | Runden | Ergebnis |
| --- | ---: | ---: | --- |
| Erstes gemeinsam angenommenes Duell | 74 | 11 | Menschenteam gewinnt |
| Erneut angefragte und angenommene Wiederholung | 66 | 10 | Menschenteam gewinnt |

Einladungen in beide Richtungen, Ablehnen/Rücknahme, falscher Bestätiger, Doppelklick, private Hände, tatsächliche Beschwörung auf Index 6, Verteidigungsposition, Ergebnis/Escape, frischer Kampfzustand bei Wiederholung und Reload bestanden. Die automatisierten Kampfentscheidungen stammen aus einem Testbot, der nur die jeweilige serverseitig redigierte Spieleransicht erhält und reguläre Aktionen sendet. Ergebnisse sind kein Beleg für menschliche Siegquoten.

Der ergänzte Live-Lauf https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/41160191517 bestand ebenfalls vollständig:

- Host im Browserkontext über 45 Sekunden offline: Gast sieht die Warteanzeige, Kampfrevision und Sitzzuordnung ändern sich nicht; ursprünglicher Host verbindet sich wieder, Anzeige verschwindet.
- Danach zwei komplette gemeinsame Siege: 58 menschliche Aktionen / 9 Runden sowie 67 Aktionen / 10 Runden.
- Beide persönlichen Testprofile nach Erst- und Wiederholungssieg: 90 XP, 147 Essenz, 3 Splitter, 2 Siege und 3 Kartenbelohnungsansprüche.
- Reload und erneutes Laden des Profils verändern diese Belohnungen nicht; Singleplayer-Sentinel bleibt unverändert.

Die anschließende kleine UI-Ergänzung für eine vollständig vom Partner belegte Reihe wurde mit dem tatsächlichen DOM geprüft: keine auswählbare illegale Beschwörungszone, deaktivierte Bestätigung und Erklärung. Die Live-Regeln bleiben identisch mit Version 32.

Der ältere Offline-Benchmark I–IV wurde ebenfalls auf gemeinsame Platzbelegung umgestellt: 56 Duelle vollständig abgeschlossen. Sein bewusst einfacher menschlicher Testbot verlor alle 56; das ist keine repräsentative Balancebewertung und kein Anlass, in diesem UI-/Online-Auftrag ungefragt Werte zu ändern.

Automatisierte Prüfungen ersetzen keine subjektive Abnahme von Klang, Animationstempo oder Spielbalance.
