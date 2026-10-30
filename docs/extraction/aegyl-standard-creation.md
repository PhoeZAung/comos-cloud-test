# Aegyl standard-trait creation

Source: https://finalfantasyd20.com/races/base-races/aegyl/
Archived HTML SHA-256: `cc8f9dd0d8ddd491ced3923ae4323faa6afd312250d019b1d3486e3812e6f39e`.

Standard Aegyl map +2 Dexterity, +2 Wisdom, −2 Charisma, Medium humanoid/aegyl identity, 30-foot land speed, Common/Aegyllan, low-light vision and +2 Perception. No Constitution penalty is inferred from the flavor text. Optional high-Intelligence languages use the source's seven choices: Draconic, Dwarven, Elvaan, Galkan, Giant, Goblin and Orc, bounded by the positive Intelligence modifier.

Eternal Hope has a one-use daily counter with manual reset. Spending it does not roll or resolve the natural-1 reroll; the source requires using the second result. Recompilation preserves expenditure, and a generic rest does not reset it. The card can be restored through the existing ability library.

Flight remains a source reference: 40 feet, poor maneuverability, enough clearance for fully extended wings approximately 12 feet wide. It does not replace land speed or automatically permit flying. Wind/lightning resistance 5, fear/despair and illusion saves, and Emotionless's Diplomacy penalty against other races remain manual. No global Diplomacy penalty, saving throw bonus or damage reduction is inferred. Alternates, favored rewards and independent full review remain guarded/pending. Each class adapter retains its own progression limits.

All 354 tests and the cloud build pass. Three Aegyl regressions exercise seven class adapters, conditional-effect boundaries, counter expenditure/removal/restoration, optional language choices and guards. A 390 × 844 Chromium fixture created, edited, saved and reopened Dancer and Bard builds, retaining Draconic, manual initiative and spent Eternal Hope with no page errors. Evidence: `aegyl-browser-validation.json`. Authentication was a local fixture, not production provider login.

Published in PR #18, merge `4e8eee3a8318554fc0a05c8907800b52fea1615c`. Branch CI 41107188804 and main CI 41107301557 passed. Five public rule assets match the tested build and health reports database ready. See `aegyl-deployment-validation.json`.
