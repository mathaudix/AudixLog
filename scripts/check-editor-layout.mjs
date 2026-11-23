// Verifica o layout do editor de etiquetas: painel esquerdo | canvas | painel direito lado a lado.
// Requer o harness do editor compilado: npx vite build --config harness/vite.harness.config.ts
// Uso: npm run check:layout
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'harness', 'dist');
const PORT = 4193;

const measure = () => {
  const box = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
  // Canvas = area com a grade pontilhada do LabelCanvas (raiz do canvas).
  const canvasEl = [...document.querySelectorAll('.editor-stage div')].find(el => el.style.backgroundImage.includes('radial-gradient'));
  const canvasRect = canvasEl ? canvasEl.getBoundingClientRect() : null;
  return {
    dock: box('aside.editor-sidebar'),
    canvas: canvasRect ? { x: canvasRect.x, y: canvasRect.y, w: canvasRect.width, h: canvasRect.height } : null,
    inspector: box('.editor-inspector'),
    row: box('.editor-stage-row'),
  };
};

const CASES = [
  { w: 1920, h: 1080, mode: 'light' },
  { w: 1920, h: 1080, mode: 'dark' },
  { w: 1366, h: 768, mode: 'light' },
  { w: 1366, h: 768, mode: 'dark' },
];

function fail(msg) {
  console.error(`check:layout FALHOU: ${msg}`);
  process.exitCode = 1;
}

const server = spawn(process.execPath, [join(here, 'serve-static.mjs'), dist, String(PORT)], { stdio: 'ignore' });
await new Promise(r => setTimeout(r, 800));

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
try {
  for (const c of CASES) {
    const page = await browser.newPage({ viewport: { width: c.w, height: c.h } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto(`http://localhost:${PORT}/editor.html`);
    await page.evaluate(d => document.documentElement.classList.toggle('dark', d), c.mode === 'dark');
    await page.waitForTimeout(600);
    const m = await page.evaluate(measure);
    const tag = `${c.w}x${c.h} ${c.mode}`;
    if (!m.dock || !m.canvas || !m.inspector) { fail(`${tag}: colunas nao encontradas`); }
    else {
      if (!(m.canvas.x >= m.dock.x + m.dock.w - 1)) fail(`${tag}: canvas comeca dentro do painel esquerdo`);
      if (!(m.inspector.x >= m.canvas.x + m.canvas.w - 1)) fail(`${tag}: painel direito nao esta a direita do canvas (x=${m.inspector.x}, canvas fim=${m.canvas.x + m.canvas.w})`);
      if (Math.abs(m.inspector.y - m.row.y) > 2) fail(`${tag}: painel direito com topo diferente da linha do editor (${m.inspector.y} vs ${m.row.y})`);
      console.log(`${tag}: dock x=${m.dock.x} w=${m.dock.w} | canvas x=${m.canvas.x} w=${m.canvas.w} h=${m.canvas.h} | inspector x=${m.inspector.x} w=${m.inspector.w} y=${m.inspector.y}`);
    }
    if (errors.length) fail(`${tag}: erros de pagina: ${errors.join(' | ')}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.kill();
}
if (!process.exitCode) console.log('check:layout OK');
