import asyncio, json, pathlib, subprocess, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path('/home/user/sessions/07f7c/work/v38')
PORT = '4182'


async def main():
    server = subprocess.Popen([sys.executable, '-m', 'http.server', PORT, '--directory', str(ROOT / 'harness/dist')],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1)
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page(viewport={'width': 1440, 'height': 900})
            await page.goto(f'http://localhost:{PORT}/editor.html')
            await page.wait_for_timeout(800)
            text = await page.evaluate("document.querySelector('.editor-dock-panel')?.innerText || ''")
            raw = [w for w in text.split() if w.startswith('labels.')]
            print(json.dumps({'raw_keys_in_panel': raw, 'has_texto': 'Texto' in text,
                              'has_codigo': 'Código de barras' in text}, ensure_ascii=False))
            await browser.close()
    finally:
        server.terminate()


asyncio.run(main())
