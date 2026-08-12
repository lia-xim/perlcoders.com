import { chromium } from "playwright-core";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const baseURL = process.env.PERLCODERS_QA_URL || "http://127.0.0.1:4322";
const executablePath = process.env.EDGE_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const artifacts = path.resolve("artifacts");
await mkdir(artifacts, { recursive: true });

const browser = await chromium.launch({ executablePath, headless: true });
const failures = [];
const report = [];

async function inspect(urlPath, viewport, label) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on("console", (message) => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => errors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText || ""}`));
  page.on("response", (response) => {
    if (response.status() >= 400) errors.push(`response: ${response.status()} ${response.url()}`);
  });

  const response = await page.goto(`${baseURL}${urlPath}`, { waitUntil: "networkidle" });
  const metrics = await page.evaluate(() => ({
    title: document.title,
    h1: document.querySelectorAll("h1").length,
    canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"),
    viewport: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    footer: Boolean(document.querySelector("footer"))
  }));

  if (!response || response.status() >= 400) failures.push(`${label}: HTTP ${response?.status()}`);
  if (metrics.h1 !== 1) failures.push(`${label}: expected one h1, got ${metrics.h1}`);
  if (!metrics.canonical?.startsWith("https://perlcoders.com/")) failures.push(`${label}: invalid canonical`);
  if (metrics.scrollWidth > metrics.viewport + 1) failures.push(`${label}: horizontal overflow ${metrics.scrollWidth}px > ${metrics.viewport}px`);
  if (!metrics.footer) failures.push(`${label}: missing footer`);
  if (errors.length) failures.push(`${label}: ${errors.join(" | ")}`);

  if (urlPath === "/" && viewport.width < 600) {
    const toggle = page.locator("[data-nav-toggle]");
    if (!(await toggle.isVisible())) failures.push(`${label}: mobile menu trigger is not visible`);
    else {
      await toggle.click();
      if (!(await page.locator("#nav-drawer").isVisible())) failures.push(`${label}: mobile menu did not open`);
    }
  }

  if (urlPath === "/") {
    const era = page.locator('[data-era-btn="1997"]');
    await era.click();
    const selected = await era.getAttribute("aria-selected");
    const panelHidden = await page.locator('[data-specimen-pane="1997"]').getAttribute("hidden");
    if (selected !== "true" || panelHidden !== null) failures.push(`${label}: era interaction did not switch panels`);
  }

  if (urlPath === "/labs/legacy-url-mapper/") {
    await page.locator("[data-mapper-sample]").click();
    await page.locator("[data-mapper]").evaluate((form) => form.requestSubmit());
    const mapper = await page.evaluate(() => ({
      outputVisible: !document.querySelector("[data-mapper-out]")?.hasAttribute("hidden"),
      input: document.querySelector('[data-stat="input"]')?.textContent?.trim(),
      rows: document.querySelectorAll("[data-mapper-table] tbody tr").length,
      exportEnabled: !document.querySelector("[data-mapper-export]")?.hasAttribute("disabled")
    }));
    if (!mapper.outputVisible || mapper.input !== "9" || mapper.rows < 1 || !mapper.exportEnabled) {
      failures.push(`${label}: mapper interaction failed ${JSON.stringify(mapper)}`);
    }
  }

  if (urlPath.startsWith("/search/")) {
    const search = await page.evaluate(() => ({
      count: document.querySelector("[data-result-count]")?.textContent?.trim(),
      visible: [...document.querySelectorAll("[data-results] .result")].filter((node) => !node.hasAttribute("hidden")).length
    }));
    if (!search.count?.includes("match") || search.visible < 1) failures.push(`${label}: search query did not filter ${JSON.stringify(search)}`);
    await page.locator("#q").fill("no-result-token-7f21");
    await page.waitForTimeout(250);
    if (!(await page.locator("[data-search-empty]").isVisible())) failures.push(`${label}: search empty state did not appear`);
  }

  await page.screenshot({ path: path.join(artifacts, `${label}.png`), fullPage: true });
  report.push({ label, urlPath, status: response?.status(), ...metrics, errors });
  await context.close();
}

await inspect("/", { width: 1440, height: 1000 }, "home-desktop-full");
await inspect("/", { width: 390, height: 844 }, "home-mobile-full");
await inspect("/timeline/", { width: 1280, height: 900 }, "timeline-desktop-full");
await inspect("/labs/legacy-url-mapper/", { width: 1280, height: 900 }, "mapper-desktop-full");
await inspect("/search/?q=Perl", { width: 390, height: 844 }, "search-mobile-full");
await inspect("/legal-notice/", { width: 1280, height: 900 }, "legal-desktop-full");

await browser.close();
await writeFile(path.join(artifacts, "browser-qa.json"), `${JSON.stringify({ baseURL, report, failures }, null, 2)}\n`, "utf8");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Browser QA passed: ${report.length} rendered views, interactions, console and overflow checks.`);
