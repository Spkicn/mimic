# Selecting comparable repositories

The entire result is capped by this step. Choose badly and every later step produces a
well-argued imitation of the wrong thing.

## Comparability first, popularity never

Relevance is a property of the problem, not of the star count. Two projects are comparable
when **at least two** of these hold:

| Axis | Comparable when |
|---|---|
| Problem | It solves the same user problem, even with a different shape |
| User | It serves the same audience (library author vs end user vs operator) |
| Workflow | The user journey or the core loop is recognisably the same |
| Scale | Similar team size / codebase size / maturity, so its choices are affordable here |
| Constraints | Similar deployment target, licence posture, budget, or platform limits |

A 60k-star project that solves a different problem is not comparable. A 400-star project
that solves exactly your problem is. Say which axes matched, per project.

## Search in the market's own words

Do not search for your internal vocabulary — nobody names their repository after your
ticket. Search for the words the field uses.

- **Topic and keyword search.** Query the domain term, the artifact type, and the
  mechanism: `"static site generator"`, `"rate limiter"`, `"cli task runner"`.
- **Dependency reverse-lookup.** If you already lean toward a library, find who depends on
  it — those projects share your constraints and are the best comparable set.
- **Awesome lists and curated indexes.** Good for discovery, bad for evidence. Use them to
  generate candidates, then judge each candidate yourself.
- **Issue and discussion search.** "How do I do X" threads surface the projects people
  actually reach for, and the pitfalls, which no README admits.
- **Follow the citations.** A comparable project's README often names its peers in a
  "prior art" or "alternatives" section. That is a hand-curated comparable set.

## Search for the layer you are weak in, not the layer you work in

The default search is the one that fails. Querying your own stack or your own problem returns
**peers** — projects that look like yours — and peers show you what things look like, not what
makes them good.

| Kind | Found by | Teaches | Example |
|---|---|---|---|
| **Peer** | your problem or your stack | conventions, layout, structure | `--topic=remotion` |
| **Craft source** | the name of the discipline behind your weak layer | parameters, technique, why it feels right | `--topic=motion-graphics`, `--topic=kinetic-typography` |
| **Canon** | the platform or format itself | what the API actually does, at HEAD | `remotion-dev/remotion` `packages/example` |

A peer tells you which sections a README has. A craft source tells you the easing curve, the
stagger offset, the duration. Those are different kinds of knowledge in different
repositories, and the second set is not reachable from the first set's vocabulary.

### Say the deficit out loud first

Write one sentence: *what am I actually missing?* The words in that sentence are your search
terms.

- "I need to make a promo video" names a **deliverable**. It finds peers.
- "my motion has no designed rhythm" names a **capability**. It finds craft sources.

If the sentence names a tool, you have named a peer. Keep rewriting until it names a
capability, then search the capability's own vocabulary rather than the tool's.

### Record which layer each candidate serves

Add a `layer` column to the slate. A slate of five peers and no craft source cannot answer a
craft question, and you will not notice until after the work is built.

### Worked failure

A 27-second product video was researched entirely under `--topic=remotion`. That returned
peers, and they were good ones: one scene per file, `Root.tsx` doing registration only, fonts
and layout constants in a single module. All of it was adopted, the film passed the whole
completion gate, and it still read as a slideshow.

The knowledge that fixed it — enter with ease-out `cubic-bezier(0.16, 1, 0.3, 1)`, fragments
400–600ms, list stagger 40–80ms capped near 700ms per group, mask reveal over a plain fade,
and a Primary / Secondary / Ambient layer model — was in none of them. It lived under
`motion-graphics` and `kinetic-typography`, in repositories that contain no video project at
all.

Cost: two complete rebuilds before the search vocabulary changed.

## The candidate slate

Aim for 3–5, chosen deliberately rather than by rank:

- **2–3 core comparables** — same problem, same class.
- **1 adjacent** — solves a neighbouring problem with a transferable approach.
- **1 counter-example** — a project that made the opposite choice, so the decision has a
  visible alternative. Label it as such.

Record at least one rejected candidate and why. A slate with no rejections means no
filtering happened.

## Exclusion criteria

Reject, and say why, when any of these hold:

- **Archived, or no commit in ~12 months** — unless you are deliberately mining it as a
  historical counter-example.
- **No licence file** — you cannot tell what is permitted. Treat as all rights reserved.
- **A demo, tutorial, or course project** — its conventions are pedagogical, not
  production, and will mislead.
- **Single-author weekend project under ~100 commits** presented as if it were a standard.
- **An "awesome-" list or a link farm** — it is an index, not a project.
- **Vendored mirrors, forks without divergence, or generated code.**
- **Not actually the same domain**, even if it is famous and adjacent-sounding.

## What to capture per candidate

Fetch — with `scripts/mimic-probe.mjs` or the GitHub API — and record:

| Field | Why it matters |
|---|---|
| `full_name`, URL | Traceability |
| `description` | Confirms the problem match |
| `stargazers_count` | Context only, never a selection reason |
| `pushed_at`, `archived` | Currency. A stale project's conventions may be history |
| `license.spdx_id` | Required before adopting anything |
| `language`, `topics` | Confirms the ecosystem |
| Root tree | Reveals layout conventions directly |
| Dependency manifest | The actual stack, not the README's claims about it |
| README | The artifact you are imitating, when in artifact mode |

Do not report a field you did not fetch. `pushed_at` and `license` are exactly the fields a
model is most tempted to invent and most likely to be wrong about.

## Degraded mode

If GitHub is unreachable, stop and report it. Name the queries you would have run and the
axes you would have used. Do not fall back on remembered projects — recalled repository
facts are indistinguishable from confabulation and are the single most damaging output of
this skill.
