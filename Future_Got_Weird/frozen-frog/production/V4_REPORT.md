# Frozen Frog V4: review report

**File.** `exports/FGW_Frozen_Frog_V4_REVIEW_1080x1920.mp4`. **It is not published.**

**Runtime.** 24.8 s (744 frames at 30 fps). This is 0.3 s longer than V3: the calmer read is longer even after its gap
edits, and the extra time keeps the hops at their natural pace. The shot plan, the voice and what changed against the
brief are in `production/SHOT_PLAN_V4.md`.

## The script approval gate

The approved wording is unchanged and the subtitles are the approved text. **The proposed alternative hook is not in
this render.** It is waiting for the creator's approval.

## Measured (from the rendered file)

| Check | Result | Evidence |
|---|---|---|
| Format | 1080×1920, 30 fps, H.264 yuv420p (BT.709, CRF 16), 744 frames, 24.8 s; AAC 48 kHz stereo, 317 kb/s; 50.3 MB | `qa/v4/render_qa.json` |
| Full decode | no errors | `qa/v4/render_qa.json` |
| Narration in the final file | Whisper base.en: word-perfect against the approved text. Zipformer: one homophone ("its cells" → "itselves"). | `qa/v4/final_asr.json` |
| Delivery | The same voice (`kk5XaSLo2XAw0sKM98zU`). Emphasis over the median word: "STOPS" +2.7 dB, "dead" −5.6, "freezes" −4.0, "weeks" −3.2; the most emphasised word is the payoff, "hops away" (+6 dB). | `audio/narration/voice_provenance.json` (v4) |
| Loudness | −14.7 LUFS integrated, −1.6 dBTP true peak (4× oversampled) | `qa/v4/mix_measure_mix_v4.json`, re-measured on the delivered file |
| The stop | The last beat at 1.935 s, on "HEART" (1.94 s). Effects, beds and music are gated to silence until the ice lock at 3.055 s, on "STOPS" (3.06 s); only the voice continues. | `audio/sfx_log_mix_v4.json`, `audio/cues.json` |
| The restart | The twitch at 19.545 s, on "starts". The first beat at 19.924 s, on "beating", is the loudest beat in the film (−12.9 dB low band). | measured, this report |
| Single-frame jumps | None unplanned | `qa/v4/render_qa.json` |
| Static holds | None; the longest near-static run is 0 frames | `qa/v4/render_qa.json` |
| Loop seam | The last frame and frame 0 show the same picture. Mean difference 4.24/255, against a median frame-to-frame change of 14.21; most of it is the first caption appearing on frame 0. | `qa/v4/loop_seam_last3_first3.png` |

Sheets: `qa/v4/contact_every_0.5s.png`, `qa/v4/hook_0-2.5s_every_3rd_frame.png` and `qa/v4/hops_frame_step.png`
(both hops, frame-stepped).

## The brief's final QC

- **A compelling first frame.** The frog is large, in profile, its golden eye open and its heart beating in the chest
  window, with frost already at the frame's edge. It is moving.
- **A dramatic physical event in the first two seconds.** The ice wave sweeps the frog from 0.1 s; it is frozen by
  about 0.8 s, and the camera is on the heart by 0.93 s. Ice creeps in round the labouring heart, and the last beat
  lands on "HEART" (1.94 s).
- **Excited but not overacted.** A calmer take in the same voice, with no shouted words. Judged by measurement and by
  two ASR models only: nobody has listened to it in this environment.
- **A readable mechanism.**
  - Ice forms between the cells.
  - Water is pulled out of the cells.
  - A spear dents one cell.
  - The liver releases sugar.
  - The sugar travels in the blood.
  - It enters the cell, which rounds out and holds.

  There are no labels or diagrams.
- **A convincing hop.**
  - Each push-off extends the hind legs against planted feet: the body is carried so the toes stay put.
  - The flight runs forward only (checked numerically: no backward drift in either flight).
  - The legs trail, then tuck, and the arms reach; the landing is absorbed in a crouch.
  - Leaf litter kicks up at every push-off and landing.
  - The frog stays in frame throughout (frame-stepped).
- **A loop into the opening.** Hop 2 lands in the opening's spot and the camera settles into frame 0's framing. The
  heart, the cold and the head lift carry through the seam.

## What was found and fixed during QA

1. **A paused opening.** The first warp curve forced zero speed at its ends, so the opening's first frames barely
   moved. The warp now uses end-secant slopes, so the clock runs from frame 0.
2. **A near-still heart.** The heart close-up between arrival and the last beat barely changed. Ice now creeps in
   round the heart there.
3. **A non-physical push-off.** Keeping the toes planted with a fully swung leg threw the body forward 67 mm in
   0.18 s, then drifted it backward in flight. The push-off now extends the leg only to a downward thrust, and the
   arc runs straight on from there.
4. **The frog out of frame.** It left the frame at the top of each push-off. The camera now widens and rises
   through both.

## Unresolved production issues

1. **The voice has not been heard in real time.** The calmer delivery is confirmed by level measurement and ASR,
   not by ear.
2. **The proposed hook is awaiting approval.** It is not used.
3. **No Runway.** Its outputs cannot be downloaded into this environment, so the film is native vector.
4. **The benchmarks** (Cyborg Cockroach V5, Dead Spider V6) are not in this repository.
5. **The picture runs on a time warp of V3's timing.** It runs between 0.77× and 1.32× of V3's speed, smoothly; no
   stretch is visible on the sheets.
6. **The hops** toward the camera are a 2.5D depth move: the side-view frog grows as it comes forward.
7. **The science notes from V3 stand.** The heart rate is stylised. The narration's order (heart stops, then sugar)
   compresses the real sequence. The ice spear stands in for freezing stress on cells.
