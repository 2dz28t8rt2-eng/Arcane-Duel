# ARCANE DUEL – AKTUELLE CHATGPT-ÜBERGABE

**Snapshot: 31.10.2026**  
**Überprüfte Codebasis vor dieser Übergabedatei:** `development` auf `63f5718a0326f0467207de8b1c9fed9e36431d8c`.  
**Stabiler Branch:** `main` auf `b4bee27980af899b53c9eb5582d70463652e98e5` (nicht eigenmächtig ändern).  
**Repository:** https://github.com/2dz28t8rt2-eng/Arcane-Duel

> **WICHTIG FÜR EINEN NEUEN CHATGPT-CHAT:** Diese Datei ist ein datierter Übergabestand, kein Live-Snapshot. Vor Änderungen IMMER den tatsächlichen GitHub-HEAD von `development`, die neuesten Commits, die betroffenen Dateien und GitHub-Actions-Läufe prüfen. Eine neue Version nur nach Tests bereitstellen. Nie bisherige Profile, Datenbanken, Saves, Aetherfall oder andere Serverdienste ungefragt ändern. Keine Geheimnisse oder privaten Wiederherstellungslinks ausgeben.

## 1. Versionsnummern – nicht verwechseln

| Bereich | Bestätigter Stand | Bedeutung |
| --- | --- | --- |
| **Singleplayer – offizielle Spielversion** | **v4.1.0-dev.1** | Einzige maßgebliche Singleplayer-Versionsnummer auf `development` |
| Spielgeneration | 4.1 Bestiarium | Designtitel |
| Jüngste interne Solo-Entwicklung | v22.7 | Sieg-/ACE-/Seelenbund-/Boss-Feedback |
| Gemeinsam genutzte Präsentation | v22.8 | Solo- und Duo-UI-Komponenten |
| Eigenständiges Hosting | v22.9 bzw. Paket v229 | Node.js-/SQLite-Server |
| Windows-EXE | 0.1.5 | Eigene Binärversion; lädt Spielinhalte von `development` |
| Bisheriges Supabase-Duo-Backend | Edge Function v33 | Supabase-Projekt `cvmtmvruutdneyblumgf` |
| Singleplayer-Speicherformat | `PROFILE_VERSION=3` | Unabhängig von Spielversion |

**Verbindlich:** `index.html` definiert `<meta name="arcane-duel-version" content="4.1.0-dev.1">`. `assets/solo-version.js` und `assets/solo-version.css` zeigen die Spielversion im Titelmenü, in Optionen, in der HUD-Kopfzeile und im Browsertitel. `package.json` und die zwei Wurzelversionsfelder in `package-lock.json` entsprechen derselben Version. `scripts/check-solo-version.cjs` und `.github/workflows/singleplayer-version.yml` prüfen dies; erster Workflow-Lauf **41223756931: success**.

**Für jedes weitere Singleplayer-Update die offizielle Version erhöhen**, z. B. als nächstes `4.1.0-dev.2`. Nur getestete und ausdrücklich freigegebene Stände nach `main`; die EXE-Version und das Save-Schema nicht einfach mit erhöhen. Ausführliche Regel: `docs/SINGLEPLAYER_VERSIONING.md`.

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

## 4. Eigenständiger neuer Server (v229): zwei Versionen, nicht mehr

**DIESE REGEL HAT VORRANG FÜR KÜNFTIGE SERVER-DEPLOYMENTS.** Singleplayer UND Multiplayer werden gemeinsam als **ein einziges geprüftes Releasepaket** auf dem neuen Server veröffentlicht.

