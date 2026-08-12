import { readFile, writeFile } from "node:fs/promises";
const file = "src/layouts/BaseLayout.astro";
let text = await readFile(file, "utf8");
if (!text.includes('rel="icon"')) {
  text = text.replace('    <meta name="theme-color" content="#12110f" />', '    <meta name="theme-color" content="#12110f" />\n    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />');
  await writeFile(file, text, "utf8");
}
console.log("Favicon link present.");
