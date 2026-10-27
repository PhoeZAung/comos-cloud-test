#!/usr/bin/env python3
"""Offline staging validator. It does not import definitions or modify characters."""
import argparse, ast, json, math, sys
from fractions import Fraction
from pathlib import Path
try:
    from jsonschema import Draft202012Validator, FormatChecker
except ImportError:
    sys.exit('Install the optional validation requirements: python -m pip install -r tools/requirements.txt')
ROOT=Path(__file__).resolve().parents[1]
SCHEMA=json.loads((ROOT/'docs/COMOS_EXTRACTION_V3_SCHEMA.json').read_text())
VARIABLES={f'{a}_{suffix}' for a in ['STR','DEX','CON','INT','WIS','CHA'] for suffix in ['MOD','SCORE']}|{'CLASS_LEVEL','CHARACTER_LEVEL','CASTER_LEVEL','SPELL_LEVEL','FAVORED_SELECTIONS','CHOICE_RANK'}

def formula(expression, context, rounding='floor', minimum=None, maximum=None):
    """Bounded arithmetic only. No eval, attributes, arbitrary calls or executable code."""
    if not isinstance(expression,str) or not 0<len(expression)<=240: raise ValueError('Formula length must be 1–240.')
    tree=ast.parse(expression.strip(),mode='eval');steps=0
    def walk(n,depth=0):
        nonlocal steps
        steps+=1
        if steps>100 or depth>20:raise ValueError('Formula is too complex.')
        if isinstance(n,ast.Expression):result=walk(n.body,depth+1)
        elif isinstance(n,ast.Constant) and type(n.value) in [int,float] and math.isfinite(n.value):result=Fraction(str(n.value))
        elif isinstance(n,ast.Name):
            if n.id not in VARIABLES:raise ValueError('Unknown variable: '+n.id)
            if n.id not in context:raise ValueError('Missing variable: '+n.id)
            result=Fraction(str(context[n.id]))
        elif isinstance(n,ast.UnaryOp) and isinstance(n.op,(ast.UAdd,ast.USub)):result=walk(n.operand,depth+1)*(-1 if isinstance(n.op,ast.USub) else 1)
        elif isinstance(n,ast.BinOp) and isinstance(n.op,(ast.Add,ast.Sub,ast.Mult,ast.Div)):
            a,b=walk(n.left,depth+1),walk(n.right,depth+1)
            if isinstance(n.op,ast.Add):result=a+b
            elif isinstance(n.op,ast.Sub):result=a-b
            elif isinstance(n.op,ast.Mult):result=a*b
            elif b:result=a/b
            else:raise ValueError('Division by zero.')
        elif isinstance(n,ast.Call) and isinstance(n.func,ast.Name) and n.func.id in ['min','max','floor','ceil'] and not n.keywords:
            values=[walk(a,depth+1) for a in n.args]
            if n.func.id in ['floor','ceil'] and len(values)==1:result=Fraction(math.floor(values[0]) if n.func.id=='floor' else math.ceil(values[0]))
            elif n.func.id in ['min','max'] and 1<=len(values)<=8:result=min(values) if n.func.id=='min' else max(values)
            else:raise ValueError('Invalid arithmetic function arguments.')
        else:raise ValueError('Unsupported formula syntax.')
        if abs(result)>1000000:raise ValueError('Formula result exceeds bound.')
        return result
    value=walk(tree)
    if rounding=='floor':value=math.floor(value)
    elif rounding=='ceil':value=math.ceil(value)
    elif rounding!='none':raise ValueError('Unknown rounding mode.')
    if minimum is not None:value=max(value,Fraction(str(minimum)))
    if maximum is not None:value=min(value,Fraction(str(maximum)))
    return float(value) if isinstance(value,Fraction) and value.denominator!=1 else int(value)

def nodes(x,path=''):
    if isinstance(x,dict):
        yield path,x
        for k,v in x.items():yield from nodes(v,path+'/'+k.replace('~','~0').replace('/','~1'))
    elif isinstance(x,list):
        for i,v in enumerate(x):yield from nodes(v,path+'/'+str(i))

