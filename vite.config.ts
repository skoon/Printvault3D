import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isWebOnly = env.VITE_WEB_ONLY === 'true';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        // Web dev mode (VITE_WEB_ONLY=true): proxy API calls to the Express server.
        proxy: {
          '/api': {
            target: `http://localhost:${env.PVAULT_PORT || 8787}`,
            changeOrigin: true,
          },
        },
      },
      plugins: [
        react(),
        ...(isWebOnly ? [] : [
          electron([
            {
              entry: 'electron/main.ts',
              vite: {
                build: {
                  outDir: 'dist-electron',
                },
              },
            },
            {
              entry: 'electron/preload.ts',
              onstart(options) {
                options.reload();
              },
              vite: {
                build: {
                  outDir: 'dist-electron',
                  lib: {
                    entry: 'electron/preload.ts',
                    formats: ['cjs'],
                  },
                  rollupOptions: {
                    external: ['electron'],
                  },
                },
              },
            },
          ]),
          renderer(),
        ]),
      ],
      base: './',
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
