"""Extract Monk family from the user's archived primary sources. No network or dependencies.
Usage: python3 scripts/imports/monk-family.py /absolute/archive/pages
Complex combat, equipment, spell and feat subchoices remain manual reference cards.
"""
from pathlib import Path
import re,json,hashlib,sys
root=Path(__file__).resolve().parents[2];cache=Path(sys.argv[1]);base=cache/'classes/core-classes/monk';CID='ffd20:class:monk'
def clean(s):return re.sub(r'\[([^]]+)\]\([^)]+\)',r'\1',s).replace('*','').replace('\xa0',' ').strip()
def slug(s):return re.sub('[^a-z0-9]+','-',clean(s).lower().replace('+',' plus ')).strip('-')
def title(s):return re.sub(r'\s*\((?:Ex|Su|Sp)[^)]*\)','',clean(s)).strip()
def norm(s):return re.sub('[^a-z0-9]+',' ',clean(s).lower()).strip()
def sections(s):return [(title(h),b.strip()) for h,b in re.findall(r'### ([^\n]+)\n(.*?)(?=\n### |\Z)',s,re.S)]
def source(p,key='main'):return dict(id=key,url=p.read_text().splitlines()[0][8:],title=next(clean(l[2:]) for l in p.read_text().splitlines() if l.startswith('# ')),sourceKind='official_web',retrievedOn='2026-10-29',archiveSha256=hashlib.sha256(p.read_bytes()).hexdigest())
def refs(h,s='main'):return [dict(sourceId=s,section=clean(h),locator=slug(h))]
manual='Manual sheet handling: check the source prerequisites, armor/load restrictions, action timing and conditional effects. Record any feat, weapon, ability, spell, style or other subchoice on the existing sheet entries; this card does not apply global combat modifiers.'
def feature(fid,name,lv,body,kind='class_feature'):return dict(id=fid,name=name,atLevel=lv,description=body+'\n'+manual,activation='mixed' if re.search(r'\baction\b|per day|ki point',body,re.I) else 'passive',featureKind=kind,automation='manual',sourceRefs=refs(name))
cp=root/'rules/classes/monk.class.json';c=json.loads(cp.read_text());d=c['data'];main=(base/'index.md').read_text();mainsections=sections(main)
c['revision']=2;c['sources']=[source(base/'index.md'),source(base/'monk-talents/index.md','monk-talents'),source(base/'blitz-techniques/index.md','blitz-techniques')]
inventory=json.loads((root/'docs/imports/catalog.json').read_text());c['sources'][0]['catalogSha256']=next(item['source']['sha256'] for item in inventory['items'] if item['id']==CID)
c['review']=dict(state='needs_review',coverage='partial_manual',issues=[dict(path='/data',blocking=True,reason='Level 1–20 campaign sheet support; combat effects, external prerequisites, styles, spells, feat/equipment subchoices and independent full review remain manual. Bodybuilding HP and owned resource maximums use existing fields. See family source audit for interpretation notes.')])
d.pop('deferredFeatureSections',None);d['supportedLevels']=list(range(1,21));d['spellcasting']=dict(learningMode='none');d['choicePools']=[];d['features']=[];d['upgrades']=[];d['events']=[];d['resources']=[]
# Existing parent IDs and actual source table rows are preserved.
rows=[]
for line in main.splitlines():
 cells=[x.strip() for x in line.strip('|').split('|')]
 if line.startswith('| ') and re.match(r'^\d+(?:st|nd|rd|th)$',cells[0]) and len(cells)>=6:
  lv=int(re.match(r'\d+',cells[0])[0]);nums=[int(re.match(r'\+?(\d+)',x)[1]) for x in cells[1:5]];bab=nums[0]
  rows.append(dict(level=lv,bab=bab,fort=nums[1],ref=nums[2],will=nums[3],iterativeAttacks=list(range(bab,0,-5)),baseMp=0,maxSpellLevel=0,special=clean(cells[5]),sourceRefs=refs('Table: Monk')))
assert len(rows)==20;d['levels']=rows
first={}
for row in rows:
 for label in row['special'].split(', '):
  label=re.sub(r'\s*\([^)]*\).*','',label);first.setdefault(norm(label),row['level'])
