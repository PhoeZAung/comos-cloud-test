# Batch 20 — Beastkin saved official page

Official source: https://finalfantasyd20.com/races/base-races/beastkin/ (user-provided MHT offline snapshot dated 2026-10-28; not committed). Source references in JSON use official HTML heading IDs and list item positions rather than fabricated numerical line numbers.

**Extracted:** 14 standard traits (including 5 basics), 10 alternates, 0 heritages, 9 favored-class rewards. No Black Mage favored-class reward in the original source.

Beastkin: +2 STR, +2 WIS, -2 INT, Medium Humanoid(beastkin), 30-ft speed, Common/Beastmen. Magical sleep immunity, +2 enfeebling/fear saves under conditions, +1 natural armor. Fleet-Footed gives Run and +2 initiative, Hunter gives Stealth/Survival class skills, Keen Senses +2 Perception; Sprinter adds 10 feet only during charge/run/withdraw; darkvision and low-light vision.

## Exact unresolved rules for later user-friendly TXT review

- Summary table calls Hunter 'Skill training' and Keen Senses 'Skill bonus'; detailed names are Hunter and Keen Senses and should not be duplicated.
- Alluring and Light Build replace ONLY one bonus in the racial score vector, not the entire vector. Partial replacement unsupported, disable until reviewed.
- Feral says -2 Intelligence when the base race already has -2 INT and does not name a replacement standard feature. Must clarify stacking and feature substitution.
- Loper grants +10 base speed as well as +10 for charge/run/withdraw and does not replace Sprinter. Requires precise movement composition; disabled for now.
- Fleet-Footed Run bonus feat and +2 initiative need sheet integration; do not silently award incorrect skill or ability modifiers.
- Cold/Heat Acclimated benefits depend on environmental conditions. Cold Acclimated adds Ice Resistance 5.
- Beastkin Immunities protects only from magical sleep and against enfeebling effects, Fearless against fear. These are not generic all-save bonuses.

## Alternate options and replacements

- **Alluring** — Replace only racial +2 WIS with +2 CHA; retain racial +2 STR and -2 INT. Partial ability-vector replacement. (replaces Ability Score Racial Traits.)
- **Civilized** — +2 Diplomacy and Sense Motive. (replaces Keen Senses.)
- **Cold Acclimated** — Immune to environmental cold damage at temperatures below 40°F; treat extreme cold below 0°F as ordinary cold, plus ice resistance 5. (replaces Natural Armor.)
- **Feral** — Always treat Perception and Stealth as class skills. Says starts with -2 Intelligence, already same as baseline; whether extra -2 INT applies and what is replaced are unstated. (replaces unspecified.)
- **Heat Acclimated** — Automatically succeed Fortitude saves to avoid heat dangers through severe heat conditions. (replaces Natural Armor.)
- **Influential** — +2 Diplomacy; +1 DC to enfeebling-school spells, not all spells. (replaces Keen Senses.)
- **Information Hunter** — +2 Diplomacy specifically to gather information; Knowledge (local) becomes a class skill. (replaces Keen Senses.)
- **Light Build** — Replace only +2 STR with +2 DEX; retain +2 WIS and -2 INT. Partial racial-vector replacement. (replaces Ability Score Racial Traits.)
- **Loper** — Base speed +10 ft (30 to 40), plus an additional +10 ft when charging, running or withdrawing. Does not list Sprinter as replaced; speed adapter required. (replaces Natural Armor.)
- **Scent** — Gain Scent instead of Low-Light Vision; retain Darkvision. (replaces Low-Light Vision.)

All 63 known races are now registered, 60 staged plus 3 original. All remain unapproved where `needs_review` applies; the normal wizard UI omits a blanket testing label but greys unsupported partial alternates. Final readable race-by-race trait review is to be prepared after source inventory work completes. No Railway access.
