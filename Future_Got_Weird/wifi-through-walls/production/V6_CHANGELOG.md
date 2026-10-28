# Wi-Fi Through Walls: V6 change log (cinematic stability and character rig pass)

**Kept from V5:** the approved narration (same audio file and timing, same ElevenLabs take), the subtitles, the story
order, the runtime (36.47 s), the characters, the sets, and V5's choreography and screen designs.

**Changed:** the cameras, the café shot geometry, the joins, and the rig details below. The code is in
`source/src/v6/` (copied from `v5/`); the joins are in `source/src/Film.tsx`.

## Camera: measured before and after

`tools/v6/cam_probe.ts` measures how far the camera itself moves the picture each frame. Results are in
`qa/v6/cam_probe.json` and `qa/v6/cam_probe_V5_baseline.json`.

| | V5 | V6 |
|---|---|---|
| Mean camera motion | 15.3 px per frame | 3.85 px per frame |
| Frames with a still camera | 100 | 619 |
| Frames moving 15 px or more | 409 | 42 |
| Fastest single move | 123 px per frame (the corridor push) | 55 px per frame (the ending's split-screen slide) |
| Mean change of the whole picture, from the MP4 | 10.1 | 5.0 |

The 42 frames at 15 px or more are the two eased inward dolly moves and the ending's split-screen slide.

## Shot by shot

| Time | V6 |
|---|---|
| 0–3.6 | **Opening:** the cutaway holds still while he moves. His arm snaps up and the skeleton follows; he tucks in with his hand at his chin. Then one slow push on the wall between him and the screen. V5's face close-up and its move through the concrete are gone. |
| 3.6–5.7 | **The transmitter:** a near-still shot while the box opens and the packets leave the array. |
| 5.7–8.3 | **The whole signal path, held wide:** packets cross the room and the wall, reach him as he rises, and the echoes return. |
| 8.3–10.7 | One slow push into the screen, where the traces become his pose. |
| 10.7–14.9 | **Demo:** one locked side-by-side shot (him, the wall, the screen) for the right-hand raise, the turn, the step and the crouch. The camera sits left of the wall so the wall's cut face never hides him. The screen no longer pushes in on "creepy": the skeleton fills and walks out as before. |
| 15–17 | **Street:** a slow side track as he walks along the café. |
| 17–19 | **One inward move** to the right window, ending outside the glass: the router talking to the customers' devices, and the receiver with its laptop. |
| 19–20.8 | **Split screen:** a locked exterior shot of him passing the café above (V5 used an interior reverse angle); the receiver's laptop matching his steps below. |
| 20.8–22.3 | A steady close track at his own speed, ending on the lamp-post wipe. |
| 22.3–27.1 | **Study:** the corridor drift continues. The fast push onto the data wall is gone; the matching screen dissolves in (0.35 s). The zoom into his tile is slower and smaller (4× over about 1 s, was 10× in 0.3 s), then dissolves to him at the café (0.4 s). |
| 27.1–30.2 | **Payoff:** a slow track as he walks past the café, then one move in to the window: the receiver's laptop matches his live pattern to the stored #12. V5's dissolve cutaway and interior reverse angle are gone. |
| 30.2–31.85 | Back to him close, a steady track, completely unaware. |
| 31.85–33 | **CCTV:** a locked street shot. A CCTV camera on the lamp post (new: a solid 3D housing, aimed at the sidewalk) is high in frame, and he walks toward it, glancing up. |
| 33–34.4 | The CCTV's own picture, **fixed**, as a street camera is (V5's followed him); he walks through it. |
| 34.4–35.3 | **"Or Wi-Fi":** the CCTV picture slides up and the Wi-Fi receiver's laptop rises below it, with his live signal and the match on #12. Camera and Wi-Fi in one frame. |
| 35.3–36.47 | A 0.3 s dissolve into the opening composition, **held still**: he backs in behind the wall and drops into frame 0's crouch while the screen follows him. The loop seam's picture change (2.45) is below the median frame-to-frame change (2.75). |

## Geometry and continuity

- **Screen direction:** every café shot is now from the street side, so he always walks screen-left. V5's reverse
  angles (from inside the café, and from behind the CCTV) flipped his direction three times.
- **Receiver placement:** the receiver moved to the right-hand end of the right window. Its laptop faces the window,
  so the street-side cameras can read it. The customer's table moved left to keep it clear.
