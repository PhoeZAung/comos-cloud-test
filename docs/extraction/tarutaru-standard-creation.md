# Tarutaru standard-trait creation

Source: https://finalfantasyd20.com/races/core-races/tarutaru/
Archived HTML SHA-256: `4fb180445ce5ac79a6774d4474f9698371beb5bb158c01487f1d75f3ba072b34`, matching the source catalog.

Standard Tarutaru apply +2 Dexterity, +2 Intelligence, −2 Strength, Small humanoid/tarutaru identity, 20-foot land speed, Common/Lalafellan and low-light vision. Existing Small-size sheet math supplies AC, attacks and CMB/CMD modifiers; the source's explicit +4 Stealth is mapped separately once. Magic Expert applies +2 Knowledge (arcana) and Spellcraft.

Talented requires one specific Craft/Profession row plus its named specialty. Only that row receives +2, and the choice/specialty survive editing and reopening alongside manually entered misc bonuses. The optional high-Intelligence language chooser uses the source's seven names and positive Intelligence-modifier allowance.

Giant-only defensive training, magic/illusion save conditions, Stubborn's extra save, spell-resistance/dispel checks, defensive concentration and at-will Detect Magic resolution remain manual. Detect Magic stays a racial reference card, not a learned class spell or a source of MP. Variants, alternates, favored rewards and independent full review remain pending/guarded.

Validation: all 336 tests and the cloud build pass. Two Tarutaru regressions exercise six compilers, Small-size math, explicit Stealth, selected specialty, manual-only magic rules, choices, guards and preservation across edits. A 390 × 844 Chromium fixture created, edited, saved and reopened Dancer/Bard builds with Woodworking and Draconic, preserved manual Craft misc bonuses and saw no page errors. Evidence: `tarutaru-browser-validation.json`. Authentication was a local fixture, not production provider login.

Published in PR #14, merge `3a8c0f4863a30f72404a8fb260e273a7957c5f12`. Branch CI 41082956812 and main CI 41083247740 passed. Five public asset hashes match the tested build and health is ready. See `tarutaru-deployment-validation.json`.
