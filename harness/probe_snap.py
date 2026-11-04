import asyncio, subprocess, sys, pathlib
from playwright.async_api import async_playwright
ROOT = pathlib.Path('/home/user/sessions/07f7c/work/v38')
async def main():
    s = subprocess.Popen([sys.executable,'-m','http.server','4185','--directory',str(ROOT/'harness/dist')],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    await asyncio.sleep(1.2)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
            await pg.goto('http://localhost:4185/editor.html'); await pg.wait_for_timeout(800)
            ids = await pg.evaluate("() => [...document.querySelectorAll('[data-element-id]')].map(e => e.getAttribute('data-element-id'))")
            el = pg.locator(f'[data-element-id="{ids[0]}"]')
            r = await el.bounding_box()
            await pg.mouse.move(r['x']+r['width']/2, r['y']+r['height']/2); await pg.mouse.down()
            await pg.mouse.move(r['x']+r['width']/2+20, r['y']+r['height']/2, steps=5)
            await pg.wait_for_timeout(100)
            print('elements', len(ids), 'guides', await pg.evaluate("() => [...document.querySelectorAll('div')].filter(d => d.className && String(d.className).includes('pointer-events-none absolute z-[100]')).length"), 'bbox_before', round(r['x'],1), 'bbox_now', round((await el.bounding_box())['x'],1))
            await pg.mouse.up(); await b.close()
    finally: s.terminate()
asyncio.run(main())
