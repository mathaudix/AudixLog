import asyncio, json, pathlib, subprocess, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path('/home/user/sessions/07f7c/work/v38')
OUT = pathlib.Path('/home/user/sessions/07f7c')
PORT = '4181'


async def main():
    server = subprocess.Popen([sys.executable, '-m', 'http.server', PORT, '--directory', str(ROOT / 'harness/dist')],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1)
    report = {}
    logs = []
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page(viewport={'width': 1440, 'height': 900})
            page.on('console', lambda m: logs.append(m.text))
            page.on('pageerror', lambda e: report.setdefault('pageerror', []).append(str(e)[:160]))
            await page.goto(f'http://localhost:{PORT}/editor.html')
            await page.wait_for_timeout(800)
            count = lambda: page.evaluate("document.querySelectorAll('.editor-canvas-item, [data-element-id], .editor-stage-row > div > div > div').length")
            report['before'] = await count()
            await page.get_by_role('button', name='Texto', exact=True).first.click()
            await page.wait_for_timeout(200)
            await page.get_by_role('button', name='Código de barras', exact=False).first.click()
            await page.wait_for_timeout(200)
            report['after_add_undo_stack'] = await page.evaluate("document.querySelectorAll('.editor-stage-row button').length")
            await page.keyboard.press('Control+z')
            await page.wait_for_timeout(200)
            await page.keyboard.press('Control+Shift+z')
            await page.wait_for_timeout(200)
            await page.screenshot(path=str(OUT / 'preview_editor.png'))
            await browser.close()
    except Exception as error:
        report['error'] = str(error)[:300]
    finally:
        server.terminate()
    report['saves'] = [line[:120] for line in logs if line.startswith('SAVE')][:1]
    print(json.dumps(report, ensure_ascii=False))


asyncio.run(main())