for name,body in mainsections:
 if name=='Limit Breaks':
  for lb,desc in re.findall(r'^\*([^\n]+?):\*\s*(.*?)(?=\n\n\*|\Z)',body,re.S|re.M):
   lb=title(lb);d['features'].append(feature(CID+':feature:'+slug(lb),lb,1,desc,'limit_break'))
  continue
 lv=first.get(norm(name),first.get(norm(name).rstrip('s'),1));d['features'].append(feature(CID+':feature:'+slug(name),name,lv,body))
# Singular labels in the progression table map to plural heading cards.
for name,lv in [('Monk Talents',2),('Blitz Techniques',3)]:next(f for f in d['features'] if f['name']==name)['atLevel']=lv
# Chakra is granted with Ki Pool, not one of the six selected blitz techniques.
ki=next(b for h,b in mainsections if h=='Ki Pool');chakra=re.search(r'\*Chakra[^\n]*?:\s*(.*?)(?=\n\n|\Z)',ki,re.S)
d['features'].append(feature(CID+':feature:chakra','Chakra',2,chakra[1] if chakra else ki));d['features'][-1]['sourceRefs']=refs('Ki Pool')
for f in d['features']:
 prev=None
 for row in rows:
  if row['level']<f['atLevel']:continue
  labels=[x for x in re.split(r', (?=\[|[A-Z])',row['special']) if norm(x).startswith(norm(f['name']))]
  # Description retains all scaling; a table label records source-backed SET state.
  if not labels:continue
  label=labels[0]
  if row['level']==f['atLevel']:f['initialState']={'sourceProgression':label};prev=label
  elif label!=prev:
   d['upgrades'].append(dict(id=f['id']+':upgrade:'+str(row['level']),featureId=f['id'],atClassLevel=row['level'],changes={'sourceProgression':label},sourceRefs=refs('Table: Monk')));prev=label

def table_options(p,kind,minimum):
 out=[]
 for line in p.read_text().splitlines():
  cells=[x.strip() for x in line.strip('|').split('|')]
  if not line.startswith('| ') or len(cells)!=3 or not cells[0] or cells[0].startswith('---') or cells[0] in ['Monk Talents','Blitz Techniques']:continue
  name=title(cells[0]);req=clean(cells[1]);body=cells[2];rank_levels=[int(n) for n in re.findall(r'Monk (?:Level )?(\d+)',req,re.I)];gate=max(minimum,min(rank_levels) if rank_levels else minimum)
  repeat=1
  if 'up to three times' in body:repeat=3
  elif 'up to two times' in body:repeat=2
  elif re.search('multiple times|more than once',body,re.I):repeat=20
  out.append(dict(id=CID+':'+kind+':'+slug(name),name=name,description=body+'\nPrerequisites: '+req+'.\n'+manual,prerequisiteText=req,minimumLevel=gate,repeatLimit=repeat,featureIds=[],sourceRefs=refs(name,p.parent.name),url=source(p)['url'],manualPrerequisites=True))
  if len(rank_levels)>1:out[-1]['rankMinimumLevels']=sorted(rank_levels)
 return out
for key,name,kind,minimum,levels in [('monk-talents','Monk Talent','talent',2,range(2,21,2)),('blitz-techniques','Blitz Technique','blitz',3,range(3,21,3))]:
 pool=CID+':pool:'+key;d['choicePools'].append(dict(id=pool,name=name,options=table_options(base/key/'index.md',kind,minimum)))
 for lv in levels:d['events'].append(dict(id=CID+':event:'+key+':'+str(lv),type='choose',atClassLevel=lv,poolIds=[pool],count={'kind':'constant','value':1},sourceRefs=refs(key,key)))
