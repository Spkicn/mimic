#!/usr/bin/env node
/**
 * mimic-probe — fetch what a repository actually says, so the skill never has to guess.
 *
 * Fetches, per repository: metadata (stars, licence, archived, last push, commit SHA),
 * README, root tree, dependency manifests, and any extra files requested with --paths.
 * Caches successful responses under .mimic-cache/ and prints bounded output. Cache writes
 * are best-effort: a read-only checkout never turns a good fetch into a failed run.
 * No dependencies, Node 18+.
 *
 *   node mimic-probe.mjs vercel/next.js sindresorhus/got
 *   node mimic-probe.mjs --search "rate limiter" --language python
 *   node mimic-probe.mjs --search "motion" --topic remotion
 *   node mimic-probe.mjs --json owner/repo
 *   node mimic-probe.mjs owner/repo --max-chars 4000
 *   node mimic-probe.mjs owner/repo --paths CONTRIBUTING.md,.github/PULL_REQUEST_TEMPLATE.md
 *
 * Env:
 *   GITHUB_TOKEN   raises the API rate limit. When it is unset the script falls back to
 *                  `gh auth token`; an invalid token is retried unauthenticated once instead
 *                  of failing every request.
 *   MIMIC_CACHE    cache directory (default: ./.mimic-cache)
 *   MIMIC_TIMEOUT_MS  per-request timeout (default: 30000)
 *   MIMIC_API      API base (default: https://api.github.com; used by the test suite)
 *
 * Exit codes: 0 clean, 2 usage error, 3 a repository failed, 4 completed with degraded data
 * (README, tree, manifest, commit, or an extra file could not be fetched; everything else is
 * still shown). Never 0 after a failed lookup.
 */

import { mkdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";

const CACHE_DIR = process.env.MIMIC_CACHE || ".mimic-cache";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FETCH_TIMEOUT_MS = Number(process.env.MIMIC_TIMEOUT_MS) || 30000;
const API = (process.env.MIMIC_API || "https://api.github.com").replace(/\/+$/, "");
const MANIFEST_MAX_CHARS = 2000;

const MANIFESTS = [
  "package.json", "pyproject.toml", "requirements.txt", "go.mod", "Cargo.toml",
  "Gemfile", "composer.json", "pom.xml", "build.gradle", "build.gradle.kts",
  "Dockerfile", "Makefile", "tsconfig.json",
];

const USAGE = `usage: node mimic-probe.mjs [options] <owner/repo> [...]

  --json                 machine-readable output (README clipped to --max-chars)
  --max-chars N          README characters to print (default 1200, must be > 0)
  --paths A,B            extra repository files to fetch (CONTRIBUTING.md, .github/...);
                         at most 8, each clipped to --max-chars
  --no-cache             bypass both cache reads and writes for this run
  --search "<query>"     list comparable repositories instead of probing one
  --language <lang>      with --search: restrict to a language
  --topic <topic>        with --search: restrict to a GitHub topic
  -h, --help             show this message

exit codes: 0 clean, 2 usage error, 3 failed, 4 degraded (partial evidence)`;

function fail(message) {
  console.error(`mimic-probe: ${message}`);
  process.exit(2);
}

function positiveInt(raw, flag) {
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) fail(`${flag} expects a positive integer, got "${raw}"`);
  return value;
}

function parsePaths(raw) {
  const paths = String(raw).split(",").map((p) => p.trim()).filter(Boolean);
  if (paths.length > 8) fail("--paths accepts at most 8 files");
  for (const p of paths) {
    if (p.startsWith("/") || p.includes("..") || p.includes("\\")) fail(`invalid --paths entry "${p}"`);
  }
  return paths;
}

function parseArgs(argv) {
  const opts = {
    repos: [], search: null, language: null, topic: null, json: false,
    maxChars: 1200, paths: [], noCache: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--json") opts.json = true;
    else if (a === "--no-cache") opts.noCache = true;
    else if (a === "-h" || a === "--help") { console.log(USAGE); process.exit(0); }
    else if (a === "--search" || a === "--language" || a === "--topic" || a === "--max-chars" || a === "--paths") {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) fail(`${a} requires a value`);
      i += 1;
      if (a === "--search") opts.search = value;
      else if (a === "--language") opts.language = value;
      else if (a === "--topic") opts.topic = value;
      else if (a === "--paths") opts.paths = parsePaths(value);
      else opts.maxChars = positiveInt(value, a);
    } else if (a.startsWith("--")) {
      fail(`unknown option ${a}`);
    } else {
      opts.repos.push(a);
    }
  }
  if (opts.search && opts.repos.length) fail("--search and <owner/repo> cannot be combined");
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

