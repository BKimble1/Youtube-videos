# This Time Machine Actually Works: V2 review report

**File.** `exports/FGW_TimeMachine_V2_REVIEW_1080x1920.mp4`: a genuine 1080×1920 export (H.264 CRF 16, yuv420p,
BT.709, AAC 320 kb/s, 30 fps, 706 frames, 23.533 s). **Status: V2 for review. It is not final and not publish-ready.**
Measured facts: `qa/v2/render_qa.json`, `qa/v2/final_asr.json`, `audio/mix/mix_measure_mix_v2.json`; contact sheets in
`qa/v2/`. The storyboard, anchors and module contracts are in `production/V2_PLAN.md`.

> About the 512×910 file: the V1 export on disk (`exports/FGW_TimeMachine_V1_REVIEW_1080x1920.mp4`) measures
> 1080×1920 (ffprobe). The 512×910 file was most likely a preview transcode made by whatever displayed or relayed it, not the export.
> V2 is delivered as a download attachment so it arrives untouched; its dimensions are re-measured below.

## Source kept from V1

- The approved narration, word for word, and the existing voice recording
  (`audio/narration/FGW_TimeMachine_narration_V1.wav`, 23.533 s). Independent transcripts of the final mix:
  Whisper base.en matches the locked text word for word (WER 0.000); zipformer differs only in the spelling "travelled" (`qa/v2/final_asr.json`).
- The Weird Crew rigs, the ray-traced Schwarzschild black hole, the caption treatment and the deterministic
  Remotion/SVG pipeline.

## What V2 changes

| Section | V1 | V2 |
|---|---|---|
| 0–1.1 s hook | A wide street shot; the friend ages at the frame edge | A close two-shot of faces and hands. The friend ages young → elderly in 0.72 s while holding the astronaut's glove: one continuous age value, hair recedes by shape, glasses in one frame, the green cardigan grows over the green tee. The astronaut never changes. The street matures behind them |
| 1.1–2.7 s | Push into the visor | He looks down at the aged hand on his glove, then up; the camera follows his head; the black hole's reflection is clipped to the visor glass and lands in the exact position, scale and angle of the real hole at a hard cut on "hole" |
| 2.7–4.7 s | Ship crosses on an inclined orbit | The capsule flies one visible elliptical arc over the hole (left → over the top → down the right), inside the frame, its trail drawing the curve; one banking turn toward camera; the camera flies through its window into the cockpit and lands on the cockpit framing with no recoil |
| 4.7–8.2 s | Watch with an Earth sub-dial | A physical watch only. Glance → the hour compresses (minute hand exactly one turn 10:00 → 11:00 landing on "hour.", hour hand 30°, seconds smeared) → the wrist lowers: his unchanged face and the hole through the porthole → the wrist rises to an upright dial |
| "But back on Earth" | Earth from space | Match cut, dial to dial, from his watch to the wall clock at home (both 11:00, same screen position and size); the clock races from the cut while a window-shaped sun patch sweeps the wall; the camera moves to the window and pushes through one pane |
| 8.2–11.2 s years | Locked-off street | The view OUT of the house (new reverse angle): the young friend on the lawn waving at the sky, the fence and rose arbour from inside, the street, the houses across. A tree trunk crosses the lens and carries the cut to the street side of the same yard and house: middle-aged (summer turning to autumn, leaves falling), then the leaf mass covers the frame and he is elderly, waiting at the open gate, towers across the city. Seasons change only under cover |
| 11.2–13.3 s return | Capsule lands, he steps out | A shadow band sweeps over the old friend, who leans back to look up; the capsule descends with a growing contact shadow, lands with a dust puff; he appears in the open hatch, steps down onto the road in front of it, looks up at the house, then finds his friend |
| 13.3–14.6 s reunion | — | The opening's exact composition: the elderly friend reaches for the glove (hands travel on IK paths into the clasp), the astronaut's eyes search → recognise → drop to the joined hands; the friend's restrained smile; the hands release before the gesture |
| 14.6–15.6 s | Run to the door | The friend gestures to the door; he walks up the path, pushes the door (it swings in) and the doorframe passes the lens into the room, position, scale and direction matched |
| 15.6–18 s family room | Photographs through the decades | A quiet room: an empty dusty armchair, the pre-departure family photo, his glove wipes a clean streak through the dust (puff, specks), his father's portrait with a black ribbon (the father is clearly a different man: side part, moustache). He turns to the photo in grief; the camera passes his shoulder |
| 18–20.7 s | Floating clocks and a diagram | No graphics: his unchanged face reflected in the photo's glass beside his family and his younger self (his own colours, translucent, larger than the printed faces, a reflected window pane with the changed skyline behind). Grief → blink → he looks at his younger self → brows relax, mouth flat (understanding, no smile) |
| 20.7–23.53 s | Visor push and pull-back loop | His watch beside the old photo (one hour on his wrist, a lifetime in the frame); the pan settles on the ribboned portrait; the camera glides into the pre-departure print of the astronaut and the young friend — the opening's pose and street — until it fills the frame and equals frame 0 |

