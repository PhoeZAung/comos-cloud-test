"""Source-backed Thief family sheet data. Usage: python3 scripts/imports/thief-family.py /absolute/archive/pages"""
from pathlib import Path
import sys,re,json,hashlib,copy
root=Path(__file__).resolve().parents[2];cache=Path(sys.argv[1]);base=cache/'classes/core-classes/thief';CID='ffd20:class:thief'
def clean(s):return re.sub(r'\[([^]]+)\]\([^)]+\)',r'\1',s).replace('*','').replace('\\','').replace('\xa0',' ').strip()
def norm(s):return re.sub(r'[^a-z0-9]+',' ',clean(s).lower().replace('’','').replace("'",'')).strip()
def slug(s):return norm(s).replace(' ','-')
def title(s):return re.sub(r'\s*\((?:Ex|Su|Sp)[^)]*\)','',clean(s)).strip().rstrip(':')
def source(p,key='main'):return dict(id=key,url=p.read_text().splitlines()[0][8:],title=next(clean(l[2:]) for l in p.read_text().splitlines() if l.startswith('# ')),archiveSha256=hashlib.sha256(p.read_bytes()).hexdigest(),retrievedOn='2026-10-29',sourceKind='official_web')
def refs(t,key='main'):return [dict(sourceId=key,section=t,locator=slug(t).replace('replacement','exchange'))]
def sections(s):return [(title(h),b.strip()) for h,b in re.findall(r'^### ([^\n]+)\n(.*?)(?=\n## |\n### |\Z)',s,re.M|re.S)]
def feature(owner,name,lv,body,kind='class_feature'):
 return dict(id=owner+':feature:'+slug(name),name=name,atLevel=lv,description=body+'\nSheet reference: apply conditional effects manually; record weapon, skill, feat, companion and spell subchoices on existing sheet rows.',activation='mixed' if re.search(r'action|per day|activate',body,re.I) else 'passive',featureKind=kind,automation='manual',sourceRefs=refs(name))
def event(owner,pool,lv,count=1):return dict(id=owner+':event:'+pool+':'+str(lv),type='choose',atClassLevel=lv,poolIds=[owner+':pool:'+pool],count={'kind':'constant','value':count},sourceRefs=refs(pool))
def grant_events(fs,us):return [dict(id=f['id'].replace(':feature:',':event:grant:'),type='grant_feature',featureId=f['id'],atClassLevel=f['atLevel'],sourceRefs=f['sourceRefs']) for f in fs]+[dict(id=u['id'].replace(':upgrade:',':event:upgrade:'),type='upgrade_feature',featureId=u['featureId'],upgradeId=u['id'],atClassLevel=u['atClassLevel'],sourceRefs=u['sourceRefs']) for u in us]
def rows(s):
 out=[]
 for l in s.splitlines():
  cells=[c.strip() for c in l.split('|')[1:-1]]
  if len(cells)>=6 and re.match(r'^\d+(?:st|nd|rd|th)$',cells[0]):
   lv=int(re.match(r'\d+',cells[0])[0]);bab=int(re.search(r'\d+',cells[1])[0]);out.append(dict(level=lv,bab=bab,fort=int(re.search(r'\d+',cells[2])[0]),ref=int(re.search(r'\d+',cells[3])[0]),will=int(re.search(r'\d+',cells[4])[0]),iterativeAttacks=list(range(bab,0,-5)),baseMp=0,maxSpellLevel=0,special=clean(cells[5]),sourceRefs=refs('Table: Thief level '+str(lv))))
 return out
s=(base/'index.md').read_text();levels=rows(s);first={};table_labels={}
for row in levels:
 line=next(l for l in s.splitlines() if re.match(r'^\| '+str(row['level'])+r'(?:st|nd|rd|th) \|',l))
 for label,anchor in re.findall(r'\[([^]]+)\]\(#([^)]*)\)',line):first.setdefault(anchor,row['level']);table_labels.setdefault(anchor,[]).append((row['level'],clean(label)))
