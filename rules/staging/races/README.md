# FFd20 race files: available for live wizard testing

23 extracted races from batches 01–08 are kept as individual `.race.json` files. Every definition is still `needs_review` with `coverage: partial` and `importReady: false`. These files are explicitly listed in `rules/manifest.json` for **live user testing**, not for rules approval. The normal three races (Dwarf, Elvaan, Galka) are preserved.

The race dropdown shows staged races with “(testing)” and the wizard displays a review warning. The existing runtime projection applies only its supported unconditional effects. Unsupported effects remain manual; alternates with unresolved replacement mapping stay disabled. Heritage and race-dependent choices, cross-race Half-Breed inheritance, and favored-class bonuses still need review. Test character totals against official source pages before play; a saved character is not evidence of rule correctness.

**Beastkin remains excluded** because its complete source rules were unavailable. Class extraction for Astrologian and Berserker remains separate and not enabled. No Railway API or Railway connection is used.

## Batch 07: Immortal, Lambkin, Mandragora

These are visible for testing but still need manual review. **Immortal Magic Ineptitude prohibits a magic pool**, conflicting with Black Mage's MP calculation. The character builder blocks completing an Immortal/Black Mage character until the conflict is resolved. Lambkin's Float/status restrictions and Mandragora's five heritage spell substitutions are not automatically applied. See `docs/extraction/race-batch-07-coverage.md` and the per-race review issues.

## Batch 08 — Moomba, Mutant, Nu Mou

Moomba's spoken-language and vocal-component restrictions require manual checks. Mutant's 100-entry mutation table and 100-entry optional physical-feature table are kept as separate manual selection pools; its ability advancement overrides standard fourth-level bonuses and cannot be saved through the current Black Mage automation. Nu Mou's two selected Knowledge skill bonuses and three chosen 0-level spell-like abilities remain manual. All three are visible for testing, but none is independently reviewed. See `docs/extraction/race-batch-08-coverage.md`.
