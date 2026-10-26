# 2v2 v17.5 – Erspielte Progression und Leihkarten-Schutz (26.10.2026)

**Unverändert:** maximal zwei Menschen gegen zwei bestehende KI-Gegner; eigene 2v2-Profile ohne Solo-Import, `development` statt `main`, keine neue KI-Forschung. Die v17.4-Erstabschluss-Prämien (drei Kartenansprüche) und Kosten bleiben unverändert.

## Konkreter Befund

- Der vorherige v17.4-Benchmark verglich das Startdeck mit einem künstlich starken, nicht tatsächlich erspielten Deck. Die Ergebnisse zeigten die Deck-Stärke-Spanne, aber keinen erreichbaren Karriereverlauf.
- Der neue reproduzierbare Offline-Benchmark `node scripts/bench-duo-earned-v175.cjs 40` verwendet **nur echte Startkarten plus über die vorhandenen Economy-Regeln gewonnene Kapitelkarten und finanzierbare Käufe**. Zwei einfache geskriptete Spielweisen nutzen nur Beschwörung/Angriff/Ende, nicht alle Möglichkeiten echter Menschen. In 40 Seeds je Einkaufsstrategie erreichte der direkte Übergang I→II **0/40**, nach drei zusätzlichen Kapitel-I-Siegen + Materialpaket **2/40**, mit Kartenverstärkung + Einzelpaket **1/40**. Das ist **keine reale Spieler-Winrate** und ausdrücklich noch keine belastbare Begründung, die Live-Belohnungen zu vervielfachen.
- Dabei zeigte sich ein separater, reproduzierbarer Konstruktionsfehler: Die bisherige Kapitel-Leihkartenregel ersetzte starr die **ersten drei Deckslots**, auch wenn dort gerade die stärksten permanent erworbenen Karten lagen. Das wirkte wie eine unbeabsichtigte Bestrafung von Verbesserungen und konnte ein Deck über das Limit von drei identischen Karten schieben.

## Korrektur

- Bis zu drei Kapitel-Leihkarten verbessern jetzt **nur schwächere Deckkarten**, unabhängig von ihrer Position. Bereits stärkere erworbene Karten werden nicht verdrängt; das Gesamtdeck bleibt bei 40 Karten und das Maximal-3-Kopien-Limit gilt auch nach dem automatischen Leihkartentausch. Diese temporären Kapitelkarten werden weiterhin **nicht** zur privaten Sammlung hinzugefügt.
- Browser und serverseitiger 2v2-Regelkern teilen dieselbe Auswahlregel. Die UI erklärt die neue Funktionsweise ausdrücklich. Neue automatische Tests prüfen leistungsstarke Karten auf den ersten Slots, Kopienlimits, bereits durchgehend starke Decks und die Übereinstimmung von Browser- und Serverregeln.
- Der oben genannte Offline-Benchmark behält zwei schwache, regelgebundene menschliche Skript-Policies und unveränderte Gegner-KI. Selbst mit der Korrektur besteht weiter ein deutlicher Kapitel-I→II-Härtesprung; bevor Währungsbeträge, Kartenzahlen oder Gegnerstärke neu festgelegt werden, braucht es eine zweite Benchmark-Policy mit realistischen Fusionen, Positionswechseln und Rolleneffekten.

---

# 2v2 v17.4 – Progressionsbalance und garantierte Kapitelkarten (26.10.2026)

**Produktregel bleibt unverändert:** 2 Menschen (Sitz 0/2) gegen die 2 bestehenden KI-Gegner (1/3); **keine** Übertragung zwischen 2v2 und Singleplayer. Kein KI-Training, kein Merge nach `main`, keine echte Zwei-Geräte-Abnahme in diesem Schritt.

## Ausgangsanalyse

- Eine reguläre erste Kapitel-I-Belohnung gibt 60 EP, 105 Essenz, 2 Splitter.
- Ein Einzelmonster kostet 90 Essenz/1 Splitter. Die erste normale Verstärkung kostet 75 Essenz/1 Splitter. Für eine Einzelfusion fehlen nach dem ersten Kapitel-I-Sieg noch 55 Essenz; rechnerisch sind dafür zwei wiederholte Siege mit je 42 Essenz erforderlich. Das 3er-Materialpaket erfordert nach diesem Sieg drei bezahlte Wiederholungen.
- Bisherige Paketpools enthielten nach Kapitel III fast gleich viele Lv1-Karten wie Lv9-Karten. Ein nach Kapitelabschluss teuer gekauftes Paket konnte daher komplett aus niedrigstufigen Karten bestehen.
- Ein deterministischer Benchmark mit **zwei einfachen geskripteten menschlichen Entscheidungsregeln** (beste Handkarte beschwören, nur günstige Angriffe) und der **unveränderten** bisherigen NPC-AI zeigte mit Startdeck in Kapitel II–IV einen klaren Härtesprung; das stark aufgewertete theoretische Vergleichsdeck gewann dieselben Stichproben. Dies **ist keine reale Spieler-Winrate**, und das Vergleichsdeck wurde nur für QA künstlich zusammengestellt.

