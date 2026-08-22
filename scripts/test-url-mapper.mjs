import { readFile } from "node:fs/promises";
import vm from "node:vm";
import assert from "node:assert/strict";

const source = await readFile(new URL("../public/scripts/url-mapper.js", import.meta.url), "utf8");
const sandbox = { module: { exports: {} }, exports: {}, URL };
vm.runInNewContext(source, sandbox, { filename: "url-mapper.js" });
const mapper = sandbox.module.exports;

const normal = mapper.normalize("HTTP://Example.com:80/a//b?utm_source=x&id=7");
assert.equal(normal.normalized, "http://example.com/a/b?id=7");
assert.deepEqual(Array.from(normal.trackingStripped, (item) => item.name), ["utm_source"]);

const result = mapper.analyze([
  "/x?a=1&b=2",
  "/x?b=2&a=1",
  "/main/scripts.html?script=One",
  "/main/scripts.html?script=Two",
  "javascript:alert(1)"
].join("\n"));

assert.equal(result.stats.input, 5);
assert.equal(result.stats.parsed, 4);
assert.equal(result.stats.invalid, 1);
assert.equal(result.stats.duplicate, 1);
assert.equal(result.stats.review, 1);
assert.equal(result.groups.find((group) => group.path === "/x").status, "duplicate");
assert.equal(result.groups.find((group) => group.path === "/main/scripts.html").status, "review");

const csv = mapper.toCsv(result);
assert.match(csv, /MANUAL REVIEW REQUIRED/);
assert.match(csv, /invalid/);
assert.match(csv, /Unsupported or malformed URL scheme/);

console.log("Mapper QA passed: normalisation, duplicate, review, invalid retention and CSV output.");
