"""Focused autocomplete behavior without external requests while typing."""
import os,re
from playwright.sync_api import sync_playwright,expect
BASE=os.environ.get('APP_URL','http://127.0.0.1:3101')
with sync_playwright() as pw:
 browser=pw.chromium.launch(executable_path='/usr/bin/google-chrome',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':1000});errors=[];lookups=[]
 page.on('pageerror',lambda error:errors.append(str(error)))
 page.on('request',lambda request:lookups.append(request.url) if '/api/geocode' in request.url else None)
 page.goto(BASE);expect(page.locator('.place-row').first).to_be_visible()
 field=page.get_by_role('combobox',name='Search places');suggestions=page.get_by_role('listbox',name='Related places')
 field.focus();expect(suggestions).to_have_count(0)
 field.fill('O');expect(suggestions).to_have_count(0)
 field.fill('Oro');expect(suggestions).to_be_visible();expect(suggestions.get_by_role('option',name=re.compile('Orokam Street'))).to_be_visible()
 assert not lookups,lookups
 field.press('ArrowDown');assert field.get_attribute('aria-activedescendant')
 field.press('Enter');expect(page.get_by_role('dialog',name='Orokam Street')).to_be_visible();page.keyboard.press('Escape');expect(suggestions).to_have_count(0)
 field.fill('Oro');expect(suggestions).to_be_visible();field.press('Escape');expect(suggestions).to_have_count(0)
 field.press('ArrowDown');expect(suggestions).to_be_visible();page.get_by_role('heading',name='Find your way. Discover Benue.').click();expect(suggestions).to_have_count(0)
 field.fill('no-such-location');expect(suggestions).to_have_count(0)
 field.fill('7.179556, 8.153785');expect(suggestions).to_have_count(0)
 page.get_by_role('button',name='Clear search',exact=True).click();expect(field).to_have_value('');expect(suggestions).to_have_count(0)
 field.fill('Helen');option=suggestions.get_by_role('option',name=re.compile('St Helen'));option.click()
 expect(page.get_by_role('dialog',name='St Helen Specialist Hospital')).to_be_visible();expect(page.get_by_role('link',name='Find this address in Google Maps')).to_be_visible()
 page.keyboard.press('Escape');expect(suggestions).to_have_count(0)
 page.set_viewport_size({'width':320,'height':850});field.fill('Oro');expect(suggestions).to_be_visible();assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not lookups,lookups
 assert not errors,errors
 browser.close();print('PASS: partial related names, no external typing requests, keyboard/pointer selection, dismissal, clear, numeric/unmatched queries and 320px layout')
