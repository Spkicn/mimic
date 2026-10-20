# Changelog

All notable changes to this repository. The version lives in two files —
`skills/mimic/SKILL.md` (`metadata.version`) and `.claude-plugin/marketplace.json`
(`metadata.version`) — and `node scripts/validate.mjs` fails when they disagree.

## 0.10.6 — 2026-10-20

- **The delivery report is still owed after the checker passes.** A live run under the new
  deployment loaded mimic at call 1, read two references, ran `dsq` twice — then delivered
  without naming the moment of use or the single non-obvious choice. Cause: the rule lived in
  a reference file read 60 calls earlier, while the only thing still in front of the model at
  delivery was the checker's `PASS`. So the rule moved to where it is met: item 3 of
  `Before you deliver` in the body, and the same contract in the checker's footer.
- Design pass stated as a separate obligation: a passing checker is not a design pass; it sees
  dead CSS, contrast and buffered gestures, never taste.
- Deployment hygiene (outside the skill): twenty stale `mimic-v*` snapshot copies sat inside
  `~/.dsh/skills/`, and an arm globbed `mimic-v0.4.0` in a live run. They are archived out of
  the skills root so the only copy a model can find is the current one.

## 0.10.5 — 2026-10-20

- No spoken licence warning. The owner asked for copying to be silent ("抄之前说一句义务也不想要"):
  the obligation now lives in the report's `Obligation` column and the commit message, never as
  a conversational warning. Rule 6 became "record it; do not lecture".
- **The copy check** is now a standing step before the first new file, not an option: search
  the dependencies, lockfile, sibling packages and already-linked libraries for the thing you
  are about to write; read the licence; compare the integration surface with the lines you
  would write; then copy, adapt the ideas, or write. `reference/mimic-implementation.md` opens
  with it, and rule 1 of `licensing.md` says the question is asked every time.
- **Adaptation is explicit.** Copy step 4 became a checklist: project vocabulary, its error
  strategy and logging, remove foreign configuration, delete dead paths, match formatting and
  types, wire into existing modules and tests, and list every adaptation. An unmodified copy
  where the project needed changes is unfinished work.

## 0.10.4 — 2026-10-19

- Copyleft and unlicensed code are no longer refused. The repository owner explicitly asked for
  this boundary to be opened ("放开这个边界", 2026-10-19) and takes the risk; the skill's
  job is now to make the risk visible rather than to block it. A GPL/AGPL/LGPL copy states its
  obligation to the user before the copy, and an unlicensed copy is recorded as carrying no
  permission; both land in the `## Copies` table alongside the MIT/BSD rows.
- `reference/licensing.md`: the compatibility table's "No" cells became "Yes, with the
  obligation recorded"; rule 1 loses "when it is licensed"; rule 6 is now "flag, then do what
  was asked". `mimic-implementation.md` copy step 1 and the provenance line carry the
  obligation. `mimic-gate.md` hard line: a copyleft copy means the obligation was stated.
- `SKILL.md`: description says "licensed code, with provenance and obligations noted"; the
  comparables rule allows the copy when the user accepts the obligation.

## 0.10.3 — 2026-10-19

- Copying source code became a first-class path. The old hard line ("never copy code",
  clean-room only) made the skill pay for a rewrite whenever a permissively licensed file
  already did the job. `reference/licensing.md` now decides by licence, not by sentiment:
  MIT/BSD/Apache-2.0/MPL/CC0 code may be vendored with its copyright header kept and a
  `## Copies` provenance row (destination → source@sha:path → SPDX → header kept →
  sha256[:12]); copyleft or unlicensed code is read for ideas and reimplemented. Prose stays
  off limits either way.
- `reference/mimic-implementation.md`: the clean-room two-step became "two ways to land a
  shape" — a five-step copy path and the three-step reimplement path — plus a `Way:` and
  `Copies:` line in the provenance block.
