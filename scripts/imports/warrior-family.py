"""Source-backed Warrior family sheet definitions. python3 scripts/imports/warrior-family.py /absolute/archive/pages
Writes only Warrior-owned data; runtime/manifests are integrated separately.
"""
from pathlib import Path
import sys,re,json,hashlib
ROOT=Path(__file__).resolve().parents[2]; CACHE=Path(sys.argv[1]); BASE=CACHE/'classes/core-classes/warrior'; CID='ffd20:class:warrior'; audit=[]
def clean(s):
 s=re.sub(r'\[([^]]*)\]\([^)]*\)',r'\1',s);return s.replace('*','').replace('\xa0',' ').strip()
def slug(s):return re.sub('[^a-z0-9]+','-',clean(s).lower().replace('+',' plus ')).strip('-')
def norm(s):return re.sub('[^a-z0-9]+',' ',clean(s).lower()).strip()
def title(s):return re.sub(r'\s*\((?:Ex|Su|Sp)(?:[^)]*)\)\s*','',clean(s)).strip()
def sections(s):return [(title(h),b.strip()) for h,b in re.findall(r'^### ([^\n]+)\n(.*?)(?=^### |\Z)',s,re.M|re.S)]
def source(p,key='main'):
 s=p.read_text();return dict(id=key,url=s.splitlines()[0][8:],title=next(clean(l[2:]) for l in s.splitlines() if l.startswith('# ')),archiveSha256=hashlib.sha256(p.read_bytes()).hexdigest(),sourceKind='official_web',retrievedOn='2026-10-29')
def refs(section,key='main'):return [dict(sourceId=key,section=section,locator=slug(section))]
def feat(prefix,name,level,body,kind='class_feature',section=None):return dict(id=prefix+':feature:'+slug(name),name=name,atLevel=level,description=body+'\nSheet support: conditional combat bonuses, temporary forms, equipment, prerequisites and any extra subchoices are applied manually using existing sheet entries.',activation='mixed' if re.search(r'\baction\b|per day|rounds per day',body,re.I) else 'passive',featureKind=kind,automation='manual',sourceRefs=refs(section or name))
def first_level(body,fallback=1):
 m=re.search(r'\b(\d+)(?:st|nd|rd|th)(?:\s+and\s+\d+(?:st|nd|rd|th))?(?:\s+warrior)?\s+level',clean(body),re.I)
 return max(1,min(20,int(m[1]))) if m else fallback
main=(BASE/'index.md').read_text();sec=sections(main);byname=dict(sec);levels=[];acquired={};states={}
for line in main.splitlines():
 if not re.match(r'^\|\s*\d+(?:st|nd|rd|th)\s*\|',line):continue
 cells=[x.strip() for x in line.strip('|').split('|')];lv=int(re.match(r'\d+',cells[0])[0]);bab=int(re.search(r'\d+',cells[1])[0]);special=clean(cells[5]);levels.append(dict(level=lv,bab=bab,iterativeAttacks=list(range(bab,0,-5)),fort=int(cells[2].lstrip('+')),ref=int(cells[3].lstrip('+')),will=int(cells[4].lstrip('+')),baseMp=0,maxSpellLevel=0,special=special,sourceRefs=refs('Table: Warrior')))
 for name,anchor in re.findall(r'\[([^]]+)\]\(#([^)]*)\)',cells[5]):acquired.setdefault(anchor,lv)
 for part in cells[5].split(', '):
  m=re.match(r'\[([^]]+)\]\(#([^)]*)\)\s*(.*)',part)
  if m and m[3]:states.setdefault(m[2],[]).append((lv,clean(m[3])))
features=[]
for name,body in sec:
 if name=='Limit Breaks':
  for label,desc in re.findall(r'^\*(?! )([^\n]+?):\*\s*(.*?)(?=\n\n\*|\Z)',body,re.M|re.S):features.append(feat(CID,title(label),1,desc,'limit_break',name))
  continue
 lv=acquired.get(slug(name),first_level(body));features.append(feat(CID,name,lv,body))
