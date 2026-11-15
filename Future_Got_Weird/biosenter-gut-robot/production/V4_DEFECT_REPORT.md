# BIOSENTER V4: frame-level continuity defect report and final inspection summary

**Deliverable:** `exports/FGW_BIOSENTER_GUT_ROBOT_V4_FINAL_PUBLISH_1080x1920.mp4` (SHA-256 `95cbd3ef…`, `qa/v4/sha256.txt`).
Remotion composition `BiosenterV4`, rendered from the vector source.

**Locked against V3.** The narration, voice, music and effects are V3's: the decoded audio is bit-identical to V3
(`be4807fe…` in both files). Timing, runtime, captions, scene order, robot design, palette, camera paths and the
removed pig-study label are unchanged. Only the drawing code changed; the one timing change is inside the tool shot
(defect 9).

## How defects were found

**1. Automated scan of every frame (`tools/temporal_qa.py`).** All 789 frames were decoded at 540×960 and all 788
consecutive pairs compared, motion-compensated:

- Dense optical flow from each neighbour to frame t. The tool uses **DIS**: a test showed Farneback returning 0 px of
  motion on a 22 px/frame pan, which made the first scan's flags at 18.1 s false positives.
- Each neighbour is warped onto t along that flow, and the change the motion does not explain is measured: `fwd`
  (pops and swaps) and `min(fwd, bwd)` (one-frame flicker), over 16 px blocks.
- A frame is flagged when its scores jump well above the local level, excluding:
  - the 4 cuts (±1 frame);
  - the 3D-to-diagram cross-fade;
  - caption text boxes on caption-change frames only.
- The full table is in `qa/v4/*/temporal_scan.csv`, with crops of every flagged group in `*/flagged/`.

**2. Visual review of every flagged group.** Native-resolution crops of t-1, t, t+1 and the amplified difference
(`tools/review_crops.py`) were inspected, and each finding was traced to its line of code.

**3. Re-scan of the corrected render with identical rules, and comparison**
(`tools/compare_scans.py` → `qa/v4/CONTINUITY_REPORT_V3_vs_V4.md`).

## Confirmed defects (V3), root causes and fixes

