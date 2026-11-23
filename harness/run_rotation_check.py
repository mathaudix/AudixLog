import asyncio, json, pathlib, subprocess, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path('/home/user/sessions/07f7c/work/v38')
PORT = '4185'
URL = f'http://localhost:{PORT}/editor.html'

async def rot_of(page, eid):
    return await page.evaluate("(id) => { const el = document.querySelector(`[data-element-id=\"${id}\"]`); return el ? Number(el.getAttribute('data-rotation')) : null; }", eid)

async def main():
    results = {}
    server = subprocess.Popen([sys.executable, '-m', 'http.server', PORT, '--directory', str(ROOT / 'harness/dist')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1.2)
    try:
      async with async_playwright() as p:
        browser = await p.chromium.launch()
        for width, height in [(1440, 900)]:
            page = await browser.new_page(viewport={'width': width, 'height': height})
            errors = []
            page.on('pageerror', lambda e: errors.append(str(e)))
            page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
            await page.goto(URL)
            await page.wait_for_timeout(800)
            bc = page.locator('[data-element-type="barcode"]').first
            await page.locator('[data-element-type="text"]').first.click()
            await page.wait_for_timeout(150)
            # (a) girar 90 pela barra
            ids = await page.evaluate("() => [...document.querySelectorAll('[data-element-id]')].map(e => e.getAttribute('data-element-id'))")
            text_id = ids[0]
            await page.locator('[data-testid="toolbar-rotate90"]').click()
            await page.wait_for_timeout(120)
            results['a_girar90'] = await rot_of(page, text_id)
            # (b) ctrl+z
            await page.keyboard.press('Control+z')
            await page.wait_for_timeout(120)
            results['b_undo'] = await rot_of(page, text_id)
            # (c) arrastar alca ~45 graus
            await page.locator('[data-element-type="text"]').first.click()
            await page.wait_for_timeout(120)
            handle = page.locator(f'[data-element-id="{text_id}"] [data-rotate]')
            box = await handle.bounding_box()
            cx = box['x'] + box['width'] / 2; cy = box['y'] + box['height'] / 2
            el = await page.locator(f'[data-element-id="{text_id}"]').bounding_box()
            ox = el['x'] + el['width'] / 2; oy = el['y'] + el['height'] / 2
            import math
            r = math.hypot(cx - ox, cy - oy)
            start = math.atan2(cy - oy, cx - ox)
            target = start + math.radians(45)
            await page.mouse.move(cx, cy); await page.mouse.down()
            await page.mouse.move(ox + r * math.cos(target), oy + r * math.sin(target), steps=8)
            await page.mouse.up()
            await page.wait_for_timeout(120)
            results['c_arrasto45'] = await rot_of(page, text_id)
            # (c2) shift multiplo de 15
            box = await page.locator(f'[data-element-id="{text_id}"] [data-rotate]').bounding_box()
            cx = box['x'] + box['width'] / 2; cy = box['y'] + box['height'] / 2
            el = await page.locator(f'[data-element-id="{text_id}"]').bounding_box()
            ox = el['x'] + el['width'] / 2; oy = el['y'] + el['height'] / 2
            r = math.hypot(cx - ox, cy - oy); start = math.atan2(cy - oy, cx - ox)
            target = start + math.radians(20)
            await page.keyboard.down('Shift')
            await page.mouse.move(cx, cy); await page.mouse.down()
            await page.mouse.move(ox + r * math.cos(target), oy + r * math.sin(target), steps=8)
            await page.mouse.up(); await page.keyboard.up('Shift')
            await page.wait_for_timeout(120)
            results['c2_shift_mult15'] = await rot_of(page, text_id)
            # (d) digitar 30 no campo + Enter
            field = page.locator('[data-testid="toolbar-rotation"] input')
            await field.click(); await field.fill('30'); await field.press('Enter')
            await page.wait_for_timeout(120)
            results['d_campo30'] = await rot_of(page, text_id)
            # (e) screenshot com texto girado 90 e barcode 0
            await page.locator(f'[data-element-id="{text_id}"]').click()
            await page.locator('[data-testid="toolbar-rotate90"]').click()
            await page.wait_for_timeout(120)
            bc_id = await page.evaluate("() => document.querySelector('[data-element-type=\"barcode\"]').getAttribute('data-element-id')")
            results['e_barcode_rot'] = await rot_of(page, bc_id)
            results['e_text_rot'] = await rot_of(page, text_id)
            await page.screenshot(path=str(ROOT / 'preview_girar_editor_1440.png'))
            # (f) HTML de impressao: mesma regra de renderElement
            html = await page.evaluate("() => document.body.innerHTML.length")
            results['f_print_snippet_ok'] = 'rotate' in open(ROOT / 'src/utils/labelPrint.ts').read()
            results['g_scrollX'] = await page.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
            results['g_errors'] = errors[:3]
            await page.close()
        await browser.close()
    finally:
        server.terminate()
    print(json.dumps(results, ensure_ascii=False))

asyncio.run(main())
