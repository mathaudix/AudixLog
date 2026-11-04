// Mede no DOM fonte e altura dos controles da tela de Configuracoes e tira prints (claro e escuro).
// Requer o harness compilado: npx vite build --config harness/vite.settings.config.ts
// Uso: CHROMIUM_PATH=... node scripts/measure-settings.mjs <prefixo-do-print>
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'harness', 'dist-settings');
const PORT = 4194;
const prefix = process.argv[2] || 'settings';
const outDir = process.env.OUT_DIR || join(here, '..', '..', '..', 'tmp');

const measure = () => {
  const pick = (el) => {
    const cs = getComputedStyle(el);
    return { tag: el.tagName, text: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 28), fontSize: cs.fontSize, height: Math.round(el.getBoundingClientRect().height) };
  };
  const dialog = document.querySelector('.settings-modal') || document.querySelector('[role="dialog"]');
  const controls = dialog ? [...dialog.querySelectorAll('button, select, input')].slice(0, 40) : [];
  return { found: Boolean(dialog), controls: controls.map(pick) };
};

const server = spawn(process.execPath, [join(here, 'serve-static.mjs'), dist, String(PORT)], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 800));
const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const report = {};
try {
  for (const mode of ['light', 'dark']) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(`http://localhost:${PORT}/settings.html${mode === 'dark' ? '?theme=dark' : ''}`);
    await page.waitForTimeout(700);
    report[mode] = await page.evaluate(measure);
    report[mode].errors = errors;
    await page.screenshot({ path: join(outDir, `${prefix}_${mode}.png`) });
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
console.log(JSON.stringify(report, null, 1));