## Balancing-Anpassungen

- **Drei nicht handelbare Kapitelkarten-Ansprüche je erstmaligem Kapitelabschluss und menschlichem Profil.** Diese werden **atomar im vorhandenen PostgreSQL-Belohnungstrigger** gutgeschrieben. Wiederholungssiege liefern keine weiteren Ansprüche, sondern weiterhin die reduzierten Tageslimit-Belohnungen.
- Ein eingelöster Anspruch vergibt **genau eine normale, nicht essenzgebundene Karte aus den zwei höchsten bereits freigeschalteten Kartenstufen**, mit serverseitiger Zufallsauswahl, Kopienlimit 3 und revisionsgesicherter Profilaktualisierung. Die Karte wird der eigenen 2v2-Sammlung hinzugefügt, nicht automatisch ins laufende Deck. Alle neuen Duelle lesen ausschließlich dieses Profil.
- Normale Kartenpakete wählen nach einem Kapitelabschluss mit **65 % Chance** eine Karte aus den obersten zwei Kartenstufen, sonst aus dem gesamten erlaubten Pool. **Mehrkartenpakete garantieren mindestens einen** solchen oberen Fund – und behalten zugleich die festgelegten Fusionen-Ratios (3er 1–2, 5er 2–3, 10er 3–5). Vor dem ersten Kapitel bleiben die normalen Lv1–3-Pools wie bisher.
- Niedrige Kartenstufen bleiben für Lv1-Spezialstrategien erreichbar. Schicksals- und unfreigeschaltete Questkarten bleiben ausgeschlossen.
- Auf der Profilseite gibt es ein **Kapitelkarten-Konto**, eine Einlösen-Schaltfläche, den nächsten Erstabschluss-Bonus und einen **Essenz-/Splitter-Kostenrechner** für ausgewählte Booster. Rechenwerte zu fehlenden Wiederholungssiegen sind ausdrücklich **keine Prognose einer Siegchance**. Das 3er-Wiederholungs-Tageslimit (pro Kapitel, UTC-Tag) wird angezeigt.

## Technische Grenzen und QA

- Bestehende Profile: Der neue Zähler beginnt bei 0; im aktuellen Entwicklungssystem existierten beim Schemawechsel keine bereits abgeschlossenen 2v2-Profile, daher war keine rückwirkende Vergabe erforderlich.
- Mit einer **zurückgerollten Transaktion** wurden zwei menschliche Testprofile und ein gewonnener Raum geprüft: Jedes erhielt genau **3 Ansprüche**, 105 Essenz, 2 Splitter, 60 EP; ein zusätzliches Speichern vergab nichts doppelt.
- Neue Economy-Regressionen kontrollieren Kapitelstufen, Fusionsquoten, obere Kartenwahrscheinlichkeiten, niedrigstufige Erreichbarkeit, Kopienlimit und die serverseitige Anspruchsverbuchung. Zusätzlicher Headless-Chrome-Test (Desktop/410 px Smartphone) kontrolliert die Profilbedienung. Ein reproduzierbarer Vier-Kapitel-KI-Benchmark ist `node scripts/bench-duo-progression-v174.cjs`, ohne jede Änderung an der KI.
- Langfristiger End-to-End-Test mit zwei echten Menschen auf getrennten Geräten erfolgt erst nach dem gewünschten weiteren Funktionsausbau.

---

# 2v2 v17.3 – Wiederholung, Kartenschmiede, Sammlung und Zerlegung (26.10.2026)

**Gilt ausschließlich für den eigenständigen 2v2-Modus:** zwei Menschen gegen zwei KI-Gegner, kein Import aus dem Singleplayer, kein KI-Training und kein `main`-Merge.

## Wiederholungsbelohnungen

- **Erster Kapitelsieg:** wie bisher 100 % der Belohnung (Kapitel `k`: `40+20k` EP, `70+35k` Essenz, `1+k` Splitter).
- **Wiederholung in einem neuen Raum:** 50 % EP, abgerundete 40 % Essenz und ein Splitter.
- **Tageslimit:** maximal **drei** Wiederholungsauszahlungen je Kapitel und Profil pro **UTC-Tag**. Der erste Abschluss zählt nicht zum Wiederholungslimit. Keine erneute Auszahlung bei erneutem Speichern desselben Raums.
- Die Datenbank sperrt das jeweilige Profil während der Auszahlung (`FOR UPDATE`), verbucht in stabiler Profilreihenfolge und nutzt weiter das eindeutige Belohnungsprotokoll. Überschreitet man das Tageslimit, wird der Kampf nicht blockiert; es folgt lediglich keine weitere Auszahlung.
- Durchgeführt wurde ein **zurückgerollter** Datenbanktest mit zwei Profilen und fünf Siegräumen in Kapitel I: je Profil **150 EP / 231 Essenz / 5 Splitter** aus insgesamt 4 Auszahlungen, 5. Auszahlung wegen Limit unterblieben.

