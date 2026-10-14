# QA report: They Trained Robots to Destroy Themselves

# V3 (checked 14 Oct 2026)

Not published. Every figure below comes from the files themselves, using the scripts in `tools/v3/`:

| Script | What it produces |
|---|---|
| `qa_v3.py` | Raw results in `qa/v3/qa_v3_results.json` |
| `strips_v3.py` | 25-frame strips around each changed transition |
| `compare_v3.py` | V2 vs V3 comparison frames |
| `speech_mask_v3.py` | Speech-masking check |

**No real-time viewing or listening was possible in this environment.** Everything below is measurement and frame
inspection.

## Deliverables

| File | Spec | Notes |
|---|---|---|
| `exports/FGW_RobotsDestroy_v3_UPLOAD_1080p.mp4` | H.264 High, 1920×1080, 30 fps CFR (native), yuv420p, BT.709. 7,005 frames, 233.5 s. AAC 48 kHz stereo at 317 kb/s. 115.9 MiB. SHA-256 `4fa6deb8ebae70b21b7d4eda84363e38ea0b64855fddbdbcc12c97af9c7728e1` | **Upload master.** Its file name is distinct from the share copy's. Rendered from source (CRF 16, x264 slow) with the V3 mix. Backed up as split parts in `backup/v3/`. |
| `exports/FGW_RobotsDestroy_v3_1080p_SHARE.mp4` | 1920×1080, 30 fps, two-pass H.264 at 0.88 Mb/s, AAC 128 kb/s | **Review/share copy, not for upload.** Made from the master. |
| `captions/FGW_RobotsDestroy_v3.srt` | 75 cues, at most 42 characters per line, no overlaps. First cue at 0.50 s; last ends at 230.54 s | Identical to V2: narration and timing are unchanged |
| `thumbnail/FGW_RobotsDestroy_v3_thumbA_edge_1280x720.jpg` (main), `…v3_thumbB_leap…` | 1280×720 JPEG | Drawn with the V3 F.02 model. Phone-size check: `qa/v3/thumbs/phone_size_check.png` |

## Picture (measured on the master)

**Scene changes (ffmpeg scene detector, threshold 0.10):** 82, against 73 in V2.

- Median segment 2.40 s, mean 2.81 s.
- 14 segments in the first 20 s.
- The longest unbroken segments are all continuous camera moves:

| Length | Starts at | Shot |
|---|---|---|
| 16.0 s | 2:11.8 | Policy: into the sensor, along the signal, out at the knee, the correction |
| 12.7 s | 2:43.2 | The variation montage under one dolly |
| 9.1 s | 0:25.3 | The production cell |

**Defect screens on the final master:**

| Check | Result | V2 / first V3 master |
|---|---|---|
| Static holds ≥ 1.5 s (`freezedetect`) | **none** | V2 had 5. The first V3 master had 3 (89.1, 146.2, 155.3 s); each now has a slow camera drift |
| Black frames (`blackdetect`, ≥ 0.1 s) | **none** | The first V3 master had 5 frames at 16.6 s, where the camera passes through the visor. That stretch now shows the visor's glossy surface, and the iris opens directly from it |
| Exact duplicate consecutive frames | 25 single repeats, no runs longer than 2 | The single repeats are deliberate near-freezes and ramps |
| Single-frame "pop" candidates (difference spike that is not a cut) | **none** | — |
| Silences > 1 s | none | — |

**Audio offset against the mix:** 0.0 ms.

## Audio (measured, not heard)

**Loudness:**

- Integrated −15.0 LUFS.
- True peak −1.5 dBTP.
- LRA 2.4 LU.

**Narration:** unchanged from V2, the same takes and timing.

**Cue sheet:** `source/src/v3/sfx_v3.ts` has 228 cues, re-cued to the new events (door sweeps, teardown bolts and
seat, ring flight, chain pass, resolves, the sensor push). It uses no new effect generations.

**Masking screen (`audio/v3/mix/speech_mask_v3.txt`):**

