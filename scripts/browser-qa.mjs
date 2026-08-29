import { chromium } from "playwright-core";
import AxeBuilder from "@axe-core/playwright";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const baseURL = process.env.PERLCODERS_QA_URL || "http://127.0.0.1:4322";
const executablePath = process.env.EDGE_PATH || "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const hostResolverRules = process.env.PERLCODERS_QA_HOST_RULES;
const artifacts = process.env.PERLCODERS_QA_ARTIFACTS
  ? path.resolve(process.env.PERLCODERS_QA_ARTIFACTS)
  : path.resolve("artifacts");
await mkdir(artifacts, { recursive: true });

const browser = await chromium.launch({ executablePath, headless: true, args: hostResolverRules ? [`--host-resolver-rules=${hostResolverRules}`] : [] });
const failures = [];
const report = [];

async function inspect(urlPath, viewport, label) {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  const page = await context.newPage();
  await page.route("https://analytics.contextter.com/script.js", (route) => route.fulfill({
    status: 200,
    contentType: "application/javascript",
    body: "window.__tracked=[];window.umami={track:function(name,data){window.__tracked.push({name:name,data:data||{}});}};"
  }));
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
    footer: Boolean(document.querySelector("footer")),
    transferBytes: performance.getEntriesByType("resource").reduce((sum, entry) => sum + (entry.transferSize || 0), 0),
    domContentLoadedMs: performance.getEntriesByType("navigation")[0]?.domContentLoadedEventEnd || null
  }));
  const accessibility = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  if (!response || response.status() >= 400) failures.push(`${label}: HTTP ${response?.status()}`);
  if (metrics.h1 !== 1) failures.push(`${label}: expected one h1, got ${metrics.h1}`);
  if (!metrics.canonical?.startsWith("https://perlcoders.com/")) failures.push(`${label}: invalid canonical`);
  if (metrics.scrollWidth > metrics.viewport + 1) failures.push(`${label}: horizontal overflow ${metrics.scrollWidth}px > ${metrics.viewport}px`);
  if (!metrics.footer) failures.push(`${label}: missing footer`);
  if (errors.length) failures.push(`${label}: ${errors.join(" | ")}`);
  if (accessibility.violations.length) {
    const summary = accessibility.violations
      .map((violation) => `${violation.id} (${violation.nodes.length}: ${violation.nodes.map((node) => node.target.join(" ")).join(", ")})`)
      .join(", ");
    failures.push(`${label}: accessibility violations ${summary}`);
  }

  if (urlPath === "/") {
    await page.keyboard.press("Tab");
    const keyboardFocus = await page.evaluate(() => {
      const active = document.activeElement;
      const style = active ? getComputedStyle(active) : null;
      return {
        className: active?.className || "",
        href: active?.getAttribute?.("href") || null,
        outline: style?.outlineStyle || "none"
      };
    });
    if (!String(keyboardFocus.className).includes("skip") || keyboardFocus.href !== "#main" || keyboardFocus.outline === "none") {
      failures.push(`${label}: skip-link keyboard focus is not visible ${JSON.stringify(keyboardFocus)}`);
    }
  }

  if (metrics.transferBytes > 1_500_000) failures.push(`${label}: transferred ${metrics.transferBytes} bytes, over 1.5 MB QA budget`);
  if (metrics.domContentLoadedMs && metrics.domContentLoadedMs > 5_000) failures.push(`${label}: DOMContentLoaded ${metrics.domContentLoadedMs} ms, over 5 s QA budget`);

  if (urlPath === "/" && viewport.width < 600) {
    const toggle = page.locator("[data-nav-toggle]");
    if (!(await toggle.isVisible())) failures.push(`${label}: mobile menu trigger is not visible`);
    else {
      await toggle.click();
      if (!(await page.locator("#nav-drawer").isVisible())) failures.push(`${label}: mobile menu did not open`);
      await toggle.click();
      if (await page.locator("#nav-drawer").isVisible()) failures.push(`${label}: mobile menu did not close`);
    }
  }

  if (urlPath === "/") {
    const primaryPaths = await page.locator(".site-nav__primary a").evaluateAll((links) => links.map((link) => link.getAttribute("href")));
    for (const expected of ["/now/", "/rescue/", "/timeline/", "/compare/", "/labs/", "/archive/", "/pulse/"]) {
      if (!primaryPaths.includes(expected)) failures.push(`${label}: missing original primary route ${expected}`);
    }
    await page.locator('[data-era-btn="1997"]').click();
    if ((await page.locator('[data-era-btn="1997"]').getAttribute("aria-selected")) !== "true") failures.push(`${label}: era interaction did not select 1997`);
    if (!(await page.locator('[data-specimen-pane="1997"]').isVisible())) failures.push(`${label}: era interaction did not reveal 1997 specimen`);
    if ((await page.locator('header a[href="/de/"]').count()) < 1) failures.push(`${label}: German language route is missing`);
    if (!(await page.locator(".rebuild-strip").isVisible())) failures.push(`${label}: public rebuild case strip is not visible`);
    const eraEvent = await page.evaluate(() => window.__tracked?.find((event) => event.name === "era_select"));
    if (!eraEvent || eraEvent.data.era !== "1997") failures.push(`${label}: era analytics event missing or unsafe ${JSON.stringify(eraEvent)}`);
  }

  if (urlPath === "/de/") {
    if ((await page.locator("html").getAttribute("lang")) !== "de") failures.push(`${label}: document language is not de`);
    if ((await page.locator("[data-frame]").count()) !== 9) failures.push(`${label}: German homepage does not mirror all 9 editorial frames`);
    await page.locator('[data-era-btn="1997"]').click();
    if ((await page.locator('[data-era-btn="1997"]').getAttribute("aria-selected")) !== "true") failures.push(`${label}: German era interaction did not select 1997`);
    if (!(await page.locator('[data-specimen-pane="1997"]').isVisible())) failures.push(`${label}: German era interaction did not reveal 1997 specimen`);
    await page.locator('[data-chooser-opt="scraping"]').click();
    if (!(await page.locator("[data-verdict]").isVisible())) failures.push(`${label}: German language chooser did not reveal a verdict`);
    if (!(await page.locator('[data-slot="task"]').textContent() || "").toLocaleLowerCase("de").includes("seiten abrufen")) failures.push(`${label}: German chooser content is not localized`);
    for (const expected of ["/de/anleitungen/", "/de/werkzeuge/url-mapper/", "/de/fallstudie/"]) {
      if ((await page.locator(`header a[href="${expected}"]`).count()) < 1) failures.push(`${label}: missing German primary route ${expected}`);
    }
    const chooserEvent = await page.evaluate(() => window.__tracked?.find((event) => event.name === "language_choice"));
    if (!chooserEvent || chooserEvent.data.task !== "scraping") failures.push(`${label}: language-choice analytics event missing ${JSON.stringify(chooserEvent)}`);
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
    const mapperEvents = await page.evaluate(() => (window.__tracked || []).filter((event) => event.name.indexOf("legacy_mapper_") === 0));
    if (!mapperEvents.some((event) => event.name === "legacy_mapper_run") || mapperEvents.some((event) => JSON.stringify(event.data).includes("http"))) {
      failures.push(`${label}: mapper analytics missing or contains URL-like input ${JSON.stringify(mapperEvents)}`);
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
    await page.locator("#q").press("Enter");
    const searchEvent = await page.evaluate(() => window.__tracked?.find((event) => event.name === "site_search"));
    if (!searchEvent || Object.prototype.hasOwnProperty.call(searchEvent.data, "query")) failures.push(`${label}: privacy-safe search analytics event missing ${JSON.stringify(searchEvent)}`);
  }

  await page.screenshot({ path: path.join(artifacts, `${label}.png`), fullPage: true });
  report.push({
    label,
    urlPath,
    status: response?.status(),
    ...metrics,
    accessibilityViolations: accessibility.violations.map(({ id, impact, nodes }) => ({ id, impact, nodes: nodes.length })),
    errors
  });
  await context.close();
}

