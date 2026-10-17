# Changelog

All notable changes to this repository. The version lives in two files —
`skills/mimic/SKILL.md` (`metadata.version`) and `.claude-plugin/marketplace.json`
(`metadata.version`) — and `node scripts/validate.mjs` fails when they disagree.

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
