# Mode: stack

Use when the question is what to build with — language, framework, storage, build tool,
deployment shape, or "how do comparable projects structure this".

The deliverable is a **decision record on disk**, not a recommendation in chat. Write
`docs/adr/0001-<slug>.md` (or `ADR/`, or wherever the project already keeps decisions —
check first). A recommendation that is not written down will be re-litigated next week.

## Read the manifest, not the README

A README describes intent. A manifest describes reality. For every candidate, open the
actual dependency manifest and lockfile:

| Ecosystem | Files |
|---|---|
| Node | `package.json`, lockfile, `tsconfig.json` |
| Python | `pyproject.toml`, `requirements*.txt`, `Pipfile`, `poetry.lock`, `uv.lock` |
| Go | `go.mod`, `go.sum` |
| Rust | `Cargo.toml`, `Cargo.lock` |
| JVM | `pom.xml`, `build.gradle(.kts)`, `gradle/libs.versions.toml` |
| Ruby / PHP / .NET | `Gemfile`, `composer.json`, `*.csproj` |
| Any | `Dockerfile`, `.github/workflows/*`, deployment config |

If a README says "blazing fast Rust core" and `go.mod` says otherwise, the manifest wins and
you note the discrepancy. Discrepancies are the most valuable thing this mode finds.

## What to extract

For each project, build one row:

| Dimension | Look at |
|---|---|
| Runtime and version | manifest engines/`requires-python`/`go` directive, `.nvmrc`, CI matrix |
| Core framework | direct dependencies, not transitive |
| Storage | driver packages, migrations directory, ORM presence |
| Build and test | scripts, `Makefile`, test deps, CI steps |
| Package manager | lockfile presence and type |
| Deployment shape | Dockerfile, serverless config, IaC |
| Release process | release workflow, changesets, tags |

## Separate load-bearing from incidental

This is the analytical core of the mode. A dependency is **load-bearing** when the project's
stated problem cannot be solved without it — the framework, the storage engine, the protocol
library. It is **incidental** when it reflects a moment: a logging library, a formatter, a
choice made because the author worked at a company that used it, or a vendor lock-in from a
free tier.

Adopting incidental choices because they appear in admired projects is the most common
failure of this mode. Justify every adoption against **your** constraints, and say when a
choice is too coupled to the source's situation to transfer.

Then check whether the comparable set actually agrees. If the three most comparable
projects each chose differently, that is the finding: the choice is genuinely open, and the
ADR must present the alternatives rather than a confident pick.

## Beware the age and scale bias

A stack is a snapshot of when a project started, how big its team is, and what it can
afford. Always report `pushed_at` and whether the pinned versions are current:

- Runtime or framework past end-of-life in the manifest → the project is a poor guide.
- A project with 200 contributors can justify monorepo tooling that a solo project cannot.
- A funded project's managed-infrastructure choices may be unavailable to the user.

Filter candidates by scale comparability before reading their stacks, per
[selecting-repos.md](selecting-repos.md).

## Decision record

```markdown
# NNNN. <Decision in the imperative>

- Status: proposed
- Date: <YYYY-MM-DD>
- Evidence: <owner/repo1>, <owner/repo2> — see the licence check table

## Context
<The problem, the constraints that actually bind, and the box we are inside.>

## Options considered
### Option A — <name>
Adopted by: <projects, with the manifest file that shows it>
Pros / Cons / Fits us because / Does not fit because

### Option B — <name>
...

## Decision
<One option, stated plainly. Include what we are explicitly not doing.>

## Consequences
<What becomes easy, what becomes hard, what we will have to revisit, and the signal that
would make us reverse this.>
```

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| Recommending the most popular option without constraints | State the binding constraint first; a stack with no constraint is a preference |
| "Modern" as a justification | Name the property: type safety, cold-start time, hiring pool |
| Reading the README's stack claims | Read the manifest |
| Treating a demo repo as a production reference | Check commit count, tests, CI |
| Ignoring end-of-life versions | Report pinned runtime versions |
| One project, one answer | Three comparables is the floor |
