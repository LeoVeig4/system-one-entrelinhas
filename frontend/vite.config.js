import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const proxy = {
  '/api': { target: 'http://127.0.0.1:8000' },
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@schema': fileURLToPath(new URL('../backend/sales_trainer/data/evaluation_schema.json', import.meta.url)) },
  },
  server: { proxy },
  preview: { proxy },
});
