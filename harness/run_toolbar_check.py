import asyncio, json, pathlib, subprocess, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path('/home/user/sessions/07f7c/work/v38')
PORT = '4184'
TB = '[data-testid="context-toolbar"]'


async def count_elements(page):
    return await page.evaluate("document.querySelectorAll('[data-testid^=\"canvas-el\"], .editor-stage [data-element-id]').length")


async def run(page, width, out):
    await page.set_viewport_size({'width': width, 'height': 800})
    await page.goto(f'http://localhost:{PORT}/editor.html')
    await page.wait_for_timeout(900)
    res = {}
    res['a_sem_selecao'] = await page.locator(TB).count() == 0
    texts = page.locator('[data-element-type="text"]')
    res['n_texts'] = await texts.count()
    if res['n_texts']:
        await texts.first.click()
        await page.wait_for_timeout(200)
        res['b_toolbar_visivel'] = await page.locator(TB).count() == 1
        if res['b_toolbar_visivel']:
            size_before = await page.locator('[data-testid="toolbar-font-size"]').inner_text()
            await page.locator('[data-testid="toolbar-font-plus"]').click()
            await page.locator('[data-testid="toolbar-font-plus"]').click()
            await page.wait_for_timeout(150)
            size_after = await page.locator('[data-testid="toolbar-font-size"]').inner_text()
            res['b_fonte'] = [size_before, size_after]
            await page.locator('[data-testid="toolbar-bold"]').click()
            await page.wait_for_timeout(150)
            res['b_negrito_pressed'] = await page.locator('[data-testid="toolbar-bold"]').get_attribute('aria-pressed')
            await page.keyboard.press('Control+z')
            await page.wait_for_timeout(150)
            res['b_undo_negrito_pressed'] = await page.locator('[data-testid="toolbar-bold"]').get_attribute('aria-pressed')
            tb_box = await page.locator(TB).bounding_box()
            label_box = await page.locator('.editor-stage-row .relative.shrink-0').first.bounding_box()
            if tb_box and label_box:
                inter = not (tb_box['x'] + tb_box['width'] <= label_box['x'] or tb_box['x'] >= label_box['x'] + label_box['width']
                             or tb_box['y'] + tb_box['height'] <= label_box['y'] or tb_box['y'] >= label_box['y'] + label_box['height'])
                res['b_toolbar_sobre_etiqueta'] = inter
            await page.screenshot(path=str(out / 'preview_barra_texto.png') if False else str(ROOT / f'preview_barra_texto_{width}.png'))
    if res['n_texts'] >= 2:
        await texts.nth(0).click()
        await page.keyboard.down('Shift')
        await texts.nth(1).click(modifiers=['Shift'])
        await page.keyboard.up('Shift')
        await page.wait_for_timeout(150)
        res['c_multi_texto'] = await page.locator('[data-testid="toolbar-count"]').inner_text() if await page.locator('[data-testid="toolbar-count"]').count() else None
        await page.screenshot(path=str(ROOT / f'preview_barra_multi_{width}.png'))
    before = await count_elements(page)
    await texts.first.click()
    await page.wait_for_timeout(150)
    if await page.locator('[data-testid="toolbar-delete"]').count():
        await page.locator('[data-testid="toolbar-delete"]').click()
        await page.wait_for_timeout(150)
    res['d_contagem'] = [before, await count_elements(page)]
    res['e_scrollX'] = await page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    return res


async def main():
    server = subprocess.Popen([sys.executable, '-m', 'http.server', PORT, '--directory', str(ROOT / 'harness/dist')],
                              stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1)
    out = {}
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            errors = []
            for width in (1440, 1280):
                page = await browser.new_page(viewport={'width': width, 'height': 800})
                page.on('pageerror', lambda e: errors.append(str(e)[:160]))
                page.on('console', lambda m: errors.append(m.text[:160]) if m.type == 'error' else None)
                out[str(width)] = await run(page, width, ROOT)
                await page.close()
            out['console_errors'] = errors[:5]
            await browser.close()
    finally:
        server.terminate()
    print(json.dumps(out, ensure_ascii=False))


asyncio.run(main())
