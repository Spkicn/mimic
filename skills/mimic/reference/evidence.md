# Evidence: what you may claim, and how to spend the budget

## The substance gate — check this one first

Everything else in this file is about being honest. This section is about being *useful*.

A run can pass every process check and still produce nothing. The failure sounds like this:

> 落盘的决策记录：背景、选项、决定、后果
> 按章节契约重写
> 它让产出更规范

Every sentence is grammatical, on topic, and true of any project in the category. That is the
definition of a hole: **a sentence that would survive unchanged in someone else's artifact
carries no information about this one.** Process compliance is not substance — a complete,
honest, licence-checked research pass can still end in a template.

### The test

1. **Delete every proper noun, number, path and date.** If the artifact still reads complete,
   it was a template. If it collapses, those were the content.
2. **Require at least three specific claims** — a number, a name, a file path, a version, a
   date, or a quoted line — each traceable to a fetch. Three is the floor, not a target.
3. **Every generalisation carries its evidence inline.** "Comparable projects keep a section
   inventory" is a hole. "6 of 6 have `.claude-plugin/`; 4 of 6 have `AGENTS.md` — read from
   each root tree" is a finding.
4. **Name the thing that surprised you.** If the run changed nothing about what the author
   already believed, either the comparables were poorly chosen or the reading was shallow.
   Say which; both are findings.

### Worked failure

A promotional video for this skill was rebuilt twice on motion-design principles — camera
layer, transition overlap, layout budget — and passed every item of the completion gate while
staying empty: a dark gradient, centred sentences, and a list of filenames. No repository, no
code, no output, no number ever appeared on screen.

The gate it passed had nine items, all of them about *how* the work was done. None asked
whether the result said anything. The fix was not more motion; it was showing one real run —
the two candidates rejected with their versions quoted, the three files read, the number that
changed the cut.

## Two columns, always

Every finding goes in one of two columns, and the column is visible in the output.

| | Repository fact | Your judgement |
|---|---|---|
| What it is | Directly readable from code, config, docs, or API | Your inference from those facts |
| Example | `pushed_at: 2026-08-14`, `license: MIT` | "This layout scales poorly past ~50 modules" |
| Example | "`CONTRIBUTING.md` requires a changeset per PR" | "That gate suits a project with more contributors than ours" |
| Test | Could a second person verify it by opening the same file? | No — it is an argument |
| Failure if wrong | You fabricated. Unrecoverable trust loss | You argued badly. Recoverable |

Never let a judgement wear the costume of a fact. "Most projects use pnpm" is a judgement
unless you name the projects and the file that says so.

## Evidence levels

Tag claims with the strongest level you actually reached:

| Level | Name | You did |
|---|---|---|
| E1 | **Fetched** | Retrieved the file or API response in this session |
| E2 | **Read** | Actually read the relevant part, not just the title |
| E3 | **Corroborated** | The same fact is visible in ≥2 projects independently |
| E4 | **Inferred** | Your reasoning from E1–E2 material; label as judgement |

Only E1–E3 may be stated as repository facts. E4 never may.

## Budget: shallow everywhere, deep twice

Fetching five repositories exhaustively is expensive and mostly wasted — most of the
signal is in the shallow pass.

**Shallow pass, all candidates (cheap):**
`pushed_at`, `archived`, `license`, `topics`, `description`, README, root tree,
dependency manifest. This alone settles most stack and layout questions.

**Deep pass, at most two (expensive):**
Follow one real workflow end to end — entry point → core module → tests, or the config →
the code that reads it. Read `CONTRIBUTING.md`, CI config, and a representative test.
Read a merged PR and its discussion if the conventions question is about process.

Stop deepening when two consecutive files add nothing new. Report the shallow/deep split
so the reader knows how much weight each project's analysis carries.

## Fetch discipline

- **Use the helper.** `node <skill-dir>/scripts/mimic-probe.mjs <owner/repo> [...]` fetches
  metadata, README, root tree, and manifests, caches them under `.mimic-cache/`, and prints a
  bounded summary. Resolve `<skill-dir>` rather than guessing: from this repository it is
  `skills/mimic`, and an installed DSH copy is `~/.dsh/skills/mimic`. Running
  `node scripts/mimic-probe.mjs` from the user's project only works if the script happens to
  be there.
- **Read the exit code before the output.** `0` means a clean fetch, `2` a usage mistake,
  `3` a repository failed, `4` the tree was degraded but usable. A failure is reported as a
  failure; it is never evidence that the repository does not exist. If the probe prints an
  authentication error, the stored token is stale — fix it or run unauthenticated; do not
  report "repository not found" from it.
- **Use a token.** The probe reads `GITHUB_TOKEN`, and when that is unset it falls back to
  `gh auth token`, so an environment already logged in with the GitHub CLI needs no export.
  Unauthenticated limits are low enough that a five-repo pass gets throttled mid-research.
- **Fetch only what the question needs.** `--paths <file...>` pulls one more file (a
  `CONTRIBUTING.md`, a template, a workflow) without the cost of the whole tree;
  `--refresh` bypasses the 24-hour cache and `--no-cache` disables it. The probe prints the
  fetched timestamp, default branch, and commit SHA — record the SHA so a later reader can
  pin the exact revision you read.
- **Never fetch the same thing twice.** The cache exists for this; a repeat fetch is a
  signal that the research plan is drifting.
- **Bounded output.** Truncate READMEs and trees. A 4,000-line README read in full is
  budget burned for nothing. `--json` is a raw escape hatch and is not truncated; do not
  paste it into a report.
- **Quote, then paraphrase.** Keep short quoted fragments as evidence; do not reproduce
  long passages of anyone's prose into your output. See [licensing.md](licensing.md).

## Where an instruction lives

Placement decides obedience more than wording. A pre-registered ablation of one formal
directive (the "we" reasoning register) measured the same sentence in different positions: the
per-step runtime-context snapshot at **head + tail 0.81**, head only 0.68, tail only 0.56, no
anchor 0.02 — while rewriting the system prompt to carry the same instruction moved nothing
(0.012 versus a 0.014 baseline). Two rules follow:

- A rule that must hold on every step belongs in the per-step context (head and tail), not in
  a persona paragraph that is read once and sits far from the generation point.
- A wording-level rule that can be checked ("every paragraph begins with X") beats an identity
  narrative ("we are a team thinking as one"): 0.77–0.82 versus 0.13.

Source: `yjh051108/fengcha-2.0`, Apache-2.0, n=10 per position — direction credible, exact
values not to extrapolate. Its author measured the reasoning register only, never correctness.

## Recording

For each project, keep a compact record as you go:

```
## <owner/repo> — <why it is comparable>
E1  fetched 2026-10-06 | commit 3f2a91c | stars 4210 | license MIT | pushed 2026-08-14 | not archived
E2  read: README.md, package.json, root tree, src/index.ts
    - <fact>
    - <fact>
E4  judgement: <inference>, because <evidence>
    - would adopt: <thing>
    - would not adopt: <thing>, because <reason>
    not checked: <what you did not look at>
```

The `not checked` line is mandatory. It is what separates a bounded study from a claim of
omniscience.

## Reporting template

```markdown
## Goal as understood
<one sentence; note if it came from the user or from a file>

## Candidates
| Project | Comparable because | Stars | Licence | Last push | Archived | Verdict |
|---|---|---|---|---|---|---|

## Rejected
| Project | Why rejected |

## Findings
### Repository facts
### Judgements

## Adopted / Not adopted
| Convention or choice | Source project | Adopted? | Reason |

## Not checked
## Open questions for you
```