| # | Time / frames (V3) | Object | Problem | Root cause in source | Fix (V4) | Verification |
|---|---|---|---|---|---|---|
| 1 | Every in-gut shot: S1, S2, S3, S5, S7 | Intestinal wall: folds, shading bands | Folds and shading bands re-drawn slightly differently every frame (swimming / flicker) | `world/gut.ts`: the wall mesh was sampled from `sFrom` (which moves with the camera) at a screen-adaptive spacing, so every frame cut the folds at new places | Wall samples are **world-anchored**: each fold owns a fixed set of arc lengths (`foldSamples(k)`, 25 across its crest, 5 between), a function of the fold alone | Flicker blocks: S1 309 → 157, S2 145 → 31, S7 235 → 77. `before_after/E_wall_flicker_maps.png`: flicker p99 8.6 → 6.6 (f20), 6.1 → 5.4 (f700) |
| 2 | In-gut shots | Wall cut faces (layer colours) | Colour-band boundaries jumped | Chunked by sample **count** | Chunked per fold (world) | Part of #1's numbers |
| 3 | In-gut shots | Wet glints, speckles, blood vessels | Glint runs started and stopped at a hard threshold; speckles cut at a hard threshold; vessel width depended on which points were in range | Hard `if` thresholds | Opacity and width are smooth functions of the specular term; vessel width taken from a fixed anchor | Part of #1's numbers |
| 4 | **f688 → f689 (22.93–22.97 s)**, wide ending | Neighbouring gut loops | Two overlapping loops swapped which was in front (silhouette jump) | Loops painter-sorted by **camera** depth; also culled by the shot's s-range | Fixed world-height draw order (every camera looks down on them); culled only when off-screen | `before_after/D_loop_order_f686-692.png`: V3 swaps at f689; V4 stable |
| 5 | **f86–90 (2.87–3.0 s)**, **f298–303**, **f617–622**, f741, f770 | Robot collar rings | A hatched / sawtooth patch and grey blocks flickering on the white collar | `robot/geom.ts`: each band was shaded by ONE linear gradient across a curved arc. Where the arc curves back on itself on screen (a collar seen from above), the sorted stops scrambled into stripes that changed every frame. Rings facing the camera all the way round also fell back to separately stroked quads | Every band is resampled into 12 short segments, each with a two-stop gradient (`emitBand`). Fully facing rings become closed half-bands on matched vertex indices, never self-intersecting. One-sided ring pairs are drawn as bands | `before_after/A_collar_flicker_*.png`: V3 hatched at f87, grey blocks f88–90; V4 clean |
| 6 | Every crawl shot (S1, S3, S7) | Central actuator | Shading bands re-cut as it extended or contracted | The extender's ring **count** varied with its length | A fixed 30 rings that stretch with the material | Scene flicker numbers; the extension crops show only the designed deformation |
| 7 | Anchor inflations (e.g. f28–32, f67–69, f161–167) | Kirigami tabs | Tabs switched drawing (cut line → lifted polygon) at one threshold, and popped in or out at hard visibility limits near the silhouette | `pop < 0.03` representation switch; hard culls (`vis < -0.3`, `vis < 0.05`, `vis > 0`) | Flat and lifted drawings cross-fade by lift amount; both fade with facing angle | Tab regions now show only the designed lift (review crops) |
| 8 | Robot outlines, all shots | Seam rings and silhouette ink | Ink lines grew and shrank in whole 7.5° steps as the robot turned | Per-segment on/off visibility and occlusion tests | Each segment is clipped at the exact horizon / occlusion point (bisection) | Part of the robot-region numbers |
| 9 | **f505–506 (16.83–16.87 s)** and **f541 → f542 (18.03–18.07 s)** | Biopsy instrument | Jaws appeared fully formed outside the channel, then **vanished in the open** at f542 holding the sample | Drawn only when extension > 0.01, at a fixed size beyond the mouth; no in-channel travel | Instruments slide out of and back **into** the central channel, clipped at the channel face (`travelPath`, `clipOut`). The sample rides in the jaws and is pinched off as they close. Timing set so visible travel matches V3's speed | `before_after/B_biopsy_retract_f530-543.png`: V4 withdraws into the channel with the sample |
| 10 | **f545 (18.17 s)** | Spray catheter | Nozzle popped into existence at the channel mouth | As #9 | As #9 | `before_after/C_spray_emerge_f543-551.png` |
| 11 | (latent) | Instrument orientation | Direction at the start of travel was a zero vector (finite difference at u = 0) | `toolPath` | Analytic tangent | Code |
| 12 | 7.2 s and 7.5 s | Macro → cutaway wall | A detail-level switch at 7.2 s and a drawn-range jump at 7.5 s | Threshold switches in `scenes/inside.tsx` | Removed (with #1); the range now moves continuously with margin | Code |

## Flagged but not defects (verified)

- **7.0–7.7 s, the pull-back from the macro.** Probes on the wall show a smooth, kink-free acceleration that peaks at
  232 px/frame at the frame edge. This is the approved fast camera move, not a discontinuity; the camera path is
  unchanged.
- **11.8–12.4 s.** The planned cross-fade from the 3D tunnel to the diagram, at matched position and scale.
- **18.1–18.3 s.** The first scan's full-frame flag was the Farneback flow failure described above. The real residual
  there was the instrument pops (#9, #10), now fixed.
- **Designed deformations** (anchor inflations with tab lifts, actuator extension and venting, the cutaway window,
  the instruments' actions, the pig push-in and travel, the lab's extension). In the final V4 scan, all 33 flagged
  groups fall inside one of these planned events.
  - **That alone proves nothing:** the event windows are broad, and V3's 40 groups also all fall inside them.
  - **The classification rests on the visual review.** Each group was stepped through in the crops: the same
    components keep their identity, attachment and proportions. The defects found that way are the ones in the
    table above.
- **S5 scores higher than V3** (flicker blocks 537 → 719). The instruments now visibly travel in and out of the
  channel instead of popping, so there is more legitimate fast thin motion. Stepping frame by frame (507–513,
  531–537) shows one continuous assembly with the sample attached.

## Final measurements (V4 file)

| Check | Result |
|---|---|
| ffprobe (`qa/v4/ffprobe.json`) | H.264 High, **1080×1920** (coded 1080×1920), SAR 1:1, DAR 9:16, yuv420p, **30/1 fps**, 789 frames, **26.300 s**; AAC-LC 48 kHz stereo |
| Borders (`cropdetect.txt`) | `crop=1080:1920:0:0` on every frame |
| Temporal scan, whole film vs V3 | Mean p99 unexplained change 8.26 → 7.52; frames with any flicker block 424 → 319; flicker blocks 3452 → 2941; flagged groups 40 → 33, all inside planned motion and visually verified; loop seam worst block 11.97 → 9.81, with 0 bad blocks |
| Narration (`final_asr.json`) | Whisper WER 0.000 on the MP4's own audio |
| Captions over the robot (`keepout.txt`) | Pass |
| Crawl mechanics (`kinematics.txt`) | Pass: a gripping anchor never slips (max 4e-15), no backward motion, 2.2 units of net progress per cycle |
| Requested timestamps sheet | `qa/v4/requested_timestamps.png` |

## Manual review: what was and was not done

- **Done.** Frame stepping, at native resolution, through:
  - every flagged group, in V3 and in each V4 pass;
  - the transitions;
  - the macro grip;
  - the biopsy and spray sequences, frame by frame;
  - the collar defect sequences;
  - the loop's last and first frames.

  Every one of the 788 frame pairs was evaluated by the automated scan.
- **Not done.** Real-time viewing at normal, half or quarter speed: this environment has no video playback. I did not
  look at all 789 frames individually; they were covered by the automated scan, plus visual review of everything it
  flagged and of every defect region.

## Unresolved / for your decision

1. **The pull-back at 7.0–7.7 s** is fast (up to 232 px/frame at the frame edge) and may strobe slightly on a large
   screen. It is continuous and approved, so it is left as is; lengthening it by about 0.3 s would lower its peak
   speed by about 25% without changing the composition.
2. **Watch it once at normal speed** on a phone: the checks above are measurement plus frame stepping.
