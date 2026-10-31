# Genome: bounded standard-race source review (2026-10-31)

Archive `rules/staging/races/genome.race.json` is the authority. Its extracted definition remains `needs_review`, and this plan makes no claim of completed implementation.

## Source-backed standard rules
- Medium Humanoid (genome), 30-foot land speed, Common starting language.
- +2 DEX, +2 INT, −2 CHA.
- +4 racial Stealth; −2 Diplomacy. Technological Instinct makes Knowledge (Technology) a class skill and grants Technologist as a bonus feat (manual feat effect).
- Reborn Spirit: +2 racial saving throws **only against death spells/death-related effects** (conditional/manual).
- Dexterous Tail: can carry small things, does not use weapons; retrieve a small worn/stowed object as a swift action (manual).
- Ideal Vessel: +1 effective CLASS LEVEL **only for DCs of Genome class abilities**, not general class level or spell level (manual until integration can safely scope affected DC targets).
- Isolated: other humanoids start with attitude one step less favorable (manual per target).
- High-INT language list is open-ended; use bounded validated free-text storage if supported, not invented fixed source options.

## Explicit boundaries
- Alternate racial traits (including Ignorant Upbringing, Mystic Vessel and Resilient Soul), favored rewards, later level support and multiclass need dedicated reviews.
- For the initial batch allow standard first-level character creation only; manually represent conditional effects and bonus feat.
- Tests must cover save/reopen, stat/skill/identity mapping, allowed language count, manual feat visibility and rejection of unsupported variants.
- Keep all class/archetype implementation unchanged, and do not touch the other chat's `imports/active` checkpoint.
