# Fell Rider first-level integration

Source: https://finalfantasyd20.com/classes/base-classes/chocobo-knight/archetypes/fell-rider/
Archived HTML SHA-256: `35b2eb09b5399eacf5a78d431ae8012fb3115d3650ba00e1f64bddd5d6504259`.

First-level Chocobo Knight creation can select Fell Rider. Brute Steed modifies the existing yellow chocobo reference with +2 Strength and −2 Dexterity for the mount, leaving the rider's scores, size, proficiencies, resources and feats unchanged. The card retains the parent mount instructions and source URL. Mount operation and these adjustments remain manual; no mount entity, rider bonus or mechanical mount-size increase is inferred from the flavor description.

The parent Commander’s Aura, Challenge, Mounted Combat feat, Fight as One and Supreme Overrun Limit Breaks remain. Supreme Charge is the later capstone replacement, not the first-level Supreme Overrun Limit Break. The definition retains seven source features, three total-value Fell Presence upgrades and six deferred later parent targets. Mounted overruns, the later Trample/fallback combat-feat choice, enemy fear penalties and Terror's save/immunity tracking require later adapters; levels above one and multiclassing stay guarded. Independent full review remains pending.

Validation: all 378 tests and the cloud build pass. Three Fell Rider regressions cover source hash/replacements/upgrades, unchanged rider scores/size/proficiencies, retained parent resources/feat/mount reference, correct card restoration/source, manual mount-note and resource/HP preservation, and forged later/incompatible choices. Phone-sized Chromium fixtures created, edited, saved and reopened Galka/Moogle Fell Riders, preserved archetype and shared Limit Break expenditure without healing current HP, rejected level-up and saw no page errors. See `fell-rider-browser-validation.json`; fixture authentication is not production provider login.
