# Design register and artifact-level guidance

Loaded from `SKILL.md` when the brief asks for something a human will judge by its
effect rather than by its presence. Read the evidence for each rule before
generalising it to a new medium.

## Design register (when the artifact is judged by its effect)

A page, a landing section, a diagram, a demo: correctness is the floor, and the floor is the
core above. The ceiling is not a longer checklist — more rules measurably made pages **plainer**
while barely changing the score (a 12-line rule block moved the composite by +0.02 on a 0–1
scale and suppressed transitions, live clocks and real charts). What follows is the small
number of things that repeatedly decided the striking axis.

**Find the moment of use the brief never names.** Every brief describes a screen; almost none
describe the moment a person is in when the screen matters: the end of a run, the failure, the
first run, the thing that is lost. The winning artifacts put their signal there — the completion
state as a whole-surface change, the countdown as the headline, the status as a live deadline
("15 min target · 3 min left") rather than a table cell. The spec cannot see this moment; the
designer has to name it.

**Make the truth live.** A dashboard's ages tick; a countdown derives from a deadline, not a
decrementing counter; progress comes from wall-clock start, not a frame loop; the theme is
applied before first paint, not 30 ms after. Measured winners: pre-paint theme script, ages
refreshed every 60 s, a chart drawn to fit its host and redrawn on resize, an undo that really
restores the previous state. Measured losers: a fixed timestamp rendered as "today", a saved
light theme that paints dark first, a stat card that never changes.

**Commit to one channel the user cannot avoid.** Instead of adding chrome, move the signal into
the place they are already looking: the whole surface, the document title, the one number that
dominates the screen. Two recurring winning shapes: **a subtraction** (remove the progress bar
and let the numeral be the only thing that changes), and **channel commitment** (the ending is a
viewport-wide change, not a toast).

**Exactly one non-obvious right choice.** A page needs one decision a competent generic
implementation would not have made, and it must be defensible in one sentence. More than one
and the page becomes a portfolio; none and it is a template with good spacing. Name it.

**Do not decorate.** Count accent colours as a question — more than about three on a one-page
artifact usually means decoration competing with signal — but do not gate on restraint: in the
recorded comparisons, decorative restraint was inside chance as a predictor, and on truth-telling
briefs the winner sometimes spent *more* colour to encode the truth.

**Keep the brief's numbers through the decoration.** Every visual apparatus you add — a ground
planes, outlines, shadows, a vignette, a texture — needs room, and the easy way to make room is to
quietly move the numbers the brief pinned. Measured case: a 53-voxel scene where the decorative pass
shrank every cube to 0.94 units on a 1.06 pitch and then translated all three groups off the brief's
stated centres so they would still sit on the ground; the blind judges gave it the striking axis 3/3
and the shippable axis 0/3 — the page looked the best and was the least correct. The order is fixed:
**satisfy the brief's literals, then decorate, then re-derive every literal from the built scene and
compare.** If a decoration needs the constants to move, move the decoration.
Diagnostics are part of this: a value you expose for verification must be *computed* from the live
objects, never typed (a hardcoded `voxels: 53` survives every refactor and certifies nothing), and a
canvas field must report the drawing buffer in device pixels, not CSS pixels — at DPR 1 the two are
identical and the lie is invisible.

**Adopt an idiom only at the breakpoint where it is idiomatic.** A bottom sheet, a drawer, a tab
bar, a swipe action: each is a mobile pattern, and each reads as a defect when it is still in force
on a desktop. Measured case: a 600 px panel with an 18 px top-only radius, flush with the bottom of a
1440×900 viewport — written deliberately (`align-items: flex-end` on the scrim, no desktop rule to
switch it), and read by the human reviewer as "the dialog ran to the bottom; is that a bug?". Three
blind judges had rewarded it as the page's striking choice because they measured "a real bottom
sheet at 375" and never asked what it does at 1440. If you adopt a pattern for the narrow width,
write the rule that ends it at the wide width, and measure the panel's geometry at both.

**Write the register line.** "The brief asked for X; I added Y because of the moment at Z; I
rejected W." That sentence is the difference between a design decision and a mood.


## If the artifact has to be memorable (opt-in)

Use only when the deliverable is judged on its effect — a page, a landing section, a diagram,
a demo — and only after the fact checks above. It costs two to five times a normal artifact.
Each step produces a file; a step with no artifact did not happen.

