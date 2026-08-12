import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://perlcoders.com",
  output: "static",
  trailingSlash: "always",
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/search/") && !page.includes("/410/")
    })
  ],
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
