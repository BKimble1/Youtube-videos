# Laser Voices V6: final production pass, QA note

24 Oct 2026. V6 is the final production pass on V5. **It has not been published.**

Nobody has watched or listened to it in real time; I can't play video or audio here. The judgements below come from:
- contact sheets of the exported MP4 (4 frames per second, in `qa/v6/sheets/`);
- full-resolution frames and crops (`qa/v6/hands_*.png`);
- frame-difference measurements;
- geometric checks on the rigs;
- free speech recognition;
- audio measurements.

The shot plan is `production/V6_SHOT_PLAN.md`.

## Files

- `exports/FGW_Laser_Voices_V6_FINAL_REVIEW_1080x1920.mp4`, read back from the file with ffprobe
  (`qa/v6/ffprobe.txt`):
  - picture: **1080×1920**, H.264 High, yuv420p, bt709, **30/1 fps**, **1022 frames**, 34.067 s;
  - audio: AAC-LC 48 kHz stereo;
  - rendered natively at 1080×1920 (`scale 1`): nothing is upscaled.
- `captions/FGW_Laser_Voices_V6.srt`: identical to V1, burned in with the V3–V5 style.
- Source: `source/src/v6/`, composition `LaserVoicesV6`, still `V6Still`, rig sheet `RigSheet6`.
- V1–V5 are untouched.

## What changed from V5

**Characters (the V6 rig, `source/src/v6/rig/Crew6.tsx` and `walk6.ts`, built on the channel's crew rig)**

- **The guesser is clean-shaven.** V5's "beard" was the hair region showing on the jaw. His hair is now a cap over the
  crown and the back of the head, and the face oval is all skin.
- His design is otherwise unchanged in every shot: red spikes, round face, peach skin, pink cheeks, a white tee with
  saffron stripes.
- **Arms:**
  - tapered limbs with an ink silhouette, defined shoulder, elbow and wrist;
  - short sleeves on tees, long sleeves on jackets;
  - a fixed bone length per limb, with IK elbows bending on a pole, so no backward elbows.
- **Hands:**
  - drawn as a palm, fingers and a thumb, in seven shapes: relaxed, grip, open, fist, cup, point, mitt;
  - one constant size, scaled with the figure.
  - No ball fists and no circular wrists.
- **The cup:**
  - a paper cup held in a four-finger grip with the thumb over it;
  - one short sip (0.45–1.15 s into the loop); the cup is in front of her face for about 0.5 s.
- **The ear touch:**
  - the head turns first;
  - the arm rises with the elbow leading, through a point in front of the chest;
  - the hand cups behind the ear with the elbow out to the side, so it does not cover the face;
  - it holds, then lowers while he looks around.
  - The beats differ: an ear cup in the hook, a fingertip check at 5.0 s, chin in hand in F1, palms up in F3, and a
    jerk-and-cup in F5.
- **Walks:**
  - planted feet, the knees from IK, the pelvis shifting toward the standing leg with a hip roll;
  - the arms swing in opposition, the forward arm bending.

**Story beats**

- The hook, the science (A–D: the pulse, absorption, heating and expansion, repeated pressure rings, then the
  eardrum), the transmitter cutaway, the lab sweep, the 8 FT demonstration and the three-setup ending are as described
  in the shot plan.

**Review fixes made after the first full render**

1. **The A3 setup shot was re-framed.** The transmitter had been cut off at the frame edge. It is now a large shape in
   the right foreground, with the dotted path running to him in the middle distance.
2. **The F1/F4 side-on shot was re-framed.** It is centred between the laser and the listener and widened slightly, so
   LASER → path → walker → TARGET are all in frame.
3. **The whisper's air shimmer was rebuilt, and a far-eye glitch was fixed.**
   - V5's heat-haze circle sat on the ear. In the close shots it covered half his face and warped it (seen at 0.6 s,
     1.2 s and 32.7 s). V6 draws a smaller, gentler haze in screen space, just outside the head's silhouette on the
     ear's side.
   - A full-resolution crop then showed the rest of the glitch. At the peak of the hook's head turn, the far eye
     overhung the head outline and was drawn half-faded, so it read as a ghost disc.
   - The rig now keeps the far eye inside the silhouette, and lets it leave cleanly past three-quarters (a narrow
     fade) instead of over a wide one. The head reads as a clean profile: one eye, nose, mouth.
4. **The lab was recomposed.** The listener is large in the foreground, the 8 FT tape runs away from him to the bench,
   and the 8 FT mark sits above the caption band. The colleague was moved so they are never hidden behind the listener.

## Measured

**Picture**

- **Motion scan** (`qa/v6/motion_scan.json`):
  - mean frame change 2.1 (V5: 2.89);
  - exactly **11** hard picture changes, all of them planned cuts: 1.5, 3.0, 5.0, 15.0, 17.77, 20.0, 23.4, 27.0,
    27.77, 30.3 and 32.3 s;
  - no other spikes, and no black frames (`qa/v6/loop.json`);
  - no end card.
