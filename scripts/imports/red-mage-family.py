"""Rebuild source-backed Red Mage family data from the user's archived Markdown.
Usage: python3 scripts/imports/red-mage-family.py /absolute/cache/pages
No archive is needed to run the application or its normal build.
"""
from pathlib import Path
import sys,json,re,hashlib
root=Path(__file__).resolve().parents[2];cache=Path(sys.argv[1]);base=cache/'classes/core-classes/red-mage';CID='ffd20:class:red-mage'
def clean(s):return re.sub(r'\[([^]]+)\]\([^)]+\)',r'\1',s).replace('*','').replace('\xa0',' ').strip()
def slug(s):return re.sub('[^a-z0-9]+','-',clean(s).lower().replace('+',' plus ')).strip('-')
def title(s):return re.sub(r'\s*\((?:Ex|Su|Sp)[^)]*\)','',clean(s)).strip()
def norm(s):return re.sub('[^a-z0-9]+',' ',clean(s).lower()).strip()
def refs(section,source='main'):return [dict(sourceId=source,section=clean(section),locator=slug(section))]
def sections(s):return [(title(t),b.strip()) for t,b in re.findall(r'### ([^\n]+)\n(.*?)(?=\n### |\Z)',s,re.S)]
def source(p,key='main'):return dict(id=key,url=p.read_text().splitlines()[0][8:],title=next((clean(l[2:]) for l in p.read_text().splitlines() if l.startswith('# ')),p.parent.name),retrievedOn='2026-10-29',sourceKind='official_web',archiveSha256=hashlib.sha256(p.read_bytes()).hexdigest())
main=(base/'index.md').read_text();cp=root/'rules/classes/red-mage.class.json';c=json.loads(cp.read_text());d=c['data'];c['revision']=3;d['supportedLevels']=list(range(1,21));d['spellcasting']={'learningMode':'known','ability':'cha'}
c['sources']=[source(base/'index.md'),source(base/'ruby-talents/index.md','ruby-talents'),source(base/'ruby-arcana/index.md','ruby-arcana')]
c['review']={'state':'needs_review','coverage':'partial_manual','issues':[dict(path='/data',blocking=True,reason='Campaign sheet support: source-backed progression and replacement cards, not complete combat automation or independent full review. Complex subchoices, external prerequisites, companions, temporary effects, crafting and conditional modifiers are recorded manually on existing sheet entries.')]}
# Preserve previously shipped feature IDs; transcribe the remaining main features.
features={f['id']:f for f in d['features']};first={};
for row in d['levels']:
 for name in clean(row['special']).split(', '):first.setdefault(slug(re.sub(r'\s*(?:\([^)]*\)|\+\d+| I[VX]*).*','',name)),row['level'])
acquisition={'weapon-and-armor-proficiency':1,'ruby-arcana':3,'ruby-knowledge':3,'quick-cast':4,'spell-power':4,'clear-mind':5,'convert':5,'improved-spell-combat':7,'fighter-training':11,'jack-of-all-trades':11,'greater-spell-combat':14,'doublecast':15,'counterstrike':16,'1-mp-spell':19,'red-wizard':20}
for name,body in sections(main):
 key=slug(name)
 if key=='limit-breaks':continue
 fid=CID+':feature:'+key;level=features.get(fid,{}).get('atLevel',acquisition.get(key,1))
 features[fid]={**features.get(fid,{}),'id':fid,'name':name,'atLevel':level,'description':body,'activation':'active' if re.search(r'\baction\b|once per day|times per day',body,re.I) else 'passive','featureKind':'class_feature','automation':'manual','sourceRefs':refs(name)}
