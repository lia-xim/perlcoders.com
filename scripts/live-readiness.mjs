import { readFile } from "node:fs/promises";

const origin = "https://perlcoders.com";
const manifest = JSON.parse(await readFile("config/legacy-url-actions.json", "utf8"));
const failures = [];
async function request(url) {
  return fetch(url, { redirect: "manual", signal: AbortSignal.timeout(15000) });
}
async function text(url) {
  const response = await request(url);
  if (response.status !== 200) failures.push(`${url}: expected 200, got ${response.status}`);
  return { response, body: await response.text() };
}

const root = await request(origin + "/");
if (root.status !== 200) failures.push(`apex: expected 200, got ${root.status}`);
for (const header of ["content-security-policy", "x-content-type-options", "x-frame-options", "referrer-policy", "permissions-policy", "strict-transport-security"]) {
  if (!root.headers.get(header)) failures.push(`apex: missing ${header}`);
}

const { body: robots } = await text(origin + "/robots.txt");
if (!/User-agent:\s*\*/i.test(robots) || !/Allow:\s*\//i.test(robots)) failures.push("robots: crawl allow rule missing");
if (!/Sitemap:\s*https:\/\/perlcoders\.com\/sitemap\.xml\//i.test(robots)) failures.push("robots: sitemap reference missing");

const { body: sitemap } = await text(origin + "/sitemap.xml/");
if (!/<urlset\b/.test(sitemap) || /<sitemapindex\b/.test(sitemap)) failures.push("sitemap.xml: expected a direct URL set, not a sitemap index");
const sitemapUrls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
if (!sitemapUrls.length) failures.push("sitemap: no canonical URLs");

for (const url of sitemapUrls) {
  const { response, body } = await text(url);
  const canonical = body.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
  const robotsMeta = body.match(/<meta name="robots" content="([^"]+)"/)?.[1] || "";
  if (canonical !== url) failures.push(`${url}: canonical is ${canonical || "missing"}`);
  if (/noindex/i.test(robotsMeta)) failures.push(`${url}: sitemap URL is noindex`);
  if (/noindex/i.test(response.headers.get("x-robots-tag") || "")) failures.push(`${url}: X-Robots-Tag noindex`);
}

const unknown = await request(origin + "/readiness-audit-unknown-route-8f63/");
if (unknown.status !== 404) failures.push(`unknown route: expected 404, got ${unknown.status}`);
const unknownBody = await unknown.text();
if (!/noindex/i.test(unknownBody) && !/noindex/i.test(unknown.headers.get("x-robots-tag") || "")) failures.push("unknown route: missing noindex");

const gone = await request(origin + "/cgi-bin/readiness-audit-retired.cgi");
if (gone.status !== 410) failures.push(`retired CGI: expected 410, got ${gone.status}`);
const goneBody = await gone.text();
if (!/noindex/i.test(goneBody) && !/noindex/i.test(gone.headers.get("x-robots-tag") || "")) failures.push("retired CGI: missing noindex");

for (const record of manifest.records) {
  const source = new URL(record.source_url);
  source.protocol = "https:";
  source.hostname = "perlcoders.com";
  source.port = "";
  const response = await request(source.href);
  if (["redirect_301", "restore_200"].includes(record.action)) {
    if (![301, 308].includes(response.status)) failures.push(`${source.pathname + source.search}: expected permanent redirect, got ${response.status}`);
    const location = response.headers.get("location");
    if (!location) failures.push(`${source.pathname + source.search}: redirect location missing`);
    else {
      const destination = new URL(location, source);
      const expected = new URL(record.target_url, origin);
      if (destination.pathname + destination.search !== expected.pathname + expected.search) failures.push(`${source.pathname + source.search}: redirects to ${destination.pathname + destination.search}, expected ${expected.pathname + expected.search}`);
      const target = await request(expected.href);
      if (target.status !== 200) failures.push(`${record.target_url}: redirect target expected 200, got ${target.status}`);
    }
  } else if (record.action === "404" && response.status !== 404) failures.push(`${source.pathname}: expected 404, got ${response.status}`);
  else if (record.action === "410" && response.status !== 410) failures.push(`${source.pathname}: expected 410, got ${response.status}`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Live readiness passed: ${sitemapUrls.length} canonical sitemap URLs, ${manifest.records.length} legacy records, security headers, robots, 404 and 410 verified.`);