- `reference/mimic-gate.md`: hard line rewritten, checklist item added. `SKILL.md` comparables
  rule now allows licensed copying with provenance; the description says so, so the skill is
  no longer advertised as research-only. The README comparison row matches.
- Evals: one trigger for "find comparables and vendor what is usable" and one negative for
  plain file copying, so the new vocabulary routes here and ordinary copy/paste does not.

## 0.10.2 — 2026-10-19

- `SKILL.md`: a two-line pointer at the top saying where the depth is. When a deployment's system
  prompt already names `reference/`, the right move is to open that file, not to load the skill;
  loading stays worth it only for the routing. Measured reason: on this host the skill sat in the
  injected catalog of two real agent sessions and was loaded zero times, so the standing
  obligation now lives in the preset persona and the skill stays the packaged index.
- Whitespace: five vestigial double blank lines collapsed; the 150-line budget is enforced by the
  validator and this file now sits at it.

## 0.10.1 — 2026-10-19

- `SKILL.md`: the description now names the visual/creative case directly — "the work is judged
  by how it looks — a page, interface, 3D scene or demo" — with a Chinese example. Reason: the
  catalog entry is the only thing a model sees before it decides to load a skill, and a request
  to build a scene ("做一个微缩场景") did not match "artifact, implementation or page",
  so the skill was never loaded even though it covered the work. No workflow change.
- `description` trimmed back under the host's 1024-character limit; marketplace.json bumped with
  the skill.

## 0.10.0 — 2026-10-19

- `reference/mimic-assets.md`: new. The skill researched what good work looks like but left the
  model to hand-make every material; a human shipping the same project downloads a font, an
  icon set, a texture, a model and a library. The new file carries the decision order (library
  → asset pack → reference implementation → hand-make), a channel table with typical licences,
  the licence gate (ship / ship-with-attribution / check / refuse), the `CREDITS.md` manifest
  format, arrival verification (sha256, magic bytes, load test, look at it), the
  vendor-don't-hotlink rule, a 10-minute time box with a recorded fallback, and the cases where
  hand-making is genuinely correct.
- `SKILL.md`: **the materials rule** section (5 lines) plus the reference routed from the modes
  list; the description now carries the acquisition vocabulary ("找素材", real icons / fonts /
  textures / models) so the skill routes on it.
- `evals/evals.json`: two acquisition triggers, one negative ("download this PDF"), and one
  quality case requiring a named library, an acquired asset with its licence, a manifest row, a
  load verification, and an explicit list of what was still hand-made and why.
- `README.md` / `README.zh.md`: the new reference added to the repository tree.

## 0.9.7 — 2026-10-19

- `SKILL.md`: the three shared references were listed twice (once under **Modes**, once under
  **Read next**). They now appear once; the second list covers only the mode files.
- `evals/evals.json`: "design a nicer landing page for the docs site" was listed as a
  should-not-trigger case while the description advertises exactly that design-register mode.
  Replaced with a concrete bug report ("the footer link to the privacy page 404s").
- `scripts/validate.mjs`: the link check skipped fenced code blocks, so a link shown as example
  syntax is no longer reported as a broken route.

## 0.9.6 — 2026-10-19

- `reference/evidence.md`: new **"Where an instruction lives"** — a pre-registered ablation
  measured the same formal directive at 0.81 when placed at both ends of the per-step
  runtime-context snapshot, 0.56 at the tail only, and 0.012 when the instruction was carried
  by the system prompt (baseline 0.014). A rule that must hold every step belongs in the
  per-step context; a checkable wording rule beats an identity narrative (0.77–0.82 vs 0.13).
- `SKILL.md`: the evidence pointer now names that finding.

## 0.9.5 — 2026-10-19

