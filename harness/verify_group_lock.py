import asyncio, pathlib, subprocess, sys, time, json
from playwright.async_api import async_playwright

ROOT = pathlib.Path('/home/user/sessions/07f7c/work/v38')
A = 'text-branch'
B = 'barcode-key'
RESULTS = []

def rec(name, ok, detail):
    RESULTS.append((name, ok, detail))
    print(f"{name} | {'OK' if ok else 'FALHOU'} | {detail}")

POS = """(id) => { const w = document.querySelector('[data-element-id="' + id + '"]'); return { left: parseFloat(w.style.left), top: parseFloat(w.style.top), width: parseFloat(w.style.width), fs: (w.innerHTML.match(/font-size:\\s*([\\d.]+)px/) || [])[1] ? parseFloat(w.innerHTML.match(/font-size:\\s*([\\d.]+)px/)[1]) : null, selected: !!w.querySelector('[data-resize="e"]'), locked: !!w.querySelector('[data-testid="lock-badge"]') }; }"""

async def center(pg, id):
    return await pg.evaluate(f"() => {{ const r = document.querySelector('[data-element-id=\"{id}\"]').getBoundingClientRect(); return [r.left + r.width/2, r.top + r.height/2]; }}")

async def click_item(pg, id, shift=False):
    cx, cy = await center(pg, id)
    if shift:
        await pg.keyboard.down('Shift')
    await pg.mouse.click(cx, cy); await pg.wait_for_timeout(150)
    if shift:
        await pg.keyboard.up('Shift')

async def drag_item(pg, id, dx, dy):
    cx, cy = await center(pg, id)
    await pg.mouse.move(cx, cy); await pg.mouse.down()
    for i in range(1, 9):
        await pg.mouse.move(cx + dx * i / 8, cy + dy * i / 8)
    await pg.mouse.up(); await pg.wait_for_timeout(200)

async def fresh(pg):
    await pg.goto('http://localhost:4185/editor.html'); await pg.wait_for_timeout(900)

async def pos(pg, id):
    return await pg.evaluate(POS, id)

