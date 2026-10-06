# Evidence: what you may claim, and how to spend the budget

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

- **Use the helper.** `node scripts/mimic-probe.mjs <owner/repo> [...]` fetches metadata,
  README, root tree, and manifests, caches them under `.mimic-cache/`, and prints a bounded
  summary. Prefer it over ad-hoc fetching: it is cached, it truncates, and it never
  embellishes. Use `--json` when you need the raw shape.
- **Use a token.** The probe reads `GITHUB_TOKEN`, and when that is unset it falls back to
  `gh auth token`, so an environment already logged in with the GitHub CLI needs no export.
  Unauthenticated limits are low enough that a five-repo pass gets throttled mid-research.
- **Never fetch the same thing twice.** The cache exists for this; a repeat fetch is a
  signal that the research plan is drifting.
- **Bounded output.** Truncate READMEs and trees. A 4,000-line README read in full is
  budget burned for nothing.
- **Quote, then paraphrase.** Keep short quoted fragments as evidence; do not reproduce
  long passages of anyone's prose into your output. See [licensing.md](licensing.md).

## Recording

For each project, keep a compact record as you go:

```
## <owner/repo> — <why it is comparable>
E1  fetched 2026-10-06 | stars 4210 | license MIT | pushed 2026-08-14 | not archived
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
