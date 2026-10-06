#!/usr/bin/env node
/**
 * Tier 2 — trigger and routing checks. Deterministic, no model call, no dependencies.
 *
 * Tier 1 (`validate.mjs`) checks that a skill is well formed. It cannot check the thing
 * that decides whether a skill ever runs: the description, which is the router. This is the
 * missing tier, and it exists because every gate in this skill was previously graded by the
 * same agent that did the work.
 *
 * Adopted from two comparable catalogs, both MIT:
 *   - Paldom/github-skills docs/evals.md — "Skills are software: prompts are inputs, agent
 *     behavior is output, the description is the routing layer. Test all three."
 *   - addyosmani/agent-skills evals/README.md — the three tiers, and the observation that
 *     neither Anthropic's skill-creator nor obra/superpowers ships a deterministic,
 *     CI-safe catalog check. This is that check.
 *
 * Deliberately a LEXICAL proxy, and it says so: it catches the two failure modes that
 * dominate real trigger bugs — a description missing the vocabulary users actually say, and
 * an over-broad description that outranks the right skill. A failure here usually means fix
 * the description, not the eval.
 *
 * Usage:
 *   node scripts/eval-routing.mjs [--catalog <dir>] [--min-rank1 <pct>] [--json]
 *
 * The catalog is every skill whose description competes for routing. It defaults to this
 * repository's own `skills/`, which holds one skill; point it at a host skills directory to
 * test against real siblings.
 */
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i === -1 ? fallback : args[i + 1];
};
const CATALOG = resolve(option("--catalog", join(ROOT, "skills")));
const MIN_RANK1 = Number(option("--min-rank1", "80"));
const AS_JSON = args.includes("--json");
const EXPLAIN = args.includes("--explain");

const COLLISION_FAIL = 0.75;
const COLLISION_WARN = 0.5;

/**
 * Below this best-catalog score, no skill is a meaningful match and the ranking between
 * near-zero scores is noise.
 *
 * Placed from measurement, not from taste. Against the three-skill catalog on this machine
 * (impeccable / mimic / remotion-video), scored with this script:
 *
 *   weakest genuine trigger prompt  0.075   (我要给这个项目加个重试机制…)
 *   "implement a bubble sort…"      0.053   no skill should fire
 *   "there is a typo on line 42"    0.048   no skill should fire
 *   "design a nicer landing page"   0.140   routes to impeccable — a real sibling
 *   "make a 30-second promo video"  0.220   routes to remotion-video — a real sibling
 *
 * 0.06 separates the noise from the real matches. Re-measure with --explain before moving it.
 */
const NO_MATCH_FLOOR = Number(option("--no-match-floor", "0.06"));

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "for", "to", "of", "in", "on", "is", "are", "be", "it",
  "this", "that", "with", "as", "at", "by", "from", "we", "our", "you", "your", "how",
  "what", "when", "use", "using", "should", "do", "does", "can", "not", "no", "than",
]);

/**
 * Latin words (crudely stemmed) plus CJK bigrams.
 *
 * Chinese has no spaces, so a whitespace tokenizer turns a whole phrase into one token and
 * nothing ever matches. Character bigrams are the standard cheap fix and are what let a
 * prompt like "参考同类开源项目" find the same phrase in a description.
 */
