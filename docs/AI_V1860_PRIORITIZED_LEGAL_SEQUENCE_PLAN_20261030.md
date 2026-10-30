# Arcane Duel KI v18.6 – Legal-Skill-Priorität und Schwerpunkttraining (2026-10-30)

## Ausgangslage

Im erfolgreichen Lauf v18.5 (#41098684049) wurden 46.080 Duelle und 27 Jobs abgeschlossen. 2.304 Stage-8-Paarungen: 0 Siegerwechsel trotz 147 protokollierter Overrides, 6.484 geprüfter Erstaktionen, 4.704 Folgeaktionen und 1.347 Seelenbundbewertungen. Keine automatische Champion-Freigabe. Der eingefrorene Champion bleibt `l10-guarded-worst-reply`.

## Isolierter A/B-Versuch

- **Baseline**: exakt die regelgestützte optimierte **v18.5**-Taktik, unter v18.6-Namen neu kompiliert. Nicht zurück auf v18.4 wechseln.
- **Optimiert**: identische Regelbasis, identische strategische Werte, identischer Rollenschutz – ausschließlich andere Reihenfolge der **real legalen** Kandidaten und budgetierte Erweiterung des Same-Turn-Lookaheads.
- **Neue Priorität**: bei freiem Gegnerfeld legale direkte Angriffe voran, dann verfügbare aktive Seelenfähigkeiten aus DEF, dann gezielte Angriffe. Die tatsächliche Legalität ist weiterhin ausschließlich durch `baseApply()` auf Spielkopien bestätigt. Die Startposition/Angriffsbereitschaft kommt aus `canAttack()`; keine verdeckten Gegnerkarten.
- **Mehr Prüfung bei Risiko**: maximal 24 Erstaktionen statt 18; bis zu 16 Folgeaktionen bei sichtbaren LP-Grenzen (Gegner <= 4.000 oder Selbst <= 3.000), ansonsten 10 statt 8. Kein synthetischer Gegnerzug, keine unerwiesene mehrzügige Siegchance.
- **Frische Fokus-Starts** in Stage 8/9: Seed-Offsets 1860/860 statt 810/510; gleiche Start-Situationen für beide Kohorten. Die restlichen Forschungsstufen behalten ihren Fokus. TRAIN, VALIDATION, HOLDOUT bleiben strikt getrennt.
- **Wächter-/Seelenzehrer-Eingriff isoliert**: v18.5 bestätigte exakt geschützte Predator-/Fusion-/Resonator-/Allrounder-Parität. Kein Eingriff in Spielfunktionen/Decks/Kampfwerte.

## Evidenz

Regelatlas weiterhin 39 code-verankerte Mechaniken. Verifizierte Aktion und tatsächlicher Sieg `winner` stehen über geschätztem Strategiewert. Alle Frozen-Champion-Gates und 2.304 gepaarten Einzelkämpfe bleiben aktiv. Die reine Änderung der Suchpriorität ist **kein Nachweis** größerer Spielstärke; das entscheiden ausschließlich Spielausgänge und externe Gates. 46.080 Duelle geplant, 23.040 pro Kohorte. Keine Produktiv-KI-Integration und keine Auto-Promotion.
