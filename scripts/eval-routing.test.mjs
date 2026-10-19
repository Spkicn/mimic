#!/usr/bin/env node
// Offline fixtures for eval-routing.mjs. Each case builds a small catalog in a temp
// directory and asserts the exit code the real gate would produce. They exist because the
// routing check's failure modes (a query vector built from its own corpus, a cosine that
// shrinks with prompt length, a floor measured on a catalog that no longer exists) are
// invisible until a real sibling catalog is present — which CI cannot rely on.
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), "eval-routing.mjs");

const MIMIC_DESCRIPTION =
  'Use when an artifact or an implementation should follow the conventions proven by excellent open-source projects rather than the model\'s own habits. Triggers on "find similar projects on GitHub and see how they do it", "模仿", "参考同类开源项目", "别人是怎么写的", "how should we implement this", "what\'s the idiomatic way to do X", "how is this normally structured", "benchmark against comparable repos", "what stack do similar projects use", "make our README look professional", "how should we organise this repo". Four modes - stack selection, implementation shape (module boundaries, data model, error strategy, extension points), written artifacts (README/CONTRIBUTING/docs), and repository conventions (layout, commits, CI, lint, AGENTS.md). Not for renames or typos. May vendor licensed code, with provenance and obligations noted.';
const UI_UPGRADE_DESCRIPTION =
  "一条指令把某个页面/项目的界面审美提上去。编排 impeccable（4.5.0）与 design-taste-frontend 的完整流程——读项目上下文 → 补产品事实(PRODUCT.md) → 出方向让用户选 → 先落 token 再实现 → detect/截图/audit 收口 → 写 DESIGN.md。触发：优化界面、提高审美、太丑、不好看、不够高级、没质感、改版、重设计、redesign、UI polish、landing page、dashboard 精修。";

const MIMIC_TRIGGERS = [
  "find similar projects on GitHub and see how they do it",
  "how should we implement a retry mechanism, what's the idiomatic way",
  "what stack do similar projects use for a CLI like this",
  "make our README look professional",
  "how is this normally structured in real projects",
  "参考同类开源项目，看看别人是怎么写的",
  "我要给这个项目加个重试机制，先看看同类项目怎么实现的再动手",
  "benchmark our repo against comparable projects before we pick a stack",
];

const MIMIC_NEGATIVES = [
  "rename this variable to something clearer",
  "there is a typo on line 42, fix it",
  "implement a bubble sort in TypeScript",
  "why is this test failing?",
  "review my pull request for bugs",
  "design a nicer landing page for the docs site",
  "add a dark mode toggle to the settings page",
  "upgrade to the latest version of the framework",
  "什么是 MIT 许可证",
];
// The real catalog also carries a promo-video negative. It is exercised in the video
// fixture below instead: against a two-skill catalog it would match mimic's own "make ...
// project" words and fail the negative route for the wrong reason.

const VIDEO_DESCRIPTION =
  "Use when making short product or skill motion videos: promos, launch clips, demo videos, and 10-30 second feature announcements with kinetic type. Handles beats, transitions, and title cards.";
const VIDEO_TRIGGERS = [
  "make a short promo video about our product",
  "how do I make a launch video for my app",
  "create a 30-second product video",
  "make a promo clip for the release",
  "product demo motion video",
  "short launch clip for our startup",
  "video for a skill announcement",
  "make a 20 second demo video",
];
const VIDEO_NEGATIVES = [
  "rename this variable to something clearer",
  "there is a typo on line 42, fix it",
  "implement a bubble sort in TypeScript",
  "why is this test failing?",
  "create a promo clip for our product launch",
  "design a nicer landing page for the docs site",
  "add a dark mode toggle to the settings page",
  "upgrade to the latest version of the framework",
];

const DB_DESCRIPTION =
  "Use when fixing database migrations, SQL schema changes, index design, and query performance problems in PostgreSQL or MySQL. Owns rollout safety and backfills.";
