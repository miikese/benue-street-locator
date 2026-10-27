"""Deterministic provider fixtures verify timing, town scope, stale results and fallback."""
import os,re,time
from urllib.parse import parse_qs,urlparse
from playwright.sync_api import sync_playwright,expect
BASE=os.environ.get('APP_URL','http://127.0.0.1:3101')
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/google-chrome',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':900});errors=[];requests=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 def respond(route):
  params=parse_qs(urlparse(route.request.url).query);requests.append(params)
  term=params.get('q',[''])[0]
  if term=='failure':return route.fulfill(status=503,json={'error':'Provider unavailable'})
  return route.fulfill(json={'results':[{'id':'map:test:42','kind':'map-result','status':'map-reference','created':'','updated':'','data':{'name':'Library fixture','lat':7.19,'lng':8.13,'address':'Otukpo','town':'Otukpo','lga':'Otukpo','category':'School'}}]})
 page.route('**/api/geocode?*',respond)
 page.goto(BASE);expect(page.locator('.place-row').first).to_be_visible()
 field=page.get_by_role('combobox',name='Search places');options=page.get_by_role('listbox',name='Related places')
 page.get_by_role('combobox',name='Filter by LGA').select_option('Otukpo')
 field.fill('l');expect(options.get_by_role('option',name=re.compile('LEEF Centre'))).to_be_visible()
 page.wait_for_timeout(950);assert not requests,requests
 field.fill('Li');page.wait_for_timeout(950);assert not requests,requests
 field.fill('Lib');page.wait_for_timeout(200);field.fill('Libr');page.wait_for_timeout(200);field.fill('Library')
 expect(options.get_by_role('option',name=re.compile('Library fixture'))).to_be_visible(timeout=5000)
 assert len(requests)==1 and requests[0]['q']==['Library'] and requests[0]['lga']==['Otukpo'],requests
 field.press('ArrowDown');field.press('Enter');expect(page.get_by_role('dialog',name='Library fixture')).to_be_visible();page.keyboard.press('Escape');expect(options).to_have_count(0)
 field.fill('Library');expect(options.get_by_role('option',name=re.compile('Library fixture'))).to_be_visible();page.wait_for_timeout(900);assert len(requests)==1
 field.fill('failure');expect(page.get_by_text(re.compile('Live map suggestions unavailable'))).to_be_visible(timeout=5000)
 field.fill('l');expect(options.get_by_role('option',name=re.compile('LEEF Centre'))).to_be_visible()
 field.fill('Leef center');field.press('Escape');page.wait_for_timeout(900);assert len(requests)==2,requests
 field.fill('7.179556, 8.153785');page.wait_for_timeout(900);expect(options).to_have_count(0);assert len(requests)==2
 field.fill('l');expect(options).to_be_visible();page.get_by_role('combobox',name='Filter by LGA').select_option('Makurdi');field.focus();expect(options).to_have_count(0)
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 browser.close();print('PASS: first-letter local results, 3-letter debounce, selected LGA, live keyboard selection, cache, failure fallback, Escape cancellation, coordinate exclusion, filter changes and mobile layout. Provider results are test fixtures.')