## Karten verbessern

- Im eigenen aktuellen Deck befindliche Karten können permanent von Rang 0 bis höchstens **Rang 5** verbessert werden. Die vorhandene Einzelkarten-Stat-Berechnung der 2v2-Kampflogik wird unverändert verwendet: +10 ATK/DEF je Rang bei frühen Karten-IDs unter 20, +20 bei Fusionen, +30 bei übrigen normalen Karten.
- Upgrade-Kosten für Rang `r → r+1`: `75 + 55r` Essenz, dazu `1 + floor(r/2)` Splitter; Fusionen kosten zusätzlich 35 Essenz und einen Splitter.
- Nur eine serverseitig bestätigte Profilrevision darf einen Kauf durchführen; Währung und Kartenrang werden in **einer** Profilaktualisierung gespeichert. Laufende Duelle behalten ihre anfänglichen Kartenwerte.
- Entfernt man eine verbesserte Karte aus dem aktiven Deck, wird der nicht mehr verwendbare Enhancement-Eintrag entfernt; beim aktiven gebundenen Essenzwesen wird eine unzulässige Deckentfernung abgelehnt.

## Eigene Sammlung und überzählige Karten zerlegen

- Such- und Filteransicht nach normalen Monstern, Fusionen und freien Exemplaren. Anzeige von erworbenen Exemplaren, im Deck belegten Exemplaren und Verstärkungsrang.
- Zerlegt wird **ein echtes, nicht im Deck benötigtes Exemplar**; ungenutzte normale Monster geben `18 + 5 × Level` Essenz und einen Splitter, ungenutzte Fusionen `42 + 5 × Level` Essenz und zwei Splitter.
- **Unzerlegbar:** alle im aktuellen Deck eingesetzten Exemplare sowie Ace-, Schicksals-, spezielle Lv1-Fusions- und Essenzwesen-Karten. Die Oberfläche verlangt zusätzlich eine ausdrückliche Bestätigung.
- Serverseitig werden der Kartenbestand und die Währung gemeinsam über den Profil-Revisionsvergleich aktualisiert. Kein mehrfacher Verkauf derselben Kopie und keine Änderung des Singleplayer-Inventars.

## Test- und Veröffentlichungsstatus

- Neue gemeinsame, reine Economy-Helfer, Node-Regressionsfälle, Chrome-Smoke-Tests für Desktop und Mobil sowie ein einmaliger, optionaler Live-Smoke mit einem eigens erstellten 2v2-Testprofil.
- Der Trigger für reduzierte Wiederholungsbelohnungen wurde auf der separaten Supabase-Beta bereitgestellt und in einer Transaktion mit anschließendem `ROLLBACK` überprüft.
- Die Kartenschmiede liegt ausschließlich auf `development`; reale Zwei-Geräte-Abnahme bleibt wie gewünscht zurückgestellt.
- Eine langfristige, persönliche Anmeldung statt der privaten Profil-Links ist für spätere Releases weiterhin sinnvoll.

---

# 2v2 v17.2 – Pakete, Freischaltungen und 2v2-Forschung (26.10.2026)

Ziel: den **ausschließlich eigenständigen** Fortschritt für **zwei Menschen gegen zwei KI** mit langfristigen Währungsausgaben, Karten- und Forschungsentscheidungen vertiefen. Kein Import aus dem Singleplayer, keine Änderungen an `main` oder der laufenden Gegner-KI-Forschung.

## Servergeprüfte Kartenpakete

| Paket | Erhaltene Karten | Fusionen | Essenz | Splitter |
|---|---:|---:|---:|---:|
| Einzelkarte | 1 | 0 | 90 | 1 |
| Einzelfusion | 1 | 1 | 160 | 2 |
| Essenzwesen | 1 | 0, garantiert ein Essenzwesen (ab Kapitel II) | 350 | 4 |
| Materialpaket | 3 | 0 | 230 | 2 |
| 3er Fusionsmix | 3 | 1–2 | 390 | 4 |
| 5er Fusionsmix | 5 | 2–3 | 600 | 6 |
| 10er Fusionsmix | 10 | 3–5 | 1.100 | 10 |

