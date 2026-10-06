# mimic

**Look at what comparable projects actually do — before deciding what this one should do.**

[![CI](https://github.com/Spkicn/mimic/actions/workflows/ci.yml/badge.svg)](https://github.com/Spkicn/mimic/actions/workflows/ci.yml)

`mimic` is an [Agent Skill](https://agentskills.io) for the moment when the answer should
not come from the model's own habits. Choosing a stack, implementing a subsystem, writing a
README, setting up a repository's conventions: each of these has a hundred well-run
open-source projects that already solved it, and their choices are checkable. Your model's
defaults are not.

So the skill makes the agent go look — at genuinely comparable projects, not the most
popular ones — and then produce an artifact that follows what it actually found, with the
evidence and the licence check attached.

> The failure it exists to prevent is **confident invention**: a plausible conventions
> section, a stack recommendation, a star count, a licence, an implementation — all
> generated from memory. Every one of those is checkable, and a human will check.

## The four modes

| Mode | When | Deliverable |
|---|---|---|
| **stack** | "What should we build this with?" | A decision record on disk: context, options with the projects that chose them, decision, consequences |
| **implementation** | "How should we implement X? What shape should this module take?" | The changed source, plus a provenance block naming the pattern, the source at a pinned commit, its licence, and the constraint both projects share |
| **artifact** | "Our README is bad — see how other projects do it" | The file itself (`README.md`, `CONTRIBUTING.md`, docs), restructured from a section inventory of the comparable set |
| **conventions** | "How should this repo be organised?" | Layout, commit/CI/lint rules, and an `AGENTS.md` — each adopted convention tagged with where it came from and what it costs |

## Quick start

**DSH**

```powershell
git clone https://github.com/Spkicn/mimic.git
cd mimic
./install.ps1                 # -> ~/.dsh/skills
./install.ps1 -Target project-dsh -ProjectPath C:\code\myapp
```

**Claude Code**

```
/plugin marketplace add Spkicn/mimic
/plugin install mimic@mimic
```

**Any Agent Skills host** — copy the folder:

```bash
mkdir -p .claude/skills && cp -R mimic/skills/mimic .claude/skills/
```

Then just describe the task. The skill activates on its description:

> 我们的 README 写得很敷衍，去 GitHub 上找几个同类项目看看别人的 README 是什么规范，然后照着重写一版。

> 我要给这个项目加一个重试机制，先去 GitHub 上看看同类项目是怎么实现的，再动手写。

## What it does differently

Most "research before you build" prompts stop at a report. `mimic` closes these gaps:

| Gap | What `mimic` requires |
|---|---|
| **Substance** | At least three claims that are specific and checkable — a number, a name, a path, a version, or a quoted line from a fetch. Delete every proper noun and number: if the artifact still reads complete, it is a template, and a run can pass every other check while producing nothing. |
| **Comparability** | 3–5 candidates filtered on problem/user/scale axes, with at least one rejection recorded. Stars are context, never a selection reason. |
| **The right layer** | Candidates must cover more than one kind of source: **peers** (your own stack — they teach conventions), **craft sources** (the discipline behind your weak layer — they teach parameters), and **canon** (the platform itself, at HEAD). Searching your own stack only ever finds peers. |
| **Evidence** | Every repository claim tagged E1–E4: fetched, read, corroborated, or inferred. E4 may never be stated as fact. `pushed_at`, licence, and archived status are fetched, not recalled. |
| **Licence** | An explicit check before anything is adopted: structure and ideas transfer, expression and code do not. GPL/AGPL/unlicensed sources are flagged, not quietly used. |
| **Closure** | The deliverable is a file on disk plus an "adopted / deliberately not adopted / reason" table — not advice in a chat window. In implementation mode the deliverable is the changed source plus its provenance block. |
| **Constraint test** | A pattern is only adopted if you can name the constraint that forced it *and* show that you share it. Otherwise the machinery is cargo cult, and the finding is that you did not need it. |
| **Clean room** | Describe the pattern in your own words first, then close the source and implement. This is what makes "never copy code" a procedure instead of a promise. |

And it has a degraded mode: **no network, no answer.** If GitHub is unreachable the agent
says so and stops, rather than reconstructing repositories from memory.

## How a run goes

1. **Frame** — one sentence; at most three questions, and only ones that change what counts as comparable.
2. **Select** — 3–5 comparables plus a rejected candidate, using the axes in [`selecting-repos.md`](skills/mimic/reference/selecting-repos.md).
3. **Read** — shallow-read all of them, deep-read at most two. Fetch via [`mimic-probe.mjs`](skills/mimic/scripts/mimic-probe.mjs), which caches, truncates, and never embellishes.
4. **Decide** — facts and judgements in separate columns; licence gate passed.
5. **Write** — the artifact on disk, then the completion gate, reported as part of the answer.

```bash
# what the agent runs under the hood
node skills/mimic/scripts/mimic-probe.mjs owner/repo owner/repo2 --max-chars 1200
node skills/mimic/scripts/mimic-probe.mjs --search "rate limiter" --language python
```

The probe prints `stars | licence | pushed_at | archived` plus the README, root tree, and
dependency manifests — the fields a model is most tempted to invent and most likely to get
wrong. `GITHUB_TOKEN` raises the rate limit; results are cached under `.mimic-cache/`.

## Repository structure

```
skills/mimic/
  SKILL.md                      # entry: routing, the one rule, the completion gate
  reference/
    selecting-repos.md          # comparability axes, search strategy, exclusion criteria
    evidence.md                 # E1–E4 levels, budget, record and report formats
    licensing.md                # what transfers, compatibility table, hard lines
    mimic-stack.md              # mode: stack -> decision record
    mimic-implementation.md     # mode: implementation -> shape, constraint test, clean room
    mimic-readme.md             # mode: artifact -> file on disk
    mimic-conventions.md        # mode: conventions -> layout, CI, AGENTS.md
  scripts/mimic-probe.mjs       # dependency-free GitHub fetcher with caching
  evals/evals.json              # Tier 2 cases: trigger, near-miss negative, quality
AGENTS.md                       # canonical agent rules for this repo; CLAUDE.md imports it
CONTRIBUTING.md                 # how to contribute, and what makes a useful report
scripts/validate.mjs            # Tier 1 self-check: frontmatter, single-line description, 25-150 band, routing, evals, links
scripts/validate.test.mjs       # offline fixtures, one per rule the validator enforces
scripts/eval-routing.mjs        # Tier 2: does the description actually route here
.github/workflows/ci.yml        # runs the self-check, its tests and the parse checks on every push
.github/PULL_REQUEST_TEMPLATE.md
.claude-plugin/marketplace.json # Claude Code plugin manifest
install.ps1 / install.sh        # DSH / Claude / project-local installers
.gitattributes                  # keeps install.sh LF and install.ps1 CRLF
```

## Design principles

- **Fetch, never recall.** A claim without a fetch is a fabrication with good manners.
- **Comparability beats popularity.** The 400-star project that solves *your* problem beats the 60k-star project that does not.
- **Three is the floor.** One admired repository is a taste, not a convention.
- **Mimic structure, not decoration.** Emoji headings and badge walls are not conventions; section contracts and commitments are.
- **Write the file.** Advice evaporates; a file in the repo does not.
- **The artefact's licence is yours, not the source's.** Learn from GPL projects freely — copy nothing.

## Prior art and credit

`mimic` was built by running its own method over the skills ecosystem on 2026-10-06. The
conventions it follows, and the projects they came from:

| Project | Licence | What was adopted |
|---|---|---|
| [kengomatsuo/agent-skills](https://github.com/kengomatsuo/agent-skills) | MIT | Research-first framing, one-skill-per-concern, "look before it builds" |
| [Paldom/github-skills](https://github.com/Paldom/github-skills) | MIT | README section contract (value prop → quick start → skills table → structure → contributing → licence), multi-host install paths, plugin manifest |
| [anthropics/skills](https://github.com/anthropics/skills) | — | `.claude-plugin/marketplace.json` shape |
| [blue-skillhub](https://github.com/betterblueblue/blue-skillhub) | — | Facts vs judgements separation; confirm the plan before writing code |
| [GitHub Prior Art Research](https://skillmd.ai/skills/github-prior-art-research/) | — | Search GitHub before proposing an implementation |

No prose or code was copied. Differences from all of the above: they stop at a report;
`mimic` adds the licence gate and the file-on-disk closure.

## Contributing

Issues and PRs welcome — see [CONTRIBUTING.md](CONTRIBUTING.md). The most useful
contribution is a **failure report**: a case where the agent asserted something about a
repository it had not fetched, or adopted a convention that did not fit. Those become hard
lines in the references.

Run `node scripts/validate.mjs` and `node scripts/validate.test.mjs` before opening a PR —
CI runs both. Keep `SKILL.md` between 25 and 150 lines and put detail in `reference/`; that
is this repo's own convention, and the validator enforces both ends of it. Agent-facing
rules live in [AGENTS.md](AGENTS.md).

## Licence

[MIT](LICENSE) © 2026 mimic contributors
