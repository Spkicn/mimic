#!/usr/bin/env node
/**
 * Repo self-check. Run with `node scripts/validate.mjs` from the repository root, or pass a
 * path to validate a fixture tree: `node scripts/validate.mjs <root>`.
 *
 * Enforces this repository's own conventions:
 *   - every skills * /SKILL.md has valid frontmatter (name, description, no legacy keys)
 *   - the skill directory name matches the frontmatter name
 *   - `description` is a single-line scalar within the host's portable length limits
 *   - SKILL.md stays within the 25-150 line band (detail belongs in reference/)
 *   - every relative markdown link resolves
 *   - every reference file is routed to from SKILL.md, and every route exists
 *   - README.md and README.zh.md exist together and agree on structure
 *   - the plugin manifest parses and its skill paths resolve
 *
 * No dependencies. Exits non-zero on the first category of failure found.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

// An explicit root makes the validator testable against fixtures; the default is this
// repository, which is what CI and the AGENTS.md gate use.
const ROOT = process.argv[2]
  ? resolve(process.argv[2])
  : resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SKILL_NAME = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Both limits come from the Agent Skills specification (name <= 64 chars, description
// <= 1024 chars). This repository's own stricter rules sit on top; these are the portable
// floor that a host parser may enforce silently.
const SKILL_NAME_MAX = 64;
const DESCRIPTION_MAX = 1024;
const LEGACY_KEYS = ["userInvocable", "modelInvocable", "disableModelInvocation"];
const SKILL_LINE_FLOOR = 25;
const SKILL_LINE_BUDGET = 150;
const EVAL_MIN_TRIGGERS = 8;
const EVAL_MIN_NEGATIVES = 8;
const SKIP_DIRS = new Set([".git", ".mimic-cache", "node_modules"]);

let failures = 0;
const fail = (msg) => { failures++; console.error(`FAIL  ${msg}`); };
const ok = (msg) => console.log(`ok    ${msg}`);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) walk(path, out);
    else out.push(path);
  }
  return out;
}

const files = walk(ROOT);
const skillFiles = files.filter((p) => p.endsWith("SKILL.md"));

if (skillFiles.length === 0) fail("no SKILL.md found");

for (const file of skillFiles) {
  const rel = relative(ROOT, file).replace(/\\/g, "/");
  const raw = readFileSync(file, "utf8");
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) { fail(`${rel}: missing YAML frontmatter`); continue; }

  const frontmatter = match[1];
  const frontmatterLines = frontmatter.split(/\r?\n/);
  const name = frontmatter.match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = frontmatter.match(/^description:\s*(.+)$/m)?.[1]?.trim();

  if (!name) fail(`${rel}: frontmatter requires name`);
  else if (!SKILL_NAME.test(name)) fail(`${rel}: name "${name}" is not kebab-case`);
  else if (name.length > SKILL_NAME_MAX) fail(`${rel}: name is ${name.length} chars, over the ${SKILL_NAME_MAX}-char host limit`);
  else if (dirname(rel).split("/").pop() !== name) fail(`${rel}: directory does not match name "${name}"`);
  else ok(`${rel}: name=${name}`);

  // A block scalar or a wrapped plain scalar is the quietest way a skill stops
  // registering on some hosts. Keep `description` to one line and check it here,
  // because a rule no tool enforces decays.
  const descriptionIndex = frontmatterLines.findIndex((line) => /^description\s*:/.test(line));
  if (descriptionIndex === -1) {
    fail(`${rel}: frontmatter requires description`);
  } else {
    const value = frontmatterLines[descriptionIndex].replace(/^description\s*:\s*/, "").trim();
    const nextLine = frontmatterLines[descriptionIndex + 1] ?? "";
    if (/^[|>]/.test(value) || value.length === 0) {
      fail(`${rel}: description is empty or a block scalar ("${value}"); use a single-line scalar`);
    } else if (/^\s+\S/.test(nextLine)) {
      fail(`${rel}: description wraps onto a second line; keep it on one line for cross-host portability`);
    } else if (description.length < 60) {
      fail(`${rel}: description too short (${description.length} chars) to route reliably`);
    } else if (description.length > DESCRIPTION_MAX) {
      fail(`${rel}: description is ${description.length} chars, over the ${DESCRIPTION_MAX}-char host limit`);
    } else {
      ok(`${rel}: description ${description.length} chars, single line`);
    }
  }

  for (const legacy of LEGACY_KEYS) {
    if (new RegExp(`^${legacy}\\s*:`, "m").test(frontmatter)) {
      fail(`${rel}: "${legacy}" is unsupported; use kebab-case or the skill is silently ignored`);
    }
  }

  const lines = raw.split("\n").length;
  if (lines > SKILL_LINE_BUDGET) fail(`${rel}: ${lines} lines exceeds the ${SKILL_LINE_BUDGET}-line budget; move detail to reference/`);
  else if (lines < SKILL_LINE_FLOOR) fail(`${rel}: ${lines} lines is below the ${SKILL_LINE_FLOOR}-line floor; a body this thin routes but does not instruct`);
  else ok(`${rel}: ${lines} lines (floor ${SKILL_LINE_FLOOR}, budget ${SKILL_LINE_BUDGET})`);

  // Routing coherence: SKILL.md and its sibling reference/ must agree.
  const referenceDir = join(dirname(file), "reference");
  if (existsSync(referenceDir)) {
    const onDisk = readdirSync(referenceDir).filter((n) => n.endsWith(".md"));
    for (const ref of onDisk) {
      if (!raw.includes(`reference/${ref}`)) fail(`${rel}: reference/${ref} exists but is never routed to`);
    }
    for (const route of raw.matchAll(/reference\/([\w.-]+\.md)/g)) {
      if (!existsSync(join(referenceDir, route[1]))) fail(`${rel}: routes to missing reference/${route[1]}`);
    }
    ok(`${rel}: ${onDisk.length} reference file(s) routed`);
  }

  // Tier 2 cases are part of the skill, not an optional extra: the description is the
  // router, and a router nobody has written prompts for has never been tested. Adopted from
  // Paldom/github-skills and addyosmani/agent-skills, which both ship evals per skill.
  const evalPath = join(dirname(file), "evals", "evals.json");
  if (!existsSync(evalPath)) {
    fail(`${rel}: no evals/evals.json — the description is the router and it is untested`);
  } else {
    let parsed = null;
    try {
      parsed = JSON.parse(readFileSync(evalPath, "utf8"));
    } catch (error) {
      fail(`${rel}: evals/evals.json is not valid JSON: ${error.message}`);
    }
    if (parsed) {
      const cases = Array.isArray(parsed.cases) ? parsed.cases : [];
      const count = (type) => cases.filter((c) => c?.type === type).length;
      const triggers = count("should_trigger");
      const negatives = count("should_not_trigger");
      const quality = count("quality");
      if (triggers < EVAL_MIN_TRIGGERS) fail(`${rel}: ${triggers} should_trigger cases, ${EVAL_MIN_TRIGGERS} required`);
      if (negatives < EVAL_MIN_NEGATIVES) fail(`${rel}: ${negatives} should_not_trigger cases, ${EVAL_MIN_NEGATIVES} required`);
      if (quality < 1) fail(`${rel}: no quality cases`);
      if (triggers >= EVAL_MIN_TRIGGERS && negatives >= EVAL_MIN_NEGATIVES && quality >= 1) {
        ok(`${rel}: evals — ${triggers} trigger, ${negatives} negative, ${quality} quality`);
      }
    }
  }
}

