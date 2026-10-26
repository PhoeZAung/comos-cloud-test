# Sheet layout and weapon receipts

## Layout

The main combat group uses a heart. Its Combat section has sword/shield controls for Offense and Defense. Armor class is centered. Initiative is a rollable Offense metric; BAB is editable under Recovery settings and still participates in attack calculations. Speed and proficiencies belong to Character (speed under Identity). HP/MP star preferences persist on the character and show the same editable resources under Favorites.

Ability categories use a four-quadrant circle with upright text, entry counts and local SVGs: Active/lightning, Passive/leaf, Racial/DNA, Feats/medal. Only the selected collection renders. No new framework, remote icons or background effects were added.

## Weapon rolls

Name and Attack Type appear together in the weapon editor. Types: Melee, Ranged, Touch attack, Ranged touch, CMB. A weapon uses the corresponding sheet attack total plus weapon misc. Ability Mod defaults to “Use attack type”; an explicit stat replaces the attack type's existing ability contribution, avoiding double counting. Legacy uppercase STR/DEX values are recognized. For the legacy CMB formula, an override replaces the STR contribution and retains its existing DEX contribution.

One Roll action creates one authenticated server receipt containing the d20 attack and damage. The server reads the saved weapon and checks its revision; clients cannot supply the weapon's attack bonus or damage result. Retrying the same request ID returns the same stored result without rolling or sending again. Other users cannot roll this character; normal owner/admin and Origin checks remain in place.

Damage is the full normal damage expression, including explicit flat bonuses (or `{STR}`, etc.). No hidden ability bonus is added. Put flaming, sneak attack or other damage that should not multiply in **Extra damage**. Damage and extra damage support the existing bounded typed-dice parser. Invalid/prose damage is reported, never silently replaced with a guessed expression.

A natural d20 meeting the weapon's configured range (default 20) produces a separate d20 confirmation with the same bonus, and independently rolled critical damage labeled **if confirmed**. The base dice and flat bonuses roll once per multiplier; Extra damage rolls once. Multi-dice base terms require splitting non-multiplied dice into Extra damage before automatic critical damage is available. CMB checks do not generate weapon critical hits. The sheet has no target AC, immunity or situational-effect model, so it does not assert a confirmed critical. Lower-than-20 threats also require the initial attack to hit.

Rules reference: https://finalfantasyd20.com/system-rules/pathfinder-basics/ (Critical Damage). Conditional, class-specific multipliers and effects remain explicit/manual.

Discord receives one combined receipt through the existing relay when enabled, with mention suppression and stored delivery status. A failed delivery keeps the rolled result. No live test message was sent during this update; actual channel receipt remains a user check.

## Verification

130 tests pass, including attack types, uppercase legacy abilities, no double modifier, natural 1/20, threat ranges, confirmation, flat-bonus multiplication, extra dice once, ambiguous damage handling, persisted resources, HTTP ownership/Origin/revision checks, receipt replay and mocked Discord delivery. The isolated sheet stylesheet stays below 18 KB and retains its existing theme support. Synthetic browser QA verified persisted HP/MP favorites, Recovery BAB fields, the weapon editor, a combined natural-20/confirmation/damage receipt, and all four categories. Ability/defense/offense layouts had no horizontal overflow at 320 px, and desktop was checked at 1000 px.

Phone checks:
1. Star HP and MP; open Favorites and adjust a resource, then reload.
2. Open heart → Combat. Confirm speed/proficiencies are under Character, BAB under Recovery settings, and initiative rolls from sword/Offense.
3. Edit a test weapon. Pick an attack type and inspect Ability Mod; roll it and compare its bonus with the matching sheet attack.
4. Verify one Discord receipt includes attack and damage. On a threat, compare the initial attack and confirmation with target AC before applying the conditional critical damage.
5. Open Abilities and tap all four quadrants. Confirm each shows its own entries and the selected state is visible.
