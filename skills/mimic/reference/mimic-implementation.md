# Mode: implementation

Use when the question is how to build something **in code** — the shape of a module, the
idiomatic approach in this stack, the data model, the error strategy, the extension point —
and the answer should come from comparable projects that actually shipped it.

This is the mode for the middle of development, not the start. The deliverable is the
changed source, not a report.

## When not to use this mode

Mimicry costs a research pass. Do not pay it for work that has no pattern to learn:

- renames, typos, formatting, moving files, dependency bumps
- pure logic that behaves the same in every project (loops, sorting, string handling)
- one-off glue with no reuse expectation
- anything this project already has a pattern for — read the neighbour first. The authority
  order in [mimic-conventions.md](mimic-conventions.md) applies here too: this repository's
  existing habit outranks an outside project's.

## Find code, not homepages

**Search by topic, not by phrase.** Repository descriptions are marketing; topics are
maintained. `gh search repos "nextjs ecommerce drizzle"` matches phrases and often returns
nothing. This works:

```bash
gh search repos --topic=<framework> --topic=<orm> --sort stars --limit 10 \
  --json fullName,stargazersCount,pushedAt,license,isArchived
```

**The famous repository is rarely the best shape to mimic.** A small project on the same
stack, the same runtime and the same constraint often holds the exact shape you need,
*because* it could not afford the machinery the famous one carries. Search the domain's own
words, and the words the market actually uses; an English-only search that finds nothing is
a signal to search differently, not a verdict that nothing exists.

**Match the version before you match the pattern.** Identify the project's exact versions
from its manifest first:

```
package.json / pyproject.toml / go.mod / Cargo.toml / Gemfile / composer.json
```

A pattern from a project three majors behind yours is a pattern for a different API. State
the versions you matched, in the same way [mimic-stack.md](mimic-stack.md) requires.

## Read the shape, not the lines

Open the module that does the thing — never the README — and record:

| Dimension | What to write down |
|---|---|
| Module boundary | what is public, what is private, where the seam is |
| Interface | signatures and, more importantly, what they promise |
| Data model | the structures and their invariants |
| Control flow | sync/async, streaming/buffered, push/pull, batch/single |
| Error strategy | throw / return / Result / panic, and where errors are translated |
| State and concurrency | what is shared, what is immutable, what is locked |
| Extension points | how a third party adds behaviour, and at what cost |
| Dependencies | what it leans on, and what it deliberately refuses to |

Then run the constraint test below before liking any of it.

## The constraint test

For every pattern you are tempted to adopt, answer two questions:

1. **What constraint forced this shape?**
2. **Do we have that constraint?**

- **Yes** → adopt the shape, and say which constraint you share. That sentence is the
  justification, and it is what makes the adoption reviewable.
- **No** → *naming it is the finding.* Adopting machinery whose reason you cannot state is
  cargo cult, and it is the most expensive failure this mode can produce: the code gets
  longer, the reason is invisible, and nobody can safely delete it later.

Constraints that justify real machinery: many contributors, a plugin ecosystem, backwards
compatibility with released users, multi-tenancy, an unreliable network, a language without
exceptions, a team shipping daily behind a feature-flag system. A solo project or a new
project usually has none of the first four — which is exactly why the famous repository's
architecture is usually the wrong thing to copy.

## Two ways to land a shape: copy or reimplement

Vendoring is normal engineering when the licence permits it and the file does the job. Reimplementing
is required when the licence forbids copying, or when the source drags in a dependency or an
abstraction you do not want. Choose explicitly, say which you chose, and never blur the two.

### Copy (permissive licence)

1. **Read the licence first.** SPDX id and the file's header — no copy before that, and no
   "probably MIT". Copyleft or absent: say the obligation (or the absence of permission) in
   one sentence to the user, then copy on their instruction and record it.
2. **Copy the file with its header.** Keep the copyright line and licence notice; strip nothing
   for looks and change nothing on the way in.
3. **Record provenance** in the commit body and in the `## Copies` table of
   [licensing.md](licensing.md): destination path → `owner/repo@<sha>:path` → SPDX → header kept
   → sha256[:12] → obligation.
4. **Adapt only what the brief needs**, and list the changes. An edited copy is a modified file;
   its diff against the source is what a reviewer reads.
5. **Test it here.** A file that compiled there may not compile in this project.

### Reimplement (copyleft, unlicensed, or shape only)

1. **Describe.** With the source open, write the pattern in **your own words**, as pseudocode, and
   save a **permalink at the commit SHA** for each claim. The permalink is the evidence — a
   branch URL rots, a SHA does not. The probe prints the commit SHA of the default branch it
   fetched; use that SHA rather than the branch name.
2. **Implement.** Close the source. Write it in this project's names, types and error strategy.
   Do not re-open the file while typing.
3. **Verify by test, not by diff.** A test proves the behaviour. If you catch yourself comparing
   your file to theirs line by line, you wanted to copy: go back to the copy path and check the
   licence, or return to step 1.

Either way, prose stays off limits: README text, comments and docstrings are never pasted. Keep
[licensing.md](licensing.md) true rather than nominal.

## Where it lands

The deliverable is the **changed or copied source files**, plus a provenance block. Code alone
loses the reasoning the moment the session ends.

```
Pattern:           <the shape that was adopted>
Source:            <owner/repo>@<sha> — <path> (permalink)
Licence:           <SPDX id, or "none — ideas only">
Way:               <copied | reimplemented>
Shared constraint: <the constraint both projects have>
Diverged because:  <where we deliberately differ, or "not diverged">
Copies:            <destination → owner/repo@<sha>:path → SPDX → header kept → sha256[:12] → obligation>
```

Put it in the commit body or the pull-request description. Escalate to
`docs/adr/NNNN-<slug>.md` (the format in [mimic-stack.md](mimic-stack.md)) when the pattern
crosses a module boundary, changes a public interface, or would be expensive to reverse.

## Declared divergence from the closest comparable

[kengomatsuo/agent-skills](https://github.com/kengomatsuo/agent-skills) `code-to-copy`
(MIT) does this same job and is the closest thing in the ecosystem: "finds open-source
projects worldwide that already built what is needed, reads their schema and service code,
and writes down exactly what to copy and what to leave".

**Adopted from it:** topic-based search over phrase search; the small-repo-over-famous-repo
instinct; permalinks pinned at the commit SHA; the pseudocode → write → verify ordering; and now
its core move — deciding *what to copy* is a legitimate output.

**Diverged from it:** the copying became conditional and recorded. Its output is a list of what
to copy; ours is the copy plus the licence that permits it, the header kept, and the sha256 it
started from — so a reviewer can tell a vendored file from an invented one, and copyleft or
unlicensed sources are refused outright.

## Anti-patterns

| Anti-pattern | Do instead |
|---|---|
| Mimicking a famous repository's architecture | Run the constraint test; name what it can afford that you cannot |
| Claiming to know the design from the README | Open the module |
| Adopting a shape without its reason | State the constraint, or do not adopt it |
| A pattern from an end-of-life major version | Match versions from the manifest first |
| Re-opening the source while implementing | Clean-room step 2 |
| Diverging silently | Say where and why — divergence is a finding, and it is the interesting part |
| Paying the research cost on a rename | Use the "when not to use" list above |
| Shipping code with no provenance | The commit body block, or an ADR when it is architectural |
