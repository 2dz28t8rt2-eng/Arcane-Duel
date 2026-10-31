# ARCANE DUEL – AKTUELLE CHATGPT-ÜBERGABE

**Snapshot: 31.10.2026**  
**Überprüfte Codebasis vor dieser aktualisierten Übergabedatei:** `development` auf `6eb0aee179df86b55d550d2c63e003f019b7e620`.  
**Stabiler Branch:** `main` auf `b4bee27980af899b53c9eb5582d70463652e98e5` (nicht eigenmächtig ändern).  
**Repository:** https://github.com/2dz28t8rt2-eng/Arcane-Duel

> **WICHTIG FÜR EINEN NEUEN CHATGPT-CHAT:** Diese Datei ist ein datierter Übergabestand, kein Live-Snapshot. Vor Änderungen IMMER den tatsächlichen GitHub-HEAD von `development`, die neuesten Commits, die betroffenen Dateien und GitHub-Actions-Läufe prüfen. Eine neue Version nur nach Tests bereitstellen. Nie bisherige Profile, Datenbanken, Saves, Aetherfall oder andere Serverdienste ungefragt ändern. Keine Geheimnisse oder privaten Wiederherstellungslinks ausgeben.

## 1. VERBINDLICHE VERSIONSKULTUR: 1.0.0 = bisherige v22.9

**Die Nummerierung wurde auf ausdrücklichen Nutzerwunsch mit 1.0.0 neu begonnen.**
**Serverversion 1.0.0 ist exakt der bisherige Entwicklungsstand v22.9**, bestehend
aus Solo-Feinschliff v22.7, gemeinsamer Präsentation v22.8 und Selfhosting
v22.9 (historischer Technikname v229).

**Ab sofort nur noch eine offizielle Nummer für das gesamte Spiel:** `1.0.0`,
danach bei Fehlerkorrekturen `1.0.1`, `1.0.2` usw.; neue Features `1.1.0`;
große inkompatible Änderungen `2.0.0`. **Kein `v` vorangestellt,
keine `-dev`- oder `-rc`-Zusätze, keine Beinamen wie »Bestiarium«
in Titel, Spielmenü oder Serverversion.** Einzelspieler, Online-2v2,
Serverpaket und das Spielmenü gehören zum gleichen Versionsstand.
`v22.9` ist die letzte historische Arbeitsnummer: Diese und alle anderen
`v22.x`-Nummern werden nicht mehr fortgeführt. Alte technische Dateinamen
wie `assets/duo-selfhost-v229.js` bleiben kompatibel, sind aber KEINE
Spielversion. Die früher angezeigte Version `4.1.0-dev.1` wurde durch
`1.0.0` abgelöst, ohne Gameplay oder Spielstände zurückzusetzen.

## 1.1. Offizielle Versionsquellen und Abgrenzung

| Bereich | Bestätigter Stand | Bedeutung |
| --- | --- | --- |
| **Gesamtes Spiel – Solo + Multiplayer + Server** | **1.0.0** | Einzige offizielle Spiel-/Servernummer, ohne Zusatz |
| Historische Spielgeneration | 4.1 Bestiarium | Historische interne Bezeichnung, nicht mehr im Spielmenü als Versionsname |
| Letzter interner Solo-Arbeitsstand | v22.7 | Historische Überarbeitung, nicht weiterzählen |
| Letzte interne UI-Arbeitsnummer | v22.8 | Historische Referenz, nicht weiterzählen |
| Letzte interne Server-Arbeitsnummer | v22.9 bzw. v229 | **Seit der Umstellung = 1.0.0**, nicht weiterzählen |
| Windows-EXE | 0.1.5 | Eigene Binärversion; lädt Spielinhalte von `development` |
| Bisheriges Supabase-Duo-Backend | Edge Function v33 | Supabase-Projekt `cvmtmvruutdneyblumgf` |
| Singleplayer-Speicherformat | `PROFILE_VERSION=3` | Unabhängig von Spielversion |

