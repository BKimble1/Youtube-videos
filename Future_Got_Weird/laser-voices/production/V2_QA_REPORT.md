# Laser Voices V2: change and QA report

23 Oct 2026. V2 rebuilds the picture only. **Not published, not final.** Nobody has watched or listened to it in
real time; every check below was done by measurement or by looking at still frames (see "How it was reviewed").

## Files

- `exports/FGW_Laser_Voices_V2_REVIEW_1080x1920.mp4`: 1080×1920, H.264 High, 30 fps, 1022 frames, bt709.
- `exports/FGW_Laser_Voices_V2_MASTER_2160x3840.mp4`: native 2160×3840 (vectors rendered at 2×, not upscaled), the
  same cut.
- `captions/FGW_Laser_Voices_V2.srt`: a copy of the V1 SRT. Checked against the burned-in captions: same 23 cues, same
  words, start/end within 20 ms.
- Source: `source/src/v2/` (composition `LaserVoicesV2`). The rebuild steps are in `README.md`.
- Evidence: `qa/v2/`.

V1's exports, source, audio and captions are untouched.

## Audio: locked, copied, verified

- **How:** the V2 picture was rendered with `--muted`. The audio was then copied in from V1 with `ffmpeg -c copy` (no
  decode, no re-encode). `tools/mux_verify_v2.py` does the mux and the checks. The review takes its audio from the V1
  review; the master takes its audio from the V1 master.
- **Packets (review):** V1 and V2 each have 1599 AAC packets. The payload hashes and the timestamps match packet for
  packet (`ffmpeg -f framemd5` on the copied stream).
- **Decoded:** the PCM md5 is identical, `1ac0c10f786f262af1407376239d2bd0` (13,082,624 bytes).
- **Stream parameters:** identical: AAC-LC, 48 kHz, stereo, 317,390 b/s, 1599 frames, duration_ts 1,635,312.
- **Durations:** container 34.069 s in both. The picture is 1022 frames = 34.067 s.
- **Master:** the same check on the master pair is in `qa/v2/audio_master.json`.
- **Scope of the claim:** the *audio stream* is byte-identical. The MP4 files as a whole are different files, because
  the video differs.

The QA pass on the V2 review agrees:
- audio offset against the approved V1 mix WAV: 0.0 ms, correlation 0.99996;
- loudness −14.5 LUFS, LRA 3.8, true peak −2.6 dBFS (the same as V1);
- Vosk transcript WER 0.01 against the approved narration. The one "difference" is its → it's, which ASR cannot tell
  apart; V1 measured the same.

Nothing in the audio was regenerated, edited, re-timed or added.

## The message gate: picture follows the locked audio

The mix's message is on in frames 0–116, 532–595 and 718–814, and from frame 958 to the end. It is off from frame
815 to 957 because of the obstruction.

- **The crossing is solved against those frames.** The clerk's torso (a box at chest height) enters the path on frame
  815 (27.167 s) and leaves it on frame 958 (31.933 s).
- **One function drives the picture.** `received = message on AND not blocked`. It drives:
  - where the drawn path ends;
  - whether the downstream path is drawn;
  - the ear accent;
  - the lead's reaction.
- **Verified frame by frame.** `tools/check_v2.ts` compares that function with `audio/cues.json` on all 1022 frames:
  **0 mismatches**.
- **Her feet land on the footsteps already in the mix:** 14 strikes from 23.029 s to 33.883 s
  (`audio/sfx_cues.json`); the gait planner plants a foot on each.
- **The other effects already in the mix are matched by the picture:**
  - the two glass sounds (9.25 s, 14.83 s) now go with the dive into and out of the air;
  - the absorption tick (10.76 s) goes with the packet's absorption;
  - the expansion puff (12.3 s) goes with the expansion;
  - the latch and slide (15.96–16.4 s) go with the cover sliding off;
  - the four mirror ticks fall on the mirror's turnarounds;
  - the cover closing (22.28–23.02 s) is matched;
  - the 8 FT tick (22.53 s) falls on the end of the line's draw.

## What changed (V1 → V2)

Before/after frames, each V1 | V2 at the same time:
- `qa/v2/before_after_hook.png` (0.5 s);
- `before_after_mechanism.png` (12.8 s);
- `before_after_crossing.png` (28.6 s);
- `before_after_restore.png` (32.2 s).

