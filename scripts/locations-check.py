"""Verify expanded directory coverage, area framing and honest source pins."""
import os,re
from playwright.sync_api import sync_playwright,expect
BASE=os.environ.get('APP_URL','http://127.0.0.1:3101')
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/google-chrome',headless=True,args=['--no-sandbox','--disable-gpu','--renderer-process-limit=1'])
 page=b.new_page(viewport={'width':1440,'height':1000});page.set_default_timeout(15000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE);expect(page.locator('.place-row').first).to_be_visible()
 records=page.request.get(BASE+'/api/records?kind=place').json()['records'];assert len(records)>=44,len(records)
 suggestions=page.get_by_role('listbox',name='Related places');area=page.get_by_role('combobox',name='Filter by LGA');field=page.get_by_role('combobox',name='Search places')
 names=area.locator('option').all_text_contents()[1:];assert len(names)==23
 for name in names:
  area.select_option(name);expect(page.locator('.atlas-map')).to_have_attribute('data-map-area',name);expect(page.locator('.place-row').first).to_be_visible()
  expect(page.locator('.atlas-map .map-label small')).to_have_text(name+' LGA · Nigeria')
  page.wait_for_function("""()=>{const map=document.querySelector('.map-canvas');if(!map)return false;const b=map.getBoundingClientRect();return [...map.querySelectorAll('.place-marker')].some(m=>{const r=m.getBoundingClientRect();return r.left>=b.left&&r.right<=b.right&&r.top>=b.top&&r.bottom<=b.bottom})}""")
 area.select_option('Gboko');field.fill('g');expect(suggestions.get_by_role('option',name=re.compile('^Gboko'))).to_be_visible()
 field.fill('Yandev');page.get_by_role('button',name='Search',exact=True).click();suggestions.get_by_role('option',name=re.compile('^Yandev')).click();expect(page.get_by_role('dialog',name='Yandev')).to_be_visible();expect(page.get_by_text(re.compile('settlement reference point'))).to_be_visible();page.keyboard.press('Escape')
 field.fill('');area.select_option('Makurdi');page.get_by_role('combobox',name='Filter by category').select_option('School')
 page.get_by_role('button',name=re.compile('Joseph Sarwuan Tarka University')).click();dialog=page.get_by_role('dialog',name='Joseph Sarwuan Tarka University, Makurdi');expect(dialog).to_be_visible();expect(dialog.get_by_role('link',name='Find this address in Google Maps')).to_be_visible();expect(dialog.get_by_role('button',name='Calculate driving route')).to_be_disabled();page.keyboard.press('Escape')
 page.get_by_role('button',name='Reset search',exact=True).click();page.get_by_role('button',name='Show listed places on map',exact=True).click();page.wait_for_function("Number(document.querySelector('.atlas-map').dataset.mapZoom)<=10")
 for width in [320,390,768,1440]:
  page.set_viewport_size({'width':width,'height':850});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
 assert not errors,errors
 b.close();print('PASS: 44+ sourced entries, every LGA searchable and framed on map, Gboko/Yandev predictions and source labels, address-only university routing disabled, fit-all control, four widths, no JavaScript errors.')