**Verbindlich:** `index.html` definiert `<meta name="arcane-duel-version" content="1.0.0">`.
Auch `duo-campaign-v2.html` und `collection-v3.html` müssen die gleiche
Metaversion haben. `assets/solo-version.js` setzt die Nummer automatisch
in Titelmenü, Optionen, Singleplayer-/Duo-HUD, Monsterlexikon und Browsertitel;
`assets/menu-shell-v221.js` und `assets/royal-menu.js` übernehmen diese
Nummer aus derselben Runtime. `package.json` und beide Wurzelversionen in
`package-lock.json` sind `1.0.0`. `scripts/package-selfhost.py` übernimmt
die Nummer ins `release.json.version`; der Host gibt sie unter `/api/health`
als String zurück. `scripts/check-solo-version.cjs` und
`.github/workflows/singleplayer-version.yml` prüfen die Konsistenz.

**Für jedes nächste Update an Singleplayer, Multiplayer oder Server die EINHEITLICHE
Spielversion erhöhen**, z. B. als nächstes `1.0.1`. Keine neuen `v22.x`,
`v229` oder `4.1.0-dev.2` als Spielversion. Updates zunächst auf
`development`, nach Abnahme auf `main`. Desktop-EXE-Version und
Save-Schema bleiben unabhängig. Ausführliche Regel: `docs/SINGLEPLAYER_VERSIONING.md`.

## 2. Spielstand und Mechaniken

Arcane Duel ist ein Browser-Karten-RPG. **40 Karten im Hauptdeck**, bis zu **15 Fusionsvorlagen**, Turnier Gegner I–X (regulär bis **Level 10**), Booster, Schmiede, Deckplätze, Monsterlexikon, ACE-Monster und Sidequests/Fanatiker.

**Fusionen:** 2–5 Materialien; Level-/Element-/Rollen-/Resonanzboni; Paar, Drilling, Straßen, Full House und große Straße; mögliche Mehrfachziele durch Stomp; Zerfall/ATK/DEF. **Rollen:** Predator (Rudelführer, Markierung, Entwicklung/Schwarm), Wächter (Schutz/Heilung), Seelenzehrer (Seelenessenz, Entzug/Stoß), Allrounder und Resonator. Wächter + Seelenzehrer bilden Seelenbund. Freie Fusionsvorlagen sind nicht automatisch fest mit einer Monsterrolle getaggt.

**Singleplayer-Runtime:** `index.html`, `assets/game.js`, `assets/expansion.js`, `assets/evolution.js`, `assets/royal-menu.js`, `assets/arcane-title-v196.js`, `assets/solo-playtest-ux-v211.js`, `assets/ai-production-bridge-v186.js`. Auf die exakte Skriptreihenfolge in `index.html` achten. Lokale Singleplayer-Spielstände liegen pro Browser-Origin getrennt; nicht automatisch mit Duo-Profilen synchronisieren.

**Zuletzt integrierte Solo-Fixes v22.7:** Sieg-zu-Menü, ACE-Karte erst nach relevanten Level-/Belohnungsdialogen, keine überlagerten Seelenbund-Boxen, Eiman Huel LP-Einlauf vor Handkartenziehen, korrekter Text bei Turnierprüfung und Levelaufstieg, lesbarere Duell- und Karten-UX. Regression `tests/solo-feedback-v227.test.cjs` und `.github/workflows/solo-browser-qa-v227.yml`.

## 3. Duo/Online-Regeln (verbindliche Anforderungen)

- Vier Spieler: Mensch Host auf Sitz 0, KI auf 1, Mensch Gast auf 2, KI auf 3. Zugfolge Host → KI 1 → Gast → KI 2.
- **Sieben gemeinsame Monsterzonen pro Team**, also **14 insgesamt**. Nicht sieben pro Duellant. Persönliche Hände, Decks, Profile, Kartenbesitz, Zugrechte und Friedhöfe bleiben getrennt und technisch geschützt.
- Feldkarten des Partners dürfen als reguläres Fusionsmaterial benutzt werden, auch bei der KI; gemeinsame Feldbelegung, Schutzbindungen und Stomp müssen dieselben physikalischen Teamzonen respektieren.
- Gegnertier/Kapitel nach **niedrigerem Fortschritt**, fortgeschrittener Partner erhält ein **temporäres Leihdeck**, das eigene gespeicherte Deck bleibt erhalten.
- Neue Party nach abgeschlossenem Kampf möglich; separate Raumrevision statt Vergleich mit altem Raum. Jede neue Runde erfordert gültige Einladung/Annahme; Reload/Reconnect, Anwesenheit, belohnungsidempotente Spielstände.
- **Dokumentierte Abweichung**: `docs/DUO_MULTIPLAYER_20261031.md` verlangt Duellanfragen durch beide Menschen. In älteren UI-/Backendständen durfte jedoch nur Host anfragen. Aktuellen Code erneut prüfen und als offene Funktion behandeln, bis bestätigt.

