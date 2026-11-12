# Mushroom Robot V2: report

**Deliverable:** `exports/FGW_Mushroom_Robot_V2_REVIEW_1080x1920.mp4`, not published.

- **Video:** 1080×1920, 30 fps, H.264 (CRF 16, yuv420p, BT.709), 850 frames, 28.333 s.
- **Audio:** AAC 320 kb/s, 48 kHz stereo.
- **Source:** `source/src/v2/` (composition `MushroomRobotV2`). V1 is untouched and still renders.

## Actual changes from V1

### Rig and motion (`v2/robot.ts`)

**One persistent walker.** There is one hub (radius 2.8 cm), one dome, and five sockets fixed on the hub wall at 72°
spacing. There are five legs, each of fixed length 7.3 cm with the same taper (0.72 → 0.40 cm radius) and colour in
every frame.

**Legs as constant-curvature arcs.** Each leg is a soft pneumatic bending actuator, modelled as a constant-curvature
arc, which is how such actuators actually bend.
- The arc is solved exactly from socket to foot (IK).
- It cannot stretch, kink, detach or flip, and it bends more as the foot lifts.
- A reachable workspace (chord/length between 0.62 and 0.985) is asserted every half frame and never reached.

**Gait phases.** Each leg lifts, swings and sets down, then stays planted.
- A planted foot keeps exactly the same world position until it lifts.
- The swing is interpolated in the body frame, so a swinging foot never passes beside its own socket. This V1 defect
  stretched rear legs.

**Path and loop.**
- The path is a closed curve with a second-harmonic heading term, so it closes analytically.
- The turning-in-place beat is a heading offset that cancels over the loop, so frame 849 continues into frame 0 to
  within 1e-14 cm.

**Box removed.** The pipette-tip box and its collisions are gone. The "no eyes / no idea where it's going" beat is now
the walker's own clumsy shuffle: it marches in place, turns left, turns right, then wanders off.

**Sag.** The splat is now a softer sag, with the body dropping 0.95 cm on the soft legs.

### Rendering

- **Legs (`v2/RobotWorld.tsx`):** drawn as overlapping round-capped segments in four passes (ink, body, light, gloss),
  so the outline cannot self-intersect. The V1 inner-bend kinks and socket "struts" are gone.
- **Sockets:** persistent bosses on the hub wall.
- **Depth order:** legs are depth-sorted against the hub every frame.

### Fungal network (`v2/mycelium.ts`)

- **One fixed graph:** 244 hyphae and 4,447 nodes, with 1,735 anastomosis fusions. It is about 35% sparser than V1,
  shared by every shot and never regenerated.
- **Spikes follow real branches:** each spike now travels as a pulse along the shortest route through existing hyphae
  into the electrode that records it. This replaces V1's expanding rings.

### Text removed (zero text elements in the V2 source)

- "living mycelium" / "king oyster…" label
- "electrode" label
- the "Illustration · based on…" tag
- AMP / FILTER / SPIKE DETECT / VALVE / "air to the leg"
- the scope strip ("fungus signal", "leg steps", "UV ON")
- the monitor's labels
- captions

The research attribution moves to the video description.

### Explanation simplified

- **Signal chain (`v2/SignalWorld.tsx`):** the three-chip diagram became one unlabelled controller (its LED blinks
  when the pulse arrives) and a valve on the air line. The pulse goes electrode → controller (8.43 s) → valve
  (8.93 s) → air (9.0–9.3 s), then the air line wipes to the leg it inflates. The waveform beside the wire changes
  from a raw noisy spike to a clean digital pulse at the controller.
- **UV beat:** carried by the robot with no graph.
  - The camera moves close to the culture as the lamp clicks on.
  - Pulses arrive about twice as often (0.42 s apart instead of about 1 s).
  - The electrodes and hub LEDs flash larger.
  - It then pulls back to the faster, higher-stepping gait.
  - The lamp now rides an overhead arm above the walker, so the beam stays on the culture.

### Camera and props

- **No whip moves:** the V1 swoop (134° of yaw in 0.54 s) is gone. The camera is one periodic spline with moderate
  moves and a gentle reveal.
- **Composition:** the walker sits slightly below centre in the wide shots.
- **Beaker removed:** the camera passed through it at 10.2–10.6 s. A search over 72 positions found none both visible
  in the reveal and more than 28 cm from the camera.

### Sound (`tools/v2/make_audio_v2.py`, `audio/cues_v2.json`)

