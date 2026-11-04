import asyncio, subprocess, sys, pathlib
from playwright.async_api import async_playwright

ROOT = pathlib.Path('/home/user/sessions/07f7c/work/v38')
OUT = pathlib.Path('/home/user/sessions/07f7c/preview_rateio.png')

async def main():
    s = subprocess.Popen([sys.executable, '-m', 'http.server', '4186', '--directory', str(ROOT / 'harness/dist-rateio')],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1.2)
    errs = []
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            pg = await b.new_page(viewport={'width': 1440, 'height': 900})
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto('http://localhost:4186/rateio.html')
            await pg.wait_for_timeout(1200)
            txt = await pg.inner_text('body')
            print('title', 'Rateio de Frete CT-e' in txt, 'soma_total', 'SOMA TOTAL' in txt)
            print('valores', {v: v in txt for v in ['R$ 500', 'R$ 300', 'R$ 200']})
            await pg.screenshot(path=str(OUT), full_page=True)
            await b.close()
    finally:
        s.terminate()
    print('errors', errs)

asyncio.run(main())
