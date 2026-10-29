# Sea Slug Regeneration V5: report

## Deliverables

All three are rendered natively from the editable source at 1080×1920, 30 fps. They use H.264 yuv420p (bt709, CRF 16, GOP 15) with stereo AAC 320 kb/s. Not published.

| File | What |
| --- | --- |
| `exports/FGW_SeaSlug_Regeneration_V5_HOOK_REVIEW_1080x1920.mp4` | First 5 s (150 frames) |
| `exports/FGW_SeaSlug_Regeneration_V5_PAYOFF_REVIEW_1080x1920.mp4` | The four physical events, each with its own audio: probe/contact 4.3–7.3 s, new heart 19.2–21.3 s, regrowth 21.3–25.0 s, second separation 25.0–28.67 s, then 1.0 s of the opening (the loop) |
| `exports/FGW_SeaSlug_Regeneration_V5_REVIEW_1080x1920.mp4` | Full film: 28.667 s, 860 frames |

- **Source:**
  - `source/src/v5/`: `shots5.ts` (the timeline), `Micro5.tsx` and `Film5.tsx`. The Remotion composition is `SeaSlugV5`, with the `Sheet5` contact-sheet still.
  - The rig style is `'v5'` in `source/src/v2/slug/`.
- **Frames:** rendered with `tools/render_v2.tsx … v5` (the same React picture, rasterised by Playwright).
- **Sound:** `tools/make_audio.py V5` produces `audio/mix_v5/`. The cue list is `audio/cues_v5.json` and `audio/sfx_cues_v5.json`.
- **QA evidence:** `qa/v5/`.

## Narration

- **Recording:** the approved ElevenLabs recording, unchanged and gain-only. It sits at 0.0 ms offset in the file, with correlation 0.98 through AAC.
- **Loudness:** −14.1 LUFS.
- **Timing and captions:** every event is placed from the Scribe word timestamps. The caption words and timing are identical to V2–V4.

## What was replaced from V4

| V4 | V5 |
| --- | --- |
| Opened on a top-down neck separation (body and head splitting) | **Opens on the result.** Frame 0: the detached head is already gliding in the foreground, with its long headless body lying behind it and a clear gap between them. How it happened is shown later, in the anatomy scene. |
| Grey-green dish everywhere | **Three different worlds.** (A) A bright lab: warm pale floor and a dark teal wall behind. (B) A deep-teal anatomy grade for the cutaway. (C) A more vivid blue-green seabed. |
| Flat, leaf-like animal | **V5 design.** The parapodia are raised like wings and rolled in over the back, with the species' black rim and orange inner band along the margin. The head and body are thicker, the green is richer and more saturated, and the rhinophores are shorter with orange-yellow tips. |
| Microscope view of green circles | **A section through the digestive gland.** Branching tubules walled with chloroplast-filled cells around a pale lumen. One parasite works along inside a tubule and one pushes through the tissue between them; they are ghosted, with a HYPOTHESIS tag and a 0.1 mm scale. |
| The ending stopped on a thinning thread, and the parting happened after the loop | **The second separation completes on screen** (below). |

## First seconds, as rendered (checked from the MP4 at 0.1 s steps)

- **0.0 s:** a low macro. The head is in the foreground and moving, the large headless body is behind it, and the gap is plain. A TIME-LAPSE tag is shown.
- **0.5 s:** a close side view as the head passes the lens. This is the first change of perspective.
- **0.9–1.3 s:** behind the head as it passes an algae-covered rock.
- **1.4–2.0 s:** a wide view down the line from the head to the body. The small head sits at the bottom and the much larger body above it.
- **2.0–2.7 s:** a close, low tracking shot as it steers around a pebble, lifting its front.
- **2.7–4.3 s:** the head leaves the foreground and the abandoned body becomes the subject.
- **From 4.3 s ("And its headless BODY?"):** the probe enters. Nothing about the probe appears before that line.

## Physical events verified on the MP4 (`qa/v5/gate2_*.png`)

1. **Probe:** touch at 5.03 s. The parapodium under the probe curls on the same frames, and the body heaves on "MOVING". It never crawls.
2. **Heart left behind (7.4–12.5 s):**
   - REWIND, then the dark cutaway.
   - The TIME-LAPSE pull, and the neck parts on "breaks".
   - The heart beats on in the body in the foreground while the head leaves up the frame.
