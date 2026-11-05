// Gera tmp/logo80/compare.png (grade das candidatas) e mede se o texto corta no container.
// Uso: CHROMIUM_PATH=... node scripts/capture-script-fonts.mjs
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve('.');
const out = resolve('tmp/logo80');
mkdirSync(out, { recursive: true });

const cands = [
  ['Sora 700 (atual)', 'sora', 'latin-700.css', 'Sora', 700],
  ['Yellowtail', 'yellowtail', 'latin-400.css', 'Yellowtail', 400],
  ['Damion', 'damion', 'latin-400.css', 'Damion', 400],
  ['Kaushan Script', 'kaushan-script', 'latin-400.css', 'Kaushan Script', 400],
  ['Pacifico', 'pacifico', 'latin-400.css', 'Pacifico', 400],
  ['Leckerli One', 'leckerli-one', 'latin-400.css', 'Leckerli One', 400],
  ['Satisfy', 'satisfy', 'latin-400.css', 'Satisfy', 400],
];

const links = cands.map(([, dir, file]) =>
  `<link rel="stylesheet" href="file://${root}/node_modules/@fontsource/${dir}/${file}">`).join('\n');
const rows = cands.map(([label, , , fam, w]) => `
  <div class="row">
    <div class="lbl">${label}</div>
    <div class="cell navy"><span class="wm" style="font-family:'${fam}';font-weight:${w}"><span class="a">Audix</span><span class="l">Log</span></span></div>
    <div class="cell"><span class="wm wm-l" style="font-family:'${fam}';font-weight:${w}"><span class="a">Audix</span><span class="l">Log</span></span></div>
  </div>`).join('');

const html = `<!doctype html><html><head><meta charset="utf-8">${links}
<style>
body{margin:0;font-family:Inter,system-ui,sans-serif;background:#fff;width:1100px}
.row{display:grid;grid-template-columns:200px 1fr 1fr;align-items:center;gap:12px;padding:10px 16px}
.lbl{font-size:14px;color:#334155}
.cell{display:flex;align-items:center;justify-content:center;min-height:110px;border-radius:8px}
.navy{background:#0B1F3A}
.wm{font-size:72px;line-height:1.3;padding:0 12px;white-space:nowrap}
.a{color:#fff}.l{color:#22C55E}
.wm-l .a{color:#082F49}.wm-l .l{color:#0E7490}
</style></head><body>${rows}</body></html>`;
const htmlPath = resolve(out, 'compare.html');
writeFileSync(htmlPath, html);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
await page.goto('file://' + htmlPath, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: resolve(out, 'compare.png'), fullPage: true });

// Largura do texto por candidata (para igualar o tamanho visual com a Sora).
const widths = await page.evaluate(() => [...document.querySelectorAll('.navy .wm')].map((el) => {
  const r = el.getBoundingClientRect();
  const cell = el.parentElement.getBoundingClientRect();
  const loaded = document.fonts.check(`72px ${el.style.fontFamily}`);
  return { w: Math.round(r.width), h: Math.round(r.height), cellW: Math.round(cell.width), loaded };
}));
await browser.close();
console.log(JSON.stringify(cands.map((c, i) => ({ name: c[0], ...widths[i] }))));
