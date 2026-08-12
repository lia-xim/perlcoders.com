import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist");
const htmlFiles = [];

async function walk(directory) {
  for (const name of await readdir(directory)) {
    const target = path.join(directory, name);
    const info = await stat(target);
    if (info.isDirectory()) await walk(target);
    else if (name.endsWith(".html")) htmlFiles.push(target);
  }
}

await walk(root);
const failures = [];
const hrefPattern = /href="(\/[^"]*)"/g;

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  if (!/<title>[^<]+<\/title>/.test(html)) failures.push(`${file}: missing title`);
  if (!/<meta name="description" content="[^"]+"/.test(html)) failures.push(`${file}: missing description`);
  if (!/<link rel="canonical" href="https:\/\/perlcoders\.com\//.test(html)) failures.push(`${file}: missing canonical`);
  if ((html.match(/<h1\b/g) || []).length !== 1) failures.push(`${file}: expected exactly one h1`);
  if (/\[REQUIRED|\[TODO|\[PLACEHOLDER/.test(html)) failures.push(`${file}: unresolved publish placeholder`);

  for (const match of html.matchAll(hrefPattern)) {
    const href = match[1].split("#")[0].split("?")[0];
    if (!href || href.startsWith("/api/") || /\.[a-z0-9]+$/i.test(href)) continue;
    const local = href === "/" ? path.join(root, "index.html") : path.join(root, href, "index.html");
    try { await stat(local); } catch { failures.push(`${file}: broken internal link ${href}`); }
  }
}

for (const required of ["sitemap-0.xml", "sitemap-index.xml", "feed.xml", "robots.txt"]) {
  try { await stat(path.join(root, required)); } catch { failures.push(`dist: missing ${required}`); }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`QA passed: ${htmlFiles.length} HTML documents, metadata, placeholders and internal routes checked.`);
