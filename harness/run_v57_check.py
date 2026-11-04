import asyncio, json, pathlib, subprocess, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path('/home/user/sessions/07f7c/work/v38')
PORT = '4183'


async def main():
    server = subprocess.Popen([sys.executable, '-m', 'http.server', PORT, '--directory', str(ROOT / 'harness/dist')],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1)
    result = {}
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page(viewport={'width': 1440, 'height': 900})
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)[:160]))
            await page.goto(f'http://localhost:{PORT}/editor.html')
            await page.wait_for_timeout(1000)
            result['title_count_elementos'] = await page.evaluate(
                "[...document.querySelectorAll('.editor-dock-panel h2, .editor-palette h2')].filter(h => h.textContent.trim().toLowerCase() === 'elementos').length")
            op = page.locator('button', has_text='Operação').first
            if await op.count():
                await op.click()
                await page.wait_for_timeout(300)
            await page.screenshot(path=str(ROOT / 'preview_editor.png'))
            fmt = page.get_by_role('button', name='100x30 (2Col)')
            await fmt.click()
            await page.wait_for_timeout(500)
            boxes = await page.evaluate("""() => {
              const bc = document.querySelector('[data-testid="barcode-key"], [aria-label*="ódigo"]');
              const label = document.querySelector('.label-page, .label-canvas, [data-label-canvas]') || document.querySelector('.editor-stage canvas, .editor-stage > div > div');
              const r = el => el ? el.getBoundingClientRect() : null;
              return { bc: r(bc), label: r(label) };
            }""")
            result['barcode_rect'] = boxes
            result['page_errors'] = errors
            await page.screenshot(path=str(ROOT / 'preview_100x30.png'))
            scroll = await page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
            result['scrollX_1440'] = scroll
            await browser.close()
    finally:
        server.terminate()
    print(json.dumps(result, ensure_ascii=False))


asyncio.run(main())
