---
name: mimic
description: Use when an artifact, implementation or page should follow what excellent projects actually do rather than the model's own habits. Triggers on "find similar projects on GitHub and see how they do it", "模仿", "参考同类开源项目", "别人是怎么写的", "how should we implement this", "what's the idiomatic way to do X", "how is this normally structured", "benchmark against comparable repos", "make our README look professional", "how should we organise this repo", and when a page or interface must land with a human ("make this actually good", "this looks generated"). Five modes - stack, implementation shape, written artifacts (README/CONTRIBUTING/docs), repository conventions, and design register for artifacts judged by their effect. Not for renames, typos or version-independent logic, and never for copying source code.
license: MIT
metadata:
  version: "0.9.5"
  author: mimic
---

# Mimic


You are about to produce something a human will judge against the best examples in its
category. Your own defaults are the weakest possible reference: they are what every model
writes. This skill replaces "I think a good one looks like this" with "here are comparable
projects, here is what they actually do, and here is what this one will do and why".

Two failures are measured, and they are different:

- **Confident invention** — a plausible conventions section, a stack recommendation, a star
  count, a licence, an output sample, all from memory. Every one is checkable, and a human
  will check.
- **Inert presence** — every feature exists and does nothing: a density switch with no CSS
  behind it, a "today" metric counting 24 hours, a dialog that drops focus, a page passed by
  all 22 presence checks that is missing its margins.

This document is organised so that the cheapest, most reliable measures come first. Read the
core, run the verification layer, and only then reach for the optional design work.


## The one rule

> Every statement you make about a repository, a machine or your own artifact must trace to
> something you actually read or ran in this session: a file you opened, an API response you
> fetched, a command you executed, a measurement you took.

If you did not read or run it, you may not assert it. Write "not checked" or "not found". A
short honest report beats a complete fabricated one.


## The core — twelve lines that carry the measured wins

Every round that separated the skill from an unaided arm traces to one of these. The rest of
this document is their expansion.

1. **Comparables.** Read 5–7 comparable projects. For each: why it is comparable, why at least
   one was rejected, and its licence. Structure and commitments only — never copy text or code.
2. **Trace.** Every factual claim carries a trace to something read or run this session. A
   sample output is *produced by running something*, or labelled illustrative inside the
   artifact. "The improvement is the lie": dropping a commit prefix, inventing a believable
   sha, rounding a version — that is fabrication in its most expensive form, because a reader
   copies the block and gets different behaviour.
3. **Absence needs a scope.** "No CI" is unfalsifiable; "no workflow files under
   `.github/workflows/`" is checkable. Write paths from the directory where the **reader**
   stands, not from yours. Any number you write is recounted once and agrees with every other
   number in the artifact.
4. **Steps are replayed, not reviewed.** If the artifact tells a reader to run something:
   extract every command out of its fences into a numbered list, check each environment one
   needs (a `venv` created and never entered, or a Windows variant shown only as a `#`
   comment, is a step that cannot work as written), run them in a clean copy, and record the
   count of commands you had to add. A guide that was never executed is a hypothesis; say so
   if you could not run it.
5. **Nothing dead-ends.** Every state the artifact can put a reader in has an exit that
   works: the button stays usable, the panel closes, the promised next step exists. A pause
   is a promise of a resume (a toast cleared on `mouseenter` with no `mouseleave` is a toast
   that never leaves).
6. **Controls demonstrably change what they claim.** Toggling a setting, applying a filter,
   opening a panel must change what renders — **measured**, not read from the code. Labels
   match their counting window ("today" is since midnight, not 24 hours). Counts distinguish
   the states they name ("open" is not "unacknowledged").
7. **Contrast measured, on the smallest text, in every theme.** 4.5:1 normal, 3:1 large —
   computed against the real composited background, both light and dark. A page can pass with
   its headings and fail on every 10 px muted label.
