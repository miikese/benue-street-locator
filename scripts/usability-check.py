"""Verify discovery recovery, keyboard menus, preferences and narrow screens."""
import os,re
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
BASE=os.environ.get('APP_URL','http://127.0.0.1:3101')
with sync_playwright() as pw:
 b=pw.chromium.launch(executable_path='/usr/bin/google-chrome',headless=True,args=['--no-sandbox','--disable-gpu','--renderer-process-limit=1'])
 page=b.new_page(viewport={'width':1440,'height':1000});page.set_default_timeout(15000);errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto(BASE,wait_until='domcontentloaded');expect(page.locator('.place-row').first).to_be_visible()
 expect(page.get_by_role('button',name='Review submissions',exact=True)).to_have_count(0)
 page.get_by_role('button',name='Notifications',exact=True).click();expect(page.get_by_role('button',name='Mark as read')).to_have_count(0);page.get_by_role('button',name='Close updates').click()
 page.get_by_role('combobox',name='Filter by LGA').select_option('Otukpo');field=page.get_by_role('combobox',name='Search places');field.fill('l');expect(page.get_by_role('option',name=re.compile('LEEF Centre'))).to_be_visible();field.press('Escape')
 page.get_by_role('combobox',name='Filter by category').select_option('Market');expect(page.get_by_role('heading',name='No matches with these filters')).to_be_visible();page.get_by_role('button',name='Clear all filters',exact=True).click();expect(field).to_have_value('');expect(page.locator('.place-row').first).to_be_visible()
 page.get_by_role('button',name='Dark theme',exact=True).click();page.get_by_role('button',name=re.compile('Text size')).click();page.reload();expect(page.locator('.large-text')).to_be_visible();assert page.locator('html').get_attribute('data-theme')=='dark'
 page.get_by_role('button',name='Light theme',exact=True).click();page.get_by_role('button',name=re.compile('Text size')).click()
 Path('.local-state/previews').mkdir(parents=True,exist_ok=True)
 page.screenshot(path='.local-state/previews/polish-desktop.png')
 for width in [320,390,768,1440]:
  page.set_viewport_size({'width':width,'height':844});assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  if width<=760:
   trigger=page.get_by_role('button',name='Open navigation',exact=True);trigger.click();expect(page.locator('.workspace')).to_have_attribute('inert','');page.keyboard.press('Escape');expect(trigger).to_be_focused();assert not page.locator('.workspace').evaluate('(el)=>el.inert')
   trigger.click();page.get_by_role('button',name='Saved places',exact=True).click();expect(page.get_by_role('heading',name='Your useful places, all together')).to_be_visible();page.get_by_role('button',name='Explore public places',exact=True).click()
   page.get_by_role('link',name='Jump to map').click();expect(page.locator('#explore-map')).to_be_in_viewport();page.get_by_role('link',name='Back to results',exact=False).click();expect(page.locator('#place-results')).to_be_in_viewport()
   if width==390:page.evaluate('window.scrollTo(0,0)');page.screenshot(path='.local-state/previews/polish-mobile.png',full_page=True)
 # Failure recovery: clear cache and isolate public API failure in this browser only.
 page.evaluate("localStorage.removeItem('benue-public-places')")
 page.route('**/api/records?kind=place',lambda route:route.fulfill(status=503,json={'error':'Fixture service unavailable'}));page.goto(BASE);expect(page.get_by_role('button',name='Retry directory',exact=True)).to_be_visible();page.unroute('**/api/records?kind=place');page.get_by_role('button',name='Retry directory',exact=True).click();expect(page.locator('.place-row').first).to_be_visible()
 # Blocked storage must not prevent the directory from rendering.
 page.add_init_script("Storage.prototype.getItem=()=>{throw new Error('Storage unavailable')};Storage.prototype.setItem=()=>{throw new Error('Storage unavailable')}")
 page.reload();expect(page.locator('.place-row').first).to_be_visible()
 assert not errors,errors
 b.close();print('PASS: first-letter suggestions, reset/empty results, guest navigation/notifications, persisted preferences, mobile Escape/focus/scroll, map jump, directory retry, blocked storage, 320/390/768/1440 layouts; no JavaScript errors.')
