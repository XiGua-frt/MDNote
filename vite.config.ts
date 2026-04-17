import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react-syntax-highlighter',
      'react-syntax-highlighter/dist/esm/languages/prism/markdown',
      'react-syntax-highlighter/dist/esm/languages/prism/typescript',
      'react-syntax-highlighter/dist/esm/languages/prism/javascript',
      'react-syntax-highlighter/dist/esm/languages/prism/tsx',
      'react-syntax-highlighter/dist/esm/styles/prism',
      'refractor',
      'refractor/core',
      'refractor/lang/markdown.js',
      'refractor/lang/typescript.js',
      'refractor/lang/javascript.js'
    ]
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
});
