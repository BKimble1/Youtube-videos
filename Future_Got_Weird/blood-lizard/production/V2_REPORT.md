# Blood Lizard V2: rebuild review report

**Deliverable.** `exports/FGW_Blood_Lizard_V2_REVIEW_1080x1920.mp4`: 1080×1920, 30 fps, H.264 (CRF 16, yuv420p,
BT.709) with AAC 320 kb/s stereo. It has 630 frames and runs 21.000 s. sha256 `c642b5bc…bd2b`. **It is not published.**

V1 is kept for reference: `exports/FGW_Blood_Lizard_V1_REVIEW_1080x1920.mp4`, source at commit `58a3cce`.

## Narration

The narration is the approved ElevenLabs master, unchanged and sample for sample
(`audio/narration/FGW_Blood_Lizard_narration_V1.wav`, sha256 `0ec26019…`). The picture is keyed to its measured
word times (`source/src/data/timeline.json`). On the final V2 file, Whisper base.en gives WER 0.000, so no effect
masks a word.

## What was rebuilt

| Brief | V2 |
|---|---|
| 0–1 s: charging predator, the eye fills the camera, the jet fires at its face, one smooth move | Frame 0 is already the lunge, jaws open beside the lizard. One continuous rush puts the eye full frame at 0.4 s. The jet fires from the front corner of the lids at 0.42 s, and the camera races along it to the muzzle. |
| 1–3 s: the blood strikes the mouth and muzzle, and the predator recoils | Impact at 1.02 s (sharp hit and splat): blood on the lips and in the mouth, then a snap of the head up and back, with tongue out, squint and ears flat. A head shake follows at 1.85–2.6 s. |
| 3–6 s: follow the blood back, seamlessly, into a clean cross-section | The squirt loses pressure, so the place the stream lands moves back across the sand to the lizard. The camera follows it back to the eye, where a crisp cutaway window opens (3.55–4.3 s). |
| 6–9 s: pressure rises and a brief release, as one continuous action, with no detached eyeball or impossible red shapes | The eye stays whole and seated in its lids, and is redrawn over the cutaway. The sinus is an even ring round it, inside the socket. The predator's shadow and growl arrive, the muscle squeezes the outgoing vein shut, and each heartbeat swells the ring while its wall stretches thin and glossy. The tiny vessel in the lid balloons at the front corner, and on "BURST" (9.16 s) it tears at the pore. |
| 9–12 s: pull back to the full lizard as the jet shoots at the predator | The camera rides the new stream out to the whole lizard while the coyote lunges in again. The stream lands in its mouth on "mouth" (12.38 s). |
| 12–16 s: jerks its head away and backs off, with no bite and no swallowing | No bite, ever. The coyote jerks its head away and backs off a stride. It grimaces on "disgusting", with tongue out, nose wrinkled and lips curled, then shakes its head and spits (drops of bloody saliva) on "spit". |
| 16–19 s: the lizard scurries away while the predator stays repelled | The lizard pivots (a true 3D turn: body, horn crown, legs and tail all rotate) and scurries left across the sand. The coyote stays in frame at first, pawing at and rubbing its muzzle. |
| 19–21 s: the predator turns back, the lizard pivots and raises its head, and the camera pushes toward its eye into the opening | The coyote charges back in from the right. The lizard turns back to face it and raises its head, its lids swelling. The camera pushes toward the eye: this is frame 0. |

**Loop.** The lizard really travels. The film ends one desert period (45 cm) to the left of where it began. Every
desert layer is periodic in that distance, so the last frame continues into frame 0 exactly.

## Rigs changed for V2

| File | Change |
|---|---|
| `source/src/art/lizard.tsx` | Rebuilt in full 3D with a heading (yaw): the body as disc and dome hulls, a 3D head and horn crown, both eyes, and the near and far legs and tail sorted by depth. The pore moved to the front corner of the lids. |
| `source/src/art/section.tsx` | New. It replaces V1's `sinus.tsx`, with a clean window, the ring sinus and the lid vessel. |
| `source/src/art/coyote.tsx` | Mirrored (faces left), with a running gait and paw lift scaled to its stride. |
| `source/src/art/desert.tsx` | Periodic layers. |

## Measured QA (`qa/v2/`)

- **Format.** `render_qa.json`: 630 frames decode with no errors. The median frame-to-frame change is 2.84. There are
  no unplanned large changes. The planned fast moves are the opening rush and the race along the jet (0–1.35 s), the
  rupture, the second hit, the spit, and the charge into the loop. The longest near-static run is 3 frames.
- **Loop.** The last frame against frame 0 measures MAD 8.5, the same size as the neighbouring frames in the
  opening rush: the camera is mid-move at the seam, as briefed. `loop_seam_last3_first3.png` shows one continuous
  push-in. The audio seam jump is 0.02, with the music period dividing the film (36 beats) and the growl placed across
  the wrap.
- **Contact sheets.** `contact_every_0.5s.png` and `hook_0-2.5s_every_3rd_frame.png`.
- **Mix.** `mix_measure_mix_v2.json`: −13.7 LUFS integrated, true peak −1.66 dBTP, voice −16.9 LUFS, effects and music
  bed −26.5 LUFS. At the loudest events the effects stay 3–8 dB under the voice.
- **Sounds.**
  - Predator growl and paws on sand: the charge, the steps back, and the lunges.
  - The sudden fluid release: the hook's squirt and the burst.
  - Sharp impacts: both hits.
  - The recoil: snort, head-shake flaps, gag and spit.
  - Sand: the lizard's claws, the pivots, and the muzzle rubbed in sand.
  - Inside the head: heartbeat, vessel stretch and the muscle squeeze.

## Known issues (for review)

- **The coyote's body.** In the reaction and escape shots it is seen as head, neck, shoulder and a foreleg. Its
  hindquarters stay right of frame: a whole coyote beside a 10 cm lizard does not fit a 9:16 frame at a readable lizard
  size.
- **The escape.** From about 17.5 to 19.4 s the camera follows the lizard alone. The repelled coyote is out of frame
  but still audible (rubbing its muzzle).
- **The cross-section.** It runs about 3.6–10.1 s while the narration explains the mechanism. Something changes every
  0.4–1.0 s: the window opens, the shadow, the squeeze, then each heartbeat step, the blister, the push to the pore and
  the burst. The framing itself is one continuous slow push.
- **The stream's speed.** Both streams travel slower than real, so the camera can ride them.
- **Audio not auditioned.** This environment has no playback. Levels and intelligibility were measured (by ASR).
- **Subtitles.** None are burned in, matching V1 and the earlier brief. The approved subtitle file can be added at
  upload.
