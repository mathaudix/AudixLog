import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

// Harness da janela da nota (so desenvolvimento, com mocks). Nao entra no build de producao.
export default defineConfig({
  root,
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^(.*\/services\/|\.\/)firebase$/, replacement: `${root}firebaseMock.ts` },
      { find: /^.*\/services\/configRepository$/, replacement: `${root}configMock.ts` },
      { find: /^.*\/services\/profileRepository$/, replacement: `${root}profileMock.ts` },
    ],
  },
  build: { outDir: `${root}dist-nf`, emptyOutDir: true, rollupOptions: { input: `${root}nf.html` } },
});