# Separate replacement-addressable components, preserving the source's stamina and three ordinary techniques.
tech=next(f for f in features if f['name']=='Warrior Techniques');rawtech=byname['Warrior Techniques'];tech['description']='At 3rd level the warrior gains the source Warrior Techniques. Stamina and individual techniques are separate cards for exact archetype replacement.\n'+rawtech.split('\n\nBy spending',1)[0]
for name in ['Delay Fatigue','Increase Save','Overhand Chop']:
 match=re.search(r'\*\s*'+re.escape(name)+r'\s*\([^\n]+?\):\*\s*(.*?)(?=\n\*|\Z)',rawtech,re.S)
 if not match:match=re.search(r'\*\s*'+re.escape(name)+r'.*?:\*\s*(.*?)(?=\n\*|\Z)',rawtech,re.S)
 desc=match[1] if match else next((clean(line) for line in rawtech.splitlines() if name in line),name)
 features.append(feat(CID,name,3,desc,section='Warrior Techniques'))
features.append(feat(CID,'Stamina Pool',3,'The Warrior Techniques stamina pool contains half the warrior level + Constitution modifier (minimum 1). It refreshes after a full eight hours of rest.',section='Warrior Techniques'))
upgrades=[]
for key,rows in states.items():
 f=next((f for f in features if slug(f['name'])==key),None)
 if not f:continue
 for lv,label in rows:
  if lv>f['atLevel']:upgrades.append(dict(id=CID+':upgrade:'+key+':'+str(lv),featureId=f['id'],atClassLevel=lv,changes={'progression':label},sourceRefs=refs('Table: Warrior')))
options=[];tier='normal'
for line in (BASE/'warrior-talents/index.md').read_text().splitlines():
 if re.match(r'^##\s',line) and re.search('Advanced',line,re.I):tier='advanced'
 if not line.startswith('|'):continue
 cells=[x.strip() for x in line.strip('|').split('|')]
 if len(cells)!=3 or not cells[0] or re.match(r'[-: ]+$',cells[0]) or clean(cells[1]).lower()=='prerequisites' or clean(cells[0]).lower() in ['name','talent','warrior talents','warrior talent']:continue
 name=re.sub(r'\s+(?:Ex|Su|Sp)\)$','',title(cells[0]));req=clean(cells[1]);minimum=max([12 if tier=='advanced' else 2]+[int(x) for x in re.findall(r'Warrior (?:Level )?(\d+)',req,re.I)])
 options.append(dict(id=CID+':talent:'+slug(name),name=name,description=cells[2]+'\nPrerequisites: '+req+'. Check any external feat, equipment, score and extra subchoice manually.',minimumLevel=minimum,repeatLimit=20 if re.search('multiple times|more than once',cells[2],re.I) else 1,featureIds=[],prerequisiteText=req,manualPrerequisites=True,sourceRefs=refs(name,'warrior-talents'),url=source(BASE/'warrior-talents/index.md')['url']))
# Record prerequisites involving owned talent options without attempting external feat checks.
for o in options:
 req=norm(o['prerequisiteText']);needs=[]
 if ' or ' not in req:
  for other in sorted(options,key=lambda x:-len(x['name'])):
   if other['id']!=o['id'] and re.search(r'\b'+re.escape(norm(other['name']))+r'\b',req):needs.append(other['id']);req=re.sub(r'\b'+re.escape(norm(other['name']))+r'\b',' owned ',req)
 if needs:o['requiresOptionIds']=needs
pools=[dict(id=CID+':pool:warrior-talents',name='Warrior Talent',options=options)]
chosen=byname['Chosen Weapon'];weapons=[]
for line in chosen.splitlines():
 m=re.match(r'^\*\*([^*]+)\*\*:\s*(.*)',line)
 if m:weapons.append(dict(id=CID+':option:chosen-weapon:'+slug(m[1]),name=m[1],description=m[2]+'\nChosen Weapon bonuses are conditional and applied manually.',minimumLevel=1,repeatLimit=1,featureIds=[],sourceRefs=refs('Chosen Weapon'),url=source(BASE/'index.md')['url']))
