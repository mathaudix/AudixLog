// Captura a tela de login (harness) em 1440x900 claro e escuro, e mede a fonte do wordmark.
// Uso: CHROMIUM_PATH=... node scripts/capture-login-preview.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
const dist = resolve('harness/dist-login');
const out = resolve('tmp/login');
await mkdir(out, { recursive: true });

const server = createServer(async (req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(dist, urlPath === '/' ? 'login.html' : urlPath);
  try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); } catch { file = join(dist, 'login.html'); }
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const result = {};
for (const theme of ['light', 'dark']) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  await page.goto(`http://127.0.0.1:${port}/login.html?theme=${theme}`);
  await page.waitForSelector('.brand-wordmark', { timeout: 15000 });
  await page.evaluate(() => document.fonts.ready);
  result[theme] = await page.evaluate(() => {
    const el = document.querySelector('section .brand-wordmark');
    const cs = getComputedStyle(el);
    const audix = el.querySelector('.brand-audix');
    const log = el.querySelector('.brand-log');
    return {
      family: cs.fontFamily,
      weight: cs.fontWeight,
      fontLoaded: document.fonts.check('700 40px Sora'),
      audixColor: getComputedStyle(audix).color,
      logColor: getComputedStyle(log).color,
    };
  });
  await page.screenshot({ path: join(out, `login.${theme}.png`) });
  await page.close();
}
await browser.close();
server.close();
console.log(JSON.stringify(result));
