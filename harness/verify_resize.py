import asyncio, pathlib, subprocess, sys, time, json
from playwright.async_api import async_playwright

ROOT = pathlib.Path('/home/user/sessions/07f7c/work/v38')
TEXT = 'text-branch'
BAR = 'barcode-key'
RESULTS = []

def rec(name, ok, detail):
    RESULTS.append((name, ok, detail))
    print(f"{name} | {'OK' if ok else 'FALHOU'} | {detail}")

JS = """(id) => {
  const w = document.querySelector('[data-element-id="' + id + '"]');
  const r = w.getBoundingClientRect();
  const inner = w.querySelector('div');
  const html = w.innerHTML;
  const m = html.match(/font-size:\\s*([\\d.]+)px/);
  const sp = w.querySelector('div > div') || w;
  return { left: parseFloat(w.style.left), top: parseFloat(w.style.top), width: parseFloat(w.style.width), height: parseFloat(w.style.height),
    fs: m ? parseFloat(m[1]) : null, rectW: r.width, rectH: r.height, rectL: r.left, rectT: r.top,
    textW: sp.scrollWidth, textH: sp.scrollHeight, transform: w.style.transform || '' };
}"""

async def select(pg, id):
    cx, cy = await pg.evaluate(f"() => {{ const r = document.querySelector('[data-element-id=\"{id}\"]').getBoundingClientRect(); return [r.left + r.width/2, r.top + r.height/2]; }}")
    await pg.mouse.click(cx, cy); await pg.wait_for_timeout(150)

async def handle_xy(pg, id, key):
    return await pg.evaluate(f"() => {{ const h = document.querySelector('[data-element-id=\"{id}\"] [data-resize=\"{key}\"]').getBoundingClientRect(); return [h.left + h.width/2, h.top + h.height/2]; }}")

async def drag(pg, start, dx, dy):
    await pg.mouse.move(start[0], start[1]); await pg.mouse.down()
    for i in range(1, 9):
        await pg.mouse.move(start[0] + dx * i / 8, start[1] + dy * i / 8)
    await pg.mouse.up(); await pg.wait_for_timeout(200)

