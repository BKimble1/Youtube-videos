# AI Just Cured All Cancer — V5 publishing pass (change log)

**Status: publishing candidate, not proven final.** Nobody has watched it at normal speed or listened to it in this environment (no real-time playback or audio monitoring is available here). Every check below is a measurement, a dense still sequence, or a frame strip around a transition.

All times are full-film timestamps.

## Deliverables

| File | What it is |
|---|---|
| `exports/FGW_AI_Cancer_V5_4K_MASTER.mp4` | 3840×2160, 30 fps, H.264 High, AAC 320 kb/s, 3:51.17, 6,935 frames |
| `exports/FGW_AI_Cancer_V5_4K_MASTER_part{1,2,3}of3.mp4` | the same master split for upload limits (frames 0–1999, 2000–3999, 4000–6934; frame-exact, checked by framemd5) |
| `exports/FGW_AI_Cancer_V5_REVIEW_1080p.mp4` | 1920×1080 review copy made from the 4K master (same edit, same audio) |
| `source/` | updated Remotion source; composition `MainV5` |

**Source entry points:**

| Path | What it holds |
|---|---|
| `source/src/v2/seq/A.tsx`, `B.tsx` | tumour growth |
| `source/src/v2/seq/C.tsx` | twin analysis and patients |
| `source/src/v2/seq/F4.tsx` | vial to read to protein |
| `source/src/v2/seq/G4.tsx` | ending |
| `source/src/v2/art/protein.tsx` | optional turn and variant residue |
| `source/src/v2/art/body.tsx` | optional line weight |

**Tools:**
- `tools/v5/splice_narration_v5.py` (voice splice)
- `tools/v5/cues_v5.py` and `tools/v5/make_audio_v5.py` (effects and mix)

## Narration — verified unchanged except 1:07

The narration track `v5/audio/narration/narration_v5.wav` was compared sample by sample against the approved `narration_v2.wav`:

- **Changed audio:** only 67.300–70.500 s (1:07.3–1:10.5).
- **Unchanged:** every other sample is bit-identical, and the length (231.140 s) matches.
- **Words:** the word list is identical (616 words, same text).
- **Moved word times:** only the moved words inside the replaced line:

| Word | Before (s) | After (s) |
|---|---|---|
| artificial | 68.13 | 68.21 |
| intelligence | 68.89 | 68.69 |
| changes | 69.33 | 69.41 |
| the | 69.81 | 69.85 |

The end time of "where" also moved.

### The 1:07 line

The line is "This is where artificial intelligence changes the game." Only that line was regenerated, with the same voice and model as the approved narration. I took one of two takes.

Its delivery was judged by measurement, not by ear:

| Measure | Original | Chosen take |
|---|---|---|
| Median pitch | 231 Hz | 157 Hz |
| Jump above the preceding question (167 Hz) | +5.7 semitones | about −1 semitone |
| Loudness above the preceding question | +4.1 dB | +3.1 dB |

- **Transcript:** its transcript matches the approved words exactly.
- **Splice:** it sits in the gap before "This" and after "game.". Both joins fall in silence at the same noise floor (about −87 dBFS), with 10 ms crossfades.
- **Not verified:** whether it sounds like 60–70 % of the original excitement, and whether the timbre matches, need a listen. I could not do that here.

## Changes, by timestamp

### 0:30.7–0:36.7 — tumour growth (A.tsx)

- **One cell to thousands:** the sequence starts close on the first few cells.
  - Front cells visibly divide (condensed chromosomes, then the split).
  - Growth accelerates through "Four become thousands" as irregular fronts. Five uneven fingers push out, while the interior keeps dividing at random.
- **Healthy tissue:** healthy cells ahead of the fingers are compressed and pushed aside, harder where a finger leads.
- **Variety:** tumour cells vary in size, shape, nucleus size and outline.
- **Depth:** an out-of-focus foreground layer sits over the close shots.
- **Camera:**
  1. It tracks along the leading finger.
  2. It dips once into the packed interior.
  3. It pulls back once to reveal the whole mass, spread over about 2.5 s so it no longer snaps.
- **Into the next scene:** the fronts converge on the established tumour outline, so the next scene continues without a cut.
- **What the scene shows:** this scene shows enlargement. Invasion and metastasis are left to their own later scenes: the break-away cell, the vessel, the liver.

### 0:36.7–0:37.6 — vessels fade in (B.tsx)

The host capillaries used to pop on in a single frame at the start of B. This was also true in V4. They now fade in as the pull-back settles.