- Same synthesis as V1, re-timed from the V2 events.
- The box knock and rattle are removed.
- The chain is one controller blip, then the valve clack and the air rush.
- **Mix:** -14.08 LUFS integrated, -1.60 dBTP true peak.

## Geometry and clipping QA

`tools/v2/geom_audit.ts` writes `qa/v2/geometry_audit.json`. It evaluates the actual rig at 2 samples per frame
(1,700 samples across the whole film). Result: **PASS**, zero failures.

| Check | Result |
|---|---|
| Leg count, hub size, socket positions | fixed by construction (one model) |
| Leg length | 7.2935–7.2997 cm (polyline of the exact 7.3 cm arc) |
| Leg attached to its socket | 0 cm offset, every sample |
| Workspace (chord/length) | 0.624–0.981; limits 0.62 / 0.985; **0 clamps** |
| Foot or leg below the floor | min (y − radius) = 0.000 cm: planted feet touch, nothing sinks |
| Planted foot on the floor | within 1 mm, every planted sample |
| Stance sliding | 0 cm |
| Foot movement per sample | max 0.56 cm (no jumps) |
| Leg into hub (beyond the 1.2 cm root) | min clearance +0.008 cm |
| Leg into dome | min clearance +0.74 cm |
| Leg vs leg | min clearance +1.85 cm |
| Hub height above the floor | min 1.13 cm (during the sag) |
| Loop (pose and all legs, t = 28.333 vs 0) | ≤ 2.1e-14 cm |

The audit also caught and drove these fixes:
- rear legs stretched to a 0.55 ratio mid-swing (fixed by the body-frame swing);
- front feet planted at the workspace edge (fixed by the foothold bias and a leg length of 7.6 → 7.3 cm);
- a V1 word-index class of bug (now a startup assertion on word order).

### Render audit

**Measured** (`tools/v2/qa_render_v2.py` → `qa/v2/render_qa.json`):
- no decode errors;
- no unplanned large frame-to-frame changes;
- **no single-frame flicker** (a new detector for a frame unlike both neighbours);
- longest near-static run 13 frames (0.43 s, the hold on the electrode before the followed spike);
- loop seam (last vs first frame) 2.86, against a 7.41 median between neighbouring frames.

**Every frame inspected:**
- `qa/v2/all_frames/frames_000…800.png`, all 850 frames at 108×192, reviewed twice: before and after the fixes.
- Full-size checks of the hook, the leg close-up, the macro, the UV close-up, the head-on shot and the loop.

**Narration:** WER 0.000 on Zipformer and Whisper base.en, transcribed from the delivered MP4's own audio
(`qa/v2/final_asr.json`).

## Remaining defects (honest)

1. **No real-time review.** Nobody has watched it at normal speed with sound. There is no audio playback here, so the
   mix has only been measured and the voice checked only by ASR.
2. **UV causality is subtler without a graph.** The change in electrical activity is shown as faster and brighter
   pulses, electrode flashes and LED bursts on the walker. A first-time viewer may notice "it walks faster" more than
   "the signal changed". The close dome shot (12.5–13.7 s) carries it.
3. **End-on legs.** A rear leg seen end-on behind the dome during its swing still reads as a stubby shape at some
   angles (for example 0.2 s, 12.9 s). The geometry is correct.
4. **Static hold.** The macro camera holds still for 13 frames (7.40–7.83 s) waiting for the followed spike.
5. **Screen-space lighting.** Leg shading uses screen-space light from the upper left, the channel's style, so it does
   not respond to the orbit.
6. **Wipe outside the world.** The air-line wipe (9.28–9.58 s) is a 2D foreground element, not an object in the 3D
   world.
7. **Dome missing in the macro.** The macro is a 2D view of the same disc and network: the dome's mesh is not drawn
   there.
8. **Tight clearances.** Leg-to-hub clearance beyond the root gets as small as 0.008 cm (no penetration), and the
   workspace minimum margin is 0.004.
9. **Science simplifications are unchanged.** Spike rate and propagation speed are compressed. The robot's look is
   stylised (the real walker is starfish-shaped), and the overhead lamp arm and tether boom are invented. See
   `SCIENCE_NOTES.md` (the ⚠ items are still to be checked against the paper).
10. **No captions,** per the brief. Muted viewers get no words.

## Publish-readiness: 7.5 / 10

The V1 mechanical problems are fixed and verified at every half frame: stretching, kinks, clipping, the box
collisions, the whip move and the foreground prop. The film now has no text.

Before publishing:
- one real-time viewing with sound;
- check the science ⚠ items against the paper;
- decide whether the UV beat reads strongly enough without any on-screen signal display.
