# Score and allocation wizard

Creation: Identity → Race → Class → Class choices → Spells → Ability scores → Skills → Feats → Review.

Original scores remain editable without racial adjustments baked into the box. A separate race line and total show the effective value. Standard array/rolled score tiles can be dragged or selected by tap/keyboard, followed by an ability box; assignment swaps preserve each roll once. Manual/point-buy modes never display stale roll tiles. Cantrips and the first three initial spell selections belong on Spells; the final score screen shows the complete 3 + starting INT modifier first-level spell allowance for Black Mage, without cantrips.

Skill allocations use effective INT, minimum one rank per level, the class budget, the character-level rank cap, one trained class-skill +3 and automatic unconditional racial bonuses. All points must be allocated before committing a wizard build. Level up preserves prior ranks and uses the next budget; existing unallocated legacy ranks can be distributed at that time. The server validates the final allocation. Feat slots are reserved at odd character levels, starting at 1; a curated feat catalog is still pending.

The sheet up-arrow opens a confirmation dialog. Level up starts with the last supported class, includes +1 ability score only at multiples of four, then animated before/after HP and MP totals and a separate Skills screen. Current resources are not refilled. The MP table matches the official FFd20 MP System. Maximum first d6 and later 4 base HP remain the selected project policy.

## Boundaries still requiring source data

Only base Black Mage currently has a validated runtime adapter. The twenty discovered archetypes remain visible for reference but unavailable for automatic application: their exact replacement events, casting overrides and dependency graphs have not been verified. No arbitrary class is represented as a functioning multiclass option. Multiclass advancement needs per-class level history, independent progression/casting/learning tables, unioned proficiencies/class skills, summed MP pools and archetype-specific replacements. Source casting-ability mappings alone do not provide this information.

Requested casting mapping for future adapters: INT — Black Mage, Blue Mage, Time Mage; WIS — Astrologian, Druid, Geomancer, Ninja, White Mage; CHA — Bard, Dark Knight, Holy Knight, Illusionist, Red Mage, Necromancer, Summoner. Learning counts must come from each class, not a universal 3 + modifier assumption.