let linkCount = 0;
for (const file of files.filter((p) => p.endsWith(".md"))) {
  const raw = readFileSync(file, "utf8");
  for (const match of raw.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].trim();
    if (/^(https?:|mailto:|#)/.test(target)) continue;
    linkCount++;
    const target_path = resolve(dirname(file), target.split("#")[0]);
    if (!existsSync(target_path)) fail(`${relative(ROOT, file)}: broken link -> ${target}`);
  }
}
ok(`${linkCount} relative link(s) resolve`);

// README.md and README.zh.md are translations of each other. Prose cannot be compared
// mechanically, but structure can: the heading outline, the number of fenced code blocks,
// and the number of table rows drift as soon as one file is updated and the other is not.
// A repository that ships neither file is not using this convention and is skipped.
const readmePaths = [join(ROOT, "README.md"), join(ROOT, "README.zh.md")];
const readmePresent = readmePaths.filter((path) => existsSync(path));
if (readmePresent.length > 0) {
  if (readmePresent.length === 1) {
    fail(`${relative(ROOT, readmePresent[0])}: README.md and README.zh.md must ship together`);
  } else {
    const shape = (raw) => {
      const headings = [];
      let fences = 0;
      let tableRows = 0;
      let inFence = false;
      for (const line of raw.split(/\r?\n/)) {
        if (/^```/.test(line)) {
          fences += 1;
          inFence = !inFence;
          continue;
        }
        if (inFence) continue;
        if (/^#{1,6}\s/.test(line)) headings.push(line.match(/^(#{1,6})/)[1].length);
        else if (/^\|/.test(line)) tableRows += 1;
      }
      return { headings, fences, tableRows };
    };
    const en = shape(readFileSync(readmePaths[0], "utf8"));
    const zh = shape(readFileSync(readmePaths[1], "utf8"));
    const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    if (!same(en.headings, zh.headings)) {
      fail(`README.md and README.zh.md heading outlines differ (${en.headings.length} vs ${zh.headings.length} headings); keep the two files in sync`);
    } else if (en.fences !== zh.fences || en.tableRows !== zh.tableRows) {
      fail(`README.md and README.zh.md structure differs (fences ${en.fences} vs ${zh.fences}, table rows ${en.tableRows} vs ${zh.tableRows}); keep the two files in sync`);
    } else {
      ok(`README.md and README.zh.md agree on structure (${en.headings.length} headings, ${en.fences} fences, ${en.tableRows} table rows)`);
    }
  }
}

// The marketplace version and every declared skill's `metadata.version` are two copies of
// one fact, edited by hand in two files. They drift the first time someone bumps one and
// forgets the other, and a host that shows the plugin version then disagrees with the skill
// it loads. Comparable repositories keep these in sync with a script; a validator rule is
// the same check without the extra toolchain.
const manifestPath = join(ROOT, ".claude-plugin", "marketplace.json");
try {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const manifestVersion = typeof manifest.metadata?.version === "string" ? manifest.metadata.version : null;
  let declared = 0;
  let versionChecked = 0;
  for (const plugin of manifest.plugins ?? []) {
    for (const skillPath of plugin.skills ?? []) {
      declared++;
      const skillFile = join(ROOT, skillPath, "SKILL.md");
      if (!existsSync(skillFile)) {
        fail(`marketplace.json: skill path missing: ${skillPath}`);
        continue;
      }
      if (!manifestVersion) continue;
      const frontmatter = readFileSync(skillFile, "utf8").match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)?.[1] ?? "";
      const skillVersion = frontmatter.match(/^\s+version:\s*["']?([^"'\s]+)/m)?.[1] ?? null;
      if (!skillVersion) {
        fail(`marketplace.json: ${skillPath} declares no metadata.version; the shared version cannot be kept in sync`);
      } else if (skillVersion !== manifestVersion) {
        fail(`marketplace.json: version ${manifestVersion} but ${skillPath} is ${skillVersion}; bump both together`);
      } else {
        versionChecked++;
      }
    }
  }
  if (manifestVersion) ok(`marketplace.json version ${manifestVersion} matches ${versionChecked} declared skill(s)`);
  ok(`marketplace.json parses, ${declared} skill path(s) declared`);
} catch (error) {
  fail(`marketplace.json: ${error.message}`);
}

console.log("");
if (failures > 0) {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}
console.log("all checks passed");
