# Living Skin V4: final continuity pass

This pass cleans up continuity in V3. The art, materials, cell animation, script, voice, audio mix, captions and
runtime are all V3's.
- **What changed:** camera choreography, scene sequencing, masking, and the timing of existing actions.
- **No new story beats.**
- **V3 untouched:** composition `LivingSkinV3` and `exports/FGW_Living_Skin_V3_*` are kept exactly as delivered.

## Deliverables (measured on the files)

| File | Measured |
|---|---|
| `exports/FGW_Living_Skin_V4_FINAL_REVIEW_1080x1920.mp4` | 1080×1920, 30 fps, 816 frames, **27.200 s**, H.264 High (CRF 12, keyframe every 0.5 s), BT.709, AAC 320 kb/s. SHA-256 `336f15d8…6cca` |
| `exports/FGW_Living_Skin_V4_FINAL_MASTER_2160x3840.mp4` | @@MASTER@@ |

**Source.**
- Composition: `source/src/v4/LivingSkinV4.tsx` (`LivingSkinV4`).
- `source/src/v4/Face4.tsx`: the face, with the attachment built into the cutaway.
- `source/src/v4/Finger4.tsx`: the finger world (incision, graft, in-place section).
- Shared, unchanged: V2's tissue renderer, V3's cells and repair drawing, V1's finger rig.
- Two small additions to `v3/Repair3.tsx`, both default off, so V3 renders identically:
  - an optional graft opacity;
  - an optional continuous palette blend.

**Transition list.** `production/V4_TRANSITIONS.md`, written before the final render: outgoing → incoming → new
information → keep, merge or remove.

**QA.**
- Reports: `qa/v4/v4_review_qa.json`, `qa/v4/v4_master_qa.json`, `qa/v4/motion.json`.
- Frame strips: `qa/v4/strips/`, at every brief target and V4 transition.
- V3 against V4 at identical timestamps: `qa/v4/compare/`.
- Sheets: `qa/v4/contact_3fps.png`, `qa/v4/v4_review_phone_ui_sheet.png`.
- Native-resolution frames: `qa/v4/native/`.
- Tool: `tools/qa_v4_sheets.py`.

**Standing editing rules.** Saved for future FGW productions at `Future_Got_Weird/FGW_EDITING_RULES.md`.

## Audio, captions and SRT: preserved

- **Same mix.** `audio/mix/FGW_Living_Skin_mix_APPROVED.wav` (SHA-256 `de525e8e…3ac5`). No regeneration, edit or
  stretch.
- **Byte-identical stream.** The V4 review's AAC stream matches V3's, V2's and V1's: SHA-256 `5ce784d1…`. Offset
  against the mix is **0.0 ms**, correlation 0.99972.
- **Transcript.** The Whisper transcript of the V4 file matches the locked script word for word (1.0).
- **Captions.** Wording, timing and screen-space position are unchanged; the overlay doesn't inherit camera
  transforms.
  - 19 of 21 caption windows pass ASR. The two that don't are the same speech-recognition misreads of a clipped
    window seen on the identical V2 and V3 audio ("This robot skin is a-", "Get stranger.").
  - `captions/FGW_Living_Skin.srt` is unaffected and unchanged.
- **Loudness.** −14.5 LUFS integrated, −2.4 dBTP, LRA 6.0.

## Transition changes

Motion is measured as the mean luma change between consecutive frames, at 270×480 (0–255).

| V3 | V4 | Change at the V3 frame (V3 → V4) |
|---|---|---|
| 3.83–6.97 s: cell → attachment → whole face (cutaway closes) → push to the corner | **One move.** The cell now sits above the insert's central perforation. The camera pulls back from the cell, down its gel column to that perforation, then out to the grin with the **cutaway still open** (5.77 s). The smile happens in the same framing: the mouth corner, the rim, and the insert visibly sliding. No whole-face wide view. | — |
| **6.967 s cut** to a separate anchor diagram | **Removed.** On "Tiny anchors", the camera pushes into the same perforation: one large attachment, neighbours lit on the three ticks. The attachment (keyhole perforations, gel columns, silicone, insert) is built into the face's cutaway at one consistent scale. | 78 → **14** |
| 7.8–9.42 s: diagram drive | The same camera moves along the link to the carriage, lead screw and motor inside the face's base. The motor pulls: the motor glows, the carriage and insert travel, and the columns and covering shear. | — |
| **9.467 s cut** to a face grin insert, then 10.4 s cut | **Insert removed.** The camera stays on the mechanism, then pulls back to the raised mouth corner beside the cutaway: the transmitted effect. | 117 → **8** |
| 10.4 s cut to the finger | **Kept**: the one deliberate cut between experiments. "EARLIER EXPERIMENT · 2022" is kept. | 116 → 106 |
| **12.83 s full-frame blade wipe** to a separate top view | **Removed.** The camera pushes into the same finger while the scalpel comes in from the upper right, slightly larger at first and settling to scene scale. Same direction, nothing covering the frame. | 35 → **4** |
| 13.16 s incision | Contact (small indent) → the blade draws across the top of the segment → the wound parts behind it → the blade withdraws. All in one framing; the wound stays put. | — |
| **14.1 s** side window, ~14.8 s wide finger, **15.3 s** re-close | **All removed.** The patch is carried in flat by the tweezers in the same framing, held over the wound, lowered on the tweezers cue, and contacts from one edge across. It conforms with a small, quickly damped settle, then is released. The wound stays in the same screen region throughout. | 31 → **1.5**, 43 → **1.2** |
| **17.067 s** patch panel cut, then a **17.367 s** palette reset | **One push into the graft.** A local longitudinal section opens in place: straight cut edges, with the dark interior and metal link of the finger's own joint cutaway. The palette blends from tissue colour to the microscope tone over the push (about 0.8 s, interpolated per colour, no flash). It lands in the existing Day 0–7 view. | 39 → **13**, 37 → **6** |
| 17.4–21.3 s Days 0–7 | Unchanged cells, counter and result. The micro section now sits on the finger's rigid interior, so the scale and object stay explicit. | — |
| **21.533 s** presentation change, 21.733 s dissolve, 22.267 s cut | **One exit.** Day 7 arrives on a readable view of the whole repaired section. One pull-back then follows the graft's edge: the palette blends back to tissue colour, the section closes in place over the repaired surface (integrated patch, no open slit, faint residual seam), and the finger flexes in the same shot. | 28 → **1**, 16 → 14 (continuous move), 49 → 0 |
| 22.84 s joint reveal | Kept. | — |
| **24.133 s** finger → face crop → whole face → push back in | **Editorial match kept, detour removed.** The finger's covering over its rigid interior is matched to the face's chin rim (covering over the white flange), upright and with no roll. Then one controlled move up the cheek to the opening corner framing: zoom only increases, and there's no whole-face wide view. It ends in frame 0's framing, smile phase and motion. | 74 → 69 (a cut by design) |

