#!/usr/bin/env node
/**
 * Regression tests for scripts/validate.mjs. Run with `node scripts/validate.test.mjs`.
 *
 * A check that never fires is indistinguishable from a check that was never written, so
 * every rule gets a fixture that must fail and a clean fixture that must pass. Pairs with
 * validate.mjs the way the comparable skill repositories pair each validator with a test.
 *
 * Offline and deterministic: builds throwaway trees under the OS temp directory, so it can
 * run in CI without network access or a token.
 */
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const VALIDATOR = join(HERE, "validate.mjs");

const DESCRIPTION =
  "Use when a fixture skill needs a description long enough for the validator to accept it as routable.";

let passed = 0;
let failed = 0;

function check(name, condition, detail = "") {
  if (condition) {
    passed++;
    console.log(`ok    ${name}`);
  } else {
    failed++;
    console.error(`FAIL  ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

/** A minimal eval file that satisfies the required case counts. */
function evalCases({ triggers = 8, negatives = 8, quality = 1 } = {}) {
  return JSON.stringify({
    skill: "fixture-skill",
    cases: [
      ...Array.from({ length: triggers }, (_, i) => ({ type: "should_trigger", prompt: `trigger prompt ${i}` })),
      ...Array.from({ length: negatives }, (_, i) => ({ type: "should_not_trigger", prompt: `negative prompt ${i}` })),
      ...Array.from({ length: quality }, (_, i) => ({ type: "quality", prompt: `quality prompt ${i}`, expected_behavior: ["does the thing"] })),
    ],
  });
}

/** Write a fixture tree that passes, then return its root. */
function makeFixture(root, { skillName = "fixture-skill", evals = evalCases() } = {}) {
  const skillDir = join(root, "skills", skillName);
  mkdirSync(skillDir, { recursive: true });
  mkdirSync(join(root, ".claude-plugin"), { recursive: true });
  writeFileSync(join(root, "README.md"), "# fixture\n", "utf8");
  writeFileSync(
    join(root, ".claude-plugin", "marketplace.json"),
    JSON.stringify({ name: "fixture", plugins: [{ name: "fixture", source: "./", skills: [`./skills/${skillName}`] }] }),
    "utf8",
  );
  writeFileSync(join(skillDir, "SKILL.md"), skillBody(skillName), "utf8");
  if (evals !== null) {
    mkdirSync(join(skillDir, "evals"), { recursive: true });
    writeFileSync(join(skillDir, "evals", "evals.json"), evals, "utf8");
  }
  return skillDir;
}

function skillBody(skillName, { description = DESCRIPTION, extraFrontmatter = "", bodyLines = 30 } = {}) {
  const body = Array.from({ length: bodyLines }, (_, i) => `Body line ${i + 1} of the fixture skill.`).join("\n");
  return `---\nname: ${skillName}\ndescription: ${description}\n${extraFrontmatter}---\n\n# Fixture\n\n${body}\n`;
}

function runValidator(root) {
  const result = spawnSync(process.execPath, [VALIDATOR, root], { encoding: "utf8" });
  return { status: result.status, output: `${result.stdout ?? ""}${result.stderr ?? ""}` };
}

const sandbox = mkdtempSync(join(tmpdir(), "mimic-validate-"));
let caseIndex = 0;

try {
  // 1. The clean fixture must pass — otherwise every later failure proves nothing.
  {
    const root = join(sandbox, `case-${++caseIndex}`);
    makeFixture(root);
    const { status, output } = runValidator(root);
    check("clean fixture passes", status === 0, `exit ${status}\n${output}`);
  }

  // 2. A wrapped description is the quietest way a skill stops registering on some hosts.
  {
    const root = join(sandbox, `case-${++caseIndex}`);
    const skillDir = makeFixture(root);
    writeFileSync(
      join(skillDir, "SKILL.md"),
      `---\nname: fixture-skill\ndescription: ${DESCRIPTION}\n  continued on a second line\n---\n\n# Fixture\n\n${"Body line.\n".repeat(30)}`,
      "utf8",
    );
    const { status, output } = runValidator(root);
    check("wrapped description fails", status === 1 && /wraps onto a second line/.test(output), `exit ${status}`);
  }

  // 3. A block scalar description is empty as far as routing is concerned.
  {
    const root = join(sandbox, `case-${++caseIndex}`);
    const skillDir = makeFixture(root);
    writeFileSync(
      join(skillDir, "SKILL.md"),
      `---\nname: fixture-skill\ndescription: >\n  ${DESCRIPTION}\n---\n\n# Fixture\n\n${"Body line.\n".repeat(30)}`,
      "utf8",
    );
    const { status, output } = runValidator(root);
    check("block-scalar description fails", status === 1 && /block scalar/.test(output), `exit ${status}`);
  }

  // 4. camelCase invocation keys make DSH ignore the whole skill.
  {
    const root = join(sandbox, `case-${++caseIndex}`);
    const skillDir = makeFixture(root);
    writeFileSync(join(skillDir, "SKILL.md"), skillBody("fixture-skill", { extraFrontmatter: "userInvocable: true\n" }), "utf8");
    const { status, output } = runValidator(root);
    check("legacy camelCase key fails", status === 1 && /userInvocable/.test(output), `exit ${status}`);
  }

  // 5. A body below the floor routes but does not instruct.
  {
    const root = join(sandbox, `case-${++caseIndex}`);
    const skillDir = makeFixture(root);
    writeFileSync(join(skillDir, "SKILL.md"), skillBody("fixture-skill", { bodyLines: 3 }), "utf8");
    const { status, output } = runValidator(root);
    check("body below the floor fails", status === 1 && /below the 25-line floor/.test(output), `exit ${status}`);
  }

  // 6. A body over the budget belongs in reference/.
  {
    const root = join(sandbox, `case-${++caseIndex}`);
    const skillDir = makeFixture(root);
    writeFileSync(join(skillDir, "SKILL.md"), skillBody("fixture-skill", { bodyLines: 200 }), "utf8");
    const { status, output } = runValidator(root);
    check("body over the budget fails", status === 1 && /exceeds the 150-line budget/.test(output), `exit ${status}`);
  }

  // 7. The directory name must match the frontmatter name.
  {
    const root = join(sandbox, `case-${++caseIndex}`);
    const skillDir = makeFixture(root, { skillName: "wrong-directory" });
    writeFileSync(join(skillDir, "SKILL.md"), skillBody("fixture-skill"), "utf8");
    const { status, output } = runValidator(root);
    check("directory/name mismatch fails", status === 1 && /does not match name/.test(output), `exit ${status}`);
  }

  // 8. A reference file nothing routes to is dead weight; an unmatched route is a broken promise.
  {
    const root = join(sandbox, `case-${++caseIndex}`);
    const skillDir = makeFixture(root);
    mkdirSync(join(skillDir, "reference"), { recursive: true });
    writeFileSync(join(skillDir, "reference", "orphan.md"), "# orphan\n", "utf8");
    const { status, output } = runValidator(root);
    check("unrouted reference fails", status === 1 && /never routed to/.test(output), `exit ${status}`);
  }
  {
    const root = join(sandbox, `case-${++caseIndex}`);
    const skillDir = makeFixture(root);
    mkdirSync(join(skillDir, "reference"), { recursive: true });
    writeFileSync(
      join(skillDir, "SKILL.md"),
      skillBody("fixture-skill").replace("Body line 1 of the fixture skill.", "See [missing](reference/missing.md)."),
      "utf8",
    );
    const { status, output } = runValidator(root);
    check("route to a missing reference fails", status === 1 && /missing reference/.test(output), `exit ${status}`);
  }

  // 9. A relative markdown link that does not resolve.
  {
    const root = join(sandbox, `case-${++caseIndex}`);
    makeFixture(root);
    writeFileSync(join(root, "README.md"), "# fixture\n\n[gone](docs/nope.md)\n", "utf8");
    const { status, output } = runValidator(root);
    check("broken relative link fails", status === 1 && /broken link/.test(output), `exit ${status}`);
  }

  // 10. The plugin manifest must parse and its skill paths must exist.
  {
    const root = join(sandbox, `case-${++caseIndex}`);
    makeFixture(root);
    writeFileSync(join(root, ".claude-plugin", "marketplace.json"), "{ not json", "utf8");
    const { status, output } = runValidator(root);
    check("unparseable marketplace manifest fails", status === 1 && /marketplace\.json/.test(output), `exit ${status}`);
  }
  {
    const root = join(sandbox, `case-${++caseIndex}`);
    makeFixture(root);
    writeFileSync(
      join(root, ".claude-plugin", "marketplace.json"),
      JSON.stringify({ name: "fixture", plugins: [{ name: "fixture", source: "./", skills: ["./skills/absent"] }] }),
      "utf8",
    );
    const { status, output } = runValidator(root);
    check("marketplace path pointing nowhere fails", status === 1 && /skill path missing/.test(output), `exit ${status}`);
  }

  // 11. No SKILL.md at all is a failure, not a vacuous pass.
  {
    const root = join(sandbox, `case-${++caseIndex}`);
    mkdirSync(join(root, "skills"), { recursive: true });
    const { status, output } = runValidator(root);
    check("empty tree fails", status === 1 && /no SKILL\.md found/.test(output), `exit ${status}`);
  }

  // 12. The description is the router, so a skill without trigger cases is untested.
  {
    const root = join(sandbox, `case-${++caseIndex}`);
    makeFixture(root, { evals: null });
    const { status, output } = runValidator(root);
    check("missing evals fails", status === 1 && /no evals\/evals\.json/.test(output), `exit ${status}`);
  }

  // 13. Too few cases is not the same as having them.
  {
    const root = join(sandbox, `case-${++caseIndex}`);
    makeFixture(root, { evals: evalCases({ triggers: 3, negatives: 3 }) });
    const { status, output } = runValidator(root);
    check(
      "too few trigger cases fails",
      status === 1 && /3 should_trigger cases, 8 required/.test(output),
      `exit ${status}`,
    );
  }

  // 14. Unparseable cases fail rather than passing silently.
  {
    const root = join(sandbox, `case-${++caseIndex}`);
    makeFixture(root, { evals: "{ not json" });
    const { status, output } = runValidator(root);
    check("unparseable evals fails", status === 1 && /not valid JSON/.test(output), `exit ${status}`);
  }
} finally {
  rmSync(sandbox, { recursive: true, force: true });
}

console.log("");
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
