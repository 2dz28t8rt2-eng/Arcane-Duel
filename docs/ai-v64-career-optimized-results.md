# Arcane Duel – KI-Fortschritt v6.4: legaler Karriereausbau und Turnierstufen IV–VI

**GitHub Actions:** [v6.4 Training erfolgreich](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/runs/39248541233). **Datum:** 19.10.2026, Branch `development`, `main` und aktive KI unverändert.

## Realistischere Spielerkarrieren

Die neue `tests/ai-career-optimized-v64.cjs` spielt acht selbstständige, scripted Karrieren tatsächlich mit `simulateGame` und `rewardMatch`. Kein zugeschriebener Sieg, keine künstlichen Karten. Vor jedem anstehenden Turnier wird das reale `profile.inventory` samt Decks/Upgrades gespeichert, und `validateProfile` muss bestanden sein.

Die Trainingsspieler verwenden *echte bezahlte* `buyBooster`, `craftCard`, `buyUpgrade`, die bestehenden Charakterpacks und reguläre freie Wiederholungskämpfe **gegen zuvor besiegte Gegner**. Die Pläne `investment`, `specialize`, `farm` und `hybrid` setzen unterschiedliche Schwerpunkte. Alle tatsächlichen Käufe verbrauchen normale Coins bzw. Splitter. In `development` sind dies **nur Testskripte**, keine Änderungen an Balance, Dropchancen oder Benutzer-Konten.

**8 Karrieren**, **41 echte Inventar-Snapshots**. Die maximale vor einem Turnier erreichte Stufe bleibt **VI**; **kein gescripteter Karriere-Agent besiegte Gegner VI** innerhalb von 16 erlaubten Turnierversuchen pro Stufe.

| Turnierstufe | tatsächlich erspielte Inventare |
|---|---:|
| I | 8 |
| II | 8 |
| III | 8 |
| IV | 8 |
| V | 5 |
| VI | 4 |
| VII–X | 0 |

Die beiden am weitesten reichenden Karrieren kamen mit `guardian/farm`, `guardian/specialize`, `balanced/investment` und `economy/hybrid` bis vor VI; die Werte in diesem Dokument behaupten ausdrücklich **nicht**, dass VIII–X bereits real trainierbar seien. Speziell die tatsächlich gesammelten Normal-Monster erreichten im Test nach fünf Siegen maximal Kartenlevel 4/5.

## Training gegen diese echten Decks

Der separate Holdout `tests/ai-career-optimized-holdout-v64.cjs` hat **2.004 Duelle** gegen die bisherigen v5.7-Trainingsgewichte und die drei bekannten `gated`/Fusionsschutz-Kandidaten gespielt. Kandidatenauswahl im Training; unabhängige Seeds im Holdout. Nur IV–VI werden bewertet, weil das Ziel der Serie das mittlere/späte Turnier war.

| Boss | Snapshots | bester Trainingskandidat | zusätzliche Holdout-Siege | Veränderung mittlerer LP-Vorsprung | freigeben? |
|---|---:|---|---:|---:|---|
| IV | 8 | bisheriger v5.7-Scorer | 0 | 0 | Keine Änderung |
| V | 5 | Gated Survival | **−5** | **−191** | Nein, verschlechtert |
| VI | 4 | Gated Survival | **+1** | **+28** | Nein, zu kleine Stichprobenwirkung |
| **Summe** | | | **−4** | | **Keine Freigabe** |

Entscheidend: **Mehr Spiele allein** helfen nicht, wenn echte erspielbare Karten viel schwächer sind als optimistisch konstruierte Decks. Die Ergebnisse weisen eher auf **Deckbau- und Progressionsengpässe** als auf eine einfach lösbare Gewichtsfehlanpassung hin. Die KI- und Spielengine wurden deshalb **nicht** automatisch umgestellt.

## Nächster prüfbarer Schritt

Zusätzlich zur Ressourcennutzung fehlt dem bisherigen `equipBest()` eine explizit synergistische Rollenauswahl: bisher sortiert er normal hauptsächlich nach ATK+DEF. Ein neuer Test muss daher **gegen das unveränderte equipBest** bei exakt denselben tatsächlich erspielten Inventaren und Testseeds verschiedene Guardian-/Soul-/Predator-/Fusion-Deckbau-Varianten evaluieren. Erst bei nachgewiesenem Vorteil auf unabhängigem Holdout dürfen diese Strategien in zukünftige **Trainingskarrieren** übernommen werden. Es werden keine Fortschritte der Spielerkarriere erfunden und nichts auf `main` übertragen.