function headers(accept = "application/vnd.github+json", withToken = true) {
  const h = { "User-Agent": "mimic-skill", Accept: accept, "X-GitHub-Api-Version": "2022-11-28" };
  const token = withToken ? githubToken() : null;
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

async function fetchOnce(url, accept, withToken, timeoutMs) {
  let res;
  try {
    res = await fetch(url, {
      headers: headers(accept, withToken),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    if (signalAborted(error)) {
      throw new Error(`timed out after ${timeoutMs}ms fetching ${url} (raise MIMIC_TIMEOUT_MS)`);
    }
    throw new Error(`network unreachable for ${url}: ${error.message}`);
  }
  return res;
}

async function readBody(res, url, raw, timeoutMs) {
  // Reading the body belongs inside the timeout guard too: fetch resolves once the headers
  // arrive, so a large response can still be streaming when the signal fires, and an
  // unguarded res.text() then throws an unwrapped abort instead of a usable message.
  try {
    if (raw) {
      const text = await res.text();
      const type = res.headers.get("content-type") ?? "";
      if (type.includes("json")) {
        let payload = null;
        try { payload = JSON.parse(text); } catch { payload = null; }
        return typeof payload?.content === "string"
          ? Buffer.from(payload.content, "base64").toString("utf8")
          : null;
      }
      return text;
    }
    return await res.json();
  } catch (error) {
    if (signalAborted(error)) {
      throw new Error(`timed out after ${timeoutMs}ms reading the body of ${url} (raise MIMIC_TIMEOUT_MS)`);
    }
    throw new Error(`unreadable response body from ${url}: ${error.message}`);
  }
}

/**
 * Fetch one URL through the cache.
 *
 * 404 is the only status that means "this resource does not exist"; every other non-OK
 * status throws, so a 5xx or a rejected token can never be mistaken for a missing README.
 * A 401 with a token configured is retried once without credentials, which makes a stale
 * `gh auth token` harmless for public repositories.
 *
 * Cache writes are best-effort. A read-only checkout is a normal working state, not a
 * reason to discard a successful fetch.
 *
 * @returns {{data: any, status: number, cache: "hit"|"miss"|"404", fetchedAt: string}}
 */
async function cached(key, url, { raw = false, timeoutMs = FETCH_TIMEOUT_MS, bypass = false } = {}) {
  const file = join(CACHE_DIR, key.replace(/[^a-zA-Z0-9._-]/g, "_") + ".json");

  if (!bypass) {
    try {
      const info = await stat(file);
      if (Date.now() - info.mtimeMs < CACHE_TTL_MS) {
        const hit = JSON.parse(await readFile(file, "utf8"));
        if (hit.url === url) {
          return { data: hit.data, status: 200, cache: "hit", fetchedAt: hit.fetchedAt };
        }
      }
    } catch { /* cache miss */ }
  }

  let res = await fetchOnce(url, raw ? "application/vnd.github.raw" : undefined, true, timeoutMs);
  if (res.status === 401 && githubToken()) {
    res = await fetchOnce(url, raw ? "application/vnd.github.raw" : undefined, false, timeoutMs);
    if (res.status === 401) {
      throw new Error(`HTTP 401 from GitHub: the configured GITHUB_TOKEN / gh token was rejected. Run \`gh auth login\` or unset the token. (${url})`);
    }
  }

  if (res.status === 404) return { data: null, status: 404, cache: "404", fetchedAt: null };
  if (res.status === 401) {
    throw new Error(`HTTP 401 from GitHub: authentication rejected. Set GITHUB_TOKEN or run \`gh auth login\`. (${url})`);
  }
  if (res.status === 403 || res.status === 429) {
    const retryAfter = res.headers.get("retry-after");
    const hint = retryAfter ? ` Retry after ${retryAfter}s.` : "";
    throw new Error(`rate limited by GitHub (HTTP ${res.status}) on ${url}. Set GITHUB_TOKEN.${hint}`);
  }
  if (!res.ok) {
    throw new Error(`GitHub API HTTP ${res.status} on ${url}`);
  }

  const data = await readBody(res, url, raw, timeoutMs);
  const fetchedAt = new Date().toISOString();

  if (!bypass) {
    try {
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, JSON.stringify({ url, fetchedAt, data }), "utf8");
    } catch { /* cache is an optimization; never fail a good fetch because of it */ }
  }
  return { data, status: 200, cache: "miss", fetchedAt };
}

function parseSlug(slug) {
  const match = /^([A-Za-z0-9_.-]+)\/([A-Za-z0-9_.-]+)$/.exec(slug);
  if (!match) throw new Error(`not an owner/repo slug: ${slug}`);
  const [, owner, name] = match;
  if (owner === "." || owner === ".." || name === "." || name === "..") {
    throw new Error(`not an owner/repo slug: ${slug}`);
  }
  return { owner, name };
}

async function probeRepo(slug, opts) {
  const { owner, name } = parseSlug(slug);
  const root = `${API}/repos/${owner}/${name}`;
  const notes = [];

  const metaHit = await cached(`repo_${owner}_${name}`, root, { bypass: opts.noCache });
  const meta = metaHit.data;
  if (!meta) return { slug, error: "repository not found (or private; HTTP 404)" };

  let commit = null;
  try {
    const branch = meta.default_branch;
    const commitHit = await cached(`commit_${owner}_${name}_${branch}`, `${root}/commits/${encodeURIComponent(branch)}`, { bypass: opts.noCache });
    commit = commitHit.data?.sha ?? null;
    if (!commit) notes.push("commit SHA unavailable");
  } catch (error) {
    notes.push(`commit SHA unavailable: ${error.message}`);
  }

  let readme = null;
  try {
    const readmeHit = await cached(`readme_${owner}_${name}`, `${root}/readme`, { raw: true, bypass: opts.noCache });
    readme = typeof readmeHit.data === "string" ? readmeHit.data : null;
  } catch (error) {
    notes.push(`README unavailable: ${error.message}`);
  }

  const branch = meta.default_branch;
  let entries = [];
  let treeTruncated = false;

  try {
    const treeHit = await cached(`tree_${owner}_${name}_${branch}`, `${root}/git/trees/${encodeURIComponent(branch)}?recursive=1`, { bypass: opts.noCache });
    entries = Array.isArray(treeHit.data?.tree) ? treeHit.data.tree : [];
    treeTruncated = treeHit.data?.truncated === true;
  } catch (error) {
    notes.push(`recursive tree unavailable: ${error.message}`);
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
      const listingHit = await cached(`contents_${owner}_${name}`, `${root}/contents/`, { bypass: opts.noCache });
      rootEntries = Array.isArray(listingHit.data)
        ? listingHit.data.map((e) => `${e.name}${e.type === "dir" ? "/" : ""}`).sort()
        : [];
    } catch (error) {
      notes.push(`contents listing unavailable: ${error.message}`);
    }
    present = MANIFESTS.filter((m) => rootEntries.includes(m));
    if (treeTruncated) notes.push("recursive tree truncated; root listing from contents");
  }

  const manifests = {};
  const manifestNotes = {};
  for (const m of present) {
    try {
      const hit = await cached(`file_${owner}_${name}_${m}`, `${root}/contents/${m}`, { raw: true, bypass: opts.noCache });
      if (hit.data !== null) manifests[m] = String(hit.data);
    } catch (error) {
      manifestNotes[m] = error.message;
      notes.push(`manifest ${m} unavailable: ${error.message}`);
    }
  }

  const files = {};
  const fileNotes = {};
  for (const path of opts.paths) {
    try {
      const hit = await cached(`path_${owner}_${name}_${path.replace(/[^a-zA-Z0-9._-]/g, "_")}`, `${root}/contents/${encodeURI(path)}`, { raw: true, bypass: opts.noCache });
      if (hit.data !== null) files[path] = String(hit.data);
      else fileNotes[path] = "not found";
    } catch (error) {
      fileNotes[path] = error.message;
      notes.push(`file ${path} unavailable: ${error.message}`);
    }
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
    commit,
    fetchedAt: metaHit.fetchedAt,
    cache: metaHit.cache,
    readme,
    rootEntries,
    fileCount,
    treeTruncated,
    manifests,
    manifestNotes,
    files,
    fileNotes,
    notes,
  };
}

function clip(text, maxChars) {
  const body = String(text).replace(/\r/g, "");
  return {
    body: body.slice(0, maxChars),
    total: body.length,
    truncated: body.length > maxChars,
  };
}

function renderFileBlock(label, raw, maxChars) {
  const { body, total, truncated } = clip(raw, maxChars);
  const marker = truncated ? ` (showing ${maxChars} of ${total} chars)` : ` (${total} chars)`;
  return `   --- ${label}${marker} ---\n${body.split("\n").map((l) => `   | ${l}`).join("\n")}`;
}

function render(repo, maxChars) {
  const L = [];
  L.push(`## ${repo.fullName}  ${repo.url}`);
  L.push(`   ${repo.description ?? "(no description)"}`);
  L.push(`   stars ${repo.stars} | forks ${repo.forks} | language ${repo.language ?? "?"} | licence ${repo.license ?? "NONE — all rights reserved"}`);
  L.push(`   pushed ${repo.pushedAt} | created ${repo.createdAt} | archived ${repo.archived} | open issues+PRs ${repo.openIssues}`);
  L.push(`   commit ${repo.commit ?? "(unavailable)"} | fetched ${repo.fetchedAt ?? "(unknown)"} (cache ${repo.cache})`);
  if (repo.topics.length) L.push(`   topics: ${repo.topics.join(", ")}`);
  L.push(`   root: ${repo.rootEntries.join("  ") || "(empty)"}`);
  if (repo.fileCount !== null && repo.fileCount !== undefined) {
    L.push(`   files tracked: ${repo.fileCount}`);
  } else {
    L.push("   files tracked: (unknown)");
  }
  for (const note of repo.notes) L.push(`   partial: ${note}`);

  const names = Object.keys(repo.manifests);
  L.push(`   manifests found: ${names.length ? names.join(", ") : "none"}`);
  for (const [m, body] of Object.entries(repo.manifests)) {
    L.push(renderFileBlock(m, body, MANIFEST_MAX_CHARS));
  }
  for (const [path, body] of Object.entries(repo.files)) {
    L.push(renderFileBlock(path, body, maxChars));
  }
  for (const [path, note] of Object.entries(repo.fileNotes)) {
    L.push(`   --- ${path}: ${note} ---`);
  }

  if (repo.readme) {
    L.push(renderFileBlock("README", repo.readme, maxChars));
  } else {
    const note = repo.notes.find((n) => n.startsWith("README unavailable"));
    L.push(`   --- README: ${note ? note.replace("README unavailable: ", "unavailable — ") : "not found"} ---`);
  }
  return L.join("\n");
}

async function searchRepos(opts) {
  let q = opts.search;
  if (opts.language) q += ` language:${opts.language}`;
  if (opts.topic) q += ` topic:${opts.topic}`;
  const url = `${API}/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=10`;
  const { data, fetchedAt, cache } = await cached(`search_${q}`, url, { bypass: opts.noCache });
  if (!data) throw new Error("search returned no data");
  const rows = (data.items ?? []).map((r) => ({
    full_name: r.full_name, stars: r.stargazers_count,
    licence: r.license?.spdx_id ?? "NONE", pushed: (r.pushed_at ?? "").slice(0, 10),
    archived: r.archived, description: r.description,
  }));
  if (opts.json) {
    console.log(JSON.stringify({ fetchedAt, cache, incomplete: data.incomplete_results === true, rows }, null, 2));
    return;
  }
  console.log(`Candidates for "${opts.search}" — comparability is yours to judge, popularity is not evidence:\n`);
  for (const r of rows) {
    console.log(`${r.full_name.padEnd(38)} ${String(r.stars).padStart(7)}★  ${r.licence.padEnd(12)} ${r.pushed}${r.archived ? "  ARCHIVED" : ""}`);
    console.log(`  ${r.description ?? ""}`);
  }
  if (data.incomplete_results === true) console.log("\nWarning: GitHub marked this search as incomplete.");
  console.log(`\nFetched ${fetchedAt} (cache ${cache}) — record this timestamp as your evidence date.`);
  console.log(`Filter with reference/selecting-repos.md before reading any of them.`);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.search) {
    await searchRepos(opts);
    return;
  }

  if (!opts.repos.length) fail("no repositories given\n" + USAGE);
  for (const slug of opts.repos) {
    try {
      parseSlug(slug);
    } catch (error) {
      fail(error.message);
    }
  }

  const results = [];
  let failed = false;
  let degraded = false;
  for (const slug of opts.repos) {
    try {
      const repo = await probeRepo(slug, opts);
      results.push(repo);
      if (repo.error) failed = true;
      else if (repo.notes.length) degraded = true;
    } catch (error) {
      console.error(`mimic-probe: ${slug}: ${error.message}`);
      results.push({ slug, error: error.message });
      failed = true;
    }
  }

  if (failed) process.exitCode = 3;
  else if (degraded) process.exitCode = 4;

  if (opts.json) {
    const bounded = results.map((r) => {
      if (r.error) return r;
      const readmeLength = r.readme ? r.readme.length : 0;
      return {
        ...r,
        readme: r.readme ? r.readme.slice(0, opts.maxChars) : null,
        readmeLength,
        readmeTruncated: readmeLength > opts.maxChars,
      };
    });
    console.log(JSON.stringify(bounded, null, 2));
    return;
  }

  const parts = results.map((r) => r.error ? `## ${r.slug}\n   ERROR: ${r.error}` : render(r, opts.maxChars));
  console.log(parts.join("\n\n"));

  const stamps = [...new Set(results.filter((r) => r.fetchedAt).map((r) => `${r.fetchedAt} (cache ${r.cache})`))];
  console.log(`\nFetched ${stamps.length ? stamps.join("; ") : new Date().toISOString()} — record this timestamp as your evidence date.`);
  console.log(`Cache: ${CACHE_DIR}/ (24h TTL). Unauthenticated requests are rate limited; set GITHUB_TOKEN.`);
}

main().catch((error) => {
  console.error(`mimic-probe: ${error.message}`);
  process.exit(3);
});
