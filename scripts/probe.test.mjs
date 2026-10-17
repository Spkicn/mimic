#!/usr/bin/env node
/**
 * Offline behaviour tests for skills/mimic/scripts/mimic-probe.mjs.
 *
 * A stdlib HTTP server stands in for api.github.com, so every fixture is deterministic and
 * the suite needs no network, token, or installed `gh`. The assertions cover the contract
 * the skill depends on: status-aware errors (401/5xx are never "not found"), degraded exit
 * code 4, bounded JSON, cache semantics, the commit SHA, every fetched manifest, and the
 * extra --paths files.
 *
 * The probe runs as a child process while this process owns the mock server, so runs are
 * awaited one at a time (a synchronous spawn would block the server's event loop).
 */

import { createServer } from "node:http";
import { mkdtempSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const PROBE = join(HERE, "..", "skills", "mimic", "scripts", "mimic-probe.mjs");
const ROOT = mkdtempSync(join(tmpdir(), "mimic-probe-test-"));

const META = {
  full_name: "acme/widget",
  html_url: "https://github.com/acme/widget",
  description: "A widget",
  stargazers_count: 42,
  forks_count: 7,
  language: "TypeScript",
  topics: ["cli"],
  license: { spdx_id: "MIT" },
  archived: false,
  pushed_at: "2026-01-01T00:00:00Z",
  created_at: "2020-01-01T00:00:00Z",
  open_issues_count: 3,
  default_branch: "main",
  homepage: null,
};

const TREE = {
  truncated: false,
  tree: [
    { path: "README.md", type: "blob" },
    { path: "package.json", type: "blob" },
    { path: "Gemfile", type: "blob" },
    { path: "src", type: "tree" },
    { path: "src/index.ts", type: "blob" },
  ],
};

const LISTING = [
  { name: "README.md", type: "file" },
  { name: "package.json", type: "file" },
  { name: "Gemfile", type: "file" },
  { name: "src", type: "dir" },
];

const FILES = {
  "package.json": '{"name":"widget","version":"1.2.3"}',
  "Gemfile": 'source "https://rubygems.org"\ngem "rails"',
  "CONTRIBUTING.md": "# Contributing\n\nBe kind.",
};
const README = "# widget\n\nA small widget.\n";
const LONG_README = `${"x".repeat(5000)}\n`;

let mode = "healthy";
let longReadme = false;
let requests = [];

const server = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  requests.push({ path: url.pathname, search: url.search, auth: Boolean(req.headers.authorization) });
  const send = (status, body, type = "application/json") => {
    res.writeHead(status, { "content-type": type });
    res.end(typeof body === "string" ? body : JSON.stringify(body));
  };

  if (mode === "authRequired" && req.headers.authorization) return send(401, { message: "Bad credentials" });
  if (mode === "repo500" && url.pathname === "/repos/acme/widget") return send(500, { message: "boom" });
  if (mode === "tree500" && url.pathname === "/repos/acme/widget/git/trees/main") return send(500, { message: "boom" });
  if (mode === "readme500" && url.pathname === "/repos/acme/widget/readme") return send(500, { message: "boom" });
  if (mode === "manifest500" && url.pathname === "/repos/acme/widget/contents/package.json") return send(500, { message: "boom" });
  if (url.pathname === "/search/repositories") {
    if (mode === "search403") return send(403, { message: "rate limited" });
    return send(200, {
      incomplete_results: false,
      items: [{
        full_name: "acme/widget", stargazers_count: 42, license: { spdx_id: "MIT" },
        pushed_at: "2026-01-01T00:00:00Z", archived: false, description: "A widget",
      }],
    });
  }
  if (url.pathname === "/repos/acme/widget") return send(200, META);
  if (url.pathname === "/repos/acme/widget/commits/main") return send(200, { sha: "abc123" });
  if (url.pathname === "/repos/acme/widget/readme") return send(200, longReadme ? LONG_README : README, "text/plain");
  if (url.pathname === "/repos/acme/widget/git/trees/main") {
    return mode === "truncated" ? send(200, { truncated: true, tree: TREE.tree.slice(0, 2) }) : send(200, TREE);
  }
  if (url.pathname === "/repos/acme/widget/contents/") return send(200, LISTING);
  if (url.pathname.startsWith("/repos/acme/widget/contents/")) {
    const name = decodeURIComponent(url.pathname.slice("/repos/acme/widget/contents/".length));
    if (FILES[name] !== undefined) return send(200, FILES[name], "text/plain");
    return send(404, { message: "Not Found" });
  }
  return send(404, { message: "Not Found" });
});

