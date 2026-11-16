# V2 review report (work in progress)

16 Nov 2026. Not approved, not published. Nobody has watched it in real time. All checks are frame and measurement
checks.

## Scope of this pass
Your V2 brief arrived cut off partway through section 7, so this pass covers what was received:
- **0:00–1:12.5 (sections 3–6): rebuilt.** New scenes in `source/src/v2/` (A2, B2, C2, D2).
- **1:12.5–end:** kept from V1, with the section-2 cleanup applied:
  - The circular magnifier became an edge-on cutaway.
  - The circular road inset became a full-frame rectangle.
  - The contact rings and check marks are removed.
  - The Paris 4 stand-in Greek letters became abstract strokes, with no rings, ticks or crosshairs.

  The fuller redesign of 1:14 onward (flattening, invisible ink, validation, ending) waits for the rest of your
  brief.
- **Unchanged:** the narration (recording, words and timing), the captions and the SRT.

## Measurements (`qa/v2/review_qa.json`)
| Check | Result |
|---|---|
| Runtime | 172.633 s (2:52.63, 5,179 frames at 30 fps) |
| Loudness | -14.0 LUFS integrated, -1.0 dBTP true peak (V2 mix: effects re-cued to the new picture) |
| Audio vs narration master | Best lag 0 ms |
| Black frames | None |
| Holds of 1.0 s or longer | Six, each 1.07–1.27 s (62.4, 83.3, 97.9, 113.3, 138.3, 145.9 s). None reaches 1.5 s. |
| Captions | 46 cues, unchanged; every cue starts on a measured word onset |
| Frame-step bursts | `qa/v2/bursts/` (22 transitions). One-frame fill switches (5.1 s, 38.7 s), a layer-colour dip (40.5 s), a detail swap at the end-on turn (18.35 s) and a corner pop at the smoke clearing (15.2 s) were found and fixed before this render. |
| Muted phone-size opening | `qa/v2/first8s_muted_phone_390px.png` |

## Beats (about 82 across the runtime; 53 in the rebuilt 0:00–1:12.5)
**A2 (0–7.6 s):**
1. Extreme close-up; the spatula enters.
2. The outer layer lifts.
3. Cracks run.
4. The layer breaks and crumbles.
5. A scan line sweeps the frame: physical to digital.
6. Pull back to the digital roll.
7. Push into the end face; the outer layers dissolve.
8. The traced stretch lifts out of the spiral.
9. It opens on column 19's real Greek.
10. Everything reverses into the roll.
11. The scan line sweeps back to the physical lump on its cradle.

**B2 (7.6–26.6 s):**
12. Raking light across the lump.
13. Match cut: the same roll, fresh, on a villa shelf.
14. Pull back to the window.
15. Vesuvius erupts.
16. Ash falls and settles on the rolls.
17. The surge cloud sweeps across the frame.
18. The smoke clears to the black roll, buried in ash layers.
19. The layers are dug away.
20. A knife lifts the outer layer.
21. It cracks and breaks.
22. The roll turns end-on (4.9 cm).
23. Second attempt.
24. Third attempt (2.0 cm).
25. Push into the core as hidden writing glints.

**C2 (26.6–39.0 s):**
26. Cut to the beamline; dolly in.
27. A crew member starts the scan.
28. Beam pulses pass through the roll.
29. The roll turns translucent as it rotates.
30. Slices fly in and stack into a volume.
31. The lab gives way to scan space.
32. The volume orbits.
33. A slice plane passes through.
34. The stack parts.
35. The camera drops onto one slice until it fills the frame.

**D2 (39.0–72.5 s):**
36. The cross-section turns.
37. Dive between two layers.
38. Travel the gap as the layers stream past.
39. Pull out while a pulse runs the whole sheet.
40. Tilt into a 3-D coil: the sheet is one surface.
41. Tilt back.
42. The camera follows a trace around one layer.
43. Push to the contact; the neighbouring layer presses in.
44. The wrong trace switches lanes.
45. Pull out on the skipped turn.
46. The skipped turn peels out as a strip of real PHerc. 1667 text.
47. The two pieces on either side of the jump peel out.
48. They slide together at a seam.
49. Everything rewinds.
50. The correct route at the contact.
51. Hop to contact 2 (a rejected neighbour flicks and snaps back).
52. Contact 3.
53. Pull back to the full traced sheet, which hands off to the flatten.

**F2–H (kept from V1, cleaned):**
- 54–65: uncoiling flatten, page opens, almost blank, push in, cutaway grows, scan bar, patch hops, letter scale,
  road full frame, pebble window, smudge, tile sweep reveal.
- 66–71: cut to Paris 4, panel A, panel B cross-section, B flattens, slide into register, registration flash.
- 72–82: cut back to column 19, pull out to the strip, column count, gaps, zoom to column 19, highlight, translation,
  pen, callback, re-roll, the roll alone.

## Text on screen (section 2)
- **Kept:**
  - Captions.
  - The specimen chips "PHerc. 1667" and "PHerc. Paris 4".
  - A small "Reconstruction" marker.
  - The sourced width labels (4.9 and 2.0 cm).
  - The scale label "≈ 1.4 m · 4½ ft".
  - The column-19 translation card.
  - The source line for the Paris 4 reconstruction.
- **Greek on screen:** only the preprint's transcription of PHerc. 1667, on the 1667 sheet. Lacunae are shown as
  gaps, never as invented letters.
- **Paris 4:** no letters (we have no verified transcription of that region); the marks are abstract brush strokes.

## Open questions and limits
- The Paris 4 strokes are abstract, but they could still read as "symbols". I can make them pure texture, or use
  licensed figure crops if the CC BY-NC 4.0 terms suit the release.
- The quote highlight (a yellow band behind column 19, lines 11–12) and the coral outlines of the gaps in H are kept.
  Say if those count as the "boxes" to remove.
- 1:14–end still has V1 pacing apart from the cleanup. It's waiting for the rest of your brief.