## Review process

Two rounds of independent multi-lens review on the rendered files (opening and identity, flight and the
hour-vs-years comparison, geography and physicality, ending and loop, whole-film craft), each finding re-checked by an
adversarial verifier at full resolution. Round 1 (on the first V2 render) raised 3 major issues, all confirmed by the verifiers: the capsule spun about 480° on an unwrapped angle, the astronaut emerged from behind the capsule instead of the hatch, and the room's window showed the very house he was standing in. It also raised about 30 moderate and minor issues, among them the clasp popping on single frames, season pops in view, the reflection reading as a green fifth person, captions over faces and the watch, a zoom recoil, an astronaut vanishing on a cut, and a whip pan. Round 2 (on the revised render) confirmed most fixes had landed and raised a second, smaller list: summer still turning to autumn in view, a camera bump at 11.2 s, a stalled wrist rise, a dust streak jumping to full length, a door push that did not read, and a dark "hood" around the reflection. Every round-2 item listed below as fixed was corrected and checked on rendered frames before this final render. The panel did not re-review the final render itself; it was checked by me frame by frame and by the measured QA below.

## Measured QA (final render)

| Check | Result |
|---|---|
| Container / video | H.264, **1080×1920**, 30 fps, yuv420p, BT.709, 706 frames, 23.533 s, 26.6 MB |
| Audio | AAC 48 kHz stereo, 317 kb/s; integrated −14.38 LUFS, true peak −1.6 dBTP, voice −14.33 LUFS in the mix, family-room effects −41.3 LUFS |
| Full decode | no errors |
| Large frame changes | one, the planned watch → wall-clock match cut at 8.2 s; no unplanned jumps |
| One-frame glitches (A-B-A detector) | none |
| Longest near-static run | 6 frames (0.2 s) |
| Loop seam | frame 705 matches frame 0 (mean difference 7.0/255, mostly the first caption appearing; no border remnant); audio seam jump 0.0005 |
| Narration | unchanged recording; ASR as above |

## Known limitations

- The clasp closes and opens with a 3-frame overlap of the arriving hands and the clasp drawing (the rig's mitts become the detailed clasp), not a hand-by-hand animation.
- His reflection is darker for about 0.2 s while it forms over the print's shade, before it lifts to his own colours.
- Captions brush the watch for 3–4 frames while the wrist lowers and rises (7.4–8.1 s); the first caption sits close to the clasped hands as the camera rises (1.5–2.0 s), shifted left to keep them clear.
- The walk to the door is brisk (the path in about 0.6 s, long strides), and the fence strobes slightly during that pan.
- The ending has one gentle pull-back (zoom 4.4 → 3.75) between the push onto the reflection and the push into the print.
- The young friend's wave is a raised mitt (the crew rig has no open-hand pose).
- The figures are front-view rigs; a back view is used only for the walk to the door.
