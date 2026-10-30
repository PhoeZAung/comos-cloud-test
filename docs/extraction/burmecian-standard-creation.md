# Burmecian standard-trait creation

Source: https://finalfantasyd20.com/races/base-races/burmecian/
Archived HTML SHA-256: `31bd6541447460f19f24c3a7421085e700754500dfdcc52848c3ff71cb2e8151`.

Standard traits map +2 Dexterity, +2 Intelligence, −2 Charisma, Medium humanoid/burmecian identity, land speed 30, Common/Burmecian, darkvision 60 feet and +2 Perception. Seven optional languages use the source list (Draconic, Dwarven, Elvaan, Galkan, Giant, Goblin, Orc), bounded by positive Intelligence modifier.

Battle-Hardened contributes one tracked point to the CMD adjustment. Recompilation does not accumulate it, manual adjustments survive, and disabling/restoring the trait removes/adds only its own point. **The existing base CMD calculator omits BAB; full maneuver totals still require manual verification.** This batch validates the racial +1 difference rather than certifying the legacy base formula. The separate follow-up also records the CMB ability calculation: `docs/review/combat-maneuver-formulas.md`.

Quick Reactions grants an owned manual Improved Initiative feat card. Its numeric initiative effect must be applied manually until verified feat rules are integrated; manual initiative and edited feat notes survive saves. Natural Jumper's +4 applies only to jumping, so it is not added to all Acrobatics checks. Fear saves and natural claw primary/secondary attack handling remain manual, and no weapon entry is created. Cleyran/other variants and alternates are guarded; favored rewards and independent full review remain pending. Class progression retains each adapter's existing limits.

Validation: all 375 tests and the cloud build pass. Three regressions cover eight class adapters, source traits and conditional boundaries, CMD contribution/removal, manual initiative/feat-note preservation, source languages and variant guards. Phone-sized Chromium fixtures created, edited, saved and reopened Dancer/Bard builds with Draconic, retaining manual CMD/initiative without page errors. See `burmecian-browser-validation.json`; fixture authentication is not production provider login.
