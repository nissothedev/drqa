/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// GitHub Pages serves the app from https://<user>.github.io/drqa/
// The app uses HashRouter, so deep links and refreshes work without server rewrites.
export default defineConfig({
  base: '/drqa/',
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
