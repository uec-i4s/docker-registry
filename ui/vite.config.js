import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/v2": "http://localhost:8080",
      "/api": "http://localhost:8080"
    }
  },
  build: {
    outDir: "build"
  }
});