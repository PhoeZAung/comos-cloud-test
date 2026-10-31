# Tonkin — Dancing Lantern partial replacement

Source: https://finalfantasyd20.com/races/base-races/tonkin/ (Magical Racial Trait → Lantern Bearer, Alternate Racial Traits → Dancing Lantern). Existing extracted source remains `rules/staging/races/tonkin.race.json`; its review state is **not** changed.

## Exact source behavior

- Standard Lantern Bearer grants immunity to light-based blindness and dazzle, plus treatment as one level higher when determining effects of the Tonkin's light spells/effects. At Intelligence 10 or higher, it grants *torchlight* as an at-will spell-like ability.
- Alternate Dancing Lantern grants *Dancing Lantern* as an at-will spell-like ability **instead of** that torchlight ability. It **does not** replace the other Lantern Bearer benefits; it does not require a new spell-known slot or automatically consume MP. The alternate's text does not state an Intelligence prerequisite, so avoid inventing one.
- Rather than treating the extracted `replace / partial_feature / unresolved` as a full removal, the runtime translates **only the exact source operation ID and target** to a supported `modify / part_of_feature` operation. The race engine retains Lantern Bearer and adds the separate Dancing Lantern racial-ability card. A changed/unrecognized source mapping remains blocked.
- The modified Lantern Bearer card documents its continuing light-based defenses and the substituted spell-like ability. The Dancing Lantern card retains its source reference and at-will description. Neither spell-like effect is added to the class spell list, MP, or daily resource counters.
- Normal Tonkin retains the original Lantern Bearer wording and Intelligence-qualified torchlight. Other standard traits (including base speed, Limited Telepathy, and Unable to Cast), unrelated alternates and source descriptions are preserved. Disabled/replaced Lantern Bearer cannot also be modified, and saved alternate choices stay permanent.

## Boundaries

- Tonkin's language rules specify **understanding, not speaking**, Common and Tonberry. The general identity-language automation and racial sheet model do not yet fully represent that distinction. Do not turn these into spoken languages as part of this change.
- The Unable to Cast restriction for vocal spells, situational effects, spell-like ability resolution, variant heritages, and favored rewards stay manual or guarded. This update does not solve all Tonkin standard-race support.
- Validate through Node 24 tests, cloud build, and review of the selected/unselected race wizard and save/reopen fixtures. A real signed-in production create/save/reopen test remains a separate requirement **after** authorized publication.
- This work is a **draft checkpoint**, not a production release. No Railway action is needed.

Regressions: `tests/tonkin-dancing-lantern.test.mjs`.
