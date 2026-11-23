import asyncio, pathlib, subprocess, sys, time
from playwright.async_api import async_playwright

ROOT = pathlib.Path('/home/user/sessions/07f7c/work/v38')
URL = 'http://localhost:4185/editor.html'
RESULTS = []

def rec(key, ok, detail):
    RESULTS.append((key, 'OK' if ok else 'FALHOU', detail))

GEO_JS = """(id) => {
  const canvas = document.querySelector('.absolute.inset-0.overflow-hidden.rounded-\\\\[3px\\\\]');
  const cr = canvas.getBoundingClientRect();
  const units = cr.width / 181;
  const el = document.querySelector(`[data-element-id="${id}"]`);
  const r = el.getBoundingClientRect();
  const rot = Number(el.getAttribute('data-rotation') || 0);
  const handle = (k) => { const h = el.querySelector(`[data-resize="${k}"]`); if (!h) return null; const b = h.getBoundingClientRect(); return [(b.left + b.width/2 - cr.left)/units, (b.top + b.height/2 - cr.top)/units]; };
  return { units, rot, cx: (r.left + r.width/2 - cr.left)/units, cy: (r.top + r.height/2 - cr.top)/units,
           w: r.width / units, h: r.height / units,
           handles: { e: handle('e'), w: handle('w'), n: handle('n'), s: handle('s'), se: handle('se'), nw: handle('nw') } };
}"""

async def geo(pg, id):
    return await pg.evaluate(GEO_JS, id)

async def drag(pg, start, end, steps=8):
    await pg.mouse.move(start[0], start[1]); await pg.mouse.down()
    for i in range(1, steps + 1):
        await pg.mouse.move(start[0] + (end[0] - start[0]) * i / steps, start[1] + (end[1] - start[1]) * i / steps)
    await pg.mouse.up(); await pg.wait_for_timeout(150)

async def handle_px(pg, id, key):
    cx, cy = await pg.evaluate(f"() => {{ const r = document.querySelector('[data-element-id=\"{id}\"]').getBoundingClientRect(); return [r.left + r.width/2, r.top + r.height/2]; }}")
    await pg.mouse.click(cx, cy); await pg.wait_for_timeout(120)
    await pg.wait_for_selector(f'[data-element-id="{id}"] [data-resize="{key}"]', state='attached')
    return await pg.evaluate(f"""() => {{ const el = document.querySelector('[data-element-id="{id}"]'); const h = el.querySelector('[data-resize="{key}"]'); const b = h.getBoundingClientRect(); return [b.left + b.width/2, b.top + b.height/2]; }}""")

async def set_rotation(pg, deg):
    f = pg.get_by_test_id('toolbar-rotation').locator('input').first
    await f.fill(str(deg)); await f.press('Enter'); await pg.wait_for_timeout(150)

def anchor_of(g, handle_key):
    # ponto global (canvas units) do lado oposto a 'handle_key' para um elemento de centro (cx,cy), tamanho local (w,h), rot
    import math
    k = handle_key
    opp_x = -1 if 'e' in k else (1 if 'w' in k else 0)
    opp_y = -1 if 's' in k else (1 if 'n' in k else 0)
    lx = opp_x * g['w'] / 2; ly = opp_y * g['h'] / 2
    a = math.radians(g['rot'])
    return (g['cx'] + lx * math.cos(a) - ly * math.sin(a), g['cy'] + lx * math.sin(a) + ly * math.cos(a))

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
            ID = 'text-branch'
            cx_px, cy_px = await pg.evaluate(f"() => {{ const r = document.querySelector('[data-element-id=\"{ID}\"]').getBoundingClientRect(); return [r.left + r.width/2, r.top + r.height/2]; }}")
            await pg.mouse.click(cx_px, cy_px); await pg.wait_for_timeout(150)

            # (a3) sem giro: alca direita +20 un -> largura +20 e ancora esquerda fixa
            g0 = await geo(pg, ID)
            a0 = anchor_of(g0, 'e')  # ancora = lado oposto a 'e' = esquerdo
            # o hook converte pixel->unidade com zoom (80%): 1 unidade = 0.8 px de arrasto
            scale_px = 0.8
            hx, hy = await handle_px(pg, ID, 'e')
            await drag(pg, (hx, hy), (hx + 20 * scale_px, hy))
            g3 = await geo(pg, ID)
            a3 = anchor_of(g3, 'e')
            rec('a3 sem giro: largura +20 (+-1)', abs(g3['w'] - (g0['w'] + 20)) <= 1, f"w {g0['w']:.2f} -> {g3['w']:.2f}")
            rec('a3 sem giro: ancora fixa (+-0.6)', abs(a3[0] - a0[0]) <= 0.6 and abs(a3[1] - a0[1]) <= 0.6, f"anc {a0[0]:.2f},{a0[1]:.2f} -> {a3[0]:.2f},{a3[1]:.2f}")

            # (a4) Ctrl+Z desfaz o resize em 1 passo
            await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(120)
            gu = await geo(pg, ID)
            rec('a4 Ctrl+Z 1 passo volta largura', abs(gu['w'] - g0['w']) <= 0.6, f"w={gu['w']:.2f} original={g0['w']:.2f}")

            # (a1) girar 90 e alca direita local +20 -> largura local +20, ancora fixa
            await set_rotation(pg, 90)
            g90 = await geo(pg, ID)
            a90 = anchor_of(g90, 'e')
            hx, hy = await handle_px(pg, ID, 'e')
            # eixo local +x a 90deg aponta para baixo na tela: arrasta 20 un para baixo
            await drag(pg, (hx, hy), (hx, hy + 20 * scale_px))
            g1 = await geo(pg, ID)
            a1 = anchor_of(g1, 'e')
            rec('a1 giro 90: largura local +20 (+-1)', abs(g1['w'] - (g90['w'] + 20)) <= 1, f"w {g90['w']:.2f} -> {g1['w']:.2f}")
            rec('a1 giro 90: ancora fixa (+-0.6)', abs(a1[0] - a90[0]) <= 0.6 and abs(a1[1] - a90[1]) <= 0.6, f"anc {a90[0]:.2f},{a90[1]:.2f} -> {a1[0]:.2f},{a1[1]:.2f}")
            await pg.screenshot(path=str(ROOT / 'preview_resize_girado.png'))

            # (a2) 45 graus, alca de canto -> ancora fixa
            await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(120)
            await set_rotation(pg, 45)
            g45 = await geo(pg, ID)
            a45 = anchor_of(g45, 'se')
            hx, hy = await handle_px(pg, ID, 'se')
            await drag(pg, (hx, hy), (hx + 12 * scale_px, hy + 6 * scale_px))
            g2 = await geo(pg, ID)
            a2 = anchor_of(g2, 'se')
            rec('a2 giro 45 canto: ancora fixa (+-0.6)', abs(a2[0] - a45[0]) <= 0.6 and abs(a2[1] - a45[1]) <= 0.6, f"anc {a45[0]:.2f},{a45[1]:.2f} -> {a2[0]:.2f},{a2[1]:.2f}")

            sx = await pg.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
            rec('regressao sem rolagem horizontal', sx <= 0, f'extra={sx}')
            rec('regressao console sem erros', len(errors) == 0, f'erros={len(errors)} {errors[:2]}')
            await br.close()
    finally:
        srv.terminate()
    for k, s, d in RESULTS:
        print(f'{k} | {s} | {d}')
    print('TOTAL FALHOU=', sum(1 for r in RESULTS if r[1] == 'FALHOU'))

asyncio.run(main())
