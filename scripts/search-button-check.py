"""Regression: Search must display suggestions rather than dismiss them."""
import os,re,time
from urllib.parse import parse_qs,urlparse
from playwright.sync_api import sync_playwright,expect
BASE=os.environ.get('APP_URL','http://127.0.0.1:3101')
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/google-chrome',headless=True,args=['--no-sandbox','--disable-gpu','--renderer-process-limit=1'])
 page=b.new_page(viewport={'width':1440,'height':1000});page.set_default_timeout(15000);errors=[];requests=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 def respond(route):
  q=parse_qs(urlparse(route.request.url).query).get('q',[''])[0];requests.append(q)
  results=[] if q=='unmapped' else [{'id':'map:test:button','kind':'map-result','status':'map-reference','created':'','updated':'','data':{'name':'Library fixture','lat':7.19,'lng':8.13,'lga':'Otukpo','town':'Otukpo','category':'School'}}]
  route.fulfill(json={'results':results})
 page.route('**/api/geocode?*',respond)
 page.goto(BASE);expect(page.locator('.place-row').first).to_be_visible()
 page.get_by_role('combobox',name='Filter by LGA').select_option('Otukpo')
 field=page.get_by_role('combobox',name='Search places');options=page.get_by_role('listbox',name='Related places');search=page.get_by_role('button',name='Search',exact=True)
 field.fill('l');search.click();expect(options.get_by_role('option',name=re.compile('LEEF Centre'))).to_be_visible();expect(field).to_be_focused()
 field.press('Escape');expect(options).to_have_count(0);search.click();expect(options).to_be_visible()
 field.press('Enter');expect(options).to_be_visible();options.get_by_role('option',name=re.compile('LEEF Centre')).click();expect(page.get_by_role('dialog',name='LEEF Centre')).to_be_visible();page.keyboard.press('Escape')
 field.fill('Oro');field.press('Tab');page.keyboard.press('Tab');expect(search).to_be_focused();expect(options).to_be_visible();field.focus();field.press('ArrowDown');field.press('Enter');expect(page.get_by_role('dialog',name='Orokam Street')).to_be_visible();page.keyboard.press('Escape')
 # An explicit search immediately runs the prediction request, without a second independent lookup.
 field.fill('Library');search.click();expect(options.get_by_role('option',name=re.compile('Library fixture'))).to_be_visible();assert requests.count('Library')==1,requests
 field.fill('unmapped');search.click();expect(page.get_by_text('No matching names found yet',exact=True)).to_be_visible();link=page.locator('.place-search-empty').get_by_role('link',name='Search Google Maps');expect(link).to_have_attribute('href',re.compile('unmapped.*Otukpo'));page.get_by_role('heading',name='Find your way. Discover Benue.').click();expect(page.locator('.place-search-empty')).to_have_count(0)
 for width in [320,390]:
  page.set_viewport_size({'width':width,'height':850});field.fill('l');search.click();expect(options.get_by_role('option',name=re.compile('LEEF Centre'))).to_be_visible();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
 field.fill('7.179556, 8.153785');search.click();expect(page.get_by_role('dialog',name='Your private map pin')).to_be_visible()
 assert not errors,errors
 b.close();print('PASS: Search click, reopen, Enter, tab focus, choosing names, one manual remote lookup, unmatched coverage fallback, mobile widths, coordinate search; no JavaScript errors. Live provider result is a fixture.')
