import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';

  return {
    base: '/',
    plugins: [react(), tailwindcss()],
    define: {
      // process.env অবজেক্ট ব্রাউজারে সাপোর্ট করানোর জন্য
      'process.env': JSON.stringify(env),
      // নির্দিষ্ট কিছু Key ব্রাউজারে গ্লোবালি অ্যাক্সেস দেওয়ার জন্য
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
    },
    esbuild: isProd ? {
      pure: ['console.log', 'console.debug', 'console.info'],
      drop: ['debugger'],
    } : {},
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'), // সাধারণত src ফোল্ডার নির্দেশ করা নিরাপদ
      },
      dedupe: ['react', 'react-dom'],
    },
    build: {
      target: 'esnext',
      sourcemap: true,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'lucide-vendor': ['lucide-react'],
            'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          }
        }
      }
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
