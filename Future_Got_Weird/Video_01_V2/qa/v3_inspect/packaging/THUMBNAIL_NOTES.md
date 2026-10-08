# Thumbnail: inspection and recommendation (V3 packaging audit)

**Recommendation: thumbnail A, "SO SURE. SO WRONG."** It needs one required fix and one recommended small change:

- **Required: correct the slip text.** The current source misquotes the published excerpt. The fix is
  `Thumbnails_minimal_fix.patch`.
- **Recommended: make the correction readable at small size.** In the `ThumbA4` prototype (a variant of A), the
  slip is marked the way the film marks it: yellow highlighter on the invented title and a coral ring on 2002. One
  large WRONG stamp sits across the title. The prototype is in `Thumbnails_A2_A3_A4_prototypes.patch`. Previews:
  `thumbA4_fixed_1280.jpg` (1280×720, 133 KB) and `thumbA4_fixed_320.png`.

If the owner prefers no visual change at all, apply only the minimal fix and use `thumbA_fixed_1280.jpg`.

## What was inspected

| Item | Facts |
|---|---|
| `thumbnails/thumbnail_{A,B,C}.{png,jpg}` (pass 2, 7 Oct 17:04–17:16) | 1920×1080. PNG 328–418 KB, JPG 217–243 KB. No text chunks or EXIF. They were rendered from the pass-2 source before V2 changed the slip data |
| `source/src/Thumbnails.tsx` `ThumbA/B/C`, registered in `src/Root.tsx` as 1920×1080 `<Still>`s | **They still render** with the current components: `npx remotion still src/index.ts ThumbA/B/C …`, Remotion 4.0.533, no errors (`thumbA.png`, `thumbB.png`, `thumbC.png` here). **The rendered text is wrong (see below)** |
| Sizes tested | Each render was downscaled with Lanczos to 1280×720 (YouTube's recommended size) and to 320×180 (a small mobile or sidebar tile). The 320×180 comparison sheets are `sheet_320_new_vs_pass2.png` (current renders vs pass 2) and `sheet_320_fixed.png` (fixed renders and the A2/A3/A4 prototypes) |
| Brief's direction | A confident original illustrated character presents a polished answer, and a large visible correction exposes the error. One focal scene, short text such as **SO SURE. SO WRONG.** No glowing brain, no owner photograph, no tiny screenshot essay. The opening must deliver the example quickly |

## Defect found: the thumbnails no longer quote the excerpt verbatim

V2 split the ChatGPT slip's text into more pieces in `components/v2/AnswerSlip.tsx`:
`pre / year / mid / uni / mid2 / title`, where `mid` is now `' at '`, `uni` is `'CMU'` and `mid2` is
`') is entitled: '`. `Thumbnails.tsx` still assembles each slip as `pre + year + mid + title + post`. Effects:

- **ThumbA and ThumbB (current source):** they print "Adam Tauman Kalai's Ph.D. dissertation (completed in 2002 at
  "Boosting, Online Algorithms, and Other Topics in Machine Learning."". The words "**CMU) is entitled:**" are
  missing, and the opening parenthesis is never closed. The text is labelled as a dated published excerpt
  ("ChatGPT · GPT-4o · 9 May 2025"), so it has to be verbatim.
