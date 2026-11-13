import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static site (GitHub Pages in the real build): relative asset paths.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
