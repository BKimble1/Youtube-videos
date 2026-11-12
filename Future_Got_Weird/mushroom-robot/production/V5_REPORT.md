# Mushroom Robot V5: final animation repair, faster storytelling, publication polish

**Deliverable:** `exports/FGW_Mushroom_Robot_V5_FINAL_1080x1920.mp4`

- 1080×1920, 30 fps, H.264 (CRF 16, BT.709), 850 frames, 28.333 s, AAC 320 kb/s.
- The approved narration is used unchanged.
- Source: `source/src/v5/` (composition `MushroomRobotV5`; shot list `v5/shots.ts`).
- QA aid: `qa/v5/FGW_Mushroom_Robot_V5_QA_0.25x_540x960.mp4`.

## 1. What caused the V4 leg glitches (measured on the V4 rig, `qa/v5` diagnostics)

Two separate causes, both in the motion model rather than the drawing.

### A. The leg changed shape class mid-swing

In V4 each leg was two independent constant-curvature sections. Nothing tied the sections to each other, so the
solver met each new foot target by straightening, or even reversing, the upper section while curling the lower one.
Measured on the front leg during the UV gait (V4 14.75–15.6 s) and the head-on shot (18.75–19.4 s):

| Pose | Upper-section curvature | Lower-section curvature | Shape |
|---|---|---|---|
| Planted | 0.13 | 0.27 | Smooth arch |
| Mid-swing | −0.02 | 0.47–0.49 | Straight shaft with a hooked tip, reverse-bent at the root |
| A few frames later | 0.13 | 0.27 | Smooth arch again |

The leg flipped between two visually different objects every swing. That is the "bent → raised → nearly straight"
switching you saw. A pneumatic bending actuator cannot do this: it only curls toward its strain-limiting layer.

### B. The body stayed still while the legs worked

