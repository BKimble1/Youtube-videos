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

### Smoother camera

The two big macro push-ins were the harshest moves in V3 (about 10× zoom in under a second), so I softened them. The
2.0–3.0 s inspection push now goes to 28 px/mm instead of 44, over a slightly longer window. The 10.15 s macro now goes
to 34 instead of 48, and the 11.2–12.6 s pull back is longer and less extreme.

Measured, using frames whose change is more than 5× the median:

| Move | V3 | V4 |
|---|---|---|
| 2.4 s push-in | 13 frames | 4 frames |
| 3.5 s pull back | 10 frames | 3 frames |
| 11.8 s pull back | several frames | none |

## Narration

**Unchanged.** The master `audio/narration/FGW_Cyborg_Bug_Factory_narration_V1.wav` has SHA-256
`2cf791cc…8a87c3`, which equals `voice_provenance.json`. Caption text and timing are identical to V1–V3; only the
yellow emphasis was reduced.

ASR on the V4 MP4 (`qa/v4/asr_final_mp4.json`, `qa/v4/asr_tail_24.5s.json`):
- **Whisper** is verbatim, except "cockroaches" for "cockroach's". It drops the last line on the whole file because of
  its 30 s window. On the 24.5 s–end tail it hears "…which means we're not just building robots anymore. We're turning
  bugs into them." verbatim.
- **Zipformer** hears every word, with sound-alikes only ("rowbots", "sideboard", "any more").

## Scientific verification

All sources were opened and read in this session. Quotes are in `research/SCIENCE_NOTES.md`.

| Claim (narration or picture) | Verified | Source |
|---|---|---|
| A machine assembles cyborg cockroaches; robotic arm; the insect is fixed, the backpack taken from a holder, electrodes implanted, the insect released | Yes | Lin et al., *Nat Commun* 16:6073 (2025), https://pmc.ncbi.nlm.nih.gov/articles/PMC12304280/ |
| **68 seconds** (the graphic) | Yes, per insect, fixing → release | Same paper: "The entire automatic assembly, from initially fixing insect to finally releasing insect, spanned 68 s." The CO₂ anaesthesia beforehand is not included. |
| "Tiny computer" on the back | Yes | Same paper: the backpack carries a microcontroller with a radio; 2.3 g. |
| Electrodes, pulses, turning | Yes, an influence, not full control | Same paper: "robust steering (over 70°) and deceleration" under stimulation. |
| Madagascar hissing cockroach (the rig) | Yes | Same paper. |
| Real earthquake disaster zone | Yes | NTU, https://www.ntu.edu.sg/news/detail/ai-powered-robot-assembles-search-and-rescue-cyborg-insects: on 30 March 2025, 10 cyborg insects were deployed to Myanmar with SCDF, the first field deployment. The Star, https://www.thestar.com.my/aseanplus/aseanplus-news/2025/04/05/singapores-cyborg-cockroaches-helping-with-search-and-rescue-efforts-in-myanmar-quake: used on 31 March and twice on 3 April in Naypyidaw. Also Mothership, https://mothership.sg/2025/04/cockroach-robot-myanmar-quake-rescue/ |
| No survivor detection shown | Correct to omit | The Star: "They have not found any survivors." |

**No material claim is unresolved.** With the banner removed, the film no longer names the hand-built status of the
deployed units, but it doesn't contradict it either: no claim is made that the factory built the Myanmar insects. The
assembly line is a prototype (NTU), and the film never shows it as in production.

## Technical QA (measured from the file)

| Check | Result |
|---|---|
| Format | 1080×1920, 30 fps, H.264 yuv420p, AAC 48 kHz stereo at about 317 kb/s, 946 frames, 31.533 s, 26.7 MB, no decode errors. A native render. |
| Loudness | −14.6 LUFS integrated, −2.2 dBFS peak (mix true peak −1.6 dBTP). The voice is on top in every speech window; the worst bed-to-voice window is −3.7 dB at 29.0 s. |
| Planned cuts | 14.9 (to the build), 17.93 (match cut), 20.6 (to the rubble), 26.77 s (back to the workstation) |
| Other large changes | The softened 2.6 s and 3.6 s moves (4 and 3 frames), plus two single frames at 4.57 and 6.03 s. Those two are the platform sliding during the sped-up "68 seconds" cycle, the same as in V3. |
| Static picture | The longest near-static run is 6 frames. |
| First 2 s | Every frame checked (`qa/v4/first_2s_every_frame.png`): a continuous descent, alignment, latch, LED and pull back, with no text other than the subtitle. |
| Phone size | `qa/v4/phone_size_beats.png`: subjects and subtitles readable; the 68 graphic is clear. |

### Loop

**Passes.** Measured above the caption band, so only the picture counts:

| Measurement | Value |
|---|---|
| Last frame → first frame | 12.98 |
| Last three steps before the seam | 12.6–13.2 |
| First three steps after the seam | 12.7–12.8 |

The seam is an ordinary frame step in the continuous descent. Measured over the whole frame, the seam is 12.2 against
about 9.5 for its neighbours. The extra is only the subtitle changing from the last line to the first, because the
narration restarts.

Supporting files:
- `qa/v4/loop_seam_x5.mp4`: the last 2 s and first 2 s, five times.
- `qa/v4/loop_seam_last6_first6.png`: the same module, tool, camera and lighting on both sides.
- The audio seam jump is 0.004.

## Final review checklist

| # | Check | Result |
|---|---|---|
| 1 | First 2 s compelling | Yes. Frame 0 is the machine already lowering a module onto a living insect; the latch lands at 1.0 s. |
| 2 | Unnecessary text removed | Yes. Only the subtitles and one 68 s graphic remain. |
| 3 | Subtitles readable | Yes, at phone size. |
| 4 | Timing graphic accurate | Yes. "68 SECONDS" is fixed, and its ring spans fixing → release. |
| 5 | Robot comparison improved | Yes. About 2× larger on screen, close tracking per part, a direct cut into a leg close-up and the gait. |
| 6 | Earthquake clean and supported | Yes. No banner, the insect stands out, and the claims are verified. |
| 7 | Anatomy consistent | Yes. The same six-legged rig and seated backpack throughout. |
| 8 | Transitions smooth | Yes. The harshest moves were softened; the cuts are planned. |
| 9 | Loop works | Yes, measured above. |
| 10 | Genuinely 1080×1920 | Yes, rendered natively. |
| 11 | Narration unchanged | Yes, hash identical. |
| 12 | No factual inaccuracies | None found. |

## Verdict: **READY**

Every check above passes on the rendered file, and every claim is verified with a source.

One caveat: this environment has no screen or speakers. The review was frame-by-frame, measured, and machine-transcribed;
nobody has watched it in real time with sound. Watching it once on a phone before posting is still recommended, but no
known issue is left to fix.
