import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';
import viteCompression from 'vite-plugin-compression';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current directory
  const env = loadEnv(mode, process.cwd(), '');
  const isProduction = mode === 'production';
  const isAnalyze = process.env.ANALYZE === 'true';

  return {
    plugins: [
      react({
        // Enable Fast Refresh
        fastRefresh: true,
        // Babel plugins for production optimization
        babel: isProduction
          ? {
              plugins: [['@babel/plugin-transform-react-constant-elements']],
            }
          : undefined,
      }),

      // PWA Configuration
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Gold Inventory System',
          short_name: 'GoldInv',
          description: 'Gold Factory Inventory Tracking System',
          theme_color: '#D4AF37',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/icons/icon-72x72.png',
              sizes: '72x72',
              type: 'image/png',
            },
            {
              src: '/icons/icon-96x96.png',
              sizes: '96x96',
              type: 'image/png',
            },
            {
              src: '/icons/icon-128x128.png',
              sizes: '128x128',
              type: 'image/png',
            },
            {
              src: '/icons/icon-144x144.png',
              sizes: '144x144',
              type: 'image/png',
            },
            {
              src: '/icons/icon-152x152.png',
              sizes: '152x152',
              type: 'image/png',
            },
            {
              src: '/icons/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icons/icon-384x384.png',
              sizes: '384x384',
              type: 'image/png',
            },
            {
              src: '/icons/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          // Cache-first strategy for static assets
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'gstatic-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
            {
              urlPattern: /\.(?:js|css)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'static-resources',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                },
              },
            },
            {
              urlPattern: /^\/api\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 5, // 5 minutes
                },
                networkTimeoutSeconds: 10,
              },
            },
          ],
          // Precache important assets
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          // Skip waiting for new service worker
          skipWaiting: true,
          clientsClaim: true,
        },
        devOptions: {
          enabled: false, // Disable PWA in development
        },
      }),

      // Gzip compression
      viteCompression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 1024, // Only compress files larger than 1KB
      }),

      // Brotli compression (better compression ratio)
      viteCompression({
        algorithm: 'brotliCompress',
        ext: '.br',
        threshold: 1024,
      }),

      // Bundle analyzer (only when ANALYZE=true)
      isAnalyze &&
        visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true,
          brotliSize: true,
          template: 'treemap',
        }),
    ].filter(Boolean),

    // Path Aliases
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@modules': path.resolve(__dirname, './src/modules'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@services': path.resolve(__dirname, './src/services'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@types': path.resolve(__dirname, './src/types'),
        '@lib': path.resolve(__dirname, './src/lib'),
      },
    },

    // Development Server
    server: {
      port: 5173,
      host: true,
      strictPort: true,
      cors: true,

      // API Proxy Configuration
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('Proxy error:', err);
            });
            proxy.on('proxyReq', (proxyReq, req, _res) => {
              console.log('Proxying:', req.method, req.url);
            });
          },
        },
      },

      // Hot Module Replacement
      hmr: {
        overlay: true,
      },
    },

    // Preview Server (for production build preview)
    preview: {
      port: 4173,
      host: true,
      strictPort: true,
    },

    // Build Configuration
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      minify: isProduction ? 'esbuild' : false,
      target: 'es2020',
      cssMinify: isProduction,

      // Aggressive minification settings
      esbuild: isProduction
        ? {
            drop: ['console', 'debugger'],
            legalComments: 'none',
            minifyIdentifiers: true,
            minifySyntax: true,
            minifyWhitespace: true,
          }
        : undefined,

      // Advanced chunk splitting for better caching
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Core React chunks
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')
            ) {
              return 'react-core';
            }

            // React Router
            if (
              id.includes('node_modules/react-router') ||
              id.includes('node_modules/@remix-run/router')
            ) {
              return 'react-router';
            }

            // TanStack Query
            if (id.includes('node_modules/@tanstack/react-query')) {
              return 'tanstack-query';
            }

            // TanStack Table
            if (id.includes('node_modules/@tanstack/react-table')) {
              return 'tanstack-table';
            }

            // Charts (Recharts is heavy, load separately)
            if (
              id.includes('node_modules/recharts') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-vendor')
            ) {
              return 'charts';
            }

            // UI Libraries
            if (
              id.includes('node_modules/@headlessui/') ||
              id.includes('node_modules/@heroicons/') ||
              id.includes('node_modules/lucide-react')
            ) {
              return 'ui-components';
            }

            // Forms
            if (
              id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/@hookform/') ||
              id.includes('node_modules/zod')
            ) {
              return 'forms';
            }

            // DnD
            if (id.includes('node_modules/@dnd-kit/')) {
              return 'dnd';
            }

            // Date utilities
            if (id.includes('node_modules/date-fns')) {
              return 'date-utils';
            }

            // State management
            if (id.includes('node_modules/zustand')) {
              return 'state';
            }

            // Other vendor modules
            if (id.includes('node_modules/')) {
              return 'vendor';
            }
          },
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId;
            if (facadeModuleId && facadeModuleId.includes('src/modules/')) {
              return 'assets/js/modules/[name]-[hash].js';
            }
            if (facadeModuleId && facadeModuleId.includes('src/pages/')) {
              return 'assets/js/pages/[name]-[hash].js';
            }
            return 'assets/js/[name]-[hash].js';
          },
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            const name = assetInfo.name || '';
            if (/\.(woff2?|ttf|eot)$/i.test(name)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            if (/\.(png|jpe?g|gif|svg|webp|avif|ico)$/i.test(name)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (/\.css$/i.test(name)) {
              return 'assets/css/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
        // Tree-shaking optimizations
        treeshake: {
          moduleSideEffects: 'no-external',
          propertyReadSideEffects: false,
          tryCatchDeoptimization: false,
        },
      },

      // Chunk size warning limit
      chunkSizeWarningLimit: 500,

      // Report compressed size
      reportCompressedSize: true,

      // CSS code splitting
      cssCodeSplit: true,

      // Asset inlining threshold (4kb)
      assetsInlineLimit: 4096,
    },

    // Optimize Dependencies
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@tanstack/react-query',
        'axios',
        'zustand',
        'clsx',
        'date-fns',
        'recharts',
        'lodash',
      ],
    },

    // Environment Variables
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },

    // CSS Configuration
    css: {
      devSourcemap: true,
      postcss: './postcss.config.js',
      modules: {
        localsConvention: 'camelCaseOnly',
      },
    },

    // Enable JSON imports
    json: {
      stringify: true,
    },

    // Worker configuration
    worker: {
      format: 'es',
    },
  };
});
