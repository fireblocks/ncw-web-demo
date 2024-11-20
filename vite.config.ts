import { defineConfig, loadEnv, splitVendorChunkPlugin } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd());
  return {
    base: "/ncw-web-demo/",
    plugins: [react(), splitVendorChunkPlugin()],
    server: {
      open: false,
      host: 'localhost',
      port: (env.VITE_PORT && Number(env.VITE_PORT)) || 5173,
      hmr: true,
    },
    optimizeDeps: {
      exclude: ["@fireblocks/ncw-js-sdk", "tsl-apple-cloudkit"],
    },
  }
});
