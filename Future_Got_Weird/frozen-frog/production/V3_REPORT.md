# Frozen Frog V3: review report

**File.** `exports/FGW_Frozen_Frog_V3_REVIEW_1080x1920.mp4`. **It is not published.**

**Runtime.** 24.5 s (735 frames at 30 fps). The narration is unchanged from V1/V2, sample for sample. What changed
against the brief, and the transition list, are in `production/SHOT_PLAN_V3.md`.

## Measured (from the rendered file)

| Check | Result | Evidence |
|---|---|---|
| Format | 1080×1920, 30 fps, H.264 yuv420p (BT.709, CRF 16), 735 frames, 24.5 s; AAC 48 kHz stereo, 317 kb/s; 49.88 MB | `qa/v3/render_qa.json` |
| Full decode | no errors | `qa/v3/render_qa.json` |
| Narration in the final file | Whisper base.en: word-perfect. Zipformer: one homophone ("its cells" → "itselves"). | `qa/v3/final_asr.json` |
| Loudness | −14.2 LUFS integrated, −1.6 dBTP true peak (4× oversampled); the voice at about −17 LUFS in the mix | `qa/v3/mix_measure_mix_v3.json`, re-measured on the delivered file |
| The stop | The last beat on "HEART" (1.60 s) is the loudest of the opening beats (−17 dB low band). Then silence under the voice: the low band at −41 dB until the ice lock on "STOPS" (2.52 s), which jumps to −19.5 dB. | `audio/sfx_log_mix_v3.json`; measured, this report |
| The restart | The twitch on "starts" (19.18 s) is a small pulse. The first beat on "beating" (19.60 s) is the loudest beat in the film (−13.4 dB low band), with the ice shattering and a low rush of blood. | measured, this report |
| Single-frame jumps | None unplanned | `qa/v3/render_qa.json` |
| Static holds | None; the longest near-static run is 0 frames | `qa/v3/render_qa.json` |
| Loop seam | The last frame and frame 0 show the same picture: the same spot, pose, cutaway, heart, cold edge and light. Mean difference 4.23/255, against a median frame-to-frame change of 14.72; most of it is the first caption appearing on frame 0. | `qa/v3/loop_seam_last3_first3.png` |

Sheets: `qa/v3/contact_every_0.5s.png` and `qa/v3/hook_0-2.5s_every_3rd_frame.png`.

## The brief's global QC

- **FGW 2D vector, restrained 2.5D, no 3D, no floating diagrams or text.** Yes. The only text is the subtitles of the
  spoken words.
- **No anatomical distortion, eye drift or warped limbs.** One rig throughout, with fixed body geometry and segment
  lengths. The eye is fixed in the head: only the lens clouds, the lids move and the pupil widens. The hops bend the
  legs at the hip, knee and ankle only.
- **A purposeful change every 1–2 s.** See the transition list; no two adjacent half-second samples show the same
  event.
- **Smooth camera moves, no whip cuts.** Every change of subject is a velocity-continuous move. The nested zooms were
  frame-stepped. Two of them showed organ-scale shapes at the frame's edge just before the switch to cell scale;
  both were fixed (the reveal now always clears the frame, and organ-scale glucose fades out at cell scale).
- **The narration is preserved.** It is unchanged, and the transcript of the final file matches it.
- **Sound for the freeze, the stopped heart, the thaw and the restart.**
  - The freeze: an aggressive crystalline crackle sweep with a deep ice groan, and a crunch as the limbs lock.
  - The stopped heart: the last beat, dead silence, then the ice-lock crack and a frozen ring.
  - The thaw: the snowpack slumping, meltwater drips, and the frost and pericardial ice melting.
  - The restart: a twitch, then a boom with the ice shattering and the blood surging back.
- **No heartbeat in the frozen state.** The schedule has no beat between 1.60 s and 19.18 s. The heart stays frosted
  and still until the twitch and the first beat.
- **The hop is animated.** Two hops, each with a crouch, a push-off, a flight, a landing and a settle, both with the
  camera following.

## Unresolved production issues

1. **No one has listened in real time** (there is no audio playback in this environment). The audio was checked by ASR,
   loudness, true peak and band levels at the key moments.
2. **No Runway** (its outputs cannot be downloaded into this environment). The film is native vector.
3. **The benchmarks** (Cyborg Cockroach V5, Dead Spider V6) are not in this repository. The work was matched against
   the most recent Shorts here.
4. **The hops toward the camera** are a 2.5D depth move: the side-view frog grows as it comes forward. It does not
   turn to face the lens.
5. **The heart rate (135 bpm)** is faster than a cold wood frog's.
6. **The science compression.** In a real frog the heart beats on for a while after ice forms and spreads the glucose
   before it stops. The film follows the narration's order and never shows the heart beating while frozen. The ice
   spear is a visual stand-in for freezing's mechanical and dehydration stress on cells.