3. **Feeding (16.3–18.7 s):**
   - The snout presses onto an algae stalk.
   - Green contents stream down the stalk into it while the frond clears from its tips.
   - The buccal mass pumps behind clear skin, and the head moves on.
4. **New heart:**
   - It condenses from a cell cluster at about 19.3 s.
   - It contracts on "BEATING" (20.43 s) and again at 20.97 s, each with a heartbeat sound.
   - The camera moves straight on into the regrowth.
5. **Regrowth:**
   - A continuous time-lapse from DAY 7 to DAY 21: a bud with the heart showing, a long pale body with parapodia rising as ridges, then a green spotted animal with folded parapodia.
   - Three camera views change during it.
   - The finished animal crawls on.
6. **Second separation (25.0 s to end), checked at 26.0, 26.5, 27.0, 27.5, 28.0 and 28.5 s:**
   - 25.0–26.3 s: the whole regrown animal gliding.
   - From 26.3 s: WEEKS LATER, and the neck narrows.
   - 27.0 s: the neck drawn out.
   - 27.5 s: a thin thread.
   - **27.8 s: the head and body are disconnected** (two separate rig pieces, with the wounds sealing).
   - 28.0–28.63 s: the head glides away on its own and the body stays behind.
   - The sound is a soft stretch from 26.7 s, then the separation accent.
   - **The second separation genuinely completes.**

## Loop

- **How it's built:** from the parting at frame 834, the ending is the same separation model and the same camera as the opening. The last frame is therefore the frame before frame 0.
- **Picture:** the seam change is 1.6× the median frame change, and the only visible difference is the caption ("TWICE." → "If this sea slug").
- **Audio:** the seam is continuous.
- **On replay:** the opening continues the same motion, so **the loop works.**

## Technical QA (full MP4)

- **Frames:** 860 at 1080×1920.
- **Cuts:** one-frame changes only at the two intended matched cuts (16.3 s lab → sea on the head; 25.0 s sea → lab on the regrown animal).
- **Fixes:** two scene-hand-over pops (7.4 s, 21.4 s) were found on the first V5 encode and fixed.
- **Holds:** no static hold longer than 1 s.

## Distinct setups (about 16)

1. Opening low macro.
2. Side pass.
3. Rock follow.
4. Wide size comparison.
5. Pebble track.
6. Body reveal.
7. Probe close-up.
8. Overhead reaction.
9. Dark rewind and cutaway.
10. Separation in section.
11. Gland section with parasites.
12. Seabed approach.
13. Feeding profile.
14. New-heart close-up.
15. Regrowth views (three).
16. Lab return and second separation.

## Comparison with Cockroach V5 and Dead Spider V6, and what is still short

- **Better than V4:**
  - The opening now shows the extraordinary result at once and is readable muted.
  - Perspective changes every 0.4–0.6 s, each driven by the head's movement.
  - The ending delivers a real repeat of the event.
- **Not at the benchmark level:**
  - The spider's needle and leg opening is a single bold mechanical action against a dark ground. The sea slug's events are slower soft-tissue ones, and the head is still a fairly small subject in some views (1.4–2.0 s).
  - The benchmarks use cleaner flat cel shading. Our faceted 3D shading still shows steps on the parapodia and the new-heart close-up.
  - The heart is clearer than V4 but still reads as rounded shapes in a sac rather than a richly detailed organ.
- **Not used:** Runway. Its file host (`dnznrvs05pmza.cloudfront.net`) is still blocked by this environment's network policy (the proxy refuses it). The organic motion is the Remotion rig's pedal waves and deformation.
- **Not done:** nobody has watched it at real speed with sound. There is no audio or video output here, so pacing was judged from 0.1 s frame strips, motion measurement and the audio meters.

**Gate verdict:**
- The **ending** and **physical payoffs** gates pass on the rendered file.
- The **opening** passes on readability and progression. I don't judge it equal to the spider's spectacle.
- If the next review finds it still below the benchmarks, the limit is the rig's rendering finish and this subject's slow soft-tissue action, not the timing. The way forward would be a redesigned illustrated master (flat cel-shaded artwork with hand-drawn deformation keys) rather than another revision of this rig.
