# Mushroom Robot V4: structural animation repair and high-retention pacing pass

**Deliverable:** `exports/FGW_Mushroom_Robot_V4_FINAL_REVIEW_1080x1920.mp4`, not published.

- **Video:** 1080×1920, 30 fps, H.264 (CRF 16, BT.709), 850 frames, 28.333 s.
- **Audio:** AAC 320 kb/s.
- **Narration:** the approved take, unchanged.
- **Source:** `source/src/v4/`, composition `MushroomRobotV4`. V1–V3 still render.
- **QA aid:** `qa/v4/FGW_Mushroom_Robot_V4_QA_0.25x_540x960.mp4`, a 0.25× slow-motion copy for frame-level review.

## 1. What was actually wrong in V3 (diagnosed from the V3 render, frame by frame)

The V3 rig's geometry was numerically sound: fixed length, attached sockets and planted feet all passed its audit. The
visible instability came from how that geometry was drawn and layered.

| V3 time | What the viewer saw | Root cause | V4 fix |
|---|---|---|---|
| 9.5–11.3 s (frames 285–339) | Legs "change drawing": projected thickness swelling and shrinking, outline blobs at bends, highlights jumping | The leg was a 2D screen-space stroke: four passes of round-capped segments offset in screen space (light and gloss toward screen upper-left), ribs as screen-space ticks. The highlight and thickness were recomputed from the 2D projection each frame, so they shifted when the leg turned toward or away from the camera. | Legs are now a swept 3D surface: 26 rings × 18 vertices at fixed arc lengths, oriented by the actuator's own frame. They are back-face culled, depth sorted and cel shaded from a fixed world light, with an ink hull. Ribs, the underside stripe and the air channel are faces and edges of that surface. |
| 17.5–20.5 s (frames 560–604) and 19.25 s | A leg crossing into the body; the side legs flip between in front of and behind the hub | Layering by comparing the depth of the socket point with the hub centre. At low, head-on angles the side sockets sit at almost the same depth as the centre, so the order flipped frame to frame. | Layering by visibility: a ray from the eye to each socket is tested against the hub cylinder and the dome. A leg whose socket is hidden is drawn before the body; any other leg after it. Socket collars are drawn only on visible sockets. |
| 9.5–11.3 s | Bend direction appearing to snap | Curvature parameterised as (magnitude, bending-plane angle), which is singular near zero curvature, plus an IK re-solved from a cold start every frame. | Each section is parameterised by its curvature vector (bend-down, lateral), with no singularity. The IK runs by continuation: a warm-started track at 240 Hz, then refined per frame. |
| 24–28 s | Repetitive same-size walking views | Two long shots (2.9 s and 3.6 s) of the same subject. | The final third is rebuilt into 9 distinct beats (see the timeline). |
| 18.12–18.66 s (V1/V2) | Whip camera | (Removed in V2) | No orbit moves: hard cuts on words. |

## 2. Leg-rig architecture (V4)

**One body.** One persistent hub and dome, with five legs identified 0–4 at fixed body-local sockets (radius 2.8 cm,
i × 72°).

**Each leg is a soft pneumatic actuator**, modelled with the standard piecewise-constant-curvature description used for
soft robots:
- Two inextensible sections, 3.0 cm and 4.3 cm, so the length is fixed by construction at 7.3 cm.
- Each section's only freedom is its curvature vector (u_down, u_lateral), with limits −0.15 ≤ u_down ≤ 0.75 /cm and
  |u_lateral| ≤ 0.4 /cm.
- The root is clamped, leaving the socket outward and 16° up.
- There are no rigid joints, consistent with the research robot's soft actuators.

**IK by continuation.** Each foot target (planted in world space during stance, a lifted arc during swing) is solved by
damped Gauss–Newton, warm-started from the previous time sample, on a 240 Hz track. Per frame, the shape is the
interpolated track refined by 4 iterations, so the shape is a single smooth function of time.

**Surface.** The thickness profile r(s) is fixed. Rings sit at fixed arc lengths, and every marking derives from that
one surface:
- the ribs (ring edges, every second ring);
- the strain-limiting stripe (the faces on the bend-down side);
- the air channel (the top faces, filling with the swing phase).

Shading, ink, highlights and shadows all come from the same deformed surface; nothing is interpolated separately.

## 3. Staged validation

### Stage A: continuous walks (`qa/v4/stageA/`)

