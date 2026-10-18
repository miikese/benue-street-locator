"""Browser regression checks for zoom coverage, location consent and map recovery."""
from playwright.sync_api import sync_playwright
import json,re,os
base=os.environ.get('APP_URL','http://127.0.0.1:3101')
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path=os.environ.get('PLAYWRIGHT_CHROMIUM_EXECUTABLE','/usr/bin/google-chrome'),args=['--no-sandbox'])
 ctx=b.new_context(viewport={'width':1440,'height':1000},permissions=['geolocation','clipboard-read','clipboard-write'],geolocation={'latitude':7.192,'longitude':8.132,'accuracy':12})
 page=ctx.new_page(); errors=[]; requests=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('request',lambda r:requests.append(r.url))
 page.goto(base,wait_until='domcontentloaded');page.locator('.leaflet-tile-loaded').first.wait_for();assert not page.locator('.map-gps-card').count()
 page.get_by_role('button',name='My location',exact=True).click();page.locator('.map-gps-card').wait_for();assert '7.192000, 8.132000' in page.locator('.map-coordinates').inner_text()
 page.get_by_role('button',name='Satellite',exact=True).click();page.wait_for_function("document.querySelectorAll('[data-imagery-level].leaflet-tile-loaded').length>0")
 for _ in range(4):page.get_by_role('button',name='Zoom in',exact=True).click();page.wait_for_timeout(350)
 page.wait_for_function("document.querySelector('.atlas-map').dataset.mapZoom==='22'")
 page.wait_for_function("[...document.querySelectorAll('[data-imagery-level].leaflet-tile-loaded img')].some(i=>i.complete&&i.naturalWidth>0)")
 levels=page.locator('[data-imagery-level].leaflet-tile-loaded').evaluate_all('(els)=>els.map(e=>Number(e.dataset.imageryLevel))');assert any(z<=18 for z in levels),levels
 assert not page.locator('.map-error').count(),page.locator('.map-error').all_text_contents()
 assert max(int(re.search(r'/tile/(\d+)/',u).group(1)) for u in requests if '/World_Imagery/MapServer/tile/' in u)<=20
 page.get_by_role('button',name='Expand map',exact=True).click();assert page.locator('.map-expanded').count();page.keyboard.press('Escape');assert not page.locator('.map-expanded').count()
 page.get_by_role('button',name='Copy my coordinates',exact=True).click();assert page.evaluate('navigator.clipboard.readText()')=='7.192000, 8.132000'
 page.get_by_role('button',name='Follow me',exact=True).click();ctx.set_geolocation({'latitude':7.194,'longitude':8.134,'accuracy':10});page.get_by_text('7.194000, 8.134000',exact=True).wait_for();page.get_by_role('button',name='Stop',exact=True).click();assert page.get_by_role('button',name='Follow me',exact=True).get_attribute('aria-pressed')=='false'
 # The device can be outside Benue: never substitute a fixed Nigerian pin.
 ctx.set_geolocation({'latitude':33.5731,'longitude':-7.5898,'accuracy':200});page.get_by_role('button',name='Refresh',exact=True).click();page.get_by_text('33.573100, -7.589800',exact=True).wait_for()
 page.get_by_role('button',name='Streets',exact=True).click();assert page.get_by_role('button',name='Streets',exact=True).get_attribute('aria-pressed')=='true'
 page.get_by_role('button',name='Return to Otukpo',exact=True).click()
 for width in [320,390,768,1440]:
  page.set_viewport_size({'width':width,'height':1000});page.wait_for_timeout(250);assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  label=page.locator('.map-label').bounding_box();tools=page.locator('.map-tools').bounding_box();assert label['x']+label['width']<=tools['x'],(width,label,tools)
 page.set_viewport_size({'width':1440,'height':1000});page.get_by_role('button',name='Satellite',exact=True).click();page.locator('.atlas-map').scroll_into_view_if_needed();page.wait_for_timeout(1500);page.screenshot(path='/tmp/benue-map-desktop.png',full_page=True)
 denied=b.new_context(permissions=[]);denied.grant_permissions([],origin=base);d=denied.new_page();d.goto(base);d.get_by_role('button',name='My location',exact=True).click();d.get_by_text('Location access is blocked.',exact=False).wait_for();assert not d.locator('.map-gps-card').count()
 # A failed imagery request must expose retry and recover without reloading.
 page.route('**/World_Imagery/MapServer/tile/**',lambda r:r.abort());page.get_by_role('button',name='Streets',exact=True).click();page.get_by_role('button',name='Satellite',exact=True).click();page.get_by_role('button',name='Retry map',exact=True).wait_for();page.unroute('**/World_Imagery/MapServer/tile/**');page.get_by_role('button',name='Retry map',exact=True).click();page.wait_for_function("document.querySelectorAll('[data-imagery-level].leaflet-tile-loaded').length>0");page.wait_for_timeout(1000);assert not page.locator('.map-error').count()
 assert not errors,errors
 print(json.dumps({'result':'PASS','checks':['real Esri imagery with missing-tile fallback at zoom22','GPS consent and accuracy','outside Benue position','follow/stop and copy','expand/Escape','320/390/768/1440 layouts','denied location','tile failure/retry recovery'],'imagery_levels':sorted(set(levels)),'page_errors':errors}))
 b.close()
