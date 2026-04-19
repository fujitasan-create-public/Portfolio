import { defineConfig } from "astro/config";
import react from "@astrojs/react";

export default defineConfig({
  output: "static",
  integrations: [react()],
  vite: {
    server: {
      watch: {
        usePolling: true,
        interval: 120
      }
    }
  }
});
