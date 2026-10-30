# Dracobaltian standard-trait creation

Source: https://finalfantasyd20.com/races/base-races/dracobaltian/
Archived HTML SHA-256: `078a4c3a34b1c92a66c52fdd56df386190ebc1eeed75544a117912aad35e7c33`.

Standard traits map +2 Strength, +2 Wisdom, −2 Intelligence, Medium humanoid/reptilian identity, land speed 40, Common/Draconese and +2 Perception. Six optional source languages (Draconic, Giant, Ignan, Numish, Seeq, Terran) use the positive Intelligence modifier after the racial penalty. Existing picks are retained; later initial-language entitlement history remains separate review work.

Leathery-skinned contributes one owned natural-armor point. Editing preserves manual adjustments, repeated saves do not accumulate it, and disabling/restoring the trait removes/adds only its own point.

The identity explicitly states natural blindness and Lesser Blindsight to 30 feet using hearing and smell, with Perception checks still required to notice creatures. Scent is also recorded. Full source cards remain visible. No ordinary sight, darkvision, automatic detection or automatic blinded-condition penalties are inferred. Detection, spell targeting/reading and sensory circumstances require manual adjudication. Stability's grounded bull-rush/trip CMD, Unsocialable's Diplomacy penalty against other races and natural claw primary/secondary handling remain manual. No permanent CMD/Diplomacy penalty, mechanical size increase or carrying modifier is inferred from moving on all fours.

Alternates are guarded; favored rewards and independent full review remain pending. Each class retains its existing progression boundaries, and complete core maneuver totals require the separate documented manual verification.

Validation: all 384 tests and the cloud build pass. Three regressions cover nine class adapters, exact identity/speed/sensory limits, conditional boundaries, natural-armor ownership/removal, post-penalty language count and alternate guards. Phone-sized Chromium fixtures created, edited, saved and reopened Dancer/Bard builds with Ignan, retained natural-blindness/Perception references and manual natural armor, and saw no page errors. See `dracobaltian-browser-validation.json`; fixture authentication is not production provider login.

Published in PR #28, merge `92e0b92ccb58d355d18fddc5a565474aa282f454`. Branch CI 41117914754 and main CI 41118526299 passed. Five public assets match and health reports database ready. See `dracobaltian-deployment-validation.json`. Work paused at this verified checkpoint at the user’s request; Garif remains queued.
