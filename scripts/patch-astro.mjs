import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const pageFile = path.join(root, "src/pages/[...slug].astro");
let page = await readFile(pageFile, "utf8");
page = page.replace(
  "if (!fragment) throw new Error(`Missing imported page fragment: ${key}`);",
  `if (!fragment) throw new Error(\`Missing imported page fragment: \${key}\`);\nconst scriptSources = (page.scripts ?? []).flatMap((script) => script === \"timeline-motion\"\n  ? [\"/vendor/gsap.min.js\", \"/vendor/ScrollTrigger.min.js\", \"/scripts/timeline-scroll.js\"]\n  : [\`/scripts/\${script}.js\`]\n);`
);
page = page.replace(
  /  \{page\.scripts\?[\s\S]*?timeline-motion\.ts'\);`\} \/><\/script>\}\r?\n/,
  "  {scriptSources.map((source) => <script is:inline src={source} defer></script>)}\n"
);
await writeFile(pageFile, page, "utf8");

const layoutFile = path.join(root, "src/layouts/BaseLayout.astro");
let layout = await readFile(layoutFile, "utf8");
layout = layout.replace('<script src="/scripts/site.js" defer></script>', '<script is:inline src="/scripts/site.js" defer></script>');
layout = layout.replace('<script src="/scripts/reveal.js" defer></script>', '<script is:inline src="/scripts/reveal.js" defer></script>');
await writeFile(layoutFile, layout, "utf8");

await mkdir(path.join(root, "public/vendor"), { recursive: true });
await copyFile(path.join(root, "node_modules/gsap/dist/gsap.min.js"), path.join(root, "public/vendor/gsap.min.js"));
await copyFile(path.join(root, "node_modules/gsap/dist/ScrollTrigger.min.js"), path.join(root, "public/vendor/ScrollTrigger.min.js"));
console.log("Patched Astro script loading and copied vendored GSAP runtime.");
