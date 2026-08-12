import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = process.env.PERLCODERS_LEGACY_SOURCE;
if (!sourceRoot) throw new Error("Set PERLCODERS_LEGACY_SOURCE to the local legacy export directory before importing.");
const fragmentRoot = path.join(root, "src", "fragments", "pages");

const routes = {
  "index.html": "/",
  "now.html": "/now/",
  "guide-modern-perl-http-client.html": "/now/modern-perl-http-client/",
  "rescue-cgi-guestbook.html": "/rescue/cgi-guestbook/",
  "compare.html": "/compare/",
  "compare-perl-vs-python-text-pipelines.html": "/compare/perl-vs-python-text-pipelines/",
  "timeline.html": "/timeline/",
  "timeline-event.html": "/timeline/cgi-pm-removed/",
  "labs.html": "/labs/",
  "labs-legacy-url-mapper.html": "/labs/legacy-url-mapper/",
  "labs-report-crawl-budget.html": "/labs/reports/crawl-budget/",
  "archive.html": "/archive/",
  "archive-simplering.html": "/archive/simplering/",
  "archive-easyresponder.html": "/archive/easyresponder/",
  "archive-autopic.html": "/archive/autopic/",
  "archive-bannerfarm.html": "/archive/bannerfarm/",
  "archive-totalavs-pro.html": "/archive/totalavs-pro/",
  "pulse.html": "/pulse/",
  "pulse-2026-08.html": "/pulse/2026-08/",
  "about.html": "/about/",
  "editorial-policy.html": "/editorial-policy/",
  "code-of-conduct.html": "/code-of-conduct/",
  "contribute.html": "/contribute/",
  "search.html": "/search/",
  "legal-notice.html": "/legal-notice/",
  "privacy.html": "/privacy/",
  "terms.html": "/terms/",
  "cookies.html": "/cookies/",
  "accessibility.html": "/accessibility/",
  "404.html": "/404/",
  "410.html": "/410/"
};

const literalReplacements = new Map([
  ["[REQUIRED — legal name of the natural person or company]", "Matthias Ramahi"],
  ["[REQUIRED — e.g. Einzelunternehmen, GmbH, UG (haftungsbeschränkt)]", "Sole proprietor (Einzelunternehmen)"],
  ["[REQUIRED — street, number, postcode, city, country — a PO box is not sufficient]", "Kempener Straße 44, 40699 Erkrath, Germany"],
  ["[REQUIRED — managing director(s), if a company]", "Matthias Ramahi"],
  ["[REQUIRED — a monitored address; a contact form alone is not sufficient]", "<a href=\"mailto:info@matthiasramahi.de\">info@matthiasramahi.de</a>"],
  ["[REQUIRED — or another means of direct and efficient contact]", "<a href=\"tel:+4917642449858\">+49 (0) 176 42449858</a>"],
  ["[REQUIRED — register court and number, if registered — otherwise state 'not registered']", "Not registered in a commercial register"],
  ["[REQUIRED — USt-IdNr. under §27a UStG, if held — otherwise state 'none held']", "Available from the operator on request"],
  ["[REQUIRED — name and full postal address of the responsible person]", "Matthias Ramahi, Kempener Straße 44, 40699 Erkrath, Germany"],
  ["[REQUIRED — state whether you are willing or obliged to participate in dispute resolution proceedings before a consumer arbitration board]", "The operator is neither willing nor obliged to participate in dispute resolution proceedings before a consumer arbitration board."],
  ["[REQUIRED — name and address — same as the Legal notice]", "Matthias Ramahi, Kempener Straße 44, 40699 Erkrath, Germany"],
  ["[REQUIRED — email address for data protection enquiries]", "<a href=\"mailto:info@matthiasramahi.de\">info@matthiasramahi.de</a>"],
  ["[REQUIRED — state 'not appointed' or give contact details]", "No data protection officer has been appointed."],
  ["[REQUIRED — state the hosting provider's log retention period, e.g. 7 or 30 days]", "Logs are retained only as required for security and reliable delivery; the exact platform-level period follows the active Vercel account configuration and Vercel's current policies."],
  ["[REQUIRED — hosting provider name, country, and whether an Art. 28 data processing agreement is in place]", "Vercel Inc., United States. The operator uses Vercel's data-processing terms and the safeguards described in Vercel's privacy documentation."],
  ["[REQUIRED — commit to a response window, e.g. within 5 working days]", "We aim to acknowledge accessibility reports within five working days."],
  ["[REQUIRED — in the EU, name the competent enforcement body for your member state]", "This is a voluntary accessibility statement for a small independent publication. No formal public-sector enforcement procedure is claimed; unresolved concerns can be directed to the operator."],
  ["[REQUIRED — governing law and place of jurisdiction — confirm with a lawyer; consumer protection rules restrict what may be agreed here]", "German law applies where legally permissible. Mandatory consumer-protection rules remain unaffected; no exclusive venue is agreed for consumers."]
]);

function extractMain(html, file) {
  const match = html.match(/<main\b[^>]*>[\s\S]*?<\/main>/i);
  if (!match) throw new Error(`No <main> element found in ${file}`);
  return match[0];
}

function transformLinks(html) {
  let next = html;
  for (const [file, route] of Object.entries(routes)) {
    const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    next = next.replace(new RegExp(`([\"'])${escaped}(#[^\"']*)?([\"'])`, "g"), (_, open, hash = "", close) => `${open}${route}${hash}${close}`);
  }
  return next
    .replace(/([\"'])feed\.xml([\"'])/g, "$1/feed.xml$2")
    .replace(/([\"'])content\//g, "$1/content/")
    .replace(/([\"'])js\//g, "$1/scripts/")
    .replace(/https:\/\/github\.com\/perlcoders/g, "https://github.com/lia-xim/perlcoders.com");
}

function fillPublishBlocks(html) {
  let next = html;
  for (const [placeholder, replacement] of literalReplacements) {
    next = next.split(placeholder).join(replacement);
  }
  return next
    .replaceAll("<mark class=\"legal-slot\">Matthias Ramahi</mark>", "Matthias Ramahi")
    .replaceAll("<mark class=\"legal-slot\">Sole proprietor (Einzelunternehmen)</mark>", "Sole proprietor (Einzelunternehmen)")
    .replaceAll("<mark class=\"legal-slot\">Kempener Straße 44, 40699 Erkrath, Germany</mark>", "Kempener Straße 44, 40699 Erkrath, Germany")
    .replace(/<mark class="legal-slot">(<a[\s\S]*?<\/a>)<\/mark>/g, "$1")
    .replace(/<mark class="legal-slot">([^<]+)<\/mark>/g, "$1");
}

await mkdir(fragmentRoot, { recursive: true });

for (const file of Object.keys(routes)) {
  const input = await readFile(path.join(sourceRoot, file), "utf8");
  const fragment = fillPublishBlocks(transformLinks(extractMain(input, file)));
  await writeFile(path.join(fragmentRoot, file.replace(/\.html$/, ".html")), `${fragment}\n`, "utf8");
}

console.log(`Imported ${Object.keys(routes).length} page fragments from ${sourceRoot}`);