- Out of 3,730 speech windows of 50 ms, 190 have effects and beds within 6 dB of the voice. These are mostly
  isolated single windows on steps and ticks.
- After the gain fixes logged in `production/v3/DEFECT_LOG_V3.md`, **no window of 150 ms or longer has effects louder
  than the voice.**
- The biggest remaining overlaps sit under the entries at 3.1 s ("steel"), 13.5 s, 194.6 s and 224.4 s ("retiring
  hardware"). Those impacts were deliberately kept under the words. **Listen to these four.**

## Visual review performed (V3)

**Development rounds:** stills for every changed shot in `qa/v3/*_r*/`.

**Full-episode review:** a 540p review render at 2 fps; contact sheets in `qa/v3/review/sheet_01…13.png`.

**Transition strips:** `qa/v3/strips/`, 36 strips cut from the upload master, every one inspected. Each strip is
25 consecutive frames: 12 before the boundary, the boundary frame, and 12 after. Groups of four are in
`qa/v3/strips_group*.png`. The boundary times come straight from the shot code (`qa/v3/transitions_v3.json`).

**Comparison frames, V2 left / V3 right (`qa/v3/compare/`):**

| Sheet | What it shows |
|---|---|
| `block_intersection_v2_vs_v3.png` | 2:11.8 / 2:12.1 / 2:12.4. In V2 the robot is inside the block face. In V3 it walks on the open stage floor with a contact shadow, clear of the tower legs and pedestal |
| `model_emblem_v2_vs_v3.png` | 0:19.6 / 0:21.5 / 0:23.5 / 0:24.8. V2 is a studio turntable with a slash visor. V3 shows the scan resolve from the avatar visor to the F.02, then the product bay with the Figure-symbol sign and the lower third |
| `f03_emblem_v2_vs_v3.png` | 0:30.2 / 0:31.0. The F.03 with the chest symbol in the new production cell |

**Model sheets:** `production/v3/V3SheetF02.png`, `V3SheetF03.png`, `V3SheetID.png`. The ID sheet has silhouettes,
phone-size versions, the symbol flat and the symbol projected.

**Neutral rig diagnostic (`qa/v3/diag_r2`):** stand, walk past a block face, walk on a platform, crouch, launch,
descend, land, all under a 360° camera orbit. Results:

- no intersections;
- feet planted on the floor and on the platform top;
- correct occlusion against the block and the railing;
- the camera never inside geometry.

**Not done:** frame-by-frame review of every frame. The strips cover the transitions; the 2 fps sheets cover the
rest.

## Defect log

See `production/v3/DEFECT_LOG_V3.md`. It gives the V2 time, symptom, verified cause, change, V3 location and
inspection for every P0, P1 and P2 item, plus the defects found and fixed during V3.

## What was not checked (limits)

1. **Real-time playback and listening.** Motion smoothness, the feel of the speed ramps, and the mix were judged from
   frames and measurements only.
2. **Reference photos.** None of the reference hosts (figure.ai, tendril.studio, ctfassets, YouTube) could be reached.
   The F.02 and F.03 shapes and the F.03 chest-symbol placement follow text descriptions and the brief, not photos.
3. **Official branding cross-check.** The symbol path comes from the supplied Wikimedia file, saved verbatim. It
   could not be compared with Figure's own site.
4. **Every-frame inspection.** Full 30 fps review was done only around the transitions. Between transitions, coverage
   is 2 fps.

## Human review list (in order)

1. **Full watch with sound, at 100 %.**
   - The opening 0:00–0:20: push-off, splash, macro, second robot, actuator match, visor pass-through.
   - The mid-air hand-off 2:30.5–2:44 (sim → foundry → sim).
   - The final reveal 3:47–3:51.
2. **Compare with official photos.**
   - Compare `production/v3/V3SheetF02.png` and `V3SheetF03.png` with official F.02 and F.03 photos.
   - Decide whether the F.03 chest symbol (0:29–0:34, 0:51) stays.
   - The F.02 carries no emblem by design.
3. **Trademark comfort.** The Figure symbol appears on an illustrative product-bay sign and on the F.03. The credit
   and a non-affiliation line are in the description (`upload/UPLOAD_TEXT_v3.md`). See `production/ASSET_RIGHTS.md`
   C01.
4. **Listen to the four entry impacts** (3.1 s, 13.5 s, 194.6 s, 224.4 s) for any masking of "steel", "go in",
   "brutal environment" and "retiring hardware".
5. **Phone-size thumbnail choice:** see `qa/v3/thumbs/phone_size_check.png`.

---

# V2 (checked 14 Oct 2026)

Not published. Every measurement below was taken from the files themselves; the scripts are `tools/v2/qa_v2.py`,
`tools/v2/bursts_v2.py` and `tools/v2/sheets_v2.py`, and the raw results are in `qa/v2/qa_v2_results.json`.

## Deliverables (ffprobe on the final files)

| File | Spec | Notes |
|---|---|---|
| `exports/FGW_RobotsDestroy_v2_UPLOAD_1080p.mp4` | H.264 High, 1920×1080, 30 fps CFR (native), yuv420p, BT.709; 7,005 frames, 233.500 s; AAC-LC 48 kHz stereo (320 kb/s target, 285 kb/s average), 233.500 s; 93.6 MiB; SHA-256 `df49c74f4e39cf8e22662f4141f7da644c3ae2993903fc6f402647c02e85d1f6` | **Upload master.** Distinct name from the share copy. Rendered from source (CRF 16, x264 slow). The audio track is the final mix remuxed after the last two effect-gain trims; the video stream was copied unchanged. Backed up as five split parts in `backup/v2/`; the parts pass `sha256sum -c`, and the joined parts hash to the master's SHA-256. |
| `exports/FGW_RobotsDestroy_v2_1080p_SHARE.mp4` | 1920×1080, 30 fps native, two-pass H.264 at 0.88 Mb/s, AAC 128 kb/s, 28.47 MiB | **Review/share copy, not for upload.** Made from the master; under the 30 MiB send limit. |
| `captions/FGW_RobotsDestroy_v2.srt` | 75 cues, at most 2 lines × 42 characters, no overlaps; first cue 0.50 s, last ends 230.54 s | Matches the script word for word (677/677, 0 differing spans); display forms F.02s, F.03, Terminator 2, 1991 |
| `thumbnail/FGW_RobotsDestroy_v2_thumbA_edge_1280x720.jpg` (main), `…v2_thumbB_leap…` | 1280×720 JPEG, 95 / 106 KB | Drawn with the V2 rig and foundry; checked at 246×138 (`qa/v2/thumbs/phone_size_check.png`) |

## Picture (measured on the master)

- **Runtime:** 3:53.5. That is narration 3:50.5 at natural speed plus a 2.5 s sting, inside the 3:45–4:05 target.
- **Scene changes.** The ffmpeg scene detector (threshold 0.10) finds **73 scene changes**:
  - median 2.65 s per segment, mean 3.16 s;
  - the count includes a few false triggers on impact flashes and the iris (4 in the first 20 s);
  - the planned shot list has 83 framings (`production/v2/SHOT_PLAN_V2.md`).
- **Opening:** 11 compositions in the first 19.4 s.
- **Longest unbroken segments** are moving camera shots, not holds:
  - 16.0 s at 2:11.8, the policy push-in → follow-down → orbit → pull-out;
  - 13.0 s at 2:43.0, the variation montage under one dolly;
  - 9.1 s at 0:25.3, the assembly line with the F.03 walk-in;
  - 8.2 s at 3:29.3, the tracking walk and leap.
- **Static holds of 1.5 s or longer** (`freezedetect`, n=0.002): 40.5 s (1.8 s), 89.1 s (1.5 s), 146.2 s (1.6 s), 155.3 s (1.7 s), 157.0 s (1.7 s).
  - Each is under 2 s and sits on a labelled close-up or a gag beat.
  - The review render had holds up to 3.7 s; those were fixed.
- **No black frames.**
- **Frames reviewed:** one per second from the master in `qa/v2/final/sheet_00–05.png`. Dense bursts at 15 frames
  per second (`qa/v2/bursts/`) cover:
  - takeoff and hook impact;
  - rim → cap match cut; iris into the simulation;
  - lock and shutter; phone whip; chain → crane;
  - simulation wipe; faceplant; airbag; electrical spark;
  - payoff entry; last leap; reverse whip; last entry;
  - ring → sting.
- **Entries:** the robot is on the surface for two frames at each, then flash and splash. There is no upright pause on
  the liquid, no figure sinking face-first and no flailing.

## Audio (measured, not heard)

- **Narration:**
  - ElevenLabs Test Voice resolved by ID (`kk5XaSLo2XAw0sKM98zU`), `eleven_v4`; 28 takes, 7 selected
    (`audio/v2/narration/takes_v2.json`).
  - All takes were clean: 0 clipped samples, true peak −1.0 to −1.7 dBFS, −18.1 to −18.6 LUFS
    (`takes_analysis.txt`).
  - Stitched at natural speed; only eight silences over 0.62 s were shortened, to 0.48 s.
- **Master loudness:** **-15.0 LUFS integrated, -1.5 dBTP true peak**, LRA 2.4 LU
  (ffmpeg `ebur128` on the master file).
- **Silences:** none over 1 s.
- **A/V offset:** 0.0 ms against the mix (cross-correlation).
- **Separation while the narrator speaks** (`qa/v2/mix_balance_v2.txt`):
  - 0.4 s windows with speech: 543 of 583
  - music  relative to voice during speech: median  -17.8 dB, 90th percentile   -8.7 dB
  - sfx    relative to voice during speech: median  -42.6 dB, 90th percentile  -15.6 dB
  - beds   relative to voice during speech: median  -30.7 dB, 90th percentile  -18.9 dB
  - 0.2 s windows where effects exceed the voice by >3 dB while speech is present (t s, dB): [(3.0, 8.8), (13.4, 3.2), (225.2, 3.5)]
- **Gain trims:** the entries on "go in", "brutal environment" and "retiring hardware" and the B4 low boom were each
  lowered until no 0.2 s window exceeded the voice by more than about 3.5 dB. The remaining exception is the hook
  impact on the first 0.2 s of "steel" (+8.8 dB in that window); it is deliberate and on the human listening list.
- **Whooshes:** 7 in total, each on a real whip, wipe or descent; no whoosh on ordinary zooms.

## Visual review performed (V2)

1. **Rig sheet** checked from every side (`qa/v2/rig/`, `production/v2/ROBOT_REFERENCE_SHEET_v2.png`).
2. **Opening prototype:** ten still rounds (`qa/v2/hook_r1…r10`), a 540p prototype video and frame bursts
   (`qa/v2/proto_video/`).
3. **Every section in stills, at least two rounds each:**
   - `qa/v2/why_r1–r2`, `film_r1`, `train_r1–r2`, `real_r1–r3`, `prove_r1–r2`, `end_r1–r3`;
   - cast placement before and after the fix: `chars_before`, `prove_r2`.
4. **Full-length 540p review render** with the final mix. Frames were pulled from the MP4 itself at 1 per second
   (234 frames, `qa/v2/review/sheet_00–05.png`).
   - The review drove a polish round: `qa/v2/polish_r1–r2`.
   - It also fed the measured static-hold check below.
5. **Final master:** measurements below. Frames at 1 per second from the master (`qa/v2/final/sheet_*.png`), plus
   16 dense bursts at 15 frames per second over every entry, contact, match cut and whip (`qa/v2/bursts/*.png`).
6. **Thumbnails** at full size and at phone size (`qa/v2/thumbs/`).

## Defect log (V2)

| Where | Symptom | Cause | Change | Recheck |
|---|---|---|---|---|
| Whole film | Polygons behind the camera smeared across the frame | Projection through the near plane | Near-plane clipping for faces, hulls, lines and the robot | hook_r2→ |
| Hook | Orange haze washed out the frame | Glow too strong | Palette darkened, glow 1.15→0.8, haze reduced, robot glow capped | hook_r3 |
| Hook | The ladle wall covered the interior; a dark triangle appeared | Wall drawn as a full cylinder; stand mis-sorted | Near-half outer wall; stand moved to back items | hook_r4 |
| Hook impact | The robot seemed to stand on the steel | Contact happened between shots | Contact moved into H4, faster crown, ejecta sheet, motion trail | hook_r5–r6 |
| Hook close-up | The top-down sinking shot read as a person going under | Heat tint plus head-and-shoulders silhouette | Shot removed; replaced by the vented back-plate detail and a tilt up to the empty edge | hook_r7–r9 |
| Hook | Smoke read as grey balloons | Flat circles | Radial-gradient puffs, skipped near the lens; flames as gradient tongues | hook_r8 |
| B2–B5 | Robots too small; the rack hid the robot; clipboard 1.7 m tall; ghostly policy robot; clapper remnant; labels narrating production | Framing and scale | Reframed, rescaled, made opaque, removed | why_r2, train_r2, film_r1 |
| B2, B4, B6 | Cast characters drawn far below and right of their feet | The cast rig draws a nested `<svg viewBox="-200 -500 …">`, so its ground point sits at (200, 500) inside it | `charItem` offsets by the viewBox origin; the clipboard is now held via `holdR` | chars_before → prove_r2 |
| B5 | Variation robot cropped; airbag robot hidden inside the wall | Camera; ledge position | Reframed; balcony added, ledge at x −130 | real_r2–r3 |
| B6 | Control-room crew missing; factory comparison too small | Cast offset (above); camera too far | Fixed; camera closer, thicker task paths, larger teal arc | prove_r2 |
| B7 | Outline shot too far away; head cropped while tracking; crew looked like they stood on the rim; crew silhouettes out of frame | Camera heights and fov | Reframed four cameras; crew moved back; silhouettes rendered solid | end_r2–r3 |
| 1:08–1:19 | Phone held one composition for 11 s with small text | One framing | Three framings: the phone arrives, a cut in on the post, a scroll-whip to the quoted reply | polish_r1 |
| 1:43–1:59 | 13 s on nearly one sim framing | One camera | Closer cut for the three checks; a new angle for the corrections | polish_r1 |
| 3:01–3:10 | 9 s single crane move | One move | Three framings: crane down, junction box arcing, low launch | polish_r1 |
| Review render | Static holds of 1.5–3.7 s (queue, policy freeze, reflex, rounds, crate) found by `freezedetect` | Locked cameras | Slow drift or push added to each | polish_r2; remeasured on the master below |
| B5 | Disclaimer chip duplicated the spoken "We don't know which variations Figure used" | Text clutter | Chip removed; T9 labels shortened to "stunt performer" / "virtual robot" | polish_r1 |
| Mix | Entries landed up to 9 dB over the words "steel", "brutal environment", "retiring hardware" | Effect gain | Entries lowered 5–8 dB; the hook bed raised 5 dB; score +3 dB | Measured below |
| Thumbnails | First drafts: robot tiny, or crowded by the deck | Camera | Reframed twice | qa/v2/thumbs |

## What was not checked (limits)

- **No real-time playback or listening.** This environment cannot play video or audio in real time. "Inspect the
  entire rendered audiovisual video at normal speed" could not be done literally. Instead, every second of the
  rendered file was inspected as frames (1 per second), plus 15-fps bursts at every contact and transition. The audio
  was checked only by measurement: loudness, true peak, voice/music/effects separation, silences and A/V offset.
  **The owner should watch and listen once before publishing.**
- **Effects chosen by measurement only.** The ElevenLabs effect takes were chosen from objective measurements (onset,
  peak, decay), not by ear.
- **Reference pages blocked.** figure.ai, tendril.studio, YouTube, thinkfoundry.com and the Wikimedia logo were blocked
  by the network policy. The robot likeness rests on text descriptions, and no logo is drawn.
- **Word timings from alignment.** They come from forced alignment of the stitched narration (Scribe transcripts of
  the selected takes). Captions match the script word for word; boundaries can be off by up to about 0.1 s.
- **No 4K render.** 1080p is the requested master.

## Human review list (in order)

1. Watch the master once at normal speed with sound, especially:
   - 0:00–0:20 (hook impact level under "steel");
   - 1:08–1:19 (the phone);
   - 3:10–3:16 (spotlight and entry);
   - 3:33–3:53 (the ending and the sting).
2. Compare the F.02/F.03 drawings with official photos (`production/v2/ROBOT_REFERENCE.md`).
3. Run the pre-upload checks in `upload/UPLOAD_TEXT_v2.md`.

---

# V1


Checked 14 Oct 2026. Not published. Every measurement below was taken from the files themselves.

## Deliverables (ffprobe on the final files)

| File | Spec | Notes |
|---|---|---|
| `exports/FGW_RobotsDestroy_v1_UPLOAD_1080p.mp4` | H.264 High, 1920×1080, 30 fps CFR, yuv420p, BT.709 primaries/transfer/matrix, 7,743 frames, 258.10 s; AAC-LC 48 kHz stereo 320 kb/s, 258.11 s; 47,144,966 bytes, SHA-256 `3a922830dc5443b04815861affea84ff0eea6f65660b7948ba23b78783dc65ee` | **Upload master.** Native timeline rate. Metadata carries only the encoder and "Made with Remotion 4.0.533". Backed up as three split parts in `backup/v1/`; the parts pass `sha256sum -c` and the joined parts hash to the master's SHA-256 (restore steps in `backup/v1/RESTORE.md`). |
| `exports/FGW_RobotsDestroy_v1_REVIEW_720p_not-for-upload.mp4` | 1280×720, CRF 26, AAC 128 kb/s, 11,285,032 bytes | Compressed review copy made from the final master. Not for upload. |
| `captions/FGW_RobotsDestroy_v1.srt` | 74 cues, ≤ 2 lines × 42 characters, ≤ 6 s | Timed from Scribe word timings of the locked narration; transcript matches the script word for word (715/715, 0 differing spans) |
| `thumbnail/…thumbA_leap_1280x720.jpg`, `…thumbB_overshoulder_1280x720.jpg` | 1280×720 JPEG | Checked at 160×90 and 320×180 (`qa/thumbs_phone_check.png`, `qa/thumbA_phone_check.png`) |

No 4K master: 1080p was the requested master; a true 4K render from the vector source is one command (README).

## Audio (measured, not heard)

- Narration: ElevenLabs Test Voice `kk5XaSLo2XAw0sKM98zU`, `eleven_v4`, seven blocks × two takes, take 1 used. All takes clean: no clipped samples, true peak −0.8 to −1.5 dBFS, consistent level (−18.1 to −18.8 LUFS) and pauses only at sentence breaks.
- Final mix (in the master): **−15.0 LUFS integrated, −1.4 dBFS true peak** after AAC encoding (−1.5 dBTP in the PCM mix), LRA 2.6 LU. Re-measured with ffmpeg `ebur128` on the final master file after the last render; `blackdetect` found no black frames.
- Separation in speech (0.4 s windows): music ducked a median 19 dB under the voice (5th percentile 7 dB, at phrase onsets); effects a median 32 dB under. Four impacts that came within 2–5 dB of a word (the entries on "steel" and "landing", the airbag) were lowered 5–14 dB.
- Word timing remap checked against energy onsets after every pause over 0.6 s: word starts sit 0–0.17 s after speech onset, no drift across blocks.
- A/V: video 258.100 s, audio 258.112 s.

## Visual review performed

1. Prototype stills of the cold open and the training sequence before the full build (`qa/proto*`, `qa/train*`), two fix rounds each.
2. Scene stills for every other scene (`qa/s2`, `qa/s3s6`, `qa/s5s7`, `qa/fix1`).
3. **Full draft render r1, a frame every 2 s from the MP4 itself** (129 frames, `qa/r1/sheet_01–05.png`).
4. **Frame bursts at 2–4 frame spacing** over the riskiest motion: the first entry (frames 70–96), the first scene cut, the simulation wipe, the zoom-out into the grid, the push into one lane, the X-card slide, the ending jump into the closing question (`qa/burstA`, `burstB*`, `burstC`).
5. Targeted frames pulled from the v1 render at every interval changed after r1 (`qa/v1/targeted_sheet.png`, `qa/v1fix`).
6. **Final master:** a regression sheet of one frame every 6 s pulled from the final MP4 (`qa/v1final/regression_every6s.png`, 43 frames, 0:00–4:12) and the two frames fixed in the last round (`qa/v1final/fixed_frames.png`). No change outside the S4 fix.

## Defect log

| Time | Symptom | Cause | Change | Recheck |
|---|---|---|---|---|
| 0:02.6, 4:07.5 | Glowing orange robot with raised arms in the steel read as a burning figure | Melt cross-fade + "arms up" entry pose | Feet-first entry with arms in; no orange phase; fast sink under splash and smoke | Bursts A and C: the robot touches the surface ~3 frames, then smoke |
| 0:00–0:06 | Robots too small for a phone | Scale 0.62 at zoom 1.0 | Scale 0.74, camera 1.2–1.26× | Proto 2 |
| 0:05.9–0:07.9 | Empty evidence panel | First card waited for "Figure" | Card lands with the panel | Proto 2 |
| 0:16–0:22 | Question cards covered robot 2's head | Camera framing | Re-framed lower, zoom 1.0 | Proto 2 |
| 1:41–1:45 (training) | Two labels cross-faded on top of each other in the wipe | Simultaneous fade | Switch at mid-wipe | Train 2 |
| 1:46–1:49 | 3 s static simulation shot | Nothing happened until the grid | Virtual robot's first attempt misses; "A new AI model, trained in simulation" card | v1 targeted frames, v1fix |
| 1:47.8 | That card covered the robot's head | Card placed top-left | Moved top-right (x 1110, y 80) | v1fix, v1final |
| 1:52.3 | A second "SIMULATION · illustration" tag showed inside the shrinking shot next to the grid's own label | Tag drawn inside the shot layer | Tag fades out over the first quarter of the shrink | v1final |
| 1:52.3 | Zoom-out into the grid played as a hard cut, then showed foundry art past the frame edge | Grid layer's opaque background drew over the shrinking shot; no clipping | Layer order, transparent grid background, clip and border radius, real-world layer dropped after the wipe | Bursts B2, B3 |
| 1:55 | Neighbouring lanes' ✗ marks showed behind the scorecard | Lanes not dimmed while focused | Neighbours fade to 20 % when a lane is in focus; focused lane's own mark hidden | Train 2 |
| 2:10 | Incident-report card covered the clerk | Layout | Card moved left, clerk right | Train 2 |
| 2:13–2:18 | Reference-motion figures small, frame empty | Scale 0.62 | Scale 0.8, dashed trajectory arcs, reference arc copied onto the robot | Train 2 |
| 2:16.7 | "STYLE GUIDE" caption overflowed its card | Wrap | Wider card, no wrap | v1 targeted frames |
| 2:29.6 | Reflex hammer struck near the foot | Pivot geometry | Pivot and strike angle recomputed for the knee | Train 2 |
| 0:37.8–0:40.4 | Options board empty for 2.6 s | Cards wait for their words | Dashed "?" slots | v1 targeted frames |
| 0:41–1:12 | Option cards under-filled, reasons only spoken | Small icons, no captions | Bigger icons + one caption line per reason | s2 recheck, r1 |
| 1:07 | Recycling note covered the board title | Position | Moved to the left above the checker | r1 |
| 1:14–1:21, 1:25–1:31 | Lone cards left large empty areas | Final layout used from the start | Cards start centred, slide aside when the partner card arrives | Burst A, v1 targeted frames |
| 1:24 | Quote overflowed its card | Two-line wrap at 110 px | One line, 104 px, wider card | s3s6 recheck |
| 1:35 | "1991" stamp covered the folder's subtitle | Position | Folder widened, stamp moved right | r1 |
| 2:31–2:44 | Split screen showed no robot on the real-world side; sim robot's head cropped | Camera centre computed for the wrong x | Each half's camera centred on its robot | fix1 |
| 2:31–2:44 | Callouts overlapped the real robot | Position | Moved right of the robot | r1 |
| 3:04 | Airbag landing happened as the shot faded out; landed stiff-legged | Cue on "airbags." end; no landing pose | Lands on "giant", crouches into the bounce | fix1, r1 |
| 3:51 / 4:05 | Thought bubbles hidden (behind the title banner in the wide shot) | Banner at the top | Banner moved to the bottom; bigger empty bubble | fix1 |
| 3:58 | Cast labels not under their characters; clerk pointed away from the ladle | Fixed screen positions; flipped rig | Labels under each person; un-flipped pointing arm | fix1 |
| 3:59.9 | "The policy hit its target" card covered the robot's head | Position | Moved to the top | v1 targeted frames |
| 4:07.9 | "10" cards visible < 1 s before the question covered them | Cards late, question early | Cards on landing + 4 frames; question 0.4 s after "Does" | Burst C |

## What was not checked (limits)

- **No one has listened to anything.** This environment cannot play audio. Pronunciation quality ("Imatra", "Schwarzenegger", "F-zero-two"), warmth, comic timing, joins between blocks, effect choice and the in-house music were judged only by transcripts and measurements.
- **No full-speed playback.** Motion was checked in frames (every 2 s across the draft, plus bursts at 2–4 frames on the risky moves). Smoothness and rhythm at real speed are unverified.
- Not viewed on a physical phone. Phone readability was judged from scaled stills; the smallest recurring text is the 28 px "ILLUSTRATION" label.
- Figure's announcement, Think Foundry's account and Figure's film could not be opened (network policy). Claims rest on consistent coverage excerpts and Yle's report of the host plant.
- The F.02 likeness was drawn without loading reference photos here.

## Human review list (in order)

1. Watch the 720p review copy start to finish with sound, at full speed.
2. Listen for: "F.02s" (0:24), "Imatra" (1:04), "Schwarzenegger" (1:21, 1:38), block joins at 0:22, 1:13, 1:41, 2:31, 3:15, 3:42; the entry sound against "steel" (0:02.6) and "landing" (4:07.5); whether the in-house music suits the channel, or swap in the Runway track (README).
3. Check the cold-open jump at full speed: the robot's brief touchdown on the steel (0:02.4–0:02.7) should read as a jump, not standing on lava.
4. Check that the simulation zoom-out (1:52.3–1:53.0) and the grid build read cleanly in motion.
5. Confirm the Figure quote's exact wording and date on figure.ai, and watch Figure's film once (UPLOAD_TEXT pre-upload checks).
6. Compare the robot drawing with official F.02 photos.
7. Read the captions once against the video (74 cues).

## After publication (learning plan)

Hypothesis: a visible, surprising action with early evidence holds viewers better than an abstract setup. Look at
impressions and CTR by traffic source, retention over the first 30 s, the curve right after the evidence panel (0:06–0:22)
and after the first explanation (0:22–1:13), the training section (1:41–2:31), average view duration, and whether comments
show viewers expected something else from the title. Don't draw strong conclusions from a small sample. If people click but
leave before 0:22, revisit title/thumbnail fit and the cold open's clarity. If they hold the opening but drop in the
training section, look at that scene's teaching first. If impressions stay low, don't assume the title is the only cause.
The backup thumbnail (B) is a genuinely different composition for a later test.