| Diagnostic | Camera | Duration | Content | Frame scan |
|---|---|---|---|---|
| `DiagA1.mp4` | Fixed three-quarter (40°, pitch 24°) | 7.0 s, no cuts | Baseline ripple gait | Median change 2.2, max 3.5; 0 single-frame flicker; 0 jumps > 3× median |
| `DiagA2.mp4` | Second angle, side (−100°, pitch 12°) | 9.0 s, no cuts | UV on → paired gait → UV off → ripple, the sag | Median 4.0, max 8.9; 0 flicker; 0 jumps |
| `DiagA3.mp4` | Low head-on (6°, pitch 6°) | 6.0 s, no cuts | The V3 19.25 s problem pose, shuffle, turn | Median 3.2, max 5.6; 0 flicker; 0 jumps |

**Inspection.** All 660 diagnostic frames were inspected as every-frame sheets (`qa/v4/stageA/*.png`). The 19.25 s pose
was also checked full size: the front leg stays in front, the side legs pass behind the hub, and no leg crosses the
body.

### Stage B: deformation (`tools/v4/geom_audit.ts` → `qa/v4/geometry_audit.json`)

Every half frame of the whole film was checked: 1,700 samples × 5 legs. This covers maximum and minimum bending,
stepping, the gait transitions into and out of UV, the sag, and the in-place turns. Result: **PASS, zero failures.**

| Assertion | Required | Measured |
|---|---|---|
| Centreline length | within 2% of 7.3 cm | 7.2956–7.2989 cm (−0.06%) |
| Thickness profile | constant | identical every sample |
| Socket in body-local coordinates | fixed | 0 offset |
| Rib positions | fixed on the surface | identical every sample |
| Foot reached (IK error) | < 0.01 cm | 0.0000 cm |
| Curvature limits | inside | down-bend −0.10 to 0.50 (limits −0.15/0.75), lateral max 0.08 (limit 0.4) |
| Curvature change per half frame | < 0.08 | max 0.047 |
| Bend-direction change (bent sections) | < 0.35 rad | max 0.30 rad |
| Surface vertex movement per half frame | < 1.2 cm | max 0.62 cm |
| Planted foot sliding | 0 | 0 cm |
| Surface below the floor | never | min 0.000 cm |
| Leg vs leg / hub / dome | no intersection | min clearance 1.85 / 0.48 / 2.03 cm |
| Cable vs floor / dome / legs / lamp | no intersection | 3.38 / 0.85 / 1.48 / 6.2 cm |
| Pulses on drawn hyphae | all | 147 routes, 0 off-branch hops |
| Loop (pose, every leg) | identical | ≤ 5e-8 cm |

## 4. Scene timeline: actual cuts (23 shots, hard cuts on narration words and actions)

| # | In–out (s) | Length | Cut on | Shot | Purpose |
|---|---|---|---|---|---|
| 1 | 0.00–1.20 | 1.20 | (loop) | A: three-quarter, push-in | Payoff: the robot already walking, legs actuating, culture in the dome |
| 2 | 1.20–2.75 | 1.55 | "legs, it" | A: elevated full body | The whole machine taking a coordinated step |
| 3 | 2.75–3.98 | 1.23 | "walk." | B: macro hyphae | Living fungus: streaming cytoplasm, tips growing |
| 4 | 3.98–5.33 | 1.35 | "grew" | B: whole scaffold | Scale: the network grown over two electrodes |
| 5 | 5.33–6.69 | 1.36 | "robot's" | B: pan down the leads | Into the robot's controller |
| 6 | 6.69–7.83 | 1.14 | "And" | B: network | A spike runs along existing branches |
| 7 | 7.83–8.40 | 0.57 | "fired" | B: electrode close-up | The spike arrives (8.05) |
| 8 | 8.40–9.10 | 0.70 | "electrical" | B: lead → controller → valve | Processing; the valve opens (8.90) |
| 9 | 9.10–10.13 | 1.03 | "signal..." | A: leg 3 close-up | Air arrives; the leg inflates and curls |
| 10 | 10.13–11.00 | 0.87 | "moved" | A: side medium | Whole-robot step plus the wobble |
| 11 | 11.00–11.84 | 0.84 | "here's" | A: foot close-up | Soft foot setting down on the mat |
| 12 | 11.84–12.89 | 1.05 | "weird" | A: low, looking up | UV lamp swings in, clicks on (12.51) |
| 13 | 12.89–14.74 | 1.85 | "ultraviolet" | B: lit network → electrodes | Spikes become bursts on several branches |
| 14 | 14.74–15.69 | 0.95 | "And the robot" | A: side, under the lamp | Changed gait: paired, faster, higher |
| 15 | 15.69–17.00 | 1.31 | "how it" | A: overhead | Comparison: paired gait under the lamp, back to the ripple when it goes off (16.12) |
| 16 | 17.00–18.58 | 1.58 | "has" | A: high close on the dome | No brain: just fungus and two wires; the soft legs give (17.92) |
| 17 | 18.58–19.39 | 0.81 | "No eyes" | A: low head-on | A blank front walking at us |
| 18 | 19.39–20.26 | 0.87 | "And absolutely" | A: front three-quarter | Marches in place, swings left |
| 19 | 20.26–21.90 | 1.64 | "no idea" | A: high wide | Swings right, then wanders off another way |
| 20 | 21.90–22.62 | 0.72 | "But the mushroom" | B: follows a pulse | Cause: a spike along a branch into an electrode (22.42) |
| 21 | 22.62–23.36 | 0.74 | "literally" | A: leg 4 close-up | Effect: the leg lifts and swings |
| 22 | 23.36–24.78 | 1.42 | "controlling" | B: network + leads + controller | Living network wired to its controller; a spike lights it (23.94) |
| 23 | 24.78–28.33 | 3.55 | "Which" | A: hero, easing in | The whole robot walking; ends on the opening framing (loop) |

