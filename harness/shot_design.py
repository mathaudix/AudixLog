import asyncio, subprocess, sys, pathlib
from playwright.async_api import async_playwright

ROOT = pathlib.Path('/home/user/sessions/07f7c/work/app')
SESSION = pathlib.Path('/home/user/sessions/07f7c')
PORT = '4190'

async def main():
    s = subprocess.Popen([sys.executable, '-m', 'http.server', PORT, '--directory', str(ROOT / 'harness/dist-design')],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1.2)
    errs = []
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            pg = await b.new_page(viewport={'width': 1440, 'height': 900})
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(f'http://localhost:{PORT}/design.html')
            await pg.wait_for_timeout(900)
            await pg.screenshot(path=str(SESSION / 'preview_design_system.png'), full_page=True)

            lp = await b.new_page(viewport={'width': 1440, 'height': 900})
            lp.on('pageerror', lambda e: errs.append('list:' + str(e)))
            await lp.goto(f'http://localhost:{PORT}/list.html')
            await lp.wait_for_timeout(900)
            txt = await lp.inner_text('body')
            print('lista_tem_notas', '10231' in txt, '10232' in txt, '10233' in txt)
            await lp.screenshot(path=str(SESSION / 'preview_lista_v72.png'), full_page=True)
            await b.close()
    finally:
        s.terminate()
    print('errors', errs)

asyncio.run(main())
