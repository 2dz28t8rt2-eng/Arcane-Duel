# Bestiarium · Art-Datenbank / Kuratierung (15.10.2026)

## Was im Spiel tatsächlich verwendet wird
Bereits eingebunden: `assets/frames/ace-regalia.png`, `assets/frames/essence-aegis.png` (beide transparente RGBA-Grafiken mit 240×368 Pixeln), plus eigenständige Gravur-Layer `assets/frames/ace-regalia.svg` und `assets/frames/essence-aegis.svg`. Originalillustrationen bleiben unangetastet; das CSS `assets/arcane-luxe-ui.css` legt die Rahmen als getrennte `background-image`-Layer auf. Die Arbeiten wurden eigens für Arcane Duel erstellt, nicht von einer Stock-Asset-Plattform übernommen.

## Redaktionelles Ziel
Die vorhandenen Illustrationen haben einen dunklen, kontrastreichen, gemalten Dark-Fantasy-Look. Nicht jedes freie Monsterpaket passt auf Karten mit 200px breitem Artfenster. Die kuratierten Kandidaten sind mögliche **Erweiterungen**, keine stillschweigenden Ersetzungen vorhandener Illustrationen. Neue Kartentemplates brauchen eigene Stufen-, Rollen-, Fusions- und Balancingtests.

## Recherche, mit Quellen und Lizenzen
| Kandidat | Umfang / Gestaltung | Lizenz | Urteil |
|---|---|---|---|
| [Justin Nichol – Cute Monsters A–E](https://opengameart.org/content/cute-monsters-a-e) | 24 gezeichnete Fantasy-Monster, Teil von über 90 Figuren | CC-BY 3.0 / 4.0 | Umfangreich und zusammengehörig; eher freundlicher Chibi-Stil als bestehende Dark Fantasy. Für eigene Kreaturenfamilie vorsehen. Namensnennung erforderlich. |
| [Justin Nichol – Cute Monsters F–O](https://opengameart.org/content/cute-monsters-f-o) | 24 weitere Monster derselben Serie | CC-BY 3.0 / 4.0 | Gleiche einheitliche Serie; mit A–E sinnvoll. |
| [Justin Nichol – Cute Monsters P–Z](https://opengameart.org/content/cute-monsters-p-z) | 14 zusätzliche Illustrationen | CC-BY 3.0 / 4.0 | Gleiche Serie, insgesamt mindestens 62 Motive über die drei konkret gesichteten ZIPs. |
| [RPG Fantasy Portraits – Monsters, Heroes, Vampires](https://opengameart.org/content/rpg-fantasy-icons-portraits-monsters-heroes-vampires) | 27 Icons, 64×64 / 128×128 JPG | CC0 | Portraitstil brauchbar für NPCs, Beschwörungsangebote und Lexikon; zu niedrigauflösend für großformatige Premiumkarten. |
| [Kenney – Monster Builder Pack](https://opengameart.org/content/monster-builder-pack) | 178 kombinierbare PNG-Monsterteile | CC0 | Sehr gut für einheitliche kleine Lernfiguren, aber Stil cartoonartig, nicht als gleichwertige gemalte Kartenillustration. |
| [50+ Monsters Pack 2D](https://opengameart.org/content/50-monsters-pack-2d) | 56 konsistente front/back Monstersprites, 64×64 Pixel | CC0 | Nur im bewusst retrohaft/pixeligen Zusatzmodus einsetzen. |
| [Kenney – Fantasy UI Borders](https://opengameart.org/content/fantasy-ui-borders) | 130+ transparente UI-Sprites, 9-slice | CC0 | Empfehlenswert als künftiges GUI-/Fenster-Dekorpaket, nicht als Monsterillustration. |

### Integrationsvorgaben
- Pro Motivreihenfamilie eine **einheitliche Optik**, keine ungeprüften Mischungen aus Chibi, Pixel-Art und gemalten Kreaturen innerhalb derselben Kartenserie.
- Vor Einbau den Download archivieren, Urheber, URLs, Lizenzversion, Adaptierungen und Dateinamen in einem Quellenmanifest festhalten.
- Aus den neuen Motiven zunächst eine dedizierte **Artwork-Galerie** im Lexikon erstellen. Keine neuen Kartenstats/Fähigkeiten ohne eigene Simulation.
- Kompression für Spielkarten vorzugsweise WebP mit abgestimmtem Bildausschnitt; auf mobilen Bildschirmen sollte jedes Artwork bei kleineren Auflösungen scharf bleiben.
- Bereits vorhandene hochwertige Illustrationen bleiben unverändert.
- Shutterstock ausschließlich als Designinspiration; Bilder dort nur nach ausdrücklich erworbener, für Game-Assets erlaubter Lizenz einbinden.
- `tsParticles Slim` für Ritual-/besondere Partikel; die häufigen Funken bei Monsterzerstörung laufen offline mit leichten CSS-Partikeln, `prefers-reduced-motion` und der Optionsschalter bleiben bindend.

## Prioritäten für zukünftige Bilder
1. Passende gemalte Einzelmotive in CC0/CC-BY auf OpenGameArt finden, sortieren nach neutral, Feuer, Eis, Erde, Licht, Schatten.
2. Eine große **zusammenhängende** neue Serie aus mindestens 20 Einzelbildern auswählen; die 62 Motive von Justin Nichol sind als *einheitliche, aber stilistisch abweichende* Kandidaten vorgemerkt.
3. Bildausschnitte vereinheitlichen und eine Vorschau über fünf Karten-Level bauen; erst dann Kartenfamilien und Progression implementieren.
