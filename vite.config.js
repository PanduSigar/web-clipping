import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteClipperPlugin from './vite-clipper-plugin';
import vitePaymentPlugin from './vite-payment-plugin';
import viteDbPlugin from './vite-db-plugin';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), viteClipperPlugin(), vitePaymentPlugin(), viteDbPlugin()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        admin: path.resolve(__dirname, 'admin.html')
      }
    }
  }
});
