---
name: mimic
description: Use when an artifact or an implementation should follow the conventions proven by excellent open-source projects rather than the model's own habits. Triggers on "find similar projects on GitHub and see how they do it", "模仿", "参考同类开源项目", "别人是怎么写的", "how should we implement this", "what's the idiomatic way to do X", "how is this normally structured", "benchmark against comparable repos", "what stack do similar projects use", "make our README look professional", "how should we organise this repo". Four modes - stack selection, implementation shape (module boundaries, data model, error strategy, extension points), written artifacts (README/CONTRIBUTING/docs), and repository conventions (layout, commits, CI, lint, AGENTS.md). Not for renames, typos or version-independent logic, and never for copying source code.
license: MIT
metadata:
  version: "0.1.0"
  author: mimic
---

# Mimic

You are about to produce something a human will judge against the best projects in its
category. Your own defaults are the weakest possible reference: they are what every model
writes. This skill replaces "I think a good README looks like this" with "here are three
comparable projects, here is what their READMEs actually contain, and here is what ours
will contain and why".

The failure this skill exists to prevent is **confident invention** — a plausible-looking
conventions section, a stack recommendation, a star count, a license, an implementation,
all generated from memory. Every one of those is checkable, and a human will check.

## The one rule

> Every statement you make about a repository must trace to something you actually read:
> an API response you fetched, a file you opened, or a page you visited in this session.

If you did not read it, you may not assert it. Write "not checked" or "not found". A short
honest report beats a complete fabricated one.

## Modes

Pick exactly one mode, then read the reference files it names before doing anything else.

| If the question is | Mode | Read |
|---|---|---|
| "What stack / library / architecture should we use?" | **stack** | [reference/mimic-stack.md](reference/mimic-stack.md) |
| "How should we implement X? What shape should this module take?" | **implementation** | [reference/mimic-implementation.md](reference/mimic-implementation.md) |
| "Write / fix / restructure our README, docs, CONTRIBUTING" | **artifact** | [reference/mimic-readme.md](reference/mimic-readme.md) |
| "How should this repo be organised? commits, CI, lint, agent rules" | **conventions** | [reference/mimic-conventions.md](reference/mimic-conventions.md) |

Every mode also requires the three shared references. Read the ones that apply:

- [reference/selecting-repos.md](reference/selecting-repos.md) — **always**. How to find genuinely comparable projects instead of the most popular ones.
- [reference/evidence.md](reference/evidence.md) — **always**. How to record and label what you found, and how to spend a bounded research budget.
- [reference/licensing.md](reference/licensing.md) — **before writing anything derived from another project**. What you may take, and the hard lines.

If the request spans modes ("pick our stack and write the README"), do them in order and
finish the first one before starting the second. Do not blend them into one pass.

## The loop

1. **Frame.** Restate the goal in one sentence. Ask at most three questions, and only ones
   that change which projects count as comparable. If the request is too vague to identify
   a category, say so and ask — do not start searching.
2. **Select.** Name the capability you are missing before you search — searching your own
   stack returns peers, not teachers. Find 3–5 comparable projects using
   [selecting-repos.md](reference/selecting-repos.md), covering more than one knowledge layer.
   Record why each was included and what was rejected. Comparability beats popularity.
3. **Read.** Shallow-read all of them (metadata, README, root tree, dependency manifest);
   deep-read at most two. Fetch, never recall. Cache what you fetch. See
   [evidence.md](reference/evidence.md).
4. **Decide.** Separate repository facts from your own judgement, and label each one.
   State what you will adopt, what you will deliberately not adopt, and why. Run the
   license gate in [licensing.md](reference/licensing.md) before adopting anything.
5. **Write and self-check.** Produce the artifact — a real file on disk, not a chat
   suggestion. In implementation mode the artifact is the changed source plus its
   provenance block. Then run the completion gate below and report it.

## Completion gate

Do not report success until every line holds. Report the gate itself as part of your answer.

The first item decides whether the work was worth doing. Everything after it is about doing
it honestly.

- [ ] **Substance.** At least three claims in the artifact are specific and checkable — a
      number, a name, a path, a version, a date, or a quoted line, each traceable to a fetch.
      Test: delete every proper noun and number; if the artifact still reads complete, it is a
      template. A run can pass every other item here and still produce nothing; see
      [evidence.md](reference/evidence.md).
- [ ] 3–5 comparable projects, each with a stated reason for inclusion.
- [ ] At least one rejected candidate, with the reason for rejection.
- [ ] Every repository claim traceable to a file or API response read in this session.
- [ ] Facts and judgements visibly separated.
- [ ] License checked for every project whose content influenced the result.
- [ ] No source code copied. Structure and conventions only.
- [ ] The artifact exists on disk and you name its path — a written file, or in
      implementation mode the changed sources plus a provenance block.
- [ ] An explicit "adopted / deliberately not adopted / reason" list.
- [ ] Remaining uncertainty named rather than smoothed over.

## Hard lines

- **No network, no answer.** If you cannot reach GitHub or the web, say so and stop. Do not
  reconstruct repositories, stars, licenses, or directory trees from memory. Say what you
  would have checked.
- **Never copy code.** Read how a project structures something; write your own
  implementation. License compatibility is a permission question, not a permission to copy
  — see [licensing.md](reference/licensing.md). In implementation mode this is enforced by
  the clean-room two-step in [mimic-implementation.md](reference/mimic-implementation.md):
  describe the pattern in your own words first, close the source, then write.
- **Never let one project be the answer.** A single admired repository is a taste, not a
  convention. Three is the floor.
- **Never mimic decoration.** Emoji headers, badge walls, and colour schemes are not
  conventions. What transfers is structure and commitments: what sections exist, what each
  promises, what a newcomer can do after reading.
- **Write files.** If the deliverable is a README, the deliverable is `README.md` on disk.
  Unless the user explicitly asked for advice only.

## Anti-patterns

| Anti-pattern | What it looks like | Do instead |
|---|---|---|
| **A template with a clean conscience** | Every process item passed; the output names nothing, numbers nothing, shows nothing | The substance gate at the top of [evidence.md](reference/evidence.md) |
| **Peer-only slate** | Every comparable is another project in your own stack | Name the capability you lack, then search that discipline's vocabulary — [selecting-repos.md](reference/selecting-repos.md) |
| Popularity theatre | "Top 5 by stars" | Filter by comparability, then report maintenance and license |
| README-only archaeology | Claiming to know the architecture from the README | Open the tree, the manifest, and the entry point |
| Consensus by assertion | "Most projects use X" | Name which projects, and cite the file that shows it |
| Template transplant | Pasting a famous repo's README structure wholesale | Adopt sections that fit this project; name what you dropped |
| Silent staleness | Presenting a 2019 repo as current | Report `pushed_at` and archived status for every candidate |
| Fabricated precision | "12.4k stars, MIT" with no fetch | Fetch it or write "not checked" |