Quellen: `assets/duo-parity-v160.js`, `assets/duo-shared-rules-v160.js`, `assets/duo-preparty-v218.js`, `assets/duo-solo-shell-v221.js`, `supabase/functions/arcane-duo-v2/`.

**Echte Live-Prüfungen des Supabase-v33-Backends:** Zwei unabhängige Browser, getrennte Handkarten, 14 sichtbare Zonen, Einladungen/Rematch und tatsächlicher Kampfabschluss. Der reale Partnerfeld-Fusionsfall bestand in Actions **41168894618**; unterschiedliche Freischaltungen/temporäre Leihdecks für beide Sitzpositionen in Actions **41169467973** (nur isolierte Testprofile). Das beweist Supabase-v33-Funktionalität, **nicht automatisch den Live-Status des neuen SQLite-Hosts**.

## 4. Neuer Server (Version 1.0.0; früher v22.9): nur aktuelle + vorige Version

**DIESE REGEL HAT VORRANG FÜR KÜNFTIGE SERVER-DEPLOYMENTS.** Singleplayer UND Multiplayer werden gemeinsam als **ein einziges geprüftes Releasepaket** auf dem neuen Server veröffentlicht.

- Nach Installation von v1: nur **v1** verfügbar/spielbar.
- Nach Installation von v2: **v1 und v2** auf dem Server, **v2 ist aktiv und spielbar**.
- Nach Installation von v3: **v2 und v3** auf dem Server, **v3 ist aktiv und spielbar**, **v1 ist gelöscht**.
- Nach v4: **v3 und v4**, v4 aktiv, v2 gelöscht. **Nie mehr als aktive Version + unmittelbar vorige erfolgreiche Version** im freigegebenen Release-Speicher.
- Zwei Versionen sind für Rollback da. Niemals eine alte Version zum aktiven Standard machen, solange das neue Release den Health-Check bestanden hat.
- **Erst nach erfolgreichem Serverstart und Health-Check** der neu zugeordneten GitHub-Revision bereinigen. Wenn ein Update fehlschlägt: alte funktionierende Version wieder aktivieren, die fehlgeschlagene neue Version verwerfen; nicht die letzte funktionierende löschen.
- Nur erkannte Release-Verzeichnisse
  `/opt/arcane-duel/releases/v1.0.0-<12 hex>` (künftig entsprechend
  `v1.0.1-<SHA>` usw.) und für den Übergang vorhandene
  `v229-<SHA>`-Altverzeichnisse sowie zugehörige alte Uploadarchive/`.sha256` in `/srv/arcane-duel-upload/uploads` bereinigen. **NIE** Datenbank, `/var/lib/arcane-duel`, Backups, andere Uploads/Anwendungen, Aetherfall, Caddy-Gesamtkonfiguration, Spielstandexporte oder Secrets löschen.
- `/opt/arcane-duel/current` ist der atomar umgeschaltete Symlink auf die aktuelle spielbare Version, für **beide** Spielmodi gleichzeitig. Freigabe erfordert `/api/health` mit der richtigen Release-Revision.
- Serverpaket wird mit `python scripts/package-selfhost.py --output ../arcane-release` erzeugt (SHA256-Manifest/committeter sauberer GitHub-Stand), über SFTP in den begrenzten Uploadbereich gebracht, dann von einem Administrator aktiviert. **Vorher** `npm test`, `node --test tests/selfhost-v229.test.cjs`, `python3 -m unittest discover -s tests -p test_release_retention.py -v`.
- **Release-Manifest und Versionskonvention:** `scripts/package-selfhost.py`
liest die Nummer aus der Solo-Metaversion und prüft die Duo-Metaversion.
Das technische Paket heißt etwa `v1.0.0-<12 Zeichen Git-SHA>.tar.gz`,
die angezeigte Spielversion ist trotzdem exakt `1.0.0`, ohne zusätzliche
Bezeichnung. Der Administrator-Installer prüft die Übereinstimmung aus
Spielversion, Release-ID und Revision. Die alte `v229`-Release-ID ist
lediglich für den ersten möglichen Rollback zulässig.