const DB_TRIGGERS = [
  "fix a database migration that fails halfway",
  "change the SQL schema without locking the table",
  "add an index for a slow PostgreSQL query",
  "write a database migration backfill for a new column",
  "roll back a broken migration safely",
  "design a MySQL schema for invoices",
  "query performance problem on PostgreSQL",
  "database migration strategy for a big table",
];
const DB_NEGATIVES = [
  "rename this variable to something clearer",
  "there is a typo on line 42, fix it",
  "implement a bubble sort in TypeScript",
  "why is this test failing?",
  "review my pull request for bugs",
  "make a 30-second promo video for this project",
  "add a dark mode toggle to the settings page",
  "upgrade to the latest version of the framework",
];

const LANDING_DESCRIPTION =
  "Use when designing or redesigning a marketing landing page: hero section, visual style, typography, spacing, and conversion copy for marketing pages.";

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`ok    ${name}`);
    passed += 1;
  } catch (error) {
    console.error(`FAIL  ${name}\n      ${error.message}`);
    failed += 1;
  }
}

function writeSkill(catalog, name, description, triggers, negatives) {
  const dir = join(catalog, name);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "SKILL.md"), `---\nname: ${name}\ndescription: ${description}\n---\n\n# ${name}\n\nBody.\n`);
  if (triggers || negatives) {
    mkdirSync(join(dir, "evals"), { recursive: true });
    const cases = [
      ...(triggers ?? []).map((prompt) => ({ type: "should_trigger", prompt })),
      ...(negatives ?? []).map((prompt) => ({ type: "should_not_trigger", prompt })),
    ];
    writeFileSync(join(dir, "evals", "evals.json"), JSON.stringify({ cases }, null, 2));
  }
}

function catalog(specs) {
  const dir = mkdtempSync(join(tmpdir(), "mimic-routing-"));
  for (const spec of specs) writeSkill(dir, spec.name, spec.description, spec.triggers, spec.negatives);
  return dir;
}

function run(dir, ...args) {
  return spawnSync(process.execPath, [SCRIPT, "--catalog", dir, ...args], { encoding: "utf8" });
}

