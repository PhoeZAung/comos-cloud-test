# Hume standard-trait continuation

Source: https://finalfantasyd20.com/races/core-races/hume/
Archived HTML SHA-256: `4e3d6bff3b8aae3c990fd985984b8abd504fba5130f7376bacbf5aad7ad5d276`, verified against the local HTML and source catalog.

The standard-trait prose and staged definition were compared after the Beastmaster milestone. Hume remains the active integration item; this source review does not mark it playable or complete.

The required ability choice is +2 to one score at creation. The existing pool `ffd20:race:hume:pool:hume-2-racial-ability` is not yet supported by the racial-choice adapter. Medium size, humanoid/hume type, 30-foot speed and Common language are already staged. High-Intelligence starting languages are unrestricted in the source; they need a bounded way to record valid language text or a verified complete catalog, rather than silently treating a short existing race list as complete.

Bonus Feat grants one extra first-level feat. The current staged trait has no owned bonus-feat slot in the compiler; it must not be mistaken for the ordinary character feat slot. A manual extra slot can preserve the source without inventing external feat mechanics. Skilled grants one additional rank at every character level, including first level. It must be reflected consistently in preview, allocation validation, compilation, the sheet budget and save/reopen for supported classes; merely displaying the trait is insufficient.

Curiosity gives +4 Diplomacy only for gathering information. History/local Knowledge become class skills, or give +2 racial checks instead when already provided by the chosen class. This class-dependent branch needs explicit handling and bonus-type review alongside Integrated's +1 Bluff/Disguise/local Knowledge. Do not grant +4 to every Diplomacy check. Sociable's conditional retry stays a manual rule. Variants, all 32 alternates, companion/ancestry choices and favored rewards remain separate work and must stay guarded in the first standard-trait milestone.

The source includes an RP summary useful for later Half-Breed parent review. It labels Curiosity 4, Flexible Bonus Feat 4, Integrated 1, Skilled 4 and Sociable 1; languages cost 1, with the other baseline entries 0, for a printed total of 15. These are source-table values, not yet approved inherited-trait options. In particular, the printed 4-RP traits cannot be offered as ordinary inherited slots under Half-Breed's per-trait 3-RP rule. This table alone does not resolve all parent eligibility, category mapping or inheritance choices.

Next: implement and test the score choice, Skilled entitlement and separate bonus-feat slot across existing compiler paths, define high-Intelligence language recording, preserve Curiosity's conditional behavior and guard variants/alternates. Then run creation/edit/save/reopen checks before recording a deployed partial milestone.