await inspect("/", { width: 1440, height: 1000 }, "home-desktop-full");
await inspect("/", { width: 390, height: 844 }, "home-mobile-full");
await inspect("/de/", { width: 1440, height: 1000 }, "home-de-desktop-full");
await inspect("/de/", { width: 390, height: 844 }, "home-de-mobile-full");
await inspect("/rescue/", { width: 1280, height: 900 }, "rescue-desktop-full");
await inspect("/rescue/cgi-to-psgi/", { width: 390, height: 844 }, "cgi-to-psgi-mobile-full");
await inspect("/timeline/", { width: 1280, height: 900 }, "timeline-desktop-full");
await inspect("/labs/legacy-url-mapper/", { width: 1280, height: 900 }, "mapper-desktop-full");
await inspect("/de/werkzeuge/url-mapper/", { width: 390, height: 844 }, "mapper-de-mobile-full");
await inspect("/de/fallstudie/", { width: 1280, height: 900 }, "case-study-de-desktop-full");
await inspect("/labs/url-normalisation-rules/", { width: 390, height: 844 }, "normalisation-rules-mobile-full");
await inspect("/search/?q=Perl", { width: 390, height: 844 }, "search-mobile-full");
await inspect("/labs/reports/crawl-budget/", { width: 1280, height: 900 }, "crawl-report-desktop-full");
await inspect("/archive/easyresponder/", { width: 390, height: 844 }, "easyresponder-mobile-full");
await inspect("/archive/methodology/", { width: 1280, height: 900 }, "archive-method-desktop-full");
await inspect("/legal-notice/", { width: 1280, height: 900 }, "legal-desktop-full");
await inspect("/privacy/", { width: 1280, height: 900 }, "privacy-desktop-full");
await inspect("/de/datenschutz/", { width: 390, height: 844 }, "privacy-de-mobile-full");

await browser.close();
await writeFile(path.join(artifacts, "browser-qa.json"), `${JSON.stringify({ baseURL, report, failures }, null, 2)}\n`, "utf8");

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log(`Browser QA passed: ${report.length} rendered views, interactions, console and overflow checks.`);
