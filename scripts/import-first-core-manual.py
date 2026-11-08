"""Extract source cards, not automatic rules, for the first three core families.

The cache is restored separately; only structured, attributed rule sections enter
the application. Heading boundaries retain nested choices, prerequisites, tables
and replacement instructions verbatim. No feature level or replacement is guessed.
"""
import argparse, hashlib, json, re, runpy
from pathlib import Path
from urllib.parse import urlparse
helpers = runpy.run_path(str(Path(__file__).with_name('import-first-core-text.py')))
source, save, normalized = helpers['source'], helpers['save'], helpers['normalized']


def plain(text):
    text = re.sub(r'\[([^\]]+)\]\([^)]*\)', r'\1', text)
    return text.replace('\\*', '*').replace('*', '').replace('\\', '').strip()


def slug(text):
    return re.sub('[^a-z0-9]+', '-', plain(text).lower()).strip('-')


def chunks(text):
    matches = list(re.finditer(r'(?m)^(#{2,6}) (.+)\n', text))
    for match in matches:
        depth = len(match[1])
        end = next((m.start() for m in matches if m.start() > match.start() and len(m[1]) <= depth), len(text))
        yield depth, match[2], text[match.end():end].strip()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source-root', type=Path, default=Path('/workspace/.source-cache/ffd20/cache/pages'))
    root = parser.parse_args().source_root
    families = []
    # Preserve the site's order rather than alphabetical filesystem order.
    inventory = json.loads(Path('docs/imports/catalog.json').read_text())
    inventory = inventory['items']
    for name in ['archer', 'bard', 'beastmaster']:
        base = root / 'classes/core-classes' / name
        definition = json.loads(Path('rules/classes/' + name + '.class.json').read_text())
        family = {'id': definition['id'], 'name': definition['name'], 'pages': []}

        def feature_meta(feature):
            limits = {'shell-piercer', 'trueshot-arrow', 'sirens-song', 'soul-voice', 'bestial-defense', 'bestial-fury', 'limit-breaks'}
            return {'canonicalRuleId': feature['id'], 'atLevel': feature['atLevel'],
                    'activation': feature['activation'], 'limitBreak': feature['id'].split(':')[-1] in limits}

        def page(path, page_id, kind, label=None):
            text, provenance = source(path)
            title = label or re.search(r'(?m)^# (.+)', text)[1]
            start = re.search(r'(?m)^# .+\n', text).end()
            body = text[start:].strip()
            body = re.sub(r'^Table of Contents\s*', '', body).strip()
            first = re.search(r'(?m)^#{2,6} ', body)
            introduction = body[:first.start()].strip() if first else body
            result = {'id': page_id, 'name': plain(title), 'kind': kind, **provenance,
                      'introduction': introduction, 'references': [], 'cards': []}
            family['pages'].append(result)
            return text, result

        def card(result, title, description, **extra):
            clean = plain(title)
            card_id = result['id'] + ':section:' + slug(clean)
            assert not any(c['id'] == card_id for c in result['cards']), card_id
            result['cards'].append({'id': card_id, 'name': clean, 'description': description,
                                   'textSha256': hashlib.sha256(description.encode()).hexdigest(), **extra})

        class_text, parent = page(base / 'index.md', definition['id'], 'class')
        for depth, title, description in chunks(class_text):
            if depth == 3:
                name_key = slug(re.sub(r'\((?:Ex|Su|Sp)(?: or (?:Ex|Su|Sp))*\)', '', plain(title)))
                canonical = next((f for f in definition['data']['features'] if slug(f['name']) == name_key), None)
                extra = feature_meta(canonical) if canonical else {}
                if name_key == 'natural-savagery':
                    extra['sheetNote'] = 'Use the class table: Natural Savagery +1/+2/+3/+4/+5/+6 at levels 5/8/11/14/17/20. The source prose conflicts with this table; the table was selected for Cosmos.'
                card(parent, title, description, **extra)
            elif depth == 2 and title.startswith('Table:') and 'Archetype' not in title:
                parent['references'].append({'name': plain(title), 'description': description})
            elif depth == 2 and title == 'Favored Class Bonuses':
                parent['references'].append({'name': title, 'description': description})

        # Individual parent performances, Limit Breaks and Shared Senses can be
        # nested inside a larger source section. Also expose their verbatim
        # extracted blocks as individual cards; never force a whole performance
        # chapter into the Description of one selected performance.
        covered = {c.get('canonicalRuleId') for c in parent['cards']}
        for feature in definition['data']['features']:
            if feature['id'] not in covered:
                card(parent, feature['name'], feature['progressionDescription'], **feature_meta(feature))

        for entry in inventory:
            if entry.get('kind') != 'archetype' or entry.get('parentId') != definition['id']:
                continue
            arch_slug = entry['id'].split(':')[-1]
            text, result = page(base / 'archetypes' / arch_slug / 'index.md', entry['id'], 'archetype')
            for depth, title, description in chunks(text):
                if depth == 3:
                    if not description:
                        # A few pages nest a level-2 table directly below a
                        # level-3 feature. Retain its table and following prose.
                        after = text.split('### ' + title + '\n', 1)[1]
                        description = re.split(r'(?m)^### ', after, 1)[0].strip()
                    card(result, title, description)
                elif depth == 2:
                    result['references'].append({'name': plain(title), 'description': description})
            assert result['cards'], result['id']

        # Table rows are standalone options, including the complete prerequisite
        # column. Importing the whole table as one ability would hide choices.
        tail = 'archery-talents' if name == 'archer' else 'song-talents' if name == 'bard' else 'beastmaster-tricks'
        text, options = page(base / tail / 'index.md', definition['id'] + ':' + tail, 'options')
        canonical_options = json.loads(Path('rules/classes/' + name + '-talents.json').read_text())['options'] if name in ['archer', 'bard'] else []
        headers = []
        lines = text.splitlines()
        for line_index, line in enumerate(lines):
            if not line.startswith('|'):
                continue
            cells = [c.strip() for c in line.strip('|').split('|')]
            if len(cells) < 2 or all(re.fullmatch(r'[- :]+', c) for c in cells):
                continue
            if line_index + 1 < len(lines) and re.fullmatch(r'[| :\-]+', lines[line_index + 1]):
                headers = cells
                continue
            if plain(cells[0]).startswith('Asterisk Talents'):
                options['references'].append({'name': plain(cells[0]), 'description': cells[-1]})
                continue
            # Named rows, including their benefit and any prerequisite columns.
            canonical = next((o for o in canonical_options if normalized(o['name']) == normalized(cells[0])), None)
            extra = {'canonicalRuleId': canonical['id']} if canonical else {}
            card(options, cells[0], cells[-1], prerequisites=cells[1] if len(cells) > 2 else '', **extra)

        if name == 'beastmaster':
            text, companions = page(base / 'animal-companions/index.md', definition['id'] + ':companions', 'companions')
            for depth, title, description in chunks(text):
                if depth == 3:
                    card(companions, title, description)
                elif depth == 2:
                    # Keep group-specific starting requirements separate and visible.
                    intro = re.split(r'(?m)^### ', description)[0].strip()
                    if intro:
                        companions['references'].append({'name': plain(title), 'description': intro})
            for path in sorted((base / 'animal-companions').glob('*/index.md')):
                text, result = page(path, definition['id'] + ':companion-archetype:' + path.parent.name, 'companion-archetype')
                for depth, title, description in chunks(text):
                    if depth == 3:
                        card(result, title, description)
                    elif depth == 2:
                        result['references'].append({'name': plain(title), 'description': description})
                if not result['cards']:
                    card(result, result['name'], result.pop('introduction'))

        if name == 'bard':
            song_catalog = json.loads(Path('rules/classes/bard-songs.json').read_text())['songs']
            full_text = json.loads(Path('rules/classes/bard-full-text.json').read_text())['entries']
            result = {'id': definition['id'] + ':songs', 'name': 'Songs and jingles (levels 0–6)', 'kind': 'songs',
                      'url': 'https://finalfantasyd20.com/magic/spells-by-class/bard/',
                      'introduction': '', 'references': [], 'cards': []}
            family['pages'].append(result)
            for song in song_catalog:
                record = next(e for e in full_text if e['id'] == song['id'])
                text, provenance = source(root / urlparse(record['url']).path.strip('/') / 'index.md')
                # Include the full casting/effect block and description, not a summary.
                body = text[re.search(r'(?m)^# .+\n', text).end():].strip()
                body = re.sub(r'^Table of Contents\s*', '', body).strip()
                result['cards'].append({'id': song['id'], 'name': song['name'], 'level': song['level'],
                                        'description': body, 'textSha256': hashlib.sha256(body.encode()).hexdigest(), **provenance})

        families.append(family)
    output = {'schemaVersion': 'cosmos.manual-source.v1', 'mode': 'manual',
              'provenance': {'repository': 'PhoeZAung/ffd20-extractor', 'commit': 'c68a4c7ce8542be2be26f16eb78ff7424ff65c7b',
                             'archiveSha256': '1188bc35ba5888c8b85597103857955db5cb1621a2bf587ed70c9a602aac8347'},
              'families': families}
    save(Path('rules/classes/first-core-manual.json'), output)
    audit_path = Path('docs/extraction/first-three-core-source-audit.json')
    audit = json.loads(audit_path.read_text())
    pages = [p for f in families for p in f['pages']]
    for entry in audit['archetypes']:
        page = next(p for p in pages if p['id'] == entry['id'])
        entry.update(manualImportAvailable=True, manualSourceCards=len(page['cards']))
    audit['manualCatalog'] = {'file': 'rules/classes/first-core-manual.json', 'mode': 'manual',
                              'cards': sum(len(p['cards']) for p in pages), 'pages': len(pages),
                              'automaticClassOrArchetypeProgressionAdded': False}
    save(audit_path, audit)
    print(json.dumps({'families': len(families), 'archetypes': sum(p['kind'] == 'archetype' for f in families for p in f['pages']),
                      'cards': sum(len(p['cards']) for f in families for p in f['pages'])}))


if __name__ == '__main__':
    main()
