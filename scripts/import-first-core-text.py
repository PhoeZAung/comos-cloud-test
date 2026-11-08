"""Copy verbatim text from the verified Potato Markdown cache into existing rule records.
No class/archetype activation or mechanical mappings are inferred by this script.
"""
import argparse,hashlib,json,re,unicodedata
from pathlib import Path

def normalized(text):
 text=re.sub(r'\[([^\]]+)\]\([^)]*\)',r'\1',text)
 text=re.sub(r'\((?:Ex|Su|Sp)(?:\s+or\s+(?:Ex|Su|Sp))*\)','',text)
 return re.sub(r'[^a-z0-9]+','',unicodedata.normalize('NFKD',text).lower())

def sections(text):
 headings=[];position=0;result={}
 for line in text.splitlines(keepends=True):
  match=re.match(r'^(#{1,6})\s+(.+)',line)
  if match:headings.append((position,position+len(line),len(match[1]),match[2]))
  position+=len(line)
 for start,body,level,title in headings:
  end=next((p for p,b,l,t in headings if p>start and l<=level),len(text));result[normalized(title)]=text[body:end].strip()
  chunk=text[body:end];matches=list(re.finditer(r'(?m)^\*\s*(?:\*\s*)?([^\n]+?):\*\s*',chunk))
  for i,match in enumerate(matches):
   key=normalized(match.group(1))
   if key and len(key)<80:result.setdefault(key,chunk[match.start():matches[i+1].start() if i+1<len(matches) else len(chunk)].strip())
 for line in text.splitlines():
  if not line.lstrip().startswith('|'):continue
  cells=[cell.strip() for cell in line.strip().strip('|').split('|')]
  if len(cells)>=3 and not re.match(r'^[- :]+$',cells[0]):result.setdefault(normalized(cells[0]),cells[-1])
 return result

def source(path):
 text=path.read_text();return text,{'url':re.search(r'^Source: (.+)',text).group(1),'markdownSha256':hashlib.sha256(path.read_bytes()).hexdigest(),'archivedAt':re.search(r'^Archived \(UTC\): (.+)',text,re.M).group(1)}

def save(path,data):path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')

def main():
 args=argparse.ArgumentParser();args.add_argument('--source-root',type=Path,default=Path('/workspace/.source-cache/ffd20/cache/pages'));root=args.parse_args().source_root
 audit={'transferRepository':'PhoeZAung/ffd20-extractor','transferCommit':'c68a4c7ce8542be2be26f16eb78ff7424ff65c7b','archiveSha256':'1188bc35ba5888c8b85597103857955db5cb1621a2bf587ed70c9a602aac8347','classes':[],'archetypes':[]}
 for slug in ['archer','bard','beastmaster']:
  base=root/'classes/core-classes'/slug;page,provenance=source(base/'index.md');blocks=sections(page);path=Path('rules/classes/'+slug+'.class.json');definition=json.loads(path.read_text());count=0
  for feature in definition['data']['features']:
   key=normalized(feature['name']);assert key in blocks,(slug,feature['name']);text=blocks[key]
   if slug=='archer' and key in ['evasion','uncannydodge']:text+='\n\n'+blocks['improved'+key]
   feature['progressionDescription']=text;feature['sourceTextHash']=hashlib.sha256(text.encode()).hexdigest();count+=1
  if slug=='beastmaster':
   conflict=next(c for c in definition['data']['sourceConflicts'] if c['name']=='Natural Savagery')
   conflict.update(resolution='class_table_user_selected',effectiveIncrementLevels=[5,8,11,14,17,20],resolutionNote='User chose the class table on 2026-11-08; retain the conflicting source prose verbatim. Conditional bonuses remain manual.')
  definition['sourceTextProvenance']=provenance;save(path,definition)
  if slug in ['archer','bard']:
   talentText,talentProvenance=source(base/('archery-talents' if slug=='archer' else 'song-talents')/'index.md');talents=sections(talentText);path=Path('rules/classes/'+slug+'-talents.json');data=json.loads(path.read_text())
   for option in data['options']:
    key=normalized(option['name']);assert key in talents,(slug,option['name']);option['description']=talents[key]
   data['sourceTextProvenance']=talentProvenance;save(path,data)
  audit['classes'].append({'id':definition['id'],'name':definition['name'],'featureDescriptions':count,**provenance})
  # Audit source availability without falsely enabling unimplemented archetypes.
  for path in sorted((base/'archetypes').glob('*/index.md')):
   text,meta=source(path);title=re.search(r'^# (.+)',text,re.M).group(1)
   audit['archetypes'].append({'id':'ffd20:archetype:'+slug+':'+path.parent.name,'name':title,'parentClassId':definition['id'],**meta,'sourceAvailable':True,'mappingImplemented':False})
 assert len(audit['archetypes'])==48
 # Every indexed Bard song must resolve to one archived individual source page.
 index=(root/'magic/spells-by-class/bard/index.md').read_text();links={normalized(name):url for name,url in re.findall(r'\[([^\]]+)\]\((https?://[^)]+/magic/spells/[^)]+)\)',index)}
 catalog=json.loads(Path('rules/classes/bard-songs.json').read_text());full=[]
 for song in catalog['songs']:
  key=normalized(song['name']);url=links.get(key)
  assert url,(song['name'],'missing indexed link')
  from urllib.parse import urlparse
  text,meta=source(root/urlparse(url).path.strip('/')/'index.md');blocks=sections(text)
  assert 'description' in blocks,(song['name'],'missing individual description')
  full.append({'id':song['id'],'name':song['name'],'level':song['level'],'description':blocks['description'],**meta})
 save(Path('rules/classes/bard-full-text.json'),{'kind':'source_text','entries':full})
 audit['bardSongDescriptions']=len(full);save(Path('docs/extraction/first-three-core-source-audit.json'),audit)
 print(json.dumps({'classDescriptions':sum(c['featureDescriptions'] for c in audit['classes']),'archetypeSources':len(audit['archetypes']),'bardSongs':len(full)}))
if __name__=='__main__':main()