| | V1 | V2 |
|---|---|---|
| Characters | 3D-projected mannequins (recipient and bystander) | The Weird Crew lead and clerk from Infrared Contacts, flat vector |
| Room | Beige room, doorway, laser sign, whiteboard | Teal/navy room; one low optics cart (laser head and control box); a clear aisle; one landmark (a night window); a doorway in the left wall as her destination |
| Camera | 3D orbit through named views | One fixed projection, a 2D log-zoom camera (Contacts style), continuous velocity through keys |
| Explanation | White magnifier circle, leader lines, legend pill, "H₂O" label | A dive into the air beside the ear: no inset, no labels, no text |
| Overlays | Path labelled "IR PATH · ILLUSTRATED", shown from 8.84 s to the end | Unlabelled dashed path, shown only in four windows (0.8–3.95, 15.0–16.7, 17.45–20.05, 25.1–33.6 s); "8 FT" on the floor once |

### Reused and redrawn (honest accounting)

**Ported from Infrared Contacts** (`claude/new-session-fmiflr`, `source/src/art/`):
- **The lead's head** (`Lead.tsx` `LeadHead`): silhouette, spiky hair and locks, near eye with lids, lashes and iris,
  brow, nose wing, mouth, cheek and jaw shading, all colours. Copied geometry with V2 additions.
- **The clerk's head** (`Train.tsx` `Sender`): silhouette, hair and high bun, ear and gold earring, eye, brow, square
  glasses, nose, mouth, all colours.
- **The lead's torso:** shape, stripes, collar, the stroke-arm construction.
- **The clerk's cardigan torso.**
- **The paper cup:** the Crew cup from the train table.
- **The palette and the camera maths** (`lib.ts`).

**New in V2:**
- **The lead's visible ear.** The Contacts head hid its ear under the skin fill. V2 draws a helix, antihelix,
  concha, tragus and canal entrance, plus the ear-canal anchor used for the close-ups.
- **The lead's expression controls:** wide eye, brow knit, mouth corner down, open mouth.
- **The clerk's lids, blowing mouth and head tilt.**
- **Both standing bodies:** hips, jointed legs with IK knees, shoes, IK elbows and attached hands.
- **The lead's sheet of paper.**
- **The walk:** planted feet, swing arcs, heel and toe pitch, pelvis bob, far-arm swing.
- **The front views on the cast sheet:** drawn for the comparison only, not used in the film.

**V1 mannequins:** not reused or recoloured.

### Cast check

`qa/v2/cast_sheet_round3.png` shows:
- the lead and the clerk standing, and the clerk mid-step;
- the lead's five expressions: neutral, surprise, concentration, puzzlement, recognition;
- three clerk head states;
- front views of both heads.

**Fixed between rounds:**
- the knee outlines showed as circles (the cap arcs were drawn the wrong way);
- the legs were too long;
- the clerk's elbow bent the wrong way;
- the lead's hands sat inside his torso;
- the expressions were too weak to read at phone size.

### Staging (all one room, fixed sides)

- **Plan:** the emitter is at lower left, on a low cart. The lead's exposed ear is at upper right, 2.44 m (8 ft) away.
- **The lead:** always faces right. The same ear is exposed throughout.
- **The clerk:** starts at the lead's right with her cup. She crosses at the halfway point of the path (1.22 m from
  the exit) and leaves through the left. She never reverses or jumps.

**The movements:**

1. **A, 0–4.1 s.** Frame 0 is already reacting: the lead's face and ear are large, and the clerk is at the frame edge
   blowing on her coffee. On "beside you" she glances at the lead. The camera eases out and down-left to bring in the
   cart, with a sparse dashed path.
2. **B, 4.1–8.85 s.** A move to the exposed ear, with nothing in it. On "invisible" the view shows no beam.
3. **C, 8.85–14.8 s.** The dive enlarges the air beside the ear: the ear rim slides to the edge and the rest settles
   into the dark of the air. The camera then tracks:
   - an amber IR packet;
   - its absorption by H₂O (shown at a closer scale);
   - the molecules jostling faster;
   - the warm pocket expanding;
   - teal and cream pressure fronts, followed to the ear opening.
4. **D, 14.8–23 s:**
   - out by the ear;
   - along the path to the laser head;
   - the cover slides off and the scanning mirror swings, slowed;
   - back along the outgoing beam to the listener, where the sound wavelets gather;
   - a compact source + listener view with the 8 FT floor line;
   - she sets off.
