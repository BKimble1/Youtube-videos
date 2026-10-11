# Future Got Weird — Atlas No Pinky: V2 reassessment and final V3 pass (owner handoff, saved verbatim for reproducibility)

Prepared October 10, 2026. Reviewed baseline: `FGW_Atlas_No_Pinky_V2_1080x1920.mp4`, 34.600 s of picture, 1080×1920, 30 fps, 11,688,246 bytes. SHA-256: `d09bf1dd03d20c36636872932f6d14ead43491b8b72e082d28e3628b0e804ffd` (the file archived as `v2/FGW_Atlas_No_Pinky_V2_1080x1920.mp4` matches).

Repository reference: BKimble1/Youtube-videos, branch `claude/pensive-mendel-3j0xsc`, episode directory `Future_Got_Weird/Shorts/atlas-no-pinky/`. V2 implementation is in `source/src/v2/`; the old `source/src/Film.tsx` is the preserved V1 implementation.

## Assessment

V2 is a meaningful improvement (genuine viewpoint changes, permanent V1 stage gone, matching replay boundary in the picture). Keep this structure. The last revision should repair visible defects and improve recognition, contact, and reading time. A new script, cast, generated asset batch, or broad rebuild is not justified.

Highest-priority problem: the TURN illustration — the cube visibly rotates above the fingertips with clear gaps instead of reading as held. The opening grip also makes the missing pinky harder to recognize than the headline suggests.

The assessment describes observed picture defects and editorial judgments; it does not predict retention, distribution or view counts.

## Review scope and limits (as stated by the owner)

Inspected sampled frames across the clean V2 MP4, dense opening samples, exact opening/closing samples and bursts around scene changes, plus 360×640 contact sequences for the tape wrap, rotating cube and obstructed titles. The captioned MP4 was not supplied; caption findings come from its source and cue table. No normal-speed audiovisual pass was available: narrator tone, pronunciation, effect quality, music feel, subjective timing and phone playback remain open.

Measured on the V2 file: about −14.78 LUFS integrated, −1.44 dBTP true peak, 2.40 LU loudness range.

## Remaining defects, prioritized

| Priority / interval | Observed concern | Final change | Acceptance |
| --- | --- | --- | --- |
| P0 · 18.15–18.75 s | The cube rotates above the hand with visible contact gaps | Reposition wrist/object and solve reachable fingertip contact before rotation | Rendered pads touch the object throughout the held rotation |
| P0 · 0–2.8 s | Side/profile grip stacks fingers and crops most of the palm on the right; ghost pinky is hard to interpret | Recompose with a recognizable thumb + three-finger silhouette, preferably the existing front-view rig; retain useful action | At phone scale, the hand and absent pinky are understandable within the first second |
| P1 · 12–16 s and 18–19 s | Attribution pills overlay the palm, thumb, or cuff | Move action and concise attribution into separate lanes; remove internal taxonomy from public visuals | No label covers a joint, pad, grip, or object contact |
| P1 · 17.6–17.9 s | PINCH touches/intersects the descending forearm | Move title or arm, maintaining readable scale | Clear separation between every letter and the arm |
| P1 · ~18.03–18.23 s | Dark PINCH remains on the dark incoming turn scene; TURN arrives late | Give labels to their owning shot and close the outgoing label before the scene handoff | No low-contrast or wrong-shot headline during the transition |
| P1 · ~18.97–19.13 s | TURN carries into the drill shot before PRESS | Couple headline handoff to the incoming shot | PRESS accompanies the drill scene; TURN exits with its own scene |
| P1 · ~27.7–29.1 s | BUILT TO WORK intersects the arm/palm | Reserve a clear title region or move the hand | No text merged with mechanical silhouettes |
| P1 · 10.1–16.3 s and turn shot | Dark grid staging drifts from the channel's light identity | Light cream/cool paper mechanism stage with restrained blue guides and ink text | Clear hand contrast; no dense dark technical grid |
| P2 · 20.3–26.4 s | Additional hardware readable, but much of the shot waits on incremental labels | Stronger spatial relationship between the three modules and the optional digit; one changing consequence at a time | Viewer follows hardware → size/service burden without reading a second explanation |
| P2 · 31.3–33.9 s | Eight receipt lines compete with narration and the small guide | A few large items plus the stamp; remove the tiny guide | Gag readable in one glance at 360×640 |
| P2 · replay audio | Last 100 ms effectively silent; next opening immediately contains speech | Make the music boundary continuous if a pause/reset is audible; closing sentence stays complete | No perceived stop before replay |

## Technical notes from the owner

