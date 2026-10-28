# Bard full mechanics — Batch 05: jingles and maintained-song foundations

**Checked against official individual live rule pages:** 2026-10-28.

## Files added
- `rules/classes/bard-jingle-mechanics.json`: source-backed mechanics for **all 11 level-0 jingles**, with casting action, MP cost, school, range, targets, duration, maintained flag, saving throw, spell resistance, concise mechanical effects, scaling expressions, full individual source URLs.
- `rules/classes/bard-maintained-songs.json`: Bard-wide lifecycle, retargeting, concentration, free-action upkeep, target range, saving throw, and spell-resistance rules.
- `src/features/characters/rules/jingle-contract.mjs`: cross-validates each mechanic against the Bard song catalog and enforces manual-only status. No effect is silently applied to the sheet.
- `tests/bard-jingle-mechanics.test.mjs` and `tests/bard-maintained-rules.test.mjs`: regression tests.
- `docs/review/FFd20-Bard-Jingles-Review.txt`: human-readable per-jingle mechanics and review notes.

## Important rule interactions
- Two jingles are maintained: **Lullaby** and **Song of Serenity**. Both last up to `1 + CHA modifier` rounds, rather than being permanent toggles.
- **Song of Serenity** only lets the target **ignore fatigue** while maintained. This is **not permanent removal** of fatigue. Its current live rule differs from wording in the archived Bard descriptions PDF.
- **Boom** always causes 1 non-elemental damage; its Fortitude save applies to the 1d3-round Concentration penalty.
- **Ghost Sound** scales its range, maximum simulated voice volume and duration with caster level; one stable song identity.
- **Detune** persists until an instrument is retuned, though the spell's listed duration is instantaneous.
- Per Bard class rules, maintained songs require a free action each round; default capacity is one. **Medley** raises that capacity by class level; this is tracked as a *class feature upgrade*, not as separate song identities.
- Repeated save/spell-resistance checks, target swaps, creature range movement and musical-performance coexistence must be handled by the future gameplay engine, not permanent character stats.

## Still to extract and implement
Individual 1st–6th-level Bard song casting/effects pages (**165 songs**), song cost/MP, Metasong/Orchestrion rules, special duration exceptions, and verified Bard save/level-up runtime handling. Archetypes remain separate.

No Bard archetype or base Bard character save has been activated by this batch. `review.state=needs_review` and `automation=manual` are intentional.

Source links:
- https://finalfantasyd20.com/classes/core-classes/bard/
- https://finalfantasyd20.com/magic/spells-by-class/bard/
- Individual spell page links in `rules/classes/bard-jingle-mechanics.json`.
