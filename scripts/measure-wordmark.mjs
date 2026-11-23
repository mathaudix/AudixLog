// Mede se o wordmark do login corta dentro do container (desktop 1440 e mobile 390) e captura a tela.
// Uso: CHROMIUM_PATH=... node scripts/measure-wordmark.mjs harness/dist-login
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { resolve, extname, join } from 'node:path';

const dir = resolve(process.argv[2] ?? 'harness/dist-login');
const outDir = resolve('tmp/logo80');
mkdirSync(outDir, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.svg': 'image/svg+xml', '.png': 'image/png' };
const server = createServer((req, res) => {
  const p = join(dir, req.url === '/' ? 'login.html' : req.url.split('?')[0]);
  if (!existsSync(p)) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': types[extname(p)] ?? 'application/octet-stream' });
  res.end(readFileSync(p));
}).listen(4183);

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, args: ['--no-sandbox'] });
const result = {};
for (const [name, vw, vh] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
  const page = await browser.newPage({ viewport: { width: vw, height: vh } });
  await page.goto('http://localhost:4183/', { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  const m = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('.brand-wordmark')) {
      const box = el.getBoundingClientRect();
      const parent = el.parentElement.getBoundingClientRect();
      const cs = getComputedStyle(el);
      out.push({
        font: cs.fontFamily.split(',')[0], weight: cs.fontWeight, size: cs.fontSize,
        loaded: document.fonts.check(`${cs.fontSize} "Kaushan Script"`),
        boxW: Math.round(box.width), boxH: Math.round(box.height),
        parentW: Math.round(parent.width),
        overflowX: el.scrollWidth > el.clientWidth + 1,
        overflowY: el.scrollHeight > el.clientHeight + 1,
        fitsParent: box.width <= parent.width + 1,
        visible: box.width > 0 && box.height > 0,
      });
    }
    return out;
  });
  result[name] = m;
  await page.screenshot({ path: resolve(outDir, `login.${name}.png`), fullPage: false });
  await page.close();
}
await browser.close();
server.close();
console.log(JSON.stringify(result));
