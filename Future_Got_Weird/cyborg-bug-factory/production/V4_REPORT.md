# Cyborg Bug Factory: V4 report (minimalist polish)

## Final file

`exports/FGW_Cyborg_Bug_Factory_V4_FINAL_REVIEW_1080x1920.mp4`

- Rendered natively from the Remotion composition `CyborgBugFactoryV4` at 1080×1920. It is not an upscale.
- Source: `source/src/v4/`. Mix: `mix_v4`, from `tools/make_audio_v4.py`.
- V1–V3 are unchanged and still render.

V4 is a polish pass on V3, not a redesign. These are the same as V3:
- the art, models, workstation and narration;
- the cut points and the factory opening;
- the camera paths everywhere except the robot build.

## Exact changes

### Text removed (everywhere)

| Removed | Was at (s) |
|---|---|
| ARM CAM · ALIGNING / IMPLANT HUD: corner brackets, scale bar, alignment cross-hair | 0–1.1, 30.6–end |
| INSPECTION CAM · 6× HUD; callouts ELECTRODES IN MEMBRANE, HOOKS ON METATHORAX, CONTROLLER + RADIO | 1.95–3.2 |
| "ILLUSTRATION · ONE INSECT PER CYCLE, REPEATED" tag and the dashed ghost insects it labelled | 1.3–2.05 |
| Wrist-camera pronotum segmentation overlay | 4.6–4.84 |
| Step bar: the 0→68 count-up, the seven step names, the "PER INSECT / SPED UP HERE" text and the footnote | 4.3–6.45 |
| CELL CAM · GRIPPER / PLACEMENT HUD; ELECTRODES → MEMBRANE callout | 6.5–10.4 |
| INSPECTION CAM · 8× HUD; 4 MOUNTING BRANCHES and BIPOLAR ELECTRODES callouts | 10.3–11.6 |
| STATION CONSOLE · WIRELESS TEST panel | 11.55–13.0 |
| Robot part labels (GEAR MOTORS, WHEELS, BATTERY, CONTROLLER, SENSORS) and the cards A TINY ROBOT and A LIVING INSECT | 14.9–20.6 |
| ADDED: ONE 2.3 g BACKPACK callout | 19.25–20.6 |
| MYANMAR EARTHQUAKE · 2025 banner | 22.35–24.85 |

Nothing replaced them. The sound cues tied to those graphics were also removed: HUD blips, label ticks, step-bar
ticks and the console blip.

What text remains:
1. **The narration subtitles.** Their text, timing, font and positions are unchanged. Emphasis was cut from 22
   highlighted words to five lines' worth: COCKROACHES, 68 SECONDS, LIVING, EARTHQUAKE, BUGS.
2. **One numeric graphic, "68 SECONDS"** (4.23–6.5 s), described in the next section.

### 3–7 s: one timing graphic

The "4 seconds, then 68" you saw was V3's count-up: the step bar counted 0, 1, 2, 3, 4 … 68 over 1.15 s.

V4 shows a fixed **68 / SECONDS** in a dark disc. There is no counting. A ring around the number sweeps once while the
sped-up cycle plays (the next insect is fixed, the arm grasps the module, implants and latches, and the rods release
the insect). The ring closes and turns yellow on the release (5.58 s), with a soft chime.

This matches the study's measured definition: "The entire automatic assembly, from initially fixing insect to finally
releasing insect, spanned 68 s."

### 0–3 s: the hook

Frame 0 is the same picture as V3, an extreme macro of the arm lowering a module onto a fixed, living insect. The camera
labels, corner framing and cross-hair are gone. The alignment correction, implant, latch with a camera kick, LED and
pull back are unchanged.

### 7–13 s: macro assembly

The labels and panels are gone. I checked the tool–module contact at every phase (holder pick at 7.18, carry, placement,
latch at 10.15, release). The fingers close on the module's grasping tab and stay on it; the module never floats free of
the gripper. After the latch, the electronics stay attached to the insect in every frame. The test pulse at 12.62 is
still shown on the backpack itself; only the console panel was removed.

### 13–19 s: the robot comparison (rebuilt camera and pacing)

- **Bigger.** The camera now works at 20–31 px/mm instead of V3's 13–14.5, so each part is roughly twice the size on
  screen.
- **A clearer sequence.** The parts arrive in an even, readable order, each seating with a small light glint and a
  click: chassis (15.08) → gear motors (15.5, 15.62) → wheels (15.94, 16.06) → caster → battery (16.5) → controller
  (16.8) → sensor (17.08).
- **Tracking.** The camera moves close to each part as it seats: low on the motors, then the near wheel, up over the
  battery and board, around to the sensor. Then it pushes onto the spinning wheel.
- **A soft contact shadow** grounds the robot on the bench.
- **The match cut** (17.93) goes from the spinning wheel to the insect's near legs mid-stride, in the same place on
  screen. The camera then travels with the legs in a tripod gait. From 18.55 to 19.9 it pulls back to the whole walking
  insect with its backpack.
- **No text, and no performance comparison.** The film doesn't claim the insect is faster or better than the robot.

### 19–21 s: the insect alone

No labels. The rig, with six jointed legs, a tripod gait and the backpack seated on the thorax, is the same as V3.

### 21–26 s: earthquake

- **Banner removed.** The rubble, crevice, route and camera are unchanged, so the parallax is V3's.
- **Easier to follow.** A soft sunlit patch lies on the ground under the insect, so its dark body reads against light,
  even in the wide 20.6–22 s shot where it is small. Its warm rim light is stronger (0.5 → 0.9). The frame's vignette is
  now centred on the insect instead of the frame.
- **Nothing implied.** No feed, detection or survivor is shown.

### 26.7–31.5 s: ending and loop

- **HUD removed.** There is no logo, fade or end card.
- **The reset is unchanged.** A finished cyborg walks off. The platform slides out and returns with the next insect. The
  arm goes to the holder and takes the next module (27.98). The module comes into position and down, into frame 0's
  macro.