features=[]
for name,body in sections(s):
 if name=='Limit Breaks':
  for lb,desc in re.findall(r'^\*([^\n]*?)\([\s\S]*?\):\*\s*(.*?)(?=\n\n\*|\Z)',body,re.M|re.S):features.append(feature(CID,title(lb),1,desc,'limit_break'))
  continue
 key=slug(name);lv=first.get(key,1);features.append(feature(CID,name,lv,body))
# Parent repeated feature labels remain one canonical rule with source-backed SET state.
upgrades=[]
for f in features:
 key=slug(f['name']);seen=set()
 for row in levels:
  pieces=[x.strip() for x in row['special'].split(',')]
  label=next((x for x in pieces if norm(x).startswith(norm(f['name']))),None)
  if label and row['level']>f['atLevel'] and label not in seen:
   upgrades.append(dict(id=CID+':upgrade:'+key+':'+str(row['level']),featureId=f['id'],atClassLevel=row['level'],changes={'progression':label},sourceRefs=refs('Table: Thief level '+str(row['level']))))
  if label:seen.add(label)
# Complete real talent tables, normal and advanced; external prerequisites remain manual.
talent_source=base/'thief-talents/index.md';talents=[];tier=2
for line in talent_source.read_text().splitlines():
 if line.startswith('## Table: Thief Advanced'):tier=12
 cells=[x.strip() for x in line.split('|')[1:-1]]
 if len(cells)!=3 or not line.startswith('|') or cells[0].strip().startswith(('---','Thief Talent','Advanced')):continue
 name=title(cells[0]);req=clean(cells[1]);desc=cells[2]
 if not name or name=='—' or name=='Sneak Attack Asterisks' or req=='Prerequisites':continue
 gate=max([tier]+[int(x) for x in re.findall(r'(?:Thief|thief)(?: level)? (\d+)',req)])
 talents.append(dict(id=CID+':talent:'+slug(name),name=name,description=desc+'\nPrerequisites: '+req+'. Check external requirements manually; record additional choices on existing sheet rows.',minimumLevel=min(20,gate),repeatLimit=1,featureIds=[],sourceRefs=refs(name,'talents'),url=source(talent_source)['url'],prerequisiteText=req,manualPrerequisites=True))
assert len(talents)>100 and len({o['id'] for o in talents})==len(talents)
normal=[o for o in talents if o['minimumLevel']<12];pools=[dict(id=CID+':pool:thief-talents',name='Thief Talent',options=normal),dict(id=CID+':pool:thief-advanced-talents',name='Thief Talent or Advanced Talent',options=talents)]
events=[event(CID,'thief-talents',l) for l in range(2,12,2)]+[event(CID,'thief-advanced-talents',l) for l in range(12,21,2)]
# Names/weapon selections have no existing dedicated variable; explicit manual selection slots retain entitlement.
def manual_pool(owner,key,name,description,repeat=20):return dict(id=owner+':pool:'+key,name=name,options=[dict(id=owner+':option:'+key+':manual-selection',name=name+' (record selection on sheet)',description=description,minimumLevel=1,repeatLimit=repeat,featureIds=[],sourceRefs=refs(name),manualPrerequisites=True)])
pools.append(manual_pool(CID,'finesse-training','Finesse Training weapon','Choose a legal permanent finesse weapon type; record its exact name in the Finesse Training ability card or weapon row. Weapon damage changes remain manual.',3));events += [event(CID,'finesse-training',l) for l in [3,11,19]]
pools.append(manual_pool(CID,'thiefs-edge','Thief’s Edge skill','Select a legal skill and record its exact name and skill unlock effects on the existing ability/skill sheet entries. Do not repeat a prior skill.',4));events += [event(CID,'thiefs-edge',l) for l in [5,10,15,20]]
# Explicit option dependencies can be checked without inventing new feat/equipment variables.
def dependencies(options):
 for o in options:
  req=o.get('prerequisiteText','');found=re.search(r'Prerequisites?:\s*([^\n.]+)',clean(o['description']),re.I)
  if not req and found:req=found[1]
  if not req or ' or ' in req.lower():continue
  req=re.sub(r'^(?:The )?(?:time bandit|combatant|rogue|thief)(?= (?:must|can|may|has|is|gains)\b)','',req,flags=re.I)
  remaining=norm(req);needed=[]
  for other in sorted(options,key=lambda x:-len(x['name'])):
   n=norm(other['name'])
   if n and other['id']!=o['id'] and re.search(r'\b'+re.escape(n)+r'\b',remaining):needed.append(other['id']);remaining=re.sub(r'\b'+re.escape(n)+r'\b',' owned ',remaining)
  if needed:o['requiresOptionIds']=list(dict.fromkeys(needed))