- Nach Installation von v1: nur **v1** verfügbar/spielbar.
- Nach Installation von v2: **v1 und v2** auf dem Server, **v2 ist aktiv und spielbar**.
- Nach Installation von v3: **v2 und v3** auf dem Server, **v3 ist aktiv und spielbar**, **v1 ist gelöscht**.
- Nach v4: **v3 und v4**, v4 aktiv, v2 gelöscht. **Nie mehr als aktive Version + unmittelbar vorige erfolgreiche Version** im freigegebenen Release-Speicher.
- Zwei Versionen sind für Rollback da. Niemals eine alte Version zum aktiven Standard machen, solange das neue Release den Health-Check bestanden hat.
- **Erst nach erfolgreichem Serverstart und Health-Check** der neu zugeordneten GitHub-Revision bereinigen. Wenn ein Update fehlschlägt: alte funktionierende Version wieder aktivieren, die fehlgeschlagene neue Version verwerfen; nicht die letzte funktionierende löschen.
- Nur erkannte Release-Verzeichnisse `/opt/arcane-duel/releases/v229-<12 hex>` und die zugehörigen alten Uploadarchive/`.sha256` in `/srv/arcane-duel-upload/uploads` bereinigen. **NIE** Datenbank, `/var/lib/arcane-duel`, Backups, andere Uploads/Anwendungen, Aetherfall, Caddy-Gesamtkonfiguration, Spielstandexporte oder Secrets löschen.
- `/opt/arcane-duel/current` ist der atomar umgeschaltete Symlink auf die aktuelle spielbare Version, für **beide** Spielmodi gleichzeitig. Freigabe erfordert `/api/health` mit der richtigen Release-Revision.
- Serverpaket wird mit `python scripts/package-selfhost.py --output ../arcane-release` erzeugt (SHA256-Manifest/committeter sauberer GitHub-Stand), über SFTP in den begrenzten Uploadbereich gebracht, dann von einem Administrator aktiviert. **Vorher** `npm test`, `node --test tests/selfhost-v229.test.cjs`, `python3 -m unittest discover -s tests -p test_release_retention.py -v`.
- **WICHTIGER ROLLOUT-VORBEHALT:** Das Repo-Skript `server/deploy-release.py` wurde auf `development` um sicheren Zwei-Versionen-Cleanup erweitert. Das privilegierte Produktions-Executable `/usr/local/sbin/arcane-duel-release` ist ausdrücklich **separat installiert** und wird durch GitHub-Commits **nicht automatisch aktualisiert**. Administrator muss es geprüft, mit Sicherung/rollbackfähig, vor dem nächsten produktiven Cleanup ersetzen. Bis zu bestätigter Installation nicht behaupten, auf dem tatsächlichen Server seien alte Releases bereits gelöscht.

Architektur: `server/main.cjs` (Node.js 24, localhost:8777), `server/sqlite-store.cjs` (private SQLite-Profile/-Räume, Transaktionen), `server/duo-handler.cjs` (autoritative Duo-Regeln), Caddy auf separater HTTPS-Origin. Die neue Website ist laut Entwicklerdokumentation `https://v2202610436378538039.ultrasrv.de:8443/`; **in dieser Übergabe keine selbstständige externe Health-Abfrage des Produktionsservers durchgeführt**. Referenz: `docs/SELFHOST_V229.md`.

**Server-Upload-Unterlagen:** Vorliegende verbindliche Quelle ist `docs/SELFHOST_V229.md` und `server/deploy-release.py`. Eine im letzten Chat angekündigte neue Dateianlage mit Uploaddetails war beim Erstellen dieser Übergabe nicht separat abrufbar; bei zusätzlichem Anhang dessen Inhalt vor tatsächlicher Produktionsaktivierung prüfen. Keine Administratorzugänge/Tokens wiedergeben.

## 5. Supabase bleibt ein separater Altbestand

Vorhandenes Supabase-Projekt `cvmtmvruutdneyblumgf` und Edge Function `arcane-duo-v2`, Version 33 aktiv (letzter Connector-Check 31.10.). GitHub-/RawGitHack-Variante kann weiterhin diesen Endpoint nutzen. Das neue eigene Hostsystem verwendet stattdessen `/api/duo` plus SQLite.

**Migration:** Unterschiedliche Browser-Origin bedeutet, dass lokale Solo-Spielstände auf die neue Website **per Export/Import** übertragen werden müssen. Duo-Profile nur über expliziten privaten Profilimport des Besitzers; keine automatische vollständige Supabase-Übernahme, und alte Räume werden nicht importiert. Bestehendes Supabase nicht löschen. Keine privaten Wiederherstellungslinks in Übergaben, Logs oder Antworten.

## 6. KI-Forschung

