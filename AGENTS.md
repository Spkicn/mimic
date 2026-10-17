# AGENTS.md

Guidance for agents working on **this repository**. `CLAUDE.md` imports this file, so every
host reads the same rules.

> **Scope:** this file configures agents working on `mimic` itself. It is not the reusable
> asset and is not meant to be copied into another project or a global agent configuration.
> The thing you install is `skills/mimic/`.

`mimic` is one Agent Skill that makes an agent study comparable open-source projects before
choosing a stack, writing an artifact, or setting repository conventions.

## Commands

Every command below is verified to run from the repository root.

- **Validate everything (the only gate):** `node scripts/validate.mjs`
- **Test the validator:** `node scripts/validate.test.mjs` — offline fixtures that must fail,
  one per rule. A check that never fires is indistinguishable from a check never written, so
  every new rule in the validator needs a fixture here.
- **Check the routing layer:** `node scripts/eval-routing.mjs`. Tier 1 above proves the skill
  is well formed; it cannot prove the skill ever runs, because the `description` is the
  router. This scores every `evals/evals.json` prompt against every description in the
  catalog — positive prompts must rank their skill first, negative prompts must not, and two
  descriptions must not near-collide. Prompts are scored with BM25 normalised by the IDF mass
  of the prompt's terms, so a long prompt does not lose just for being long. Add
  `--catalog <dir>` to test against a host skills directory, `--explain` to print the scores,
  `--min-rank1 <pct>` for the rank-1 floor, `--no-match-floor <score>` for the noise floor.
  **A failure here usually means fix the description, not the eval.**
- **Test the routing layer against siblings:** `node scripts/eval-routing.test.mjs` — the CI
  gate above runs a one-skill catalog, where sibling checks cannot fail by construction. This
  builds throwaway two- and three-skill catalogs (including a real Chinese paraphrase) and
  asserts the scorer still ranks the right description first.
- **Test the probe offline:** `node scripts/probe.test.mjs` — auth failure, cache writes,
  truncation, unknown flags, and every exit code, without network access.
- **Parse-check the scripts:** `node --check` on each file in `scripts/` and
  `skills/mimic/scripts/`
- **Smoke-test the probe against a live repository:**
  `node skills/mimic/scripts/mimic-probe.mjs sindresorhus/got --max-chars 400`
- **Install locally:** `./install.ps1` (Windows) or `./install.sh` (POSIX); add `-List` /
  `--list` for a dry run, `-Force` / `--force` to overwrite, and `-Help` / `--help` for usage.

There is no build step and no dependency install. Both scripts are stdlib-only Node 18+;
`mimic-probe.mjs` needs network access, takes `GITHUB_TOKEN` or falls back to
`gh auth token`, and exits 0 clean / 2 usage / 3 failed / 4 degraded — never 0 after a
partial fetch.

## Non-negotiable conventions

- **Skill body: 25–150 lines.** Longer material goes to `reference/`, one level deep. Every
  file in `reference/` must be routed to from `SKILL.md`; the validator fails otherwise.
- **Every skill ships `evals/evals.json`** — at least 8 `should_trigger`, 8
  `should_not_trigger`, and 1 `quality` case. The validator enforces the counts, and
  `eval-routing.mjs` enforces that they pass. Tiers adopted from `Paldom/github-skills` and
  `addyosmani/agent-skills` (both MIT): structural, routing, behavioural.
- **The reference directory is `reference/`**, singular. Some comparable repositories use
  `references/`; this repository's existing habit wins over an outside project's.
- **`name` equals the folder name, kebab-case, at most 64 chars.** Only `name` and
  `description` are required. The host limit is enforced by the validator so a skill that
  installs here is still loadable elsewhere.
- **Invocation keys must be kebab-case** — `user-invocable`, `disable-model-invocation`. The
  camelCase forms (`userInvocable`, `modelInvocable`, `disableModelInvocation`) make
  `dsh-skill-filesystem` reject the entire skill silently. Verified by reading that source,
  not assumed.
- **`description` stays on one line, at most 1024 chars.** A wrapped or block scalar is the
  quietest way a skill stops registering on some hosts; 1024 chars is the Agent Skills host
  limit. DSH's parser tolerates wrapping, so this is a portability rule rather than a DSH
  requirement — but the validator enforces it because it costs nothing.
- **Deterministic steps live in `scripts/` and exit non-zero on failure.** Never exit 0 after
  a partial fetch.
- **No dependencies.** Node stdlib and global `fetch` only.
- **This skill's own rule binds this repository.** No claim about another project without a
  fetch in the same session, and facts stay in a different column from judgements.
- **`README.md` and `README.zh.md` stay in sync.** Changing the mode table, the install
  paths, or the repository structure means changing both. The validator compares their
  heading outline, code-fence count, and table-row count, so drift fails the gate instead of
  waiting for a reviewer to notice.

## Where things are

- The skill: `skills/mimic/SKILL.md`
- The rulebook: `skills/mimic/reference/` — start with `selecting-repos.md` and `evidence.md`
- The fetcher: `skills/mimic/scripts/mimic-probe.mjs`
- The checks: `scripts/` — validator, routing scorer, and one fixture suite per tool
- CI: `.github/workflows/ci.yml` — Linux runs every check, the three fixture suites, and the
  parse checks; a Windows job parse-checks and smoke-tests `install.ps1`
- Contribution rules: `CONTRIBUTING.md`
