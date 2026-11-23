import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({ plugins: [react()], build: { rollupOptions: { output: { manualChunks: { firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore'], spreadsheet: ['xlsx'], barcode: ['jsbarcode', 'html5-qrcode'] } } } } });