### 1:07.5–1:28.9 — twin analysis, rebuilt in five stages (C.tsx)

The tumour's own outline still becomes the model, at the same place and size on screen.

1. **A, acquisition (1:08.7–1:15.4).** Voxels fill the measured slice. A thin input frame opens on the left, and each input visibly changes the model:
   - **1:12.2:** four axial scan slices land as the layers above and below.
   - **1:13.1:** a biopsy core is digitised, and the subclone regions resolve.
   - **1:14.1:** a short sequencing read with one variant base lands, and its region turns gold.
2. **B, scanning (1:15.4–1:18.4).**
   - The stack tilts into perspective and its five slices separate.
   - A scan plane passes down through them. Each slice lights up as it is crossed and resolves its own structure (core, subclones); slices below the plane stay unresolved.
   - A slice ruler beside the stack tracks the plane.
3. **C, identification (1:18.4–1:21.8).** The stack closes. One structure is isolated at a time while the rest dims:
   - the vessel supply
   - the resistant teal subclone (contour traced)
   - the necrotic core
   - the gold variant region
4. **D, comparison (1:21.8–1:27.5).**
   - **Setup:** the model becomes three copies on one simulated clock. Each copy has a small response chart with an untreated baseline, a predicted curve and an uncertainty band that widens with time.
   - **The strategies:** each strategy arrives in its own colour.
     - Copy 1 shrinks, then its resistant subclone regrows.
     - Copy 2 barely responds.
     - Copy 3 hits the gold region and stays down.
5. **E, result (1:27.6–1:28.9).** Copies 1 and 2 dim, and brackets close on copy 3. It rewinds to its untreated state, and the camera dives into its gold region, which hands off to the protein (unchanged).

**What changed overall:**
- **Pace:** something new happens every 1–3 s, instead of an 11-second near-static model.
- **What was removed:** the floating hex models joined by lines.
- **Labels:** none; there is no text anywhere in this section.
- **The twin:** shown as a computed reconstruction that changes when data is added, carries uncertainty, and is simulated. It is not shown as a scanner that sees everything.

### 1:30.7–1:38.3 — patients (C.tsx)

- **1:30.7:** a close look at one patient's liver tumour, a cell cluster with cup-shaped surface markers. Grey generic-drug particles drift through, and only two of its cells die.
- **1:31.6:** a slide to a second patient with different biology: a bowel tumour, a different cell colour and forked markers. The same drug does nothing.
- **1:32.5–1:33.1:**
  - The camera pulls back as three more patients are brought in one by one.
  - The five figures have different builds and heights, and their tumours sit in different organs (liver, bowel, left lung, right lung, brain), each with its own marker.
  - One grey drug sweeps across all five ("the same way").
- **1:33.4–1:35.1:** the film's own patient is selected, the others dim, and the camera pushes through the body to the left-lung tumour.
- **1:35.7:** a gold molecule shaped for this tumour's marker seats on each marker.
- **1:36.6–1:38.3:**
  - The push continues into one marker while the rest of the cluster falls away.
  - That marker dissolves into the target protein of the next scene, at the same screen position as the protein's pocket (0.5 s dissolve).
  - This replaces a hard cut.
- **Line weight:** the digital body outlines get thinner as the camera closes in, so the close-ups are no longer drawn with heavy strokes.

### 3:06.5–3:15.5 — blood vial to protein, one continuous move (F4.tsx)

- **Vial (3:06.9–3:08.5):**
  - The vial art is kept: it fills, then separates.
  - The camera then pushes into the plasma layer toward one tumour DNA fragment.
  - It dissolves into the microscopic plasma: amber, with DNA fragments and plasma proteins drifting at the same colour and scale. The followed fragment keeps its position, size and rotation.
  - This replaces the hard cut into the read.
- **The read (3:08.5–3:09.3):** the fragment turns level and unzips. Its bases become a 7-letter read while the plasma dims to the analysis background.
- **Part A (3:09.1–3:10.3):**
  - The reference row slides in above.
  - The changed column (C→T) lights up on "returning tumor".
  - Two more reads with the same change stack under it. The comparison box covers only the rows present.
- **Part B (3:11.0–3:12.4):** a later fragment arrives and opens into a read with a second change (G→A). Everything else fades, and that one base is isolated and enlarged.
- **Part C (3:12.4–3:13.6):** the base becomes the amino acid it alters. It flies onto the target protein as the protein turns into view, then swells into the binding pocket.
- **Part D (3:13.5–3:15.5):**
  - The earlier drug approaches, collides with the swollen residue (red contact flash) and backs off.
  - A molecule redesigned around the swelling builds, seats on the free side of the pocket, and the pocket closes on it.