Die anderen Karten in gemischten Paketen sind normale Monster. Gewichte, Fusionenzahl, Kartenpool, Level-Obergrenze und Kopienzahl maximal 3 werden in der Supabase-Funktion bestimmt und geprüft. Ein Paket wird vollständig in **einer revisionsgebundenen Profilaktualisierung** bezahlt und verbucht (kein halbes Paket). Schicksals- und Quest-Spezialkarten werden nicht zufällig gezogen.

Der Kartenlevel-Pool wächst durch selbst erspielte Kapitel: Start bis Lv3, nach Kapitel I Lv5, nach II Lv7, nach III Lv9, nach IV Lv10.

## Eigenständige Forschungen

- **Verbotene Forschung:** Ränge 1–5 (jeweils mit Kapitel- und Währungsvoraussetzung). Erster Rang erteilt dauerhaft die drei tatsächlichen Lv1-Spezialfusionskarten Nekroth, Aegurion und Nyxar im **2v2-Inventar**; aktive Fusionsdeckplätze werden nur innerhalb des Maximums 15 ergänzt. Die bisherige Lv1-Fähigkeit wird mit dem Rang aus dem 2v2-Profil aktiviert. Keine Solo-Freischaltungen zählen.
- **Essenzforschung:** Ränge 1–3 mit Kapitelvoraussetzungen und steigenden Kosten. Erst mit Rang 1 darf ein ausschließlich im eigenen 2v2-Inventar und aktivem Deck befindliches Essenzwesen gebunden werden. Der Rang fließt in die bereits vorhandenen serverseitigen Essenzkampffähigkeiten ein. Ein Essenzwesen-Paket wird nach bestandenem 2v2-Kapitel II angeboten.
- Die Oberfläche zeigt Ränge, Kosten, Voraussetzungen und aktuellen Kartenlevel sowie alle neu erhaltenen Karten.

## Testabnahme

Gezielte reine Regeltests für Fusionsquoten, Kartenpools, Besitzgrenzen, Levelschranken, Essenzwesen-Verfügbarkeit und Forschungs-Voraussetzungen. Node-/Browserregressionen kontrollieren außerdem, dass ausschließlich die neue 2v2-Serverprofil-Lösung genutzt wird. Ein Echtgeld- oder Solo-Import wird nicht angeboten. Echte Zwei-Geräte-Abnahme weiterhin bewusst verschoben.

---

# 2v2 v17.1 – Eigener Spielstand und unabhängige Progression (26.10.2026)

**Verbindliche Produktentscheidung:** Zwei Menschen (Sitz 0 und 2) spielen zusammen gegen genau zwei KI-Gegner (Sitz 1 und 3). **Es gibt keinerlei Einzelspieler↔2v2-Import.** Die vorhandene gemeinsame Kartenbibliothek liefert nur unveränderliche Grafik-, Karten- und Regeldefinitionen. Keine Sammlung, Karte, Perk, Essenzbindung oder Quest-Freischaltung wird aus einem Solo-Speicher gelesen.

## Neues eigenständiges Profil

- Beim ersten Start erstellt der Spieler ausdrücklich ein 2v2-Profil, das auf dem Supabase-Server unter einer zufälligen Kennung gespeichert wird. Das Profil besitzt ein normales Startdeck und ein Fusionsstartdeck – nur dieses Profil bestimmt die Karten und Upgrades neuer Online-Räume.
- Jedes der beiden menschlichen Profile speichert Erfahrung, Level, 2v2-Essenz, Splitter, Siege, abgeschlossene Kapitel, erworbene Karten, Fusionskarten, Ausbauränge und aktive Decks. Die Modi teilen keine Speicher-Keys.
- Der persönliche Profilzugang liegt für einfaches Fortsetzen im lokalen Browser. Über einen ausdrücklich angeforderten **privaten Profil-Wiederherstellungslink** kann auf einem anderen Gerät weitergespielt werden. Der Link ist ein geheimes Kontotoken: Wer ihn besitzt, kontrolliert das gesamte 2v2-Profil. Nicht weitergeben, nicht öffentlich posten. Ein späterer Login mit persönlichem Konto/Passkey wäre für langfristige Sicherheit wünschenswert.
- Duelle werden nach bestätigten Aktionen automatisch gespeichert und bei Aktivität auf 90 Tage erneuert. Das 2v2-Profil bleibt unabhängig davon bestehen und speichert freigeschaltete Kapitel und Inventar dauerhaft.
- Ein Profil kann genau einen menschlichen Sitzplatz pro Raum belegen; der Partner benötigt ein eigenes Profil. Die Original-Singleplayer-KI-Forschung und `main` bleiben unverändert.

## Belohnungen, Kaufen und Bauen

