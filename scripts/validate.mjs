#!/usr/bin/env node
/**
 * Repo self-check. Run with `node scripts/validate.mjs` from the repository root, or pass a
 * path to validate a fixture tree: `node scripts/validate.mjs <root>`.
 *
 * Enforces this repository's own conventions:
 *   - every skills * /SKILL.md has valid frontmatter (name, description, no legacy keys)
 *   - the skill directory name matches the frontmatter name
 *   - `description` is a single-line scalar of usable length
 *   - SKILL.md stays within the 25-150 line band (detail belongs in reference/)
 *   - every relative markdown link resolves
 *   - every reference file is routed to from SKILL.md, and every route exists
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
const LEGACY_KEYS = ["userInvocable", "modelInvocable", "disableModelInvocation"];
const SKILL_LINE_FLOOR = 25;
const SKILL_LINE_BUDGET = 150;
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

const manifestPath = join(ROOT, ".claude-plugin", "marketplace.json");
try {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  let declared = 0;
  for (const plugin of manifest.plugins ?? []) {
    for (const skillPath of plugin.skills ?? []) {
      declared++;
      if (!existsSync(join(ROOT, skillPath, "SKILL.md"))) fail(`marketplace.json: skill path missing: ${skillPath}`);
    }
  }
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
