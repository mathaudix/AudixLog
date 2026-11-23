import asyncio, pathlib, subprocess, sys, time
from playwright.async_api import async_playwright

ROOT = pathlib.Path('/home/user/sessions/07f7c/work/v38')
A = 'text-branch'
B = 'barcode-key'
RESULTS = []

def rec(name, ok, detail):
    RESULTS.append((name, ok, detail))
    print(f"{name} | {'OK' if ok else 'FALHOU'} | {detail}")

POS = """(id) => { const w = document.querySelector('[data-element-id="' + id + '"]'); return { left: parseFloat(w.style.left), top: parseFloat(w.style.top), width: parseFloat(w.style.width), selected: w.className.includes('z-[60]') }; }"""

async def center(pg, id):
    return await pg.evaluate(f"() => {{ const r = document.querySelector('[data-element-id=\"{id}\"]').getBoundingClientRect(); return [r.left + r.width/2, r.top + r.height/2]; }}")

async def click_item(pg, id, shift=False):
    cx, cy = await center(pg, id)
    if shift:
        await pg.keyboard.down('Shift')
    await pg.mouse.click(cx, cy); await pg.wait_for_timeout(150)
    if shift:
        await pg.keyboard.up('Shift')

async def dbl_item(pg, id):
    cx, cy = await center(pg, id)
    await pg.mouse.dblclick(cx, cy); await pg.wait_for_timeout(200)

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

async def selected_count(pg):
    return await pg.evaluate("() => document.querySelectorAll('[data-element-id][class*=\"z-[60]\"]').length")

async def group_icons(pg):
    return await pg.evaluate("() => document.querySelectorAll('[data-testid=\"group-badge\"]').length")

async def group_ids_in_panel(pg):
    return await pg.evaluate("() => [...document.querySelectorAll('[data-testid=\"group-marker\"]')].map(e => e.style.backgroundColor)")

async def main():
    srv = subprocess.Popen([sys.executable, '-m', 'http.server', '4185', '--directory', str(ROOT / 'harness' / 'dist')], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(1.2)
    try:
        async with async_playwright() as p:
            br = await p.chromium.launch()
            pg = await br.new_page(viewport={'width': 1440, 'height': 900})

            # c1: agrupar 2 textos -> painel mostra icone de grupo nas 2 linhas, 0 nas demais; mesmo marcador
            await fresh(pg)
            before_icons = await group_icons(pg)
            await click_item(pg, A); await click_item(pg, B, shift=True)
            await pg.keyboard.press('Control+g'); await pg.wait_for_timeout(200)
            await pg.mouse.click(5, 5); await pg.wait_for_timeout(150)
            icons = await group_icons(pg)
            markers = await group_ids_in_panel(pg)
            rec('c1 icone de grupo no painel', icons == 2 and len(set(markers)) == 1 and before_icons == 0,
                f"icones={icons} antes={before_icons} marcadores={len(markers)} cores_unicas={len(set(markers))}")

            # c2: clicar linha de um membro no painel -> 2 selecionados
            await pg.evaluate("() => { const row = [...document.querySelectorAll('[data-testid=\"group-badge\"]')][0].closest('button'); row.click(); }")
            await pg.wait_for_timeout(200)
            sel = await selected_count(pg)
            rec('c2 clique na linha do painel seleciona grupo', sel == 2, f"selecionados={sel}")

            # c3: canvas, membro (2 sel), duplo clique -> 1 sel; arrastar move so ele; groupId mantido
            await click_item(pg, A)
            await dbl_item(pg, A)
            sel_after_dbl = await selected_count(pg)
            pre_a, pre_b = await pos(pg, A), await pos(pg, B)
            await drag_item(pg, A, 20, 0)
            post_a, post_b = await pos(pg, A), await pos(pg, B)
            d_a = post_a['left'] - pre_a['left']; d_b = post_b['left'] - pre_b['left']
            icons_after = await group_icons(pg)
            rec('c3 duplo clique isola membro e arrasta so ele', sel_after_dbl == 1 and abs(d_a) > 0.5 and abs(d_b) <= 0.1 and icons_after == 2,
                f"sel={sel_after_dbl} dA={d_a:.2f} dB={d_b:.2f} icones={icons_after}")

            # c4: clicar fora, clicar membro -> 2 selecionados
            await pg.mouse.click(5, 5); await pg.wait_for_timeout(150)
            await click_item(pg, B)
            sel = await selected_count(pg)
            rec('c4 clique fora e membro volta ao grupo', sel == 2, f"selecionados={sel}")

            # c5: texto sem grupo: duplo clique mantem comportamento atual (abre edicao)
            await fresh(pg)
            await dbl_item(pg, 'text-number')
            editing = await pg.evaluate("() => !!document.querySelector('[data-element-id=\"text-number\"] textarea')")
            rec('c5 texto sem grupo: duplo clique abre edicao (comportamento atual)', editing, f"textarea_aberta={editing}")

            # c6: membro travado isolado nao move
            await fresh(pg)
            await click_item(pg, A); await click_item(pg, B, shift=True)
            await pg.keyboard.press('Control+g'); await pg.wait_for_timeout(200)
            await pg.mouse.click(5, 5); await pg.wait_for_timeout(150)
            await click_item(pg, A)
            await pg.keyboard.press('Control+Shift+L'); await pg.wait_for_timeout(200)
            await pg.mouse.click(5, 5); await pg.wait_for_timeout(150)
            await dbl_item(pg, A)
            pre = await pos(pg, A)
            await drag_item(pg, A, 40, 0)
            post = await pos(pg, A)
            rec('c6 membro travado isolado nao move', abs(post['left'] - pre['left']) <= 0.1, f"delta={post['left'] - pre['left']:.2f}")

            # screenshot do painel Camadas com grupo selecionado
            await fresh(pg)
            await click_item(pg, A); await click_item(pg, B, shift=True)
            await pg.keyboard.press('Control+g'); await pg.wait_for_timeout(200)
            await pg.mouse.click(5, 5); await pg.wait_for_timeout(150)
            await click_item(pg, A)
            await pg.screenshot(path=str(ROOT / 'preview_camadas_grupo.png'))
            print('screenshot preview_camadas_grupo.png salvo')

            await br.close()
    finally:
        srv.terminate()
    falhou = [r for r in RESULTS if not r[1]]
    print(f"TOTAL FALHOU= {len(falhou)}")

asyncio.run(main())
