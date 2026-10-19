# Assets: acquire the materials, not just the ideas

Research tells you what good looks like. It does not give you the font, the icons, the
texture, the 3D model, the sound, or the library that a competent human would simply
download. A model that studies five comparable projects and then hand-draws every element in
code ships a convincing imitation of standard material — and it costs more, looks worse, and
is harder to change.

The rule of this file: **a human ships with downloaded materials. Default to acquiring; treat
hand-making as a fallback you justify in one line.**

## 1. The decision order

Before writing a line of asset code, walk this order and stop at the first hit:

1. **Library or package** that already does it (a charting lib, an animation lib, a physics
   lib, a date lib). Do not reimplement a solved problem, and do not reimplement it "smaller".
2. **Asset pack**: a font, an icon set, a texture set, a model, an audio clip — with a licence
   that permits shipment.
3. **A reference implementation to adapt** in your own code, if the licence allows it
   (structure and parameters are fine; see `licensing.md`).
4. **Hand-make it** — always last, and say why in the report: "no licence-clean asset found in
   the time box" or "the brief forbids network assets" or "it must be procedurally generated".

If you skip steps 1–3 without looking, you did not make a decision; you repeated a habit.

## 2. Where the materials are

| Need | Channels | Usual licence | Notes |
|---|---|---|---|
| JS library | npm / unpkg / jsDelivr, GitHub releases | per package | Pin the exact version. Read the lockfile of a comparable project to learn what the ecosystem actually uses. |
| Font | Google Fonts, Fontsource, the foundry's own repo | OFL / Apache-2.0 per family | Self-host `woff2` in the repo; never rely on a webfont URL staying up. |
| Icons | Lucide (ISC), Tabler (MIT), Heroicons (MIT), Bootstrap Icons (MIT), Material Symbols (Apache-2.0) | per set | Use an icon set, not emoji, in anything a human will judge. |
| Photo / image | Unsplash, Pexels, Openverse, Wikimedia Commons | free licences, **verify per file** | Attribution is cheap; write it down even when not required. |
| Texture (PBR) | Poly Haven (CC0), ambientCG (CC0) | CC0 | Take the whole set: albedo, normal, roughness, metalness, AO. |
| HDRI / lighting | Poly Haven (CC0) | CC0 | A real HDRI fixes flat lighting faster than any hand-tuned rig. |
| 3D model | Poly Haven (CC0), Kenney (CC0), Quaternius (CC0), Khronos glTF sample assets (per model) | CC0 / mixed | Prefer glTF/GLB. Check for Draco/meshopt compression before wiring a loader. |
| Audio | Freesound (per file), Pixabay, jsfxr (MIT) | **verify per file** | Freesound licences vary clip by clip; read the clip page, not the site footer. |
| Shaders / post FX | three.js examples (MIT), pmndrs/postprocessing (Zlib) | per package | Vendor the exact file you use; example code changes between versions. |
| Reference interface | real shipped products, design galleries | n/a | Read for structure and hierarchy; never copy pixels, markup or copy. |

Licences change and collections differ per file. One fetch to confirm beats an assumption you
will have to defend later.

## 3. The licence gate

| Verdict | Licences |
|---|---|
| **Ship** | CC0, Unlicense, MIT, ISC, BSD-2/3, Apache-2.0, OFL |
| **Ship with attribution** | CC-BY-3.0/4.0 — carry author, title, URL and licence in the manifest and, where the medium allows, in the artifact |
| **Check carefully** | CC-BY-SA (share-alike applies to the asset, not usually to your code, but say so), GPL/AGPL assets in a permissive project |
| **Do not ship** | NC, ND, "personal use only", "free for evaluation", no licence file at all |

No licence file means **all rights reserved** — not "probably fine". If you cannot settle the
licence in one fetch, pick a different asset. Two minutes of searching beats a takedown.

## 4. Record every file: the manifest

Next to the artifact (or in `assets/CREDITS.md`), keep a table with one row per acquired file.
No rows means you acquired nothing, which is a finding you should state, not hide.

```markdown
## Assets

| File | Source | Version / commit | Licence | sha256 (first 12) |
|---|---|---|---|---|
| assets/fonts/Inter.var.woff2 | github.com/rsms/inter | v4.0 | OFL-1.1 | 9f2c41ab77de |
| vendor/three.module.js | npm three | 0.160.0 | MIT | 1c9d0a7b3e21 |
| assets/tex/asphalt_02_1k.hdr | polyhaven.org | 2024-05 | CC0-1.0 | 44ab9e01c7d2 |
```

Write the source URL you actually fetched — not the site's home page. Write the version the
file really is (the tag, the npm version, the commit), not "latest".

## 5. Verify it arrived

A 200 response is not an asset. Check, in this order:

1. **Hash.** Compute `sha256` after download and compare with the manifest row.
2. **Magic bytes.** `wOF2` (woff2), `89 50 4E 47` (png), `FF D8 FF` (jpeg), `glTF` (glb),
   `#?RADIANCE` (hdr), `ID3`/`FF FB` (mp3), `RIFF` (wav/webp), `00 61 73 6D` (wasm). An HTML
   error page saved as `.png` is the classic failure.
3. **Load test.** Import the module, decode the image (and check its real dimensions), parse
   the model, and render it once.
4. **Look at it.** Screenshot the result and open the image. The asset must be visible, at the
   right scale, not a grey placeholder.

## 6. Vendor it; never hotlink "latest"

- Download into the project (`assets/`, `vendor/`, `public/`) and commit it, or reference an
  exact pinned version URL (`https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js`).
- Never ship `@latest`, `main`, or an unversioned CDN path in a deliverable: it works today
  and breaks silently later.
- If the deliverable must be a single self-contained file, inline what is small (a subset font,
  a compressed texture, a stripped library build) and say what was dropped. Base64 inlining
  costs bytes, not licence compliance.

## 7. Budget, and what a refusal looks like

Time-box acquisition at roughly **10 minutes per asset class**. If nothing licence-clean
turns up, stop and hand-make it — then record the search and the fallback in one line:

> `Icons: searched Lucide, Tabler, Heroicons for the four glyphs needed; none matched the
> outline style, so they are drawn as inline SVG paths (12 lines) in the same stroke weight.`

A recorded fallback is a decision. An unrecorded one reads as laziness, and it hides the fact
that a better asset was one search away.

## 8. When hand-making is the right answer

- The brief explicitly requires a self-contained, offline, single-file deliverable.
- The element is genuinely bespoke: a procedural shader, a data-driven visualisation, a piece
  of generated art where the generation *is* the point.
- The only candidates carry licences that contaminate the user's project.

Say which of these applies. "It was easier" is not one of them.

## 9. Anti-patterns

- Forty canvas-drawn neon signs when one display font and three SVG marks would read better.
- Emoji standing in for icons.
- CSS gradients pretending to be materials.
- Inventing font names that do not exist ("Inter Display Ultra").
- Copying a library's source instead of importing the library.
- Hotlinking `latest`.
- Downloading an asset and never checking that it loaded or that the licence allows it.

## 10. Report line

Every run that acquired anything ends with:

```markdown
## Materials

| Acquired | From | Licence | Verified |
|---|---|---|---|
| Inter var (font) | rsms/inter v4.0 | OFL-1.1 | sha256 + rendered |
| three r160 | npm three | MIT | pinned + rendered |

Rejected: Poly Haven `street_04` (right mood, 40 MB — too heavy for a single page).
Hand-made: the neon sign glyphs (no matching icon set; drawn as SVG paths).
```

If nothing was acquired, say so and say why. An empty table with no explanation is the same
failure as an unsourced claim.