- **Camera:** the three moves (M1, M2, M3) are smooth and appear in the scan as continuous change, not spikes.

**Block** (`qa/v6/check_v6.json`)

- The visitor's body capsules were tested against the beam segment on every frame from 690 to 968.
- Blocked on exactly **frames 815–957**: 0 mismatches.
- The whisper is cut by a 3 ms ramp at 815 and returns at 958.

**Loop seam**

- The camera's step across the seam equals its neighbours'.
- The leads' joints move 1.7 cm per frame across the seam (neighbours 0.4–2.7 cm), because the startle is in motion.
- Crowd ≤ 3.4 cm.
- In the exported picture, last frame → frame 0 measures **3.82** (caption band excluded). The neighbouring steps are
  0.91–4.57 (median 2.17), so the seam is an ordinary frame step.

**Foot sliding** (`qa/v6/footslide.json`): the drawn ankle, in the world, during each planted interval.

- **Visitor:** at most 3.1 cm in the core of a stance and 5.5 cm including heel-off. Both maxima are on the first
  stance in F1 (23.4–24.0 s), while he is about 8 m back in the hall, roughly 4–7 px on screen.
- **Background crowd:** up to 12 cm, on figures 6 m or more back.

**Audio** (`audio/mix/mix_measure_v6.json`)

- **Narration:** the approved file (sha256 `b22271734436…`), unedited, at sample 0 and the V1–V5 gain.
- **Vosk on the export:** WER **0.010**. The only difference is "its" heard as "it's", the same as V5.
- **Loudness:** integrated −14.6 LUFS (V5: −14.6); sample peak −2.57 dBFS. No clipping: master limiter at −1.5 dBFS.
- **Whisper:**
  - set 15 dB under the narration, then ducked to −21.3 dB under it while she speaks;
  - peak −16.7 dBFS;
  - −140 dB through the block, then back at once at the clear;
  - −35.4 / −36.2 dB in the last and first 0.3 s, so it is continuous across the seam.
- **Effects:** peak −21.1 dBFS.
  - Re-timed to the V6 picture: the three moves only, no whooshes on the clean cuts; the absorption tinks on the four
    absorptions; a pulse per pressure ring; the lid, laser and mirror buzz; the sweep and its convergence; the key;
    the tape's foot marks; the visitor's footsteps from the walker's plants; the map.
- **Mux:** offset 0 samples, correlation 0.99997 against the WAV.

## Checklists

**Characters**

- [x] No beard on the guesser at any angle (stills from the turnaround and every atrium shot).
- [x] No extra or missing fingers. Hands are drawn from fixed shapes with four fingers and a thumb. In the wide shots
  they read as simple mitts.
- [x] No floating hands: every hand ends a two-bone arm.
- [x] No backward elbows: pole-vector IK.
- [x] No arms through bodies: the front-arm test layers the arms. The ear cup goes out to the side.
- [x] No scale changes: one body per character and one hand scale.
- [~] Foot sliding: small but not zero (see above).

**Directing and technical**

- [x] The hook is interesting from frame 0: his eyes are already wide and his head is turning on frame 0.
- [x] The narration and captions are preserved (the SRT is identical to V1).
- [x] The whisper is subtle (−21 dB under speech), but needs a listen.
- [x] No black frames and no end card.
- [x] No audio pops: there are 3 ms ramps at the block and the clear, and the seam is continuous.
- [x] A genuine 1080×1920 at 30 fps, read from the file.

**Transitions**

- [x] Clean cuts between ideas.
- [x] Each camera move goes into a new scale and is used once.
- [x] No push-in/pull-out pairs.
- [x] No returns to a scene without new information.

## Known issues / not done

- **Not watched or listened to in real time.** The whisper's eeriness, the effects' level and the comedic timing of the
  reactions all need a human pass.
- **Small faces in the wide shots.** In F1/F4 (side-on) the figures are about 380 px tall. The listener stands behind
  the display case at the left of frame, so his lower body is hidden. In F3 the visitor is partly cut by the right edge.
- **The scientist's key turn in D is small in frame.** The readable cue is the LASER IN USE sign lighting at the same
  moment.
- **The far eye at a strong head turn** now disappears in about two frames as the head passes three-quarters. It is a
  clean pop rather than a fade.
- **Hands in the wide shots** reduce to mitt-like silhouettes. Individual fingers read only in the closer shots (A1,
  A2, F5).
- **Foot sliding:** the visitor's first stance in F1 slides up to 5.5 cm at heel-off. The background crowd slides
  more, but is small and far away.
- **Teaching simplifications:**
  - the share of water molecules is exaggerated;
  - the pulses, warming and rings are slowed and enlarged;
  - the ear anatomy is stylised;
  - the sweep shot slows the beam's far end to the (slowed) speed of sound;
  - the galvo's angle is exaggerated for visibility.
- **No 4K master.** Only the review file was asked for; the source can render one with `--scale=2`.
