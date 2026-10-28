# Comos race extraction — Batch 07

**Source:** official FFd20 base-race rule pages (accessed 2026-10-27); not a complete independent review. Three per-race `.race.json` files, `needs_review / partial`, staging schema validation passed, import-ready validation intentionally failed.

| Race | Standard | Alternate | Heritages | Favored class entries |
|---|---:|---:|---:|---:|
| [Immortal](https://finalfantasyd20.com/races/base-races/immortal/) | 16 | 4 | 2 | 19 |
| [Lambkin](https://finalfantasyd20.com/races/base-races/lambkin/) | 11 | 6 | 0 | 13 |
| [Mandragora](https://finalfantasyd20.com/races/base-races/mandragora/) | 21 | 22 | 5 | 11 |

## Important preservation and blockers

- **Immortal:** Standard +2 goes to exactly one **chosen** ability (not all six). Its source prose says one variant heritage but its table lists **Ancients and Unlimited**; both are preserved. Ancients replaces the default racial vector with +2 INT, and Unlimited offers +2 WIS *or* +2 CHA. Both replace immunity to undeath with the table's separate immunity. **Magic Ineptitude says no MP pool**: Comos's Black Mage remains automated, so MP application for Immortal characters is **not source-correct without special handling**. Linking, Spirit-Tapped and anti-magic vulnerability require user/GM adjudication.
- **Lambkin:** Auto-Float persists except when dispelled or in an antimagic field; without it the character can only crawl 5 ft per movement action. Polyglot **replaces Magic Expert but alters, not removes, Languages**. Its extra chosen language is separate from Intelligence bonus languages. Other alternate selections that require one skill are manual.
- **Mandragora:** **Five** source-table heritages replace the default racial vector and the standard Photosynthesis SLA; each inherits all other non-replaced baseline traits. The table identifies the new ability but does not spell out usage details, so spell references are retained but unverified. **22** alternates include permanent either/or resistances, unusual natural attacks, conditional vulnerabilities and usage pools; no unverified source mechanics were invented. Fire damage x1.5 and unconsciousness/fast healing/status effects remain manual.

## Integration and what does not yet work

Comos's existing runtime race projector demotes unsupported automatic effects and conditional effects; this protects against applying unconditional bonuses from unreviewed descriptions, but it does **not** implement selection effects, resistance handling, MP restriction or the alternate heritage replacements. Such options remain visible as test descriptions, and unresolved replacements remain disabled. Class favored rewards must be reconciled against canonical class definitions before automatic application. Beastkin remains deferred; it is not in this batch.

The race files may be made visible for live testing with `(testing)` labels as requested previously, **not** approved for production-rules accuracy. See each file's `review.issues`. The existing three core races remain unchanged; Railway is not accessed.
