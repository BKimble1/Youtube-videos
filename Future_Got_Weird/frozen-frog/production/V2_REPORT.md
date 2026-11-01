# Frozen Frog V2: review report

**File.** `exports/FGW_Frozen_Frog_V2_REVIEW_1080x1920.mp4`. **It is not published.**

**Runtime.** 24.5 s, 735 frames at 30 fps. The narration is unchanged from V1, sample for sample (the same master,
the same word times). The shot plan and what changed against the V2 brief are in `production/SHOT_PLAN_V2.md`.
The source is composition `FrozenFrogV2`, mix `mix_v2`; V1 is at commit `7398f50`.

## Measured (from the rendered file)

| Check | Result | Evidence |
|---|---|---|
| Format | 1080×1920, 30 fps, H.264 yuv420p (BT.709, CRF 16), 735 frames, 24.5 s; AAC 48 kHz stereo, 317 kb/s; 46.0 MB | `qa/v2/render_qa.json` |
| Full decode | no errors | `qa/v2/render_qa.json` |
| Narration in the final file | Whisper base.en: word-perfect. Zipformer: one homophone ("its cells" → "itselves"). | `qa/v2/final_asr.json` |
| Loudness | −14.0 LUFS integrated, −1.6 dBTP true peak (4× oversampled); the voice at about −17 LUFS in the mix | `qa/v2/mix_measure_mix_v2.json`, re-measured on the delivered file |
| The final beat and the cutoff | The final beat (1.336 s) is the loudest of the opening beats. From 1.426 s to 1.9 s the effects, beds and music are gated to silence; only the voice continues. The low band falls from −17 dB on the beat to −44 dB after it. | `audio/sfx_log_mix_v2.json` (the "HARD CUT" entry); measured, this report |
| The restart | The twitch at 19.18 s is a small pulse. The first full beat at 19.60 s is the loudest beat of the revival (−14 dB low band against −22 dB around it), followed by a low rush of returning circulation. | measured, this report |
| Single-frame jumps | None unplanned | `qa/v2/render_qa.json` |
| Static holds | None; the longest near-static run is 0 frames | `qa/v2/render_qa.json` |
| Loop seam | The last frame and frame 0 show the same picture: the same frog spot, pose, cutaway and heart, the cold edge and the light. Their mean difference is 3.97/255 (the median frame-to-frame change in the film is 13.45). By region: about 1/255 in the sky and the litter; about 4.5/255 over the frog (the head lift and heartbeat in progress); about 15/255 in the caption band (the first caption appears on frame 0). The first V2 render left the spring sun in the last frames; it now clouds over as the cold returns. | `qa/v2/loop_seam_last3_first3.png`, `qa/v2/render_qa.json` |

Sheets: `qa/v2/contact_every_0.5s.png` and `qa/v2/hook_0-2.5s_every_3rd_frame.png`.

## The V2 brief's QC list

- **The opening frame.** Frame 0 is the living frog in close-up: golden eye open, heart visible in the chest window,
  frost at the frame's edges. It is already moving: the head is rising and a front foot is about to step.
- **The 2-second hook.**
  - The frog moves (0–0.3 s).
  - A wave of ice with a bright leading edge sweeps the body from the ground and rear up over the head (0.25–0.85 s), and across the leaf litter. Each limb sets as it passes, the lens clouds and the lids sag.
  - The camera pushes through the chest from 0.5 s and is on the heart by 1.25 s.
  - The final, strained beat is at 1.336 s; the sound cuts out 90 ms later.
  - Ice bursts round the motionless heart by 2.0 s.
- **Scene variety.** Each half-second sample is different (see the contact sheet). The two cell visits no longer share
  a composition:
  - Scene B is a wide field of cells with an ice spear driving into one.
  - Scene C is inside a capillary (glowing molecules among oval red cells), then that same cell in close-up as it fills, rounds out and holds.
  - Winter now moves: from the frozen face, the camera rises to the sky as a day and a night pass.
- **Glucose clarity.** Each beat is under 2 s:
  - The liver flares and pours glowing rings into the vein (9.2–10.15 s).
  - The camera follows them into the bloodstream (10.15–10.95 s) and along the vessel (10.95–11.6 s).
  - They pass the cell's transporters (11.6–12.2 s).
  - The cell rounds out and pushes the dent back (12.0–12.85 s), and the needles stop at its membrane (12.4–13.6 s).
- **A believable revival.**
  - The pericardial ice melts and the heart reddens.
  - A twitch on "starts", then the powerful first pulse on "beating", with a kick.
  - Red pulses race out along the arteries with each beat.
  - Out at the face, the eyes open and the legs stretch, then the crouch and the leap.
- **Frog anatomy.**
  - One rig throughout, with fixed body geometry and limb segment lengths.
  - The eye stays in place (only the lens clouds and the lids move).
  - The three-chambered heart, the lobed liver with its gall bladder, and the arteries out of the truncus.
  - The webbed hind feet and dark leg bars.
- **The seamless loop.** The frog lands in the opening's spot, and the camera ends on frame 0's framing. The opening's
  living motion runs on the loop clock across the seam, and the heartbeat period puts a beat on frame 0.

## Unresolved production issues

1. **The audio has not been listened to in real time.** This environment has no audio playback. It was checked by
   ASR, loudness, true peak and band levels.
2. **No Runway.** The same as V1: Runway outputs cannot be downloaded into this environment, so the film is native
   vector.
3. **The benchmarks** (Cyborg Cockroach V5, Dead Spider V6) are not in this repository. The work was matched against
   the most recent Shorts here.
4. **The leap toward the camera** is a 2.5D depth move: the side-view frog grows as it comes forward and to the right.
   It is not a turn to face the camera; the rig has no frontal view.
5. **The heartbeat (135 bpm)** is faster than a cold wood frog's, so the opening shows several beats before it stops.
6. **The science compression** noted in V1 still applies. In a real frog the heart keeps beating long enough to spread
   the glucose before it stops. The film follows the narration's order and never shows the heart beating while frozen.
   The ice spear is a visual stand-in for the mechanical and dehydration stress that freezing puts on cells.
