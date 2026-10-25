# Glass Climbing V3: report

**Deliverable:** `exports/FGW_Glass_Climbing_V3_REVIEW_1080x1920.mp4` (1080×1920, 30 fps, 1162 frames, 38.74 s,
captions burned in). **Not published.** Checked from the rendered file with contact sheets (every 6 frames over the
whole film, every 4 frames over the ranges changed during QC), stills, frame-difference measurements, the rig probe, a
phone-size sheet and two speech recognisers. **Nobody has watched it in real time with sound.** The narration is still
V1's stand-in voice (Runway eleven_v4 "Benjamin"; see `audio/narration/voice_provenance.json`), sample for sample.

Not changed from V2: the approved narration and voice, the explanation, the Weird Crew character, the 2D vector look,
the caption style.

## What changed from V2

| Brief item | V3 |
|---|---|
| Rig, anatomy, layer order | A new climb model (`source/src/v3/climb3.ts`): match-style (the far hand always takes the upper pad, the near pad works between chest and waist), so the arms never cross; the near foot always behind the far foot (legs never cross; checked as segment intersections on every frame); elbows hang below the bars; hands placed on the bars by IK and drawn closed round them; leg reach and strap length clamped; the neck counter-rotates so the head stays upright through lean-ins; the brows are held below the hairline (`dc/Head.tsx`); the head tips back, smoothly and only as far as needed, whenever the upper pad comes near it, so the far hand stays in view. |
| 22-28 beats | 28 shots (`production/V3_SHOTS_AND_TRANSITIONS.md`), most 0.8-1.7 s; the long ones (springs, field) are travelling takes with several stages inside. |
| One coherent climb cycle | weight transfer → peel → reach → reattach → rise, used in every bay shot; it keeps going off screen during the micro views and the springs, so each return finds him higher. On screen: six pad moves and two pull-ups, plus the height reveal (C6, K1). |
| Micro explanation | pad → tile darkening (through the glass) → wedges stand up (2.5D) → glass meets the tips → wedges bend and lie flat (section) → the whole array → one strip, the gap closing → molecular bridge → back out through many contacts to the whole pad holding him. |
| Springs in five shots | reveal (cover lifts away), load through the handle, close on the springs taking their shares, one section losing contact while its neighbours carry on, back to the full pad. |
| Transitions | cuts on action, match cuts at a new scale (strap, tile, contact line), A2 and K5 the same framing on glass then brick; every camera move follows something. |
| Environment | the outside of a tall glass office building: storey-high panes with interiors and reflections (skyline, clouds), spandrels, mullions, base channel, brick plinth, pavement, two parallax layers of city and sky with atmospheric fade. |
| Opening | 0-1 s close on hands and pad pressing on; 1-2.4 s the pad on the glass in section, the layer compressing; 2.4-3.4 s his feet step from the stool into the stirrups and leave it (the stool stays); 3.4-4.1 s pull back: all of him hanging, the stool empty below; from 4.1 s climbing with a follow camera. |
| Catch | he looks down the building to where the glass meets the brick; the boundary in section; he brings the pad down onto the brick; the same press close-up as the opening, now on brick (contact only on the peaks); glass and brick side by side at the wedge scale; the pad peels off the brick. |
| Loop | the brick peel flows into the lift back to the glass and the opening shot; no fade, end card or pause. Every value in the climb state at frame 1162 equals frame 0 (95 values, checked by the probe). |
| Sound | V2's synthesised palette on the V3 events (`tools/v3/make_audio_v3.py`): the step-off, the straps taking weight, every on-screen peel and seat, the press, the springs (including a soft slack for the lost section), the brick press and creep, a sharper tear at the failure. |

## Measurements from the file