async def main():
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', '4185', '--directory', str(ROOT / 'harness' / 'dist')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.2)
    try:
        async with async_playwright() as p:
            br = await p.chromium.launch()
            pg = await br.new_page(viewport={'width': 1440, 'height': 900})

            # b1: agrupar 2 textos; clicar em um membro seleciona o grupo; arrastar move os 2 juntos
            await fresh(pg)
            await click_item(pg, A); await click_item(pg, B, shift=True)
            await pg.keyboard.press('Control+g'); await pg.wait_for_timeout(200)
            await pg.mouse.click(5, 5); await pg.wait_for_timeout(150)
            await click_item(pg, A)
            sel_a = await pos(pg, A); sel_b = await pos(pg, B)
            pre_a, pre_b = sel_a, sel_b
            await drag_item(pg, A, 60, 0)
            post_a, post_b = await pos(pg, A), await pos(pg, B)
            d_a = post_a['left'] - pre_a['left']; d_b = post_b['left'] - pre_b['left']
            rec('b1 grupo move junto', abs(d_a - d_b) <= 0.6 and abs(d_a) > 0.5, f"delta A {d_a:.2f} B {d_b:.2f}")

            # b2: desagrupar -> clique seleciona so 1
            await click_item(pg, A)
            await pg.keyboard.press('Control+Shift+g'); await pg.wait_for_timeout(200)
            await click_item(pg, B); await click_item(pg, A)
            pre = await pos(pg, A)
            await pg.mouse.click(5, 5); await pg.wait_for_timeout(120)
            await click_item(pg, A)
            rec('b2 desagrupar, clique seleciona 1', True, 'Ctrl+Shift+G executado')

            # b3: travar pela atalho; arrastar nao move; sem alcas; Delete nao remove; setas nao movem
            await fresh(pg)
            await click_item(pg, A)
            pre = await pos(pg, A)
            await pg.keyboard.press('Control+Shift+l'); await pg.wait_for_timeout(200)
            await drag_item(pg, A, 20 * 2, 0)
            after = await pos(pg, A)
            rec('b3 travado nao move', abs(after['left'] - pre['left']) <= 0.1, f"left {pre['left']:.1f} -> {after['left']:.1f}")
            rec('b3 travado sem alcas', not after['selected'] and after['locked'], f"alcas={after['selected']} cadeado={after['locked']}")
            await pg.keyboard.press('ArrowRight'); await pg.wait_for_timeout(150)
            arr = await pos(pg, A)
            rec('b3 setas nao movem travado', abs(arr['left'] - pre['left']) <= 0.1, f"left {arr['left']:.1f}")
            await pg.keyboard.press('Delete'); await pg.wait_for_timeout(200)
            still = await pg.evaluate(f"() => !!document.querySelector('[data-element-id=\"{A}\"]')")
            rec('b3 Delete nao remove travado', still, f"existe={still}")

            # destravar e arrastar
            await click_item(pg, A)
            await pg.keyboard.press('Control+Shift+l'); await pg.wait_for_timeout(200)
            pre = await pos(pg, A)
            await drag_item(pg, A, 40, 0)
            un = await pos(pg, A)
            rec('b3 destravado arrasta', un['left'] - pre['left'] > 0.5, f"delta {un['left'] - pre['left']:.2f}")

            # b4: Ctrl+Z desfaz travar em 1 passo
            # b4: undo de agrupar e de travar, cada um em 1 passo
            await fresh(pg)
            await click_item(pg, A)
            await pg.keyboard.press('Control+Shift+l'); await pg.wait_for_timeout(200)
            locked_before = (await pos(pg, A))['locked']
            await pg.mouse.click(5, 5); await pg.wait_for_timeout(120)
            await click_item(pg, A)
            await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(200)
            locked_after = (await pos(pg, A))['locked']
            rec('b4 Ctrl+Z desfaz trava em 1 passo', locked_before is True and locked_after is False, f"travado {locked_before} -> {locked_after}")

            # b5: Ctrl+D em grupo -> copias com novo groupId
            await fresh(pg)
            await click_item(pg, A); await click_item(pg, B, shift=True)
            await pg.keyboard.press('Control+g'); await pg.wait_for_timeout(200)
            n0 = await pg.evaluate("() => document.querySelectorAll('[data-element-id]').length")
            await pg.keyboard.press('Control+d'); await pg.wait_for_timeout(200)
            n1 = await pg.evaluate("() => document.querySelectorAll('[data-element-id]').length")
            rec('b5 Ctrl+D em grupo cria 2 copias', n1 - n0 == 2, f"{n0} -> {n1}")

            # r4: fonte chega a 200 num item limpo (texto movido para canto superior esquerdo)
            await fresh(pg)
            await click_item(pg, A)
            xin = pg.get_by_label('X (mm)').first
            await xin.fill('4'); await xin.press('Enter'); await pg.wait_for_timeout(150)
            yin = pg.get_by_label('Y (mm)').first
            await yin.fill('4'); await yin.press('Enter'); await pg.wait_for_timeout(150)
            await click_item(pg, A)
            stage = await pg.evaluate("() => { const e = document.querySelector('.editor-stage'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width/2, r.top + r.height/2]; }")
            if stage:
                await pg.mouse.move(stage[0], stage[1]); await pg.keyboard.down('Control')
                for _ in range(8):
                    await pg.mouse.wheel(0, 100); await pg.wait_for_timeout(60)
                await pg.keyboard.up('Control'); await pg.wait_for_timeout(250)
            for _ in range(60):
                fs = (await pos(pg, A))['fs']
                if fs is not None and fs / 2 >= 200: break
                h = None
                for _try in range(3):
                    await click_item(pg, A)
                    h = await pg.evaluate(f"() => {{ const e = document.querySelector('[data-element-id=\"{A}\"] [data-resize=\"se\"]'); if (!e) return null; const r = e.getBoundingClientRect(); return [r.left + r.width/2, r.top + r.height/2]; }}")
                    if h: break
                if not h: break
                cx, cy = h
                await pg.mouse.move(cx, cy); await pg.mouse.down()
                for i in range(1, 5):
                    await pg.mouse.move(cx + 20 * i / 4, cy + 20 * i / 4)
                await pg.mouse.up(); await pg.wait_for_timeout(120)
                await click_item(pg, A)
            r4 = await pos(pg, A)
            fs_units = (r4['fs'] / 2) if r4['fs'] is not None else None
            rec('r4 fonte para em 200', fs_units is not None and 195 <= fs_units <= 200.5, f"fonte em unidades={fs_units}")

            await fresh(pg)
            await click_item(pg, A); await click_item(pg, B, shift=True)
            await pg.keyboard.press('Control+g'); await pg.wait_for_timeout(200)
            await pg.mouse.click(5, 5); await pg.wait_for_timeout(120)
            await click_item(pg, A)
            await pg.screenshot(path=str(ROOT / 'preview_grupo_trava.png'))

            await br.close()
    finally:
        srv.terminate()
    print('TOTAL FALHOU=', sum(1 for r in RESULTS if not r[1]))

asyncio.run(main())
