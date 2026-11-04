import asyncio, subprocess, sys, pathlib
from playwright.async_api import async_playwright
ROOT = pathlib.Path('/home/user/sessions/07f7c/work/v38')
JS = """(id) => { const e = document.querySelector(`[data-element-id="${id}"]`); const c = e.closest('.absolute.inset-0.overflow-hidden'); const cr = c.getBoundingClientRect(); const er = e.getBoundingClientRect(); return {cx: cr.left + cr.width/2, cy: cr.top + cr.height/2, ecx: er.left + er.width/2, ecy: er.top + er.height/2, l: er.left, t: er.top, w: er.width, h: er.height}; }"""
async def main():
    s = subprocess.Popen([sys.executable,'-m','http.server','4185','--directory',str(ROOT/'harness/dist')],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    await asyncio.sleep(1.2)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch(); pg = await b.new_page(viewport={'width':1440,'height':900})
            await pg.goto('http://localhost:4185/editor.html'); await pg.wait_for_timeout(800)
            ids = await pg.evaluate("() => [...document.querySelectorAll('[data-element-id]')].map(e => e.getAttribute('data-element-id'))")
            i = ids[0]
            m = await pg.evaluate(JS, i)
            dx = (m['cx'] - m['ecx']) + 3   # deixar a 3px do centro
            await pg.mouse.move(m['ecx'], m['ecy']); await pg.mouse.down()
            await pg.mouse.move(m['ecx'] + dx, m['ecy'], steps=10)
            await pg.wait_for_timeout(100)
            during = await pg.evaluate(JS, i)
            print('during: canvasCx', round(during['cx'],1), 'elCx', round(during['ecx'],1), 'gap', round(during['ecx']-during['cx'],2),
                  'guides', await pg.evaluate("() => document.querySelectorAll('.bg-pink-500\\\\/80').length"))
            await pg.mouse.up(); await pg.wait_for_timeout(100)
            after = await pg.evaluate(JS, i)
            print('after: gap', round(after['ecx']-after['cx'],2))
            await b.close()
    finally: s.terminate()
asyncio.run(main())