**Result.**
- Two cuts remain: 10.4 s (separate experiment) and 24.133 s (editorial match between separate objects).
- Everything else is a continuous camera move or a local reveal in the current view.
- Median frame-to-frame change: 3.3 (V3: 4.9).

## Technical checks

- **Scale and position resets.**
  - Each sequence uses one tracked camera: face 0–10.4 s, finger 10.4–24.13 s, face 24.13–27.2 s.
  - Keys are tracked world points with log-space zoom, so there's no one-frame scale or position reset inside a
    sequence.
  - Frame strips confirm continuity at every former cut.
- **Zoom direction.** Each reversal coincides with a new purpose:
  - 3.0 s: arrive at the cell;
  - 3.83 s: pull back to the attachment;
  - 5.77 s: grin, then in to the anchor on "Tiny anchors";
  - 8.6 s: out to the drive;
  - 12.1 s: in to the incision;
  - 16.4 s: into the graft;
  - 20.8 s: out to the finger.
- **Masks and cutaways.**
  - The face cutaway opens on the slice cue over 0.26 s and stays open to 10.4 s.
  - The finger section opens over 0.6 s and closes over 0.45 s.
  - The joint cutaway is unchanged.
  - The repaired-patch overlay hides as the joint cutaway opens, so nothing is drawn over the mechanism.
- **Transitional objects.**
  - One scalpel, never duplicated: no separate foreground blade layer.
  - The tweezers leave before the section opens.
- **Rigid parts.** The insert moves rigidly in its slot, by the same amount as the covering's bonded underside
  above it, so the attachment and the surface stay connected.
- **Fine-hatch texture.** At high magnification on the face base, a finer object-space hatch blends in, so the cut
  texture stays attached rather than sliding.
- **Captions.** Screen space.

## Verification performed

- **Normal-speed comprehension.** A 3 fps contact sheet of the whole film, plus V3-vs-V4 sheets for every window.
- **Frame stepping.** Six-frame strips (t−3, −1, 0, +1, +3, +6) at:
  - 6.967, 9.467, 10.4, 12.833, 14.1, 15.3, 17.067, 17.367, 21.533, 21.733 and 24.133 s;
  - each V4 transition.
- **Half speed.** As in V3: dense still sequences of every move during development. These were:
  - the face pull-back and push;
  - the incision, graft and section open;
  - the palette blend (frame by frame, 17.07–17.6 and 21.5–22.0 s);
  - the exit and the end move.
- **Muted, phone size.** `qa/v4/v4_review_phone_ui_sheet.png`: captions and key action stay clear of the
  approximate Shorts UI.
- **Audiovisual.** Stream identity, 0 ms offset, full transcript and per-caption windows on the file's own audio.
- **Native resolution.** 21 full-resolution frames in `qa/v4/native/`. The cut edges, cutaway masks, insert, link,
  carriage, keyholes, scalpel, tweezers and patch are all clean and attached.
- **Loop (end to start).**
  - Last-to-first frame change is 2.25, against about 1.0 for neighbouring frames (V3: 2.07 / 0.8).
  - The excess is the caption changing from "it's wearing is." to "This robot's skin". Camera, framing and smile
    phase are continuous by construction.

## Remaining limitations

1. **Not watched in real time.** Everything here was judged from rendered frames, strips, measurements and ASR.
   Please do one normal-speed watch with sound on a phone before publishing.
2. **Fastest moves.**
   - The pull-back from the cell (about 4.0–4.4 s, peak 36 per frame) and the push into the attachment (about 7.1 s,
     31) are the fastest continuous moves.
   - Both are dense with fibres, which inflates the measure.
   - The exit pull-back (about 21.8 s, 28) is quick because the flex lands on its sound cue at 22.28 s.
3. **Illustrative scale.** The finger's micro section shows cells far larger than real fibroblasts relative to the
   finger, as the face cutaway does. The section is a magnified illustration in place, not a measured scale.
4. **Illustrative drive.** The drive inside the face base is simplified: insert → link → carriage on a lead screw
   → motor. The 2024 study's anchors are "perforation-type". The perforation shape and the drive layout are
   illustration, based on secondary summaries, because the primary sources stay blocked (403) in this environment.
5. **Incision direction.** The incision now runs across the top of the finger. V1–V3 drew it along the finger. This
   is so the local section shows the same V wound as the existing repair drawing. The study's exact incision
   orientation isn't asserted.
