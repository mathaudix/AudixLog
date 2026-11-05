// Gera tmp/login/fonts.png: 'AudixLog' em 3 fontes (Sora, Space Grotesk, Outfit; peso 700) sobre navy.
// As alternativas são usadas só para o preview; não entram no bundle final.
import { chromium } from 'playwright';
import { resolve } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

const out = resolve('tmp/login');
await mkdir(out, { recursive: true });
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:"SoraP";src:url("file://${resolve('node_modules/@fontsource/sora/files/sora-latin-700-normal.woff2')}") format("woff2");font-weight:700}
@font-face{font-family:"SpaceP";src:url("file://${resolve('node_modules/@fontsource/space-grotesk/files/space-grotesk-latin-700-normal.woff2')}") format("woff2");font-weight:700}
@font-face{font-family:"OutfitP";src:url("file://${resolve('node_modules/@fontsource/outfit/files/outfit-latin-700-normal.woff2')}") format("woff2");font-weight:700}
body{margin:0;background:#082F49;font-family:Inter,sans-serif;color:#fff;padding:24px 40px;width:1100px}
.row{display:flex;align-items:baseline;gap:24px;padding:14px 0;border-bottom:1px solid rgba(255,255,255,.12)}
.lab{width:200px;font-size:14px;color:#BAE6FD}
.w{font-size:56px;font-weight:700;letter-spacing:-.02em;line-height:1.05}
.w .a{color:#fff}.w .l{color:#22C55E}
</style></head><body>
<div class="row"><div class="lab">Sora 700</div><div class="w" style="font-family:SoraP"><span class="a">Audix</span><span class="l">Log</span></div></div>
<div class="row"><div class="lab">Space Grotesk 700</div><div class="w" style="font-family:SpaceP"><span class="a">Audix</span><span class="l">Log</span></div></div>
<div class="row"><div class="lab">Outfit 700</div><div class="w" style="font-family:OutfitP"><span class="a">Audix</span><span class="l">Log</span></div></div>
</body></html>`;
await writeFile(resolve('tmp/login/fonts.html'), html);
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1100, height: 420 }, deviceScaleFactor: 1 });
await page.goto('file://' + resolve('tmp/login/fonts.html'));
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: resolve('tmp/login/fonts.png'), fullPage: true });
await browser.close();
console.log('fonts.png ok');