- Ein gemeinsamer Sieg wird beiden berechtigten Profilen **transaktional und höchstens einmal pro Kapitel/Raum** gutgeschrieben. Kapitel `k` gibt jeweils `40+20k` Erfahrung, `70+35k` 2v2-Essenz und `1+k` Splitter. Ein durch Reconnect wiederholter Server-Update kann die Auszahlung nicht doppeln (unique ledger).
- Erfahrung ergibt `Level = 1+floor(xp/150)`. Höhere Kapitel werden durch eigene 2v2-Siege freigeschaltet. Stärkere Kartenpakete werden erst mit höherem Kapitel-Fortschritt erreichbar.
- Ein normales Paket kostet 90 Essenz + 1 Splitter und gibt eine regelkonforme Hauptkarte; ein Fusionspaket kostet 160 Essenz + 2 Splitter und gibt eine regelkonforme Fusionskarte. Alle Auslosungen und Kosten werden vom Server bestimmt und gespeichert.
- Kampf-Ausbauränge werden mit ausschließlich eigenständiger 2v2-Essenz erhöht (Kosten `100+70*Rang`); der Server beachtet die Rangobergrenzen.
- Der 40-Karten-Deckeditor sowie Fusionsdeckeditor können ausschließlich eigene, im 2v2 verdiente Karten verwenden. Bestands- und Kopienlimit werden serverseitig validiert. Das Deck eines bereits gestarteten Duells ändert sich dadurch nicht.

## Sicherheit und Teststatus

- Neue Tabellen `arcane_duo_v2_profiles` und `arcane_duo_v2_reward_ledger` sind RLS-gesperrt und haben keine öffentlichen Data-API-Rechte. Ausschließlich die getrennte Edge-Funktion verwendet serverseitig die Service-Role-Verbindung. Nur Hashes von Profil-/Raumzugangstokens liegen in der Datenbank, niemals deren Klartext.
- Der Kapitel-Belohnungstrigger wurde mit zwei Testprofilen, einem Testduell und einer doppelten Revisionsaktualisierung in einer **zurückgerollten** DB-Transaktion überprüft: zwei getrennte Auszahlungen, keine doppelte Buchung.
- Separate Node-/Browserprüfungen verifizieren die vollständige Trennung vom Solo-Profil, private Kartensammlungen, Solo-Tampering-Schutz, Deckvalidierung sowie die Profil-Erstellung. Ein einmaliger Live-Online-Smoke ist `scripts/smoke-duo-progression-v171.cjs`, über einen expliziten GitHub-Actions-Marker ausführbar.
- Bewusst noch offen: echter Test mit zwei physischen Geräten (erst nach weiterem Ausbau auf Wunsch), dauerhaftes Account-Login statt privater Recovery-Links und zusätzliche 2v2-spezifische Quest-/Essenzprogression.

---

# 2v2 v17.0 – Kampfpräsentation und Kapitelanzeige (26.10.2026)

**Festlegung:** Der Modus besitzt exakt **zwei menschliche Plätze** (Gastgeber 0, Partner 2) gegen **zwei serverseitig gesteuerte KI-Gegner** (1 und 3). Weitere Menschen oder echte 4-Spieler-Lobbys werden nicht eingeführt. Die gesonderte Forschung/Optimierung der Gegner-KI bleibt ausgeschlossen.

**Neu auf `development`:**
- Eigenständiger 2v2-Fusionscinema mit Material-Rollenstempel, tatsächlich vom Server berechneten ATK-/DEF-Würfelpaaren, markiertem bestem Wurf, Material-/Qualitätsbonus und Enthüllung von Kartenname, Grafik, finaler Stufe und Werten. Keine vorgetäuschten Würfel.
- Dezent animierte, stets **verdeckte** Kartenrücken bei Zuwachs der Hand. Gegnerische Handkarten-IDs werden nicht an die Darstellung weitergegeben. Schicksalszüge werden weiterhin getrennt inszeniert, um keine doppelten Kartenanimationen auszulösen.
- Skip-Schalter im Cinema, kurze Sequenz, beschränkte Würfel-/Kartenanzahl, mobile Layouts und `prefers-reduced-motion` (keine blockierende Animation).
- Klar sichtbare Mensch-/KI-Rollen an jedem Sitz sowie Hinweis „2 Menschen gegen 2 KI“ bei der Raumerstellung.
- Fortschrittsanzeige für alle vier Kapitel **ausschließlich im aktuellen Online-Raum**. Abgeschlossene Kapitel und ein übersprungener Direktstart werden unterscheidbar gekennzeichnet. Die Darstellung zahlt weder Essenz noch Splitter oder Karten aus und verändert keine Singleplayer-Sammlung.

**Verifiziert mit:** Node-Regressionen zu Rollenvertrag, Fusions-Würfeltrace, nicht öffentlichem Kartenziehen, verzögerten Revisionen und Kapitelübergang; Headless-Chrome-Browsercheck für Desktop und Mobilgerät (1.200 / 410 px).