await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const BASE = `http://127.0.0.1:${server.address().port}`;
let cacheCounter = 0;

function run(args, { cache } = {}) {
  const dir = cache ?? join(ROOT, `cache-${cacheCounter++}`);
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [PROBE, ...args], {
      env: {
        ...process.env,
        MIMIC_API: BASE,
        MIMIC_CACHE: dir,
        MIMIC_TIMEOUT_MS: "5000",
        GITHUB_TOKEN: "test-token",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let out = "";
    let err = "";
    const timer = setTimeout(() => child.kill(), 20000);
    child.stdout.on("data", (chunk) => { out += chunk; });
    child.stderr.on("data", (chunk) => { err += chunk; });
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (status) => { clearTimeout(timer); resolve({ status, out, err }); });
  });
}

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function reset(nextMode = "healthy") {
  mode = nextMode;
  requests = [];
}

test("healthy repository: exit 0, commit pinned, root listing, all manifests", async () => {
  reset();
  const r = await run(["acme/widget"]);
  assert(r.status === 0, `exit ${r.status}: ${r.err}`);
  assert(r.out.includes("commit abc123"), "commit SHA missing from output");
  assert(r.out.includes("stars 42"), "metadata missing");
  assert(r.out.includes("Gemfile"), "Gemfile was fetched but not rendered");
  assert(r.out.includes('gem "rails"'), "Gemfile body missing");
  assert(r.out.includes("--- README"), "README missing");
  assert(requests.length === 6, `expected 6 requests, saw ${requests.length}`);
});

test("cache hit reuses the original evidence date", async () => {
  reset();
  const cache = join(ROOT, `cache-${cacheCounter++}`);
  const firstRun = await run(["--json", "acme/widget"], { cache });
  assert(firstRun.status === 0, `first run exit ${firstRun.status}: ${firstRun.err}`);
  requests = [];
  const secondRun = await run(["--json", "acme/widget"], { cache });
  assert(secondRun.status === 0, `second run exit ${secondRun.status}: ${secondRun.err}`);
  const first = JSON.parse(firstRun.out)[0];
  const again = JSON.parse(secondRun.out)[0];
  assert(first.fetchedAt === again.fetchedAt, "fetchedAt changed on a cache hit");
  assert(again.cache === "hit", `expected cache hit, saw ${again.cache}`);
  assert(requests.length === 0, `cache hit still made ${requests.length} requests`);
});

test("--json honours --max-chars and reports the full length", async () => {
  reset();
  longReadme = true;
  try {
    const r = await run(["--json", "--max-chars", "100", "acme/widget"]);
    assert(r.status === 0, `exit ${r.status}: ${r.err}`);
    const parsed = JSON.parse(r.out)[0];
    assert(parsed.readme.length === 100, `README clipped to ${parsed.readme.length}`);
    assert(parsed.readmeLength === LONG_README.length, `readmeLength ${parsed.readmeLength}`);
    assert(parsed.readmeTruncated === true, "truncation flag missing");
    assert(r.out.length < 8000, `JSON output was ${r.out.length} bytes`);
  } finally {
    longReadme = false;
  }
});

test("metadata 500 is an HTTP error, never 'repository not found'", async () => {
  reset("repo500");
  const r = await run(["acme/widget"]);
  assert(r.status === 3, `exit ${r.status}`);
  assert(r.err.includes("HTTP 500"), `stderr: ${r.err}`);
  assert(!r.out.includes("repository not found"), "5xx was reported as not found");
});

test("tree 500 degrades with exit 4 and says so", async () => {
  reset("tree500");
  const r = await run(["acme/widget"]);
  assert(r.status === 4, `exit ${r.status}: ${r.err}`);
  assert(r.out.includes("partial:"), "no partial marker");
  assert(r.out.includes("recursive tree unavailable"), "tree failure not named");
  assert(r.out.includes("Gemfile"), "contents fallback lost the root listing");
});

test("README 500 degrades instead of claiming 'not found'", async () => {
  reset("readme500");
  const r = await run(["acme/widget"]);
  assert(r.status === 4, `exit ${r.status}: ${r.err}`);
  assert(r.out.includes("README: unavailable"), "README failure not visible");
  assert(r.out.includes("stars 42"), "metadata was lost with the README");
});

