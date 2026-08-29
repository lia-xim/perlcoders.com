import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://perlcoders.com",
  output: "static",
  trailingSlash: "always",
  build: {
    format: "directory",
    inlineStylesheets: "auto"
  },
  vite: {
    build: {
      cssMinify: true
    }
  }
});
