import { writeFile } from "node:fs/promises";
import { pages } from "../src/data/pages.ts";

const origin = "https://perlcoders.com";

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

const entries = pages
  .filter((page) => !page.robots?.includes("noindex"))
  .map((page) => {
    const location = escapeXml(new URL(page.path, origin).href);
    const lastModified = page.modified ?? page.published;
    const lastmod = lastModified ? `\n    <lastmod>${escapeXml(lastModified)}</lastmod>` : "";
    return `  <url>\n    <loc>${location}</loc>${lastmod}\n  </url>`;
  });

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...entries,
  "</urlset>",
  ""
].join("\n");

await writeFile(new URL("../public/sitemap.xml", import.meta.url), sitemap, "utf8");
console.log(`Generated public/sitemap.xml with ${entries.length} canonical URLs.`);