test("a failed cache write never discards a good fetch", async () => {
  reset();
  const notADir = join(ROOT, "not-a-directory");
  writeFileSync(notADir, "blocker");
  const r = await run(["acme/widget"], { cache: notADir });
  assert(r.status === 0, `exit ${r.status}: ${r.err}`);
  assert(r.out.includes("stars 42"), "fetch result was lost");
});

test("a rejected token is retried unauthenticated", async () => {
  reset("authRequired");
  const r = await run(["acme/widget"]);
  assert(r.status === 0, `exit ${r.status}: ${r.err}`);
  assert(requests.some((req) => req.auth), "no authenticated attempt was made");
  assert(requests.some((req) => !req.auth), "no unauthenticated retry was made");
});

test("--max-chars rejects non-positive/garbage values", async () => {
  reset();
  for (const bad of ["abc", "0", "-5"]) {
    const r = await run(["--max-chars", bad, "acme/widget"]);
    assert(r.status === 2, `${bad}: exit ${r.status}`);
    assert(r.err.includes("positive integer"), `${bad}: ${r.err}`);
  }
});

test("a path-traversal slug is a usage error", async () => {
  reset();
  const r = await run(["../.."]);
  assert(r.status === 2, `exit ${r.status}: ${r.out}${r.err}`);
});

test("search 403 exits 3 with the status, not an undocumented 1", async () => {
  reset("search403");
  const r = await run(["--search", "rate limiter"]);
  assert(r.status === 3, `exit ${r.status}: ${r.err}`);
  assert(r.err.includes("403"), `status missing: ${r.err}`);
  assert(r.err.includes("rate limited"), `cause missing: ${r.err}`);
});

test("--search without a value is a usage error", async () => {
  reset();
  const r = await run(["--search", "--json"]);
  assert(r.status === 2, `exit ${r.status}`);
  assert(r.err.includes("requires a value"), r.err);
});

test("--help succeeds", async () => {
  reset();
  const r = await run(["--help"]);
  assert(r.status === 0, `exit ${r.status}`);
  assert(r.out.includes("usage:"), "usage text missing");
});

test("search --json carries the evidence date", async () => {
  reset();
  const r = await run(["--search", "rate limiter", "--json"]);
  assert(r.status === 0, `exit ${r.status}: ${r.err}`);
  const parsed = JSON.parse(r.out);
  assert(Array.isArray(parsed.rows) && parsed.rows.length === 1, "rows missing");
  assert(typeof parsed.fetchedAt === "string" && parsed.fetchedAt.includes("T"), "fetchedAt missing");
});

test("--paths fetches and renders an extra file", async () => {
  reset();
  const r = await run(["acme/widget", "--paths", "CONTRIBUTING.md"]);
  assert(r.status === 0, `exit ${r.status}: ${r.err}`);
  assert(r.out.includes("--- CONTRIBUTING.md"), "requested file not rendered");
  assert(r.out.includes("Be kind."), "requested file body missing");
});

test("a failed manifest keeps the rest of the evidence and exits 4", async () => {
  reset("manifest500");
  const r = await run(["acme/widget"]);
  assert(r.status === 4, `exit ${r.status}: ${r.err}`);
  assert(r.out.includes("partial: manifest package.json unavailable"), "manifest failure not named");
  assert(r.out.includes('gem "rails"'), "the other manifest was lost");
});

test("a truncated tree degrades but still lists the root", async () => {
  reset("truncated");
  const r = await run(["acme/widget"]);
  assert(r.status === 4, `exit ${r.status}: ${r.err}`);
  assert(r.out.includes("tree truncated"), "truncation not reported");
  assert(r.out.includes("src/"), "contents fallback lost root entries");
});

const results = [];
for (const item of tests) {
  try {
    await item.fn();
    results.push({ ok: true, name: item.name });
  } catch (error) {
    results.push({ ok: false, name: item.name, message: error.message });
  }
}

server.close();
rmSync(ROOT, { recursive: true, force: true });

const failed = results.filter((result) => !result.ok);
for (const result of results) {
  if (result.ok) console.log(`ok    ${result.name}`);
  else console.error(`FAIL  ${result.name}\n      ${result.message}`);
}
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length === 0 ? 0 : 1);