for f in d['features']:d['events'].append(dict(id=f['id']+':grant',type='grant_feature',featureId=f['id'],atClassLevel=f['atLevel'],sourceRefs=f['sourceRefs']))
for u in d['upgrades']:d['events'].append(dict(id=u['id']+':event',type='upgrade_feature',featureId=u['featureId'],upgradeId=u['id'],atClassLevel=u['atClassLevel'],sourceRefs=u['sourceRefs']))
d['resources']=[dict(featureId=CID+':feature:ki-pool',perLevel=.5,ability='con',minimum=0),dict(featureId=CID+':feature:boost',base=3,ability='con',minimum=0),dict(featureId=CID+':feature:formless-strikes',byLevel=[0]*9+[1]*7+[2]*4,minimum=0)]
features={norm(f['name']):f for f in d['features']};aliases={**{k:f['id'] for k,f in features.items()},'monk talent':CID+':feature:monk-talents','blitz technique':CID+':feature:blitz-techniques'};poolroots={'monk talents':'monk-talents','monk talent':'monk-talents','blitz techniques':'blitz-techniques','blitz technique':'blitz-techniques'}
# Simple recorded prerequisite dependencies; requirements outside these lists remain manual.
def dependencies(options):
 for option in options:
  req=option.get('prerequisiteText','')
  if not req:
   req=(re.search(r'Prerequisites?:\s*(.*)',clean(option['description']),re.I) or [None,''])[1]
  if ' or ' in req.lower():continue
  need=[];rem=norm(req)
  for other in sorted(options,key=lambda o:-len(o['name'])):
   if other['id']!=option['id'] and re.search(r'\b'+re.escape(norm(other['name']))+r'\b',rem):need.append(other['id']);rem=re.sub(r'\b'+re.escape(norm(other['name']))+r'\b',' owned ',rem)
  if need:option['requiresOptionIds']=list(dict.fromkeys(need))
  fids=[]
  for name,fid in sorted(aliases.items(),key=lambda v:-len(v[0])):
   if re.search(r'\b'+re.escape(name)+r'\b',rem):fids.append(fid);rem=re.sub(r'\b'+re.escape(name)+r'\b',' owned ',rem)
  if fids:option['requiresFeatureIds']=list(dict.fromkeys(fids))
