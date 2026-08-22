import { readFile } from "node:fs/promises";
import path from "node:path";

const register = JSON.parse(await readFile("config/editorial-reviews.json", "utf8"));
const pagesSource = await readFile("src/data/pages.ts", "utf8");
const techPaths = [...pagesSource.matchAll(/path:\s*"([^"]+)"[^\n]+kind:\s*"techArticle"/g)].map((match) => match[1]);
const failures = [];
const allowed = new Set(["editorial_source_checked", "independent_review_pending", "independent_review_approved", "corrections_required", "rejected"]);
const records = new Map();

for (const record of register.pages) {
  if (records.has(record.path)) failures.push(`duplicate review record: ${record.path}`);
  records.set(record.path, record);
  if (!allowed.has(record.status)) failures.push(`${record.path}: unknown status ${record.status}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.sourceCheckedAt || "")) failures.push(`${record.path}: invalid sourceCheckedAt`);
  if (record.codeTested && !record.testCommand) failures.push(`${record.path}: codeTested requires testCommand`);
  if (record.status === "independent_review_pending") {
    if (!record.independentReviewRequired) failures.push(`${record.path}: pending review must be required`);
    if (record.reviewer || record.reviewedAt || record.reviewedCommit) failures.push(`${record.path}: pending review cannot invent reviewer evidence`);
    if (!record.blockedClaims?.length) failures.push(`${record.path}: pending review must list blocked claims`);
  }
  if (record.status === "independent_review_approved") {
    if (!record.reviewer || !record.reviewedAt || !record.reviewedCommit) failures.push(`${record.path}: approved review requires reviewer, timestamp and commit`);
  }
}

for (const route of techPaths) if (!records.has(route)) failures.push(`missing techArticle review record: ${route}`);
for (const route of records.keys()) if (!techPaths.includes(route)) failures.push(`review record has no techArticle route: ${route}`);

for (const record of register.pages.filter((entry) => entry.status === "independent_review_pending")) {
  const file = record.path === "/" ? "dist/index.html" : path.join("dist", record.path, "index.html");
  const html = await readFile(file, "utf8");
  if (!html.includes('data-review-status="independent_review_pending"')) failures.push(`${record.path}: missing visible review status`);
  const robots = html.match(/<meta name="robots" content="([^"]+)"/)?.[1] || "";
  if (/noindex/i.test(robots)) failures.push(`${record.path}: pending review must not silently noindex the existing page`);
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Editorial review QA passed: ${techPaths.length} technical pages, ${register.pages.filter((entry) => entry.status === "independent_review_pending").length} independent reviews pending.`);
