// Mede fonte/altura de 3 controles (input, select, botao) e captura Perfil, Usuarios e Historico (claro e escuro).
// Uso: CHROMIUM_PATH=... node scripts/measure-people.mjs harness/dist-people
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
const dist = resolve(process.argv[2] ?? 'harness/dist-people');
const out = resolve('tmp/people');
await mkdir(out, { recursive: true });

const server = createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(dist, urlPath === '/' ? 'people.html' : urlPath);
  try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); } catch { file = join(dist, 'people.html'); }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const measure = () => {
  const pick = (sel) => { const el = document.querySelector(sel); if (!el) return null; const cs = getComputedStyle(el); return { font: cs.fontSize, h: Math.round(el.getBoundingClientRect().height) }; };
  return {
    input: pick('.form-control:not(select)'),
    select: pick('select.form-control'),
    button: pick('.button-primary'),
    tabs: pick('[role=tablist] [role=tab]'),
    tableAction: pick('table button'),
  };
};

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const result = {};
for (const view of ['profile', 'users', 'history']) {
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e.message).slice(0, 120)));
    await page.goto(`http://127.0.0.1:${port}/people.html?view=${view}&theme=${theme}`);
    await page.waitForSelector(view === 'history' ? '.nf-history' : 'section', { timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    result[`${view}.${theme}`] = { m: await page.evaluate(measure), errors };
    await page.screenshot({ path: join(out, `${view}.${theme}.png`), fullPage: true });
    await page.close();
  }
}
await browser.close();
server.close();
console.log(JSON.stringify(result));
