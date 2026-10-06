# Mode: conventions (layout, commits, CI, agent rules)

Use when the question is how the repository itself should be organised — directory layout,
module boundaries, test placement, naming, commit and PR rules, CI gates, formatters, or
the agent-facing rules file.

## Authority order

Conventions have a strict precedence. Getting this backwards is the main failure of this
mode: an existing project's own habits outrank a famous project's habits.

1. **This repository's existing conventions**, if it already works this way somewhere.
   Read the neighbours before inventing a rule. Consistency inside the repo beats
   conformity with an outside project.
2. **The comparable set**, when the repo has no existing answer.
3. **Your defaults**, last, and only when 1 and 2 are silent.

State which level each adopted convention came from.

## Read the tree first

Fetch the root tree and one level into the main source directory of each comparable. Facts
you can read directly:

| Look for | Reveals |
|---|---|
| Top-level entries | Whether the project separates `src/`, `tests/`, `docs/`, `scripts/`, `examples/` |
| `.github/` contents | CI, issue/PR templates, CODEOWNERS, release automation |
| Config file set | Formatter, linter, type checker, editor settings |
| Test file placement | Colocated vs mirrored `tests/` tree |
| `docs/` shape | Docs-as-code vs generated site |
| Presence of `AGENTS.md` / `CLAUDE.md` / `.cursorrules` | Whether the project treats agents as contributors |
| `CHANGELOG.md`, `changeset/`, release workflow | Release discipline |

## What to extract, and the scale filter

For each convention, ask **what it costs to maintain**. A convention is only worth adopting
if this project can sustain it:

| Convention | Cheap (solo, short-lived) | Costly (needs people or process) |
|---|---|---|
| Formatter + pre-commit | ✓ adopt freely | — |
| Conventional commits | ✓ adopt freely | — |
| CI running tests + lint | ✓ adopt | — |
| Required review, CODEOWNERS | — | Needs ≥2 active people |
| Changeset per PR | — | Hurts on a solo repo |
| Monorepo tooling | — | Needs ≥3 packages to pay off |
| Multi-stage release, backports | — | Needs users and a support window |
| DCO / CLA | — | Needs outside contributions |

Adopting a costly convention from a 300-contributor project into a solo repo produces
friction that gets disabled within a month. Name the scale mismatch when you decline
something.

## Agent rules file

If the comparable set carries `AGENTS.md` (or the project has none), this is the highest-
value artifact in this mode, and its conventions are young and inconsistent across the
ecosystem — so compare, do not assume:

- What it states: build/test/lint commands, layout map, boundaries, "do not touch" zones,
  how to add a module, what to run before committing.
- What it should not be: a style essay, a project history, or a copy of the README.
- Keep it operational. Every line should change what an agent does.
- Write the project's real commands — verify them against `package.json` scripts /
  `Makefile` / `pyproject.toml`, not against what the README claims.
- If the project has `CLAUDE.md` or `.cursorrules`, mirror rather than contradict; a
  one-line import is a legitimate convention.

## Output contract

Produce files, and a short adoption table:

```markdown
## Conventions adopted
| Convention | Adopted from | Authority level | Cost | Files written |
|---|---|---|---|---|
| Conventional commits | owner/repo (with commitlint + husky) | comparable set | low | .commitlintrc.json, CONTRIBUTING.md |
| Formatter | this repo already uses Prettier | existing project | low | — |

## Declined
| Convention | Source | Why not |
|---|---|---|
| Changesets per PR | owner/repo2 | solo repo; release cadence is ad hoc |
```

Prefer the smallest set of files that actually enforces the convention. A documented rule
that no tool checks decays; a config file that fails CI does not.

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| Rewriting a working layout to match a famous repo | Precedence level 1 wins; use it |
| Adding tooling the maintainers will not keep | Cost table; decline with a reason |
| CI added but not verified to pass | Run the gate locally before committing it |
| Rules file listing commands that do not exist | Execute every command you document |
| Mirroring a monorepo structure for one package | Start flat; split when it hurts |
| Ignoring the existing `.editorconfig` / formatter | Read before writing config |