- **One continuous walk:** G and H are now a single walk past the café and on to the lamp post. In V5 he jumped from
  the café to a different corner.
- **CCTV on the lamp post:** the camera now hangs on the lamp post (`cafeSet6.tsx` `Cctv`). It is drawn as an oriented
  box: faces back to front, only the faces toward the lens, the lens on its front face.

## Rig and face

- **Eye glances:** in the lab, the eye glances were an instant step (a jump); they are now eased. The startle and
  test glances are spread over 0.2 s or more.
- **Face probe:** `tools/v6/face_probe.ts` (results in `qa/v6/face_probe.json`) records the per-frame change of head
  turn, neck, gaze and mouth for him in every scene. Apart from scene changes and blinks, the largest changes are:
  - head turn 0.23, which is the dissolve between the café and the lab, not a pop;
  - neck 3.6° in one frame, during the deliberate arm snap at 0.45 s;
  - gaze 0.35, also at the café-to-lab dissolve.
- **Rig probe** (`qa/v6/rig_probe.json`; every frame of him and the walkers):
  - planted-foot slip, ankle miss and backward elbows: none;
  - bone-length drift: at most 0.01 units;
  - peak joint acceleration: 37.8 (lab) and at most 53 (walkers), the same as V5.
- **Head layers, checked at full resolution** (arm snap, turn, step, café walk, the look up at the CCTV): the hair
  stays on the scalp and the brows stay below the hairline. These are guaranteed by the existing head rig, which draws
  them in one head group around the neck pivot and clamps the brows under the hair.

## Sound

`tools/v6/make_audio6.py`, with timing from `tools/v6/events.ts` (written to `audio/v6_events.json`):
- **Removed:** the cues for moves that are gone (through the window, the cutaway, the CCTV servo).
- **Added:** soft dissolve cues, and the laptop rising in the ending.
- **Ambience:** street and café beds follow the camera, which now always stays outside the glass.
- **Levels:** −14.3 LUFS; true peak −1.4 dBFS; the mix is sample-continuous across the loop.

## Checks on the delivered MP4

**File:** H.264 High, yuv420p, BT.709; 1080×1920 rendered natively; 30 fps; 1094 frames; 36.47 s. AAC 48 kHz stereo
at 320 kb/s; audio-to-video lag 0 ms.

**Measured:**
- **Loudness:** −14.3 LUFS, true peak −1.4 dBFS.
- **Black frames and freezes:** none.
- **One-frame pops** (`qa/v6/V6_pop_scan.json`): none.
- **Motion spikes** (`qa/v6/V6_motion_scan.json`): only at cuts and dissolves (3.6, 5.8, 11.1, 19.0, 20.8, 22.6,
  30.3, 31.9 and 33.0 s), plus the box cover opening (4.6–5.2 s).
- **Speech recognition:** Whisper 0.9% WER (drops "anything", as before).

**Frame review:** done from the MP4: every 3 frames for 0–3.5 s, every 4 frames through the demo and the
ending/loop seam, every 6 frames elsewhere. Head close-ups were checked at full resolution. The one defect the
review found (the wall's cut face hiding part of him in the side-by-side demo) was fixed and re-rendered, and the
demo was then re-checked on this render.

## Remaining visual defects (known, not fixed)

- **Exits at the frame edge:** during the two inward dolly moves (17.6–18.0 s and 28.5–28.9 s) he walks out at the
  left edge, so for a few frames a large slice of him is at the edge.
- **Pedestrian crossing:** at 16.1–16.5 s the pedestrian walking the other way passes directly behind him. She is
  correctly behind him (drawn behind), but they overlap.
- **CCTV shot:** in the street shot at 31.9–33 s the lamp-post CCTV is cut by the top of the frame, and he is fairly
  small.
- **Partly hidden by the wall:** in the lab opening and ending he is partly hidden behind the wall's cut face when he
  presses against it. This is intended (he is hiding), but at the ending's 36.0–36.3 s only his legs and an arm show
  for a moment.
- **Ending split screen:** the CCTV picture slides up with the laptop (about 55 px per frame for 0.3 s). This is the
  fastest motion left, and it is a layout move, not a camera move.
- **Not done:** no real-time viewing with sound. The audio was checked by measurement and speech recognition.
