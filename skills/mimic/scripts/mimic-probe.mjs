#!/usr/bin/env node
/**
 * mimic-probe — fetch what a repository actually says, so the skill never has to guess.
 *
 * Fetches, per repository: metadata (stars, licence, archived, last push), README,
 * root tree, and dependency manifests. Caches every response under .mimic-cache/ and
 * prints bounded, plain-text output. No dependencies, Node 18+.
 *
 *   node mimic-probe.mjs vercel/next.js sindresorhus/got
 *   node mimic-probe.mjs --search "rate limiter" --language python
 *   node mimic-probe.mjs --json owner/repo
 *   node mimic-probe.mjs owner/repo --max-chars 4000
 *
 * Env:
 *   GITHUB_TOKEN   raises the API rate limit. When it is unset the script falls back to
 *                  `gh auth token`, so an environment already logged in with the GitHub
 *                  CLI works without exporting anything.
 *   MIMIC_CACHE    cache directory (default: ./.mimic-cache)
 *   MIMIC_TIMEOUT_MS  per-request timeout (default: 30000)
 *
 * Exit codes: 0 clean, 2 usage error, 3 a repository failed, 4 completed with degraded data
 * (a repository's recursive tree was unavailable; its metadata and README are still shown).
 */

import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";

const CACHE_DIR = process.env.MIMIC_CACHE || ".mimic-cache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = Number(process.env.MIMIC_TIMEOUT_MS) || 30000;
const API = "https://api.github.com";

const MANIFESTS = [
  "package.json", "pyproject.toml", "requirements.txt", "go.mod", "Cargo.toml",
  "Gemfile", "composer.json", "pom.xml", "build.gradle", "build.gradle.kts",
  "Dockerfile", "Makefile", "tsconfig.json",
];

function parseArgs(argv) {
  const opts = { repos: [], search: null, language: null, json: false, maxChars: 1200 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") opts.json = true;
    else if (a === "--search") opts.search = argv[++i];
    else if (a === "--language") opts.language = argv[++i];
    else if (a === "--max-chars") opts.maxChars = Number(argv[++i]) || 1200;
    else if (a.startsWith("--")) { console.error(`mimic-probe: unknown option ${a}`); process.exit(2); }
    else opts.repos.push(a);
  }
  return opts;
}

/**
 * Resolve an API token. An exported GITHUB_TOKEN wins; otherwise borrow the one the
 * GitHub CLI already holds. Requiring an exported variable made the script unusable in
 * an environment that was authenticated but had never exported anything.
 * @returns the token, or null to continue unauthenticated.
 */
let tokenResolved = false;
let tokenValue = null;
function githubToken() {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  if (tokenResolved) return tokenValue;
  tokenResolved = true;
  try {
    tokenValue = execFileSync("gh", ["auth", "token"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 5000,
    }).trim() || null;
  } catch {
    tokenValue = null; // gh absent, logged out, or the sandbox denied the spawn
  }
  return tokenValue;
}

