"""Satellite detail, external map handoff, KML export and responsive place cards."""
import os,re,xml.etree.ElementTree as ET
from pathlib import Path
from playwright.sync_api import sync_playwright,expect
BASE=os.environ.get('APP_URL','http://127.0.0.1:3101')
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'.local-state/previews';OUT.mkdir(parents=True,exist_ok=True)
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/google-chrome',headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':1440,'height':1000},accept_downloads=True)
 page=context.new_page();errors=[];requests=[]
 page.on('pageerror',lambda error:errors.append(str(error)));page.on('request',lambda request:requests.append(request.url))
 page.goto(BASE,wait_until='domcontentloaded');page.get_by_role('button',name='Satellite',exact=True).click()
 page.wait_for_function("document.querySelector('[data-imagery-level].leaflet-tile-loaded')",timeout=60000)
 toggle=page.get_by_role('button',name='Show satellite labels',exact=True)
 expect(toggle).to_have_attribute('aria-pressed','true');toggle.click();expect(toggle).to_have_attribute('aria-pressed','false');toggle.click()
 for _ in range(9):
  page.get_by_role('button',name='Zoom in',exact=True).click();page.wait_for_timeout(280)
 page.wait_for_function("document.querySelector('.atlas-map').dataset.mapZoom==='22'")
 best=page.get_by_role('button',name='Best detail',exact=True);expect(best).to_be_visible(timeout=60000);best.click()
 page.wait_for_function("Number(document.querySelector('.atlas-map').dataset.mapZoom)<=20")
 page.screenshot(path=str(OUT/'satellite-labels-desktop.png'),full_page=True)
 page.goto(BASE+'/?lat=7.192&lng=8.132');dialog=page.get_by_role('dialog',name='Your private map pin')
 expect(dialog).to_be_visible();earth=dialog.locator('a[href^="https://earth.google.com/"]');apple=dialog.locator('a[href^="https://maps.apple.com/"]')
 assert '7.192000' in earth.get_attribute('href') and '8.132000' in apple.get_attribute('href')
 assert not any(re.match(r'https://(earth.google.com|maps.apple.com)',url) for url in requests),'External maps loaded without a click'
 with page.expect_download() as download:dialog.get_by_role('button',name='Download pin for Google Earth Pro').click()
 data=Path(download.value.path()).read_text();tree=ET.fromstring(data);coords=tree.find('.//{http://www.opengis.net/kml/2.2}coordinates').text
 assert coords=='8.132,7.192,0',coords
 assert '<NetworkLink>' not in data
 page.wait_for_function("document.querySelector('.location-preview .leaflet-tile-loaded')",timeout=60000)
 for width in [1440,390,320]:
  page.set_viewport_size({'width':width,'height':950});page.wait_for_timeout(350)
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
  assert dialog.evaluate('(el)=>el.scrollWidth<=el.clientWidth+1'),width
  page.screenshot(path=str(OUT/f'location-providers-{width}.png'))
 page.keyboard.press('Escape');page.evaluate("localStorage.setItem('benue-low-data','1')");page.goto(BASE+'/?lat=7.192&lng=8.132')
 expect(page.get_by_text('Satellite preview paused in low-data mode.',exact=True)).to_be_visible()
 assert page.locator('.location-preview-map').count()==0
 assert not errors,errors
 browser.close()
 print('PASS: live satellite imagery, labels toggle, overzoom/best detail, exact-coordinate Google/Apple links, parsed KML download, 1440/390/320px layouts, low-data mode, no JavaScript errors')