8. **Layout rules are applied, and the gutter is measured.** A class selector that carries the
   page's padding, max-width or centring must be carried by an element. `.main { padding: 30px
   34px; max-width: 1220px; margin-inline: auto }` written against `<main id="main">` is dead
   CSS: content sits flush against both window edges while every presence check passes. Check
   dead selectors mechanically **and** measure the rendered inset at the narrowest width. "No
   horizontal overflow" is about the content; the gutter is about the layout.
9. **Focus lands somewhere visible after every exit.** Escape, close button, confirm, and any
   action that re-renders the row it came from. Assert `document.activeElement` is visible and
   not inside a closed dialog. A dialog that closes onto a `render()`-rebuilt list loses the
   focused node silently and drops a keyboard user back to `<body>`.
10. **Honesty is structural.** Simulated data is labelled simulated. A promise in the copy has
    code behind it ("saved" that persists, "retries every 15 minutes" that the log shows).
    Facts and judgements are visibly separated.
11. **Say what you adopted, what you deliberately rejected, and why — and name the one
    decision you trust least.** A list of things done is not a judgement.
12. **Run your checker and write down what you did not check.** An unrun check is a claim.

A ten-line distillation of this document was measured against it: same cost, same shippable
quality, with this document winning only on the striking register and on briefs that need
design judgement. So: the core is the floor. Do not let its brevity talk you out of the
optional sections when the task is judged by effect.


## Where to look — channels, not just GitHub

GitHub is one channel. The best available evidence depends on what you are imitating, and a
decision grounded in two independent channels is worth more than one grounded in ten repos of
the same genre:

| Channel | Best for | Watch for |
|---|---|---|
| Similar repositories (source, not README claims) | implementation shape, repo conventions, artifact structure | popularity bias; the same genre converging on the same average |
| Official docs, for the exact version you ship | APIs, configuration, supported behaviour | prose that contradicts the packaged source |
| Specification / RFC / protocol text | wire formats, required behaviour, error semantics | implementing the spec the library deviates from |
| Installed package source (`node_modules`, `site-packages`, `vendor`, lockfile) | what actually runs at this version | minified or transpiled builds; ignored files |
| Changelog, release notes, issue threads | migration paths, known breakage, why the API is odd | advice for another major version |
| Starters, templates, scaffolds | a working skeleton with the right file layout | abandoned templates; another ecosystem's conventions |
| Precedent inside the target repository | the house style already accepted here | copying a local mistake into a new place |

Read before you cite; never paste a URL you did not fetch. When two channels disagree, name
both and follow the one closest to the version in the lockfile. Copy patterns, not prose.

## Modes

Pick exactly one mode, then read the reference files it names before doing anything else.

| If the question is | Mode | Read |
|---|---|---|
| "What stack / library / architecture should we use?" | **stack** | [reference/mimic-stack.md](reference/mimic-stack.md) |
| "How should we implement X? What shape should this module take?" | **implementation** | [reference/mimic-implementation.md](reference/mimic-implementation.md) |
| "Write / fix / restructure our README, docs, CONTRIBUTING" | **artifact** | [reference/mimic-readme.md](reference/mimic-readme.md) |
| "How should this repo be organised? commits, CI, lint, agent rules" | **conventions** | [reference/mimic-conventions.md](reference/mimic-conventions.md) |
| "Make this page / interface land with a human" | **design register** | the register section below; use the artifact references for conventions |

Every mode also requires the shared references that apply:

- [reference/selecting-repos.md](reference/selecting-repos.md) — **always**. How to find genuinely comparable projects instead of the most popular ones.
- [reference/evidence.md](reference/evidence.md) — **always**. How to record and label what you found, and how to spend a bounded research budget.
- [reference/licensing.md](reference/licensing.md) — **before writing anything derived from another project**.

If the request spans modes ("pick our stack and write the README"), do them in order and
finish the first before starting the second. Do not blend them into one pass.


## Read next

Everything below is one level deep and routed from here; nothing else needs loading.

- [reference/selecting-repos.md](reference/selecting-repos.md) — **always**. Comparability axes, search strategy, what makes a candidate wrong.
- [reference/evidence.md](reference/evidence.md) — **always**. E1–E4 evidence levels, budget, record format.
- [reference/licensing.md](reference/licensing.md) — **before writing anything derived from another project**.
- [reference/mimic-stack.md](reference/mimic-stack.md) — mode: stack.
- [reference/mimic-implementation.md](reference/mimic-implementation.md) — mode: implementation.
- [reference/mimic-readme.md](reference/mimic-readme.md) — mode: artifact.
- [reference/mimic-conventions.md](reference/mimic-conventions.md) — mode: conventions.
- [reference/mimic-design.md](reference/mimic-design.md) — when the artifact is judged by its effect: the design register, the memorable opt-in, specs and instructions.
- [reference/mimic-gate.md](reference/mimic-gate.md) — the verification layer, the completion gate, the hard lines and the anti-patterns.
- [reference/mimic-evidence.md](reference/mimic-evidence.md) — the measured record: what this buys, what it does not, and how the number was obtained.

## Before you deliver

1. Every claim in the artifact traces to a file, a command output or a fetch you made in this session.
2. The check ran where the reader will read it, not where it was convenient to run.
3. Something was measured while the interaction was still happening, not only after it ended.
4. The report names the weakest part, in one line, without being asked.

The full gate, including the items that only apply to pages and interfaces, is in
[reference/mimic-gate.md](reference/mimic-gate.md).
