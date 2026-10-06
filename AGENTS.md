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
- **Parse-check the scripts:** `node --check scripts/validate.mjs` and
  `node --check skills/mimic/scripts/mimic-probe.mjs`
- **Smoke-test the probe against a live repository:**
  `node skills/mimic/scripts/mimic-probe.mjs sindresorhus/got --max-chars 400`
- **Install locally:** `./install.ps1` (Windows) or `./install.sh` (POSIX); add `-List` /
  `--list` for a dry run, `-Force` / `--force` to overwrite.

There is no build step and no dependency install. Both scripts are stdlib-only Node 18+;
`mimic-probe.mjs` needs network access, takes `GITHUB_TOKEN` or falls back to
`gh auth token`, and exits 0 clean / 2 usage / 3 failed / 4 degraded — never 0 after a
partial fetch.

## Non-negotiable conventions

- **Skill body: 25–150 lines.** Longer material goes to `reference/`, one level deep. Every
  file in `reference/` must be routed to from `SKILL.md`; the validator fails otherwise.
- **The reference directory is `reference/`**, singular. Some comparable repositories use
  `references/`; this repository's existing habit wins over an outside project's.
- **`name` equals the folder name, kebab-case.** Only `name` and `description` are required.
- **Invocation keys must be kebab-case** — `user-invocable`, `disable-model-invocation`. The
  camelCase forms (`userInvocable`, `modelInvocable`, `disableModelInvocation`) make
  `dsh-skill-filesystem` reject the entire skill silently. Verified by reading that source,
  not assumed.
- **`description` stays on one line.** A wrapped or block scalar is the quietest way a skill
  stops registering on some hosts. DSH's parser tolerates it, so this is a portability rule
  rather than a DSH requirement — but the validator enforces it because it costs nothing.
- **Deterministic steps live in `scripts/` and exit non-zero on failure.** Never exit 0 after
  a partial fetch.
- **No dependencies.** Node stdlib and global `fetch` only.
- **This skill's own rule binds this repository.** No claim about another project without a
  fetch in the same session, and facts stay in a different column from judgements.
- **`README.md` and `README.zh.md` stay in sync.** Changing the mode table, the install
  paths, or the repository structure means changing both.

## Where things are

- The skill: `skills/mimic/SKILL.md`
- The rulebook: `skills/mimic/reference/` — start with `selecting-repos.md` and `evidence.md`
- The fetcher: `skills/mimic/scripts/mimic-probe.mjs`
- CI: `.github/workflows/ci.yml` — runs the validator, its fixture tests, the parse checks,
  and the installer syntax checks
- Contribution rules: `CONTRIBUTING.md`