def definitions(doc):
    return [(p,n) for p,n in nodes(doc) if isinstance(n.get('id'),str) and n['id'].startswith('ffd20:') and (p=='' or 'name' in n or 'operation' in n or 'atClassLevel' in n)]

def validate(doc,ready=False,all_docs=None):
    errors=[('/'+ '/'.join(map(str,e.absolute_path))+': '+e.message) for e in Draft202012Validator(SCHEMA,format_checker=FormatChecker()).iter_errors(doc)]
    if errors:return errors
    source_ids=[s['id'] for s in doc['sources']]
    if len(source_ids)!=len(set(source_ids)):errors.append('/sources: duplicate source IDs')
    ids=[n['id'] for _,n in definitions(doc)]
    if len(ids)!=len(set(ids)):errors.append('/: duplicate definition IDs')
    deps={d['id']:d for d in doc['dependencies']}
    if len(deps)!=len(doc['dependencies']):errors.append('/dependencies: duplicate IDs')
    features={f['id']:f for f in doc['features']}
    # Component membership is a graph: no feature may contain itself, directly or indirectly.
    def component_cycle(id,stack):
        if id in stack:return True
        return any(component_cycle(child,stack|{id}) for child in features.get(id,{}).get('componentIds',[]) if child in features)
    if any(component_cycle(id,set()) for id in features):errors.append('/features: cyclic component references')
    for p,n in nodes(doc):
        if 'sourceId' in n and n['sourceId'] not in source_ids:errors.append(p+': undefined sourceId')
        if n.get('kind')=='formula' and 'expression' in n:
            try:formula(n['expression'],{k:10 for k in VARIABLES},n['rounding'],n['minimum'],n['maximum'])
            except Exception as e:errors.append(p+': '+str(e))
            if 'CLASS_LEVEL' in n['expression'] and not n['classId']:errors.append(p+': CLASS_LEVEL requires classId')
            if n['minimum'] is not None and n['maximum'] is not None and n['minimum']>n['maximum']:errors.append(p+': minimum exceeds maximum')
        if n.get('kind')=='level_table':
            values=[r['from'] for r in n['rows']]
            if values!=sorted(set(values)):errors.append(p+': level-table rows must be unique and increasing')
            if n['levelBasis']=='class_level' and not n['classId']:errors.append(p+': class level table requires classId')
        if 'activation' in n and n['activation']=='passive' and any(a['actionType']!='passive' for a in n['actions']):errors.append(p+': passive feature has an active action; split it or use mixed')
        if 'choicePoolIds' in n and 'choiceCount' in n and n['choicePoolIds'] and n['choiceCount'] is None:errors.append(p+': feature choice needs an explicit choiceCount')
        if 'automation' in n and n.get('operation') and n['automation']=='automatic' and n.get('condition') is not None:errors.append(p+': conditional effect cannot be unconditional automatic')
        if 'effectiveClassId' in n and 'scopeFeatureIds' in n and not n['scopeFeatureIds'] and not n['scopePoolIds']:errors.append(p+': effective-level binding must have an explicit scope')
        if n.get('operation')=='replace' and n.get('resolution')=='resolved':
            if not n['targetFeatureIds'] and not n['targetEventIds']:errors.append(p+': resolved replacement has no exact target')
            if n['scope']=='listed_events' and (not n['targetEventIds'] or n['targetFeatureIds']):errors.append(p+': event replacement must target events only')
        if 'diceCount' in n and (n['diceCount'] is None)!=(n['dieSides'] is None):errors.append(p+': dice count and sides must both be present or absent')
    if doc['kind']=='class':
        levels=[r['level'] for r in doc['data']['progression']]
        if levels!=sorted(set(levels)):errors.append('/data/progression: duplicate or unsorted levels')
        cap=doc['data']['maxLevel']
        if cap and any(v>cap for v in levels+[e['atClassLevel'] for e in doc['data']['events']]):errors.append('/data: progression or event exceeds maxLevel')
        if ready and any(any(r[k] is None for k in ['bab','fortitude','reflex','will']) for r in doc['data']['progression']):errors.append('/data/progression: ready class base combat values cannot be unknown')
        if ready and doc['data']['skillRanksPerLevel'] is None:errors.append('/data/skillRanksPerLevel: ready class skill budget is unknown')
        if ready and (cap is None or levels!=list(range(1,cap+1))):errors.append('/data/progression: ready classes need all actual class levels')
    if doc['kind']=='race':
        d=doc['data']
        if set(d['standardTraitIds'])&set(d['alternateTraitIds']):errors.append('/data: standard and alternate IDs overlap')
        for h in d['heritages']:
            if h['abilityAdjustmentMode']=='replace_racial_vector' and not h['replacements']:errors.append('/data/heritages: stat replacement needs an explicit replacement rule')
    if ready:
        review=doc['review']
        audit=doc.get('extractionAudit',{})
        if audit and (audit.get('truncationSuspected') or audit.get('unresolvedUrls') or audit.get('expectedEntityCount') is None or audit.get('expectedEntityCount')!=audit.get('emittedEntityCount')):errors.append('/extractionAudit: source completeness is unresolved')
        if review['state']!='reviewed' or review['coverage']!='complete' or not review['reviewedBy'] or not review['reviewedOn'] or any(i['blocking'] for i in review['issues']):errors.append('/review: not independently reviewed, complete and unblocked')
        if not review['sectionInventory']:errors.append('/review/sectionInventory: ready records need coverage evidence')
        if any('example.invalid' in s['url'] for s in doc['sources']):errors.append('/sources: placeholder source URL')
        docs=all_docs or [doc];global_ids={n['id'] for x in docs for _,n in definitions(x)};by_root={x['id']:x for x in docs}
        for dep in doc['dependencies']:
            target=by_root.get(dep['id'])
            if dep['required'] and (not target or dep['revision'] is None or target['revision']!=dep['revision']):errors.append('/dependencies: missing/unpinned required dependency '+dep['id'])
            if dep['required'] and target and (target['review']['state']!='reviewed' or target['review']['coverage']!='complete' or any(i['blocking'] for i in target['review']['issues'])):errors.append('/dependencies: required dependency is not ready '+dep['id'])
        keys={'componentIds','featureIds','spellIds','choicePoolIds','poolIds','standardTraitIds','alternateTraitIds','targetFeatureIds','targetEventIds','removesComponents','addsFeatureIds','addsEventIds','catalogRefs','ownerIds','spellListIds','parentClassIds','archetypeIds','resourceId','parentClassId','classId','raceId','spellListId','bonusMpSystemId','ref','contextClassId','effectiveClassId','scopeFeatureIds','scopePoolIds'}
        for p,n in nodes(doc):
            if n.get('resolution')=='manual':errors.append(p+': replacement still unresolved')
            if n.get('activation')=='unresolved':errors.append(p+': activation still unresolved')
            for key in keys&set(n):
                values=n[key] if isinstance(n[key],list) else [n[key]]
                for value in values:
                    if value and value not in global_ids and (key!='ref' or value.startswith('ffd20:')):
                        optional=doc['kind']=='class' and key in ['archetypeIds','parentClassIds'] and any(not d['required'] and (value==d['id'] or value.startswith(d['id']+':')) for d in doc['dependencies'])
                        if not optional:errors.append(p+'/'+key+': unresolved ID '+value)
    return errors

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('files',nargs='*');p.add_argument('--ready',action='store_true');a=p.parse_args()
    paths=[Path(s) for s in a.files] if a.files else sorted((ROOT/'rules/races').glob('*.race.json'))
    Draft202012Validator.check_schema(SCHEMA)
    loaded=[json.loads(f.read_text()) for f in paths];pairs=[(path,doc) for path,value in zip(paths,loaded) for doc in (value if isinstance(value,list) else [value])];docs=[doc for _,doc in pairs];failed=False
    for path,doc in pairs:
        errors=validate(doc,a.ready,docs)
        if errors:
            failed=True;print('FAIL',path.name)
            for error in errors:print(' ',error)
        else:print('PASS',path.name,'— '+('ready gate' if a.ready else 'staging structure only; not import approval'))
    return 1 if failed else 0
if __name__=='__main__':sys.exit(main())
