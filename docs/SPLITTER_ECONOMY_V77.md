# Arcane Duel v7.7 – Splitter als echte Karten-Währung
**Status:** als Gameplay-Funktionen im Branch `development` implementiert. **Nicht auf `main` veröffentlicht.** Abschließender CI-/Karrieretest bleibt bis zum grünen Workflow Pflicht.

## Umsetzung

### 1. Direkte Herstellung normaler Karten ohne Essenz

| Normalkartenlevel | Splitterpreis |
| --- | ---: |
| 1–3 | 10 |
| 4–6 | 18 |
| 7–8 | 28 |
| 9–10 | 40 |

- Ein eigenes, nach drei Levelbereichen geordnetes **Rezeptregister im Booster-Shop** enthält auch **noch nicht besessene**, aber bereits legal freigeschaltete Normalkarten. Der reguläre Deckeditor behält seine bereits besessenen Karten.
- Die Herstellung normaler Monster kostet **keine zusätzliche Essenz** mehr.
- Karten mit ACE-, Essenzmonster-, Quest-, Level-1-Sonder-, Meilenstein-, Werkstatt- oder Trainingsexklusivität bleiben nicht frei kaufbar.
- **Bestehende seltene Fusionsrezepte behalten** den alten Preis 30 Splitter **plus** Essenz und den bisherigen Freischaltpfad, damit Quests/Serien nicht stillschweigend geändert werden.
- Die echte `cardAvailable`-Prüfung sperrt noch nicht freigeschaltete Turnierkarten, Hard-Quellen, exklusive Gestalten und nicht verfügbare Fundorte.

### 2. Einmaliger Booster-Neuwurf

- Direkt im Shop zeigt die **letzte tatsächlich gekaufte** Boosterkarte bei geeigneter Startkarte einen Tauschbutton.
- **5 Splitter** ersetzen *genau ein* noch nicht für Decks oder Favoriten reserviertes originales Startmonster durch **ein zufällig gezogenes normales Monster aus dem erlaubten aktuellen Tier-Pool**.
- Kein ACE, keine zusätzliche seltene Fusion, kein Zugang zu einem künftigen Turniergebiet. Die Quellenobergrenze (plus `requiredTier`) ist ausdrücklich geprüft.
- Die alte Karte **wird aus dem realen Inventar entfernt**, die neue wird tatsächlich hinzugefügt. Kartenzahl bleibt gleich. **Eine Verwendung pro gekauftem Booster**, auch nach Neustart; beim nächsten Kauf ersetzt der neue Beleg den alten.
- Der individuelle `lastBooster`-Beleg enthält künftig `rerolled:boolean`; auch alte Belege ohne dieses Feld werden akzeptiert und sicher migriert.
- Steht keine unreservierte alte Karte mehr zur Verfügung, ist der Tausch deaktiviert. Bereits verwendete/geschützte Karten werden nicht entfernt.

### 3. Rollenforschung: drei Karten, eine behalten

- **12 Splitter**, vier Bereiche: Predator, Wächter (`guardian`), Seelenzehrer (`soul`), Allrounder.
- Nur zugängliche reguläre Normalkarten der ausgewählten Rolle werden gezogen. Drei **unterschiedliche** Angebote; ein Klick fügt **ein** echtes Exemplar zum Inventar hinzu. Die anderen zwei Optionen verfallen.
- Es müssen mindestens drei Karten dieser Rolle freigeschaltet sein; sonst lässt sich diese Rolle noch nicht erforschen.
- Der Forschungskauf wird vor der Auswahl belastet, **nicht erneut** bei der Wahl. Offene Angebote werden als `profile.shardResearch={role,offers}` gespeichert und beim Neustart wiederhergestellt; noch offene Auswahl blockiert den Start einer neuen Forschung oder eines weiteren gekauften Boosters.
- `validateProfile` prüft gespeicherte Angebote auf dreifache Einzigartigkeit, richtige Rolle, tatsächliche Turnier-Freischaltung und verbotene Sonderkarten. Doppelte Belohnungen durch mehrfaches Auswählen sind nicht möglich.

## Technischer Eingriff

- `assets/game.js`: `cardCraftShardCost`, `craftCard`, `rerollBoosterStarter`, `shardResearchPool`, `beginShardResearch`, `takeShardResearchCard`; neue Shop-Rezepte und Aktionen; Save-Version wird **nicht zurückgesetzt**, bestehende Ränge/Investitionen bleiben unverändert.
- `index.html`: Versionsparameter für `assets/game.js` aktualisiert, damit die `development`-Ansicht die neue Spiellogik lädt.
- `tests/shard-rework-v77.test.cjs`: Deckbesitz, Kosten/Essenz, Quellengrenzen, alte Fusionsrezepte, ACE-Ausschlüsse, Neuwurf-Kartenzahl, Belegpersistenz und Forschungsauswahl.
- `.github/workflows/shard-rework-v77.yml`: spezifische v7.7-Prüfungen plus historische Progressions-, Karten- und Profiltests.

## Risiko- und Balancingpunkte für den nächsten Schritt

Diese Entscheidung macht durch Forschung auch höhere Karten **für einen niedrigeren festen Preis** erreichbar als über gezieltes Crafting, wenn sie schon legitim freigeschaltet sind. Das ist bewusst ein **zufälliger 1-von-3-Tausch**, keine freie Auswahl. Ob 12 Splitter auf späteren Turnierstufen zu günstig sind, muss in v7.8 mit tatsächlich **erspielten** Spielständen gemessen werden. Ebenso ist zu prüfen, ob die verbesserte Kartenversorgung die in v7.5 beobachtete Level-4-Engstelle vor VIII behebt und ob die fehlenden alten Grundausbildungswerte die Early-Game-Schwierigkeit übermäßig erhöhen.

**Noch nicht geändert:** Gegnerwerte, NPC-KI, Level-1-Saga, Shop-Boosterpreise, Splitter-Dropmengen, andere Skill-Funktionen, große geplante Levelreform und `main`. Ein erfolgreicher CI-Lauf allein genügt nicht als Nachweis für die Balance kompletter Karrieren.
