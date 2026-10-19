# Arcane Duel · 16 Endgame-Normalmonster · v7.1

**Status:** Fertige Daten im Branch `development`, alle 16 hochauflösenden Originalillustrationen liegen im einmaligen Import-ZIP vor. Solange das ZIP nicht in GitHub hochgeladen ist, bleiben die 16 neuen Monster bewusst **nicht aktiv**: Das Spiel verbietet aktive SVG-/Platzhalterartworks.

## Automatischer 1-Datei-Import der Originalillustrationen

1. Öffne [artwork-import auf development](https://github.com/2dz28t8rt2-eng/Arcane-Duel/tree/development/artwork-import).
2. Wähle **Add file → Upload files**.
3. Lade exakt die Datei **`lategame16-v71.zip`** an diesem Ort hoch (im Download findest du dieselbe Datei zunächst als `Arcane_Duel_Lategame_v71_Artwork_Import.zip`, benenne sie vorher in `lategame16-v71.zip` um).
4. Commit **auf development**, nicht auf main. Der Workflow [Install Approved Lategame 16 Art v7.1](https://github.com/2dz28t8rt2-eng/Arcane-Duel/actions/workflows/import-lategame-art-v71.yml) validiert alle 16 SHA256-Checksummen und WebP-Dateien, schreibt die Dateien nach `assets/custom-art/lategame-v71/`, schaltet danach die Karten frei und führt den Engine-Test aus.

**Achtung:** Lade das ZIP als einzelnes Dateiobjekt hoch. Nicht zuerst entpacken oder die Bilddateinamen verändern. Nach dem Import müssen **16 Karten ab ID 716 bis ID 731** geladen werden und `window.ArcaneLateGameV71.artworksInstalled === true` gelten.

## Werte und Progression

| ID | Normalmonster | Level | Rolle | ATK | DEF | Nach Sieg gegen |
|---|---|---:|---|---:|---:|---|
| 716 | Vulkanbestie des Sturmruinenlands | 7 | Predator | 960 | 310 | V |
| 717 | Runenwächter der gefallenen Feste | 7 | Wächter | 320 | 950 | V |
| 718 | Gruftwächter der verlorenen Seelen | 7 | Seelenzehrer | 280 | 990 | V |
| 719 | Prismenchimäre des Kristalltempels | 7 | Allrounder | 670 | 600 | V |
| 720 | Blitzwyvern der Himmelsruinen | 7 | Predator | 980 | 290 | VI |
| 721 | Eisenwurzel-Koloss | 7 | Wächter | 350 | 920 | VI |
| 722 | Mottenfürst des Mondschleiers | 8 | Seelenzehrer | 340 | 1190 | VI |
| 723 | Basaltbasilisk des Lavakessels | 8 | Predator | 1150 | 380 | VI |
| 724 | Kathedralen-Leviathan | 8 | Wächter | 390 | 1140 | VII |
| 725 | Chimäre des kosmischen Sturms | 8 | Allrounder | 790 | 740 | VII |
| 726 | Sphinxwächter des Mondlichts | 8 | Wächter | 420 | 1110 | VII |
| 727 | Obsidian-Drache der Lavaruinen | 9 | Predator | 1390 | 440 | VII |
| 728 | Astraler Labyrinth-Minotaurus | 9 | Allrounder | 970 | 860 | VIII |
| 729 | Donnergreif des Himmelsbruchs | 9 | Predator | 1340 | 490 | VIII |
| 730 | Dornenholz-Hydra | 10 | Seelenzehrer | 460 | 1690 | VIII |
| 731 | Himmlischer Titan der Wolkenfestung | 10 | Wächter | 520 | 1630 | IX |

Die ATK+DEF-Kartenbudgets betragen für Level 7–10 exakt **1270 / 1530 / 1830 / 2150** und folgen dem bereits im Spiel bestehenden `workshopBudget(level)`.

Die neuen Karten sind **normale** RPG-Monster (keine ACEs, keine Fusionen). Die Rollen `predator`, `guardian`, `soul`, `allrounder` arbeiten mit vorhandenen Spielmechaniken wie Jagdinstinkt, Schildwall, Seelenentzug und Resonanz. Beschreibungen sind **keine erfundenen neuen aktiven Zauber**.

Jede Karte wird im Pool des zugehörigen besiegten Turniergegners, dessen Charakterpacks, in regulären Boostern und über Crafting mit den bestehenden Freischaltbedingungen verfügbar. Kein neues Monster ist automatisch im Starter-Inventar. Bestehende Karten-ID-Zuordnung und vorhandene Spielstände bleiben unverändert.

## Dateien

- `assets/lategame-monsters-v71.js`: fertige 16 Kartenobjekte mit Quellen und Mechaniken.
- `assets/lategame-cards-v71.json`: editierbarer Datenkatalog.
- `tests/lategame-monsters-v71.test.cjs`: Daten-, Deck-, Quellen- und Artwork-Tests.
- `artwork-import/lategame16-v71.zip`: einmalig durch Nutzer im GitHub-Repo hochzuladendes Quellarchiv.
- `tools/install-lategame-art-v71.py`: sicheres Importprogramm.
- `.github/workflows/import-lategame-art-v71.yml`: automatischer Artwork-Import.

**Nur `development`. `main` wird weder durch das Import-Skript noch durch diesen Workflow geändert.**