**WICHTIGER ROLLOUT-VORBEHALT:** Das Repo-Skript `server/deploy-release.py` wurde auf `development` um sicheren Zwei-Versionen-Cleanup erweitert. Das privilegierte Produktions-Executable `/usr/local/sbin/arcane-duel-release` ist ausdrücklich **separat installiert** und wird durch GitHub-Commits **nicht automatisch aktualisiert**. Administrator muss es geprüft, mit Sicherung/rollbackfähig, vor dem nächsten produktiven Cleanup ersetzen. Bis zu bestätigter Installation nicht behaupten, auf dem tatsächlichen Server seien alte Releases bereits gelöscht.

Architektur: `server/main.cjs` (Node.js 24, localhost:8777), `server/sqlite-store.cjs` (private SQLite-Profile/-Räume, Transaktionen), `server/duo-handler.cjs` (autoritative Duo-Regeln), Caddy auf separater HTTPS-Origin. Die neue Website ist laut Entwicklerdokumentation `https://v2202610436378538039.ultrasrv.de:8443/`; **in dieser Übergabe keine selbstständige externe Health-Abfrage des Produktionsservers durchgeführt**. Referenz: `docs/SELFHOST_V229.md`.

**Server-Upload-Unterlagen:** Vorliegende verbindliche Quelle ist `docs/SELFHOST_V229.md` und `server/deploy-release.py`. Eine im letzten Chat angekündigte neue Dateianlage mit Uploaddetails war beim Erstellen dieser Übergabe nicht separat abrufbar; bei zusätzlichem Anhang dessen Inhalt vor tatsächlicher Produktionsaktivierung prüfen. Keine Administratorzugänge/Tokens wiedergeben.

## 5. Supabase bleibt ein separater Altbestand

Vorhandenes Supabase-Projekt `cvmtmvruutdneyblumgf` und Edge Function `arcane-duo-v2`, Version 33 aktiv (letzter Connector-Check 31.10.). GitHub-/RawGitHack-Variante kann weiterhin diesen Endpoint nutzen. Das neue eigene Hostsystem verwendet stattdessen `/api/duo` plus SQLite.

**Migration:** Unterschiedliche Browser-Origin bedeutet, dass lokale Solo-Spielstände auf die neue Website **per Export/Import** übertragen werden müssen. Duo-Profile nur über expliziten privaten Profilimport des Besitzers; keine automatische vollständige Supabase-Übernahme, und alte Räume werden nicht importiert. Bestehendes Supabase nicht löschen. Keine privaten Wiederherstellungslinks in Übergaben, Logs oder Antworten.

## 6. KI-Forschung

Produktiv ist die im Code verknüpfte Solo-KI/Bridge `assets/ai-production-bridge-v186.js`; separate Forschungsstände bis v19.0/v19.1 testen gegen eingefrorene v18.8-Baseline. Forschungsarbeiten sind **nicht automatisch** in Produktiv-Solo/Duo integriert. Dokumente: `docs/AI_V1900_SAFE_DECISION_RESEARCH_20261031.md`, `docs/AI_V1910_DECISION_QUALITY_STUDY_20261031.md`, ältere Langzeit-Roadmap `docs/AI_TRAINING_ROADMAP_20261019.md`. Alle Verbesserungen mit legalen Karteninventaren, mehreren Seeds, Rolle/Startspieler, gepaarten Vergleichen, Holdout und unveränderten Spielregeln abnehmen.

## 7. Neuester CI-Zustand und offener Katalog-Abgleich

- **Version:** Offizielle Nummer `1.0.0` wurde im Repo für Solo, Duo,
  Monsterlexikon, Paketdateien und Servermanifest eingetragen.
  Das bisherige CI-Ergebnis **41223756931 success** betrifft die
  frühere Implementierung von `4.1.0-dev.1`; nach dem Reset neueste
  CI-Läufe **erneut prüfen**, nicht von diesem alten Lauf ableiten.
