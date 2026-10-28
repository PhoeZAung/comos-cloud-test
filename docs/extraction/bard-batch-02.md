# Bard — core extraction batch 02 (progression + upgrade graph)
Official source: https://finalfantasyd20.com/classes/core-classes/bard/
Song talents: https://finalfantasyd20.com/classes/core-classes/bard/song-talents/

This pass used the new reusable class contract to stage the Bard. It contains **20 progression rows**, **35 feature identities**, **64 upgrade events**, **40 recorded player choice opportunities** and **21 listed archetypes**. Source-line locators accompany each table row, feature and upgrade.

## Upgrade chains (same feature, replacing values)
- Inspire Courage +1 at 1 → +2 at 5 → +3 at 11 → +4 at 17.
- Inspire Competence +2 at 3 → +3 at 7 → +4 at 11 → +5 at 15 → +6 at 19.
- Inspiration 1d6 at 3, +1d6 every two Bard levels, 9d6 at 19.
- Medley 2 songs at 4 → 3 at 8 → 4 at 12 → 5 at 16.
- Clear Mind 1 MP/hour at 5 → 2 at 10 → 3 at 15 → 4 at 20.
- Skilled Performer 5 Perform points at 7 → 10 at 13 → 15 at 19 (not general skill points).
- Jingles known 2 at 1, 3 at 5, 4 at 9, 5 at 13, 6 at 17.
- Bardic Performance changes its START action from standard to move at 7 and swift at 13; daily use rounds follow a formula at every level.
- Wide Audience radius/cone/multiple targets scales at 8,12,16,20; effects conditional on song type.
- Versatile Performance choice count increases at 6,10,14,18; old choices stay.
- Other persistent feature upgrades include Fascinate targets, Inspire Greatness targets, Inspire Heroics targets and Limit Break duration.

## Exact remaining work (NO game-save activation)
1. Extract the Bard Song Talents and Advanced Song Talents list, including prerequisites, asterisk behavior and advanced replacement choice pool.
2. Extract the complete official Bard song/jingle catalog, level gating, CHA-based song DC/MP bonus and maintained-song interactions. Song selection is currently **recorded but not selectable**.
3. Implement the actual Bard sheet/save/level-up adapter with performance rounds, ongoing effects, feat/skill choices, passive/conditional distinctions, and tests.
4. Extract Bard archetypes as separate replacement mappings in later batches, not one giant combined class.
5. Review nuanced performance and MP mechanics with source; all features remain manual and `review.state = needs_review`.

Bard appears as **disabled — extraction in progress** in the class selector, so the site cannot create an incomplete Bard character. The only enabled base classes remain Black Mage and Archer.
