// Captura o harness da janela da nota (claro e escuro) e mede altura/fonte dos controles.
// Uso: node scripts/capture-nf-harness.mjs <pasta-dist> <saida.png>
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const dist = resolve(process.argv[2] ?? 'harness/dist-nf');
const out = process.argv[3] ?? 'preview.png';
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(dist, urlPath === '/' ? 'nf.html' : urlPath);
  try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); } catch { file = join(dist, 'nf.html'); }
  try {
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const measure = () => {
  const dlg = document.querySelector('[role="dialog"]');
  if (!dlg) return { error: 'dialog ausente' };
  const rows = [...dlg.querySelectorAll('input:not([type=hidden]), select, textarea, button')].map(el => {
    const cs = getComputedStyle(el);
    return { tag: el.tagName.toLowerCase(), font: cs.fontSize, h: Math.round(el.getBoundingClientRect().height), text: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30) };
  });
  const sizes = {};
  for (const r of rows) { const k = `${r.font}/${r.h}px`; sizes[k] = (sizes[k] ?? 0) + 1; }
  return { total: rows.length, sizes, sample: rows.slice(0, 6) };
};

const result = {};
for (const theme of ['light', 'dark']) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(`http://127.0.0.1:${port}/nf.html?theme=${theme === 'dark' ? 'dark' : 'light'}`);
  await page.waitForSelector('[role="dialog"]', { timeout: 15000 });
  await page.waitForTimeout(300);
  result[theme] = { metrics: await page.evaluate(measure), errors };
  await page.locator('[role="dialog"]').screenshot({ path: `${out}.${theme}.png` });
  await page.close();
}
await browser.close();
server.close();
console.log(JSON.stringify(result, null, 1));
