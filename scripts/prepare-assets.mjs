import { readFile, writeFile, readdir, copyFile, unlink } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(?:[A-Za-z]:)/, (match) => match.slice(1))), "..");
const routeMap = new Map([
  ["index.html", "/"], ["now.html", "/now/"], ["guide-modern-perl-http-client.html", "/now/modern-perl-http-client/"],
  ["rescue-cgi-guestbook.html", "/rescue/cgi-guestbook/"], ["compare.html", "/compare/"],
  ["compare-perl-vs-python-text-pipelines.html", "/compare/perl-vs-python-text-pipelines/"], ["timeline.html", "/timeline/"],
  ["timeline-event.html", "/timeline/cgi-pm-removed/"], ["labs.html", "/labs/"], ["labs-legacy-url-mapper.html", "/labs/legacy-url-mapper/"],
  ["labs-report-crawl-budget.html", "/labs/reports/crawl-budget/"], ["archive.html", "/archive/"],
  ["archive-simplering.html", "/archive/simplering/"], ["archive-easyresponder.html", "/archive/easyresponder/"],
  ["archive-autopic.html", "/archive/autopic/"], ["archive-bannerfarm.html", "/archive/bannerfarm/"],
  ["archive-totalavs-pro.html", "/archive/totalavs-pro/"], ["pulse.html", "/pulse/"], ["pulse-2026-08.html", "/pulse/2026-08/"],
  ["about.html", "/about/"], ["editorial-policy.html", "/editorial-policy/"], ["code-of-conduct.html", "/code-of-conduct/"],
  ["contribute.html", "/contribute/"], ["search.html", "/search/"], ["legal-notice.html", "/legal-notice/"],
  ["privacy.html", "/privacy/"], ["terms.html", "/terms/"], ["cookies.html", "/cookies/"], ["accessibility.html", "/accessibility/"]
]);

function rewrite(text) {
  let next = text;
  for (const [oldPath, newPath] of routeMap) next = next.split(oldPath).join(newPath);
  return next
    .replaceAll("https://github.com/lia-xim/perlcoders.com/examples", "https://github.com/lia-xim/perlcoders.com")
    .replaceAll('fetch("content/', 'fetch("/content/')
    .replaceAll("fetch('content/", "fetch('/content/")
    .replaceAll('href="feed.xml"', 'href="/feed.xml"');
}

const fragmentDirectory = path.join(root, "src", "fragments", "pages");
for (const name of await readdir(fragmentDirectory)) {
  const file = path.join(fragmentDirectory, name);
  await writeFile(file, rewrite(await readFile(file, "utf8")), "utf8");
}

for (const directory of [path.join(root, "public", "scripts"), path.join(root, "public", "content")]) {
  for (const name of await readdir(directory)) {
    if (!/\.(?:js|json|csv)$/i.test(name)) continue;
    const file = path.join(directory, name);
    await writeFile(file, rewrite(await readFile(file, "utf8")), "utf8");
  }
}

await copyFile(path.join(root, "public", "scripts", "forms-mail.js"), path.join(root, "public", "scripts", "forms.js"));
try { await unlink(path.join(root, "public", "security.txt")); } catch {}
console.log("Prepared canonical links, local data paths and mail-based contribution forms.");