- **Neuer Versionsreset und Teststand:** Die komplette Smoke-Suite meldete für
  `77c4df32c1bc...` drei Testfehler, da ältere Tests noch sichtbar
  `4.1` erwarteten. Die Spiellogik war nicht als fehlerhaft nachgewiesen.
  Die drei alten Titelassertions wurden in
  `tests/artwork-motion-v41-update.test.cjs`,
  `tests/visual-polish-v252.test.cjs` und
  `tests/visual-v3.test.cjs` auf `1.0.0` aktualisiert;
  auch Regelbuch/Archiv verwenden nun die dynamische Versionsanzeige.
  Die neuesten vollständigen Smoke-Ergebnisse vor Freigabe erneut abfragen;
  keine pauschale Erfolgsbehauptung für ausstehende Runs.
- **Bisher beobachtete Smoke-Fehlermeldung** bei neueren Commits vor dem Guardian-Abgleich: `assets/duo-opponent-catalog-v201.json differs from current solo opponents. Regenerate it.` Dies deutet auf ein veraltetes generiertes Gegnermanifest nach Solo-/Guardian-Änderungen. Jüngster Korrekturcommit `882049929fbf` synchronisiert 22/78-Wächterwerte, aber **CI für den letztgültigen neuen HEAD nochmals kontrollieren**; nicht ungeprüft behaupten, alles sei grün. Generator: `node scripts/build-duo-opponents-v201.cjs` ohne `--check`, anschließend Katalog und Supabase-Gegenstück prüfen, `npm test` neu ausführen und bei erforderlicher Backendänderung bewusst deployen.
- **Zwei-Versionen-Retention** in `server/deploy-release.py` und Tests `tests/test_release_retention.py`, über `.github/workflows/selfhost-v229.yml` angebunden. Nur tatsächliche erfolgreiche CI-Ausführungen als bestanden nennen.
- Neuen Server nicht ungeprüft automatisch aktualisieren. **Code-Commit != Deployment != öffentliche Live-Abnahme**.
- Weiter offen: menschliche Akzeptanztests für Animationen/Sounds/UX, Abgleich Host-Gast-Duellanforderung, KI-Partnerfusionsfall unter echter KI-Auswahl, Sicherheit/Rollback/Backup-Prüfung vor aktiver Serverinstallation.

## 8. Verbindlicher Arbeitsbeginn im nächsten Chat

1. `development`-HEAD und die letzten GitHub-Commits abrufen; vergleichen, ob dieser Übergabestand noch aktuell ist. `main` nicht ändern. **Offizielle Version ist ab diesem Reset 1.0.0 = ehemalig v22.9**; die v22.x-Nummerierung endet hier.
2. Betroffenen Spielmodus, Server- und Quellstand verifizieren und die **eine gemeinsame** offizielle Spiel-/Serverversionsnummer bestimmen (ohne Beinamen/Suffix).
3. Fachliche Änderung auf `development` durchführen; bei **allen** Solo-, Multiplayer- oder Server-Änderungen die offizielle Version auf allen Oberflächen konsistent erhöhen.
4. Unit-/Regressionstests, Browserprüfungen, Backend-Integrationen, Server-Retentionstests und CI abschließen; Testergebnisse offen ausweisen.
5. **Nur** geprüfte Releasepakete hochladen; auf dem neuen Server genau **aktiv + vorherige erfolgreiche Version** behalten, neueste aktiv, alte erst nach erfolgreichem Health-Check löschen.
6. Abschließend Commit-SHA, Spielversion, betroffene Dateien, Testläufe, Deploymentstatus und offene Punkte nennen – ohne Geheimnisse.

**Historische Einordnung:** Das alte `v22.9` ist **nicht zusätzlich**
als separate neue Version zu behandeln: `v22.9` ↔ `1.0.0`
ist dieselbe Ausgangsfassung. Die Bezeichnung `v4.1.0-dev.1`
wird nach der Umstellung ebenfalls nicht mehr als offizielle Versionsnummer geführt.

**Wichtige Links:** [GitHub](https://github.com/2dz28t8rt2-eng/Arcane-Duel) · [Entwicklungsfassung](https://raw.githack.com/2dz28t8rt2-eng/Arcane-Duel/development/index.html) · [Versionsregeln](SINGLEPLAYER_VERSIONING.md) · [Server/Upload](SELFHOST_V229.md) · [Duo-Prüfung](DUO_MULTIPLAYER_20261031.md).

*Diese Übergabe wurde auf Basis des HEAD unmittelbar vor ihrer Erstellung erstellt; der Commit, der diese Datei selbst einführt, ist im Git-Verlauf danach sichtbar.*
