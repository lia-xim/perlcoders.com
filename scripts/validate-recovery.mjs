import fs from "node:fs";
import path from "node:path";
import legacyHandler from "../api/legacy.mjs";
import goneHandler from "../api/gone.mjs";

const root = path.resolve(import.meta.dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "config", "legacy-url-actions.json"), "utf8"));
const redirects = JSON.parse(fs.readFileSync(path.join(root, "public", "content", "redirects.json"), "utf8"));
const vercel = JSON.parse(fs.readFileSync(path.join(root, "vercel.json"), "utf8"));
const required = ["source_url", "normalized_path", "first_seen", "last_seen", "former_topic", "former_title", "archive_evidence", "referring_domains", "backlink_quality", "anchors", "clean_spam_class", "rights_status", "current_demand", "action", "target_url", "equivalence_reason", "evidence_sources", "reviewer", "approved_at", "last_tested_at"];
const allowed = new Set(["restore_200", "redirect_301", "redirect_308", "consolidate_redirect", "404", "410", "noindex_200", "hold"]);
const errors = [];

for (const [index, record] of manifest.records.entries()) {
  for (const field of required) if (!(field in record)) errors.push(`record ${index + 1} (${record.source_url || "unknown"}) lacks ${field}`);
  if (!allowed.has(record.action)) errors.push(`${record.source_url}: invalid action ${record.action}`);
  if (["redirect_301", "redirect_308", "consolidate_redirect", "restore_200"].includes(record.action) && !record.target_url) errors.push(`${record.source_url}: ${record.action} needs target_url`);
  if (["404", "410"].includes(record.action) && record.target_url !== null) errors.push(`${record.source_url}: ${record.action} must not have target_url`);
  if (record.target_url?.startsWith("/")) {
    const built = path.join(root, "dist", record.target_url.replace(/^\//, ""), "index.html");
    if (!fs.existsSync(built)) errors.push(`${record.source_url}: built target missing ${record.target_url}`);
  }
}

function invoke(handler, url) {
  const state = { status: 200, headers: {}, body: "", ended: false };
  const response = {
    setHeader(name, value) { state.headers[name.toLowerCase()] = value; },
    status(code) { state.status = code; return response; },
    send(body) { state.body = body; state.ended = true; return state; },
    end() { state.ended = true; return state; }
  };
  return handler({ url, headers: { host: "perlcoders.com" } }, response) || state;
}

const legacyCases = [
  ["/main/scripts.html?script=SimpleRing", 301, "/archive/simplering/"],
  ["/main/scripts.html?script=TotalNews", 301, "/archive/totalnews/"],
  ["/main/scripts2.html?script=SimleGallery", 301, "/archive/simlegallery/"],
  ["/main/scripts.html?script=WeddingRegistry", 301, "/archive/wedding-registry/"],
  ["/main/scripts.html?script=URLSpider", 301, "/archive/urlspider/"],
  ["/main/scripts.html?cat=19", 301, "/archive/"],
  ["/main/scripts.html?script=definitely-unknown", 404, null]
];
for (const [url, status, location] of legacyCases) {
  const result = invoke(legacyHandler, url);
  if (result.status !== status) errors.push(`${url}: expected ${status}, got ${result.status}`);
  if (location && result.headers.location !== location) errors.push(`${url}: expected Location ${location}, got ${result.headers.location}`);
}

const gone = invoke(goneHandler, "/chat/");
if (gone.status !== 410) errors.push(`/api/gone: expected 410, got ${gone.status}`);
if (gone.headers["x-robots-tag"] !== "noindex, follow") errors.push(`/api/gone: missing noindex header`);

const staticRedirects = new Map(vercel.redirects.map((rule) => [rule.source, rule.destination]));
for (const [source, target] of [["/main/crontab.html", "/now/cron-jobs/"], ["/scripts/info/linkchecker/info.html", "/archive/linkchecker/"]]) {
  if (staticRedirects.get(source) !== target) errors.push(`vercel.json lacks ${source} -> ${target}`);
}
const rewriteSources = new Set(vercel.rewrites.map((rule) => rule.source));
for (const source of ["/chat/:path*", "/clients/:path*", "/scripts/info/simplearea/info.html"]) if (!rewriteSources.has(source)) errors.push(`vercel.json lacks gone rewrite for ${source}`);
if (vercel.redirects.some((rule) => rule.source.includes(":path*") && rule.destination === "/")) errors.push("catch-all homepage redirect is forbidden");
if (JSON.stringify(redirects).includes("trafficgen.html") || JSON.stringify(redirects).includes("cats/email.html")) errors.push("deliberate 404 paths must not appear in redirect rules");

if (errors.length) {
  console.error(`Recovery QA failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`Recovery QA passed: ${manifest.records.length} material URL records, ${legacyCases.length} legacy handler cases, 3 gone-route declarations.`);
