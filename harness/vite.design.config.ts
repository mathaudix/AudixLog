import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

// Harness de desenvolvimento (vitrine e lista de notas). Nao e usado pelo build de producao.
export default defineConfig({
  root,
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^.*\/services\/firebase$/, replacement: `${root}firebaseMock.ts` },
    ],
  },
  build: { outDir: `${root}dist-design`, emptyOutDir: true, rollupOptions: { input: { design: `${root}design.html`, list: `${root}list.html`, panel: `${root}panel.html` } } },
});