dependencies(talents)
skills=['acrobatics','appraise','bluff','climb','craft:*','diplomacy','disable-device','disguise','escape-artist','intimidate','knowledge:dungeoneering','knowledge:local','linguistics','perception','perform:*','profession:*','sense-motive','sleight-of-hand','stealth','swim','use-magic-device']
profs=['Simple weapons','Chakram','Hand crossbow','Rapier','Sap','Shortbow','Shortsword','Light armor']
for pool in pools:
 for option in pool['options']:option.setdefault('url',source(base/'index.md')['url'])
data=dict(hitDie=8,skillRanksPerLevel=8,classSkills=skills,proficiencies=profs,startingWealth=140,supportedLevels=list(range(1,21)),spellcasting={'learningMode':'none'},levels=levels,features=features,upgrades=upgrades,events=grant_events(features,upgrades)+events,choicePools=pools,resources=[])
c=dict(schemaVersion='comos.rules.v1',kind='class',id=CID,name='Thief',revision=1,sources=[source(base/'index.md'),source(talent_source,'talents')],review=dict(state='needs_review',coverage='partial_manual',notes='Source-backed campaign sheet support through 20; conditional effects, subchoices and external prerequisites manual. Not independently fully reviewed.'),data=data)
# Parent aliases use exact whole feature names, not substring matches in unrelated descriptions.
feature_by_name={norm(f['name']):f for f in features};aliases={k:f['id'] for k,f in feature_by_name.items()};aliases.update({'thief talent':CID+':feature:thief-talents','advanced thief talent':CID+':feature:thief-advanced-talents','advanced thief talents':CID+':feature:thief-advanced-talents','thief advanced talent':CID+':feature:thief-advanced-talents','weapon proficiencies':CID+':feature:weapon-and-armor-proficiency','weapon proficiency':CID+':feature:weapon-and-armor-proficiency','weapon and armor proficiencies':CID+':feature:weapon-and-armor-proficiency','limit breaks':None,'limit break':None})
audit=[];arches=[]
def levels_in(t):return [int(n) for n in re.findall(r'\b(\d+)(?:st|nd|rd|th)?(?:[- ]level| level)?',t) if 1<=int(n)<=20]
def first_level(body,targets,default=1):
 text=clean(body);first_para=text.split('\n\n',1)[0]
 initial=re.search(r'\b(?:at|beginning at|starting at|upon reaching|reaches|attains) (\d+)(?:st|nd|rd|th)?(?:,?[- ]+level)',first_para,re.I)
 if not initial:initial=re.search(r'^(?:A |An )?(\d+)(?:st|nd|rd|th)-level',first_para,re.I)
 if initial:return int(initial[1])
 return min([feature_by_name[k]['atLevel'] for k in feature_by_name if feature_by_name[k]['id'] in targets] or [default])