**Bewusst zurückgestellt:** Echter Multi-Geräte-Abnahmetest auf Wunsch erst nach dem UI-/Regelausbau; dauerhafte Auszahlung, Kampagnenfortschritt und Spielerprofile erst nach serverseitiger Identitäts- und Besitzprüfung. Kein `main`-Merge, keine Veränderung der KI-Forschung oder des Backend-Kampfkerns.

---

# 2v2 v16.8 – Wiederaufnahme und Konfliktsicherheit (26.10.2026)

- **Sitzplatzübernahme auf zweitem Gerät:** Gastgeber und Partner können nach bewusstem Klick jeweils einen privaten, 64-Hex-Bearer-Link erzeugen. Der Link autorisiert **nur den eigenen Sitzplatz**; der Einladungsschlüssel ist separat. Die Berechtigung wird durch die bestehende Edge-Funktion mit einem SHA-256-Hash serverseitig überprüft. Nach erfolgreicher Wiederaufnahme wird das geheime URL-Fragment durch eine harmlose Raumreferenz ersetzt.
- **Keine automatische Langzeitspeicherung des Tokens:** Standardmäßig weiterhin ausschließlich sessionStorage pro Browser-Tab. Keine Speicherung in localStorage, kein neuer Login und keine permanente Berechtigung. Die Links verfallen spätestens mit dem 48-Stunden-Raum.
- **Verbindungsprobleme:** Online-, Sichtbarkeits- und Fokuswechsel lösen eine Aktualisierung aus. Polling bei Fehlern verwendet begrenztes Backoff von 2,5 bis 30 Sekunden. Unveränderte Revisionen zerstören keine Formularauswahl.
- **Konkurrierende Aktionen:** Veraltete Revisionsnummern werden schon vom Server abgelehnt. Der Browser lädt in diesem Fall automatisch den aktuellen Stand nach und fordert zu einer neuen Entscheidung auf; er wiederholt eine unbekannt ausgeführte Aktion **nicht** unkontrolliert. Rückläufige, verspätete Antworten werden ignoriert.
- **Neue Tests:** Node-Regressionen für Links, ungültige Tokens und Backoff; Chrome-Browserprüfung in 1200/410 px; manuell ausführbares `node scripts/smoke-duo-recovery-v168.cjs` für zwei unabhängige Online-Clients (echte Räume, Zugriffskontrolle, Sichtbarkeit privater Hände, Konkurrenz und Wiederaufnahme).
- **Wichtig:** Der neue Live-Test ist separat dokumentiert und nicht automatisch bestätigt. Eine reale Abnahme auf zwei physischen Geräten ist weiterhin erforderlich.
- **Nicht geändert:** Arcane-Duo-v2-Edge-Funktion, Datenbankschema, KI-Forschung, Singleplayer-Kampfregeln, der stabile `main`-Branch.

---

# 2v2 v16.7 – Darstellung und Synchronisation (26.10.2026)

- **Optisches Update:** Die Online-Beta liest bestätigte öffentliche Ereignisse aus dem Server-Spielstand. Angriffe, Fusionen, Beschwörungen, Schicksalszüge, Zerstörungen und Arena-Zerfall erhalten begrenzte, nicht spielrelevante Effekte. Bei reduzierter Bewegung bleiben verständliche Texthinweise.
- **Keine Änderungen am Regelkern:** Kartenwerte, Fusionswürfe, KI-Entscheidungen und serverseitige Zugberechtigungen bleiben unverändert. `main` wird nicht angerührt.
- **Client-Synchronisierung:** Unveränderte Revisionen bauen die Oberfläche nicht mehr unnötig neu auf. Auf `focus`, `online` und Rückkehr des sichtbaren Tabs wird sofort aktualisiert; bei Verbindungsverlust zeigt der Raum den Fehler.
- **Tests:** Eigene Node-Regressionen für bestätigte Ereignisse, private Sicht pro Sitzplatz, Turn-Rechte und Revisionen; Browser-Smoke-Test mit 1200/410 px.
- **Noch offen:** Echte Zweigeräte-E2E-Abnahme mit zwei Menschen, langfristige Anmeldung/geräteübergreifende Wiederaufnahme, dauerhaft verifizierte Sammlung/Belohnungen und vollständige Singleplayer-Animationsparität. Der 2v2-Beta-Server sowie alte Räume bleiben unverändert.

---

# Kampagnenstart und Kapitelpakete – 18. Oktober 2026

