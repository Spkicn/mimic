# Licensing: what you may take from another project

Read this before writing anything derived from another repository. This is the step every
comparable AI skill skips, and it is the step that turns a helpful assistant into a legal
problem for its user.

## The line

Copyright protects code and prose; a licence is the permission to copy them. If another project
already solved the problem under a permissive licence, copy the file — keep its copyright
header, record where it came from, and change only what the brief needs. Under a copyleft or
absent licence, the ideas are still yours to use; the expression stays off limits.

| You may | You may not |
|---|---|
| Copy code from a permissive source, keeping its copyright header | Copy code from a copyleft or unlicensed source |
| Copy files, modules and directory trees from a permissive source, with provenance | Copy files from a source whose licence is unread or unclear |
| Learn a README's "Install → Quick start → API → Contributing → Licence" shape and reproduce it | Copy another project's README prose, or lightly reword it |
| Reimplement an idea in your own code | Copy doc comments or prose wholesale |
| Cite a project and link to it | Present another project's work as your own |

**Ideas are not protected; expression is.** The licence decides which is which, not sentiment.
When the licence is silent, treat the code as all rights reserved and reimplement the idea.

**Parameters are facts, not expression.** A duration, an easing curve, a stagger offset, a
threshold, a type size — these are measurements, not someone's writing. Adopt them, cite where
they came from, and implement them in your own code. Copying the number is not copying the
code; copying the function that produces it is. Do not let this rule make you vague: an
adopted parameter with a source is better than an invented one with none.

## Licence compatibility

Check the source project's licence *before* adopting anything from it, and record the SPDX
id. If a project has no `LICENSE` file, treat it as **all rights reserved** — read it for
ideas, adopt nothing, and say so.

| Source licence | Adopting structure/ideas into a permissive project | Copying code into a permissive project |
|---|---|---|
| MIT / BSD / Apache-2.0 | Fine | Permitted with attribution and notice handling; Apache-2.0 adds a patent grant and NOTICE requirements |
| MPL-2.0 | Fine | File-level copyleft: modified MPL files stay MPL |
| LGPL-3.0 | Fine | Only under dynamic-linking conditions; usually not worth it |
| GPL-3.0 | Fine | **No** — the whole derivative must become GPL |
| AGPL-3.0 | Fine | **No** — and network use triggers the obligation |
| Unlicensed / "all rights reserved" | Fine | **No** |
| Public domain / CC0 / Unlicense | Fine | Permitted |

This table is a screening aid, not legal advice. When the answer changes the user's
obligations, say so plainly and let them decide. Never silently copy code because "it was
probably MIT".

## Rules for this skill

1. **Copy when it is licensed and cheaper.** Rewriting a hundred lines to dodge an obligation
   a header and a credit satisfy is wasted work. Reimplement when the licence forbids copying,
   or when the source drags in a dependency or an abstraction you do not want.
2. **Attribute what you adopted.** In the produced artifact, or in the accompanying report,
   name the projects whose conventions you followed. Credit is cheap and it makes the
   reasoning auditable.
3. **Never copy prose.** Do not reproduce more than a short quoted fragment (a heading, a
   single sentence as evidence) from any README, doc, or comment.
4. **Copied code carries provenance.** Source URL at a commit SHA, the file path, the SPDX id,
   the copyright header line kept in the file, and a sha256 of the file you started from. A copy
   without provenance is indistinguishable from a leak; a copy with it is normal engineering.
5. **Licence of the output.** The artifact you write belongs to the user's project, and
   inherits that project's licence — not the source projects'.
6. **Flag, do not decide.** If the user's project is GPL/AGPL and a source is too, note the
   interaction. If the user's project is proprietary, say when an adopted convention came
   from a copyleft project, even though conventions themselves carry no obligation.

## Report line

Include this in every run that adopted anything:

```markdown
## Licence check
| Source project | SPDX | What we adopted | Obligation triggered |
|---|---|---|---|
| owner/repo | MIT | section order for README | attribution only |
| owner/repo2 | GPL-3.0 | none (ideas only) | none |

## Copies
| Destination file | Source | SPDX | Header kept | sha256[:12] |
|---|---|---|---|---|
| src/util/retry.ts | owner/repo@<sha>:src/retry.ts | MIT | yes | 3f9a1c2b0d4e |
```

If code was copied and the `## Copies` table is missing, the provenance is incomplete — a
reviewer cannot tell the copy from something invented.

If the table is empty, you have not actually checked. An empty table is a finding, not a
formality: report "no project influenced the output" explicitly.
