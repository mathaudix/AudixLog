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
      { find: /^\.\/useRateioDraft$/, replacement: `${root}rateioDraftMock.ts` },
      { find: /^.*\/services\/nfRepository$/, replacement: `${root}firebaseMock.ts` },
      { find: /^.*\/services\/archiveService$/, replacement: `${root}backupMock.ts` },
    ],
  },
  build: { outDir: `${root}dist-rateio`, emptyOutDir: true, rollupOptions: { input: `${root}rateio.html` } },
});