check("clean catalog passes", () => {
  const dir = catalog([
    { name: "mimic", description: MIMIC_DESCRIPTION, triggers: MIMIC_TRIGGERS, negatives: MIMIC_NEGATIVES },
  ]);
  try {
    const result = run(dir);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /rank-1 on 8\/8/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

check("Chinese paraphrase still routes to its own skill when a sibling shares vocabulary", () => {
  const dir = catalog([
    { name: "mimic", description: MIMIC_DESCRIPTION, triggers: MIMIC_TRIGGERS, negatives: MIMIC_NEGATIVES },
    { name: "ui-upgrade", description: UI_UPGRADE_DESCRIPTION },
  ]);
  try {
    const result = run(dir);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /mimic: rank-1 on 8\/8/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

check("the Chinese retry prompt is explained as rank 1", () => {
  const dir = catalog([
    { name: "mimic", description: MIMIC_DESCRIPTION, triggers: MIMIC_TRIGGERS, negatives: MIMIC_NEGATIVES },
    { name: "ui-upgrade", description: UI_UPGRADE_DESCRIPTION },
  ]);
  try {
    const result = run(dir, "--explain");
    const prompt = "我要给这个项目加个重试机制，先看看同类项目怎么实现的再动手";
    const line = result.stdout.split("\n").find((entry) => entry.includes(`<- ${prompt}`));
    assert.ok(line, "no explain line for the Chinese prompt");
    assert.ok(line.indexOf("mimic") < line.indexOf("ui-upgrade"), line);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

check("a should_not_trigger that genuinely wins the route fails", () => {
  const dir = catalog([
    { name: "video", description: VIDEO_DESCRIPTION, triggers: VIDEO_TRIGGERS, negatives: VIDEO_NEGATIVES },
    { name: "db", description: DB_DESCRIPTION, triggers: DB_TRIGGERS, negatives: DB_NEGATIVES },
  ]);
  try {
    const result = run(dir);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /should_not_trigger wins the route — "create a promo clip for our product launch" \(0\.\d+ vs best sibling/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

check("a low-coverage sibling match does not fail the negative check", () => {
  const dir = catalog([
    { name: "mimic", description: MIMIC_DESCRIPTION, triggers: MIMIC_TRIGGERS, negatives: MIMIC_NEGATIVES },
    { name: "ui-upgrade", description: UI_UPGRADE_DESCRIPTION },
  ]);
  try {
    const result = run(dir);
    assert.equal(result.status, 0, result.stderr);
    assert.doesNotMatch(result.stderr, /should_not_trigger wins the route/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

check("a trigger point claimed by the wrong description fails as outranked", () => {
  const dir = catalog([
    { name: "db", description: DB_DESCRIPTION, triggers: [...DB_TRIGGERS.slice(0, 7), "design a landing page hero section and visual style"], negatives: DB_NEGATIVES },
    { name: "landing", description: LANDING_DESCRIPTION },
  ]);
  try {
    const result = run(dir);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /design a landing page hero section and visual style" is outranked by landing/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

check("near-identical descriptions collide", () => {
  const dir = catalog([
    { name: "alpha", description: MIMIC_DESCRIPTION, triggers: MIMIC_TRIGGERS, negatives: MIMIC_NEGATIVES },
    { name: "beta", description: MIMIC_DESCRIPTION },
  ]);
  try {
    const result = run(dir);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /routing collision: alpha vs beta/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

check("--min-rank1 above 100 fails a perfect catalog", () => {
  const dir = catalog([
    { name: "mimic", description: MIMIC_DESCRIPTION, triggers: MIMIC_TRIGGERS, negatives: MIMIC_NEGATIVES },
  ]);
  try {
    const result = run(dir, "--min-rank1", "101");
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /rank-1 share 100% is below the 101% floor/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

check("missing evals warn but do not fail", () => {
  const dir = catalog([{ name: "mimic", description: MIMIC_DESCRIPTION }]);
  try {
    const result = run(dir);
    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stderr, /no evals\/evals\.json, the router is untested/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

check("too few eval cases fail", () => {
  const dir = catalog([
    { name: "mimic", description: MIMIC_DESCRIPTION, triggers: MIMIC_TRIGGERS.slice(0, 2), negatives: MIMIC_NEGATIVES.slice(0, 2) },
  ]);
  try {
    const result = run(dir);
    assert.equal(result.status, 1, result.stdout);
    assert.match(result.stderr, /2 should_trigger cases, 8 required/);
    assert.match(result.stderr, /2 should_not_trigger cases, 8 required/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

check("an unparseable evals file exits 2", () => {
  const dir = catalog([{ name: "mimic", description: MIMIC_DESCRIPTION }]);
  try {
    mkdirSync(join(dir, "mimic", "evals"), { recursive: true });
    writeFileSync(join(dir, "mimic", "evals", "evals.json"), "{ not json");
    const result = run(dir);
    assert.equal(result.status, 2, result.stdout);
    assert.match(result.stderr, /evals\/evals\.json is not valid JSON/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

check("a missing catalog exits 2", () => {
  const dir = join(tmpdir(), `mimic-routing-missing-${process.pid}`);
  const result = run(dir);
  assert.equal(result.status, 2, result.stdout);
  assert.match(result.stderr, /no catalog at/);
});

check("--json reports the counts CI consumes", () => {
  const dir = catalog([
    { name: "mimic", description: MIMIC_DESCRIPTION, triggers: MIMIC_TRIGGERS, negatives: MIMIC_NEGATIVES },
  ]);
  try {
    const result = run(dir, "--json");
    assert.equal(result.status, 0, result.stderr);
    const report = JSON.parse(result.stdout);
    assert.deepEqual(report.skills, ["mimic"]);
    assert.equal(report.failures, 0);
    assert.ok(Array.isArray(report.checks) && report.checks.length > 0);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

if (failed > 0) {
  console.error(`\n${failed} failed, ${passed} passed`);
  process.exit(1);
}
console.log(`\n${passed} passed, 0 failed`);