def inline_options(owner,section,body,minimum=2):
 chunks=[];current=None
 for line in body.splitlines():
  if re.match(r'^\s*(?:[*+\-] )?\*',line):
   t=clean(line)
   if ':' in t:
    label,desc=t.split(':',1);label=title(label)
    if len(label)<75 and norm(label) not in ['prerequisite','prerequisites','resonance','weapon requirement','blessings'] and not norm(label).endswith('talent tree'):
     if current:chunks.append(current)
     current=[label,desc.strip()];continue
  if current:current[1]+='\n'+line
 if current:chunks.append(current)
 result=[]
 for label,desc in chunks:
  if not desc.strip():continue
  req=re.search(r'Prerequisites?:\s*([^\n.]+)',clean(desc),re.I);req=req[1] if req else ''
  gate=max([minimum]+[int(n) for n in re.findall(r'(?:thief|time bandit|combatant|rogue)(?: level)? (\d+)',req,re.I)]+[int(n) for n in re.findall(r'at least (\d+)(?:st|nd|rd|th)? level',req,re.I)])
  result.append(dict(id=owner+':option:'+slug(section)+':'+slug(label),name=label,description=desc+'\nCheck stated prerequisites manually; record any extra choices on the existing sheet.',minimumLevel=min(20,gate),repeatLimit=20 if re.search('multiple times|more than once',desc,re.I) else 1,featureIds=[],sourceRefs=refs(section),manualPrerequisites=True))
 return result
