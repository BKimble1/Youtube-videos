# QA report — Earth Stops E-A opening prototype (75 frames, 2.50 s, 1080×1920, 30 fps)

Read this first: **nobody has watched this clip play, and nobody has listened to it.** I (the production model) inspected frames, measured pixels and audio, and used AI subagents as "muted viewers" on still frames. That is a proxy, not an audience test.

## 1. Verdict
- **Earthquake or extraordinary sideways motion?** In every read it came across as a violent, sustained sideways jolt, never as an earthquake. None of the 8 sheet reviewers said earthquake or shaking; all 8 called it far beyond a slip; 4 of 8 (D, F, G, H) named the intended physics without being told anything about the concept ("the ground suddenly gripping or stopping under her feet while she and her coffee keep going"), and a fifth (C) noted the coffee keeps moving while her feet are held back. Measured, nothing oscillates (§3).
- **What is *not* settled:** (a) direction in the very first still frame (see §4), (b) the cause is never shown by the picture (by design; narration's job), (c) energy plateaus after ~1.0–1.5 s, (d) whether the sideways read survives real-time playback and a real Shorts UI. Those need the owner's eyes and ears.
- **Revise E-A, or compare E-C?** E-A was revised (§6). **E-C was not built.** The earthquake ambiguity that would have triggered it did not appear. What did appear (cause not visible) is what E-C's globe would answer, but it is also exactly what the first spoken line is for. Decision rule in `PRODUCTION_STATE.md`.

## 2. What was and was not inspected
Inspected: the approved cast sheets (`handoff/approved_cast/*.png` on the Atlas tip), the rig source, every iteration's key frames, **all 75 frames of the encoded silent MP4** (extracted with ffmpeg), the audio stems and the muxed AAC. Measured with scripts (`tools/qa_opening.py`, `tools/qa_audio_opening.py`, `tools/probe_choreo.mjs`).
**Not done:** real-time playback, listening (speakers, headphones, mono), any human viewer, the live Shorts UI overlay, analytics, E-C, narration/music/Runway (not authorised), any ElevenLabs/Runway generation (none run; zero credits spent).

## 3. Measured (encoded video)
| Check | Result |
|---|---|
| Spec | H.264, 1080×1920, 30 fps, 75 frames, 2.500 s, yuv420p, bt709; silent file has no audio stream; SFX file's video stream is byte-identical (stream copy) |
| Fixed ground reference | frames 0–5: mean abs pixel diff to next frame 0.000–0.004 (background pixel-static); camera starts at frame 6, ramps to hero speed over 5 frames |
| Camera speed vs choreography | measured from the picture's lane dashes: max error 0.6 px/frame, median 0.3 |
| Render matches choreography | head pixels where the choreography puts the head: 75/75 frames; mug (coral/coffee): 75/75 |
| Earthquake signature | hero horizontal-velocity sign changes 0; camera velocity sign changes 0; camera never moves left; no frame-to-frame oscillation |
| Speeds | hips 22 px/frame (660 px/s) in the ground frame through frame 30, 16 px/frame at the cut; street passes the lens at ≈780 px/s after frame 10 |
| Frame extents (probe, all frames) | leftmost 30 px, rightmost 964 px of 1080; mug right edge up to 964 px, i.e. at the edge of the right-hand Shorts button rail (~x 940+) |
| **Structural fact** | the hero's *on-screen* horizontal travel is only 217 px; after frame ~10 she is locked near x 500 and the "sideways" evidence is the streaming street, pan-blur, dust and marks left behind. Ratio of vertical to horizontal hip motion over the first 30 frames: 0.9 |

## 4. AI-viewer reads (frames only; 29 reviews)
Details: `qa/read_test/RESULTS.md` (8 sheet reads, 4 rounds) and `qa/dir_test/RESULTS.md` (21 single-frame reads).
- **Direction at frame 0 (still image, correct = RIGHT):** across the tests, wrong or hesitant reads were common (afterimage ON: 2/9 correct; tag at a side: 2/6). **Best measured configurations: no tag 3/3, centred tag 3/3** (arm back-and-up, afterimage off). After seeing the sheet, 5 of 8 reviewers called the direction clear and 7 of 8 concluded rightward travel, but **three still reported doubt (A and B in round 1; F in round 3: "I had to rely on the palm tree")**, and A never settled on a direction. n = 3 per cell, AI reviewers: a pattern, not a statistic. Moving from stills to motion (frames 0–6 are a static camera with the hero moving 25 px/frame to the right) probably helps, but this was **not tested**.
- **Cause:** not visible, as designed. Reviewers: "no cause", "invisible shove", "like the world rushing past her", and four who said ground/feet stopping while everything else carried on.
- **Identification at phone size (rounds 3–4):** mug, coffee jet, dust: clear; scarf: clear in motion, ambiguous in a lone first frame; splats on the pavement: read as coffee; **skid marks: not identified** (read as speed lines or missed).
- **Pacing:** consistently "peaks around 0.2–1.0 s, then plateaus". The coffee drama is over by ~0.7 s.

## 5. Audio (measured, never auditioned)
`qa/AUDIO_MEASUREMENTS.json`, `qa/sheets/EA_sfx_spectrogram.png`, event log `audio/OPENING_SFX_LOG.csv`.
- 2.5000 s (matches the video); stereo with identical channels (mono-safe by construction); integrated −18.2 LUFS, true peak −1.7 dBFS (WAV) / −2.6 dBFS (after AAC); 19 placed events.
- First non-silent sample at 0.0001 s with a 1 ms fade-in (no DC step). **First 50 ms is bass-weighted: 57% of its energy under 200 Hz, 39% above 1 kHz, centroid 1.6 kHz.** It is not sub-bass alone, but a phone speaker will drop most of the low part; the thud carries a mid knock for that reason. Unverified by ear.
- Landing thump +15.6 dB over the preceding 30 ms; launch snap +5.9 dB; **ceramic tick only +2.2 dB in its band** because the 25 ms before it is the stop hit itself, though it is the highest-peak event in the mix (0.794) after ducking the friction layer by 15 dB around it.
- The Foley is **stylised synthesis**. Whether it sounds convincing or synthetic is unknown until someone listens.

## 6. Decisions, with the evidence behind each
| Decision | Evidence |
|---|---|
| Bicycle **rejected** | The camera must ride with the hero to keep her legible, so any loose object sharing her ground-frame speed (the only physically right choice) sits motionless on screen and reads as parked while the road dashes stream past; it also had low contrast against the road and took space from the hero, mug and dust. `qa/bike/` |
| Afterimage (ghost trail) **rejected** | Frame-0 direction reads fell from 3/3 to 2/9 with it on |
| WHAT IF tag **centred** | 6/6 symmetric vs 2/6 side-anchored direction reads; it is one compact tag, not a title card |
| Left arm **back-and-up** | Braced-forward and trailing-low alternatives scored 0/3 each (with afterimage on, so partly confounded) |
| Trim 3.0 s → **2.5 s** | Reviewers saw a plateau after ~1.0–1.5 s; last 0.5 s added nothing |
| Hero scale / zoom 1.16 | Hero was "small"; true bounding boxes showed side margin to spare (30–964 px) |
| Street palette, no coral | Scarf blended into coral awnings, teal mug into teal doors; mug now coral, scarf coral, street neutral |
| Coffee: beaded, dark, glossy, splash crowns | "stick/rope/worm" reads in early rounds; later rounds identified coffee |
| Pan-blur on the street | "background speed only moderate… fast jog"; later reviewers noticed the blur and called the speed vehicle-like |

## 7. Known weaknesses (ranked)
1. **Frame-0 direction** may still mislead some viewers on a lone still (feet-trailing-left reads like a slip-back).
2. **Cause not shown**; depends on the first spoken line and the tag.
3. **On-screen travel is small**; the sideways read leans on the street streaming past and the marks left behind. A pure "she is being tracked" reading cannot be excluded without playback.
4. **Plateau after ~1.0–1.5 s**; nothing new happens.
5. **Rig is serviceable, not premium**: front-facing only, rigid straight legs, no knees, one cloth item (the scarf), squash only at the landing. A side or three-quarter view and a bent-knee skid would be the largest quality step and would also help direction.
6. Skid marks unreadable at phone size; the coffee bead chain can look like a rope at some moments.
7. Mug sits at the right-rail edge (x up to 964) for most of the clip; checked only against an approximate rail position.
8. Audio unauditioned (see §5).

## 8. Analytics and runtimes
Unchanged and conditional on the owner's confirmation of the uploaded files. This work used none of the analytics. Local runtimes seen: Atlas V4 retimed 31.872 s / original-pace 34.603 s; murder-tip v3.1 cleanup and v3-final both 21.013 s (identical runtime, so runtime alone cannot tell them apart); Atlas `PRODUCTION_STATE.md` says V4 was not uploaded.
