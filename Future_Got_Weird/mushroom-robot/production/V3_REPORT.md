# Mushroom Robot V3: report

**Deliverable:** `exports/FGW_Mushroom_Robot_V3_FINAL_REVIEW_1080x1920.mp4`, not published.

- **Video:** 1080×1920, 30 fps, H.264 (CRF 16, yuv420p, BT.709), 850 frames, 28.333 s.
- **Audio:** AAC 320 kb/s, 48 kHz stereo.
- **Narration:** the approved take, unchanged.
- **Source:** `source/src/v3/` (composition `MushroomRobotV3`). V1 and V2 still render unchanged.

## Change log (targeted, from V2)

### 1. Leg rig: a soft-robot kinematic model with constraints (`v3/robot.ts`)

**The model.** Each leg is now the standard piecewise-constant-curvature (PCC) model of a soft actuator. It has no
rigid joints, matching the real pneumatic legs.
- Two inextensible sections: proximal 3.0 cm and distal 4.3 cm.
- Each section's only freedoms are one curvature and one bending-plane angle.
- **Clamped root.** The leg always leaves its socket along the same direction (outward, 16° up). The V2 arc's root
  could swing freely, which is why its legs looked like tubes bending arbitrarily.
- **Deformation limits.** Curvature is held within −0.15 to +0.75 per cm. The bending plane may tilt at most 0.75 rad
  out of the leg's vertical (chamber) plane.

**IK.** Damped Gauss–Newton from a fixed start, so it is deterministic per frame.

**Footholds.** Each foothold is centred on the body's average pose over that foot's actual stance (landing to next
lift). Turning and translation during stance are split evenly either side of neutral. This is what kept every foot
reachable within the limits: V3's first audit had 84 unreachable samples, now there are none.

**Visible mechanism.**
- A darker strain-limiting stripe runs along each leg's underside, where it curls.
- The chamber ribs swell with pressure.
- Air fills the leg's channel from the socket outward as its swing begins, then drains as the foot sets down.

### 2. Fungal network (`v3/mycelium.ts`)

**Structure.** One tree grown from a central inoculation point:
- 6 main cords;
- 30 secondary branches;
- 28 short tertiary twigs;
- 964 nodes in all, against 4,447 in V2.

**Electrodes on the network.** The two electrodes sit on main cords.

**Pulses.** They follow the tree path between nodes joined by drawn hyphae. The V2 anastomosis edges (0.02 cm hops
between separate hyphae, visible at macro zoom) are gone.

**Contrast.** The scaffold is darker, the lattice fainter, and the cords thicker and brighter.

### 3. UV sequence: three stages, no graph

| Time (s) | Stage | What the viewer sees |
|---|---|---|
| 11.85–12.5 | Before | The camera is already close on the culture; one slow single pulse arrives at 12.13. |
| 12.51 | 1. UV hits the interface | The lamp clicks on and the culture is lit violet. |
| 12.95–16.05 | 2. The signal pattern changes | Spikes every 0.42 s instead of about 1–1.5 s. Each spike is a burst of three pulses along different branches. Electrode and LED flashes are larger; three-crackle bursts in the sound. |
| 13.4–16.2 | 3. The movement changes | The camera pulls back to show the faster, paired gait (rear pair, side pair, front) with higher steps. Before UV the gait was a slow one-leg-at-a-time ripple. |

### 4. Camera and the final third (`v3/cam.ts`)

The camera is now shots with motivated cuts instead of one spline. The orbit is gone.

| Time (s) | Shot |
|---|---|
| 0–2.9 | Hook and dive into the dome |
| 9.0–18.45 | Leg step → whole step → UV close-up → gait → overhead "no brain" |
| **18.45** | **Cut on "No":** head-on |
| 18.45–21.85 | Gentle rise over the shuffle |
| **21.85** | **Cut on "But":** one leg-mechanism shot, the soft leg in profile with socket, ribs, air channel, foot contact and the culture at frame edge |
| **24.75** | **Cut on "Which":** one medium shot of the whole walk, easing into the clean opening framing (the loop) |

### 5. Cable (`v3/robot.ts`)

- **Routing:** a fixed spout on the hub's left rim (between legs 1 and 2) to a tether boom that follows the walker from
  above and to its left.
- **Shape:** a catenary of fixed slack between those fixed points, so its shape depends only on the walker, never on
  the camera.
- **Effect:** it no longer crosses the dome or rises through the middle of the frame. It leaves toward the side.
- **Style:** thinner (0.15 cm radius) and lower in contrast. The robot is still visibly tethered.

### 6. Text

There are still zero text elements in the source (V3 has 0 `<text>`, `fontFamily` or `fontSize`), and no captions,
labels, graphs or tags.

### 7. Pacing and sound

- **Holds:** the macro hold before the followed spike now drifts in. The longest near-static run is 3 frames (V2: 13).
- **Sound (`tools/v3/make_audio_v3.py`):** UV bursts get two extra quick crackles. The rest is re-timed from the V3
  events.
