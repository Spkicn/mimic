# Mode: artifact (README, CONTRIBUTING, docs)

Use when the user is unhappy with a written artifact and wants it to look like the good
projects do. The deliverable is the file itself, on disk. Not a proposal. Not a chat answer.

## Step 1 — inventory the comparable READMEs

For each of the 3–5 comparable projects, list the **headings in order** and what each one
promises. Do not summarise the prose; extract the contract.

| Project | Section order | Notable commitment |
|---|---|---|
| owner/a | logo → one-liner → badges → why → install → quick start → API → examples → contributing → licence | quick start is copy-pasteable, no clone |
| owner/b | one-liner → status → install → usage → config table → licence | API table with types |

Then compute the pattern:

| Section | a | b | c | d | e | Verdict |
|---|---|---|---|---|---|---|
| one-line value prop | ✓ | ✓ | ✓ | ✓ | ✓ | **Mandatory** |
| install | ✓ | ✓ | ✓ | ✓ | ✓ | **Mandatory** |
| quick start / usage | ✓ | ✓ | ✓ | ✓ | ✗ | **Mandatory** |
| badges | ✓ | ✓ | ✗ | ✓ | ✓ | Optional |
| API reference | ✗ | ✓ | ✓ | ✗ | ✓ | Depends on artifact type |
| contributing | ✓ | ✗ | ✓ | ✓ | ✓ | Recommended |
| licence | ✓ | ✓ | ✓ | ✓ | ✓ | **Mandatory** |

A section present in some but not all is an **option you choose**, not a convention you
inherit. A section present in all of them is the actual convention. Say which is which.

## Step 2 — the structural rules that survived the comparison

These hold across essentially every well-regarded README; treat a comparable set that
violates one as evidence about that project, not a licence to violate it.

1. **Front-load the value.** The first two lines say what it is and who it is for. No
   history, no vision statement, no table of contents before the point.
2. **Quick start is copy-pasteable.** A reader with nothing installed reaches a working
   result without cloning, without reading source, without editing a path.
3. **Claims are checkable.** Benchmarks name the machine and the command. "Blazing fast"
   with no number is decoration.
4. **Badges are minimal and true.** A build badge for a CI that does not run is worse than
   no badge. Cap at roughly 4–6.
5. **Every link resolves.** Relative links to `CONTRIBUTING.md`, `LICENSE`, docs. A broken
   link is the fastest way to look unmaintained.
6. **It states its licence.** One line near the bottom, linked.
7. **It says what the project is not**, when the category invites confusion.
8. **Length follows the surface.** A CLI tool needs install + usage + flags. A library needs
   an API surface. Do not pad to match a famous project's length.

## Step 3 — choose for this project

Write the adopted outline **before** writing prose, and note the deliberate omissions:

```
Adopted:   one-liner · install · quick start · config table · contributing · licence
Omitted:   screenshots (no UI yet) · API reference (no stable API) · benchmarks (unmeasured)
Adapted:   owner/b's config table → we have 3 options, inline list is clearer
```

This list goes in the report. Omission with a reason reads as judgement; silent omission
reads as an oversight.

## Step 4 — write it

- Write in the voice of the project, not of a model. Short sentences. No "In today's
  fast-paced world", no "Let's dive in", no emoji headers unless the comparable set
  genuinely uses them.
- Prefer the concrete over the abstract: exact command, exact output, exact file path.
- Verify every command you write is one that exists in this repo. Run it if you can.
- Do not invent features, benchmarks, badges, or support channels.
- If a fact is unknown (a measured benchmark, a screenshot), leave a clearly marked
  `<!-- TODO: -->` rather than plausible filler.

## Step 5 — self-check

- [ ] File exists on disk; path reported.
- [ ] A newcomer can go from zero to running using only the README.
- [ ] Every code block is runnable as written, and its output language tag is correct.
- [ ] Every relative link resolves.
- [ ] No sentence is copied or lightly reworded from a source project.
- [ ] Adopted / omitted list written, with reasons.
- [ ] Licence line present and correct for this project.

## Same procedure, other artifacts

- **CONTRIBUTING.md** — compare how comparable projects gate contributions: PR checklist,
  commit convention, changeset requirement, review expectations. Adopt the gate that
  matches how many contributors this project actually has. A solo project adopting a
  200-contributor governance process is cargo cult.
- **docs/** — compare structure (tutorials / how-to / reference / explanation, or
  docs-as-code layout). Adopt the directory shape, write the content from scratch.
- **ARCHITECTURE.md** — compare diagrams and section order; never copy the diagram.

## Anti-patterns

| Anti-pattern | Fix |
|---|---|
| Reproducing a famous README's prose | Adopt the section contract; write new prose |
| Badge wall | 4–6 true badges, or none |
| Emoji headings because a popular repo uses them | Check whether the comparable set agrees first |
| Padding to look substantial | Length follows the surface |
| Documenting features that do not exist yet | Mark as roadmap, or omit |
| A screenshot of someone else's UI | Never; capture your own or leave a TODO |
