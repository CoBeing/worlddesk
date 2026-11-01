import {defineConfig} from 'vite'
export default defineConfig({
  server:{
    host:'127.0.0.1',port:1420,strictPort:true,
    // Development preview only. The production Tauri build uses a bounded
    // native HTTPS command, not the browser proxy.
    proxy:{
      '/flight-preview':{
        target:'https://api.adsb.lol',changeOrigin:true,secure:true,
        rewrite:p=>p.replace(/^\/flight-preview/,'')
      }
    }
  },
  build:{outDir:'dist',emptyOutDir:true,assetsInlineLimit:4096}
})
