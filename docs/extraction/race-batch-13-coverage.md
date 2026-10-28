# Comos FFd20 Race Extraction — Batch 13: First Beastman Tribes

**Official sources (retrieved October 27, 2026):**
- Amalj'aa: https://finalfantasyd20.com/races/beastman-tribes/amaljaa/
- Antica: https://finalfantasyd20.com/races/beastman-tribes/antica/
- Forgiven: https://finalfantasyd20.com/races/beastman-tribes/forgiven/

All racial traits, alternate replacements, variant heritage table entries and favored class options were collected into separate `comos.rules.v1` race files. Each trait has an official source section and line locator, with source wording summarized but numerical restrictions retained. The files are **needs_review / partial**, with standard traits initially active, alternates initially disabled, and uncertain partial replacements kept manual.

| Race | Standard | Alternate | Heritages | Favored-class options |
|---|---:|---:|---:|---:|
| Amalj'aa | 11 | 5 | 3 | 7 |
| Antica | 14 | 4 | 0 | 7 |
| Forgiven | 9 | 9 | 0 | 7 |
| **Total** | **34** | **18** | **3** | **21** |

## High-risk mechanics and review blockers

**Amalj'aa:** Stalker provides +2 Perception and Survival and declares both class skills. The three heritages exchange the racial stat vector and change the two skill specialties, but source text does not explicitly say whether the class-skill grants remain. Heritage replacement is therefore **manual/unresolved**, preventing automatic invalid substitutions. Fearless/Silent Hunter/Tempered compete for Bond to the Land, while Natural Attack/Poison Use compete for Stalker. Deathless Spirit's shadow resistance, HP exception on negative levels, and death/necromancy saves remain distinct.

**Antica:** Base 30-ft land movement and 15-ft burrowing movement are distinct. Antica understand Common and Antican but **do not speak**; default language effects intentionally do not auto-grant speech. Their Limited Telepathy communicates with beings sharing a language within 30 feet. `Unable to Cast` requires the Silent Spell or Telepathic Spellcaster feat for normal spellcasting; these feat requirements are not represented in the current Black Mage builder. Saving a new automated Antica Black Mage character must be blocked until eligible exceptions can be verified. Minesight has darkvision plus *negative* effects in bright light; the Scent alternate wholly replaces this feature. Frenzy duration/uses are manual.

**Forgiven:** Outsider (native), +2 Wisdom/+2 Charisma, triple holy/ice/lightning resistance 5, +2 racial Diplomacy/Perception, and once-daily `daylight` SLA are included. Six alternate mappings are partial or need clarification: some say `skilled` but the normal trait heading is `Skill Bonus`; `Scion of Mortality` removes only Celestial as an initial language and modifies native subtype without removing all languages or type; `Monstrous Heritage` requires ONE bite or two claws rather than both. Those are disabled via manual replacement status. The Summoner favored reward is non-linear: first DR 1/evil, +1/2 on further selections, max DR 10/evil; not safe as a flat automatic fractional reward.

## Validation and enablement

Staging schema: all three PASS. Targeted integrity test: 62 PASS. Strict import readiness: intentionally FAIL with unresolved mechanics, unreviewed rules and class references. The current Comos race adapter applies only supported unconditional effects. All conditional and custom mechanics are retained for manual review; not all are automated.

Independent race JSON, bundle, generator and test reports are included in the ZIP. Racial feat catalog and racial archetype definitions are separate families and intentionally excluded. This batch does not include the deferred Beastkin.
