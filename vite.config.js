import vite from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
// TODO: replace with import, when esm json import is available
// const cfg = JSON.parse(String(fs.readFileSync('./config.json')))

export default vite.defineConfig({
  plugins: [vue()],
  root: './src/frontend',
  build: {
    outDir: '../../build/public',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '^/(api|uploads)/.*': {
        target: `http://192.168.178.30:1337`,
        secure: false,
      },
    },
  },
})
