"""Capture presentation screenshots of the running SkillSphere site (frontend :3000, backend :8000)."""
import asyncio, json, os
from playwright.async_api import async_playwright

FE, BE = "http://localhost:3000", "http://localhost:8000/api/v1"
OUT = os.path.join(os.path.dirname(__file__), "screenshots")
EMAILS = ["arjun.kumar", "priya.menon", "rahul.sharma", "sneha.pillai", "karthik.nair",
          "divya.thomas", "arun.krishnan", "meera.suresh"]
PW = "Test@1234"


async def login(req, email, pw=PW):
    r = await req.post(f"{BE}/auth/login", data={"email": email, "password": pw}, timeout=120000)
    return await r.json()


async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(channel="chrome", headless=True)
        req = await p.request.new_context()

        # ---- find a completed+paid order, its client and provider ----
        tokens = {}
        found = None
        for e in EMAILS:
            email = f"{e}@ceconline.edu"
            tokens[email] = await login(req, email)
            h = {"Authorization": f"Bearer {tokens[email]['access_token']}"}
            r = await req.get(f"{BE}/orders", params={"role": "provider", "page_size": 100}, headers=h)
            items = (await r.json()).get("items", [])
            for o in items:
                if o["status"] == "completed" and o["payment_status"] == "paid":
                    rv = await req.get(f"{BE}/reviews/order/{o['id']}", headers=h)
                    rev = await rv.json() if rv.ok else None
                    cand = dict(order=o, provider=email, client=o["client"]["email"], review=rev)
                    if rev and rev.get("provider_response") is None and not found:
                        found = cand           # prefer one with review and no reply yet
                    if found is None and rev:
                        found = cand
        print("order:", found["order"]["order_number"], found["provider"], found["client"])
        order = found["order"]
        provider, client = found["provider"], found["client"]
        if client not in tokens:
            tokens[client] = await login(req, client)
        admin = await login(req, "admin@ceconline.edu", "Admin@123")

        async def shot(name, token, path, full=False, actions=None, w=1440, h=900, wait=1800):
            if os.environ.get("ONLY") and os.environ["ONLY"] not in name:
                return
            ctx = await browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=1.5)
            if token:
                await ctx.add_init_script(
                    f"localStorage.setItem('access_token','{token['access_token']}');"
                    f"localStorage.setItem('refresh_token','{token['refresh_token']}');"
                )
            page = await ctx.new_page()
            await page.goto(FE + path, wait_until="networkidle", timeout=60000)
            await page.wait_for_timeout(wait)
            if actions:
                await actions(page)
            await page.screenshot(path=os.path.join(OUT, name), full_page=full)
            print("saved", name)
            await ctx.close()

        async def search(page):
            box = page.locator("input[placeholder*='resume design']")
            await box.fill("help with my python assignment")
            await box.press("Enter")
            await page.wait_for_timeout(3000)

        async def openchat(page):
            await page.locator("text=Priya Menon").first.click()
            await page.wait_for_timeout(2000)
            await page.evaluate("window.scrollTo(0,0); document.querySelectorAll('*').forEach(e=>{if(e.scrollTop) e.scrollTop=0})")
            await page.wait_for_timeout(500)

        async def receipt(page):
            await page.get_by_role("button", name="Receipt").click()
            await page.wait_for_timeout(1000)

        # public pages
        await shot("01_landing.png", None, "/", full=True)
        await shot("02_login.png", None, "/login")
        # client side
        ct = tokens[client]
        await shot("03_dashboard_client.png", ct, "/dashboard", full=True)
        await shot("04_service_catalog.png", ct, "/services")
        await shot("05_ai_semantic_search.png", ct, "/services", actions=search)
        sid = order["service_id"]
        await shot("06_service_detail_reviews.png", ct, f"/services/{sid}", full=True)
        await shot("07_orders_list.png", ct, "/orders", full=True)
        await shot("08_order_detail_timeline.png", ct, f"/orders/{order['id']}", full=True)
        await shot("09_payment_receipt.png", ct, f"/orders/{order['id']}", actions=receipt)
        # provider side
        pt = tokens[provider]
        await shot("10_order_review_reply_provider.png", pt, f"/orders/{order['id']}", full=True)
        await shot("11_earnings_dashboard.png", pt, "/earnings", full=True)
        await shot("12_portfolio_profile.png", ct, f"/users/{order['provider_id']}", full=True)
        await shot("13_messages_chat.png", pt, "/messages", actions=openchat)
        await shot("14_admin_dashboard.png", admin, "/admin", full=True)
        await shot("15_api_docs.png", None, "/", w=1440, h=900) if False else None
        ctx = await browser.new_context(viewport={"width": 1440, "height": 900})
        pg = await ctx.new_page()
        await pg.goto("http://localhost:8000/docs", wait_until="networkidle")
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=os.path.join(OUT, "15_api_docs.png"))
        await browser.close()
        json.dump(dict(order=order["order_number"], provider=provider, client=client),
                  open(os.path.join(OUT, "meta.json"), "w"))

asyncio.run(main())
