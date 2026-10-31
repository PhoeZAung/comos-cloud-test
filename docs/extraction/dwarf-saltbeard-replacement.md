# Dwarf Saltbeard — verified partial trait modification

Official FFd20 Dwarf race page (Alternate Racial Traits, Saltbeard):
https://finalfantasyd20.com/races/core-races/dwarf/

The printed rule **replaces Defensive Training, Hatred and Stonecunning**. It does **not replace Greed**: it modifies Greed's target from goods containing precious metals/gemstones to **any treasure found in or under water**. The +2 Appraise racial bonus therefore remains situational, not an always-active skill modifier. Saltbeard also grants +2 Profession (sailor) / Survival at sea and +1 attack / +2 dodge AC versus aquatic or water subtype creatures; these stay on the rule card for manual adjudication, not flat statistics.

The canonical source already expresses two operations for Saltbeard: a resolved whole-feature replacement and a manual part-of-feature Greed modification. This patch whitelists exactly that operation by source ID and schema in the shared replacement engine, retargets Greed's conditional description/effect to underwater treasure on an immutable **runtime projection**, and leaves the original source file untouched. The player does not need a wizard picker.

Conflicts with other Greed replacements, existing feature disabling, and overlap with Defensive Training/Hatred/Stonecunning replacements remain invalid. Other partial/unresolved operations remain blocked until independently verified. Save/reopen and absence of unconditional AC are tested; production signed-in verification is not claimed.
