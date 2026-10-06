# Contributing

The most useful contribution to `mimic` is a **failure report**: a case where an agent
using this skill asserted something about a repository it had not fetched, adopted a
convention that did not fit, or stopped short of writing the file. Those reports become
hard lines in [`skills/mimic/reference/`](skills/mimic/reference/) — that is how this skill
gets better, and it is the reason the repository exists.

## Before you open a PR

1. Run `node scripts/validate.mjs`. It is the only gate, and CI runs the same command.
2. If you changed a rule, name the case that made it necessary.
3. If you changed the mode table, the install paths, or the repository structure, update
   both `README.md` and `README.zh.md`.

## Changing a rule

Rules live in `skills/mimic/reference/*.md`. A rule is only worth adding when it prevents a
failure someone actually hit. A rule invented from theory makes the skill longer without
making it better — so describe the failure in the PR description, not just the fix.

Keep `SKILL.md` between 25 and 150 lines and put detail in `reference/`. The validator
enforces both ends of that band, and it fails if a reference file exists that `SKILL.md`
never routes to.

## Repository conventions

[`AGENTS.md`](AGENTS.md) is the canonical list, and it applies to human contributors too —
the line-count band, the kebab-case frontmatter rules, and the ban on unfetched claims.

## Commit style

Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`), imperative subject, the reason in
the body. This is this repository's own habit rather than a claim about other projects.

## Licence

Contributions are accepted under the [MIT licence](LICENSE).
