import asyncio, json, pathlib, subprocess, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path('/home/user/sessions/07f7c/work/v38')
PORT = '4185'


async def main():
    server = subprocess.Popen([sys.executable, '-m', 'http.server', PORT, '--directory', str(ROOT / 'harness/dist')],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1)
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page(viewport={'width': 1440, 'height': 800})
            await page.goto(f'http://localhost:{PORT}/editor.html')
            await page.wait_for_timeout(900)
            info = await page.evaluate("""() => ({
              els: [...document.querySelectorAll('[data-element-id]')].map(e => [e.dataset.elementId, e.dataset.elementType]),
              tb: document.querySelectorAll('[data-testid="context-toolbar"]').length
            })""")
            await page.locator('[data-element-type="text"]').first.click()
            await page.wait_for_timeout(200)
            info['tb_box'] = await page.evaluate("""() => { const t = document.querySelector('[data-testid="context-toolbar"]'); if (!t) return null; const r = t.getBoundingClientRect(); const b = document.querySelector('[data-testid="toolbar-font-plus"]'); const br = b ? b.getBoundingClientRect() : null; const top = br ? document.elementFromPoint(br.x + br.width/2, br.y + br.height/2) : null; return { tb: [r.x, r.y, r.width, r.height], plus: br ? [br.x, br.y, br.width, br.height] : null, hit: top ? (top.getAttribute('data-testid') || top.className.toString().slice(0,80) || top.tagName) : null }; }""")
            print(json.dumps(info, ensure_ascii=False)[:900])
            await browser.close()
    finally:
        server.terminate()


asyncio.run(main())
