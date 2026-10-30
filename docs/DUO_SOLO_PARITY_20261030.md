# Arcane Duel – Singleplayer/2v2-Paritätsprüfung (30.10.2026)

## Ziel und Grenzen
Gemeinsame Karten, Rollen, Grundmechaniken, Fusionsgrundlagen, Reaktionen und
Präsentationsprinzipien sollen sich gleich anfühlen. Abweichungen sind **bewusst**,
wenn sie aus vier Spielerpositionen, zwei menschlichen Clients, Team-LP,
sieben Feldzonen je Spieler, Synchronisation oder getrennter Duo-Ökonomie
entstehen. Ein Singleplayer-Speicher darf nie in das Duo-Profil kopiert werden.

## Abgleich
| Bereich | Gemeinsame Grundlage | Duo-spezifisches Verhalten / Stand |
|---|---|---|
| NPCs und Fusionen | Kartenkatalog, Gegnerfusionen und Grundlagen werden aus Solo-Snapshot geprüft | 2 NPCs, 2 Menschen; `duo-single-parity-v201` und Kapiteltests |
| Kampf | ATK/DEF, Konter nur bei überlebenden Verteidigern, Stomp, Soul, Predator | Team-LP, sieben Zonen und serverbestätigte Züge, Edge/Browser-Regeln bytegleich |
| Stomp | Primärstrahl und nachträgliche Nebenziele, Einschläge bei Strahlankunft | Zielwahl über Gegnerzonen, serverbestätigter Schaden; seit PR #38 |
| Seelenzehrer | DEF-Fähigkeiten, Raub, Verdichten, Entladen, Schutzbindung | Eigentümer-/Zugkontrolle, Duo-Seelenbund im eigenen Feld; verständlichere Anzeige |
| Rudelführer | 3/4/5 Materialien ergeben 1/2/3 Fähigkeiten; Buff und Token | Eigenes Rudel je Spieler; längeres Reveal + einmalige Einführung nach Animation |
| Kartenziehen und Fusion | Handbewegungen, Fusionsrollen, Würfel- und Materialcinema | Rivalenhand anonym; jeweiliger Spieler kennt nur die eigene Hand |
| Ergebnis | Sieges-/Niederlagen-Ton kurz vor Schriftzug, langes Musik-Fade | Server bestätigt das Ergebnis; Duo stellt den Titel lokal dar |
| Musik und Booster | Gemeinsame Soundscape-, SFX- und Pack-Cinema-Dateien | Duo-eigene Tonregelung, aktualisierte Cache-URLs |
| Duellübersicht | LP stets nachvollziehbar, Zoombedienung | Gemeinsame Team-LP, Zoom 70–115 % lokal pro Gerät |
| Progression | Freischaltungen, Levelgefühl, Kartengewinne | **Getrennte** Duo-Kampagne, eigene Sammlung, Forschungs-/Kaufregeln |
| Speichern | Zustand nach bestätigten Aktionen konsistent | Online-Raum, getrennte persönliche Profile, Client-/Server-Abgleich |
| KI | KI-Reaktionen und Fusionen | Zwei NPC-Sitze, keine Veränderung an Solo-KI-Trainingsdaten |

## Änderungen dieser Runde
- Duo-Resultat: 5,3-Sekunden-Fade beginnt beim serverbestätigten Ende; Sample
  150 ms vor sichtbarem Titel, kein doppelter Sofortton im SFX-Snapshot.
- Spielfeld: Zoom-Schieberegler 70–115 %, pro Browser gemerkt; Team-LP sticky.
- Nach erstem eigenen Rudelführer: Erklärung über Rudelbonus und drei Fähigkeiten,
  erst nach dem langen Reveal. Keine fremden Hand-/Deckdaten angezeigt.
- Seelenraub hält die Hand eine Sekunde länger verdeckt; Seelenverlust kann
  nach bestätigt abgeschlossenem Eigenzug an der Karte eingeblendet werden.
- DEF-Rüstung und Seelenbund in einfachen Sätzen statt Fachkürzeln.
- Gemeinsame neue Booster-Lichtanimation, SFX und Musik über aktualisierte URLs.

## Abnahme
Automatische Funktionstests, aktuelle Smoke-/Headless-Browser-CI und
`tests/duo-parity-20261030.test.cjs` müssen erfolgreich sein.
Echte Zwei-Client-Abnahme ist zusätzlich notwendig – insbesondere im Online-Duo,
weil Latenzen, Animation und Gerätespezifika im Headless-Test nicht vollständig
simuliert werden.

## Absichtlich nicht angeglichen
1. Vier Plätze (Menschen 0/2, Gegner 1/3) und Team-LP statt zwei Duellanten.
2. Sieben Kartenfelder und private Hände statt fünf Einzelspielerfelder.
3. Unabhängige Duo-Ökonomie/Spielstände, Quest-Kapitel und Synchronisierung.
4. Geteilte Teamentscheidungen und serverautorisierte Aktionen.
5. Serverbetrieb: Das Aktualisieren einer GitHub-Edge-Datei bedeutet **kein Deployment**
   der laufenden Supabase-Funktion. Diese Änderung enthält **keine** Edge-Regeländerung.