# Armor stages are separate canonical cards so archetypes can replace later stages only.
armor=features[CID+':feature:armored-mage'];paragraphs=armor['description'].split('\n\n');armor['description']=paragraphs[0]
for key,name,level,text in [('armored-mage-medium','Armored Mage (Medium)',7,'At 7th level, a red mage learns to use medium armor with no chance of spell failure for Red Mage spells.'),('armored-mage-shield','Armored Mage (Shield)',10,'At 10th level, a red mage learns to use heavy shields with no chance of spell failure for Red Mage spells.')]:features[CID+':feature:'+key]=dict(id=CID+':feature:'+key,name=name,atLevel=level,description=text,activation='passive',featureKind='class_feature',automation='manual',sourceRefs=refs('Armored Mage'))
d['features']=list(features.values());d['upgrades']=[]
def option_rows(path,kind):
 out=[]
 for l in path.read_text().splitlines():
  if not l.startswith('| ') or l.startswith('| ---'):continue
  cells=[x.strip() for x in l.strip('|').split('|')]
  if len(cells)<3 or cells[1]=='Prerequisites':continue
  name=title(cells[0]);req=clean(cells[1]);desc=cells[2];minimum=max([2 if kind=='talent' else 3]+[int(n) for n in re.findall(r'Red Mage (?:Level )?(\d+)',req,re.I)])
  previous=next((o for p in d['choicePools'] for o in p['options'] if o['id']==CID+':'+kind+':'+slug(name)),{})
  out.append({**previous,'id':CID+':'+kind+':'+slug(name),'name':name,'description':desc+'\nPrerequisites and any additional choices: '+req+'. Check these manually before selecting. Record weapon, feat, spell or other subchoices on the existing sheet entries.','repeatLimit':20 if re.search('more than once|multiple times',desc,re.I) else 1,'minimumLevel':minimum,'prerequisiteText':req,'featureIds':[],'selectable':True,'activation':previous.get('activation','mixed' if re.search('action|per day',desc,re.I) else 'passive'),'sourceRefs':refs(name,'ruby-talents' if kind=='talent' else 'ruby-arcana')})
  out[-1].pop('guardReason',None)
 return out
magery=d['choicePools'][0];magery['options']=[dict(id=CID+':magery:'+slug(n),name=n,description=desc,repeatLimit=2,minimumLevel=minimum,featureIds=[]) for n,minimum,desc in [('Quick Mind',1,'One additional swift or immediate action per round usable with Red Mage features/spells; the one swift-cast spell per round limit remains.'),('Spell Combat Expertise',1,'Reduce the Spell Combat attack penalty by 1 per selection.'),('Extra Quick Casts',5,'Gain one additional daily Quick Cast use per selection.'),('Ruby Knowledge Mastery',5,'Treat Intelligence and Wisdom as 2 higher for Ruby Knowledge per selection; apply only to that feature, manually.')]]
d['choicePools']=[magery,dict(id=CID+':pool:ruby-talents',name='Ruby Talent',options=option_rows(base/'ruby-talents/index.md','talent')),dict(id=CID+':pool:ruby-arcana',name='Ruby Arcana',options=option_rows(base/'ruby-arcana/index.md','arcana'))]
def event(key,level,pool):return dict(id=CID+':event:'+key+':'+str(level),type='choose',atClassLevel=level,poolIds=[CID+':pool:'+pool],count={'kind':'constant','value':1},sourceRefs=refs(pool))
# SET-value upgrades from the source table: one canonical card, never duplicate grants.
for f in d['features']:
 if f['name'].startswith('Armored Mage'):continue
 prior=None
 for row in d['levels']:
  label=next((part.strip() for part in row['special'].split(', ') if norm(part).startswith(norm(f['name']))),None)
  if label and row['level']>f['atLevel'] and label!=prior and any(ch.isdigit() for ch in label) or label and row['level']>f['atLevel'] and re.search(r' [IVX]+$',label) and label!=prior:
   d['upgrades'].append(dict(id=f['id']+':upgrade:'+str(row['level']),featureId=f['id'],atClassLevel=row['level'],changes={'progressionLabel':label},sourceRefs=[dict(sourceId='main',section='Table: Red Mage',locator='level-'+str(row['level']))]))
  if label:prior=label
