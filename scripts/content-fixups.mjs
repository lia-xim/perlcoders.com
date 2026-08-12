import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const targets = [];
for (const directory of ["src/fragments/pages", "public/content", "public/scripts"]) {
  for (const name of await readdir(path.join(root, directory))) {
    if (/\.(?:html|json|js)$/i.test(name)) targets.push(path.join(root, directory, name));
  }
}

for (const file of targets) {
  let text = await readFile(file, "utf8");
  text = text
    .replaceAll('"//about/', '"/about/')
    .replaceAll('"//archive/', '"/archive/')
    .replaceAll('"//compare/', '"/compare/')
    .replaceAll('"//contribute/', '"/contribute/')
    .replaceAll('"//labs/', '"/labs/')
    .replaceAll('"//now/', '"/now/')
    .replaceAll('"//pulse/', '"/pulse/')
    .replaceAll('"//search/', '"/search/')
    .replaceAll('"//timeline/', '"/timeline/')
    .replaceAll('href="tests//"', 'href="https://github.com/lia-xim/perlcoders.com/tree/main/scripts"')
    .replaceAll("https://github.com/perlcoders/perlcoders.com", "https://github.com/lia-xim/perlcoders.com")
    .replaceAll("https://github.com/perlcoders/examples", "https://github.com/lia-xim/perlcoders.com")
    .replaceAll('target: "/410.html"', 'target: "/410/"')
    .replaceAll('target: "/404.html"', 'target: "/404/"')
    .replaceAll('"target": "/410.html"', '"target": "/410/"')
    .replaceAll('"target": "/404.html"', '"target": "/404/"');

  if (file.endsWith(path.join("pages", "index.html"))) {
    text = text
      .replace('<p class="evidence__value evidence__value--pending">Awaiting editor verification</p>', '<p class="evidence__value">Perl 5.44.0</p>')
      .replace('<span class="chip chip--unverified">Unverified</span>\n          <a href="https://www.perl.org/get.html"', '<span class="chip chip--live">Verified 12 Aug 2026</span>\n          <a href="https://www.perl.org/get.html"')
      .replace('Relaunch build — templates, Timeline, Legacy URL Mapper', 'Astro production build — canonical routes, Timeline, Labs and public source')
      .replace('<time datetime="2026-08-11">11 Aug 2026</time>', '<time datetime="2026-08-12">12 Aug 2026</time>');
  }

  if (file.endsWith(path.join("pages", "now.html"))) {
    text = text.replace(
      '<dd><span class="chip chip--unverified">Unverified</span> Awaiting editor verification against <a href="https://www.perl.org/get.html" rel="noopener">perl.org release announcements</a>. This slot stays empty until a person checks it.</dd>',
      '<dd><span class="chip chip--live">Verified 12 Aug 2026</span> Perl 5.44.0 is the current stable release. <a href="https://www.perl.org/get.html" rel="noopener">Source: perl.org downloads</a>.</dd>'
    );
  }

  await writeFile(file, text, "utf8");
}

const nowFile = path.join(root, "public/content/now.json");
const now = JSON.parse(await readFile(nowFile, "utf8"));
const stable = now.items.find((item) => item.id === "perl-stable");
Object.assign(stable, { value: "Perl 5.44.0", verified: true, source: "https://www.perl.org/get.html", checkedOn: "2026-08-12", pendingText: null });
const site = now.items.find((item) => item.id === "site-update");
Object.assign(site, { value: "Astro production build — canonical routes, Timeline, Labs and public source", source: "/about/#changelog", checkedOn: "2026-08-12" });
await writeFile(nowFile, `${JSON.stringify(now, null, 2)}\n`, "utf8");

const timelineFile = path.join(root, "public/content/timeline.json");
const timeline = JSON.parse(await readFile(timelineFile, "utf8"));
const release = timeline.events.find((item) => item.id === "perl-current-stable");
Object.assign(release, {
  date: "2026-07-15",
  displayDate: "15 Jul 2026",
  year: 2026,
  title: "Perl 5.44.0 becomes the current stable release",
  summary: "The first production release of the 5.44 series.",
  whyItMattered: "It is the stable baseline recommended by perl.org for new installations.",
  whatRemains: "Development releases continue on a separate odd-numbered branch; production guidance stays on 5.44.x.",
  verified: true,
  pendingText: null,
  sources: [{ label: "perl.org downloads", url: "https://www.perl.org/get.html" }]
});
await writeFile(timelineFile, `${JSON.stringify(timeline, null, 2)}\n`, "utf8");

console.log(`Applied editorial and canonical fixups to ${targets.length} files.`);
