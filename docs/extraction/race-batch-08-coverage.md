# Comos race extraction — Batch 08 (2026-10-27)

Source read: official FFd20 Moomba, Mutant and Nu Mou race pages, including their final gameplay table rows and favored-class options. Files are **staging** and **needs_review**, not independently approved.

| Race | Standard traits | Alternates | Heritages | Favored rewards | Extra options |
|---|---:|---:|---:|---:|---:|
| Moomba | 15 | 5 | 0 | 10 | 0 |
| Mutant | 12 | 6 | 0 | 11 | 212 |
| Nu Mou | 10 | 8 | 0 | 14 | 0 |

## Source evidence
- Moomba: https://finalfantasyd20.com/races/base-races/moomba/ — relevant source lines 6028–6082 (fully read).
- Mutant: https://finalfantasyd20.com/races/base-races/mutant/ — relevant source lines 6024–6282 (both 100-outcome tables verified).
- Nu Mou: https://finalfantasyd20.com/races/base-races/nu-mou/ — relevant source lines 6022–6078 (fully read).

## Blockers

- **Mutant:** Full 100-row ability table and 100-row optional appearance table extracted into two distinct manual choice pools (200 option records). Selecting a result does not automatically apply it. Their random advancement overrides standard every-4-level ability increases: automatic save should be blocked until this is implemented.
- **Moomba:** Vocal Failure Linguistics DC 15 + double spell level, deficient spoken language, and Climb land-speed modification are manual.
- **Nu Mou:** Sagacious +2 racial bonus on *two selected* Knowledge skills; Adept three selected 0-level black magic spell-like abilities, each 1/day. Neither should auto-award all options.
- Favored-class rewards remain manual. No race was independently approved.

## Validation
- Run `python comos-extraction-v2/tools/validate_rules.py <filename>` and custom integrity assertions. Do not claim ready without independent review.

## Continuation
- After this batch, continue the next indexed race starting after Nu Mou. Beastkin remains deferred from earlier batches.
