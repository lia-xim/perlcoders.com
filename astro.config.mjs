import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { copyFile, rm } from "node:fs/promises";

function flattenSitemap() {
  return {
    name: "perlcoders-flat-sitemap",
    hooks: {
      "astro:build:done": async ({ dir, logger }) => {
        const generatedSitemap = new URL("sitemap-0.xml", dir);
        await copyFile(generatedSitemap, new URL("sitemap.xml", dir));
        await Promise.all([
          rm(generatedSitemap),
          rm(new URL("sitemap-index.xml", dir))
        ]);
        logger.info("`sitemap.xml` created as the canonical single sitemap");
      }
    }
  };
}

export default defineConfig({
  site: "https://perlcoders.com",
  output: "static",
  trailingSlash: "always",
  integrations: [
    sitemap({
      filter: (page) => !page.includes("/search/") && !page.includes("/410/")
    }),
    flattenSitemap()
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
