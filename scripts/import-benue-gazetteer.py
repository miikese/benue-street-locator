"""Build a small attributed Benue locality snapshot from GeoNames download files.
Usage: python3 scripts/import-benue-gazetteer.py NG.txt admin1CodesASCII.txt admin2Codes.txt
Downloads are supplied explicitly; this script makes no network calls.
"""
import json,sys,collections,unicodedata
from pathlib import Path
root=Path(__file__).resolve().parent.parent
country_path,admin1_path,admin2_path=map(Path,sys.argv[1:4])
normalize=lambda s:''.join(c for c in unicodedata.normalize('NFKD',s).lower() if c.isalnum())
lgas=['Ado','Agatu','Apa','Buruku','Gboko','Guma','Gwer East','Gwer West','Katsina-Ala','Konshisha','Kwande','Logo','Makurdi','Obi','Ogbadibo','Ohimini','Oju','Okpokwu','Otukpo','Tarka','Ukum','Ushongo','Vandeikya']
lookup={normalize(name):name for name in lgas}
# Preserve recognisable display names for spelling variants in the upstream admin table.
lookup.update({'bukuru':'Buruku','markurdi':'Makurdi','oturkpo':'Otukpo'})
admin1={r.split('\t')[0]:r.split('\t')[1] for r in admin1_path.read_text().splitlines()}
admin2={}
for line in admin2_path.read_text().splitlines():
 fields=line.split('\t');name=fields[1].replace(' Local Government Area','')
 if fields[0].startswith('NG.') and normalize(name) in lookup:admin2[fields[0]]=lookup[normalize(name)]
groups=collections.defaultdict(list)
for line in country_path.read_text().splitlines():
 r=line.split('\t')
 if len(r)<19 or r[8]!='NG' or admin1.get('NG.'+r[10])!='Benue State' or r[6]!='P' or r[7] not in ['PPLA','PPLA2','PPL']:continue
 lga=admin2.get('NG.'+r[10]+'.'+r[11]);lat,lng=float(r[4]),float(r[5])
 if not lga or not(6.3<=lat<=8.6 and 7.2<=lng<=10.1):continue
 groups[lga].append(r)
seed=json.loads((root/'lib/directory-seed.json').read_text())
seed=[r for r in seed if r['data'].get('source')!='GeoNames']
known={(normalize(r['data']['name']),r['data']['lga']) for r in seed+json.loads((root/'lib/osm-seed.json').read_text())}
preferred={'Gboko':{'Mkar','Yandev'},'Guma':{'Agasha','Daudu'},'Logo':{'Anyiin'},'Makurdi':{'Apir'},'Ogbadibo':{'Orokam'},'Okpokwu':{'Ichama'},'Otukpo':{'Adoka'},'Kwande':{'Jato Aka'}}
selected=[]
for lga in lgas:
 choices=sorted(groups[lga],key=lambda r:(0 if r[7] in ['PPLA','PPLA2'] else 1 if r[1] in preferred.get(lga,set()) else 2,-int(r[14] or '0'),r[1],r[0]))
 count=0
 for r in choices:
  key=(normalize(r[1]),lga)
  if key in known:continue
  if count and r[1] not in preferred.get(lga,set()) and int(r[14] or "0")<10000:continue
  known.add(key);count+=1
  selected.append({'id':'geonames-'+r[0],'kind':'place','status':'approved','data':{'name':r[1],'aliases':', '.join(dict.fromkeys([r[2],*r[3].split(',')]))[:300],'category':'Landmark','lga':lga,'town':r[1],'address':f'{r[1]}, {lga} LGA, Benue State, Nigeria','description':f'A GeoNames populated-place reference for {r[1]}. The pin identifies a settlement reference point, not a business, building entrance or official street address. LGA follows the source administrative metadata. Confirm local spelling and your destination before travelling.','lat':float(r[4]),'lng':float(r[5]),'source':'GeoNames','sourceUrl':'https://www.geonames.org/'+r[0]+'/','sourceCheckedAt':'2026-10-27','sourceModifiedAt':r[18],'verification':'Town reference · not a building entrance','sourceLicense':'CC BY 4.0','sourceFeatureCode':r[7]}})
  if count==3:break
print('Locality records:',len(selected),'LGAs:',len({r['data']['lga'] for r in selected}))
for lga in lgas:print(lga,':',', '.join(r['data']['name'] for r in selected if r['data']['lga']==lga))
assert len({r['data']['lga'] for r in selected})==23,'Do not publish partial region coverage silently.'
(root/'lib/directory-seed.json').write_text(json.dumps(seed+selected,ensure_ascii=False,indent=2)+'\n')