> **Fortsetzung 26. Oktober 2026 · v16.6 Schicksalszug und Arena-Zerfall auf `development`:**
> Der serverseitige Regelkern kann ab Runde 3 je Duellant einmal pro Kapitel
> einen seltenen Schicksalszug auslösen (1/3/5 % je nach LP-, Feld- und
> Bedrohungslage). Im 2v2 beziehen sich die Bedrohungswerte auf die beiden
> **gemeinsamen** Teamfelder und die 16.000 Team-LP. Die bisherige Hand wird
> ins Deck zurückgemischt und fünf der zehn originalen, temporären
> Singleplayer-Schicksalsmonster erscheinen. Ihre ATK/DEF übertreffen
> den stärksten Gegner aus Deck, Feld, Geisterzone oder Friedhof je um 100,
> maximal 10.000. Eigene Hand/verborgene Decks werden nicht an den Partner
> gesendet. Schicksalskarten sind für jede Fusion gesperrt und verschwinden
> beim Kapitelwechsel; auch Essenz-/Geistereffekte dürfen sie nicht
> ungewollt aufwerten. Die zehn individuellen Singleplayer-Artworks erscheinen
> im 2v2-Bildschirm.
>
> Am Ende einer vollständigen Vier-Sitzplätze-Runde setzt ab Runde 10 der
> Arena-Zerfall ein. Passend zu den 16.000 statt 10.000 LP beträgt der erste
> Schaden **320 LP je Team**, verdoppelt sich anschließend, wird bei 16.000
> gedeckelt und umgeht Schilde. Bei gleichzeitigem LP-Ende entscheiden die
> LP **vor** dem Zerfall, bei Gleichstand eine beim Erstellen serverseitig
> geloste Initiative. Alte `duo-v165`-Räume behalten ihre alten Regeln.
> 
> **Offen:** echter Multi-Geräte-Abnahmetest, verifizierte Karten-/Perk-Berechtigung,
> besondere Animationen und Feinschliff sowie Belohnungen/Ranking nach
> sicherer Authentifizierung. Keine KI-Strategieänderung, kein `main`-Merge.

> **Fortsetzung 26. Oktober 2026 · v16.5 Level-1-Forschung auf `development`:**
> Der isolierte Online-Regelkern übernimmt nun den lokal freigeschalteten Perk
> „Verbotene Forschung“ und dessen Rang 1–5. Der Server validiert die
> Eingabegrenzen; gewöhnliche Lv1-Karten erhalten +5 ATK/DEF je Rang.
> Ausschließlich bei aktiviertem Perk können die drei Questfusionen Nekroth,
> Aegurion und Nyxar aus 3–5 echten Lv1-Materialstufen entstehen, bleiben Lv1
> und erhalten ihre Klassenwerte und mindestens drei Qualitätswürfe.
> Nekroth baut bis zu fünf Geisterzonen auf, erzeugt Geisterfunken, regeneriert
> LP und kann sich durch ein Geisteropfer wiederbeleben. Aegurion leitet
> feindliche Einzelangriffe um und schützt mit DEF-Heilung und Schutzorbs;
> Nyxar steigert eigene ATK, erlaubt zwei Angriffe und erzeugt ein Echo-Angebot.
> Lumira besitzt exakte 111 Basiswerte, ihre LP-Entzug-/Heilfähigkeit und
> die einmalige Rettung bei 1 DEF. Das 2v2 kann nun Geisterpositionen,
> Geisterangriffe, Geister-Fusionsmaterial und begrenzte Floating-/Schwarm-Echos
> auswählen. Eine Geisterzone blockiert Direktangriffe wie das Hauptfeld.
> Neues Online-Interface, Vorschau und unabhängige Regressionstests gehören
> zu diesem Abschnitt; gewöhnliche Fusionen, Kampfausbauten und Essenzbindung
> bleiben erhalten.
>
> **Grenzen:** Die eigentliche Fünf-Stufen-Fanatiker-Quest wird im Online-2v2
> nicht erneut ausgespielt: Nur ihre bereits lokal freigeschaltete Forschung
> zählt. Effektbeschwörungen erscheinen in der Online-Beta direkt auf einem
> gewählten freien Hauptfeldplatz. Der Besitz von Karten/Perk kann ohne
> gemeinsamen Login noch nicht serverseitig bestätigt werden, daher keine
> Prämien, Rankings oder Rückschreibung ins Einzelspielerprofil. Zwei-Geräte-QA
> bleibt erforderlich. `main` und die KI-Forschung werden nicht angerührt.

