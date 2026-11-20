import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxy = {
    '/api': {
      target: env.HMDP_BACKEND || 'http://127.0.0.1:8081',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api(?=\/|$)/, ''),
    },
  }
  if (env.HMDP_IMAGE_SERVER) {
    proxy['/imgs'] = { target: env.HMDP_IMAGE_SERVER, changeOrigin: true }
  }
  return {
    esbuild: { jsx: 'automatic' },
    server: { proxy },
    preview: { proxy },
  }
})
