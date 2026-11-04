import asyncio, pathlib, subprocess, sys, time
from playwright.async_api import async_playwright

ROOT = pathlib.Path('/home/user/sessions/07f7c/work/v38')
URL = 'http://localhost:4185/editor.html'
RESULTS = []

def rec(key, ok, detail):
    RESULTS.append((key, 'OK' if ok else 'FALHOU', detail))

READ_JS = """(id) => {
  const canvas = document.querySelector('.absolute.inset-0.overflow-hidden.rounded-\\\\[3px\\\\]');
  const cr = canvas.getBoundingClientRect();
  const el = document.querySelector(`[data-element-id="${id}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const units = cr.width / 181;
  const w = r.width / units, h = r.height / units;
  const cxU = (r.left + r.width / 2 - cr.left) / units, cyU = (r.top + r.height / 2 - cr.top) / units;
  return { units, cx: cxU, cy: cyU, w, h, x: cxU - w / 2, y: cyU - h / 2, rot: el.getAttribute('data-rotation') || '0' };
}"""

async def box(pg, id):
    return await pg.evaluate(READ_JS, id)

async def oob(pg):
    return await pg.evaluate("() => document.querySelectorAll('[data-out-of-bounds=\"true\"]').length")

def fits(b):
    return b['w'] <= 181 + 0.6 and b['h'] <= 113 + 0.6

def inside(b):
    # Regra: se a caixa girada cabe na etiqueta, tem que ficar dentro (+-0.6).
    # Se nao cabe (maior que a etiqueta no eixo), fica centralizada no eixo que estoura e o marcador deve aparecer.
    if fits(b):
        return b['cx'] - b['w'] / 2 >= -0.6 and b['cx'] + b['w'] / 2 <= 181.6 and b['cy'] - b['h'] / 2 >= -0.6 and b['cy'] + b['h'] / 2 <= 113.6
    ok = True
    if b['h'] > 113 + 0.6 and abs(b['cy'] - 56.5) > 0.6: ok = False
    if b['w'] > 181 + 0.6 and abs(b['cx'] - 90.5) > 0.6: ok = False
    return ok

async def drag_to_x_right(pg, id, target_right_units):
    b = await box(pg, id)
    dxu = target_right_units - (b['cx'] + b['w'] / 2)
    sx = await pg.evaluate(f"() => {{ const r = document.querySelector('[data-element-id=\"{id}\"]').getBoundingClientRect(); return [r.left + r.width/2, r.top + r.height/2]; }}")
    px, py = sx
    await pg.mouse.move(px, py); await pg.mouse.down()
    tx = px + dxu * b['units']
    for i in range(1, 7):
        await pg.mouse.move(px + (tx - px) * i / 6, py)
    await pg.mouse.up(); await pg.wait_for_timeout(120)

async def main():
    subprocess.run(['npx', 'vite', 'build', '--config', 'harness/vite.harness.config.ts'], cwd=ROOT, capture_output=True)
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', '4185', '--directory', str(ROOT / 'harness' / 'dist')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.2)
    errors = []
    try:
        async with async_playwright() as p:
            br = await p.chromium.launch()
            pg = await br.new_page(viewport={'width': 1440, 'height': 900})
            pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
            pg.on('pageerror', lambda e: errors.append(str(e)))
            await pg.goto(URL); await pg.wait_for_timeout(900)

            # (a) barcode sem giro, arrastado para a borda direita; depois Girar 90 pela toolbar
            await pg.evaluate("() => document.querySelector('[data-element-id=\"barcode-key\"]').click()")
            await drag_to_x_right(pg, 'barcode-key', 181)
            await pg.get_by_test_id('toolbar-rotate90').click(); await pg.wait_for_timeout(150)
            b = await box(pg, 'barcode-key')
            rec('a girar 90 na borda: caixa dentro (+-0.6)', inside(b), f"cx={b['cx']:.2f} cy={b['cy']:.2f} w={b['w']:.2f} h={b['h']:.2f} rot={b['rot']}")
            n = await oob(pg)
            rec('a marcador out-of-bounds coerente com caixa (0 se cabe, 1 se nao cabe)', n == (0 if fits(b) else 1), f'oob={n} cabe={fits(b)}')
            await pg.screenshot(path=str(ROOT / 'preview_girar_borda.png'))

            # (b) Ctrl+Z volta giro e posicao em 1 passo
            before_undo = await box(pg, 'barcode-key')
            await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(120)
            u = await box(pg, 'barcode-key')
            rec('b Ctrl+Z desfaz giro (rot 0)', u['rot'] == '0', f"rot={u['rot']} antes={before_undo['rot']}")

            # (c) campo de graus com item na borda -> dentro
            await drag_to_x_right(pg, 'barcode-key', 181)
            field = pg.get_by_test_id('toolbar-rotation').locator('input').first
            await field.click(); await field.fill('45'); await field.press('Enter'); await pg.wait_for_timeout(150)
            c = await box(pg, 'barcode-key')
            rec('c campo 45 na borda: caixa dentro', inside(c), f"cx={c['cx']:.2f} w={c['w']:.2f} h={c['h']:.2f} rot={c['rot']}")

            # (d) alca de girar com item na borda e soltar -> dentro apos soltar
            await pg.evaluate("() => document.querySelector('[data-element-id=\"barcode-key\"]').click()")
            await pg.get_by_test_id('toolbar-rotate90').click(); await pg.wait_for_timeout(120)
            rot_btn = await pg.evaluate("() => { const b = document.querySelector('[data-element-id=\"barcode-key\"] [data-rotate]'); if (!b) return null; const r = b.getBoundingClientRect(); return [r.left + r.width/2, r.top + r.height/2]; }")
            if rot_btn:
                await pg.mouse.move(rot_btn[0], rot_btn[1]); await pg.mouse.down()
                await pg.mouse.move(rot_btn[0] + 80, rot_btn[1] + 20, steps=6)
                await pg.mouse.up(); await pg.wait_for_timeout(150)
            d = await box(pg, 'barcode-key')
            rec('d alca girar + soltar: caixa dentro', inside(d), f"cx={d['cx']:.2f} cy={d['cy']:.2f} w={d['w']:.2f} h={d['h']:.2f} rot={d['rot']}")

            await pg.screenshot(path=str(ROOT / 'preview_girar_borda.png'))
            sx = await pg.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
            rec('f sem rolagem horizontal', sx <= 0, f'extra={sx}')
            rec('f console sem erros', len(errors) == 0, f'erros={len(errors)} {errors[:2]}')
            await br.close()
    finally:
        srv.terminate()
    for k, s, dtl in RESULTS:
        print(f'{k} | {s} | {dtl}')
    print('TOTAL FALHOU=', sum(1 for r in RESULTS if r[1] == 'FALHOU'))

asyncio.run(main())
