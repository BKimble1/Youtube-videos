# Mushroom Robot V6: final mechanical repair, retention polish, native 1080p export

**Deliverable:** `exports/FGW_Mushroom_Robot_V6_FINAL_1080x1920.mp4`. Source: `source/src/v6/` (composition
`MushroomRobotV6`, shot list `v6/shots.ts`). The approved narration is used unchanged. QA aid:
`qa/v6/FGW_Mushroom_Robot_V6_QA_0.25x_540x960.mp4`.

## 1. Export: verified (Test E)

From `ffprobe` (`qa/v6/ffprobe_V6_FINAL.json`):

| Property | Value |
|---|---|
| Video | H.264 High, **1080×1920** (coded 1080×1920, SAR 1:1), **30/1 fps**, yuv420p, 850 frames (850 decoded), 28.333 s |
| Audio | AAC-LC 48 kHz stereo, 28.352 s |
| Container | MP4, 22.3 MB |

**Native, not upscaled** (`qa/v6/native_detail_check.json`). I took three frames, downscaled them to 512×910 and
upscaled them back. The rendered frames carry 2.25–2.77× the high-frequency detail of those round trips. An upscaled
512×910 render would measure close to 1×. The render ran with `--scale=1` from the 1080×1920 Remotion composition.

**About the 512×910 report.** The V5 file in the repository (`exports/FGW_Mushroom_Robot_V5_FINAL_1080x1920.mp4`,
SHA-256 `4c19da2f…`) measures 1080×1920 with ffprobe and passes the same native-detail test (2.2–2.4×). The 512×910
copy was most likely produced on the way to the reviewer: a preview or transcode of the delivered file. To check a
copy:

```
ffprobe -v error -select_streams v -show_entries stream=width,height,r_frame_rate,nb_frames -of csv=p=0 FILE.mp4
```

The V6 file should report `1080,1920,30/1,850`.

## 2. Rigging and locomotion changes (`v6/robot.ts`, `v6/timing.ts`)

V5's rig was re-inspected on the actual exported frames in the four flagged ranges (`qa/v6/diag/`). The leg shape
itself was stable. What read as "legs bending while the body stays put" was mostly that the body hardly travelled.

**Stride +33%** (2.25 → 3.0 cm per step). This is the most the clamped soft legs allow within their bend limits: a
sweep of root angle against stride showed that 35° roots force reverse bending above about 2.6 cm, while 30° roots
reach 3.0 cm. The root angle is now 30°.

**Weight shift.** While a leg is in the air, the body shifts 0.22 cm away from it in the ground plane, with a
jerk-free weight. Each step now reads as weight moving over the planted feet.

**UV gait.** Steps are 0.8 of a stride every 0.43 s: about 1.8× the baseline travel speed, in pairs. Previously the
paired steps covered almost no ground.

**Featured step.** The step at 9.25 s is 0.85 of a stride, avoiding a −0.035 reverse-bend at its landing that the
audit caught.

**Pause removed.** A step was moved from 12.25 to 11.55 s, removing a 14-frame motionless pause at 11.4 s.

**Unchanged from V5, and re-verified:**
- one continuous soft actuator per leg: fixed 7.3 cm length, curvature varying linearly along it, root clamped to a
  fixed body-local socket;
- arc-length-parameterised swept surface, with ribs, underside stripe, air channel and shading all derived from that
  surface;
- ray-cast body occlusion;
- continuation IK;
- jerk-free lift, travel and body motion;
- world-anchored cameras.

## 3. Pacing and scene changes (25 beats, cut on measured words or actions)

| # | Time (s) | Beat | Change from V5 |
|---|---|---|---|
| 1 | 0.00–1.04 | The whole walker mid-step (payoff) | **New:** full machine first |
| 2 | 1.04–1.97 | Rear soft legs peel off and set down | Was the opener |
| 3 | 1.97–2.92 | Down into the dome: a living culture pulses | |
| 4 | 2.92–3.98 | Living mycelium (macro) | |
| 5 | 3.98–5.05 | Electrode contact | |
| 6 | 5.05–6.69 | Leads into the electronics | |
| 7 | 6.69–8.40 | Riding one spike along the branches into the electrode (8.05) | **New:** follows the spike, replacing the static network view |
| 8 | 8.40–9.10 | Controller LED, valve opens, air out | |
| 9 | 9.10–10.13 | The actuator responds (leg 3) | Pulled back for a fuller leg view |
| 10 | 10.13–11.84 | Static side: two steps carry it across the frame | **New:** before-UV framing; no pause |
| 11 | 11.84–12.89 | UV source swings in and clicks on (12.51) | **Split** |
| 12 | 12.89–13.61 | Light on the fungus: first bursts | **Split** |
| 13 | 13.61–14.74 | The signal changes (bursts on several branches) | |
| 14 | 14.74–15.69 | The same side framing as beat 10: paired, faster steps | **New:** direct before/after comparison, readable muted |
| 15 | 15.69–16.56 | Brief high view; lamp off | |
| 16 | 16.56–17.75 | No brain: eye level with the dome, fungus and two wires | |
| 17 | 17.75–18.58 | The soft legs give, the body slumps | |
| 18 | 18.58–19.39 | No eyes: mat level, head-on, long lens (28°) | **Fixed:** no wide-angle stretch of the near leg |
| 19 | 19.39–20.26 | Marching in place | |
| 20 | 20.26–21.90 | No idea where: static low three-quarter, swings and walks off across the frame | **Replaced** the rotating overhead |
| 21 | 21.90–22.62 | A fungal signal into an electrode | |
| 22 | 22.62–23.36 | An actuator answers (match) | |
| 23 | 23.36–24.78 | Pull back from the culture to the whole machine | |
| 24 | 24.78–26.36 | Brief top view: the five-leg ripple carries it across the mat grid | **New:** replaces the repeated walking shot |
| 25 | 26.36–28.33 | The last step on "body"; settles into the opening framing (loop) | |

