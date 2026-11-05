# JIZAI ARMS V1: review report

**Status:** a review render, **not final and not ready to publish**. Nobody has watched it in real time or listened to it
with sound: this environment has no audio or video playback. Everything below was checked from the file, its frames,
and measurements.

**Review file:** `exports/FGW_JIZAI_Arms_V1_REVIEW_1080x1920.mp4`

| Property | Value |
|---|---|
| Runtime | **31.000 s** (930 frames at 30 fps) |
| Video | 1080×1920, H.264 (CRF 14, slow), yuv420p, BT.709 |
| Audio | AAC 48 kHz stereo, 320 kb/s target |
| Loudness | −14.1 LUFS integrated, −1.4 dBFS peak |
| Narration | 0.00–29.96 s; the locked script, verbatim |
| Captions | burned in |

The runtime is under the brief's 31–34 s target. The natural read of the locked words is 28.8 s (about 182 words a
minute). Five sentence pauses were lengthened with inserted silence (+1.35 s in total; no stretch), and the
payoff and loop take the final 1.04 s.

## Brief QA checklist

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Frame 0 shows six arms | **Pass.** 2 human hands and 4 robot hands are inside the frame on frame 0. | `qa/verify_rig_v1.json` (`frame0`); `qa/v1/hook_0-4s_every3.png` |
| 2 | Physical action in the first 2 s | **Pass.** The robot hand is moving on frame 0, then: push in, grasp at 0.42 s, lift, an arm crossing behind the head with the head following, a hand opening and closing, the pull back to all six. | `qa/v1/hook_0-4s_every3.png` |
| 3 | Clipping, impossible rotation, disconnected joints | **Pass on every frame:** no joint-limit requests and no robot link through a head. Links are an FK chain from the terminal, so they cannot detach. Human hands reach their targets on every frame but one (24.43 s, 1.2 cm short). | `tools/qa/verify_rig.ts` → `qa/verify_rig_v1.json` |
| 4 | The controller matches the full arm | **Pass.** One kinematic model at scale 0.5 drives both, with equal joint angles. The model's joint offsets ×2 equal the full arm's to 0.0 cm in S1, S3 and S4. The 6 cm reported is the S2 exploded view, where the full arm slides 12 cm out of its socket (a translation, not a joint). | `qa/verify_rig_v1.json` (`controllerMirrorMaxErrorCm`), `tools/dev/mini_check.ts` |
| 5 | Human arms anatomically normal | **Pass on the frames reviewed.** Two-bone IK with fixed upper-arm and forearm lengths (no stretch) and elbow poles. The crew's 5-digit hands, sleeves and contours. | sheets in `qa/v1/` |
| 6 | Detachable connector and the swap | **Pass.** The collar turns, the plug draws out along the terminal axis, the unpowered arm folds, the hand-off is by the connector body, it is pushed home, the collar locks and the light comes on. The S2 close view shows the empty socket's pins and the plug seating. | `qa/v1/sheet_every_0.5s.png` (10.5–12.0 s, 22.5–25.5 s) |
| 7 | Transitions at half speed for jerks | **Partly done.** Every scene boundary was frame-stepped (`qa/v1/burst_*.png`), and the camera was checked numerically (per-frame acceleration of eye and target). See the note below. **Not watched at half speed in real time.** | `qa/v1/render_qa.json`, `qa/verify_rig_v1.json` (`cameraJumps`) |
| 8 | Against the best FGW Shorts | **Done as frames only.** It uses the channel's Weird Crew parts directly (the guesser's head and outfit, Hand, Limb, gradient capsules, ink contours, caption treatment) and the Glass Climbing / Hidden Trigger palette. See the limitations below. | — |
| 9 | Narration verbatim and in sync | **Pass.** Zipformer and Whisper both read every word from the MP4's own audio (Whisper's full-file pass loses "speech" at its 30 s window edge; its tail pass reads it). Differences are spellings only ("back pack", "some one", "Jizai" as "j zi" or "GZI", "full sized"). Captions are built from the aligned word times and checked word for word against the locked text when they load. | `qa/v1/final_asr.json`, `qa/v1/render_qa.json` |
| 10 | Last frame → first frame | **Done.** The last second blends the second wearer's body, arms and camera into the frame-0 composition (shifted to where she stands). The cut keeps the foreground robot hand at about the same screen size (12.4 vs 12.5 px/cm), about 100 px apart, with the same raised arms. The person changes (the arm was borrowed). | `qa/v1/loop_junction.png` |

