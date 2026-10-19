# The verification layer, the completion gate, and the hard lines

Loaded from `SKILL.md`. The order matters: measure first, then decide whether the
artifact is finished.

## The verification layer

Prose cannot settle a factual claim; execution can. In every measured round, the checks that
separated arms were the ones that ran something.

- **Prefer a command to a reading.** "Is a declared dependency never imported", "do the
  documented flags exist", "does the sample match the renderer", "is this class carried by an
  element" — these are scripts, not careful reading. Proving a negative is what scripts are for.
- **Mechanical checks before judgement.** A static checker plus a headless browser probe beats
  three readers for presence, structure, contrast, geometry and dead selectors. Measured: a
  dead `.main` rule survived 22 checks and three blind judges, and a human found it in ten
  seconds — the check exists now; the judges' eyes do not.
- **Replay for anything with steps.** See the replay section.
- **Screenshots are not evidence for you.** If you cannot read images, do not claim to have
  seen the page; measure computed styles, geometry, contrast and pixels instead, and say which.
- **Report the gate itself.** "All checks passed" without the list is a claim, not a report.


## Completion gate

Do not report success until every line holds. Report the gate itself.

- [ ] **Substance.** At least three claims are specific and checkable — a number, a name, a
      path, a version, a date, a quoted line, each traceable to a fetch or a run. Test: delete
      every proper noun and number; if the artifact still reads complete, it is a template.
- [ ] 3–5 comparables, each with a stated reason for inclusion; at least one rejected, with
      the reason; licence checked for every one that influenced the result.
- [ ] Every repository claim traceable; every sample output produced or labelled illustrative.
- [ ] Every absence scoped; every path written from the reader's directory; numbers agree.
- [ ] Steps extracted and replayed from a clean copy — or the artifact says they were not.
- [ ] Nothing dead-ends; code backs every promise; every pause has its resume.
- [ ] Every control was measured to change what it claims; labels match windows; counts match
      states.
- [ ] Every gesture was measured **while the input was still held**. A drag that applies only on
      release, a wheel that only lands on the next click, a state that animates only after
      `pointerup`: all broken, even when the final state is right. Sample the state between moves
      with the button down; never read the gesture's result after release and call it verified.
- [ ] **Looked at.** At least one render of the artifact was opened and studied before delivery, at
      every width you claim, and the report names one thing the picture showed that the numbers did
      not. A claim about appearance no image was checked against is unverified — that is how a base
      that was never added stayed "green", and how six red lanterns became white bulbs.
- [ ] Each screenshot is of the state it claims: a responsive claim comes from a **fresh load at
      that width**, not from resizing the page you just interacted with (the carried camera fakes
      clipping).
- [ ] Contrast measured on the smallest text in every theme; no text under AA.
- [ ] Layout rules applied and the rendered gutter measured at the narrowest width; no
      horizontal overflow at the widths you claim.
- [ ] Every layout idiom you adopt has a breakpoint: a bottom sheet / drawer / tab bar built for
      the narrow width is switched off (or justified in one sentence) at desktop, with the panel's
      measured geometry reported at both widths.
- [ ] If the brief calls the object miniature / compact / collectible, the frame is measured: the
      object fills it with margin (an empty half-frame is a defect, not a mood), the near-black share
      is small, and the brief's noun stays singular — a "street corner" is one corner, not a
      junction of four blocks that reads as a city district.
- [ ] Every constant the brief pins (size, pitch, count, position, colour) is re-derived from the
      built artifact after the last decorative pass and still exactly true; every value your
      verification hook exposes is computed from the live object, not typed.
- [ ] Focus visible after every exit, including exits that re-render.
- [ ] If judged by effect: the moment of use is named, the truth is live, exactly one
      non-obvious choice is defensible, and the register line is written.
- [ ] The artifact exists on disk and you name its path.
- [ ] Adopted / deliberately rejected / reason list; the least-trusted decision named.
- [ ] The checker you have was run; what you did **not** check is written down.


## Hard lines

- **No network, no answer.** If you cannot reach the web, say so and stop. Do not reconstruct
  repositories, stars, licences or trees from memory. Say what you would have checked.
- **Never copy code.** Read how a project structures something; write your own. Licence
  compatibility is a permission question, not permission to copy.
- **Never let one project be the answer.** A single admired repository is a taste, not a
  convention. Three is the floor.
- **Never mimic decoration.** Emoji headers, badge walls and colour schemes are not
  conventions. What transfers is structure and commitments.
- **Write files.** If the deliverable is a README, the deliverable is `README.md` on disk,
  unless the user explicitly asked for advice only.


## Anti-patterns

| Anti-pattern | What it looks like | Do instead |
|---|---|---|
| **A template with a clean conscience** | Every process item passed; the output names nothing, numbers nothing, shows nothing | The substance gate above |
| **Improvement smuggled as observation** | The sample output is tidier than what the program prints — prefix dropped, sha invented, version rounded | Run it and paste what came out, or label it illustrative |
| **Inert presence** | Feature exists, control does nothing the eye can see | Measure the effect; if nothing changes, cut or fix it |
| **Dead CSS / dead reference** | A styled class nothing carries, a click target that is a `<span>` | Check selectors against markup, and measure the rendered result |
| **Peer-only slate** | Every comparable is another project in your own stack | Name the capability you lack, search that discipline's vocabulary |
| **Popularity theatre** | "Top 5 by stars" | Filter by comparability, then report maintenance and licence |
| **Consensus by assertion** | "Most projects use X" | Name which projects, cite the file that shows it |
| **Unscoped absence** | "no CI / no licence / no tests" | Name the path you looked at |
| **Symmetry over judgement** | Every section equally weighted, nothing emphasised | One non-obvious right choice; let the rest be quiet |
