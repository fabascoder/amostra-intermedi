import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Aplicação 100% estática: nenhuma chamada a servidor. O build gera arquivos
// com hash no nome (cache longo) e um service worker simples (public/sw.js)
// que guarda os recursos para a demonstração seguir funcionando sem rede.
export default defineConfig({
  plugins: [react()],
  server: { port: 5180, strictPort: false },
  preview: { port: 4180 },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react") || id.includes("node_modules/scheduler")) return "react";
          if (id.includes("node_modules/react-router") || id.includes("node_modules/@remix-run")) return "router";
          return undefined;
        },
      },
    },
  },
});
