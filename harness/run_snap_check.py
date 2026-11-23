import asyncio, json, pathlib, subprocess, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path('/home/user/sessions/07f7c/work/v38')
PORT = '4185'
URL = f'http://localhost:{PORT}/editor.html'

JS_BOX = """(id) => { const el = document.querySelector(`[data-element-id="${id}"]`); const r = el.getBoundingClientRect(); return {cx: r.left + r.width/2, cy: r.top + r.height/2, l: r.left, r: r.right, t: r.top, b: r.bottom}; }"""
JS_LABEL = """() => { const c = document.querySelector('[data-element-id]').closest('.relative.overflow-hidden'); const r = c.getBoundingClientRect(); return {l: r.left, r: r.right, t: r.top, b: r.bottom, cx: r.left + r.width/2, cy: r.top + r.height/2}; }"""
JS_GUIDES = "() => document.querySelectorAll('.bg-pink-500\\\\/80').length"
JS_OOB = "() => document.querySelectorAll('[data-out-of-bounds=\"true\"]').length"

async def drag(page, sx, sy, ex, ey, alt=False, steps=12):
    if alt: await page.keyboard.down('Alt')
    await page.mouse.move(sx, sy)
    await page.mouse.down()
    await page.mouse.move(ex, ey, steps=steps)
    return

async def main():
    results = {}
    server = subprocess.Popen([sys.executable, '-m', 'http.server', PORT, '--directory', str(ROOT / 'harness/dist')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1.2)
    try:
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page(viewport={'width': 1440, 'height': 900})
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
            await page.goto(URL)
            await page.wait_for_timeout(800)
            ids = await page.evaluate("() => [...document.querySelectorAll('[data-element-id]')].map(e => e.getAttribute('data-element-id'))")
            text_id = ids[0]
            loc = page.locator(f'[data-element-id="{text_id}"]')
            label = await page.evaluate(JS_LABEL)
            # (a) arrastar texto perto do centro horizontal da etiqueta
            b = await page.evaluate(JS_BOX, text_id)
            sx, sy = b['cx'], b['cy']
            target_dx = (label['cx'] - b['cx']) + 3
            await drag(page, sx, sy, sx + target_dx, sy + 0)
            await page.wait_for_timeout(100)
            results['a_guides_durante'] = await page.evaluate(JS_GUIDES)
            await page.screenshot(path=str(ROOT / 'preview_guias.png'))
            await page.mouse.up()
            await page.wait_for_timeout(100)
            b2 = await page.evaluate(JS_BOX, text_id)
            results['a_centro_diff_px'] = round(b2['cx'] - label['cx'], 2)
            results['a_guides_depois'] = await page.evaluate(JS_GUIDES)
            await page.keyboard.up('Shift')
            # (e) undo
            before_undo = b2['cx']
            await page.keyboard.press('Control+z')
            await page.wait_for_timeout(100)
            b3 = await page.evaluate(JS_BOX, text_id)
            results['e_undo_moveu'] = abs(b3['cx'] - before_undo) > 0.5
            # (b) Alt desativa snap
            b = await page.evaluate(JS_BOX, text_id)
            sx, sy = b['cx'], b['cy']
            await page.locator('.relative.overflow-hidden').first.click(position={'x': 2, 'y': 2}, force=True) if False else None
            await page.mouse.move(sx, sy); await page.mouse.down()
            await page.keyboard.down('Alt')
            await page.mouse.move(sx + (label['cx'] - b['cx']) + 3, sy, steps=12)
            await page.wait_for_timeout(100)
            results['b_alt_guides'] = await page.evaluate(JS_GUIDES)
            await page.mouse.up(); await page.keyboard.up('Alt')
            await page.wait_for_timeout(100)
            b4 = await page.evaluate(JS_BOX, text_id)
            results['b_alt_sem_encaixe_diff_px'] = round(b4['cx'] - label['cx'], 2)
            await page.keyboard.press('Control+z')
            # (d) girar barcode 90 e levar para a borda
            bc_id = ids[1] if len(ids) > 1 else text_id
            await page.locator(f'[data-element-id="{bc_id}"]').click()
            await page.wait_for_timeout(120)
            await page.get_by_test_id('toolbar-rotate-90').click() if await page.locator('[data-testid="toolbar-rotate-90"]').count() else None
            bb = await page.evaluate(JS_BOX, bc_id)
            await page.mouse.move(bb['cx'], bb['cy']); await page.mouse.down()
            await page.mouse.move(bb['cx'] - 2000, bb['cy'], steps=20)
            await page.wait_for_timeout(100)
            await page.mouse.up()
            await page.wait_for_timeout(100)
            results['d_oob_marcado'] = await page.evaluate(JS_OOB)
            bb2 = await page.evaluate(JS_BOX, bc_id)
            results['d_dentro_da_etiqueta'] = bb2['l'] >= label['l'] - 1 and bb2['r'] <= label['r'] + 1
            results['f_scrollX'] = await page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
            results['g_errors'] = errors[:3]
            await browser.close()
    finally:
        server.terminate()
    print(json.dumps(results, ensure_ascii=False))

asyncio.run(main())
