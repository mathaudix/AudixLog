// Mede a grade da janela da nota (harness) em desktop, tablet e celular: colunas por linha e espaço vazio.
// Uso: CHROMIUM_PATH=... node scripts/measure-nf-grid.mjs harness/dist-nf
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const dist = resolve(process.argv[2] ?? 'harness/dist-nf');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let body;
  try { body = await readFile(join(dist, p === '/' ? 'nf.html' : p)); }
  catch { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' });
  res.end(body);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const out = {};
for (const [name, width] of [['desktop', 1280], ['tablet', 720], ['celular', 390]]) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto(`http://127.0.0.1:${server.address().port}/nf.html`);
  await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
  out[name] = await page.evaluate(() => {
    const sections = [...document.querySelectorAll('[role="dialog"] .nf-form-section')];
    return sections.map(sec => {
      const grid = sec.querySelector(':scope > .nf-fields-grid, :scope > .nf-identification-grid, :scope > .nf-metrics-grid');
      if (!grid) return null;
      const kids = [...grid.children].filter(k => k.offsetParent !== null);
      const rows = {};
      for (const k of kids) { const r = Math.round(k.getBoundingClientRect().top); (rows[r] ??= []).push(Math.round(k.getBoundingClientRect().width)); }
      const gridW = grid.getBoundingClientRect().width;
      const lastRow = Object.values(rows).at(-1) ?? [];
      const used = lastRow.reduce((a, b) => a + b, 0);
      return { title: sec.querySelector('h3')?.textContent?.trim().slice(0, 28), perRow: Object.values(rows).map(r => r.length), lastRowFill: Math.round((used / gridW) * 100) + '%' };
    }).filter(Boolean);
  });
  await page.close();
}
await browser.close();
server.close();
console.log(JSON.stringify(out, null, 1));
