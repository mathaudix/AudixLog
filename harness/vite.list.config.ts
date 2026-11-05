import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

// Harness da tabela de notas (so desenvolvimento, com mocks). Nao entra no build de producao.
export default defineConfig({
  root,
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^.*\/services\/firebase$/, replacement: `${root}firebaseMock.ts` },
      { find: /^.*\/services\/labelRepository$/, replacement: `${root}firebaseMock.ts` },
      { find: /^.*\/services\/profileRepository$/, replacement: `${root}profileMock.ts` },
      { find: /^.*\/services\/auth$/, replacement: `${root}firebaseMock.ts` },
      { find: /^.*\/services\/configRepository$/, replacement: `${root}configMock.ts` },
    ],
  },
  build: { outDir: `${root}dist-list`, emptyOutDir: true, rollupOptions: { input: `${root}list.html` } },
});
