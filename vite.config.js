import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps asset paths relative so the build works on any static host,
// including a GitHub Pages project sub-path.
export default defineConfig({
  plugins: [react()],
  base: './'
});