function tokenize(text) {
  const lower = text.toLowerCase();
  const tokens = [];

  for (const match of lower.matchAll(/[a-z0-9][a-z0-9+.#_-]*/g)) {
    let word = match[0];
    if (word.length > 4) word = word.replace(/(ing|ed|es|s)$/, "");
    if (word.length > 1 && !STOPWORDS.has(word)) tokens.push(word);
  }

  for (const run of lower.match(/[\u4e00-\u9fff]+/g) ?? []) {
    if (run.length === 1) tokens.push(run);
    for (let i = 0; i + 1 < run.length; i += 1) tokens.push(run.slice(i, i + 2));
  }

  return tokens;
}

function termCounts(tokens) {
  const counts = new Map();
  for (const token of tokens) counts.set(token, (counts.get(token) ?? 0) + 1);
  return counts;
}

/** Smoothed TF-IDF, L2-normalised so cosine is a plain dot product. */
function buildVectors(documents) {
  const counts = documents.map((doc) => termCounts(tokenize(doc.text)));
  const df = new Map();
  for (const perDoc of counts) {
    for (const term of perDoc.keys()) df.set(term, (df.get(term) ?? 0) + 1);
  }

  const n = documents.length;
  return counts.map((perDoc) => {
    const vector = new Map();
    let norm = 0;
    for (const [term, count] of perDoc) {
      const idf = Math.log((1 + n) / (1 + (df.get(term) ?? 0))) + 1;
      const weight = (1 + Math.log(count)) * idf;
      vector.set(term, weight);
      norm += weight * weight;
    }
    const length = Math.sqrt(norm) || 1;
    for (const [term, weight] of vector) vector.set(term, weight / length);
    return vector;
  });
}

function cosine(a, b) {
  const [small, large] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [term, weight] of small) dot += weight * (large.get(term) ?? 0);
  return dot;
}

function parseFrontmatter(text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/);
  if (!match) return null;
  const name = match[1].match(/^name:\s*(.+)$/m)?.[1]?.trim();
  const description = match[1].match(/^description:\s*(.+)$/m)?.[1]?.trim();
  return name && description ? { name, description } : null;
}

function loadCatalog(dir) {
  if (!existsSync(dir)) {
    console.error(`eval-routing: no catalog at ${dir}`);
    process.exit(2);
  }
  const skills = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (!entry.isDirectory()) continue;
    const skillPath = join(dir, entry.name, "SKILL.md");
    if (!existsSync(skillPath)) continue;
    const meta = parseFrontmatter(readFileSync(skillPath, "utf8"));
    if (!meta) continue;

    const evalPath = join(dir, entry.name, "evals", "evals.json");
    let cases = null;
    if (existsSync(evalPath)) {
      try {
        cases = JSON.parse(readFileSync(evalPath, "utf8")).cases ?? [];
      } catch (error) {
        console.error(`eval-routing: ${entry.name}/evals/evals.json is not valid JSON: ${error.message}`);
        process.exit(2);
      }
    }
    skills.push({ ...meta, dir: entry.name, cases });
  }
  return skills;
}

const skills = loadCatalog(CATALOG);
if (skills.length === 0) {
  console.error(`eval-routing: no SKILL.md found under ${CATALOG}`);
  process.exit(2);
}

const vectors = buildVectors(
  skills.map((skill) => ({ text: `${skill.name} ${skill.description}` })),
);

let failures = 0;
let warnings = 0;
const report = { catalog: CATALOG, skills: skills.map((s) => s.name), checks: [] };

function record(ok, level, message) {
  report.checks.push({ level, ok, message });
  if (!ok) {
    if (level === "warn") warnings += 1;
    else failures += 1;
  }
}

// --- collision between descriptions in the catalog --------------------------------
for (let i = 0; i < skills.length; i += 1) {
  for (let j = i + 1; j < skills.length; j += 1) {
    const similarity = cosine(vectors[i], vectors[j]);
    const pair = `${skills[i].name} vs ${skills[j].name}`;
    if (similarity >= COLLISION_FAIL) {
      record(false, "fail", `routing collision: ${pair} cosine ${similarity.toFixed(2)} >= ${COLLISION_FAIL}`);
    } else if (similarity >= COLLISION_WARN) {
      record(false, "warn", `descriptions are close: ${pair} cosine ${similarity.toFixed(2)}`);
    }
  }
}

