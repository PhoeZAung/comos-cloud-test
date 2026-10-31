# Aegyl Wing-Clipped and editable movement — implementation notes

Official rule: https://finalfantasyd20.com/races/base-races/aegyl/ (Alternate Racial Traits — Wing-Clipped).

- Replaces Emotionless, not the entire Base Speed trait.
- Base land speed stays 30 ft, fly speed becomes 20 ft (poor). The required DC 30 Fly check to ascend and wingspan restrictions remain in the racial description.
- +2 racial bonuses to Bluff, Climb and Diplomacy checks are stored in automatic racial skill bonus components, not as extra skill ranks. Existing skill-rank allocations are unaffected. On recompilation the racial bonus remains 2 (no duplicate).
- No new wizard or extra player choice.
- For normal Aegyl, the sheet seeds Fly 40 ft (poor); Wing-Clipped Aegyl seed 20 ft (poor).
- Every character's Identity section always displays land speed. A single Edit button at the top of Identity opens a compact popup grouped into Character details (Size, Languages, Senses) and Movement speeds (Land, Burrow, Climb, Fly, Swim). The overview avoids duplicate speed controls and extra racial descriptions.
- These are manual sheet fields and can be edited whenever appropriate. The first racial seed only happens if a speed field did not already exist on the saved sheet. Rebuilding from rules preserves the user's Land Speed and other movement-speed adjustments.
- Special automatic +4 Swim check bonus is **not inferred merely from entering a Swim speed**; its source/bonus type must be verified and recorded separately. Speed values do not themselves create attack or AC bonuses.
- Tests cover normal/Aegyl Wing-Clipped, identity/sheet rendering, skill ownership, save/reopen, preserved edits, and server-side numeric validation.

No class or archetype rules changed. Production signed-in create/save/reopen remains a separate manual check.

## Identity layout cleanup (2026-10-31)

Fly Maneuverability is no longer displayed or editable in the Identity popup. Existing saved maneuverability values and the official Aegyl flight wording are retained without destructive migration; the racial ability description remains the place to read conditional movement rules. The popup uses two tidy, mobile-responsive groups, with Land Speed at the top of the movement group and four alternate speeds in paired rows. Extra movement hints and Identity-only descriptions were removed. The card header contains the only Identity Edit action.