dependencies([o for p in d['choicePools'] for o in p['options']])
archives=[];audit=[]
for path in sorted((base/'archetypes').glob('*/index.md')):
 key=path.parent.name;aid='ffd20:archetype:monk:'+key;s=path.read_text();sects=sections(s);profile={};a=dict(features=[],upgrades=[],replacements=[],choicePools=[],events=[],resources=[],profile=profile,supportedLevels=list(range(1,21)),manualChoices=True)
 if key in ['featherweight','fist-of-rhalgr']:profile['hitDie']=10
 if key=='diminutive-adept':profile['requiredSize']='small'
 for slugname,race in [('meowfist','palico'),('scaled-fist','gria'),('streak','moomba'),('student-of-the-stone','dwarf'),('treetop-monk','viera')]:
  if key==slugname:profile['requiredRaceId']='ffd20:race:'+race
 if key=='nimble-guardian':profile['requiredRaceIds']=['ffd20:race:mithra','ffd20:race:ronso']
 for heading,body in sects:
  hkey=slug(heading)
  if heading in ['Hit Dice','Class Skills']:
   if heading=='Class Skills':
    sk=list(d['classSkills']);text=clean(body)
    for skill in ['heal','spellcraft','bluff','diplomacy','knowledge:nature','knowledge:geography','survival']:
     label=skill.replace(':',' (')+(')' if ':' in skill else '')
     if re.search(r'\b'+re.escape(label)+r'\b',text,re.I):
      # Explicit source-specific removals/additions are handled below.
      pass
   continue
  # Determine explicit replacement clauses, not incidental prose about changing options.
  sentences=re.findall(r'(?:This|These) (?:ability|abilities|feature|features) (?:replaces?|replace)\s+([^\n.]+)',clean(body),re.I)
  whole=[];partial=[];unmatched=[]
  for sentence in sentences:
   remaining=norm(sentence)
   for alias,fid in sorted(aliases.items(),key=lambda x:-len(x[0])):
    if not re.search(r'\b'+re.escape(alias)+r'\b',remaining):continue
    if alias in poolroots:
     pattern=re.escape(alias)+r'\s+(?:gained |obtained |selected |earned )?(?:at )?(?:levels? )?(\d+.*)'
     match=re.search(pattern,remaining)
     # Normalization removes commas; read every ordinal up to the terminal level word.
     levels=[int(n) for n in re.findall(r'\d+',re.split(r'\blevels?\b',match[1],maxsplit=1)[0])] if match else []
     if levels:partial.extend((fid,e['id']) for e in d['events'] if e['type']=='choose' and e['atClassLevel'] in levels and e['poolIds']==[CID+':pool:'+poolroots[alias]])
     else:whole.append(fid)
    else:whole.append(fid)
    remaining=re.sub(r'\b'+re.escape(alias)+r'\b',' owned ',remaining)
   rest=re.sub(r'\b(?:owned|the|and|a|an|at|gained|levels?|st|nd|rd|th|or|limit break)\b|[0-9]',' ',re.sub(r'\d+(?:st|nd|rd|th)?',' ',remaining)).strip()
   if re.sub(r'\s+','',rest):unmatched.append(sentence)
  # First acquisition is the first explicit opening level, not later scaling clauses.
  opening=clean(body.split('\n\n')[0]);m=re.search(r'\b(?:At|Beginning at|Starting at|reaches) (\d+)(?:st|nd|rd|th)?(?: monk)? level',opening,re.I)
  candidate=[next(f['atLevel'] for f in d['features'] if f['id']==fid) for fid in whole]+[next(e['atClassLevel'] for e in d['events'] if e['id']==eid) for _,eid in partial]
  lv=int(m[1]) if m else (min(candidate) if candidate else next((f['atLevel'] for f in d['features'] if f['name']==heading),1))
  if heading=='Limit Break':
   # Only Flawless Fists is replaced by Elemental Fist Disciple's declared limit break.
   whole=[CID+':feature:flawless-fists'];lv=1
   match=re.search(r'\*([^\n]+?):\*\s*(.*?)(?=\n\n|\Z)',body,re.S)
   lb=title(match[1]) if match else heading;f=feature(aid+':feature:'+slug(lb),lb,lv,body,'limit_break')
  else:f=feature(aid+':feature:'+hkey,heading,lv,body)
  f['sourceRefs']=refs(heading);a['features'].append(f)
  if whole:a['replacements'].append(dict(id=aid+':replacement:'+hkey,atClassLevel=min([lv]+[next(f['atLevel'] for f in d['features'] if f['id']==fid) for fid in whole]),operation='replace',scope='whole_feature',resolution='resolved',targetFeatureIds=list(dict.fromkeys(whole)),replacementFeatureIds=[f['id']],sourceRefs=refs(heading),description='; '.join(sentences)))
  if partial:a['replacements'].append(dict(id=aid+':replacement:'+hkey+':events',atClassLevel=lv,operation='replace',scope='whole_feature',resolution='resolved',targetFeatureIds=list(dict.fromkeys(fid for fid,_ in partial)),targetEventIds=list(dict.fromkeys(eid for _,eid in partial)),eventOnly=True,replacementFeatureIds=[f['id']],sourceRefs=refs(heading),description='; '.join(sentences)))
  for text in unmatched:
   audit.append(dict(archetype=key,heading=heading,kind='replacement-wording',text=text,note='Targets found by exact canonical names; remaining descriptive wording retained for manual review.'))
 # Source-declared class skill swaps.
 swaps={'life-monk':(['intimidate'],['heal']),'white-monk':(['intimidate','stealth'],['heal','spellcraft']),'monk-of-the-wild':(['knowledge:history','knowledge:religion'],['knowledge:nature','survival']),'peacekeeper':(['intimidate'],['diplomacy']),'treetop-monk':(['knowledge:religion'],['knowledge:nature']),'wanderer':([],['diplomacy','knowledge:geography','knowledge:local','linguistics','survival'])}
 if key in swaps:
  remove,add=swaps[key];profile['classSkills']=[x for x in d['classSkills'] if x not in remove]+[x for x in add if x not in d['classSkills']]
 # Native inline option lists use ordinary pickers; extra details stay on existing rows.
 def inline_options(section,minimum):
  body=next((b for h,b in sects if h==section),'');chunks=[];current=None
  for line in body.splitlines():
   text=clean(line)
   if line.startswith('*') and ':' in text:
    label,desc=text.split(':',1)
    if len(label)<80 and label.lower() not in ['prerequisite','prerequisites']:
     if current:chunks.append(current)
     current=[title(label),desc];continue
   if current:current[1]+='\n'+line
  if current:chunks.append(current)
  out=[]
  for name,body in chunks:
   gate=max([minimum]+[int(n) for n in re.findall(r'(?:Monk (?:Level )?|must be at least |Requires Monk )(\d+)',clean(body),re.I)])
   if section=='Combo Finishers':
    cost=re.search(r'Costs (\d+) combo',body)
    if cost:gate=max(gate,{4:6,5:11,6:16}.get(int(cost[1]),1))
   out.append(dict(id=aid+':option:'+slug(section)+':'+slug(name),name=name,description=body+'\n'+manual,minimumLevel=gate,repeatLimit=1,featureIds=[],sourceRefs=refs(section),url=source(path)['url'],manualPrerequisites=True))
  return out
 def choice_events(section,levels,options=None,manualCount=None):
  options=inline_options(section,min(levels)) if options is None else options
  if not options:
   options=[dict(id=aid+':option:'+slug(section)+':manual-selection',name=section+' (manual selection)',description='Choose a legal '+section+' option from the reference card and record its exact name, prerequisite checks and effects on the existing ability/feat entries.\n'+next((b for h,b in sects if h==section),'')+'\n'+manual,minimumLevel=min(levels),repeatLimit=20,featureIds=[],sourceRefs=refs(section),url=source(path)['url'],manualPrerequisites=True)]
  pool=aid+':pool:'+slug(section);a['choicePools'].append(dict(id=pool,name=section,options=options))
  for i,level in enumerate(levels):a['events'].append(dict(id=aid+':event:'+slug(section)+':'+str(level)+':'+str(i),type='choose',atClassLevel=level,poolIds=[pool],count={'kind':'constant','value':1},sourceRefs=refs(section)))
 if key=='ki-master':choice_events('Ki Techniques',list(range(3,21,3)))
 if key=='fist-of-rhalgr':
  choice_events('Combo Finishers',[1,1]+list(range(3,21,2)))
  # Additional permitted blitz options; replace the listed base options, retain the rest.
  excluded=['Aura Blast','Ki Trap','Meteor Strike','Razor Gale','Shockwave','Soul Spiral','Unbridled Strength']
  profile['excludedOptionNames']=excluded
  a['extraOptions']=[dict(poolId=CID+':pool:blitz-techniques',options=inline_options('Blitz Techniques',3))]
  # The source's starting Raging Fist explicitly replaces the automatic Chakra.
  a['replacements'].append(dict(id=aid+':replacement:starting-blitz',atClassLevel=2,operation='replace',scope='whole_feature',resolution='resolved',targetFeatureIds=[CID+':feature:chakra'],replacementFeatureIds=[],sourceRefs=refs('Ki Pool')))
  raging=next(o for p in d['choicePools'] for o in p['options'] if o['name']=='Raging Fist');a['features'].append(feature(aid+':feature:raging-fist','Raging Fist',2,raging['description']))
 if key=='elemental-fist-disciple':
  choice_events('Fistskills',[1,1,2,5,8,11,14,17,20])
  # Either legal monk talent or eligible Sword Saint talent; cross-class choice stays named/manual.
  manualSword=dict(id=aid+':option:fist-talents:sword-saint',name='Sword Saint Talent (manual selection)',description='Select a Sword Saint talent that modifies swordskills, counting Monk level as Sword Saint level. Record exact talent name, prerequisites and effects on existing sheet entries.\n'+manual,minimumLevel=2,repeatLimit=10,featureIds=[],sourceRefs=refs('Fist Talents'),url=source(path)['url'],manualPrerequisites=True)
  choice_events('Fist Talents',list(range(2,21,2)),[o for p in d['choicePools'] if p['id'].endswith(':monk-talents') for o in p['options']]+[manualSword])
 if key=='monk-of-the-wild':
  choice_events('Rage Powers',list(range(2,21,2)));choice_events('Martial Arts Style Mastery',list(range(3,21,3)),[])
 if key=='master-of-many-styles':choice_events('Bonus Feat',[1,2,6,10,14,18],[])
 # Resources with changed ability modifiers reuse the canonical Ki Pool card when present.
 wis=['featherweight','fist-of-rhalgr','ki-master','meowfist','nimble-guardian','streak','treetop-monk','wanderer','weapon-adept']
 if key in wis:a['resources'].append(dict(featureId=CID+':feature:ki-pool',perLevel=.5,ability='wis',minimum=0))
 if key in ['elemental-fist-disciple','life-monk']:
  f=next(f for f in a['features'] if f['name']=='Superior Ki Pool');a['resources'].append(dict(featureId=f['id'],perLevel=2,ability='wis',minimum=0))
  # The replaced Ki Pool also owns the automatic Chakra reference; its effects differ under these variants.
  a['replacements'].append(dict(id=aid+':replacement:base-chakra',atClassLevel=1,operation='remove',scope='whole_feature',resolution='resolved',targetFeatureIds=[CID+':feature:chakra'],replacementFeatureIds=[],sourceRefs=refs('Superior Ki Pool')))
 if key=='monk-of-the-wild':
  a['replacements'].append(dict(id=aid+':replacement:base-chakra',atClassLevel=2,operation='remove',scope='whole_feature',resolution='resolved',targetFeatureIds=[CID+':feature:chakra'],replacementFeatureIds=[],sourceRefs=refs('Uncanny Dodge')))
  a['resources'].append(dict(featureId=aid+':feature:rage',base=2,perLevel=2,ability='con',minimum=0))
 if key=='fist-of-rhalgr':a['resources'].append(dict(featureId=aid+':feature:combo-finishers',byLevel=[3]*5+[4]*5+[5]*5+[6]*5,minimum=0))
 if key=='white-monk':
  profile.update(manualSpellcasting=True,castingAbility='wis',hitDie=8)
  spellbody=next(b for h,b in sects if h=='Spells and Cantrips');mp={}
  for line in spellbody.splitlines():
   m=re.match(r'\| (\d+)(?:st|nd|rd|th) \| (\d+) \| (\d+)(?:st|nd|rd|th) \|',line)
   if m:mp[int(m[1])]=(int(m[2]),int(m[3]))
  assert len(mp)==20;profile['levels']=[{**row,'bab':row['level']*3//4,'iterativeAttacks':list(range(row['level']*3//4,0,-5)),'baseMp':mp[row['level']][0],'maxSpellLevel':mp[row['level']][1]} for row in rows]
  f=next(f for f in a['features'] if f['name']=='Spells and Cantrips');f['description']+='\nSpell learning and selection are manual: use existing spell rows. The sheet tracks the source MP table and Wisdom bonus MP only; no White Mage spell picker is claimed.'
 # Flag explicit selectable prerequisite text in native lists while retaining manual external requirements.
 opts=[o for p in a['choicePools'] for o in p['options']]+[o for p in a.get('extraOptions',[]) for o in p['options']]+[o for p in d['choicePools'] for o in p['options']]
 dependencies(opts)
 for f in a['features']:a['events'].append(dict(id=f['id']+':grant',type='grant_feature',featureId=f['id'],atClassLevel=f['atLevel'],sourceRefs=f['sourceRefs']))
 definition=dict(schemaVersion='comos.rules.v1',kind='archetype',id=aid,parentClassId=CID,name=source(path)['title'],sources=[source(path)],review=dict(state='needs_review',coverage='partial_manual',notes='Source-backed sheet progression/replacements. Complex combat, prerequisites, dynamic choices and spell/equipment/feat subchoices remain manual; no independent full review claimed.'),data=a)
 archives.append(definition);(root/f'rules/classes/archetypes/monk-{key}.archetype.json').write_text(json.dumps(definition,indent=2)+'\n')
d['archetypeIndex']=[dict(id=a['id'],name=a['name'],url=a['sources'][0]['url']) for a in archives]
cp.write_text(json.dumps(c,indent=2)+'\n');(root/'docs/extraction/monk-family-audit.json').write_text(json.dumps(audit,indent=2)+'\n')
print(json.dumps(dict(archetypes=len(archives),features=len(d['features']),options=sum(len(p['options']) for p in d['choicePools']),auditNotes=len(audit))))
