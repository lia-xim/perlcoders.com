import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
async function replaceIn(relative, replacements) {
  const file = path.join(root, relative);
  let text = await readFile(file, "utf8");
  for (const [before, after] of replacements) text = text.split(before).join(after);
  await writeFile(file, text, "utf8");
}

await replaceIn("src/fragments/pages/timeline.html", [[
`<p class="tl-year"><span>Pending</span><span class="tl-track">Language</span><span class="chip chip--unverified">Typed slot</span></p>
            <h3 class="tl-title">Current stable release</h3>
            <p class="card__dek">An editor fills version, date and the perldelta link from perl.org before this node publishes. It is in the trace as an empty slot rather than as a number we assumed.</p>
            <dl class="tl-why">
              <div><dt>Why it mattered</dt><dd class="muted">Not written — the event has no confirmed content yet.</dd></div>
              <div><dt>What remains today</dt><dd class="muted">Not written — the event has no confirmed content yet.</dd></div>
            </dl>`,
`<p class="tl-year"><time datetime="2026-07-15">15 Jul 2026</time><span class="tl-track">Language</span><span class="chip chip--live">Verified</span></p>
            <h3 class="tl-title">Perl 5.44.0 becomes the current stable release</h3>
            <p class="card__dek">The first production release of the 5.44 series is the stable version recommended by perl.org for new installations.</p>
            <dl class="tl-why">
              <div><dt>Why it mattered</dt><dd>It establishes the current production baseline while the odd-numbered development branch continues separately.</dd></div>
              <div><dt>What remains today</dt><dd><a href="https://www.perl.org/get.html" rel="noopener">perl.org currently recommends 5.44.0</a>; point releases may supersede it and this item must be rechecked.</dd></div>
            </dl>`
]]);

await replaceIn("src/fragments/pages/index.html", [
  [">perlcoders/examples<", ">public source repository<"]
]);

await replaceIn("src/fragments/pages/labs.html", [
  ["<span class=\"repolist__name\">tests//</span>", "<span class=\"repolist__name\">scripts/</span>"]
]);

await replaceIn("public/scripts/redirect-resolver.js", [
  [" /410.html  410", " /410/  410"],
  [" /404.html  404", " /404/  404"],
  ["tests//", "test harness"]
]);
await replaceIn("public/scripts/validate-content.js", [["tests//", "the test harness"]]);
await replaceIn("public/scripts/url-mapper.js", [["tests//", "the test harness"]]);
await replaceIn("public/content/redirects.json", [
  ["\"/410.html\"", "\"/410/\""],
  ["\"/404.html\"", "\"/404/\""]
]);

console.log("Final editorial pass applied.");
