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
 page.on('pageerror',lambda error:(errors.append(error.stack),print('BROWSER ERROR:',error.stack,flush=True)));page.on('request',lambda request:requests.append(request.url))
 page.goto(BASE,wait_until='domcontentloaded');page.get_by_role('button',name='Satellite',exact=True).click()
 page.wait_for_function("document.querySelector('[data-imagery-level].leaflet-tile-loaded')",timeout=60000)
 toggle=page.get_by_role('button',name='Show satellite labels',exact=True)
 expect(toggle).to_have_attribute('aria-pressed','true');toggle.click();expect(toggle).to_have_attribute('aria-pressed','false');toggle.click()
 for _ in range(9):
  page.get_by_role('button',name='Zoom in',exact=True).click();page.wait_for_timeout(280)
 page.wait_for_function("document.querySelector('.atlas-map').dataset.mapZoom==='22'")
 best=page.get_by_role('button',name='Best detail',exact=True);expect(best).to_be_visible(timeout=60000);page.wait_for_function("""()=>{const m=document.querySelector('.map-canvas');const box=m.getBoundingClientRect();return [...m.querySelectorAll('[data-tile-zoom="20"].leaflet-tile-loaded')].some(t=>{const r=t.getBoundingClientRect();return r.left<=box.left+box.width/2&&r.right>box.left+box.width/2&&r.top<=box.top+box.height/2&&r.bottom>box.top+box.height/2})}""")
 expected=page.evaluate("""()=>{const m=document.querySelector('.map-canvas'),box=m.getBoundingClientRect();return Number([...m.querySelectorAll('[data-tile-zoom="20"].leaflet-tile-loaded')].find(t=>{const r=t.getBoundingClientRect();return r.left<=box.left+box.width/2&&r.right>box.left+box.width/2&&r.top<=box.top+box.height/2&&r.bottom>box.top+box.height/2}).dataset.imageryLevel)}""")
 best.click()
 page.wait_for_function('(expected)=>Number(document.querySelector(".atlas-map").dataset.mapZoom)===expected',arg=expected)
 page.wait_for_function("""()=>{const m=document.querySelector('.map-canvas'),box=m.getBoundingClientRect(),z=Math.min(20,Number(document.querySelector('.atlas-map').dataset.mapZoom));const tiles=[...m.querySelectorAll(`[data-tile-zoom="${z}"]`)].filter(t=>{const r=t.getBoundingClientRect();return r.right>box.left&&r.left<box.right&&r.bottom>box.top&&r.top<box.bottom});return tiles.length>0&&tiles.every(t=>t.classList.contains('leaflet-tile-loaded'))}""",timeout=60000)
 page.screenshot(path=str(OUT/'satellite-labels-desktop.png'),full_page=True)
 page.get_by_role('combobox',name='Search places').fill(' 7.179556 , 8.153785 ');page.get_by_role('button',name='Search',exact=True).click();dialog=page.get_by_role('dialog',name='Your private map pin');expect(dialog).to_be_visible();expect(dialog.locator('a[href^="https://www.google.com/maps/search/"]')).to_have_attribute('href',re.compile('7.179556.*8.153785'));page.keyboard.press('Escape');expect(page.locator('.map-canvas .place-marker-selected')).to_be_visible()
 page.goto(BASE+'/?lat=7.192&lng=8.132');dialog=page.get_by_role('dialog',name='Your private map pin')
 expect(dialog).to_be_visible();earth=dialog.locator('a[href^="https://earth.google.com/"]');apple=dialog.locator('a[href^="https://maps.apple.com/"]')
 assert '7.192000' in earth.get_attribute('href') and '8.132000' in apple.get_attribute('href')
 assert not any(re.match(r'https://(earth.google.com|maps.apple.com|www.google.com/maps)',url) for url in requests),'External maps loaded without a click'
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