**Note on item 7.** The frame-difference scan flags two frames at 1.43–1.47 s. They show a continuous, fast pan
across the striped tee, with no reset: see `qa/v1/frames_038-049_pan.png`. The planned changes are:

- the hand sweep at 3.1 s;
- the zoom at 18.1–18.2 s;
- the match cut at 18.5 s;
- the cut at 21.6 s.

The camera's per-frame acceleration never exceeds 8 cm per frame² except at the two cuts. The longest
near-static run is 18 frames (0.6 s).

## Scenes and transitions (summary)

The full list is in `production/V1_TRANSITIONS.md`.

1. **0–6.45 s, the hook.** Six arms on frame 0, then:
   - grasping the cup;
   - an arm crossing behind his head;
   - a robot hand next to his relaxed human hand;
   - the six-arm wide;
   - a robot hand sweeping across the foreground as the camera swings to the operator;
   - the operator's half-scale model driving the upper-right arm (reach up, wrist roll, elbow fold) in one connected view.
2. **6.45–13.3 s, the invention.**
   - The camera comes round to the harness.
   - At the back the body turns translucent in place, and the six terminals show (two empty, with pins). The arms
     slide out and the six lights count.
   - The upper-left arm slides into its socket and the collar locks on "limbs".
   - The camera returns to the front.
3. **13.3–16.45 s, the controller.** A physical split: the model near the lens and the full arm twice as far, at about
   the same size. Shoulder rotation, elbow, then wrist and hand; then the travel to the full arm.
4. **16.45–21.6 s, another person.**
   - The wearer is in front and the operator behind.
   - A zoom to the operator's fingers, then a match cut from the model's wrist to the full wrist.
   - The pull back: the robot hand pats his hair while his own hand hangs still.
5. **21.6–26.2 s, the swap** (a deliberate cut to a separate demonstration). Unlock, draw out, carry, hand off,
   push home, lock and wake, with the camera following the arm.
6. **26.2–31.0 s, the payoff.** The borrowed arm moves beside her own arms; the camera glides out (three robot arms),
   then pushes in as the borrowed hand reaches toward the viewer, flowing into frame 0.

## Known limitations

**Factual and reference**

- **No reference photos.** The official sites in the brief (`jizai-arms.com`, `daisuke.uriu.jp`) and the press pages
  were blocked by this environment's network policy. The design follows the brief's description and search-result
  text. Not verified against photographs:
  - where the terminals sit on the base unit;
  - the connector's latch;
  - the arm's joint layout;
  - the hand's design.

  See `production/SOURCE_NOTES.md`.
- **The twist-lock connector, terminal lights and pins are illustrative.**
- **The model is drawn wired to nothing.** Whether the real controller is wired or wireless is unverified.
- **Who does the removing.** The swap shows a wearer unplugging his own hip arm and the other wearer plugging it in.
  The real demonstrations may have used helpers.
- **One arm moves in the swap.** It is a single transfer, as the brief describes, not a two-way exchange.

**Visual**

- **The head is drawn frontal, not turned.** The crew Head has a 3/4 turn but no up/down view, so in the
  slightly-above swap view (pitch 26°) the faces read as frontal.
- **No back of the head.** The back view uses the translucent "x-ray" body because the crew rig has no back-of-head
  drawing. The body also stays translucent for part of the return orbit (until about yaw 50°).
- **The swapped arm keeps its own handedness** (it was a right arm), so in the last second the borrowed hand's thumb
  is on the opposite side from the frame-0 hand. The loop cut changes the person anyway.
- **The cart blocks one hand in S4.** In the "real hands stay still" wide, his far hand is hidden behind his body;
  the near hand is visible beside the cart.
- **The model is small.** At half scale it reads small against the operator's hands in the wide connected views
  (3.45–6.45 s).

**Animation**

- **The hook hold is quiet.** The six-arm wide at 2.15–2.95 s moves only gently (small arcs, breathing).
- **No walk cycles.** The second wearer turns to the lens in S6 by rotating in place.

**Audio**

- **Not listened to.** Effects are synthesized: servo whirs, collar clicks, terminal pips, a cup tap, hair pats. The
  music bed is a synthesized 16-bar loop under the voice (about 9 dB below it, with an extra dip under the last
  words).
- **The voice was chosen by measurement**, not by listening.
