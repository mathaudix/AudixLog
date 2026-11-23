import asyncio, json, pathlib, subprocess, sys, time
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
  return {
    scrW: cr.width, scrH: cr.height, units,
    x: (r.left - cr.left) / units, y: (r.top - cr.top) / units,
    w: r.width / units, h: r.height / units,
    styleLeft: parseFloat(el.style.left) / (parseFloat(el.style.left) ? 1 : 1),
    rot: el.getAttribute('data-rotation') || '0',
  };
}"""

async def unit_box(pg, id):
    return await pg.evaluate(READ_JS, id)

async def guides(pg):
    return await pg.evaluate("() => document.querySelectorAll('.bg-pink-500\\\\/80').length")

async def oob(pg):
    return await pg.evaluate("() => document.querySelectorAll('[data-out-of-bounds=\"true\"]').length")

async def drag(pg, id, dxu, dyu, alt=False, steps=6, shot=None):
    b = await unit_box(pg, id)
    sx = b['x'] + b['w'] / 2; sy = b['y'] + b['h'] / 2
    cx = b['scrW'] / 2
    start = await pg.evaluate(f"() => {{ const r = document.querySelector('[data-element-id=\"{id}\"]').getBoundingClientRect(); return [r.left + r.width/2, r.top + r.height/2]; }}")
    px, py = start
    if alt: await pg.keyboard.down('Alt')
    await pg.mouse.move(px, py)
    await pg.mouse.down()
    tx = px + dxu * b['units']; ty = py + dyu * b['units']
    for i in range(1, steps + 1):
        await pg.mouse.move(px + (tx - px) * i / steps, py + (ty - py) * i / steps)
    g = await guides(pg)
    if shot: await pg.screenshot(path=shot)
    await pg.mouse.up()
    if alt: await pg.keyboard.up('Alt')
    await pg.wait_for_timeout(120)
    return g

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

            # ITEM (a): centro do texto 'text-branch' a 1.5 unidade do centro da etiqueta
            b = await unit_box(pg, 'text-branch')
            cur = b['x'] + b['w'] / 2
            g = await drag(pg, 'text-branch', 90.5 - cur + 1.5, 0, shot=str(ROOT / 'preview_guias.png'))
            after = await unit_box(pg, 'text-branch')
            diff = abs(after['x'] + after['w'] / 2 - 90.5)
            rec('1a centro: guias durante arrasto', g >= 1, f'guias={g}')
            rec('1a centro: |diff| apos soltar <= 0.6 un', diff <= 0.6, f'diff={diff:.2f} un')

            # ITEM (c): borda esquerda de 'text-branch' a 1.5 unidade da borda esquerda de 'text-number'
            ref = await unit_box(pg, 'text-number')
            await drag(pg, 'text-branch', 0, 0)  # no-op para garantir estado
            cur = await unit_box(pg, 'text-branch')
            await drag(pg, 'text-branch', 20 - cur['x'] + 0, 0, alt=True)  # afasta com Alt
            cur = await unit_box(pg, 'text-branch')
            target_x = ref['x'] + 1.5
            g = await drag(pg, 'text-branch', target_x - cur['x'], 0)
            after = await unit_box(pg, 'text-branch')
            rec('1c borda: |diff| apos soltar <= 0.6 un', abs(after['x'] - ref['x']) <= 0.6, f"diff={abs(after['x'] - ref['x']):.2f} un guias={g}")

            # ITEM (d): barcode girado 90 pela toolbar e arrastado para fora da borda direita
            await pg.evaluate("() => document.querySelector('[data-element-id=\"barcode-key\"]').click()")
            btn = pg.get_by_role('button', name='Girar 90°').or_(pg.get_by_text('Girar 90°')).first
            await btn.click(); await pg.wait_for_timeout(120)
            b = await unit_box(pg, 'barcode-key')
            await drag(pg, 'barcode-key', 181 - b['x'] - b['w'] / 2 + 40, 0, steps=8)
            b = await unit_box(pg, 'barcode-key')
            inside = b['x'] >= -0.6 and b['x'] + b['w'] <= 181 + 0.6
            marked = await oob(pg)
            rec('1d barcode girado: caixa dentro OU marcador', inside or marked > 0, f"x={b['x']:.2f} w={b['w']:.2f} oob={marked} rot={b['rot']}")
            await pg.screenshot(path=str(ROOT / 'preview_fora_limite.png'))

            # 4) Ctrl+Z desfaz em 1 passo (arrasto de 'text-branch')
            pre = await unit_box(pg, 'text-branch')
            await drag(pg, 'text-branch', 10, 0)
            await pg.keyboard.press('Control+z'); await pg.wait_for_timeout(120)
            back = await unit_box(pg, 'text-branch')
            rec('4 Ctrl+Z 1 passo', abs(back['x'] - pre['x']) <= 0.6, f"antes={pre['x']:.2f} depois_undo={back['x']:.2f}")

            # Alt sem encaixe: arrasto perto do centro com Alt -> sem guias
            b = await unit_box(pg, 'text-branch')
            g = await drag(pg, 'text-branch', 90.5 - (b['x'] + b['w'] / 2) + 1.5, 0, alt=True)
            rec('4 Alt sem guias', g == 0, f'guias={g}')

            # rolagem horizontal
            sx = await pg.evaluate("() => document.documentElement.scrollWidth - document.documentElement.clientWidth")
            rec('4 sem rolagem horizontal', sx <= 0, f'extra={sx}')
            rec('4 console sem erros', len(errors) == 0, f'erros={len(errors)} {errors[:2]}')
            await br.close()
    finally:
        srv.terminate()
    for k, s, d in RESULTS:
        print(f'{k} | {s} | {d}')
    print('TOTAL FALHOU=', sum(1 for r in RESULTS if r[1] == 'FALHOU'))

asyncio.run(main())
