# Dead Spider V4: final polish notes

V4 is a polish pass on V3, not a rebuild. The source is `source/src/v4/`, a copy of `v3/` with targeted changes, and the
composition is `DeadSpiderV4`. The output is `exports/FGW_Dead_Spider_V4_FINAL_1080x1920.mp4`.

**Unchanged:** the approved narration (the V2 WAV, word for word and sample for sample; stem correlation 1.000), the
caption text, the caption timing and the caption design. Runtime is 30.200 s (906 frames).

## What changed

**Hook (0–4.52 s), rebuilt.**

| Time (s) | Action |
| --- | --- |
| Frame 0 | Big curled dead spider on the dark mat, with the needle already coming down. |
| 0–0.36 | The camera travels down along the needle; it punctures the front body section at 0.22 s with a small shudder. |
| 0.36 | The stopper drives down and an air slug runs down the needle. The first three legs snap open at 0.47 s and all eight are open by 0.66 s. |
| 1.05–2.0 | The camera drops to a low angle and the legs hook downward, as if gripping. |
| 2.0–3.0 | Crane down into a low view of the spider hanging from the needle of the clamped syringe. The stopper moves in the barrel, and the legs answer each push and ease when it is let off. |
| 3.0–4.52 | In toward the spider; on "MOVE" the full push snaps every leg widest. The shot ends close on one leg, which matches the living spider's same leg in the next scene. |

**Death curl (4.52–7.80 s).**
- The legs fold one after another (0–0.3 s apart, front pair first) instead of all together.
- The camera pushes slowly down with the body as it sinks.

**Science (7.80–13.48 s).**
- The section view now uses a muted, translucent hemolymph inside the brown leg shell, with a soft travelling swell
  of fluid. This replaces the bright blue rods with white dashes.
- The background darkening is lighter.

**Lab (13.48–18 s).**
- **Operator.** He now stands closer, hips just below the bench top, so both elbows bend naturally. His right hand
  holds the forceps by their handle.
- **Opening shot.** A medium shot of him tracking in toward the needle.

**18–23 s, restructured.**
- **Before 18 s.** The arm now swings the gripper over the test block during the first push (16.5–17.65 s), so the
  legs open around the block.
- **The views:**
  - 18.15: a tight side view as the legs spring open over the block;
  - 19.0: a low view from bench level as the open legs come down around it;
  - 20.0: a three-quarter view on the plunger as the finger lifts and the plunger rises;
  - 21.0: down the needle with the air leaving it, onto a close three-quarter view of the grip;
  - 22.0: low from the other side, where the block comes up a little in the closed legs and a gap opens under it.
- **Contact.** All eight legs touch the block at 21.71–21.76 s, before "CLAMPED" (22.16 s).

**Ending.**
- The second spider is no longer visible on its platform in earlier shots, so the reveal on "ANOTHER" holds.
- The last frame now uses the first frame's camera angle and lens: the needle and hub in the same place, the spiders
  under them, a dark mat. The first-to-last frame difference is 22.6, against 26.7 in V3.

**Audio.** `tools/make_audio_v4.py` uses the same narration and bed, with 77 effects from the V4 picture
(`audio/cues_v4.json`):
- puncture and shudder;
- stopper and air;
- a snap for each leg as it opens;
- the legs hooking down;
- pushes and eases;
- the plunger rising and the air leaving;
- eight foot contacts on the block;
- the grasp and the held lift;
- the V3 ending sounds.

Integrated loudness is −15.0 LUFS and true peak −2.9 dBTP.

## QA (on the exported file; `qa/v4/`)

**File.** H.264 High, 1080×1920, 30 fps, 906 frames, 30.200 s, CRF 14, yuv420p bt709; AAC 48 kHz stereo, 320 kb/s.

**Audio and transcript.**
- No black frames.
- Transcript: Zipformer and Whisper each have WER 0.011. The only difference is "they'd" heard as "they", as in the
  approved take.

**Frame pages** (every frame):
- `first4s_*` and `hook_128`;
- `lab_405`, `needle_follow_461`, `open_under_533`, `release_grip_hold_600`, `lift_drop_704`, `reveal_grab_784`;
- also `every10th.png` and `loop_first_last.png`.

**Contact and lift.**
- The block leaves the bench only after all eight legs touch it.
- The second spider is touched by all eight legs (28.73–28.78 s) and leaves the mat at 29.07 s.

**Frame change.**
- Every jump over the threshold is on a planned cut or inside a continuous camera move.
- The largest inside a move is 33.9, during the 0.5 s ride down the needle onto the grip at 21.1 s.
- The V3 opening's section ride, which was the fastest move, is gone.

**Captions.** They stay clear of the spiders, needle and block, apart from transients of 1–6 frames during camera
moves.

**Not done.** Nobody has watched or listened in real time. This environment has no display or speakers.

## Known limits

- **The release shot (20.0–21.0 s)** holds one composition for about a second while the plunger rises.
- **The low "to pick up…" shot (27.0–28.3 s)** holds one composition for about a second while the gripper comes down.
- **Leg-on-leg collisions** are not solved. No crossing was found on the frame pages.
- **Runway** is still blocked by the network policy.