pools.append(dict(id=CID+':pool:chosen-weapon',name='Chosen Weapon Group',options=weapons))
maneuvers=['Bull Rush','Dirty Trick','Disarm','Drag','Grapple','Overrun','Reposition','Steal','Sunder','Trip']
for name,lv,prefix in [('Combat Defenses',1,''),('Combat Offenses',2,'Improved ')]:
 pools.append(dict(id=CID+':pool:'+slug(name),name=name,options=[dict(id=CID+':option:'+slug(name)+':'+slug(n),name=prefix+n,description=byname[name]+'\nSelected maneuver: '+prefix+n+'. Later legal changes are recorded manually on this ability card.',minimumLevel=lv,repeatLimit=1,featureIds=[],sourceRefs=refs(name)) for n in maneuvers]))
events=[dict(id=CID+':event:grant:'+f['id'].split(':feature:')[-1],type='grant_feature',atClassLevel=f['atLevel'],featureId=f['id'],sourceRefs=f['sourceRefs']) for f in features]+[dict(id=CID+':event:upgrade:'+u['id'].split(':upgrade:')[-1],type='upgrade_feature',atClassLevel=u['atClassLevel'],featureId=u['featureId'],upgradeId=u['id'],sourceRefs=u['sourceRefs']) for u in upgrades]
def choose(prefix,pool,lv):return dict(id=prefix+':event:'+pool.split(':pool:')[-1]+':'+str(lv),type='choose',atClassLevel=lv,poolIds=[pool],count={'kind':'constant','value':1},sourceRefs=refs(pool.split(':pool:')[-1]))
events += [choose(CID,CID+':pool:warrior-talents',lv) for lv in range(2,21,2)]+[choose(CID,CID+':pool:chosen-weapon',1),choose(CID,CID+':pool:combat-defenses',1),choose(CID,CID+':pool:combat-offenses',2)]
D=dict(category='core',maximumLevel=20,supportedLevels=list(range(1,21)),alignment='Any',hitDie=10,skillRanksPerLevel=4,classSkills=['acrobatics','climb','craft:*','handle-animal','intimidate','knowledge:dungeoneering','profession:*','ride','survival','swim'],startingWealth=175,proficiencies=['Simple weapons','Martial weapons','Light armor','Medium armor','Heavy armor','Shields except tower shields'],spellcasting={'learningMode':'none'},levels=levels,features=features,upgrades=upgrades,events=events,choicePools=pools,resources=[dict(featureId=CID+':feature:stamina-pool',base=0,perLevel=0.5,ability='con',minimum=1),dict(featureId=CID+':feature:martial-flexibility',base=3,perLevel=0.5,minimum=0),dict(featureId=CID+':feature:doublestrike',base=1,perLevel=0,minimum=1)])
C=dict(schemaVersion='comos.rules.v1',kind='class',id=CID,name='Warrior',revision=1,sources=[source(BASE/'index.md'),source(BASE/'warrior-talents/index.md','warrior-talents')],review={'state':'needs_review','coverage':'partial_manual','issues':[{'path':'/data','blocking':True,'reason':'Source-backed campaign sheet support; conditional combat effects, external prerequisites, equipment, companions and subchoices manual. Not independently fully reviewed.'}]},data=D)
aliases={norm(f['name']):[f['id']] for f in features};aliases.update({'combat defences':[CID+':feature:combat-defenses'],'additional tech ii':[CID+':feature:additional-techs-ii'],'weapon adaptation':[CID+':feature:weapon-adaption'],'weapon proficiencies':[CID+':feature:weapon-and-armor-proficiency'],'weapon and armor proficiencies':[CID+':feature:weapon-and-armor-proficiency'],'armor proficiencies':[CID+':feature:weapon-and-armor-proficiency'],'warrior s standard weapon and armor proficiencies':[CID+':feature:weapon-and-armor-proficiency'],'limit breaks':[CID+':feature:critical-strikes',CID+':feature:omnistrike'],'warrior techniques':[CID+':feature:'+slug(n) for n in ['Warrior Techniques','Stamina Pool','Delay Fatigue','Increase Save','Overhand Chop']]})
base_byid={f['id']:f for f in features};arches=[]
for path in sorted((BASE/'archetypes').glob('*/index.md')):
 key=path.parent.name;aid='ffd20:archetype:warrior:'+key;sr=source(path);asec=sections(path.read_text());data=dict(supportedLevels=list(range(1,21)),features=[],upgrades=[],replacements=[],choicePools=[],events=[],profile={},resources=[],extraOptions=[])
 for heading,body in asec:
  at=first_level(body,next((f['atLevel'] for f in features if norm(f['name'])==norm(heading)),1));hkey=slug(heading)
  # Static prerequisite/proficiency/skill cards are granted at first level, not at an example level in their text.
  if hkey in ['prerequisite','prerequisites','class-skills','weapon-and-armor-proficiency','weapon-proficiency','armor-proficiency']:at=1
  added=[]
  if hkey in ['limit-break','limit-breaks'] and 'receives' in clean(body).lower():
   for label,desc in re.findall(r'^\*(?! )([^\n]+?):\*\s*(.*?)(?=\n\n\*|\Z)',body,re.M|re.S):
    f=feat(aid,title(label),1,desc,'limit_break',heading);data['features'].append(f);added.append(f['id'])
  if not added:
   f=feat(aid,'Finisher amendments' if hkey in ['limit-break','limit-breaks'] else heading,at,body,section=heading);data['features'].append(f);added=[f['id']]
  replacement_sentences=re.findall(r'(?m)^(?:(?:This|These) (?:ability|abilities)|This replaces|It replaces)[^\n]*(?:replaces?|modifies?|alters?|changes?)[^\n]*',clean(body),re.I)
  for num,text in enumerate(replacement_sentences):
   if re.search(r'\breplaces?\b',text,re.I) and not re.search(r'modifies and may replace',text,re.I):text=re.split(r',?\s+and\s+(?:modifies|changes|alters)\b',text,flags=re.I)[0]
   op='replace' if re.search(r'\breplaces?\b',text,re.I) else 'modify';optional=bool(re.search(r'\bmay replace\b|\bmodif|\balter|\bchanges',text,re.I));remaining=norm(text).replace('from warrior techniques','').replace('stamina pool of warrior techniques','stamina pool');targets=[];tevents=[]
   # Talent schedule replacements use exact acquired event slots, not the entire pool.
   if re.search(r'warrior talents?|advanced talents?',remaining):
    specified=[int(x) for x in re.findall(r'(\d+)(?:st|nd|rd|th)',text)]
    if re.search('every four',text,re.I) and specified:specified=list(range(min(specified),21,4))
    elif re.search('every two',text,re.I) and specified:specified=list(range(min(specified),21,2))
    elif not specified:specified=list(range(12 if ('advanced' in remaining and 'warrior talent' not in remaining) else 2,21,2))
    tevents=[e['id'] for e in events if e['type']=='choose' and e['poolIds']==[CID+':pool:warrior-talents'] and e['atClassLevel'] in specified];remaining=re.sub(r'(?:advanced )?warrior talents?|advanced talents?','',remaining)
   for alias,ids in sorted(aliases.items(),key=lambda x:-len(x[0])):
    if re.search(r'\b'+re.escape(alias)+r'\b',remaining):targets+=ids;remaining=re.sub(r'\b'+re.escape(alias)+r'\b',' ',remaining)
   targets=list(dict.fromkeys(targets));target_only=bool(tevents and not targets)
   # Unknown or partial changes stay manual rather than removing an unrelated parent feature.
   if not targets and not tevents:
    audit.append(dict(archetype=key,section=heading,kind='unresolved-replacement',text=text));data['features'][-1]['description']+='\nReplacement audit: this statement needs manual reconciliation with the parent sheet; no unverified parent feature is removed.';continue
   if optional:audit.append(dict(archetype=key,section=heading,kind='manual-modification-or-optional-replacement',text=text))
   data['replacements'].append(dict(id=aid+':replacement:'+hkey+':'+str(num),atClassLevel=1 if not optional else at,operation=op,scope='whole_feature',resolution='needs_review' if optional else 'resolved',targetFeatureIds=targets or [CID+':feature:warrior-talents'],targetEventIds=tevents,eventOnly=target_only,replacementFeatureIds=added,sourceRefs=refs(heading),description=text))
  if hkey in ['prerequisite','prerequisites']:data['profile']['prerequisiteText']=clean(body)
 # Profiles and source-specific simple restrictions.
 if key in ['airborne-ambusher','gladiator','nimble-striker','viking']:data['profile']['proficiencies']=[p for p in D['proficiencies'] if p!='Heavy armor']
 if key=='defender':data['profile']['proficiencies']=D['proficiencies']+['Tower shields']
 if key=='swarm-fighter':data['profile'].update(proficiencies=[p for p in D['proficiencies'] if p not in ['Heavy armor','Shields except tower shields']],requiredRacialTraitNames=['Swarming'])
 if key=='demon-hunter':data['profile'].update(proficiencies=D['proficiencies']+['Simple firearms'],classSkills=[s for s in D['classSkills'] if s not in ['handle-animal','knowledge:dungeoneering','ride']]+['bluff','fly','knowledge:planes','sense-motive','use-magic-device'])
 if key=='talekeeper':data['profile']['classSkills']=[s for s in D['classSkills'] if s not in ['handle-animal','knowledge:dungeoneering']]+['knowledge:history','perform:*']
 if key=='sea-wolf':data['profile']['classSkills']=[s for s in D['classSkills'] if s not in ['knowledge:dungeoneering','ride']]+['navigate','pilot']
 if key=='gladiator':data['profile']['classSkills']=D['classSkills']+['perform:*']
 if key=='shinsect':data['profile'].update(classSkills=[s for s in D['classSkills'] if s not in ['handle-animal','knowledge:dungeoneering','ride']]+['perception','sense-motive','diplomacy'],proficiencies=['Simple weapons','Small firearms','Tonfas','Light armor','Medium armor','Heavy armor','Tower shields'])
 # Native optional replacements reuse the existing talent event slots, without granting extra talents.
 def extra_manual(name,desc,minimum=2,allowed=None):
  option=dict(id=aid+':option:'+slug(name),name=name,description=desc+'\nManual selection: write the exact selected option/feat and verify its prerequisites on existing sheet entries.',minimumLevel=minimum,repeatLimit=10,featureIds=[],sourceRefs=refs(name),url=sr['url'],manualPrerequisites=True)
  if allowed:option['allowedLevels']=allowed
  data['extraOptions'].append(dict(poolId=CID+':pool:warrior-talents',options=[option]))
 if key=='airborne-ambusher':extra_manual('Combat Flyer feat (manual choice)',dict(asec)['Combat Flyer'],2,[2])
 if key=='viking':extra_manual('Rage Power (manual choice)',dict(asec)['Rage Powers'],6)
 if key=='talekeeper':extra_manual('Song talent or bardic performance (manual choice)',dict(asec)['Story, Song, and Sword'],2)
 if key=='feral-guardian':extra_manual('Beastmaster trick (manual choice)',dict(asec)['Warrior Talents'],2)
 if key=='shinsect':
  extra_manual('ShinSect Talent (manual choice)',dict(asec)['ShinSect Talent'],4,[4,6,8,10]);extra_manual('Advanced ShinSect Talent (manual choice)',dict(asec)['Advanced ShinSect Talents'],12)
 # Resolved mandatory replaced talent slots grant a separate explicit manual-choice selector where the source asks for a selection.
 for heading,body in asec:
  if slug(heading) not in ['awakened-heritage','demon-combat-styles','teamwork-fighting','bonus-feat','gladiator-style']:continue
  text=clean(body);at=first_level(body);lvlist=[]
  if slug(heading)=='awakened-heritage':lvlist=[2,6,10,14,18]
  elif slug(heading)=='demon-combat-styles':lvlist=[4,8,12,16]
  elif slug(heading)=='teamwork-fighting':lvlist=[4,8,12,16,20]
  elif slug(heading)=='bonus-feat' and key=='stylish-fighter':lvlist=[1,2,6,10,14,18]
  elif slug(heading)=='gladiator-style':lvlist=[1]
  if not lvlist:continue
  pid=aid+':pool:'+slug(heading);option=dict(id=aid+':option:'+slug(heading)+':manual',name=heading+' (manual selection)',description=body+'\nRecord the exact selected source option and any prerequisites on existing sheet entries.',minimumLevel=min(lvlist),repeatLimit=len(lvlist),featureIds=[],manualPrerequisites=True,sourceRefs=refs(heading),url=sr['url']);data['choicePools'].append(dict(id=pid,name=heading,options=[option]));data['events'] += [choose(aid,pid,lv) for lv in lvlist]
 # Source-backed daily counters that fit existing sheet resources.
 for f in data['features']:
  name=f['name'];r=None
  if name=='Stamina Pool':r=dict(base=0,perLevel=.5,ability='con',minimum=1)
  if name=='Galkan Tales':r=dict(base=2,perLevel=2,ability='wis',minimum=0)
  if name=='Partial-Priming':r=dict(base=2,perLevel=2,ability='con',minimum=0)
  if name in ['Thunderhammer','Hammerflight']:r=dict(base=3,perLevel=0,ability='wis',minimum=0)
  if name=='Thunderbolt':r=dict(byLevel=[0]*9+[1]*5+[2]*5+[3],base=0,perLevel=0,minimum=0)
  if name in ['Ride the Lightning','Storm Lord','Galkan Reincarnation','The Time Has Come','Devil Trigger – Majin Form']:r=dict(base=1,perLevel=0,minimum=1)
  if r:data['resources'].append(dict(featureId=f['id'],**r))
 # Partial technique replacements must preserve the remaining component cards and stamina.
 for op in data['replacements']:
  text=norm(op['description'])
  if key=='squire' and 'stamina pool of warrior techniques' in text:op['targetFeatureIds']=[CID+':feature:combat-defenses',CID+':feature:combat-offenses',CID+':feature:stamina-pool']
 # Fixed/restricted weapon groups and explicit source modifications use the ordinary group selector.
 restrict={'defender':['Close'],'foehammer':['Hammers','Flails'],'nimble-striker':['Blades, Light','Close'],'stormbreaker':['Hammers','Flails'],'draconic-warrior':['Natural']}
 if key in restrict:data['profile']['excludedOptionNames']=[o['name'] for o in weapons if o['name'] not in restrict[key]]
 if key in ['feral-guardian','first-shield']:data['profile']['excludedOptionNames']=[o['name'] for o in options if 'chosen weapon' in o['description'].lower()]
 if key=='first-shield':extra_manual('Rage Power (manual choice)',dict(asec)['Warrior Talents'],2)
 if key=='lanista':data['profile']['classSkills']=[s for s in D['classSkills'] if s!='handle-animal']+['perception']
 if key=='monster-hunter':data['profile']['classSkills']=[s for s in D['classSkills'] if s not in ['handle-animal','knowledge:dungeoneering']]+['diplomacy','knowledge:local','perception']
 if key in ['defender','demon-hunter','draconic-warrior','foehammer','sea-wolf','swarm-fighter']:data['resources'].append(dict(featureId=CID+':feature:war-cry',base=3,perLevel=0,ability='con',minimum=0))
 for f in data['features']:
  if key=='shinsect' and f['name']=='Small Arms Expertise':f['atLevel']=3
  if key=='dragonwarrior' and f['name']=='Dragonwarrior Techniques':
   for op in data['replacements']:
    if op['replacementFeatureIds']==[f['id']]:op.update(resolution='resolved',targetFeatureIds=[CID+':feature:'+slug(n) for n in ['Warrior Techniques','Delay Fatigue','Increase Save','Overhand Chop']],atClassLevel=1)
  if f['name']=='Martial Flexibility':data['resources'].append(dict(featureId=f['id'],base=3,perLevel=.5,minimum=0))
  if f['name']=='Defensive Roll':data['resources'].append(dict(featureId=f['id'],base=1,perLevel=0,minimum=1))
 definition=dict(schemaVersion='comos.rules.v1',kind='archetype',id=aid,parentClassId=CID,name=sr['title'],sources=[sr],review={'state':'needs_review','coverage':'partial_manual','notes':'Source-backed sheet replacements and progression. External prerequisites, optional replacements, companions, complex combat effects and extra named subchoices manual.'},data=data)
 (ROOT/f'rules/classes/archetypes/warrior-{key}.archetype.json').write_text(json.dumps(definition,indent=2)+'\n');arches.append(definition)
D['archetypeIndex']=[dict(id=a['id'],name=a['name'],url=a['sources'][0]['url']) for a in arches]
(ROOT/'rules/classes/warrior.class.json').write_text(json.dumps(C,indent=2)+'\n');(ROOT/'docs/extraction/warrior-family-audit.json').write_text(json.dumps(audit,indent=2)+'\n');print(json.dumps(dict(features=len(features),talents=len(options),weaponGroups=len(weapons),archetypes=len(arches),audit=len(audit))))