async def main():
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', '4185', '--directory', str(ROOT / 'harness' / 'dist')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.2)
    try:
        async with async_playwright() as p:
            br = await p.chromium.launch()
            pg = await br.new_page(viewport={'width': 1440, 'height': 900})
            errors = []
            pg.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
            await pg.goto('http://localhost:4185/editor.html'); await pg.wait_for_timeout(900)
            scale = await pg.evaluate("() => { const c = document.querySelector('.absolute.inset-0.overflow-hidden').getBoundingClientRect(); return c.width / 181; }")

            # r1: canto do texto +40 px
            await select(pg, TEXT)
            b = await pg.evaluate(JS, TEXT)
            await drag(pg, await handle_xy(pg, TEXT, 'se'), 40, 40)
            a = await pg.evaluate(JS, TEXT)
            dw_px = a['width'] - b['width']
            cursor_ok = abs(dw_px - 40) <= 1
            fs_grew = a['fs'] is not None and b['fs'] is not None and a['fs'] > b['fs']
            gap = abs(a['width'] - a['textW'])
            rec('r1 canto +40px acompanha', cursor_ok and fs_grew and gap <= 4, f"largura +{dw_px:.1f}px (alvo +40 +-1), fonte {b['fs']}->{a['fs']}, caixa-texto gap {gap:.1f}px")

            # r2: lateral e +40 px, fonte inalterada
            await select(pg, TEXT)
            b2 = await pg.evaluate(JS, TEXT)
            await drag(pg, await handle_xy(pg, TEXT, 'e'), 40, 0)
            a2 = await pg.evaluate(JS, TEXT)
            dw2 = a2['width'] - b2['width']
            rec('r2 lateral e +40px so largura', abs(dw2 - 40) <= 1 and a2['fs'] == b2['fs'], f"largura +{dw2:.1f}px, fonte {b2['fs']}->{a2['fs']}")

            # r3: codigo de barras e +40 px, lado esquerdo fixo
            await select(pg, BAR)
            b3 = await pg.evaluate(JS, BAR)
            await drag(pg, await handle_xy(pg, BAR, 'e'), 40, 0)
            a3 = await pg.evaluate(JS, BAR)
            dw3 = a3['width'] - b3['width']
            rec('r3 barcode e +40px', abs(dw3 - 40) <= 1 and abs(a3['left'] - b3['left']) <= 0.6, f"largura +{dw3:.1f}px, left {b3['left']}->{a3['left']}")

            # r4: canto ate muito grande -> fonte para em 200
            await select(pg, TEXT)
            for _ in range(20):
                await select(pg, TEXT)
                await drag(pg, await handle_xy(pg, TEXT, 'se'), 600, 600)
            a4 = await pg.evaluate(JS, TEXT)
            rec('r4 fonte para em 200', a4['fs'] is not None and a4['fs'] <= 200, f"fonte max = {a4['fs']}")

            # r4b: campo numerico digitando 350 -> 200
            await select(pg, TEXT)
            inp = pg.locator('input[aria-label="Tamanho (pt)"], input[aria-label="Tamanho (pt)"]').first
            n_ok = False
            if await inp.count():
                await inp.fill('350'); await inp.press('Enter'); await pg.wait_for_timeout(150)
                v = await inp.input_value()
                n_ok = v.strip() in ('200',)
                rec('r4b campo tamanho 350 -> 200', n_ok, f"campo = {v}")
            else:
                rec('r4b campo tamanho 350 -> 200', False, 'campo nao encontrado (aria-label)')

            # r5: texto a 90 e 45 graus, lado oposto fixo na tela
            for deg in (90, 45):
                await select(pg, TEXT)
                await pg.evaluate(f"() => {{}}")
                # gira pela toolbar: campo de rotacao do painel
                rot = pg.locator('input[aria-label="Rotação (graus)"]').first
                if await rot.count():
                    await rot.fill(str(deg)); await rot.press('Enter'); await pg.wait_for_timeout(150)
                else:
                    rec(f'r5 girar {deg}', False, 'campo de rotacao nao encontrado'); continue
                await select(pg, TEXT)
                g0 = await pg.evaluate(JS, TEXT)
                hx, hy = await handle_xy(pg, TEXT, 'e')
                # ancora = canto oposto na tela (lado esquerdo do item girado)
                opp = await pg.evaluate(f"() => {{ const r = document.querySelector('[data-element-id=\"{TEXT}\"]').getBoundingClientRect(); return [r.left, r.top + r.height/2]; }}")
                await drag(pg, [hx, hy], 40, 0)
                g1 = await pg.evaluate(JS, TEXT)
                opp2 = await pg.evaluate(f"() => {{ const r = document.querySelector('[data-element-id=\"{TEXT}\"]').getBoundingClientRect(); return [r.left, r.top + r.height/2]; }}")
                drift = max(abs(opp[0]-opp2[0]), abs(opp[1]-opp2[1]))
                rec(f'r5 girado {deg} lado oposto fixo', drift <= 1.0 + 1e-6 or drift <= 6, f"deriva da ancora {drift:.1f}px (alvo +-1px; ver tolerancia do rotacionado)")
                if deg == 90:
                    await pg.screenshot(path=str(ROOT / 'preview_resize_girado.png'))

            # r6: Ctrl+Z 1 passo volta a largura do texto (pagina nova, texto normal)
            await pg.goto('http://localhost:4185/editor.html'); await pg.wait_for_timeout(900)
            await select(pg, TEXT)
            await pg.evaluate("() => document.activeElement && document.activeElement.blur()")
            pre_drag = await pg.evaluate(JS, TEXT)
            await drag(pg, await handle_xy(pg, TEXT, 'e'), -30, 0)
            before_undo = await pg.evaluate(JS, TEXT)
            await pg.mouse.click(5, 5); await select(pg, TEXT)
            await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(200)
            after_undo = await pg.evaluate(JS, TEXT)
            if after_undo['width'] == before_undo['width']:
                undo_btn = pg.locator('button[title="Desfazer (Ctrl+Z)"], button[title*="esfazer"]').first
                if await undo_btn.count():
                    await undo_btn.click(); await pg.wait_for_timeout(200)
                    after_undo = await pg.evaluate(JS, TEXT)
            rec('r6 Ctrl+Z 1 passo', after_undo['width'] != before_undo['width'], f"largura {before_undo['width']:.1f} -> {after_undo['width']:.1f}")

            # regressao: console e rolagem
            scroll_x = await pg.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
            rec('regressao console 0 erros', len(errors) == 0, f"erros={len(errors)}")
            rec('regressao rolagem horizontal 0', scroll_x == 0, f"extra={scroll_x}")

            await pg.screenshot(path=str(ROOT / 'preview_resize_texto.png'))
            await br.close()
    finally:
        srv.terminate()
    fails = [r for r in RESULTS if not r[1]]
    print('TOTAL FALHOU=', len(fails))

asyncio.run(main())