Twenty-two of the 23 shots last 0.57–1.85 s. The one longer hold (shot 23) is the reveal and loop setup.

## 5. Frame-by-frame QA (`qa/v4/`)

**Measured** (`render_qa.json`):
- no decode errors;
- the only large frame changes are the planned cuts (19 detected; 3 cuts are between similar views);
- 0 unplanned changes;
- 0 single-frame flicker away from cuts;
- longest near-static run: 2 frames;
- loop seam 3.52 (last vs first frame), against a neighbour median of 3.69.

**Every frame inspected.** All 850 frames (`qa/v4/all_frames/`), twice: before and after the final fixes. Then, full
size: the hook and the loop, all three leg close-ups, the lamp shots, the overhead and the head-on views.

**Defects found and fixed in this pass:**
1. **Black legs:** a colour-mixing bug. Caught in the first rig still.
2. **Lamp through the lens:** in the overhead shot (frames 489–493, 16.3 s), the UV lamp retracted straight up through
   the overhead camera. It now swings out sideways, and the lamp is never drawn closer than 4 cm to the lens.
3. **Hook too tight:** the hook framing showed only the dome. It was widened so the actuating legs are visible, and the
   loop end shares it.
4. **Leg close-ups aimed off:** the close-ups were aimed below the leg, and two of them looked at the cable side. They
   were re-aimed at legs 3 and 4 on the clean side.

**Narration:** WER 0.000 on Zipformer and on Whisper base.en, transcribed from the delivered MP4's own audio.

**Sound:**
- re-timed from the V4 events (`audio/cues_v4.json`);
- the featured spike crackle lands at 8.05 s, the controller blip at 8.55 s, the valve at 8.90 s, and the air reaching
  the leg about 9.15 s;
- footsteps and valve ticks are muted during macro shots;
- UV bursts get triple crackles.

**Mix:** −14.07 LUFS, −1.60 dBTP true peak, voice 18.7 dB over the effects.

**Text:** zero text elements in the V4 source. No captions, labels, graphs, arrows or tags.

**Not done.** Real-time playback with sound. This environment has no audio or video playback, so the "normal speed" and
"0.25×" passes were done on every-frame sheets and the 0.25× file, not by watching. The 0.25× copy is included for your
own review.

## 6. Scientific accuracy

Unchanged from V3 (`SCIENCE_NOTES.md`):
- living king oyster mycelium on an electrode scaffold;
- its spikes processed by electronics;
- an off-board valve inflating soft pneumatic legs;
- a tethered walker;
- UV changing the signal before the gait changes;
- no vision, intention or fungal power.

**Still to verify against the paper (⚠):**
- the raised, spider-like stance (the real five-limbed walker is flatter and crawls more);
- the exact form of the UV gait change;
- compressed spike timing.

The time-lapse growth of the tips in shots 3–4 is a visual compression of growth that took days.

## 7. Remaining defects (honest)

1. **No real-time viewing.** Not watched in real time or heard; a human real-time pass is required.
2. **Kinematic animation.** Body bob and settle are authored; contact forces and inertia are not simulated.
3. **Leg close-up composition.** In shot 9 a neighbouring leg crosses the lower foreground while the actuating leg
   curls behind it. This reads correctly in depth but is busier than ideal.
4. **Small subject.** The robot is fairly small in the high wide shot 19 and in the overhead shot 15.
5. **Similar cuts.** Three of the 22 cuts join similar framings: 13→14 lit network → robot, 17→18 and 18→19 robot →
   robot.
6. **Leg rings.** The ring tessellation (18 sides) is faintly visible as facets on the closest leg close-ups.

## 8. Publish-readiness: 8.5 / 10

**What V4 fixes:**
- the legs are one deforming 3D surface with stable markings and correct occlusion, verified numerically at every half
  frame and visually at every frame;
- the edit moves at about 1.2 s a shot with clear cause → effect pairs.

**Before publishing:**
- one real-time viewing with sound;
- the ⚠ science checks.