5. **E, 23–32 s.** A tighter three-quarter view: the source edge, her crossing and the lead's face. She pauses to blow
   on her coffee, steps on, and stops for a sip right in the path.
   - **The cut frame (815):** the path ends at her near side, the downstream path and the ear accent are gone, the
     lead's puzzlement starts, and the control-box LED stays lit.
   - **While blocked:** the camera pushes in.
   - **At 958:** she has cleared the path, it reconnects, the accent returns, and the lead recognises the voice (brow
     lift, head angle returning, nod).
6. **F, 32–34.07 s.** She walks on out of frame left. The camera pushes back into the opening face/ear framing.

## Measured checks on the review MP4

- **Picture:** 1080×1920, 1022 frames, 30/1, yuv420p, bt709. 69 keyframes, max gap 0.5 s. No black segments, no
  freezes ≥ 1 s.
- **Motion scan** (`qa/v2/motion_scan.json`): one flagged frame-change spike, frame 323 (10.767 s). That is the
  intended absorption beat on the existing tick: the packet vanishes into the molecule and its glow appears. There
  are no one-frame resets.
- **Fastest camera move:** the whip along the path from the ear to the laser head (15.2–16.1 s, peak mean change
  22.8/255). It is continuous: strips are in `qa/v2/strips/air_exit.png`.
- **Captions:**
  - Vosk agrees on 22 of 23 caption windows. The miss is "absorbs its light," where ASR hears "it's".
  - Captions sit at one fixed screen band (y = 1500 px). They clear the ear, the absorbing molecule, the mirror and
    the occlusion point in every checked frame (`qa/v2/review_phone_ui_sheet.png`, with an approximate Shorts UI
    mask).
- **Hook against the reference:** `qa/v2/hook_vs_contacts_phone.png` sets V2 against Infrared Contacts V2 at phone
  size. The Crew style matches; the Contacts hook is a tighter macro.
- **Strips** (`qa/v2/strips/`):
  - `block.png`: frames 807–825, the cut on 815;
  - `clear.png`: frames 951–966, the return on 958;
  - `air_entry.png`, `air_exit.png`, `walk.png`.

## How it was reviewed

- Still frames, contact sheets and frame strips rendered from the MP4s.
- A motion-spike scan.
- ffprobe and ebur128 measurements.
- Vosk ASR.
- The packet and PCM hash comparison.
- The frame-by-frame gate check against the audio's own cue file.

Nobody (me included) has watched the film in real time with sound. Timing feel, the pace of the camera whip at about
15.5 s and how the footsteps sit under her feet should be judged by watching it.

## Known defects and simplifications

1. **She passes in front of the lead.** Before the crossing (22.9–23.9 s) she walks in front of his face and ear on
   screen. The geometry forces this: she has to be nearer the camera than the listener to be upstream on the camera
   side. The camera position and her early pace were chosen so the pass ends (23.90 s) before the message returns
   (23.93 s).
2. **The laser head is stylised.** It is a flat side view rotated to the path's on-screen angle, not a true
   perspective view. The mirror's swing is exaggerated and slowed (as in V1).
3. **Flat figures in a perspective room.** The characters are flat drawings placed at their projected feet. The
   camera looks slightly across the room, so her profile does not change as she walks, and her size shrinks about
   18 % across the walk.
4. **Depth haze in the dive.** During the dive (9.2–9.9 s and 14.8–15.4 s) everything except the ear darkens into the
   air colour. In those transitions the head looks briefly greyed.
5. **The obstruction is a chest-height box.** It models her torso, not her full silhouette. Where the drawn path ends
   on her is the projection of that box's entry point, so it lands near her cup hand.
6. **The mechanism is a simplification.** The water share is exaggerated so one absorber can be followed.
   "Agitation" is drawn as cream tick marks. The fronts are drawn to the ear opening only.
7. **The ending does not loop.** The last frame differs more from the first than in V1 (mean difference 44.8 against
   16.4), because the opening has the clerk in frame and the ending does not. No loop was asked for.
8. **Wide moments.** The compact source + listener view (20.6–22.9 s) and the passing view at about 4 s are the
   widest frames. The characters are small there.
9. **The science is unchanged from V1.** The primary sources are still unread from this environment, and the
   obstruction ending is still physical inference (`production/SOURCE_NOTES.md`).
10. **No promises about performance.** This report makes no claim about CTR or retention.
