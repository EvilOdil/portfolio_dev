import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return;
            // troika (drei <Text>) is only used by the lazy GridOverlay debug
            // chunk — keep it out of the eagerly-loaded three-vendor bundle
            if (id.includes('troika')) return 'text-vendor';
            if (id.includes('three') || id.includes('@react-three')) return 'three-vendor';
          },
        },
      },
    },
  };
});