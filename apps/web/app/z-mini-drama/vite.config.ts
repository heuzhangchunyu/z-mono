import path from 'node:path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

function getVendorChunkName(id: string) {
  if (!id.includes('node_modules')) {
    return undefined;
  }

  if (
    id.includes('/react/') ||
    id.includes('/react-dom/') ||
    id.includes('/react-router-dom/') ||
    id.includes('/react-router/') ||
    id.includes('/scheduler/') ||
    id.includes('/antd/') ||
    id.includes('/@ant-design/') ||
    id.includes('/@rc-component/') ||
    id.includes('/rc-')
  ) {
    return 'vendor';
  }

  if (id.includes('/axios/')) {
    return 'request-vendor';
  }

  return 'vendor';
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_PROXY_TARGET ?? 'http://127.0.0.1:4102';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src')
      }
    },
    server: {
      host: '127.0.0.1',
      port: 3003,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true
        }
      }
    },
    preview: {
      host: '127.0.0.1',
      port: 4003
    },
    build: {
      outDir: 'build',
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            return getVendorChunkName(id);
          }
        }
      }
    }
  };
});
