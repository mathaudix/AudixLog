import asyncio, subprocess, sys, pathlib
from playwright.async_api import async_playwright

ROOT = pathlib.Path('/home/user/sessions/07f7c/work/v38')
OUT = pathlib.Path('/home/user/sessions/07f7c/preview_zoom_formato.png')

async def main():
    s = subprocess.Popen([sys.executable, '-m', 'http.server', '4185', '--directory', str(ROOT / 'harness/dist')],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1.2)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            pg = await b.new_page(viewport={'width': 1440, 'height': 900})
            await pg.goto('http://localhost:4185/editor.html')
            await pg.wait_for_timeout(900)
            await pg.get_by_role('button', name='100x150', exact=True).click()
            await pg.wait_for_timeout(600)
            await pg.screenshot(path=str(OUT))
            await b.close()
    finally:
        s.terminate()

asyncio.run(main())