- **Mix:** -14.08 LUFS integrated, -1.60 dBTP true peak.

### 8. Rendering fix

The soft-shadow and glow blur filters clipped to their bounding boxes and showed hard-edged rectangles in close-ups.
They now use a frame-sized filter region.

## Animation stability QA

### Geometry audit

`tools/v3/geom_audit.ts` writes `qa/v3/geometry_audit.json`. It evaluates the actual rig and cable at 2 samples per
frame (1,700 samples). Result: **PASS**, zero failures.

| Check | Result |
|---|---|
| Foot reached by the clamped-root leg (IK error) | max 0.0006 cm |
| Curvature | −0.10 to 0.50 per cm (limits −0.15 / 0.75: never reached) |
| Bending-plane tilt | max 0.45 rad (limit 0.75: never reached) |
| Leg length (polyline of the exact 7.3 cm) | 7.295–7.299 cm |
| Attachment to socket | 0 cm, every sample |
| Leg sample movement per half frame | max 0.57 cm (no jumps) |
| Leg parameter change per half frame | max 0.105 (no flips) |
| Stance sliding | 0 cm; planted feet on the floor within 1 mm |
| Legs below the floor | none (min −0.0002 cm, numerical) |
| Leg vs hub / dome / leg | min clearance +0.59 / +2.2 / +1.85 cm |
| Cable vs floor / dome / legs / lamp | min clearance +3.4 / +0.85 / +1.48 / +6.2 cm |
| Electrodes on the network | 0 cm from a node (they are nodes) |
| Pulse routes | 147 routes, 0 hops off a drawn hypha |
| Loop (pose, all legs) | ≤ 3e-11 cm |

### Render audit

**Measured** (`qa/v3/render_qa.json`):
- no decode errors;
- no unplanned large frame changes (three planned cuts);
- no single-frame flicker;
- longest near-static run 3 frames;
- loop seam (last vs first frame) 2.62, against a 6.09 median.

**Inspected:**
- every frame at 108×192 (`qa/v3/all_frames/`), twice: before and after the last fixes;
- full-size checks of the leg-mechanism shot, the UV close-up and the macro.

**Fixed during QA:**
- a neighbouring foot popping in at the frame edge of the leg shot (widened framing);
- blur-filter rectangles;
- the cable crossing the frame centre;
- the 14-frame macro hold.

**Narration:** WER 0.000 on Zipformer and Whisper base.en, transcribed from the delivered MP4's own audio.

**Audio sync:** every effect is placed from the exported picture events (`audio/cues_v3.json`):
- spikes;
- each leg's lift and landing;
- the chain;
- the lamp;
- the sag.

## Scientific accuracy review (see `SCIENCE_NOTES.md`)

**Represented correctly:**
- king oyster mycelium grown on an electrode scaffold;
- its electrical spikes as the control input;
- electronic processing (one controller);
- off-board valving of air;
- pneumatic soft legs (no rigid joints; the PCC deformation model, strain-limiting layer and chambers);
- a tethered walker;
- UV changing the signal before the gait changes;
- no vision, no intention, no fungal power.

**Simplified or illustrative (⚠ still to verify against the paper, which could not be opened here):**
- the robot's raised spider-like posture (the real walker is a flatter, starfish-shaped soft robot);
- the paired UV gait (the paper reports a gait change; its exact form is assumed);
- one spike driving one gait cycle;
- compressed spike timing and propagation speed;
- the overhead lamp arm and tether boom.

The narration line "the mushroom is literally controlling its legs" still compresses the processing step, though the
picture shows the controller and valve.

## Remaining defects (honest)

1. **No real-time review.** Nobody has watched it at normal speed with sound. There is no audio playback here, so the
   mix is measured only.
2. **Kinematic, not dynamic.** No contact forces, friction or inertia are simulated. Body bob and settle are authored.
3. **Lifted-leg walking.** The legs lift and step like a walker's. The real soft robot's locomotion is closer to an
   inflate-and-crawl motion, so this is a stylisation for readability.
4. **Screen-space lighting.** Light comes from the upper left on screen (channel style), not from the world.
5. **2D wipe and macro.** The air-line wipe is a 2D foreground element, and the macro view does not draw the dome's
   mesh.
6. **Cable.** It is still visible as a thin line rising out of frame in most robot shots (by design: the robot is
   tethered).
7. **Small robot in the closing shots.** The walker is fairly small in frame in the closing medium shot (24.75–28.3 s),
   so the whole five-leg gait stays in view.
8. **No captions,** per the brief. Muted viewers get no words.

## Publish-readiness: 8 / 10

**Why it scores higher than V2:**
- the legs read as one physically constrained soft machine;
- the network is clear;
- the UV cause → signal → movement order is visible without words;
- the last third has three distinct, purposeful shots.

**Before publishing:**
- one real-time viewing with sound;
- check the ⚠ science items (especially the walker's posture and the UV gait) against the paper.
