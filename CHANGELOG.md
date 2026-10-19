# Changelog

All notable changes to this repository. The version lives in two files —
`skills/mimic/SKILL.md` (`metadata.version`) and `.claude-plugin/marketplace.json`
(`metadata.version`) — and `node scripts/validate.mjs` fails when they disagree.

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
