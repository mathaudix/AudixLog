import asyncio, subprocess, sys, pathlib, json
from playwright.async_api import async_playwright

ROOT = pathlib.Path('/home/user/sessions/07f7c/work/app')
PORT = '4193'

JS = """() => {
  const q = (s) => document.querySelector(s);
  const cs = (el) => el ? getComputedStyle(el) : null;
  const side = q('.app-sidebar');
  const act = q('.app-sidebar .nav-item.active');
  const inact = q('.app-sidebar .nav-item:not(.active)');
  const ths = [...document.querySelectorAll('.nf-table thead th')];
  const thBg = ths.map(th => cs(th).backgroundColor);
  const inputs = [...document.querySelectorAll('.nf-filters input, .nf-filters select, .nf-filters .ui-input')].map(el => ({tag: el.tagName, h: Math.round(el.getBoundingClientRect().height), fs: cs(el).fontSize}));
  const legendBtn = [...document.querySelectorAll('button')].find(b => b.textContent.includes('Mostrar todas'));
  const dots = [...document.querySelectorAll('section button i.rounded-full')].slice(0,5).map(i => cs(i).backgroundColor);
  const donut = [...document.querySelectorAll('[class*=donut], svg path')].slice(0,0);
  return {
    sidebarBg: side && cs(side).backgroundColor,
    sidebarBorder: side && cs(side).borderRightColor,
    activeBg: act && cs(act).backgroundColor, activeColor: act && cs(act).color,
    inactiveBg: inact && cs(inact).backgroundColor, inactiveColor: inact && cs(inact).color,
    thBgs: [...new Set(thBg)], thCount: ths.length,
    lastThBg: thBg[thBg.length-1],
    inputs,
    mostrarFs: legendBtn ? cs(legendBtn).fontSize : null,
    seriesDots: [...new Set(dots)],
  };
}"""

async def main():
    s = subprocess.Popen([sys.executable, '-m', 'http.server', PORT, '--directory', str(ROOT / 'harness/dist-design')],
                         stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    await asyncio.sleep(1.2)
    try:
        async with async_playwright() as p:
            b = await p.chromium.launch()
            for theme in ['light', 'dark']:
                pg = await b.new_page(viewport={'width': 1440, 'height': 900})
                await pg.goto(f'http://localhost:{PORT}/panel.html?theme={theme}')
                await pg.wait_for_timeout(900)
                print(theme, json.dumps(await pg.evaluate(JS), ensure_ascii=False))
                await pg.close()
            await b.close()
    finally:
        s.terminate()

asyncio.run(main())
