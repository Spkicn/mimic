# What mimic buys, and what it does not

Loaded from `SKILL.md` when you need the measured record behind a rule: the
pre-registered A/B series, its variance, and the honest limits of this skill.

## What this buys, and what it does not

Measured blind, same model, same repository, only the skill differing: **0 false claims against
3**. All three false claims came from one invented sample block, and that was enough to make the
document untrustworthy.

**How far the floor lifts depends on the task.** On a repository built to punish invention, 0 vs
3. On a real repository with a real suite and an arm that actually ran what it wrote: **0 vs 0**.
Expect the skill to matter most where facts are hard to check and least where the environment
answers back. Do not quote the good number without the second.

**What the whole series says in one number (twenty-three rounds).** Across six pre-registered large-task
A/Bs the registered composite came out **+0.40, +0.02, +0.42, 0.00, −0.40, 0.00 — mean +0.07 with per-run
noise of ±0.42**. Both arms passed every mechanical check in all six cells, so the entire split was judged. The
same runs produced the project's most useful directional fact: a sighted human preferred the skill page
in **3 of 3** blind rounds, including the round where the composite was negative. Judges reading source
and geometry reward literal conformance and punish off-brief numbers; a reader rewards depth, hierarchy
and a surface whose numbers are alive. Both readings are reproducible; only the second is what a page is
for. On one harder brief the decoration that made the page striking was also what moved the brief's own
constants (voxels 0.94 on a 1.06 pitch) and lost the shippable axis 0/3 — hence the rule above about
re-deriving literals after the last decorative pass.

**A gate item is not a measurement method.** On the rainy-Hong-Kong diorama round (no call cap, ≈330 calls
on the skill side, 811 KB page) the skill arm delivered the more elaborate atmosphere and a camera that did
not move while the pointer was down: `updateControls()` called `applyCamera()` only when a `changed` flag was
set, and the pointer-move and wheel handlers never set it, so every gesture landed on release. Two of three
blind judges failed 合格 at 0.85 and 0.88 confidence; the registered composite was **−0.40** against a bare
page built with about a third of the calls. The arm's own report had verified "drag moved camPos 28.3 units"
— measured after release. The rule was already in the gate; the measurement was taken at the wrong moment.
Hence the item above: sample the state while the input is live.

**The visual channel is the instrument.** The next round gave both arms eyes (screenshots plus
`read_image`) and a one-pass 13-check verifier, and cost fell from ≈330 calls and 3.9 h to ≈170 calls
and 52 min on the skill side. Both arms then found, before delivery, a defect no number had seen: one
page's `buildPlinth()` was never called from `init()` while its `__diag.base` kept reporting a base —
a self-reported measurement is a claim, not a measurement — and the other page's neon flicker flattened
hue through `setRGB(k,k,k)`, turning six red lanterns into white bulbs. The judged round split 3/3 by
axis: the smaller, literal one-corner page won 合格 (7.2 % near-black against 31.7 %, a wood-and-brass
plinth that stays in frame), the more ambitious page won 氛围 (a real planar reflection, `FogExp2`, a
horizon glow). Composite **0.00**. Two lessons: look at the render at every width you claim before you
deliver, and measure the frame when the brief says miniature — a four-block junction photographs as a
city block, not as a collectible corner.

**A screenshot must be of the state you claim to measure.** In that round my own harness captured the
375 screenshot after the interaction pass, so it inherited the dragged camera and both pages looked
clipped at the frame edge. Three judges independently reloaded cold at 375, found both pages complete,
and refused to score the artefact. If the claim is "at 375 the model fits", the shot must come from a
fresh load at 375 — resizing the page you just dragged keeps the wrong camera.

**It does not raise taste.** Which projects are the right teachers, and which of their choices
fit this one, is judgement, and no checklist supplies it. On a real repository, against the
maintainers' own guide, the skill's document made 2 false claims out of ~45 and the maintainers'
made 1 false plus 3 rules found nowhere in the repository — and two judges preferred ours on all
four axes, with the load-bearing caveat that the baseline was a supplementary page, not a root
guide. On a larger front-end task, the judged advantage moved between +0.40 and 0.00 across two
runs of the same comparison; the honest interval is wide, and the reliable part is the
mechanical layer.

**What actually moves the number** (measured across twenty-two rounds): execution checks and claim
discipline, then replay, then mechanical probes. Rule lists and protocols move it by 0–3 points
and, on the striking axis, can make the artifact plainer. Length is not the expense — a 10-line
card and a 394-line document cost the same — but length is also not the lever.

**The correction that came from eyes.** After one comparison was written up, a human looked at
the two pages for ten seconds and found the defect every instrument had passed: the skill arm's
`.main` rule was never carried by its `<main id="main">` markup, so every block sat flush against
the window edges. Twenty-two checks, three blind judges (text only) and both linters passed it.
The layout and gutter item exists because of that, and it is the only reason the class is
catchable at all. Assume your instrument cannot see the first-glance defect; measure geometry,
and if you can, ask a human to look.
