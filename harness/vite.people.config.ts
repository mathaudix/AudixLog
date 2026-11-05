import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

// Harness de Perfil, Usuarios e Historico (so desenvolvimento). Nao entra no build de producao.
export default defineConfig({
  root,
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^(.*\/services\/|\.\/)firebase$/, replacement: `${root}firebaseMock.ts` },
      { find: /^.*\/services\/profileRepository$/, replacement: `${root}profileMock.ts` },
    ],
  },
  build: { outDir: `${root}dist-people`, emptyOutDir: true, rollupOptions: { input: `${root}people.html` } },
});