for path in sorted((base/'archetypes').glob('*/index.md')):
 key=path.parent.name;aid='ffd20:archetype:thief:'+key;name=source(path)['title'];ss=path.read_text();asections=sections(ss);ad=dict(features=[],upgrades=[],replacements=[],events=[],choicePools=[],resources=[],profile={},supportedLevels=list(range(1,21)))
 def add_choices(section,lvs,options=None):
  body=next((b for h,b in asections if slug(h)==slug(section)), '');opts=inline_options(aid,section,body,min(lvs)) if options is None else options
  if not opts:
   opts=manual_pool(aid,slug(section),section,'Make the stated legal '+section+' choice from its source card and record the exact choice on existing sheet rows. '+body)['options']
  for o in opts:o.setdefault('url',source(path)['url'])
  pool=dict(id=aid+':pool:'+slug(section),name=section,options=opts);ad['choicePools'].append(pool);ad['events'] += [event(aid,slug(section),lv) for lv in lvs]
  return opts
 for heading,body in asections:
  hkey=slug(heading)
  if hkey in ['class-skills','skill-ranks-per-level','skills-points-per-level','the-sky-pirate-code']:continue
  # Recommendation-only paragraphs confer no additional feature/choice.
  if hkey in ['thief-talents','advanced-thief-talents','advanced-talents'] and re.search('following .*complement',body,re.I) and not re.search('may gain|may select|cannot|unable',body,re.I):continue
  # Class replacements: longest canonical name first, consume each matched token.
  statements=re.findall(r'((?:This|These)\b[^.\n]{0,100}?\b(replaces?|alters?|modifies?|modify)\b([^.]*)\.)',clean(body),re.I)
  removed=[];ops=[]
  for full_statement,verb,text in statements:
   if re.search(r'\bmay replace\b',full_statement,re.I):continue
   remaining=norm(text);targets=[]
   if 'limit break' in remaining:
    targets=[f['id'] for f in features if f['featureKind']=='limit_break' and (norm(f['name']) in remaining or not any(norm(lb['name']) in remaining for lb in features if lb['featureKind']=='limit_break'))]
    remaining=re.sub('limit breaks?',' ',remaining)
   for alias,fid in sorted(aliases.items(),key=lambda x:-len(x[0])):
    if fid and re.search(r'\b'+re.escape(alias)+r'\b',remaining):targets.append(fid);remaining=re.sub(r'\b'+re.escape(alias)+r'\b',' owned ',remaining)
   talent_targets=[t for t in targets if t.endswith((':thief-talents',':thief-advanced-talents'))];lvlist=[]
   if talent_targets:
    tail=re.search(r'(?:gained|gain|at|of)\s+(?:at )?((?:\d+(?:st|nd|rd|th)?(?:[- ,]+(?:and )?)?)+(?: level)?)',clean(text),re.I)
    if tail:lvlist=levels_in(tail[1])
    explicit_after=re.search(r'at level (\d+)',text,re.I)
    if explicit_after:lvlist=[int(explicit_after[1])]
    if not lvlist and re.search(r'\b(?:all |the )?(?:thief talents|thief talent and advanced thief talents|thief talents and advanced thief talents)\b',norm(text)) and not re.search(r'\ba thief talent\b',norm(text)):
     targets += [CID+':feature:thief-talents',CID+':feature:thief-advanced-talents']
   at=first_level(body,targets)
   if talent_targets and not lvlist and re.search('(?:a|the|an advanced) thief talent (?:gained|gains)',clean(text),re.I):lvlist=[at]
   te=[e['id'] for e in events if lvlist and e['atClassLevel'] in lvlist and any(p.endswith((':thief-talents',':thief-advanced-talents')) for p in e['poolIds'])]
   event_only=bool(te and len(targets)==len(talent_targets))
   if verb.lower().startswith(('alter','modif')):
    # Keep the parent card and append source-specific changes; replacement details stay manual.
    audit.append(dict(archetype=key,heading=heading,kind='manual-modification',text=text.strip()));continue
   if targets:
    ops.append(dict(id=aid+':replacement:'+hkey+':'+str(len(ops)+1),atClassLevel=at,operation='replace',scope='whole_feature',resolution='resolved',targetFeatureIds=list(dict.fromkeys(targets)),replacementFeatureIds=[],targetEventIds=te,eventOnly=event_only,description=clean(text),sourceRefs=refs(heading)));removed+=targets
   else:
    if key!='solid-snake' or heading!='Martial Flexibility':audit.append(dict(archetype=key,heading=heading,kind='unmatched-replacement',text=text.strip()))
  at=first_level(body,removed)
  # Some no-intro replacement cards acquire at the explicitly replaced choice slot.
  if ops and all(op.get('eventOnly') for op in ops) and first_level(body,[],default=0)==0:at=min(e['atClassLevel'] for e in events if any(e['id'] in op['targetEventIds'] for op in ops))
  if hkey in ['limit-break','limit-breaks']:
   lbs=[]
   for line in body.splitlines():
    if line.startswith('*') and '):' in clean(line):
     label=title(clean(line).split(':',1)[0]);lbs.append(feature(aid,label,at,line,'limit_break'))
   if not lbs:
    labels=re.search(r'receives the Limit Breaks? \(([^)]+)\)',clean(body),re.I)
    for label in labels[1].split(' and ') if labels else [heading]:lbs.append(feature(aid,label,at,body,'limit_break'))
   ad['features']+=lbs;added=[x['id'] for x in lbs]
  else:
   f=feature(aid,heading,at,body);ad['features'].append(f);added=[f['id']]
  for op in ops:op['replacementFeatureIds']=added
  ad['replacements']+=ops
 for f in ad['features']:
  if f['name']=='Thief Talents':f['atLevel']=2
  if f['name'] in ['Advanced Thief Talents','Advanced Talents']:f['atLevel']=12
  if f['name']=='Pirate Trick':f['atLevel']=4
 # Fixed source chassis and class-skill overrides.
 profile=ad['profile'];combined=clean(ss)
 if key=='combatant':
  profile.update(hitDie=10,skillRanksPerLevel=4,levels=[{**r,'bab':r['level'],'iterativeAttacks':list(range(r['level'],0,-5))} for r in levels]);profile['proficiencies']=profs+['One-handed firearms']
 if key in ['merchant','street-magician','skulking-slayer']:profile['skillRanksPerLevel']=6
 skill_changes={
 'assassin':(['disable-device'],['survival']),
 'combatant':(['disable-device','stealth'],['survival']),
 'deadly-courtesan':(['knowledge:dungeoneering'],['knowledge:history','knowledge:nobility']),
 'festivalist':([],['handle-animal']),
 'raptor':(['knowledge:dungeoneering'],['survival']),
 'skulking-slayer':(['disable-device','linguistics','sleight-of-hand'],[]),
 'sky-pirate':(['linguistics','knowledge:dungeoneering'],['navigate','pilot']),
 'spellthief':(['diplomacy','disguise'],['knowledge:arcana','spellcraft']),
 'street-magician':(['escape-artist','knowledge:dungeoneering'],['knowledge:arcana','spellcraft']),
 'streetrat':(['knowledge:dungeoneering'],['survival'])}
 if key in skill_changes:
  lose,gain=skill_changes[key];profile['classSkills']=[x for x in skills if x not in lose]+[x for x in gain if x not in skills]
 # Preserve exact source class skill/proficiency prose where full automatic mapping is uncertain.
 for heading,body in asections:
  if slug(heading)=='class-skills':profile['classSkillSourceText']=clean(body)
 if key=='bounty-hunter':profile['proficiencies']=['Simple weapons','Martial weapons','Aklys','Bolas','Dan bong','Lasso','Net','Light armor','Light shields','Bucklers']
 if key=='knife-master':profile['proficiencies']=['Brass knife','Dagger','Butterfly knife','Deer horn knife','Dueling dagger','Kerambit','Kukri','Kunai','Punching dagger','Sea-knife','Spring blade','Starknife','Switchblade knife','Swordbreaker dagger','War razor','Light armor']
 if key=='solid-snake':profile['proficiencies']=['Light blade weapon group','Crossbows','Darts','One-handed firearms','Light armor']
 if key=='skulking-slayer':profile['proficiencies']=[p for p in profs if p not in ['Rapier','Hand crossbow']]+['Greatclub','Whip']
 if key=='spellthief':
  table={int(re.match(r'\d+',cells[0])[0]):(int(cells[1]),int(re.match(r'\d+',cells[2])[0])) for line in ss.splitlines() if line.startswith('|') and len(cells:=[x.strip() for x in line.split('|')[1:-1]])==3 and re.match(r'\d+(?:st|nd|rd|th)$',cells[0])}
  profile.update(manualSpellcasting=True,castingAbility='int',levels=[{**r,'baseMp':table.get(r['level'],(0,0))[0],'maxSpellLevel':table.get(r['level'],(0,0))[1]} for r in levels]);ad['manualSpellInstructions']='Beginning at4, choose/source black mage spells per the Spells card and enter them manually on existing spell rows; INT eligibility, spell learning, stealing and temporary MP effects are manual.'
 # Explicit native permanent option tracks.
 if key=='burglar':add_choices('Burglar Tricks',list(range(2,21,2)))
 if key in ['combatant','rogue','time-bandit']:
  section={'combatant':'Finishing Moves','rogue':'Talent Trees','time-bandit':'Temporal Talents'}[key]
  opts=inline_options(aid,section,next(b for h,b in asections if slug(h)==slug(section)),2)+copy.deepcopy(talents)
  add_choices(section,list(range(2,21,2)),opts)
  # These are alternatives in each normal/advanced talent slot, not additional picks.
  ad['replacements'].append(dict(id=aid+':replacement:native-choice-track',atClassLevel=2,operation='remove',scope='whole_feature',resolution='resolved',targetFeatureIds=[CID+':feature:thief-talents',CID+':feature:thief-advanced-talents'],replacementFeatureIds=[],sourceRefs=refs(section)))
 if key=='merchant':
  body=next(b for h,b in asections if h=='Blessing of Prosperity')
  benefits=[line[2:] for line in body.splitlines() if line.startswith('* The target')]
  labels=['Treasure sale value','Appraise and Sense Motive','Perception and maneuver defense','Craft Perform Profession','Locate Object','Settlement value and purchase limit','Settlement magic item availability']
  assert len(benefits)==len(labels)
  opts=[dict(id=aid+':option:blessing:'+slug(label),name=label,description=desc,minimumLevel=1,repeatLimit=1,featureIds=[],sourceRefs=refs('Blessing of Prosperity')) for label,desc in zip(labels,benefits)]
  add_choices('Blessing of Prosperity',[1,7,13,19],opts)
 if key=='sky-pirate':
  audit.append(dict(archetype=key,heading='Sailor’s Step',kind='source-schedule-note',text='Body explicitly grants Sailor’s Step at11 and replaces level12 talent. This sheet grants the card at11 and withholds the level12 talent/trick choice; source summary may place it at12. GM may reconcile timing manually.'))
  next(f for f in ad['features'] if f['name']=='Sailor’s Step')['description']+='\nSource schedule note: the body grants this at11 while consuming the level12 talent/trick slot; this sheet follows that body. GM may reconcile with the summary manually.'
  opts=inline_options(aid,'Pirate Trick',next(b for h,b in asections if h=='Pirate Trick'),4)+copy.deepcopy(talents)
  add_choices('Pirate Trick',[4,6,8,10,14,16,18,20],opts)
  ad['replacements'].append(dict(id=aid+':replacement:pirate-trick-choice-track',atClassLevel=4,operation='replace',scope='whole_feature',resolution='resolved',targetFeatureIds=[CID+':feature:thief-talents',CID+':feature:thief-advanced-talents'],targetEventIds=[e['id'] for e in events if e['atClassLevel']>=4 and any(p.endswith((':thief-talents',':thief-advanced-talents')) for p in e['poolIds'])],eventOnly=True,replacementFeatureIds=[],sourceRefs=refs('Pirate Trick')))
 if key=='street-magician':
  next(f for f in ad['features'] if f['name']=='Thief Magic')['atLevel']=1
  add_choices('Thief Magic',[1]+list(range(2,21,2)))
  normal_extra=inline_options(aid,'Thief Talents',next(b for h,b in asections if h=='Thief Talents'),2);adv_extra=inline_options(aid,'Advanced Thief Talents',next(b for h,b in asections if h=='Advanced Thief Talents'),12)
  ad['extraOptions']=[dict(poolId=CID+':pool:thief-talents',options=normal_extra),dict(poolId=CID+':pool:thief-advanced-talents',options=normal_extra+adv_extra)]
 if key=='knife-master':
  a=manual_pool(aid,'sword-saint-talent','Sword Saint talent','Choose a legal Sword Saint talent modifying swordplay instead of this thief talent. Record its exact name and effects manually on the existing sheet; prerequisite and duplicate checks are manual.',10)['options'][0]
  a.update(minimumLevel=2,url=source(path)['url'])
  b={**a,'id':aid+':option:advanced-sword-saint-talent','name':'Advanced Sword Saint talent (manual selection)','minimumLevel':12,'description':'Choose a legal advanced Sword Saint talent modifying swordplay instead of this advanced talent. Record exact name/effects and verify prerequisites/duplicates manually.'}
  ad['extraOptions']=[dict(poolId=CID+':pool:thief-talents',options=[a]),dict(poolId=CID+':pool:thief-advanced-talents',options=[a,b])]
 if key=='saboteur':
  opts=inline_options(aid,'Saboteur Trap',next(b for h,b in asections if h=='Saboteur Trap'),2)
  snare=next(o for o in opts if o['name']=='Snare Trap')
  ad['features'].append(feature(aid,'Snare Trap',2,snare['description']))
  add_choices('Saboteur Trap',[2,4,6,8,10,14,16,18,20],[o for o in opts if o['name']!='Snare Trap'])
 if key=='skulking-slayer':
  # Optional racial feats replace the choice at the stated level, not an extra slot.
  ad['extraOptions']=[dict(poolId=CID+':pool:thief-talents',options=[dict(id=aid+':option:surprise-follow-through',name='Surprise Follow-Through (manual feat)',description='At2 you may choose this racial feat instead of a Thief Talent. Verify the source prerequisites manually and record the feat on the sheet.',minimumLevel=2,allowedLevels=[2],repeatLimit=1,featureIds=[],sourceRefs=refs('Bonus Feats'),manualPrerequisites=True)]),dict(poolId=CID+':pool:thief-advanced-talents',options=[dict(id=aid+':option:improved-surprise-follow-through',name='Improved Surprise Follow-Through (manual feat)',description='At12 you may choose this racial feat instead of an advanced Thief Talent. Verify prerequisites manually and record the feat on the sheet.',minimumLevel=12,allowedLevels=[12],repeatLimit=1,featureIds=[],sourceRefs=refs('Bonus Feats'),manualPrerequisites=True)])]
 # Resources use existing ability use counters; timing and conditional modifiers remain manual.
 resources={
 'combatant':[('Ki Pool',0,0,'wis',0,[max(1,l//2) for l in range(1,21)])],
 'rogue':[('Stamina Pools',0,.5,'con',1,None)],
 'street-magician':[('Magic Pool',0,.5,'int',0,None)],
 'time-bandit':[('Motes of Time',0,1,None,0,None)],
 'burglar':[('Touch and Go',3,0,'int',0,None)],
 'deadly-courtesan':[('Bardic Performance',0,0,'cha',0,[max(0,l-1) for l in range(1,21)])],
 'solid-snake':[('Martial Flexibility',3,.5,None,0,None),('Interrogate',3,0,'int',0,None)],
 'saboteur':[('Saboteur Trap',0,.5,'int',0,None)],
 'merchant':[('Blessing of Prosperity',3,0,'cha',0,None),('Silver-Tongued Haggler',3,0,'cha',0,None),('Skew Favor',3,0,None,0,None)]}
 for fname,bas,per,ability,minimum,bylevel in resources.get(key,[]):
  f=next((f for f in ad['features'] if f['name']==fname),None)
  if f:ad['resources'].append(dict(featureId=f['id'],base=bas,perLevel=per,ability=ability,minimum=minimum,**({'byLevel':bylevel} if bylevel else {})))
 if key=='merchant':
  excluded=[o['id'] for o in talents if re.search(r'\bsneak attack\b',o['description'],re.I)]
  profile['excludedOptionNames']=[o['name'] for o in talents if o['id'] in excluded];profile['restrictionNotes']='Merchant cannot select talents enhancing sneak attack. The catalog conservatively hides talents mentioning sneak attack; consult source manually for exceptions.'
 # Sneak Attack is replaced by the actual alternative progression, not kept as an extra card.
 if key=='festivalist':
  f=next(f for f in ad['features'] if f['name']=='Sneak Attack');f['atLevel']=2
  ad['replacements'].append(dict(id=aid+':replacement:sneak-attack-progression',atClassLevel=1,operation='remove',scope='whole_feature',resolution='resolved',targetFeatureIds=[CID+':feature:sneak-attack'],replacementFeatureIds=[f['id']],sourceRefs=refs('Sneak Attack')))
 # If only a proficiency addition is given, do not erase inherited entries.
 # A card grants manual feat/spell/skill choices where no native source option list exists.
 dependencies([o for p in ad['choicePools'] for o in p['options']]+[o for p in ad.get('extraOptions',[]) for o in p['options']])
 ad['events']+=grant_events(ad['features'],ad['upgrades'])
 defn=dict(schemaVersion='comos.rules.v1',kind='archetype',id=aid,parentClassId=CID,name=name,sources=[source(path)],review=dict(state='needs_review',coverage='partial_manual',notes='Source-backed existing-field progression and manual reference cards; complex prerequisites, companions, subchoices and conditional effects manual.'),data=ad)
 (root/f'rules/classes/archetypes/thief-{key}.archetype.json').write_text(json.dumps(defn,indent=2)+'\n');arches.append(defn)
c['data']['archetypeIndex']=[dict(id=a['id'],name=a['name'],url=a['sources'][0]['url']) for a in arches]
(root/'rules/classes/thief.class.json').write_text(json.dumps(c,indent=2)+'\n')
(root/'docs/extraction/thief-family-replacement-audit.json').write_text(json.dumps(audit,indent=2)+'\n')
print(json.dumps(dict(talents=len(talents),normalTalents=len(normal),parentFeatures=len(features),archetypes=len(arches),auditItems=len(audit))))
