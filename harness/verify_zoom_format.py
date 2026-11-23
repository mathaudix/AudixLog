import asyncio, subprocess, sys, pathlib, json
from playwright.async_api import async_playwright

ROOT = pathlib.Path('/home/user/sessions/07f7c/work/v38')
MEASURE = """() => {
  const canvas = document.querySelector('.absolute.inset-0.overflow-hidden');
  const stage = document.querySelector('.editor-stage');
  if (!canvas || !stage) return null;
  const r = canvas.getBoundingClientRect(), s = stage.getBoundingClientRect();
  const zoom = document.querySelector('.editor-footer span:last-child')?.textContent;
  return { w: Math.round(r.width), h: Math.round(r.height), zoom,
    mL: Math.round(r.left - s.left), mR: Math.round(s.right - r.right),
    mT: Math.round(r.top - s.top), mB: Math.round(s.bottom - r.bottom),
    inside: r.left >= s.left - 1 && r.right <= s.right + 1 && r.top >= s.top - 1 && r.bottom <= s.bottom + 1 };
}"""

async def main():
    s = subprocess.Popen([sys.executable, '-m', 'http.server', '4185', '--directory', str(ROOT / 'harness/dist')],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1.2)
    out = {}
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            pg = await b.new_page(viewport={'width': 1440, 'height': 900})
            errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto('http://localhost:4185/editor.html')
            await pg.wait_for_timeout(900)
            for fmt in ['100x150', '100x50', '100x30 (2Col)', '100x150']:
                await pg.get_by_role('button', name=fmt, exact=True).click()
                await pg.wait_for_timeout(500)
                out[fmt] = await pg.evaluate(MEASURE)
            await pg.set_viewport_size({'width': 1100, 'height': 760})
            await pg.wait_for_timeout(500)
            out['resize_1100x760'] = await pg.evaluate(MEASURE)
            out['errors'] = errs
            await b.close()
    finally:
        s.terminate()
    print(json.dumps(out, ensure_ascii=False, indent=1))

asyncio.run(main())