- **ThumbC (current source and the pass-2 file):** slip 0 has the same gap. The DeepSeek and Llama slips also print
  the year before the title ("2005 . . . at Harvard University in "Algebraic Methods…"" and "2007 . . . in
  "Efficient Algorithms…" at MIT."). The published order is title, then the ellipsis, then the year. **This
  reordering was already in pass-2 `thumbnail_C`.**
- **Pass-2 `thumbnail_A` / `thumbnail_B` files** still show the correct full ChatGPT excerpt. They were rendered
  before the V2 data change. So the delivered pass-2 A file is textually correct, but re-rendering it from the
  current source reintroduces the error.

**Fix (`Thumbnails_minimal_fix.patch`, 30 lines, dry-run applies cleanly to `source/src/Thumbnails.tsx`):**
`SlipText` prints slip 0 as `pre, year, mid, uni, mid2, title, post`, and slips 1–2 as `pre, title, mid, year,
post`. That is the same order as `AnswerSlipArt`, the art the film itself uses. The fixed renders are
`thumb{A,B,C}_fixed*.png/jpg`. They were checked visually and the text now matches the film's slip at 0:30.

## Judgement at 1280×720 and 320×180

| Candidate | 1280×720 | 320×180 | Against the brief |
|---|---|---|---|
| **A** (pass 2 / fixed) | Headline clear. Clerk grinning, holding a polished, dated slip; the invented title is filled coral | Headline clear. The coral title block reads as "marked". **The WRONG stamp is about 7 px tall and does not read.** The stamp is the `Slip` default, 40 px on a 1920 canvas | Fits: one focal scene, confident presenter, "SO SURE. SO WRONG." The **correction is not "large"** |
| A2 (prototype) | Large stamp, but coral stamp over the coral title fill | Stamp muddy (coral on coral) | Rejected: low contrast |
| A3 (prototype: the film's own `AnswerSlipArt` scaled up) | Exactly the film's object, ringed year and CMU, stamp. Portrait card, last line ("Learning.”") clipped by the card's bottom edge, as it also is in the film | Stamp reads | Good continuity, but the clipped title line is a flaw. Depends on the slip-art fix below |
| **A4** (prototype, recommended) | A's wide slip, full verbatim text, yellow highlighter on the invented title, coral ring on 2002, 108 px WRONG stamp across the title | **Headline and WRONG both read.** Slip body is texture, as intended | Fits fully: confident presenter, large visible correction, one focal scene, marking matches the opening |
| B "IT MADE THIS UP" | Readable. The magnifier lens washes out the middle of the title. The character is the sceptical fact-checker | Headline reads. Slip is texture | Second choice. It is not the "confident presenter + correction" image the brief describes |
| C "3 ANSWERS. ALL WRONG." | Three small slips. Top slip's stamp clipped at the right edge (pass-2 file); quotes reordered | Slips are illegible | **Rejected:** this is the "tiny screenshot essay" the brief rules out, and its quotes are reordered |

Promise vs opening: the film shows this ChatGPT slip from about 0:07. It is stamped at about 0:16 ("None of them are
right") and shown under the title card at 0:29–0:31 with the same yellow highlight, coral ring and WRONG stamp.
A4 therefore makes a promise the first 30 seconds keep. The headline does not repeat the title ("Why AI Is So
Confidently Wrong"), and the two work together.

## Producing the final file (after the source patch is applied by the lead)

```bash
cd source
npx remotion still src/index.ts ThumbA4 ../thumbnails/thumbnail_V3_A4_1920.png          # or ThumbA after the minimal fix
ffmpeg -y -i ../thumbnails/thumbnail_V3_A4_1920.png -vf scale=1280:720:flags=lanczos -q:v 2 \
  ../thumbnails/Future_Got_Weird_Video_01_V3_thumbnail.jpg
```

(Or render it directly at 1280×720 with `--scale=0.6667`. A `--scale=2` render downscaled to 1280 gives slightly
crisper type.) If it is promoted, rename `ThumbA4` to `ThumbA`. The prototype patch also adds `ThumbA2` and
`ThumbA3`; drop those two.

**YouTube requirements:** 1280×720 (16:9, minimum width 640 px), JPG, PNG or GIF, under 2 MB. All candidates here
come out at 126–140 KB as JPG (quality 92) and 260–310 KB as PNG at 1280×720, so they are well under the limit. The
pass-2 files are 1920×1080. YouTube accepts and rescales them, but deliver 1280×720.

**Anonymity:** no owner-identity term appears in `Thumbnails.tsx`, the pass-2 thumbnail files or any render here.
The PNG and JPG files carry no text chunks or EXIF. Everything on them is the original cast, the dated published
excerpt and the channel's palette. No logos, real faces or personal branding.

## Related item for the visual audit (not changed here)

The film's own `AnswerSlipArt` (`SLIP_W 360 × SLIP_H 280`, `overflow: hidden`, 23 px serif for slip 0) clips the
last line of the invented title. "Learning.”" is cut by the card's bottom border in the review render at 0:30.0
(S2 title card) and 4:28.5 (S10). The words are still guessable, and the V3 brief asks for the false title to be
easy to identify. A taller card, or 1 px less leading, would show the line in full. If A3 were chosen, it would
inherit the same clipping.
