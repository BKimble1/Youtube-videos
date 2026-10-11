# Script — as rendered (V4; narration text unchanged since V1)

**Why This Robot Has No Pinky** · Future Got Weird · vertical Short, 1080 × 1920, 30 fps. **Default cut: 31.87 s (956 frames, retimed narration). Original-pace cut: 34.60 s (1038 frames).**

## Narration (spoken text only, 88 words — identical in both cuts)

Voice: ElevenLabs Test Voice (`kk5XaSLo2XAw0sKM98zU`), model `eleven_v4`, take A. Text is exactly the locked handoff script; no audio tags or stage directions were sent. **No new generation for V4.**

| Beat | Narration |
| --- | --- |
| B01 | This robot has no pinky. On purpose. |
| B02 | Boston Dynamics says its engineers taped their ring and pinky fingers together for a day. |
| B03 | The verdict? Leave it out. |
| B04 | Atlas’s new hand has four digits, but thirteen degrees of freedom. Independent ways to move. |
| B05 | The company says it can pinch, turn objects, and press tool triggers. |
| B06 | A fifth digit would mean three more actuators. More cost. More bulk. More things to break. |
| B07 | So the goal is a useful, reliable hand. |
| B08 | Looking human is optional. |
| B09 | Apparently, even robots have a budget. |

## Pace (the only audio change in V4)

- **Retimed cut (default):** the original take is time-compressed **1.05×, pitch-preserving** (ffmpeg `atempo`), after eight planned gap trims (6 ms equal-power crossfades; the verdict-suspense pause, the pause before the final joke, and every consonant are protected). One piecewise-linear time map (`tools/timemap_v4.py`, saved as `audio/v4/map_fast.json`) carries speech, alignment, events, captions, picture and effects, so the old and new clocks cannot drift apart; the retimed file's envelope was cross-correlated against the map (max lag 10 ms, `audio/v4/retime_report.txt`). Speech ends 30.68 s; picture and sound 31.87 s.
- **Original-pace cut:** the unchanged V1 narration, identity map, 34.60 s.
- **The retimed narration has not been listened to by a person** (see `QA_REPORT.md` §D). If the 1.05× pace sounds rushed on a phone, publish the original-pace files instead — they are complete deliverables.

## V4 shot map (same narration, V4 picture; times for the retimed cut)

| Shot | Time | Narration beat | Picture |
| --- | --- | --- | --- |
| B01 | 0.0–3.2 | This robot has no pinky. On purpose. | Front-view four-digit hand pinching a gear at frame 0; release, gear seats, hand opens (thumb kept above the post); dashed fifth slot; `NO PINKY?` with the kicker `ATLAS HAND · BOSTON DYNAMICS`; the slot ring bounces on *no*/*pinky* and firms up on *purpose* (no plate) |
| B02 | 2.7–7.4 | Boston Dynamics says its engineers taped … for a day. | Overhead experiment: tape wrap dominant, short mug/knob result, one clock cue, `ONE DAY` |
| B03 | 7.4–9.6 | The verdict? Leave it out. | Full-frame decision slip, large `KEEP IT` / `SKIP IT`, stamp (lands just before *Leave*) with a held mark |
| B04 | 9.1–14.8 | … four digits, but thirteen degrees of freedom. Independent ways to move. | Whole hand with badges 1–4 and `4 DIGITS` → loupe on the thumb base joint while `13 WAYS TO MOVE` lands whole on *thirteen* → fingers move one at a time |
| B05 | 14.8–18.6 | The company says it can pinch, turn objects, and press tool triggers. | Three staging angles, each owning its headline: overhead pinch (`PINCH.`), diagonal cube turn (`TURN.`), side drill press (`PRESS.`) |
| B06 | 18.6–24.2 | A fifth digit would mean three more actuators. More cost. More bulk. More things to break. | `ONE MORE FINGER?`; three large actuator modules tied to the dashed fifth slot; price tag (`$`) → footprint box expands → wrench and crack; each replaces the previous; no labels |
| B07–B08 | 24.2–28.6 | So the goal is a useful, reliable hand. Looking human is optional. | Closer workstation framing; `BUILT TO WORK` is gone before the second hand returns; larger guide with a visible nod; second block waits at the right end of the tray; `HUMAN` hand reference on *human* |
| B09 | 28.6–31.9 | Apparently, even robots have a budget. | Four-row receipt; dominant `NOT IN BUDGET` stamp on *budget*; tear into the opener |

## Every on-screen string in the V4 render

`ATLAS HAND · BOSTON DYNAMICS` (opener kicker and the closing tear's pre-roll only) · `NO PINKY?` · `ONE DAY` · `THE VERDICT` / `KEEP IT` / `SKIP IT` · `4 DIGITS` (badges 1–4) · `13` / `WAYS` / `TO MOVE` · `PINCH.` · `TURN.` · `PRESS.` · `ONE MORE FINGER?` (a `$` glyph on the price tag) · `BUILT TO WORK` · `HUMAN` · receipt rows `5TH FINGER ?`, `+3 ACTUATORS`, `+ COST + BULK`, `+ REPAIRS` and the stamp `NOT IN BUDGET`. **Removed since V3:** `ON PURPOSE.` plate, `13 DOF` badge, `COST` / `SPACE` / `REPAIRS` plates, the persistent `Source: Boston Dynamics` strip and the `RECONSTRUCTION` / `COMPANY-REPORTED ABILITY` / `ILLUSTRATION` pills.

## Typography

Captions: **Montserrat ExtraBold 800**, sentence case, 76 px, 90 px line spacing, ≤ 760 px wide, ≤ 2 lines (re-wrapped by measured glyph widths before any shrinking), cream with an ink outline (no plaque), bottom-anchored lane (baseline y = 1428), a clipped 14 px rise over 4 frames, replaced (never faded). One or two emphasis words switch to coral on their aligned spoken time (*no pinky, four, thirteen, three more, cost, bulk, break, budget, ring and pinky, purpose*); only the major reveals pop 5 %. Headlines and large numbers: **Barlow Condensed ExtraBold 800**, uppercase, one limited hard shadow. Receipt rows: JetBrains Mono (unchanged). Fonts are bundled from npm (`@fontsource/montserrat`, `@fontsource/barlow-condensed` 5.3.0, SIL OFL) and proven at render time.

## Captions

`FGW_Atlas_No_Pinky_V4.srt` (24 cues, 2–6 words, retimed cut) and `FGW_Atlas_No_Pinky_V4_OriginalPace.srt` are generated from the real alignment by `tools/build_cues_v4.py`: each cue starts at its first word and ends after its **final** word's measured end (60–120 ms hold, or a clean handoff to the next cue); the last cue ends before the closing tear. Earlier versions: `v3/`, `v2/`, `v1/`.