function headers(accept = "application/vnd.github+json") {
  const h = { "User-Agent": "mimic-skill", Accept: accept, "X-GitHub-Api-Version": "2022-11-28" };
  const token = githubToken();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

/**
 * Report whether an error came from our own abort signal. The abort surfaces in several
 * shapes depending on where it lands — a DOMException, or a TypeError from fetch whose
 * `cause` holds it — so the whole chain is checked.
 * @param error - the caught value.
 * @returns whether the request was cut short by the timeout signal.
 */
function signalAborted(error) {
  for (let current = error; current; current = current.cause) {
    if (current.name === "TimeoutError" || current.name === "AbortError") return true;
  }
  return false;
}

async function cached(key, url, { raw = false, timeoutMs = FETCH_TIMEOUT_MS } = {}) {
  const file = join(CACHE_DIR, key.replace(/[^a-zA-Z0-9._-]/g, "_") + ".json");
  try {
    const info = await stat(file);
    if (Date.now() - info.mtimeMs < CACHE_TTL_MS) {
      const hit = JSON.parse(await readFile(file, "utf8"));
      if (hit.url === url) return { data: hit.data, cache: "hit" };
    }
  } catch { /* cache miss */ }

  let res;
  try {
    // Ask for the raw body directly; fall back to decoding the base64 contents payload.
    // The timeout matters: a very large repository's recursive tree can otherwise hold the
    // whole run open indefinitely.
    res = await fetch(url, {
      headers: headers(raw ? "application/vnd.github.raw" : undefined),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (signalAborted(error)) {
      throw new Error(`timed out after ${timeoutMs}ms fetching ${url} (raise MIMIC_TIMEOUT_MS)`);
    }
    throw new Error(`network unreachable for ${url}: ${error.message}`);
  }
  if (res.status === 404) return { data: null, cache: "404" };
  if (res.status === 403 || res.status === 429) {
    throw new Error(`rate limited by GitHub (HTTP ${res.status}) on ${url}. Set GITHUB_TOKEN.`);
  }
  if (!res.ok) return { data: null, cache: `HTTP ${res.status}` };

  // Reading the body belongs inside the timeout guard too: fetch resolves once the headers
  // arrive, so a large response can still be streaming when the signal fires, and an
  // unguarded res.text() then throws an unwrapped abort instead of a usable message.
  let data;
  try {
    if (raw) {
      const text = await res.text();
      const type = res.headers.get("content-type") ?? "";
      if (type.includes("json")) {
        let payload = null;
        try { payload = JSON.parse(text); } catch { payload = null; }
        data = typeof payload?.content === "string"
          ? Buffer.from(payload.content, "base64").toString("utf8")
          : null;
      } else {
        data = text;
      }
    } else {
      data = await res.json();
    }
  } catch (error) {
    if (signalAborted(error)) {
      throw new Error(`timed out after ${timeoutMs}ms reading the body of ${url} (raise MIMIC_TIMEOUT_MS)`);
    }
    throw new Error(`unreadable response body from ${url}: ${error.message}`);
  }

  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify({ url, fetchedAt: new Date().toISOString(), data }), "utf8");
  return { data, cache: "miss" };
}

async function probeRepo(slug) {
  if (!/^[\w.-]+\/[\w.-]+$/.test(slug)) throw new Error(`not an owner/repo slug: ${slug}`);
  const [owner, name] = slug.split("/");
  const root = `${API}/repos/${owner}/${name}`;

  const meta = (await cached(`repo_${owner}_${name}`, root)).data;
  if (!meta) return { slug, error: "repository not found (or private)" };

  const readmeRaw = (await cached(`readme_${owner}_${name}`, `${root}/readme`, { raw: true })).data;

  // One recursive tree call lists every path, so the manifests that exist can be fetched
  // directly instead of probing for the twelve that usually do not. The blind probe cost
  // up to twelve requests per repository and is what pushed a run into the rate limit.
  const branch = meta.default_branch;
  let entries = [];
  let treeTruncated = false;
  let treeNote = null;

  try {
    const tree = (await cached(`tree_${owner}_${name}_${branch}`, `${root}/git/trees/${encodeURIComponent(branch)}?recursive=1`)).data;
    entries = Array.isArray(tree?.tree) ? tree.tree : [];
    treeTruncated = tree?.truncated === true;
  } catch (error) {
    // The tree is an index, not the answer. Losing it must not lose the metadata and README
    // that already succeeded, so record the reason and degrade to the contents listing.
    treeNote = `recursive tree unavailable: ${error.message}`;
  }

  let rootEntries = [];
  let fileCount = null;
  let present = [];

  if (entries.length > 0 && !treeTruncated) {
    const rootDirs = entries.filter((e) => e.type === "tree" && !e.path.includes("/")).map((e) => `${e.path}/`);
    const rootFiles = entries.filter((e) => e.type === "blob" && !e.path.includes("/")).map((e) => e.path);
    rootEntries = [...rootDirs, ...rootFiles].sort();
    present = MANIFESTS.filter((m) => rootFiles.includes(m));
    fileCount = entries.filter((e) => e.type === "blob").length;
  } else {
    // Very large repositories truncate the tree response; fall back to the contents listing
    // so root entries and manifests stay correct rather than silently empty.
    try {
      const listing = (await cached(`contents_${owner}_${name}`, `${root}/contents/`)).data;
      rootEntries = Array.isArray(listing)
        ? listing.map((e) => `${e.name}${e.type === "dir" ? "/" : ""}`).sort()
        : [];
    } catch (error) {
      treeNote ??= `contents listing unavailable: ${error.message}`;
    }
    present = MANIFESTS.filter((m) => rootEntries.includes(m));
  }

  const manifests = {};
  for (const m of present) {
    const hit = await cached(`file_${owner}_${name}_${m}`, `${root}/contents/${m}`, { raw: true });
    if (hit.data) manifests[m] = String(hit.data).slice(0, 2000);
  }

  return {
    slug,
    fullName: meta.full_name,
    url: meta.html_url,
    description: meta.description,
    stars: meta.stargazers_count,
    forks: meta.forks_count,
    language: meta.language,
    topics: meta.topics ?? [],
    license: meta.license?.spdx_id ?? null,
    archived: meta.archived,
    pushedAt: meta.pushed_at,
    createdAt: meta.created_at,
    openIssues: meta.open_issues_count,
    defaultBranch: meta.default_branch,
    homepage: meta.homepage || null,
    readme: typeof readmeRaw === "string" ? readmeRaw : null,
    rootEntries,
    fileCount,
    treeTruncated,
    treeNote,
    manifests,
  };
}

function render(repo, maxChars) {
  const L = [];
  L.push(`## ${repo.fullName}  ${repo.url}`);
  L.push(`   ${repo.description ?? "(no description)"}`);
  L.push(`   stars ${repo.stars} | forks ${repo.forks} | language ${repo.language ?? "?"} | licence ${repo.license ?? "NONE — all rights reserved"}`);
  L.push(`   pushed ${repo.pushedAt} | created ${repo.createdAt} | archived ${repo.archived} | open issues ${repo.openIssues}`);
  if (repo.topics.length) L.push(`   topics: ${repo.topics.join(", ")}`);
  L.push(`   root: ${repo.rootEntries.join("  ") || "(empty)"}`);
  if (repo.fileCount !== null && repo.fileCount !== undefined) {
    L.push(`   files tracked: ${repo.fileCount}${repo.treeTruncated ? " (tree truncated)" : ""}`);
  }
  if (repo.treeNote) L.push(`   partial: ${repo.treeNote}`);

  const names = Object.keys(repo.manifests);
  if (names.length) {
    L.push(`   manifests found: ${names.join(", ")}`);
    for (const [m, body] of Object.entries(repo.manifests)) {
      if (m !== "package.json" && m !== "pyproject.toml" && m !== "go.mod" && m !== "Cargo.toml") continue;
      L.push(`   --- ${m} ---`);
      L.push(body.split("\n").slice(0, 45).map((l) => `   | ${l}`).join("\n"));
    }
  } else {
    L.push("   manifests found: none");
  }

  if (repo.readme) {
    const body = repo.readme.replace(/\r/g, "");
    L.push(`   --- README (${body.length} chars, showing ${Math.min(maxChars, body.length)}) ---`);
    L.push(body.slice(0, maxChars).split("\n").map((l) => `   | ${l}`).join("\n"));
  } else {
    L.push("   --- README: not found ---");
  }
  return L.join("\n");
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.search) {
    const q = encodeURIComponent(`${opts.search}${opts.language ? ` language:${opts.language}` : ""}`);
    const url = `${API}/search/repositories?q=${q}&sort=stars&order=desc&per_page=10`;
    const { data } = await cached(`search_${q}`, url);
    if (!data) { console.error("mimic-probe: search failed"); process.exit(3); }
    const rows = (data.items ?? []).map((r) => ({
      full_name: r.full_name, stars: r.stargazers_count,
      licence: r.license?.spdx_id ?? "NONE", pushed: (r.pushed_at ?? "").slice(0, 10),
      archived: r.archived, description: r.description,
    }));
    if (opts.json) { console.log(JSON.stringify(rows, null, 2)); return; }
    console.log(`Candidates for "${opts.search}" — comparability is yours to judge, popularity is not evidence:\n`);
    for (const r of rows) {
      console.log(`${r.full_name.padEnd(38)} ${String(r.stars).padStart(7)}★  ${r.licence.padEnd(12)} ${r.pushed}${r.archived ? "  ARCHIVED" : ""}`);
      console.log(`  ${r.description ?? ""}`);
    }
    console.log(`\nFilter with reference/selecting-repos.md before reading any of them.`);
    return;
  }

  if (!opts.repos.length) {
    console.error("usage: node mimic-probe.mjs [--json] [--max-chars N] <owner/repo> [...]");
    console.error("       node mimic-probe.mjs --search \"<query>\" [--language <lang>]");
    process.exit(2);
  }

  const results = [];
  for (const slug of opts.repos) {
    try {
      results.push(await probeRepo(slug));
    } catch (error) {
      console.error(`mimic-probe: ${slug}: ${error.message}`);
      process.exitCode = 3;
    }
  }

  // A repository that resolves to "not found" returns rather than throws, so it has to be
  // counted here too. Exiting 0 after a failed lookup would report a partial run as clean.
  if (results.some((r) => r.error)) process.exitCode = 3;
  else if (results.some((r) => r.treeNote)) process.exitCode = 4;

  if (opts.json) { console.log(JSON.stringify(results, null, 2)); return; }

  const parts = results.map((r) => r.error ? `## ${r.slug}\n   ERROR: ${r.error}` : render(r, opts.maxChars));
  console.log(parts.join("\n\n"));
  console.log(`\nFetched ${new Date().toISOString()} — record this timestamp as your evidence date.`);
  console.log(`Cache: ${CACHE_DIR}/ (24h TTL). Unauthenticated requests are rate limited; set GITHUB_TOKEN.`);
}

main().catch((error) => {
  console.error(`mimic-probe: ${error.message}`);
  process.exit(1);
});