d['events']=[dict(id=u['id']+':apply',type='upgrade_feature',atClassLevel=u['atClassLevel'],featureId=u['featureId'],upgradeId=u['id'],sourceRefs=u['sourceRefs']) for u in d['upgrades']]+[dict(id=f['id']+':grant',type='grant_feature',atClassLevel=f['atLevel'],featureId=f['id'],sourceRefs=f['sourceRefs']) for f in d['features']]+[event('red-magery',lv,'red-magery') for lv in range(1,21,4)]+[event('ruby-talent',lv,'ruby-talents') for lv in range(2,21,2)]+[event('ruby-arcana',lv,'ruby-arcana') for lv in range(3,21,3)]
# Spell index and individual archived mechanics, all source levels 0–6.
spells=[];level=None;index=cache/'magic/spells-by-class/red-mage/index.md'
for line in index.read_text().splitlines():
 if line.startswith('## Table:'):level=int(re.search(r'(\d+)(?:st|nd|rd|th)?-Level',line)[1])
 m=re.match(r'\| \[([^]]+)\]\((https?://[^)]+)\) \| (.*) \|',line)
 if not m or level is None:continue
 name,url,summary=m.groups();key=url.rstrip('/').split('/')[-1];path=cache/f'magic/spells/{key[0]}/{key}/index.md'
 desc=path.read_text().split('\n---\n',1)[-1].strip() if path.exists() else summary+'\nUse the linked official spell reference for full mechanics.'
 row=dict(id='ffd20:spell:'+key,name=name,level=level,mpCost=level,summary=summary,url=url,description=desc,automation='manual',archiveSha256=hashlib.sha256(path.read_bytes() if path.exists() else line.encode()).hexdigest(),sourceCoverage='individual' if path.exists() else 'index-summary')
 for label,keyname in [('School','school'),('Casting Time','castingTime'),('Range','range'),('Target','target'),('Duration','duration'),('Saving Throw','save'),('Spell Resistance','spellResistance')]:
  match=re.search(r'\*\*'+label+r'\*\*\s*([^\n]+)',desc)
  if match:row[keyname]=clean(match[1].split('**')[0]).rstrip(' ;')
 if not any(s['id']==row['id'] for s in spells):spells.append(row)
