import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root,
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^.*\/services\/firebase$/, replacement: `${root}firebaseMock.ts` },
      { find: /^.*\/services\/labelRepository$/, replacement: `${root}firebaseMock.ts` },
      { find: /^.*\/services\/profileRepository$/, replacement: `${root}profileMock.ts` },
      { find: /^.*\/services\/auth$/, replacement: `${root}authMock.ts` },
    ],
  },
  build: { outDir: `${root}dist-login`, emptyOutDir: true, rollupOptions: { input: `${root}login.html` } },
});