- **Shapes removed:** the square-to-triangle tip, the floating triangle and square, and the crowded 15-row letter wall.

### 3:41.6–3:51.1 — ending (G4.tsx)

- **Unchanged:** the final biological event (T cell kills the single cell, a macrophage clears it), then tissue, then lung, then body. Narration and length are unchanged, and no silence was added.
- **What changed:**
  - The tissue framing is looser during the clearance.
  - The final figure is slightly smaller and centred, with clear dark margins either side for end-screen elements.
  - A restrained teal trace runs from the heart's outflow to the spot in the lung where the cell was found, ending in a soft glow. That is the treatment connected to the region.
  - The back light is dimmer.
- **Not added:** no thumbnails, subscribe animation or logo.

### Sound (cues_v5.py, make_audio_v5.py)

- **Mix:** rebuilt on the V5 narration. The score and beds are unchanged.
- **Effect cues:** re-timed to the new events: input landings, scan plane, isolation blips, comparison clock, patient selection, molecules docking, plasma dive, base clicks, variant, clash and seat.
- **Measured:**
  - The mix is −14.1 LUFS integrated, −1.1 dBTP true peak on the delivered AAC.
  - Median effect level is 14.6 dB under the voice. No 1-second window of speech has an effect above the voice; the worst window is level, at 0:54.75, unchanged from V4.

## Visual and transition defect check

**Measured on the 1080p render of this edit** (before the last four fixes listed below):
- 6,935 frames, no black frames, no frozen stretches.
- Frame strips were inspected at every shot boundary and dissolve (55 strips).

**Abrupt changes flagged by measurement**, and their status:
- **Intended hard cuts, unchanged from V4:** 0:57.4, 1:49.4, 2:26.8, 2:35.4, 2:38.2, 3:15.5, 3:41.6.
- **1:30.7 (intended hard cut):** protein to the first patient, at the sentence pivot "Instead of treating every cancer…".
- **3:08.8–3:09.0, plasma darkening — fixed:** too fast, now spread over about 1 s.
- **One low-activity second at 1:23 — fixed:** the strategies now start arriving at 1:23.3, and the camera drifts in.

**Fixed after that render, then checked on stills:**
- the gold region contour no longer reads as a diamond
- the plasma fade is slower
- the comparison section no longer stalls
- the isolated variant base is larger

**Final 4K master:**
- **Checks:** container check, black and freeze detection, and frame strips on a 1080p proxy. Full 4K decoding in the QA tool runs out of memory here, so those checks run on the proxy.
- **Results:** see "QA of the delivered files" at the end of this file.

## Known limits and what was not reviewable

- **No real-time viewing or listening** was possible. Motion smoothness, the 1:07 voice match and the effect levels are judged from measurements and stills only.
- **Kept from V4:**
  - The precision-attack shot (3:15.5) and earlier cell-surface scenes still use small square and triangle marker shapes on cells. That is the established marker language for resistant cells. They sit on membranes, not floating.
  - The tissue-to-alveoli zoom-through at 3:48.8 is a short dissolve between scales.
- **Part 1 is no longer identical to V3** in the reworked ranges, by design:
  - the tumour growth (0:30.7–0:37.6)
  - the 1:07 line
  - the twin analysis and patients (1:07.5–1:38.3)
- **No YouTube account was touched.** Nothing was published.

## QA of the delivered files

- **4K master:**
  - 3840×2160, 30/1 fps, H.264, 6,935 frames, 231.167 s.
  - AAC 48 kHz stereo at 320 kb/s.
  - 836.5 MB.
- **Upload parts:** 2,000 + 2,000 + 2,935 frames. A per-frame framemd5 of the three parts matches the master on all 6,935 frames.
- **1080p review:** scaled from the master (Lanczos), with the same audio stream. 6,935 frames, 282 MB.
- **Audio measured on the 1080p file:** −14.1 LUFS integrated, −1.1 dBTP true peak.
- **Picture checks** (on the 1080p copy made from the master):
  - no black frames, no frozen stretches, no low-activity seconds
  - frame strips at all 55 shot boundaries and dissolve edges are in `v5/qa/final/strips/`
  - full-film contact sheets are in `v5/qa/final/film_*.png`
- **Remaining measured jumps:**
  - the intended hard cuts listed above
  - 3:08.8, the dive into the plasma as it dims (now about 30 % gentler than in the first render)
  - 3:11.1, the later fragment arriving
  - 3:35.3, a dissolve that is identical to the V4 master
