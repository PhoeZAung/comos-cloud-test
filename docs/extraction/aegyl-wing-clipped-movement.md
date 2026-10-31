# Aegyl Wing-Clipped and editable movement — implementation notes

Official rule: https://finalfantasyd20.com/races/base-races/aegyl/ (Alternate Racial Traits — Wing-Clipped).

- Replaces Emotionless, not the entire Base Speed trait.
- Base land speed stays 30 ft, fly speed becomes 20 ft (poor). The required DC 30 Fly check to ascend and wingspan restrictions remain in the racial description.
- +2 racial bonuses to Bluff, Climb and Diplomacy checks are stored in automatic racial skill bonus components, not as extra skill ranks. Existing skill-rank allocations are unaffected. On recompilation the racial bonus remains 2 (no duplicate).
- No new wizard or extra player choice.
- For normal Aegyl, the sheet seeds Fly 40 ft (poor); Wing-Clipped Aegyl seed 20 ft (poor).
- Every character's Identity section always displays land speed. Available Burrow/Climb/Fly/Swim movement modes appear immediately under it. Clicking speed or the Identity edit button opens the shared popup and permits edits to every speed, including fly maneuverability.
- These are manual sheet fields and can be edited whenever appropriate. The first racial seed only happens if a speed field did not already exist on the saved sheet. Rebuilding from rules preserves the user's Land Speed and other movement-speed adjustments.
- Special automatic +4 Swim check bonus is **not inferred merely from entering a Swim speed**; its source/bonus type must be verified and recorded separately. Speed values do not themselves create attack or AC bonuses.
- Tests cover normal/Aegyl Wing-Clipped, identity/sheet rendering, skill ownership, save/reopen, preserved edits, and server-side numeric validation.

No class or archetype rules changed. Production signed-in create/save/reopen remains a separate manual check.