1. **De-noun the target.** At most eight sentences on what it must do for its user, relational
   verbs only, with a list of banned nouns. Nouns drag you back to the nearest exemplar.
2. **Generate k ≥ 3 sources before assessing any.** Disjoint domains, chosen before you know
   which will work. Assessing early turns three sources into three versions of one source.
3. **Map relations; keep both unmapped columns.** The rows you cannot map are the productive
   ones: they say what the target has that the source lacks.
4. **Rank by the unmapped target**, not by source richness.
5. **Move the goal.** Restate the brief in the source's vocabulary and diff against the
   original: which subgoal appeared, which metric changed, which constraint dropped. **Empty
   diff means the analogy was decoration — delete the work and restart.**
6. **Warrant each action and swap-test it.** Which relation licenses it, what assumption it
   smuggles, does swapping the source change it? If not, the decision came from the exemplar.

Then take at most one structural decision from the ledger and trace it to a row. Write the
seam: the mapping usually warrants the *shape*, not the detail.

Measured twice and the results disagree: first it placed first on both axes under two judges
(11 of 12 choices agreed); then across three briefs it won one, lost one and split one. The
claim that survives is narrow — the protocol makes one structural decision visible, traceable
and defensible; it does not reliably beat an equally expensive non-analogical reflection.

**The reflection alternative (same cost, no ledger):** constraints as runnable tests; six
failure modes in the user's tense; three directions, reject two with reasons; decide the
brief-silent points with reasons that are not preference; name the weakest decision and what
would falsify it. It wins where the brief's question is "what is actually true or lost here?"
(a status panel, a destructive confirmation, a zero-result page) and the winning sentence is a
specific admission the analogy cannot manufacture. **These steps do not need a document** — the
arm given nine lines and told to answer shape-or-substance at the top built the page three
judges ranked first for striking, unanimously. Write down only what you would otherwise skip:
the rejected directions and the decision you trust least.

Choosing between them: ask what would embarrass the artifact. Wrong about itself — what this
page *is*: shape breaks first, use the analogy. Wrong about the world — what was lost, what
matched, what dies: substance breaks first, use reflection. A blind classifier matched every
recorded outcome but on unseen briefs simply agreed with "always reflect"; treat the question as
a description, not a lever.


## If you are writing a spec instead of the artifact

A spec that hands work to someone else fails differently. Measured once: the spec arm invented
**zero** facts — its forbidden-claims list killed the fabrication class — and still lost 16/25 to
22/25, because all eight of its defects were **locational**: paths written from the workspace,
copied verbatim into a document that lived one directory lower, so the reader's `pip install -e .`
landed where there was no `pyproject.toml`. The facts were audited; the frame was not.

- **State the reader's frame, not yours.** Where the deliverable lives, what paths in it mean,
  what "from the repo root" resolves to.
- **Say who removes the side effects you authorise.** `pip install -e .` creates three
  `pip-build-env-*` directories; if nobody owns the cleanup, a clean-tree check fails quietly.
- **Ask for the report, not the check.** A worker that runs checks silently is a worker whose
  checks nobody audits — an arm that claimed ten passes had failed one.
- **Keep two checks generic.** Path resolution and length cost nothing and catch the dimension
  you did not list.


## If the artifact tells someone to do something

The moment a document contains commands, it makes a claim about a machine. Reading cannot
settle it; replay can.

1. Copy the project somewhere clean. Hand the reader exactly one document — no other context.
2. Follow it literally, in order, recording every command and its exit code. Where it is
   ambiguous, take the most literal reading and record the choice.
3. Stop at the documented outcome. Count the commands you had to add that the document does
   not contain. That count is the defect score: correct is zero.

Extract the steps first (numbered list out of the fences): two failure classes are visible
without running anything — an environment created and never entered, and a second platform
offered only as a `#` comment. Measured: 2 of the 3 corrections literal replays needed were
caught this way; the third (a missing test dependency) only by executing.

Replay beats a rubric: in a measured pair, two judges rated the same documents 21 and 19 out of
25 with the ranking flipping, while replay separated them 1 vs 2 corrections at about a tenth
the cost.

**You cannot replay your own document.** You will silently repair the broken line and report
success. Measured: the author's replay scored zero corrections; a blind reader of the same text
had to fix the activation line first. If no independent reader is available, report it as not
replayed.