// --- per-skill trigger checks -----------------------------------------------------
for (const [index, skill] of skills.entries()) {
  if (!skill.cases) {
    record(false, "warn", `${skill.name}: no evals/evals.json, the router is untested`);
    continue;
  }

  const triggers = skill.cases.filter((c) => c.type === "should_trigger");
  const negatives = skill.cases.filter((c) => c.type === "should_not_trigger");
  const ownTokens = new Set(tokenize(`${skill.name} ${skill.description}`));

  if (triggers.length < 8) record(false, "fail", `${skill.name}: ${triggers.length} should_trigger cases, 8 required`);
  if (negatives.length < 8) record(false, "fail", `${skill.name}: ${negatives.length} should_not_trigger cases, 8 required`);

  let rankOne = 0;
  const scorePrompt = (prompt) => {
    const vector = buildVectors([{ text: prompt }])[0];
    const scores = vectors.map((other) => cosine(vector, other));
    if (EXPLAIN) {
      const ranked = scores
        .map((score, i) => `${skills[i].name} ${score.toFixed(3)}`)
        .sort((a, b) => Number(b.split(" ")[1]) - Number(a.split(" ")[1]));
      console.log(`      ${ranked.join("  |  ")}   <- ${prompt}`);
    }
    return scores;
  };

  const triggerScores = [];

  for (const testCase of triggers) {
    const promptTokens = tokenize(testCase.prompt);
    const overlap = promptTokens.filter((token) => ownTokens.has(token));
    if (overlap.length === 0) {
      record(false, "fail", `${skill.name}: should_trigger shares no vocabulary with the description — "${testCase.prompt}"`);
    }

    const scores = scorePrompt(testCase.prompt);
    triggerScores.push(scores[index]);
    const best = scores.indexOf(Math.max(...scores));
    if (best === index) {
      rankOne += 1;
    } else {
      record(false, "fail", `${skill.name}: "${testCase.prompt}" is outranked by ${skills[best].name}`);
    }
  }

  // Negative aim, which holds even in a one-skill catalog: a prompt that should NOT route
  // here must not match the description better than every prompt that should.
  const maxTrigger = triggerScores.length > 0 ? Math.max(...triggerScores) : 0;

  for (const testCase of negatives) {
    const scores = scorePrompt(testCase.prompt);

    if (scores[index] > maxTrigger) {
      record(
        false,
        "fail",
        `${skill.name}: negative aim — "${testCase.prompt}" matches the description (${scores[index].toFixed(2)}) better than every should_trigger (max ${maxTrigger.toFixed(2)})`,
      );
    }

    // Ranking against siblings only means something when a sibling could plausibly answer.
    // With one skill in the catalog every prompt trivially ranks #1, and when the best score
    // is below the floor the winner is just the least unrelated entry. Asserting a rank in
    // either case reports a failure that says nothing about the description.
    const best = scores.indexOf(Math.max(...scores));
    if (skills.length > 1 && scores[best] >= NO_MATCH_FLOOR && best === index) {
      record(
        false,
        "fail",
        `${skill.name}: should_not_trigger wins the route — "${testCase.prompt}" (${scores[index].toFixed(3)} vs best sibling ${scores[best].toFixed(3)})`,
      );
    }
  }

  const share = triggers.length === 0 ? 0 : (rankOne / triggers.length) * 100;
  if (share < MIN_RANK1) {
    record(false, "fail", `${skill.name}: rank-1 share ${share.toFixed(0)}% is below the ${MIN_RANK1}% floor`);
  } else {
    record(true, "pass", `${skill.name}: rank-1 on ${rankOne}/${triggers.length} trigger prompts (${share.toFixed(0)}%)`);
  }
}

if (AS_JSON) {
  console.log(JSON.stringify({ ...report, failures, warnings }, null, 2));
} else {
  console.log(`catalog: ${CATALOG}`);
  console.log(`skills:  ${skills.map((s) => s.name).join(", ")}\n`);
  for (const check of report.checks) {
    if (check.level === "pass") console.log(`ok    ${check.message}`);
  }
  for (const check of report.checks.filter((c) => c.level === "warn")) console.warn(`warn  ${check.message}`);
  for (const check of report.checks.filter((c) => c.level === "fail")) console.error(`FAIL  ${check.message}`);
  console.log("");
  if (failures > 0) console.error(`${failures} routing failure(s), ${warnings} warning(s)`);
  else console.log(`routing checks passed (${warnings} warning(s))`);
}

process.exit(failures === 0 ? 0 : 1);
