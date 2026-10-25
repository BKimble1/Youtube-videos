# Glass Climbing V2: report

**Deliverable:** `exports/FGW_Glass_Climbing_V2_REVIEW_1080x1920.mp4` (1080×1920, 30 fps, 1162 frames, 38.74 s,
captions burned in). **Not published.** Checked from the rendered file with stills, contact sheets, frame strips, a
phone-size sheet, machine measurements and two speech recognisers. **Nobody has watched it in real time with sound.**
The narration is still V1's stand-in voice (Runway eleven_v4 "Benjamin"; see `audio/narration/voice_provenance.json`).

## What changed from V1

| Brief item | V2 |
|---|---|
| Hook (0-4 s) | Frame 0 is a wide on a tall glass curtain wall over a brick knee wall: he is already gripping both pads, crouched on a step stool. By 0.5 s his left foot steps off into its stirrup, the straps snap taut and he drops about 10 cm before the pads hold (overshoot and settle, hair and shoulders follow). The camera then moves in one take to his hands and pads, down to his feet in the stirrups over the stool, and up with him as he stands. |
| "Climb it like Spider-Man" | A real move: the lower pad peels, goes up past the other and is seated; he pulls himself up onto it against the transom above; the camera goes straight in to that pad. |
| Microscopic section | Five connected stages instead of one held side view: tiles darkening through the glass → in to one tile → its ridges stand up into a 2.5D field of wedges (turning camera, depth, light) → glass meets the tips, the blades bend and lie flat (animated deformation, contact patches darkening) → in to one contact → scale bridge to the molecules (glass atoms, silicone chains, the gap closing, faint short ticks only) → straight back out through thousands of contacts to the pad holding him. |
| Springs | The cutaway now takes up the load tile by tile, each spring overshooting and settling, the tiles darkening as they share it; one-tendon comparison; the camera travels instead of holding. |
| Climb sequence | One wide take on the wall with the window frames as fixed marks: weight onto the upper pad, the lower pad peels, the camera follows it up to its new seat, he steps up after it. |
| The catch | He looks down; the camera follows his look to the bricks below. Smooth-glass section, then (after an off-screen descent) he brings the pad down onto the brick, presses it on, tests it (it seems to hold), the brick section shows few tips touching and skidding, then he pulls and the pad creeps, tips and tears off the brick; he rocks back. |
| Seamless loop | He lifts the pad back to the glass and presses it on while the camera eases back to frame 0's wide. The last frame is the frame before frame 0 of the same motion (the climb model is periodic: every state at frame 1162 equals frame 0). The narration tail is shortened to a 0.42 s sentence pause; the bed and effects wrap across the junction. |
| Sound | V1's synthesised palette retargeted: pad engagement, strap tension under the drop, spring stretches, peels, and a sharper tearing peel for the brick failure; whooshes only on the two big scale changes. |

## Measurements from the file

| Check | Result |
|---|---|
| Streams | H.264 High, 1080×1920, 30 fps, 1162 frames, yuv420p, BT.709; AAC 48 kHz stereo 317 kb/s; 38.74 s |
| Loudness | -14.6 LUFS integrated, LRA 1.7 LU, true peak -2.9 dBFS |
| Black frames / freezes | none / none |
| Audio sync vs the mix | offset 0.0 ms, correlation 0.99994 |
| Speech (MP4 audio) | Whisper base.en WER 0.008 ("pressed" → "press"); Zipformer 0.025 ("onto" → "on to", "grip" → "gripe"); Vosk small 0.084 (its usual mishearings) |
| Captions vs Vosk words | 26/28 windows ≥ 0.75; the two misses are Vosk errors ("climate", "put"), not timing |
| Motion scan | mean frame change 8.35 (V1: 6.55); every spike is on a planned cut (176, 535, 680, 905, 971, 1064, 1106); no run of 12 near-still frames; the quietest stretch is 741-755 (15 frames under 1.0, the end of a stand-up) |
| Loop seam, picture | last frame → frame 0: mean change 2.23, against 2.63 and 3.05 for the two steps before it (the junction is the smallest change in that stretch) |
| Loop seam, sound | the mix's last and first samples differ by 0.0022; the MP4's AAC stream ends with 6 ms of encoder padding (a container artifact) |
| Loop played 3× | `qa/FGW_Glass_Climbing_V2_loop_x3.mp4`: last 1.5 s → first 1.5 s, three times |
| Rig probe (`tools/v2/rig_probe2.ts`, every on-screen frame) | worst hand-to-bar error 6.5 units (~1 cm), leg reach ≤ 0.95, strap stretch ≤ 1.00, a loaded pad slides at most 0.9 units/frame (the brick creep at 1111 is deliberate), no foot or hand jump beyond the pad moves; frame 1162 equals frame 0 in every joint |

## Fixed during this pass (found on sheets or in the scan)

- Near arm across his face as he stands past the near pad: he now tips his head back and turns it a little whenever
  his face passes the near pad's height.
- Hands off their bars during the first stand-up and the descent (up to 94 units): the stand-up now finishes later
  and less high, he leans closer to the wall while working high, and crouches deep at the brick.
- The molecular view arrived as a small rectangle in a dark surround, with a hard pop: the molecular drawing now
  covers the frame, and the change of scale is a dissolve at the same place with both layers moving.
- The cut from the through-glass tile to the field changed scale and colour: the tile now fills the frame and the
  field opens at the same ridge spacing under the same tint.
- Captions over his hands and the pads (frames 0-120, 150) and over the bending blades (270-380): moved.

## Remaining limitations

- **Stand-in voice**, not the channel narrator (ElevenLabs credits). Not listened to by a person.
- **The descent is off screen** (905-971): he is high on the wall before the glass section and at the stool after it.
- **Molecular bridge is a dissolve**, not a continuous zoom; the molecular view and its ticks are a cartoon.
- **Set is illustrative** (wall, brick knee wall, stool); the Stanford climb used a plain glass wall.
- **Foot stirrups** are still unconfirmed by a fetched source.
- **Quietest stretch** 741-755 (end of a stand-up, the camera settling): moving, but slowly.
- No 2160×3840 master was asked for in V2; none rendered.
