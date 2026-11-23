import asyncio, subprocess, sys, pathlib
from playwright.async_api import async_playwright

ROOT = pathlib.Path('/home/user/sessions/07f7c/work/app')
SESSION = pathlib.Path('/home/user/sessions/07f7c')
PORT = '4192'

async def main():
    s = subprocess.Popen([sys.executable, '-m', 'http.server', PORT, '--directory', str(ROOT / 'harness/dist-design')],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1.2)
    errs = []
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            for theme in ['light', 'dark']:
                pg = await b.new_page(viewport={'width': 1440, 'height': 900})
                pg.on('pageerror', lambda e, t=theme: errs.append(f'{t}:' + str(e)))
                await pg.goto(f'http://localhost:{PORT}/panel.html?theme={theme}')
                await pg.wait_for_timeout(1000)
                txt = await pg.inner_text('body')
                print(theme, 'tem_notas', 'Fornecedor 1' in txt)
                await pg.screenshot(path=str(SESSION / f'panel_{theme}.png'), full_page=False)
                await pg.close()
            # tabela vazia (light) e filtrada
            pg = await b.new_page(viewport={'width': 1440, 'height': 900})
            await pg.goto(f'http://localhost:{PORT}/panel.html?theme=light&empty=1&filtered=1')
            await pg.wait_for_timeout(900)
            txt = await pg.inner_text('body')
            print('vazia_filtrada', 'Nenhuma nota encontrada com estes filtros' in txt)
            await pg.screenshot(path=str(SESSION / 'panel_empty.png'), full_page=False)
            await b.close()
    finally:
        s.terminate()
    print('errors', errs)

asyncio.run(main())
