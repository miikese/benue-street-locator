"""Private planned/visited journey browser checks against the local runner."""
import os,json
from playwright.sync_api import sync_playwright
base=os.environ.get("APP_URL","http://127.0.0.1:3101")
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path=os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE"),args=["--no-sandbox"])
 page=browser.new_page(viewport={"width":1440,"height":1000});errors=[];page.on("pageerror",lambda e:errors.append(str(e)))
 page.goto(base);page.get_by_label("Search places").fill("7.192, 8.132");page.get_by_role("button",name="Search",exact=True).click()
 page.get_by_placeholder("What would you like to remember?").fill("QA private journey note");page.get_by_role("button",name="Plan to go",exact=True).click()
 page.get_by_role("button",name="Close place details").click();page.get_by_role("button",name="My journeys",exact=True).click()
 assert page.get_by_text("QA private journey note",exact=True).count()
 page.reload();page.get_by_role("button",name="My journeys",exact=True).click();assert page.get_by_text("QA private journey note",exact=True).count()
 page.get_by_role("button",name="Mark visited",exact=True).click();page.get_by_role("button",name="Been here",exact=True).click()
 assert page.get_by_text("QA private journey note",exact=True).count()
 with page.expect_download() as download:page.get_by_role("button",name="Export journal",exact=True).click()
 data=json.loads(open(download.value.path()).read());assert data["places"][0]["status"]=="visited"
 page.get_by_role("button",name="Details & directions",exact=False).click();page.get_by_role("button",name="Plan to go",exact=True).click();page.get_by_role("button",name="Close place details").click()
 page.get_by_role("button",name="Going next",exact=True).click();page.get_by_role("button",name="Remove Your private map pin",exact=True).click()
 assert not page.get_by_text("QA private journey note",exact=True).count()
 page.set_viewport_size({"width":390,"height":844});assert page.evaluate("document.documentElement.scrollWidth<=innerWidth")
 assert not errors,errors;print("PASS: coordinate search, planned/visited states, notes, persistence, export, remove, mobile and zero browser errors")
 browser.close()