(root/'rules/classes/red-mage-spells.json').write_text(json.dumps(dict(source=str(index.relative_to(cache)),archiveSha256=hashlib.sha256(index.read_bytes()).hexdigest(),coverage='level-0-through-6',spells=spells),indent=2)+'\n')
# Explicit structural profiles supplement automatic replacement parsing.
profiles={'animist':{'mpMode':'diminished','classSkills':[s for s in d['classSkills'] if s not in ['intimidate','knowledge:planes']]+['repair','knowledge:engineering']},'mystic-knight':{'spellcasting':False,'hitDie':10,'fullBab':True,'proficiencies':['Simple weapons','Martial weapons','Knight swords','Light armor','Medium armor','Heavy armor','Shields except tower shields']},'red-warrior':{'spellcasting':False,'hitDie':10,'fullBab':True,'proficiencies':[p for p in d['proficiencies']]+['Heavy armor'],'arcanePoolMode':'full','arcanePoolBonus':2},'reserve-mage':{'spellcasting':False,'reserveCaster':True,'arcanePoolMode':'full','arcanePoolBonus':2},'ruby-wizard':{'proficiencies':['Simple weapons','Animated dolls','Power rod','Power staff'],'arcanePoolBonus':2},'ruby-fist':{'proficiencies':[p for p in d['proficiencies'] if p not in ['Martial weapons','Medium armor','Shields except tower shields']]},'spell-dancer':{'classSkills':[s for s in d['classSkills'] if s!='ride']+['perform:*']},'outfitter':{'classSkills':[s for s in d['classSkills'] if s!='knowledge:planes']+['disguise']}}
aliases={norm(f['name']):f['id'] for f in d['features']};aliases.update({'red magery':CID+':feature:red-magery','ruby talent':CID+':feature:ruby-talents','ruby arcana':CID+':feature:ruby-arcana','spell proficiency':CID+':feature:spell-proficiency','armored mage light':CID+':feature:armored-mage','armored mage medium':CID+':feature:armored-mage-medium','armored mage shield':CID+':feature:armored-mage-shield','weapon proficiency':CID+':feature:weapon-and-armor-proficiency','starting armor proficiencies':CID+':feature:weapon-and-armor-proficiency','weapon and armor proficiencies':CID+':feature:weapon-and-armor-proficiency'})
manifest_path=root/'rules/classes/archetypes/manifest.json';manifest=json.loads(manifest_path.read_text());manifest['archetypes']=[x for x in manifest['archetypes'] if not x['id'].startswith('ffd20:archetype:red-mage:')];arches=[];audit=[]
for path in sorted((base/'archetypes').glob('*/index.md')):
 key=path.parent.name;aid='ffd20:archetype:red-mage:'+key;archetype_name=source(path)['title'];data=dict(features=[],upgrades=[],replacements=[],choicePools=[],events=[],profile=profiles.get(key,{}),manualChoices=True,supportedLevels=list(range(1,21)));all_sections=sections(path.read_text())
 for heading,body in all_sections:
  hkey=slug(heading)
  if hkey=='class-skills':continue
  if hkey in ['ruby-arcana','ruby-talents'] and re.search('following .*complement|in addition|gains access|loses access',body,re.I):
   # Recommendations and extra options remain a source card; they do not remove the pool.
   at=3 if hkey=='ruby-arcana' else 2
  else:
   opening=clean(body[:500]);m=re.search(r'(?:[Aa]t|[Bb]eginning (?:of |at )?|[Ss]tarting at |of |reaches |[Aa]lso at )\s*(?:the )?(\d+)(?:st|nd|rd|th)\s*level',opening);at=int(m[1]) if m else 1
  if hkey in ['arcane-pool'] and key not in ['red-warrior','reserve-mage']:at=2
  fallback={'improved-reserve-combat':7,'greater-reserve-combat':14,'ranged-spell-combat':1,'unarmed-spellstrike':2,'augmentation':2,'talent-trees':2,'ruby-arcana':3,'ruby-talents':2,'mystic-swordplay':1,'blade-magic':1,'advanced-blade-magic':11,'shield-magery':3,'bulwark-style':3}
  if not m:
   at=fallback.get(hkey,at)
   opening_level=re.search(r'^(?:At|Starting|Beginning|Also at).*?(\d+)(?:st|nd|rd|th)',clean(body[:260]))
   if opening_level:at=int(opening_level[1])
  if hkey=='diminished-spellcasting':at=1
  if hkey=='spellblade-arcana':at=3
  at=max(1,min(20,at));fid=aid+':feature:'+hkey
  names=[]
  if hkey in ['limit-break','limit-breaks']:
   match=re.search(r'receives the Limit Breaks? \(([^)]+)\)',clean(body))
   names=[n.strip() for n in match[1].split(' and ')] if match else [heading]
  else:names=[heading]
  added=[]
  for fname in names:
   ffid=aid+':feature:'+slug(fname);added.append(ffid);data['features'].append(dict(id=ffid,name=fname,atLevel=at,description=body+'\nManual sheet handling: record any stated choice, companion, weapon, spell, feat, temporary modifier or condition on the existing sheet entries; this card does not apply global combat effects.',activation='active' if re.search(r'\baction\b|per day|per encounter',body,re.I) else 'passive',featureKind='limit_break' if hkey in ['limit-break','limit-breaks'] else 'class_feature',automation='manual',sourceRefs=refs(heading)))
  lines=[clean(l) for l in body.splitlines() if re.match(r'This (ability|limit break)|These abilities',l)]
  # Only explicit replacement/modification sentences create replacement rules.
  text=' '.join(l for l in lines if re.search(r'replac|modif|alter',l,re.I));ntext=norm(text)
  if hkey in ['shield-magery'] or key=='mystic-knight' and hkey=='red-magery':text='';ntext=''
  if 'may replace' in ntext:text='';ntext=''
  targets=[];remaining=ntext
  for label,target in sorted(aliases.items(),key=lambda x:-len(x[0])):
   if re.search(r'\b'+re.escape(label)+r'\b',remaining):
    if target not in targets:targets.append(target)
    remaining=re.sub(r'\b'+re.escape(label)+r'\b',' matched ',remaining)
  if hkey in ['limit-break','limit-breaks']:
   targets=[CID+':feature:dual-spellcasting',CID+':feature:flexibility']
   if key=='ruby-magister':targets=[CID+':feature:dual-spellcasting']
   if key=='paradigm-shifter':targets=[CID+':feature:flexibility']
   if key=='outfitter':data['profile']['chooseLimitBreakReplacement']=True;targets=[];text='';ntext=''
  # Armor component replacements keep the source light-armor ability when only later stages go.
  if CID+':feature:armored-mage' in targets:
   if re.search(r'armored mage \((medium|shield|light)\)',text,re.I):
    targets=[t for t in targets if t!=CID+':feature:armored-mage']
    for component in re.findall(r'armored mage \((medium|shield|light)\)',text,re.I):targets.append(CID+':feature:armored-mage'+({'medium':'-medium','shield':'-shield','light':''}[component.lower()]))
   else:targets+= [CID+':feature:armored-mage-medium',CID+':feature:armored-mage-shield']
  # A choice-slot replacement removes only the stated acquisition(s), not all future slots.
  target_events=[];choice_targets=[]
  for family,stem in [('red-magery','red magery'),('ruby-talents','ruby talent'),('ruby-arcana','ruby arcana')]:
   target=CID+':feature:'+family
   if target not in targets:continue
   if re.search(r'(?:one|a|the)?\s*'+stem+r's? (?:gained )?at',ntext):
    # Paragraph-specific acquisition list immediately following the named replacement.
    m=re.search(stem+r's? (?:gained )?at (.*)',text,re.I);tail=m[1].split('.')[0] if m else ''
    levels=[int(n) for n in re.findall(r'(\d+)(?:st|nd|rd|th)',tail)] or [at]
    for e in d['events']:
     if e['type']=='choose' and e['poolIds']==[CID+':pool:'+family] and e['atClassLevel'] in levels:target_events.append(e['id'])
    targets.remove(target);choice_targets.append(family)
   elif 'may replace' in ntext:targets.remove(target)
  if targets or target_events:
   data['replacements'].append(dict(id=aid+':replacement:'+hkey,atClassLevel=at,operation='replace',scope='whole_feature',resolution='resolved',targetFeatureIds=list(dict.fromkeys(targets)) or [CID+':feature:'+choice_targets[0]],targetEventIds=list(dict.fromkeys(target_events)),eventOnly=bool(target_events and not targets),replacementFeatureIds=added,sourceRefs=refs(heading),description=text or 'Source archetype Limit Break replacement.'))
  if text and not targets and not target_events and not re.search('may replace|red mageries|medium armor|weapon.*proficien',text,re.I):audit.append(dict(archetype=key,heading=heading,text=text))
 # Structural exceptions stated in the source which are not expressed as a replacement sentence.
 if key in ['mystic-knight','red-warrior','reserve-mage']:
  targets=[CID+':feature:spells',CID+':feature:cantrips'];data['replacements'].append(dict(id=aid+':replacement:noncasting',atClassLevel=1,operation='remove',scope='whole_feature',resolution='resolved',targetFeatureIds=targets,replacementFeatureIds=[],sourceRefs=refs('Mystic Swordplay' if key=='mystic-knight' else 'Arcane Pool' if key=='red-warrior' else 'Empowered Reserve Feats')))
 if key=='animist':
  conflict='Archived source conflict: the replacement summary removes Ruby Talents, while Augmentation says it replaces Ruby Arcana. This sheet suppresses both tracks and grants the stated even-level augmentations. Ask your GM which parent track to restore manually on the existing sheet before play.'
  audit.append(dict(archetype=key,heading='Augmentation',kind='source-conflict',text=conflict))
  for f in data['features']:
   if f['name']=='Augmentation':f['description']+='\n'+conflict
  # Apply the declared augmentation schedule; retain the conflicting source statements on its card.
  data['replacements'].append(dict(id=aid+':replacement:augmentation-track',atClassLevel=2,operation='remove',scope='whole_feature',resolution='resolved',targetFeatureIds=[CID+':feature:ruby-talents',CID+':feature:ruby-arcana'],replacementFeatureIds=[],sourceRefs=refs('Augmentation')))
 # Reuse the ordinary choice storage for native option lists; additional details stay on cards.
 def inline_options(section,minimum):
  body=next((b for h,b in all_sections if slug(h)==slug(section)), '')
  chunks=[];current=None
  for line in body.splitlines():
   textline=clean(line)
   if line.startswith('*') and ':' in textline:
    label,desc=textline.split(':',1)
    if len(label)<80 and label.lower() not in ['prerequisite','prerequisites','resonance']:
     if current:chunks.append(current)
     current=[title(label),desc.strip()];continue
   if current:current[1]+='\n'+line
  if current:chunks.append(current)
  result=[]
  for label,desc in chunks:
   gate=max([minimum]+[int(n) for n in re.findall(r'(?:at least |Red Mage (?:Level )?|must be )(\d+)(?:st|nd|rd|th)?',clean(desc),re.I)])
   result.append(dict(id=aid+':option:'+slug(section)+':'+slug(label),name=label,description=desc+'\nCheck stated prerequisites and record any extra choices/effects manually on the sheet.',minimumLevel=min(20,gate),repeatLimit=20 if re.search('multiple times|more than once',desc,re.I) else 1,featureIds=[],manualPrerequisites=True,sourceRefs=refs(section),url=source(path)['url']))
  return result
 def add_choices(section,levels,options=None,keyname=None):
  options=inline_options(section,min(levels)) if options is None else options
  if not options:return
  pool=aid+':pool:'+slug(keyname or section)
  data['choicePools'].append(dict(id=pool,name=section,options=options))
  data['events'] += [dict(id=aid+':event:'+slug(keyname or section)+':'+str(lv),type='choose',atClassLevel=lv,poolIds=[pool],count={'kind':'constant','value':1},sourceRefs=refs(section)) for lv in levels]
 # Extra archetype talents/arcana use the existing parent acquisition slots.
 for heading,body in all_sections:
  hkey=slug(heading)
  if hkey in ['ruby-arcana','spellblade-arcana','elemental-arcana','ruby-talents','talent-trees'] and not re.search('complement|loses access',body,re.I):
   extra=inline_options(heading,3 if 'arcana' in hkey else 2)
   if extra:data.setdefault('extraOptions',[]).append(dict(poolId=CID+':pool:'+('ruby-arcana' if 'arcana' in hkey else 'ruby-talents'),options=extra))
 if key=='animist':add_choices('Augmentation',list(range(2,21,2)))
 if key=='mystic-knight':
  alternate=inline_options('Red Magery',1);alternate.append(dict(id=CID+':magery:quick-mind',name='Quick Mind',description=magery['options'][0]['description'],minimumLevel=1,repeatLimit=2,featureIds=[]))
  for o in alternate:o['repeatLimit']=2
  data['profile']['mageryOptions']=alternate
  blade=inline_options('Blade Magic',1)+inline_options('Advanced Blade Magic',11)
  add_choices('Blade Magic',list(range(1,21,2)),blade)
 if key=='shield-mage':data['profile']['excludedMageryOptions']=['Ruby Knowledge Mastery']
 if key=='ruby-magister':add_choices('Spellblade',[15,17,19])
 if key=='paradigm-shifter':add_choices('Focus',[5])
 if key=='outfitter':
  add_choices('Garment Grid',[1]);add_choices('Garment Grid +',[5])
  opts=[dict(id=aid+':option:replace-finisher:'+slug(n),name='Replace '+n,description='Replace '+n+' with Illuminated Runway; retain the other standard Limit Break.',targetFeatureId=CID+':feature:'+slug(n),repeatLimit=1,minimumLevel=1,featureIds=[]) for n in ['Dual Spellcasting','Flexibility']]
  add_choices('Limit Break replacement',[1],opts)
 if key=='reserve-mage':
  reserve=[]
  for pp in sorted((cache/'feats/reserve-feats').glob('*/index.md')):
   sr=source(pp);reserve.append(dict(id=aid+':reserve-feat:'+pp.parent.name,name=sr['title'],url=sr['url'],archiveSha256=sr['archiveSha256'],description=pp.read_text().split('\n---\n',1)[-1],minimumLevel=1,repeatLimit=1,featureIds=[],manualPrerequisites=True,sourceRefs=refs('Reserve Mayhem')))
  add_choices('Reserve Mayhem',[1,5,9,13,17],reserve)
 if key=='ruby-archer':
  archer=json.loads((root/'rules/classes/archer-talents.json').read_text())['options'];opts=[]
  for o in archer:opts.append(dict(id=aid+':archery-talent:'+o['id'].split(':')[-1],name=o['name'],url='https://finalfantasyd20.com/classes/core-classes/archer/archery-talents/',description=o['description']+'\nCheck the source prerequisites manually.',minimumLevel=o.get('minimumLevel',1),repeatLimit=o.get('repeatLimit',1),featureIds=[],sourceRefs=refs('Archery Talents'),manualPrerequisites=True))
  add_choices('Archery Talents',[5,9,13,17],opts)
 if key=='ruby-wizard':
  advanced=dict(id=aid+':option:manual-advanced-mage-talent',name='Advanced Mage Talent (manual selection)',description='Choose a legal advanced Black Mage or White Mage talent and record its exact name and effects on the existing sheet entries.',minimumLevel=14,repeatLimit=2,featureIds=[],sourceRefs=refs('Advanced Mage Talents'),manualPrerequisites=True)
  add_choices('Advanced Mage Talents',[14,16],[advanced])
  option=dict(id=aid+':option:manual-mage-talent',name='Mage Talent (manual selection)',description='Choose a legal Black Mage or White Mage talent instead of this Ruby Talent. Record its exact name, prerequisites and effect on the existing sheet ability/feat entries.',minimumLevel=4,allowedLevels=[4,8,12,16,20],repeatLimit=5,featureIds=[],sourceRefs=refs('Mage Talents'),manualPrerequisites=True)
  data.setdefault('extraOptions',[]).append(dict(poolId=CID+':pool:ruby-talents',options=[option]))
 if key=='red-warrior':data['profile']['excludedOptionNames']=['Broad Study','Brutish Arcana','Concentrate','Empowered Magic','Familiar','Maximized Magic','Pool Strike','Pool Strike, Arcing','Pool Strike, Clinging','Quickened Magic','Reflection','Rod Mastery','Rod Wielder','Scroll Mastery','Silent Magic','Spell Blending','Spell Trickery','Still Magic','Wand Mastery','Wand Wielder']
 # Dependencies between recorded options can be checked generically; external requirements stay manual.
 all_options=[o for pool in d['choicePools'] for o in pool['options']]+[o for pool in data['choicePools'] for o in pool['options']]+[o for extra in data.get('extraOptions',[]) for o in extra['options']]
 if data['profile'].get('mageryOptions'):all_options+=data['profile']['mageryOptions']
 for option in all_options:
  requirement=option.get('prerequisiteText','')
  if not requirement:
   found=re.search(r'Prerequisites?:\s*(.*)',clean(option['description']),re.I)
   if found:requirement=found[1]
  if not requirement or ' or ' in requirement.lower():continue
  remaining=norm(requirement);needed=[]
  for other in sorted(all_options,key=lambda o:-len(o['name'])):
   name=norm(other['name'])
   if other['id']!=option['id'] and name and re.search(r'\b'+re.escape(name)+r'\b',remaining):
    needed.append(other['id']);remaining=re.sub(r'\b'+re.escape(name)+r'\b',' owned ',remaining)
  if needed:option['requiresOptionIds']=list(dict.fromkeys(needed))
 for pool in data['choicePools']:
  for option in pool['options']:
   if option['name']=='Ability Augmentation':option['repeatLimit']=5
 # Full raw source stays available as audit evidence; unsupported subchoices use existing notes.
 definition=dict(schemaVersion='comos.rules.v1',kind='archetype',id=aid,parentClassId=CID,name=archetype_name,sources=[source(path)],review=dict(state='needs_review',coverage='partial_manual',notes='Source-backed sheet replacements and existing chassis fields. Complex prerequisites/subchoices/effects are manual per user direction; no independent full review claimed.'),data=data)
 file='rules/classes/archetypes/red-mage-'+key+'.archetype.json';(root/file).write_text(json.dumps(definition,indent=2)+'\n');manifest['archetypes'].append(dict(id=aid,file=file,status='live',adapter='red-mage-progression'));arches.append(definition)
# Save extraction and an explicit audit for any nontrivial unmatched source statements.
(root/'docs/extraction/red-mage-family-replacement-audit.json').write_text(json.dumps(audit,indent=2)+'\n');manifest_path.write_text(json.dumps(manifest,indent=2)+'\n');d['archetypeIndex']=[dict(id=a['id'],name=a['name'],url=a['sources'][0]['url']) for a in arches];cp.write_text(json.dumps(c,indent=2)+'\n')
print(json.dumps(dict(features=len(d['features']),spells=len(spells),archetypes=len(arches),unmatchedStatements=len(audit))))