Produktiv ist die im Code verknüpfte Solo-KI/Bridge `assets/ai-production-bridge-v186.js`; separate Forschungsstände bis v19.0/v19.1 testen gegen eingefrorene v18.8-Baseline. Forschungsarbeiten sind **nicht automatisch** in Produktiv-Solo/Duo integriert. Dokumente: `docs/AI_V1900_SAFE_DECISION_RESEARCH_20261031.md`, `docs/AI_V1910_DECISION_QUALITY_STUDY_20261031.md`, ältere Langzeit-Roadmap `docs/AI_TRAINING_ROADMAP_20261019.md`. Alle Verbesserungen mit legalen Karteninventaren, mehreren Seeds, Rolle/Startspieler, gepaarten Vergleichen, Holdout und unveränderten Spielregeln abnehmen.

## 7. Neuester CI-Zustand und offener Katalog-Abgleich

- **Versionsworkflow** `singleplayer-version.yml`: erste Ausführung **41223756931 success**. Version v4.1.0-dev.1 im aktuellen Solo-Code hinterlegt.
- **Bisher beobachtete Smoke-Fehlermeldung** bei neueren Commits vor dem Guardian-Abgleich: `assets/duo-opponent-catalog-v201.json differs from current solo opponents. Regenerate it.` Dies deutet auf ein veraltetes generiertes Gegnermanifest nach Solo-/Guardian-Änderungen. Jüngster Korrekturcommit `882049929fbf` synchronisiert 22/78-Wächterwerte, aber **CI für den letztgültigen neuen HEAD nochmals kontrollieren**; nicht ungeprüft behaupten, alles sei grün. Generator: `node scripts/build-duo-opponents-v201.cjs` ohne `--check`, anschließend Katalog und Supabase-Gegenstück prüfen, `npm test` neu ausführen und bei erforderlicher Backendänderung bewusst deployen.
- **Zwei-Versionen-Retention** in `server/deploy-release.py` und Tests `tests/test_release_retention.py`, über `.github/workflows/selfhost-v229.yml` angebunden. Nur tatsächliche erfolgreiche CI-Ausführungen als bestanden nennen.
- Neuen Server nicht ungeprüft automatisch aktualisieren. **Code-Commit != Deployment != öffentliche Live-Abnahme**.
- Weiter offen: menschliche Akzeptanztests für Animationen/Sounds/UX, Abgleich Host-Gast-Duellanforderung, KI-Partnerfusionsfall unter echter KI-Auswahl, Sicherheit/Rollback/Backup-Prüfung vor aktiver Serverinstallation.

## 8. Verbindlicher Arbeitsbeginn im nächsten Chat

1. `development`-HEAD und die letzten GitHub-Commits abrufen; vergleichen, ob dieser Übergabestand noch aktuell ist. `main` nicht ändern.
2. Betroffenen Spielmodus, Server- und Quellstand verifizieren und die richtige offizielle Spielversionsnummer bestimmen.
3. Fachliche Änderung auf `development` durchführen; bei Solo-Änderungen die offizielle Version konsistent erhöhen.
4. Unit-/Regressionstests, Browserprüfungen, Backend-Integrationen, Server-Retentionstests und CI abschließen; Testergebnisse offen ausweisen.
5. **Nur** geprüfte Releasepakete hochladen; auf dem neuen Server genau **aktiv + vorherige erfolgreiche Version** behalten, neueste aktiv, alte erst nach erfolgreichem Health-Check löschen.
6. Abschließend Commit-SHA, Spielversion, betroffene Dateien, Testläufe, Deploymentstatus und offene Punkte nennen – ohne Geheimnisse.

**Wichtige Links:** [GitHub](https://github.com/2dz28t8rt2-eng/Arcane-Duel) · [Entwicklungsfassung](https://raw.githack.com/2dz28t8rt2-eng/Arcane-Duel/development/index.html) · [Versionsregeln](SINGLEPLAYER_VERSIONING.md) · [Server/Upload](SELFHOST_V229.md) · [Duo-Prüfung](DUO_MULTIPLAYER_20261031.md).

*Diese Übergabe wurde auf Basis des HEAD unmittelbar vor ihrer Erstellung erstellt; der Commit, der diese Datei selbst einführt, ist im Git-Verlauf danach sichtbar.*