- **Rotating object contact.** `ShotB` drew the die at a fixed world position and requested a pinch; the solver can clamp unreachable targets. Place the wrist where both digits can reach the cube's actual edges; derive object and contact geometry from shared coordinates and verify the rendered result through the entire motion. Repair locally first; do not change the global solver to hide an unreachable configuration.
- **Headline ownership.** `B05Hud` was drawn above the capability shots with event-based timing different from the scene-change timing, so black PINCH persisted on the dark turn scene and TURN stayed over the drill. Use a shared shot-phase value or render each headline inside its owning shot; the exit must finish by the incoming shot's handoff. Incoming source labels must not appear before the tape wipe has revealed the experiment.
- **Captions and emphasis.** Keep the stable 64 px two-line lane. Some grouped cues showed later phrases before they were spoken (no pinky / On purpose from ~1.04 s; The verdict? / Leave it out from 8.32 s). Split cues or activate emphasis from aligned word timing; allow short two-word emphasis cues. The last caption ended near 33.934 s while the loop tear started at 33.88 s: resolve deliberately. The first caption appeared at about one-third opacity at frame zero but was absent at the last frame: reconcile without pre-displaying the hook over the joke.
- **Audio boundary.** Mono decode of the V2 file: last 100 ms ≈ −63.0 dBFS RMS, first 100 ms ≈ −22.1 dBFS; last 300 ms ≈ −31.4, first 300 ms ≈ −18.3. A loop-compatible music phrase can run across the seam at low level instead of fading fully to silence; preserve speech and avoid a competing effect on the first syllable.

## Prompt pasted into the production session (condensed to its operative requirements; full wording in the owner's message)

Complete one final V3 polish pass on the V2 Atlas No Pinky Short. Keep the 34.6-second story, existing narration, approved cast/rigs and V2 scene structure. This is a focused repair and art-direction pass, not another general rebuild. Produce final clean and captioned exports and a concise defect/recheck report. Do not upload, publish, or schedule anything.

1. **Ground the baseline.** Read repository instructions and git status; confirm the baseline against the supplied V2 filename and this audit; preserve V1/V2 deliveries; edit the actual V2 implementation, its cue table and the V2 audio builder; inspect `Root.tsx` so the exports use the revised scene.
2. **Fix the TURN grip first** (reachable wrist/object geometry, grip visibly established before rotation, arrow stays on the cube; inspect rendered frames; add one small meaningful per-frame contact check if practical; recheck washer pinch, drill trigger and workstation block grips if a shared helper changes).
3. **Make the first-second silhouette understandable** (existing front-view rig preferred; four digits distinct within 0.5–0.8 s; missing-position cue points into empty space; `NO PINKY?` from frame zero, `ON PURPOSE.` on its spoken emphasis, early Atlas/Boston Dynamics identification; essential silhouette inside the central region; no extra real fifth finger or five-finger previous Atlas; update the closing pre-roll from the same opener function).
4. **Clean up text, attribution and style** (separate regions for headline, action, concise attribution, captions; no label over a thumb, joint, cuff, pad, held object or trigger; concise public labels, taxonomy to documentation; separate PINCH and BUILT TO WORK from forearms; light cream/cool-paper mechanism and rotating-object stages with ink text; keep strong yellow opener and teal workstation; plain dark receipt backdrop without grid; keep the original illustrated identity).
5. **Make transitions and reveals belong to their scenes** (PINCH exits with the washer, TURN accompanies the cube, PRESS accompanies the drill; no empty-backdrop intervals; keep the narrated four digits / 13 total / representative motions; exactly three modules; no invented price or failure data).
6. **Finish the joke, captions and replay seam** (receipt reduced to a few large items plus `NOT IN BUDGET`, tiny guide removed; stable phrase captions timed to the alignment, split short phrases, emphasis from aligned word timing; end the outgoing caption before the tear; reconcile the first-caption fade; loop-compatible low music instead of a full fade to zero; complete budget sentence; no clipped consonants or effect over the opening word).

Audio and budget: reuse the narration unchanged; do not globally accelerate it; do not increase the 29 effect events by default; keep sensible headroom; numerical targets are not a substitute for listening. No Runway generation or new artwork batch.

Acceptance and delivery: render V3 clean and captioned 1080×1920, 30 fps H.264/AAC MP4s, aligned SRT, cover from the improved opener, updated editable source/QA/production state; keep V2 available; include the final prompt/defect log. Inspect: first second; taped fingers; stamp/verdict; representative movement controls; washer grip; full rotating-cube grip; drill contact; all three capability headline handoffs; added hardware; BUILT TO WORK; human reference; simplified receipt; final tear; last-to-first transition; neighbors of every modified boundary. Use 1080×1920 and true 360×640 inspection plus the current interface overlay when available. Run the repository checks appropriate to the edits, decode the final exports, verify captions against final audio, measure the final mix, keep a concise issue/recheck log. Keep evidence categories honest (source/frame inspection, numerical measurement, automated checks, actual audiovisual playback); do not mark a human watch/listen complete unless it occurred; if playback is unavailable leave the review list: full phone listen, muted captioned phone playback, two repeats, current Shorts UI check. Return exact delivery filenames, repaired defects, what was inspected and the remaining playback status. Do not publish or predict viral success; do not propose another broad rebuild.