Beats run 0.70–1.97 s; the median is about 1.0 s.

## 4. Validation

### Test A: continuous walking

`qa/v6/tests/V6TestA-walk.mp4`: 1080×1920, 6.0 s, final rig, static world camera, no cuts.
- Frame scan: median change 1.15, max 3.98, **0 single-frame flicker**.
- Every frame inspected: five arched legs on fixed sockets; ribs fixed on the surface; feet stay put while planted
  as the body moves across the frame; no clipping.

### Test B: gait transition

`V6TestB-gait.mp4`: 7.5 s, static wide, covering baseline, lamp in, UV on, the paired faster gait, lamp off and
baseline again.
- Median 0.83, max 2.85, 0 flicker.
- Every frame inspected: the change in pattern is continuous, with no pose switching.

### Test C: perspective consistency

`V6TestC-views.mp4`: the same instant from four static cameras at once (three-quarter, overhead, low side, rear),
2 s.
- Frames 0, 20 and 40 compared: the same five legs, sockets, proportions, spout and dome in every view.
- 0 flicker.

### Geometry audit: PASS, zero failures

`tools/v6/geom_audit.ts` → `qa/v6/geometry_audit.json`. It checks every half frame (1,700 samples × 5 legs), plus a
240 Hz snap scan.

| Check | Result |
|---|---|
| Leg length | 7.2964–7.2990 cm (within 0.05%) |
| Thickness, ribs, sockets | unchanged (0 offset) |
| IK | foot reached (error 0) |
| Curvature | −0.025 to 0.59 /cm (one-sided limit −0.03; max 0.7) |
| Curvature step | max 0.078 per half frame |
| Snap | 0.0004 /cm (threshold 0.002) |
| Planted-foot slide | 0 |
| Below floor | never |
| Leg vs leg / hub / dome | ≥ 1.85 / 0.38 / 1.64 cm |
| Cable vs dome / legs | ≥ 0.84 / 1.47 cm |
| Loop | pose identical to frame 0 after one full turn; legs within 2e-9 cm |

### Test D: full render (`qa/v6/render_qa.json`, `qa/v6/all_frames/`)

**Measured:**
- no decode errors;
- 22 planned cuts detected, **0 unplanned changes**, **0 single-frame flicker**;
- longest near-static run **5 frames** (V5: 10);
- loop seam (last vs first frame) **1.9**, against a neighbour median of 4.92 (V5: 3.16).

**Inspected:** all 850 frames on every-frame sheets, including the four flagged ranges (9.5–11.7, 14.8–16.5, 18–19.5
and 20–22 s) and the loop.

**Narration:** WER 0.000 on Zipformer and on Whisper base.en, transcribed from the delivered file's own audio.

**Mix:** −14.07 LUFS, −1.60 dBTP, voice 18.1 dB over the effects.

**Text:** 0 text elements in the source.

**Not done:** real-time viewing with sound. This environment has no playback; normal-speed and 0.25× review were done
on every-frame sheets and the 0.25× file.

## 5. Remaining visible defects (with timestamps)

1. **1.07–1.25 s:** in the rear-leg close-up, the nearest leg swings very close to the lens and briefly fills the
   lower frame.
2. **9.10–10.13 s:** the actuator close-up still shows a neighbouring leg crossing the lower foreground.
3. **18.58–19.39 s:** the long-lens head-on view flattens the depth. The proportions are correct, but the shot reads
   flatter than V5's.
4. **24.78–26.36 s:** in the top view, the cable shows as a thin line running to the frame edge.
5. **Throughout:**
   - the stance stays raised and arched, a stylisation of the real flatter, five-limbed starfish robot (still to check
     against the paper);
   - the lamp arm and cable boom are invented;
   - body motion is kinematic, not physically simulated;
   - faint ring facets show in the closest frames.
6. **Science (unchanged):** the exact form of the UV gait change and the compressed spike timing are illustrative.

## 6. Publication-readiness: 8.9 / 10

The locomotion now reads (a bigger stride, a weight shift, and an identical before/after framing for UV), the export
is verified native 1080×1920, and every automated and frame check passes. Remaining before publishing: one real-time
viewing with sound, and the open science checks.
