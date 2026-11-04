// Gera tmp/etapa2/{settings,nf}.{light,dark}.png a partir dos harnesses (dist-settings e dist-nf) para o preview da Etapa 2.
// Uso: CHROMIUM_PATH=... node scripts/capture-etapa2-preview.mjs
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { extname, join, resolve } from 'node:path';

const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.json': 'application/json' };
const out = resolve('tmp/etapa2');
await mkdir(out, { recursive: true });

function serve(dist) {
  return createServer(async (req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = join(dist, urlPath === '/' ? 'index.html' : urlPath);
    try { if ((await stat(file)).isDirectory()) file = join(file, 'index.html'); } catch { file = join(dist, 'nf.html'); }
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
      res.end(body);
    } catch { res.writeHead(404); res.end(); }
  });
}

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const jobs = [
  { name: 'settings', dist: resolve('harness/dist-settings'), page: 'settings.html', selector: '[role="dialog"]' },
  { name: 'nf', dist: resolve('harness/dist-nf'), page: 'nf.html', selector: '[role="dialog"]' },
];
for (const job of jobs) {
  const server = serve(job.dist);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  for (const theme of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 1000, height: 900 }, deviceScaleFactor: 1 });
    await page.goto(`http://127.0.0.1:${port}/${job.page}?theme=${theme}`);
    await page.waitForSelector(job.selector, { timeout: 15000 });
    await page.locator(job.selector).screenshot({ path: join(out, `${job.name}.${theme}.png`) });
    await page.close();
  }
  server.close();
}
await browser.close();
console.log('captured', out);