> **Fortsetzung 26. Oktober 2026 · v16.4 Essenzbindung auf `development`:**
> Die getrennte Online-Beta liest zusätzlich die aktive Essenzbindung (Art,
> Spezialisierung, Fortschrittsstufe und Rang) aus dem lokalen Einzelspielerprofil,
> sofern das entsprechende Essenzwesen einmal im 40-Karten-Deck steckt. Der
> Server prüft die Kombination und die vom Fortschritt abhängigen Maximalränge.
> Reißzahn entwickelt seine Werte und wählt einmal 100 % oder zweimal 70 %
> Angriffsstärke; pro Schlag tritt Müdigkeit auf. Runenherz gewährt bei Präsenz
> auf dem Feld ein bis zwei zusätzliche unabhängige Qualitätswürfe für Fusionen.
> Aschenhort lenkt den ersten Angriff eines gegnerischen Zuges in DEF auf sich,
> halbiert dessen Stärke; Verteidigungsspezialisierung senkt den Zerfall von
> Wächtern/Seelenzehrern, stärkt deren Seelenspeicherung und schützt auf
> maximalem Rang einmal pro Kapitel
> einen Verbündeten durch „Letztes Bollwerk“.
>
> **Weiterhin offen:** Das lokale Profil ist in dieser unranked Beta nicht
> authentifiziert; die Servervalidierung bestätigt plausible Grenzen, aber
> noch keinen echten Kartenbesitz. Lv1-Spezialfusionen benötigen das gesamte
> Geister-/Wiederbelebungs- und Questregelsystem und folgen als separates Update.
> Echte Geräte-übergreifende QA ist weiter ausständig. `main`, bestehende Räume,
> Singleplayer-Gegner und KI-Forschung bleiben unverändert.

> **Fortsetzung 26. Oktober 2026 · v16.3 Kampf-Ausbaustufen auf `development`:**
> Der isolierte 2v2-Regelkern berechnet nun acht persönliche, bereits aus dem
> Singleplayer bekannte Kampfausbauten: Monstertraining (10), Jagdinstinkt (5),
> Schildwall (5), Standhaftigkeit (2), Kampfdisziplin (3), Fusionskunde (1),
> Runenpräzision (3) und Vorhut-Schutz (3). Normale Monster erhalten dieselben
> level- und rollenabhängigen Grundboni. Aufstiegsränge 0–5 erhöhen die Werte
> der eingesetzten Monster und die Basiswerte der Fusionsvorlagen. Der Zerfall
> steigt nun abhängig vom Level (L1: 20 bis L10: 170 ATK/DEF je eigenem Zug),
> reduzierbar durch Standhaftigkeit. Partner-Vorhut-Schutz addiert sich als
> gemeinsamer Schild vor die 16.000 Team-LP. Bei neuen Kapiteln wird der
> Schild neu aufgebaut. Fusionskunde und Runenpräzision wirken auf die
> serverseitig gewürfelten ATK-/DEF-Fusionen.
>
> **Sicherheitsgrenze:** Eingaben und maximale Ausbauränge werden am Server
> validiert, die Besitzberechtigung der aus dem lokalen Profil übertragenen
> Stufen ist mangels Spieler-Login jedoch noch nicht belegbar. Diese Beta ist
> weiterhin ohne Ranglisten, Spielprämien und Übertragung ins Einzelspielerprofil.
> Offen bleiben Lv1-Questfusionen mit vollständigem Sonderfähigkeitssystem,
> Essenz-Sonderfähigkeiten, Besitzprüfung und Zwei-Geräte-Abnahmetest.
> `main` und die KI-Forschung sind nicht Teil dieses Updates.

> **Fortsetzung 26. Oktober 2026 · v16.2 Fusionsabgleich auf `development`:**
> Die isolierte Online-Beta berechnet nun dieselben zentralen
> Fusionskomponenten wie der Singleplayer: Pokerkombinationen inklusive
> längster Teil-Straße mit zusätzlichen Duplikaten, Elementharmonie,
> abgestufte Materialqualität, wählbares Kernmonster (außer bei
> vollständigen Straßen), Allrounder-/Resonator-Boni,
> Qualitätserbe aus Kettenfusionen und einmaligen
> Resonator-Levelaufstieg. Der Server würfelt pro Fusion mehrere unabhängige
> ATK-/DEF-Paare mit jeweils 88–112 % und wählt den stärksten Summenwurf.
> Die Basiswerte stammen vom normalen Kartenlevel-Mittelpunkt,
> Materialverstärkungen werden erst nach dem Wurf verteilt.
> Die Benutzeroberfläche zeigt verständlich Kombination, Würfelzahl,
> Rolle, Kernlevel, Levelherleitung und mögliche Werte **vor** der Fusion.
> Der Zufallszustand bleibt ausschließlich auf dem Server.
> Bestehende 2v2-Räume bleiben mit ihren bisherigen Karten spielbar.
> Die KI-Forschung, die 2v2-Aktionsplanung und `main` bleiben unverändert.
> **Noch offen:** besondere Lv1-Questfusionen, persönliche Perks,
> Essenz-/Sonderfähigkeiten, Besitznachweis und Zwei-Geräte-Praxistests;
> die Beta bleibt ohne Ranglisten und Fortschrittsbelohnungen.

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
