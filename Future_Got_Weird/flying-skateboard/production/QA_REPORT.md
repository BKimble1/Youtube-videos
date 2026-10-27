# Flying Skateboard V1: QA summary

**Status (27 Oct 2026):** the V1 review is rendered and checked from the file. **Not published.** Nobody has watched it
in real time or listened to it here: this environment has no audio or video playback. Everything below was measured or
inspected as still frames.

## Output

| | |
|---|---|
| File | `exports/FGW_Flying_Skateboard_V1_REVIEW_1080x1920.mp4` (35.1 MB) |
| Video | H.264 High, 1080×1920, 30 fps, yuv420p, BT.709, CRF 16, 1077 frames, **35.904 s** (the container's 35.900 s of picture plus AAC priming) |
| Audio | AAC-LC 48 kHz stereo, 317 kb/s; mix **−14.02 LUFS** integrated (measured from the MP4), **−2.05 dBFS** sample peak |
| Captions | Burned in. The same chunks are also in `captions/FGW_Flying_Skateboard_V1.srt` |

Duration: the brief targets 36–38 s "adjusted to natural narration timing". The locked narration runs 34.16 s at its natural pace, plus:
- 0.10 s of lead (the first word lands at 0.13 s, while the board is already in flight);
- 0.30 s and 0.40 s of added breathing room after "FIRE." and "CANYON.";
- 1.75 s of tail for the bank and the loop return.

That makes 35.90 s. I did not stretch the narration to reach 36 s.

60 fps was not used: the established FGW Remotion workflow is 30 fps. The source is resolution- and frame-rate-independent if you want a 60 fps render later.

## Checks performed (all from the rendered file: `qa/v1_review_qa.json`)

- **Decode:** a full ffmpeg decode with no errors.
- **Black and frozen frames:** none (luma < 12, and no run of 31+ frames without visible change).
- **Loop junction:** the last frame against frame 0 differs by a mean of 1.37 (luma, 0–255). That is less than the film's median frame-to-frame step of 5.55, so the loop is smoother than a typical frame.
  - Picture: the ending is the hook's own trajectory, 4.1 s earlier. The camera spline lands exactly on frame 0's key with zero relative velocity.
  - Audio seam: 0.015, within normal sample-to-sample variation. The score's 72-beat grid (120.33 bpm) wraps exactly; the rotor oscillators are folded across the seam.
- **Largest frame step:** frame 280 (9.33 s), the fan → jet-intake match cut, as intended.
- **Narration:**
  - Both ElevenLabs takes were transcribed independently by Scribe. Each is verbatim; the only difference is "10" written as a numeral for "ten".
  - The mix's voice stem correlates 1.000 with the narration file (gain only).
  - Voice over everything else in the 400–5000 Hz phone band during speech: +14.5 dB.
- **Captions:**
  - Text is asserted equal to the locked script (`tools/make_narration.py`).
  - Each caption appears 40 ms before its first word.
  - Its position is fixed for the whole time it shows. It is chosen by sampling the rider and board's screen box seven times across the caption's display, inside the Shorts safe area (top 260 px and bottom 380 px kept clear).
- **Contact sheets from the MP4** (`qa/`):
  - `v1_review_sheet_first3s.png`: 0.00, 0.25 … 3.00 s, the brief's hook times;
  - `v1_review_sheet_fire.png`: the match and the fire reveal;
  - `v1_review_sheet_balance.png`: the problem and body-control sequence;
  - `v1_review_sheet_payoff.png`: river to canyon;
  - `v1_review_sheet_loop.png`: the last two seconds into the first two;
  - `v1_review_sheet_every_second.png`: one frame per second.

## Inspected and fixed before this render

- **Hook:**
  - Frame 0 originally looked down at flat water with no sky. It was rebuilt as a low front-¾ view: sky, gorge, the air gap and the wake in frame 0.
  - The low pass cropped the head; widened.
  - FLY and RIVER lost the horizon; reframed.
- **River set:**
  - Mountain reflections paled the far water into a hard band; replaced by a reflection band in the water gradient.
  - The town floated in front of vertical ridge faces; terraced slopes added, with each building seated on one.
  - Sky showed through behind the bank faces; terrace caps added and the water extended under the banks.
  - Ripples read as rain; replaced by short crests at four levels of detail, plus current slicks.
- **Rig:**
  - The front arm read as a punch toward the camera; lowered to a balancing pose.
  - The controller hand was verified numerically to sit at hip height (the low camera foreshortened it).
  - Close-ups clip parts that come within 8 cm of the lens.
- **Matches:**
  - The water-ring → dust-ring match put the camera inside the rider's legs; reframed as a low oblique view.
  - The fan → intake match: same screen radius, same rotation sense and speed, and a stable straight-down orientation.
- **Workshop:**
  - The bench camera sat outside the back wall; all workshop and bench-match cameras moved to the room side.
  - The fuel lines were drawn over the intakes; layer order fixed.
  - Smoke had hard edges; softened.
  - Ducts faded in; they now drop into place one at a time with a seating sound each.
- **Canyon:**
  - The floor gap showed white sky; a gorge floor was added.
  - The bend was too sharp, so the camera faced a wall; the bend is gentler now and the walls have tonal variation and cracks.
- **Ending:** a rider's-eye view on "PAY YOU", showing only his shins and shoes, the board and the water below.
- **Contact sheets:** early sheets showed artifacts from SVG id collisions and sub-pixel strokes at quarter scale. Sheets are now rendered at full resolution with per-tile ids.

## Known limitations and what V2 should improve

1. **Board geometry is not verified against the real board.** No reference image or video could be viewed here (blocked hosts are listed in `SOURCE_NOTES.md`). The ten-duct, white-frame board follows the reported specifications only. Check it against the real footage first; it is one table (`BD` in `art/Board.tsx`).
2. **The pilot is a new 3D rig**, not the crew's 2D 3/4 rig: the orbits, the underside views and the rider's-eye view need a body that turns. His face is under the visor, so no likeness is invented. Hands are gloved mittens with a thumb, not articulated fingers. A real-time watch should confirm the motion reads as smooth and weighty, not robotic.
3. **Some sets are plainer than the hook:**
   - the canyon walls (flat panels with strata and shrubs);
   - the bench sockets (empty light discs);
   - the town (simple blocks).
4. **Subtle story beats:**
   - the hot-air recirculation in the jet test is faint at phone size;
   - the dusk-and-dawn "ten days" sweep is subtle;
   - the early-training shot lasts 1.6 s.
5. **Sound:** synthesised and measured, but never heard. Listen for the rotor chorus timbre, the ignition level, the coach chime and the score's balance before V2.
6. **Runway was not used.** Every shot needed exact board geometry and stable anatomy, which the deterministic vector animation guarantees. In earlier FGW work, Runway outputs could not be downloaded into this environment (see `invisibility-shield` V4).
7. 30 fps, as the FGW workflow (see Output above).
