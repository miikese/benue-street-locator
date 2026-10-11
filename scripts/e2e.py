"""Real browser journeys against the loopback runner. pip install playwright."""
import os,time,json
from pathlib import Path
from urllib.request import urlopen
from playwright.sync_api import sync_playwright
base=os.environ.get("APP_URL","http://127.0.0.1:3101")
for _ in range(60):
 try:
  if urlopen(base+"/api/health",timeout=2).status==200:break
 except Exception:time.sleep(1)
else:raise RuntimeError("Local server did not become ready")
with sync_playwright() as p:
 executable=os.environ.get("PLAYWRIGHT_CHROMIUM_EXECUTABLE")
 browser=p.chromium.launch(**({"executable_path":executable} if executable else {}),headless=True,args=["--no-sandbox","--disable-dev-shm-usage","--disable-gpu","--renderer-process-limit=2"])
 page=browser.new_page(viewport={"width":1440,"height":1000})
 errors=[];page.on("pageerror",lambda e:errors.append(str(e)))
 page.goto(base);page.get_by_role("heading",name="Find your way. Discover Benue.").wait_for()
 page.get_by_label("Search places").fill("Orokam")
 page.get_by_role("button",name="Orokam Street",exact=False).wait_for()
 page.get_by_label("Search places").fill("")
 page.goto(base+"/signin-with-chatgpt?return_to=/")
 for old in page.request.get(base+"/api/records?mine=1").json()["records"]:
  if old["data"].get("name")=="Browser QA public place":page.request.delete(base+"/api/records/"+old["id"])
 page.get_by_role("button",name="Add a place",exact=False).click()
 page.locator('input[name="name"]').fill("Browser QA public place")
 page.locator('input[name="lat"]').fill("7.192")
 page.locator('input[name="lng"]').fill("8.132")
 page.locator('textarea[name="description"]').fill("Temporary test submission, removed after browser validation.")
 page.get_by_role("button",name="Submit for review").click()
 page.get_by_text("is pending moderation",exact=False).wait_for()
 mine=page.request.get(base+"/api/records?mine=1").json()
 record=next(r for r in mine["records"] if r["data"]["name"]=="Browser QA public place")
 public=page.request.get(base+"/api/records").json()
 assert not any(r["id"]==record["id"] for r in public["records"]),"Pending submission was exposed"
 page.get_by_role("button",name="Review submissions",exact=True).click()
 page.get_by_label("Review note / supporting evidence").fill("Automated browser test review; not a real location listing.")
 card=page.locator("article.card").filter(has=page.get_by_role("heading",name="Browser QA public place"))
 card.get_by_role("button",name="approved",exact=True).click()
 page.get_by_text("Review saved.",exact=True).wait_for()
 assert page.request.get(base+"/api/records/"+record["id"]).json()["record"]["status"]=="approved"
 page.goto(base+"/?record="+record["id"])
 page.get_by_role("heading",name="Browser QA public place").wait_for()
 page.get_by_role("button",name="Save place",exact=True).click()
 page.get_by_text("Place saved to your account.",exact=True).wait_for()
 page.get_by_role("button",name="QR code",exact=True).click()
 page.get_by_alt_text("QR code for Browser QA public place").wait_for()
 assert page.get_by_alt_text("QR code for Browser QA public place").get_attribute("src").startswith("data:image/png")
 page.get_by_role("button",name="Close place details").click()
 assert page.request.delete(base+"/api/records/"+record["id"]).status==200
 page.goto(base);page.get_by_role("button",name="Orokam Street",exact=False).wait_for()
 page.screenshot(path="docs/screenshots/desktop.png",full_page=True)
 page.set_viewport_size({"width":390,"height":844});page.reload()
 page.get_by_role("heading",name="Find your way. Discover Benue.").wait_for()
 assert page.evaluate("document.documentElement.scrollWidth<=window.innerWidth"),"Mobile overflow"
 page.get_by_role("button",name="Open navigation").click()
 page.get_by_role("button",name="Saved places",exact=True).click()
 page.get_by_role("heading",name="Your places. Always close.").wait_for()
 page.goto(base);page.get_by_role("heading",name="Find your way. Discover Benue.").wait_for()
 page.screenshot(path="docs/screenshots/mobile.png",full_page=True)
 # Logout invalidates the development session.
 page.goto(base+"/signout-with-chatgpt?return_to=/")
 assert page.request.post(base+"/api/records",data={"kind":"place","data":{}}).status==401
 assert not errors,errors
 browser.close()
print("PASS: search, sign-in, private submission, moderator approval, favorite, QR, cleanup, mobile navigation/overflow, sign-out. No browser errors.")
