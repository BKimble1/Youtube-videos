# Runway job plan (Video 02)

**Budget rule (from the brief):** first batch capped at the smaller of 500 credits or half the available balance; at most
two paid attempts per selected shot; never buy credits, enable auto-refill or change plans. Balance before any Video 02
spend: **2,250** plan credits (8 October 2026), so the cap is **500**.

**Measured price:** the first job (R3, Kling 3.0 Pro, image-to-video with start and end frames, 5 s, 1080p, 16:9, no
audio) took the balance from 2,250 to 2,190: **60 credits per 5-second clip** (12 credits/s). Every later job is logged
with its own balance difference in `runway_log.json`.

**Method for every insert:** the start and end frames are rendered from the Remotion shot the insert replaces, with the
scene's screen-space labels hidden (`PLATE=1 node stills.mjs ...`), so a generated clip begins and ends on the rig and
cuts invisibly into the code-drawn film. Labels are drawn by the scene on top of the clip (`RunwayInsert`, in-scene),
so no text is ever baked into generated video. The ChatGPT plates A10/A11 are not used as inputs (see
`art/ART_USE.md`: hand-held sensor in act 1; sideways push; a room that does not match the code room). Prompts ask for
one clear action and a locked camera. Clips are downloaded at once, probed (resolution, fps, frames), inspected
(`tools/inspect_insert.py`: dense sheet, first/last frame vs plate, motion energy), and accepted only if they tell the
right visual story better than the Remotion version, with no face/hand drift, line or style changes, wall deformation,
prop intersections, sliding, flashing or composition change. A rejected clip keeps the Remotion shot (always the
fallback).

| Shot | Scene, frames | Action | Model | Max spend | Status |
|---|---|---|---|---|---|
| R3 | S8.1, 10209-10322 (3.8 s) | the delivery robot rolls toward the blind corner and slows | Kling 3.0 Pro, 5 s, 1080p, start+end | 2 × 60 | attempt 1 generating |
| R1 | S1.1, 0-92 (3.1 s) | the guesser tiptoes into his spot and settles smug, checker still | Kling 3.0 Pro, 5 s, 1080p, start+end | 2 × 60 | after the light-path fix lands (the shot changes: 2 m screen, set-scaled rigs) |
| R4 | S8.3 (scene S9), HANDS..RT | he pushes the screen back until its far end meets the wall | Kling 3.0 Pro, 5 s, 1080p, start+end | 2 × 60 | after the light-path fix lands (push restaged) |
| R2 (optional) | S4.2 | relaxed lean, then stiffening | Kling 3.0 Pro, 5 s | 2 × 60 | only if budget remains and the Remotion beat is weak |

Worst case for R1, R3, R4: 6 × 60 = 360 credits; with R2: 480 (inside the 500 cap).

**Resolution honesty:** if a clip is 1080p (or 720p) at 24 fps, it stays that source quality inside the 30 fps
composition (frames are shown nearest-frame, never optical-flow interpolated, which deforms line art), and in the
3840×2160 master it is an upscale, logged as such, never called native 4K.
