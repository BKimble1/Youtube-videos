# V4 final QC: "They Read a 2,000-Year-Old Scroll Without Opening It"

**Master:** `exports/FGW_SCROLL_V4_FINAL_PUBLISH_1920x1080.mp4`
SHA-256 `623f97eec2487c0a4ca0286bc4a2a0bb9fdc08c48060abc3037886a051a941c7`. The file is Git-ignored. Five checksummed
parts are in `backup/`; to restore it, run
`cat backup/FGW_SCROLL_V4_FINAL_PUBLISH_1920x1080.mp4.part_* > exports/FGW_SCROLL_V4_FINAL_PUBLISH_1920x1080.mp4`.

**Captions:** burned in. The same cues are also in `captions/FGW_SCROLL_V4_FINAL.srt` (identical to V3's).

**Render:** composition `ScrollV4` (`source/src/v3/`), `bash tools/render_v4.sh`. The V3 narration mix is unchanged
(`audio/mix/FGW_Scroll_V3_mix.wav`).

**Scope:** cleanup only. No scene was redesigned, retimed or re-animated, and the narration was not regenerated.

## 1. Rounded labels removed

I reviewed the full V3 master at 1 fps (`qa/v4/review_v3/`) and listed every capsule or boxed text element.

| V3 element | Where | V4 |
|---|---|---|
| "Reconstruction" pill, upper right | 0:12–0:20, 0:29–2:20 | **Removed everywhere** |
| "PHerc. 1667" pill with dot | 0:06–0:08, 2:15–2:20 | Plain unboxed small text under the roll |
| "4.9 cm" / "2.0 cm" pill | 0:15–0:19 | Plain unboxed text under the width arrow (the sourced measurement) |
| "ink" / "papyrus" pills inside the cutaway | 1:05–1:10 | **Removed** (the narration names them) |
| "ink" / "papyrus" pills under the two compared samples | 1:11–1:13 | Plain unboxed text: the only way to tell the two identical-looking squares apart |
| "PHerc. Paris 4" pill with dot | 1:32–1:48 | Plain unboxed small text beside the roll (marks the switch of artifact) |
| "≈ 1.4 m · 4½ ft" pill | 1:49–1:59 | Plain unboxed text under the scale bar |
| White rounded quote card with source line | 2:05–2:14 | **Removed.** The quote is already in the caption, and its source moves to the closing credit. |

**Checked in V4:**
- `qa/v4/review/` (1 fps, the whole film): no capsule or oval text anywhere.
- `qa/v4/upper_right_every5s.png` (upper-right corner at full resolution, every 5 s): empty of labels throughout.
- No `<Chip>` capsule is rendered by any V4 scene (source search).

**Kept, as asked:**
- The burned-in subtitles (their dark rounded caption boxes).
- The authentic column-19 Greek and its highlight.
- The column-count marks.
- The ≈ sign between the two scan samples.

## 2. Attribution and disclosure

- **Disclosure:** unboxed "Illustrated reconstruction", small, at the top left, shown twice:
  - over the eruption and opening scenes (0:08.8–0:13.8), so the history isn't taken for footage;
  - over the first scan imagery (0:29.3–0:33.7), so it isn't taken for real data.
- **Second-scroll figure:** "Reconstruction after Angelotti et al. 2026, Figs. 2–3" stays under the PHerc. Paris 4
  figure, as in V3 (unboxed).
- **Closing credit**, on the final hold (2:18.6–2:20.8), unboxed:
  - "Translation: PHerc. 1667, column 19"
  - "Sources: Angelotti et al. 2026, arXiv:2606.29085 · Vesuvius Challenge (scrollprize.org)"
- **Scroll identification:** both scrolls stay identified (PHerc. 1667, PHerc. Paris 4).

## 3. Narration: wording and pace unchanged

- **Same files as V3:** narration master and mix. 436 words, verbatim from `production/NARRATION_LOCKED.txt`.
- **Pace:** 189.5 wpm over the speech span (V2: 155.2).
- **Sync:** audio against the narration master is offset 0 ms in the export.
- **Captions:** 46 cues, text identical to the locked script. Every cue starts on its first word's measured onset
  (0 ms), with no overlaps.
- **Defect checks** (measured; nobody has listened):

| Check | Result |
|---|---|
| Pauses | Sentence breaks are 0.61–0.91 s. The only longer one is the deliberate 1.35 s after the quoted translation. |
| Clipped words | No sentence-final word has energy at its boundary, so nothing is cut off at the take joins. Every pause is silent. |
| Stretched syllables | None. The slowest word is "So" (0:53, 0.45 s), a natural stress. |
| Clipping | Peak −1.12 dBFS on the master; no clipped samples. |

No defect was found, so the voiceover was not regenerated.

## 4. Animations unchanged

I compared V4 with V3 frame by frame at 5 fps (`qa/v4/v3_v4_diff_boxes.json`):
- Every difference lies where a removed or restyled label was:
  - the upper-right corner;
  - under the rolls;
  - the measurements;
  - the cutaway and sample labels;
  - the quote-card area;
  - the new disclosure and credit lines.
- Apart from the removed quote card, no frame changes more than about 24,000 pixels, roughly 1% of the frame.
- Every animation is unchanged: the opening demonstration, scan, layer tracing, flattening, ink cutaway, patch sweep,
  second-scroll check, reveal of the writing and the callback.

## 5. Export verified from the file itself

| | V4 master |
|---|---|
| Video | H.264 High, **1920×1080**, SAR 1:1, **DAR 16:9**, yuv420p, BT.709 |
| Frame rate | r_frame_rate **30/1**, avg 30/1 |
| Frames | **4,224** counted (= 140.80 s × 30), none missing |
| Runtime | **2:20.80** (video, audio and container all 140.800 s) |
| Audio | **AAC**, 48 kHz stereo, 288 kb/s |
| Loudness | −14.2 LUFS integrated, LRA 2.7 LU, true peak −1.4 dBTP |
| Decode | A full ffmpeg decode reports no errors |

The 910×512 you saw: the V3 file in this repository measures 1920×1080 (SAR 1:1, DAR 16:9; checked again
before V4). A 910×512 copy must have been downscaled somewhere between export and playback, perhaps a preview or
transfer step. The V4 numbers above come from the master itself.

## 6. Visual and audio defects

- **Black frames:** none.
- **Static holds:** none reach 1.5 s (freezedetect at noise 0.003). Six near-still moments of 1.07–1.43 s each have
  a small moving element (trace head, heat front, patch step, smudge inset, final settle).
- **Motion:** the frame-by-frame transition checks from V3 still apply, because the motion is identical. There are no
  one-frame jumps and no popping masks.
- **Upper-right corner:** clean throughout.
- **Remaining notes, not defects:**
  - Nobody has watched it in real time with sound.
  - Integrated loudness is −14.2 LUFS, 0.2 LU under the −14 target. This keeps the true peak at −1.4 dBTP after AAC
    encoding.
  - The new closing credit is deliberately small (22 px). Enlarge it if it needs to be readable on phones.
