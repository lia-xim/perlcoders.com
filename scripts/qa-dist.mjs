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
const metadata = [];

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  if (!/<title>[^<]+<\/title>/.test(html)) failures.push(`${file}: missing title`);
  if (!/<meta name="description" content="[^"]+"/.test(html)) failures.push(`${file}: missing description`);
  if (!/<link rel="canonical" href="https:\/\/perlcoders\.com\//.test(html)) failures.push(`${file}: missing canonical`);
  if ((html.match(/<h1\b/g) || []).length !== 1) failures.push(`${file}: expected exactly one h1`);
  if (/\[REQUIRED|\[TODO|\[PLACEHOLDER/.test(html)) failures.push(`${file}: unresolved publish placeholder`);
  if (!/<meta property="og:image" content="https:\/\/perlcoders\.com\/og\/default\.png"/.test(html)) failures.push(`${file}: missing social preview image`);
  if (!/<meta property="og:image:width" content="1200"/.test(html)) failures.push(`${file}: missing social preview dimensions`);
  if (/Not yet complete|do not deploy in this state|Seed data — replace/i.test(html)) failures.push(`${file}: unresolved launch blocker copy`);
  if (/ec\.europa\.eu\/consumers\/odr/i.test(html)) failures.push(`${file}: discontinued EU ODR link`);
  if (/info@matthiasramahi\.de/i.test(html)) failures.push(`${file}: stale contact address`);
  if (!html.includes('src="https://analytics.contextter.com/script.js"')) failures.push(`${file}: Umami tracker missing`);
  if (!html.includes('data-website-id="fd7d502b-e257-4b78-ac86-b922bc1c3f49"')) failures.push(`${file}: Umami website id missing`);
  if (!html.includes('data-exclude-search="true"') || !html.includes('data-exclude-hash="true"') || !html.includes('data-do-not-track="true"')) {
    failures.push(`${file}: privacy-preserving Umami configuration incomplete`);
  }

  const title = html.match(/<title>([^<]+)<\/title>/)?.[1];
  const description = html.match(/<meta name="description" content="([^"]+)"/)?.[1];
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const robots = html.match(/<meta name="robots" content="([^"]+)"/)?.[1] || "";
  const language = html.match(/<html lang="([^"]+)"/)?.[1];
  const alternates = [...html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)]
    .map((match) => ({ language: match[1], href: match[2] }));
  if (!language || !["en", "de"].includes(language)) failures.push(`${file}: missing supported document language`);
  metadata.push({ file, title, description, canonical, language, alternates, indexable: !robots.includes("noindex") });

  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      const schema = JSON.parse(match[1]);
      if (schema["@context"] !== "https://schema.org" || !schema["@type"]) failures.push(`${file}: incomplete JSON-LD root`);
    } catch (error) {
      failures.push(`${file}: invalid JSON-LD (${error.message})`);
    }
  }

  for (const match of html.matchAll(hrefPattern)) {
    const href = match[1].split("#")[0].split("?")[0];
    if (!href || href.startsWith("/api/") || /\.[a-z0-9]+$/i.test(href)) continue;
    const local = href === "/" ? path.join(root, "index.html") : path.join(root, href, "index.html");
    try { await stat(local); } catch { failures.push(`${file}: broken internal link ${href}`); }
  }
}

for (const field of ["title", "description"]) {
  const seen = new Map();
  for (const page of metadata.filter((item) => item.indexable && item[field])) {
    const previous = seen.get(page[field]);
    if (previous) failures.push(`${page.file}: duplicate ${field} also used by ${previous}`);
    else seen.set(page[field], page.file);
  }
}

const pageByCanonical = new Map(metadata.map((page) => [page.canonical, page]));
for (const page of metadata) {
  for (const alternate of page.alternates.filter((item) => item.language !== "x-default")) {
    const target = pageByCanonical.get(alternate.href);
    if (!target) failures.push(`${page.file}: hreflang target is not a canonical page ${alternate.href}`);
    else if (target.language !== alternate.language) failures.push(`${page.file}: hreflang ${alternate.language} points to ${target.language} page`);
    else if (!target.alternates.some((item) => item.language === page.language && item.href === page.canonical)) {
      failures.push(`${page.file}: hreflang pair is not reciprocal with ${target.file}`);
    }
  }
}

