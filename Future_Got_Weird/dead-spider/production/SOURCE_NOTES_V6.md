# Dead Spider V6: anatomy and compositing repair

A precision repair pass on V5:
- the source is `source/src/v6/`, a copy of `v5/`, plus fixes in the shared rig (`spider.ts`, `SpiderDraw.tsx`, new
  `occlude.ts`);
- the composition is `DeadSpiderV6`;
- the output is `exports/FGW_Dead_Spider_V6_FINAL_1080x1920.mp4`.

**Unchanged:**
- the narration (the approved V2 WAV, sample for sample);
- the caption text and timing;
- the runtime of 30.200 s;
- the sound design (the V5 effects, retimed to the cue times measured from the V6 picture);
- the story, cameras and scenes. The one exception is the explanation camera at 11–13.5 s, whose orbit is reduced by
  about 20°.

## Root causes found and fixed

1. **The curled pose folded the legs back into the body.**
   - **Cause.** In the rig's dead/curled pose (extension 0), the tibia–metatarsus–tarsus of every leg bent back so far
     that they passed through the front body section. It held for 0.0–0.3 extension: every curled or curling frame
     (the hook's start, the death curl, the leaf curl, the specimen on its pad, the second spider). A probe of all
     906 frames found legs inside the body in about 210 frames per leg.
   - **Fix.** `spider.ts` `CURL_FIX` adds small corrections (0–70° on the distal joints, fading out as the leg
     extends), found by search as the smallest that keep every segment, with its radius, outside both body sections at
     every extension. The legs now fold down and under, as in a real dead spider.
   - **Rest heights.** The curled spiders are raised to rest on their folded legs: a mat/pad clearance of 2.55 mm
     instead of 1.5 mm.
2. **Layer order changed with camera angle.**
   - **Cause.** Every part was depth-sorted by its centre. That is wrong for a thin limb lying against a large rounded
     body: a leg just in front of the abdomen could sort behind it, and a leg behind it could pop in front, flipping
     as the camera moved.
   - **Fix.** `occlude.ts` tests each leg and palp segment against each body ellipsoid along the actual line of sight.
     Where they overlap on screen, the segment is placed in front of the body if it is nearer than the body's surface
     along that ray, and behind it otherwise.
   - **Scope.** The test also covers the other spider's bodies in the final pickup. Spines are drawn with their own
     segment, and the joint membrane overlay in the leaf section is hidden whenever the joint is behind the body.
3. **The gripper's legs passed through the second spider's legs.**
   - **Cause.** The contact solver only knew the second spider's two body sections.
   - **Fix.** Its eight legs are now in the solid as capsules, in its own rotated frame.
   - **Placement.** It lies at 90° across the gripper, the angle at which no gripper femur meets its legs.
4. **One curled tarsus touched its neighbour (0.05 mm).** The fixed plan-angle jitter of right leg I was adjusted.

## Verification (geometry probes over the whole film; `qa/v6/`)

- **Leg inside a body** (its own prosoma or abdomen, or the other spider's), with segment radius, sampled at five
  points per segment on every frame: **0 frames** (V5: legs inside the body in about 210 frames per leg).
- **Leg against leg**, within one spider and between the two spiders, every other frame: **0 conflicts** (V5: up to
  0.46 mm of penetration in the final pickup).
- **The final pickup.**
  - All eight gripper legs touch the second spider (28.74–28.78 s) before it lifts.
  - It leaves the mat at 28.99 s and is suspended with a visible gap and shadow to the end.
  - The block grip: all eight legs touch it at 21.74–21.78 s.
- **Frame pages at 0.1 s steps** (every 3rd frame): `hook_0.1s`, `curl_6-8s`, `leaf_8-13.5s`, `claw_18-23.5s`,
  `payoff_26-30s`. Also `payoff_full.png` (full size), `every10th.png`, `loop_first_last.png`.
- **Export.**
  - Video: native 1080×1920 render, 30 fps, 906 frames, 30.200 s, H.264 High CRF 14, yuv420p bt709.
  - Audio: AAC 48 kHz stereo, 320 kb/s; −15.0 LUFS, true peak −2.9 dBTP.
  - Transcript: WER 0.011 for both recognisers ("they'd" heard as "they", as in the approved take).
- **Not done.** Nobody has watched or listened in real time. This environment has no display or speakers.

## Note on resolution

The brief says the V5 file was encoded at 512×910. ffprobe on the committed
`exports/FGW_Dead_Spider_V5_FINAL_1080x1920.mp4` reports 1080×1920 at 30 fps, 906 frames: it was a native-resolution
render. A 512×910 copy most likely comes from a preview or a re-encode outside this repository. V6 is rendered the
same way, at 1080×1920 from the vector source.