V4's robot shots used a camera that followed the walker's smoothed centre and heading. In the 9.75–11.7 s close-ups
the body moved only 1–6 px a frame on screen while the legs swung through hundreds of pixels. The robot appeared to
bend its legs in place; the 18.75–19.4 s "extend and retract while stationary" came from the same cause. The robot
really did advance in the world (V4's feet were planted correctly), but the camera cancelled the travel.

### Contributing factors

- **Lift profile.** The foot lift was a sine, which has non-zero vertical speed at lift-off and touchdown, so the leg
  curvature kicked at contact.
- **Body bob.** The bob was taken from only the active event; when events overlapped, the bob jumped at the hand-over
  (found by the new 240 Hz snap detector at 18.925 s).
- **Exaggerated amplitudes.** The step amplitudes were exaggerated: ×1.3 on the featured step, a 1.6× bob, a large
  wobble and a 0.95 cm sag. This made the 9.75–11.7 s close-up look like a flexible drawing.

## 2. Code-level fixes (`source/src/v5/robot.ts`, `shots.ts`, `timing.ts`)

### One continuous actuator

Each leg is now a single soft actuator of fixed length 7.3 cm. Its curvature varies linearly along the leg:

> k(s) = k0 + k1·s/L, plus a small uniform lateral term m

- **Exact IK.** Three parameters for a three-dimensional foot position, so the inverse kinematics is exactly
  determined: no regularisation drift and no family of competing solutions.
- **No kink.** Curvature is continuous along the whole leg.
- **Shape continuity.** The IK runs by continuation on a 240 Hz track (Newton with line search), so the shape is one
  continuous function of time.

### The physical rule, asserted

A pneumatic bending actuator only bends toward its strain-limiting layer, so the audit requires k(s) ≥ −0.03/cm
everywhere along every leg, every half frame. Measured result: **min −0.0056, max 0.54.**

Two geometry changes made this achievable: the root now leaves the hub 35° upward instead of 16°, and the neutral foot
reach is 8.6 cm. With these, every stepping pose is a single arch. The values came from a sweep of root angle against
reach, recorded in this pass.

### Jerk-free motion

- **Lift.** The foot lift is 64·s³(1−s)³ (zero speed and acceleration at lift-off and touchdown), and travel is
  quintic.
- **Contact.** The swing path blends from the fixed world footholds with a weight that is flat at contact.
- **Body.** Progress along the path is quintic, the bob is summed over all events (continuous when they overlap), and
  the sag, wobble and recovery are eased.

### Amplitudes

- Featured step 1.3 → 1.1, UV steps 1.2 → 0.9, sag-step 0.55; bob 0.2 cm; sag 0.8 cm; wobble 0.02 cm.
- UV events lengthen to 0.43 s, and each UV swing is 0.6 of the event (≥ 0.26 s), with the last pair landing before the
  next spike's step, so the gait never flicks.

### Cameras anchored in the world

Each shot's framing is computed from the walker's pose at an anchor time and then held or dollied in world space, so
the robot visibly travels across the frame during its steps. Close-ups follow only partially (`follow` 0.5–1), so the
subject stays framed.

### Unchanged from V4, still the single source of every visual

- the swept 3D leg surface with fixed thickness;
- rings at fixed arc lengths (ribs, underside stripe and air channel are faces of that surface);
- back-face culling and depth sorting;
- shading from a fixed world light;
- body occlusion decided by a ray-cast from the camera to each socket.

There is no screen-space redraw, no Bézier switching, and no randomness during playback.

## 3. Validation

### Tests A, B and C: static world cameras, no movement, no cuts (`qa/v5/tests/`)

Each test was rendered at 540×960 and every frame was inspected on contact sheets.

| Test | View | Content | Frame scan |
|---|---|---|---|
| A | Three-quarter, static | 6.0 s of baseline walking | Median change 0.72, max 3.5; 0 single-frame flicker; the larger changes are the robot's own steps every ~1 s |
| B1 | Overhead, same animation | 6.0 s | Median 0.38, max 3.3; 0 flicker |
| B2 | Low angle, same animation | 6.0 s | Median 0.66, max 3.4; 0 flicker |
| C | Static wide | 7.0 s: baseline → lamp swings in → UV on → paired faster gait → lamp off → baseline | Median 0.87, max 2.7; 0 flicker; 0 jumps |

**What the sheets show:**
- the same five legs on the same sockets in every view;
- consistent arch shapes and ribs;
- planted feet staying put while the body advances across the frame;
- in C, the gait changing continuously with no pose switching.

### Whole-film geometry audit (`tools/v5/geom_audit.ts` → `qa/v5/geometry_audit.json`): PASS, zero failures

Every half frame was checked (1,700 samples × 5 legs), plus a 240 Hz snap scan.

| Assertion | Result |
|---|---|
| Leg length | 7.2967–7.2987 cm (within 0.05%) |
| Thickness profile, rib and stripe positions | identical every sample |
| Socket in body-local coordinates | 0 offset |
| Foot reached | IK error 0.0000 cm |
| Bends only toward the strain-limiting side | min curvature −0.0056 /cm (limit −0.03) |
| Curvature limit | max 0.54 /cm (limit 0.60); lateral max 0.10 (limit 0.25) |
| Curvature change per half frame | max 0.079 /cm |
| Curvature snap at 240 Hz (velocity discontinuity) | max 0.0003 /cm (threshold 0.002) |
| Planted-foot slide | 0 cm |
| Surface below the floor | never |
| Leg vs leg / hub / dome | min clearance 1.85 / 0.35 / 1.61 cm |
| Cable vs floor / dome / legs / lamp | 3.52 / 0.85 / 1.45 / 6.2 cm |
| Fungal pulses | 147 routes, 0 hops off a drawn hypha |
| Loop (pose and every leg) | ≤ 5e-8 cm |

### Test D: full-film inspection

**Measured** (`qa/v5/render_qa.json`):
- no decode errors;
- 0 unplanned large changes (all 20 detected large changes are planned cuts);
- 0 single-frame flicker;
- loop seam 3.16, against a neighbour median of 4.85.

**All 850 frames inspected** on every-frame sheets (`qa/v5/all_frames/`), with full-size checks of the opening, the
loop, the UV shots, the dome close-up, the head-on and profile shots, and the three V4 problem ranges.

| V4 range | Now (V5) | Result |
|---|---|---|
| 9.75–11.7 s | Leg 3 close-up (9.1–10.13), then the static wide step (10.13–11.84) | The leg keeps one arch shape while it lifts; the robot crosses the wide frame |
| 14.75–15.6 s | Static side, UV gait | Paired steps, each a smooth arch; the robot scoots visibly further each step |
| 18.75–19.4 s | Mat-level head-on | The front leg arches and sets down while the body comes toward the lens |

**Narration:** WER 0.000 on Zipformer and on Whisper base.en, transcribed from the delivered file's own audio.

**Mix** (re-timed from the V5 cues): −14.07 LUFS, −1.60 dBTP, voice 18.1 dB over the effects.

**Text:** zero text elements in the V5 source.

**Not done:** real-time viewing with sound (no playback here). The 0.25× file is included for that pass.

## 4. Scene timeline (24 beats, hard cuts on measured words or actions)

| # | Time (s) | Beat |
|---|---|---|
| 1 | 0.00–1.04 | Close and low on the rear soft legs peeling off the mat (payoff) |
| 2 | 1.04–1.97 | The whole walker, static frame: it travels one step |
| 3 | 1.97–2.92 | Down into the dome: a living culture, a pulse, the LEDs answer |
| 4 | 2.92–3.98 | Macro hyphae (streaming, tips growing) |
| 5 | 3.98–5.05 | Tight interface detail: hyphae grown over a gold electrode |
| 6 | 5.05–6.69 | Leads run off the scaffold into the controller |
| 7 | 6.69–8.40 | Spikes along branches; we follow one into the electrode (8.05) |
| 8 | 8.40–9.10 | Down the lead, through the controller, the valve opens |
| 9 | 9.10–10.13 | The actuator answers: leg 3 fills, lifts, swings |
| 10 | 10.13–11.84 | Static wide: the robot steps across the frame |
| 11 | 11.84–13.61 | UV source swings in, clicks on (12.51), the camera moves to the lit culture; first bursts |
| 12 | 13.61–14.74 | The lit network: spikes now arrive as bursts on several branches |
| 13 | 14.74–15.69 | Static side: paired, quicker steps |
| 14 | 15.69–16.56 | High three-quarter: the pattern under the lamp; the lamp goes off (16.5) |
| 15 | 16.56–17.75 | Eye level with the dome: a dish of fungus, two wires, nothing else |
| 16 | 17.75–18.58 | Low side: the soft legs give and the body slumps |
| 17 | 18.58–19.39 | Mat-level head-on: a blank front walking at the lens |
| 18 | 19.39–20.26 | Marching in place, swinging left |
| 19 | 20.26–21.90 | High and wide: swings right, then wanders off |
| 20 | 21.90–22.62 | A fungal spike runs into an electrode |
| 21 | 22.62–23.36 | Match: an actuator answers (leg 4 fills and swings) |
| 22 | 23.36–24.78 | Pull back from the glowing culture to the full robot stepping |
| 23 | 24.78–26.36 | Mat-level profile: two clean steps, legs in silhouette |
| 24 | 26.36–28.33 | The last step lands on "body"; the camera pushes in to the opening framing (loop) |

Beats last 0.70–1.97 s; median about 1.05 s.

**Final third (beats 20–24):** fungal signal → actuator → full reveal → coordinated profile walk → push-in loop. There is
no static diagram and no repeated wide shot.

## 5. Remaining defects (honest)

1. **No real-time viewing.** Not watched in real time with sound.
2. **Kinematic, not dynamic.** Body bob and settle are authored; no contact forces are simulated.
3. **Legs stay raised.** The 35° root angle gives the legs a higher, more arched stance than V4. It is closer to a
   pneumatic actuator under load, but it is still a stylised raised walker. The real Cornell robot is a flatter,
   five-limbed starfish that crawls; to be checked against the paper.
4. **Fixed lamp and boom.** The UV lamp's overhead arm and the tether boom are invented supports.
5. **Static macro.** The electrode macro (3.98–5.05 s) is the slowest beat: a 10-frame near-static stretch.
6. **Cable in frame.** The cable crosses the upper frame in the mat-level profile (beat 23).
7. **Facets.** The leg's ring tessellation (20 sides) is faintly faceted in the closest frames.

## 6. Publish-readiness: 8.8 / 10

**What V5 fixes:**
- the root causes of the leg instability (a two-section shape that could reverse-bend, and a camera that cancelled
  the robot's travel);
- the edit, which now has distinct beats with a cause → effect ending.

**Remaining before publishing:**
- one real-time viewing with sound;
- the open science checks (posture and the exact UV gait change).