for (const required of ["sitemap.xml", "feed.xml", "robots.txt"]) {
  try { await stat(path.join(root, required)); } catch { failures.push(`dist: missing ${required}`); }
}
for (const obsolete of ["sitemap-0.xml", "sitemap-index.xml"]) {
  try {
    await stat(path.join(root, obsolete));
    failures.push(`dist: obsolete sitemap artifact ${obsolete} must not be published`);
  } catch {}
}

for (const requiredAsset of ["og/default.png"]) {
  try { await stat(path.join(root, requiredAsset)); } catch { failures.push(`dist: missing ${requiredAsset}`); }
}

const vercelConfig = await readFile(path.resolve("vercel.json"), "utf8");
if (!/script-src[^\"]*https:\/\/analytics\.contextter\.com/.test(vercelConfig)) failures.push("vercel.json: analytics script origin missing from CSP");
if (!/connect-src[^\"]*https:\/\/analytics\.contextter\.com/.test(vercelConfig)) failures.push("vercel.json: analytics collection origin missing from CSP");

for (const privacyFile of ["privacy/index.html", "de/datenschutz/index.html", "cookies/index.html", "de/cookies/index.html"]) {
  const content = await readFile(path.join(root, privacyFile), "utf8");
  if (!content.includes("analytics.contextter.com")) failures.push(`dist/${privacyFile}: analytics endpoint disclosure missing`);
}
const englishPrivacy = await readFile(path.join(root, "privacy/index.html"), "utf8");
if (/No analytics\.|No page-view or event beacon/i.test(englishPrivacy)) failures.push("dist/privacy/index.html: stale no-analytics claim");

const sitemap = await readFile(path.join(root, "sitemap.xml"), "utf8");
if (!/<urlset\b/.test(sitemap) || /<sitemapindex\b/.test(sitemap)) failures.push("sitemap.xml: expected a direct URL set, not a sitemap index");
const sitemapUrls = [...sitemap.matchAll(/<loc>(https:\/\/perlcoders\.com\/[^<]*)<\/loc>/g)].map((match) => match[1]);
const expectedIndexable = new Set(metadata.filter((page) => page.indexable).map((page) => page.canonical));
for (const url of sitemapUrls) if (!expectedIndexable.has(url)) failures.push(`sitemap: non-canonical or non-indexable URL ${url}`);
for (const url of expectedIndexable) if (!sitemapUrls.includes(url)) failures.push(`sitemap: missing canonical indexable URL ${url}`);

const robots = await readFile(path.join(root, "robots.txt"), "utf8");
if (!/^User-agent: \*$/m.test(robots) || !/^Allow: \/$/m.test(robots)) failures.push("robots.txt: crawling is not explicitly allowed");
if (!/^Sitemap: https:\/\/perlcoders\.com\/sitemap\.xml$/m.test(robots)) failures.push("robots.txt: canonical sitemap reference missing");

for (const sourceFile of ["public/content/archive.json", "public/content/stories.json"]) {
  const source = await readFile(path.resolve(sourceFile), "utf8");
  if (/"(?:path|link)"\s*:\s*"\/\//.test(source)) {
    failures.push(`${sourceFile}: protocol-relative internal path`);
  }
}

for (const contactTarget of [
  "legal-notice/index.html",
  "privacy/index.html",
  "scripts/forms.js"
]) {
  const content = await readFile(path.join(root, contactTarget), "utf8");
  if (!content.includes("info@contextter.com")) {
    failures.push(`dist/${contactTarget}: missing public contact address`);
  }
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}

console.log(`QA passed: ${htmlFiles.length} HTML documents, metadata, placeholders and internal routes checked.`);