| Check | Result |
|---|---|
| Streams | H.264 High, 1080×1920, 30 fps, 1162 frames, yuv420p, BT.709; AAC 48 kHz stereo 317 kb/s; 38.74 s |
| Loudness | -14.6 LUFS integrated, LRA 1.7 LU, true peak -2.9 dBFS (as V2) |
| Black frames / freezes ≥ 1 s | none / none |
| Audio sync vs the mix | offset 0.0 ms, correlation 0.99994 |
| Speech (MP4 audio) | Whisper base.en WER 0.008 ("pressed" → "press"); Zipformer 0.025 ("onto" → "on to", "grip" → "gripe"); Vosk small 0.084 (its usual mishearings) |
| Captions vs Vosk words | 26/28 windows ≥ 0.75; the two misses are Vosk errors ("climate", "put"), not timing |
| Motion scan | mean frame change 10.4 (V2: 8.35); every spike is on a planned cut (30, 72, 176, 307, 535, 680, 724, 768, 904, 945, 1017, 1063, 1106); no run of 12 near-still frames; the longest quiet runs are 6-7 frames (146-152, the pad seating before the cut; 536-541 and 681-686, a cut's first frames) |
| Loop seam, picture | last frame → frame 0 with the caption band masked: mean change 0.68, against 1.33 and 2.55 for the two steps before it (the smallest change in that stretch). Unmasked it is 2.0-2.7: the caption changes from "contact." to "If you pressed" there, by design |
| Loop seam, sound | the mix's last and first samples differ by 0.0028; the bed and effects wrap across the junction |
| Loop played 3× | `qa/FGW_Glass_Climbing_V3_loop_x3.mp4`: about the last 1.5 s → first 1.5 s, three times (cut on keyframes, so each tail starts a few frames early) |
| Rig probe (`tools/v3/rig_probe3.ts`, every frame the climber is on screen) | hands on bars: worst 2.7 units (~4 mm); leg reach ≤ 0.98; strap stretch ≤ 1.00; near hand always below the chin (≥ 130 units below the head centre); far hand's grip ≥ 37 units outside the head's outline; legs never cross; a loaded pad slides at most 1.1 units/frame (the brick creep at 1111, deliberate); every state value at frame 1162 equals frame 0 |

## Found and fixed during QC (on sheets from the rendered file, or in the measurements)

- **The far hand disappearing behind his head** while he pulled up under the upper pad (162-168, 843-851) and through
  the whole brick crouch (994-1140), where it read as a hand clutching the back of his head. He now leans in less at
  the brick, and his head tips back and away from the wall as far as needed (continuous, at most 26°). The probe now
  checks this on every frame.
- **A jump in his body at the loop** (hips 20 units, far wrist 10°): the brick lean-in eased out after the last frame,
  and the breathing cycle didn't divide the film. Both are now periodic; the probe compares the whole state, not a few
  joints.
- **Two camera jumps at cuts that should be seamless** (A5 → A6, K7 → K8): each now continues from the frame before.
- **Captions** over his head (frames 17, 151, 852), face (994), hands (828-840, 1020) and the pad plate (1040): moved.

## Remaining limitations

- **Stand-in voice**, not the channel narrator. Not listened to by a person.
- **The straps cross in the side view** at some frames (the near foot is kept behind so the legs never cross; the
  straps are at different depths but overlap when drawn flat).
- **In the brick crouch the far hand is close to his hair** (visible, gripping, but near the spikes): the far pad has
  to stay where frame 0 has it for the loop.
- **Off-screen climbing and descent:** some of the climb happens during the micro and spring views, and the descent
  to the bricks under the boundary view (906-950).
- **Press and boundary close-ups exaggerate** the contact layer (14 mm) and the brick's roughness for legibility; the
  molecular view and spring counts are schematic (see `production/SOURCE_NOTES.md`).
- **A superseded V3 render** (before the QC fixes above) is in the branch history (commit 7deda7a), committed by
  mistake; the file at the same path has since been replaced. Removing it from history needs a force-push, which
  was not done.
- No 2160×3840 master was asked for in V3; none rendered.
