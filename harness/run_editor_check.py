import asyncio, json, pathlib, subprocess, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path('/home/user/sessions/07f7c/work/v38')
OUT = pathlib.Path('/home/user/sessions/07f7c')
PORT = '4180'


async def measure(page):
    return await page.evaluate('document.documentElement.scrollWidth - window.innerWidth')


async def main():
    server = subprocess.Popen([sys.executable, '-m', 'http.server', PORT, '--directory', str(ROOT / 'harness/dist')],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1)
    report = {}
    saves = []
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page(viewport={'width': 1440, 'height': 900})
            page.on('console', lambda m: saves.append(m.text) if m.text.startswith('SAVE') else None)
            page.on('pageerror', lambda e: report.setdefault('pageerror', []).append(str(e)[:200]))
            await page.goto(f'http://localhost:{PORT}/editor.html')
            await page.wait_for_timeout(800)
            report['scrollX_1440'] = await measure(page)
            report['dock_buttons'] = await page.locator('nav[aria-label] button').count()
            report['elementos_visible_start'] = await page.get_by_text('Elementos', exact=True).first.is_visible()
            for label in ['Salvos', 'Camadas']:
                await page.locator('nav button', has_text=label).first.click()
                await page.wait_for_timeout(300)
                report[f'{label}_title_visible'] = await page.locator('aside h2', has_text=label).count() > 0
            await page.locator('nav button', has_text='Camadas').first.click()
            await page.wait_for_timeout(300)
            report['recolhido_aside_w'] = await page.evaluate("document.querySelector('aside.editor-sidebar').getBoundingClientRect().width")
            await page.locator('nav button', has_text='Elementos').first.click()
            await page.wait_for_timeout(300)
            report['aberto_aside_w'] = await page.evaluate("document.querySelector('aside.editor-sidebar').getBoundingClientRect().width")
            await page.screenshot(path=str(OUT / 'preview_editor.png'))
            await browser.close()
    except Exception as error:
        report['error'] = str(error)[:300]
    finally:
        server.terminate()
    report['saves'] = saves[:2]
    print(json.dumps(report, ensure_ascii=False))


asyncio.run(main())