- Skill: a new **"Where to look — channels, not just GitHub"** table in `SKILL.md` (seven
  channels: source of similar repositories, official docs for the shipped version,
  specification text, installed package source from the lockfile, changelog/releases/issues,
  starters and templates, and precedent inside the target repo), with the rule that two
  independent channels outrank ten repos of the same genre and that a pattern is copied,
  never prose.
- `reference/selecting-repos.md`: degraded mode rewritten — a dead channel means use another
  channel, not stop and not remember; a failed fetch is a fact about the tool, retry once
  before declaring the source gone.

## 0.9.4 — 2026-10-19

- Skill: this is the working copy that twenty-four measured rounds produced, and the first
  port of it to this repository. The twelve-line core, the design register, the completion
  gate and the evidence paragraphs all come from pre-registered A/B runs whose results are
  recorded in `skills/mimic/reference/mimic-evidence.md`.
- Reference split, so `SKILL.md` stays inside the 25–150 band: new
  `reference/mimic-design.md` (design register, the memorable opt-in, specs and
  instructions), `reference/mimic-gate.md` (verification layer, completion gate, hard lines,
  anti-patterns), `reference/mimic-evidence.md` (the measured record). Every file is routed
  from `SKILL.md`, and the validator proves it.
- Gate items added from executed failures, not from taste: a control that exists and does
  nothing; a gesture measured only after release; a claim the artifact's own code
  contradicts; a CSS class the markup never uses; an environment-selection claim checked
  against the configuration that selects it.
- Measured, and written down honestly: six pre-registered large-task A/Bs gave
  +0.40, +0.02, +0.42, 0.00, −0.40, 0.00 (mean +0.07, noise ±0.42). The skill buys claim
  discipline and defect coverage, not perceptual quality — the model that decides what
  "good" looks like is still the bottleneck.
- Routing and evals are unchanged; the description now covers the page/interface register as
  well.

## 0.3.0 — 2026-10-17

- Validator: the marketplace version and every declared skill's `metadata.version` must be
  equal. Two hand-edited copies of one number drift the first time only one is bumped.
  Three new fixtures cover the agreeing pair, the drift, and the missing version.
- CI: a `plugin` job installs the Claude Code CLI and runs `claude plugin validate .`. The
  validator proves the manifest parses; only the host's CLI proves it is installable.
- Evals: a fourth quality case for the pressure prompt — "don't research it, just write it
  from experience" — which is the request the skill exists to refuse.
- Docs: this changelog, and the version rule added to `AGENTS.md`, `CONTRIBUTING.md` and the
  pull-request template.

## 0.2.0 — 2026-10-17

- Probe: status-aware failures (a 401 or a 5xx is no longer reported as a missing
  repository), unauthenticated retry after a rejected token, best-effort cache writes, real
  evidence timestamps on cache hits, bounded `--json`, commit SHA in the evidence header,
  every fetched manifest rendered, `--paths`/`--no-cache`, argument validation.
- Routing: BM25 normalised by the prompt's IDF mass instead of a prompt-only TF-IDF vector,
  a corrected negative-case message, a recalibrated no-match floor.
- Tests: `scripts/probe.test.mjs` (17 offline fixtures) and `scripts/eval-routing.test.mjs`
  (13 fixtures over sibling catalogs); CI runs both, the parser on every script, and the
  installers on Linux and Windows.
- Installers: `install.sh --project` parses correctly and `--help` prints help rather than
  source lines; `install.ps1` gained `-Help`.
- Validator: host limits (`name` ≤ 64 chars, `description` ≤ 1024 chars) and README
  structure parity between the English and Chinese files, both with fixtures.

## 0.1.0 — 2026-10-06

- First working release: one skill, four modes (stack, implementation, artifact,
  conventions), seven reference files, the fetch-before-you-claim rule, and the evidence,
  licence and completion gates.
- `mimic-probe.mjs`: cached GitHub fetcher with README truncation and manifest excerpting.
- `scripts/validate.mjs` plus offline fixtures, and the Tier-2 routing check.
