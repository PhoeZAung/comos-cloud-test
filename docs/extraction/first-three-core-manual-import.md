# Archer, Bard and Beastmaster: manual source import

The November 8 manual pass imports the first three core class families in FFd20
website order, including all 48 archetypes. It adds a usable source browser to
the sheet, without representing unimplemented wizard progression as complete.

In **Abilities → + Ability → Add abilities**, choose **Manual source import**,
then the class and source. Read **Setup, progression and replacements**, find a
feature, choose its destination and optional usage maximum, and copy it to the
sheet. Songs copy to Spells. Description contains the full extracted text;
prerequisites and the Natural Savagery ruling appear separately under Effect.
Imported rows can be edited, grouped, spent and deleted like manual abilities.

| Class | Archetypes with source cards | Other manual content | Existing automatic wizard |
| --- | ---: | --- | --- |
| Archer | 15 / 15 | All parent feature sections, 1–20 table, all 52 archery talents | Base Archer 1–20; archetype replacements remain manual |
| Bard | 21 / 21 | All parent feature sections, 1–20 table, 44 song talents, all 176 songs/jingles at levels 0–6 | Base Bard level 1; later progression remains unimplemented |
| Beastmaster | 12 / 12 | All parent feature sections, 1–20 class and companion tables, 39 tricks, 35 companion species and four companion archetype pages | Existing bounded base Beastmaster level 1; later progression remains unimplemented |

The catalog contains **884 cards across 60 source pages/collections**. Nested
options remain inside their complete owning source section,
including their prerequisites, acquisition levels and replacement instructions.
Parent performances and named Limit Breaks are also available individually.
Companion group requirements and progression tables remain available in the
setup references. Reading a source or copying an ability does not establish that
a character meets its prerequisites or gains it at its current level.

This is a manual import milestone, **not full completion of the original guided
1–20 class/archetype integration**. Exact replacement maps, class profiles,
level-gated choice adapters and their save/level-up tests remain future work.
Combat conditions, maintained songs, companion effects and subchoices remain
manual. No class/archetype manifest flags or supported-level guards were changed.

## Source fidelity and decisions

The saved Markdown was recovered from `PhoeZAung/ffd20-extractor` branch
`transfer/potato-local`, commit `c68a4c7ce8542be2be26f16eb78ff7424ff65c7b`.
All 12 parts and the reconstructed ZIP were verified. ZIP SHA-256:
`1188bc35ba5888c8b85597103857955db5cb1621a2bf587ed70c9a602aac8347`.
The archive's installer was not executed; databases and application checkpoints
were not restored into Cosmos. Readable reference pages were restored outside the
application at `/workspace/.source-cache/ffd20/cache/pages`.

Every source page records its URL, archive timestamp and Markdown SHA-256.
Every card has a separate SHA-256 of its exact stored text. These Markdown hashes
are distinct from the original HTML inventory hashes. The structured catalog and
audit are committed; the bulk raw archive is not.

The existing 71 Archer/Bard/Beastmaster feature descriptions and 96 Archer/Bard
talent descriptions were refreshed from the archive. All 176 individual Bard
song descriptions are preserved; the existing level-1 wizard uses its 41 supported
options with full descriptions. Runtime companion details and Archer upgrade
values are retained as separate sheet notes. Personal description edits remain
preserved by the existing save adapter.

For **Beastmaster Natural Savagery**, the user selected the class table:
**+1/+2/+3/+4/+5/+6 at levels 5/8/11/14/17/20**. The original conflicting prose is
retained verbatim, with the ruling shown separately. The level-17/20 animal-focus
interaction remains a manual ruling.

## Reproduction and validation

With the separate source cache restored:

```sh
python scripts/import-first-core-text.py --source-root /workspace/.source-cache/ffd20/cache/pages
python scripts/import-first-core-manual.py --source-root /workspace/.source-cache/ffd20/cache/pages
node scripts/generate-first-core-manual.mjs
node scripts/generate-class-catalog.mjs
node scripts/generate-archer.mjs
node scripts/generate-bard.mjs
```

Normal builds validate and regenerate the committed manual projection without
requiring the raw cache or access to FFd20. `first-three-core-source-audit.json`
records source coverage separately from automatic mapping coverage.

`tests/first-core-manual.test.mjs` checks all 48 archetype imports, catalog coverage
and hashes, full text, late songs, companion advancements, prerequisite notes,
the chosen table, long editable descriptions, duplicate detection, atomic
validation and authenticated owner save/reopen with revision protection.

`scripts/check-first-core-manual-browser.mjs` exercises the built modules in a
local fixture: selectors, copy/save/reopen, usage maxima, duplicate protection,
a level-6 song, long-description editing, table rendering and 1024/390/320-pixel
layouts. This is local browser evidence; production sign-in and deployment are
left to the user.
