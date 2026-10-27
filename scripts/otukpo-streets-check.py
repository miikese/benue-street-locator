"""Verify street discovery and avoid presenting unconfirmed names as precise pins."""
import os,re
from playwright.sync_api import sync_playwright,expect
BASE=os.environ.get('APP_URL','http://127.0.0.1:3101')
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/google-chrome',headless=True,args=['--no-sandbox','--disable-gpu','--renderer-process-limit=1'])
 page=b.new_page(viewport={'width':1440,'height':1000});page.set_default_timeout(15000);errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.route('**/api/geocode?*',lambda route:route.fulfill(json={'results':[]}))
 page.goto(BASE);expect(page.locator('.place-row').first).to_be_visible();page.get_by_role('combobox',name='Filter by LGA').select_option('Otukpo')
 page.get_by_role('button',name='Street',exact=True).click();expect(page.get_by_role('combobox',name='Filter by category')).to_have_value('Street')
 expect(page.get_by_text('23 places to explore',exact=True)).to_be_visible()
 field=page.get_by_role('combobox',name='Search places');options=page.get_by_role('listbox',name='Related places')
 for query,name in [('f','Federal Road'),('rice mil','Rice Mill Road'),('ogri oko','Ogiri Oko Street'),('old makurdi rd','Old Makurdi Road')]:
  field.fill(query);expect(options.get_by_role('option',name=re.compile('^'+name))).to_be_visible()
 field.fill('federal rd');page.get_by_role('button',name='Search',exact=True).click();options.get_by_role('option',name=re.compile('^Federal Road')).click()
 dialog=page.get_by_role('dialog',name='Federal Road');expect(dialog).to_be_visible();expect(dialog.get_by_text(re.compile('6 January 2019'))).to_be_visible();expect(dialog.get_by_role('button',name='Calculate driving route')).to_be_disabled();expect(dialog.get_by_role('link',name='Find this address in Google Maps')).to_have_attribute('href',re.compile('Federal.*Otukpo'));page.keyboard.press('Escape')
 field.fill('weto');options.get_by_role('option',name=re.compile('^Otukpo–Weto Road')).click();dialog=page.get_by_role('dialog',name='Otukpo–Weto Road');expect(dialog).to_be_visible();expect(dialog.locator('.coordinate-card')).to_contain_text('7.2112188');expect(dialog.get_by_role('button',name='Calculate driving route')).to_be_enabled();page.keyboard.press('Escape')
 for width in [320,390]:
  page.set_viewport_size({'width':width,'height':850});field.fill('f');expect(options.get_by_role('option',name=re.compile('^Federal Road'))).to_be_visible();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
 assert not errors,errors
 b.close();print('PASS: 23 Otukpo streets, visible Street filter, first-letter/partial/typo/abbreviation predictions, Search selection, historical source labels, unpinned route restrictions, actual mapped road point, mobile layout; no JavaScript errors.')
