# Living Skin V2: change log

V2 is an animation, hook and visual-storytelling pass. V1 files and source are untouched: composition `LivingSkin`,
`exports/FGW_Living_Skin_REVIEW_1080x1920.mp4` and `exports/FGW_Living_Skin_MASTER_2160x3840.mp4`.

## Deliverables (measured on the files)

| File | Dimensions / runtime |
|---|---|
| `exports/FGW_Living_Skin_V2_REVIEW_1080x1920.mp4` | 1080×1920, 30 fps, 816 frames, **27.200 s**, H.264 High (CRF 12, keyframe every 0.5 s) + AAC 320 kb/s. SHA-256 `29e268a3…eb46b` |
| `exports/FGW_Living_Skin_V2_MASTER_2160x3840.mp4` | 2160×3840 native, rendered at 2× from the vector source (not upscaled); 30 fps, 816 frames, 27.200 s, CRF 14. It passes the same checks as the review, with the same byte-identical audio stream. SHA-256 `dbd27d0a…22b5` |

**Source.** `source/src/v2/`; the composition is `LivingSkinV2`.

**QA.** Results are in `qa/v2/v2_review_qa.json` and `qa/v2/v2_master_qa.json`. The images are:
- `qa/v2/strips/` (frames around every cut);
- `qa/v2/compare/` (V1 against V2 at the same timestamps);
- `qa/v2/contact_3fps.png`;
- `qa/v2/v2_review_phone_ui_sheet.png`.

## Approved audio: reused unchanged

The mix is `audio/mix/FGW_Living_Skin_mix_APPROVED.wav` (SHA-256 `de525e8e…3ac5`). It is the same file the V1
masters were made from.
- **No changes to the audio.** No regeneration, re-edit, re-mix, time-stretch or pitch change. The words, voice,
  timing and runtime are V1's.
- **Byte-identical stream.** The AAC audio stream inside the V2 review is byte-for-byte identical to V1's. Both
  hash to SHA-256 `5ce784d1…1317`, compressed and decoded.
- **Sync.** Cross-correlation against the approved WAV gives a 0-sample offset.
- **Transcript.** A speech-recognition transcript of the V2 file matches the locked script exactly.
- **Loudness.** −14.5 LUFS integrated, −2.4 dBTP, the same as V1.
- **Picture follows sound.** Every picture event is cut to the approved mix's own effect cues
  (`source/src/data/sfx_v1.json`) and the measured word times. The cues: motor tug, "alive" impact, dive whoosh,
  anchor ticks, motor pull and latch, second-hook drop, incision, tweezers, patch contact, time jump, day ticks,
  cutaway clack, boundary whoosh, closing tick.

## What changed, by timestamp

**0–1.27 s: opening rebuilt.**
- Frame 0 is a 5.6× close-up of one mouth corner, already under tension. The skin edge and white face-form flange
  stay in frame.
- The corner insert visibly deepens the smile in time with the motor-tug sound.
- New surface detail, all moving with the same deformation field so it stays attached:
  - a fold from the corner;
  - stacked compression creases;
  - a corner pinch where the anchor draws the surface in;
  - a soft wet highlight defined on the surface, so it slides and stretches with the pull.
- At 0.72–1.22 s the camera reveals the whole grin once. It does not do a zoom-out-and-back-in cycle.

**1.27–3.0 s: forehead/cheek window removed; sectional reveal instead.**
- On "alive" a clean section plane sweeps through the face (with the existing slice sound). It exposes the
  covering's real thickness:
  - dermis over silicone;
  - V-shaped perforations in the base, with gel locked through them.
- The camera orbits to face the cut and moves into the layer, until the tissue fills the frame.
- The cells drawn there are the same ones used everywhere else, so the dive is one continuous move.

**3.0–3.83 s: cell detail.**
- One focal fibroblast with an irregular, living contour.
- A dimensional nucleus: envelope, cast shadow, chromatin, nucleoli, highlight.
- Thin, tapering processes that run along the collagen.
- Blurred fibres in front and dim fibres behind move at different rates (parallax).
- Orientation is held across the dive. No spinning.

**3.83–5.0 s: motivated pull-back.**
- The camera travels along the fibres, down the gel channel through the silicone, into a perforation in the base,
  then out to the sectioned device.
- In V1 this was a matched cut into an abstract side-profile diagram.

**5.0–6.97 s.**
- The section closes as the camera orbits back to the 3/4 view.
- The covering relaxes, then the smile motor deepens the grin harder than in V1.
- One readable attribution, "UNIV. OF TOKYO · 2024", replaces two small chips.

**6.97–9.47 s: repeated side profile replaced with a single-attachment cross-section.**
- One attachment, shown large. Gel fills tapered (V-shaped) perforations through a rigid support and joins the
  dermis above it without a seam. These are not separate pegs or studs, and there are no muscles.
- The three perforations light in turn on the three existing anchor ticks.
- On "motors pull underneath":
  - the motor turns a lead screw;
  - the carriage, link and support slide;
  - the gel columns lean as they carry the force;
  - the fibres brighten under tension;
  - the silicone and dermis shear, and the surface folds.
- Cut to the front grin at the latch, the peak of the movement.
- The linkage is clearly drawn as a simplified illustration.

**9.47–10.4 s.** The camera travels to the cheek's curved edge with an anticipating roll.

**10.4–12.84 s: second hook.**
- Immediate cut on the second-hook drop to a different setup: the robotic finger.
- The camera unrolls from tissue level to establish the mechanical base. The finger flexes once on the servo sound.
- "EARLIER EXPERIMENT · 2022" is kept, larger. The small "ILLUSTRATION" chip is removed.
- The scalpel approaches, then a large out-of-focus blade crosses in front of the lens. This is the wipe into the
  macro.

**12.84–14.1 s: incision.**
- Top macro of the same spot: the back of the middle segment.
- The blade indents the covering (a moving dimple) before it separates it.
- A narrow slit opens behind the blade, with:
  - a shadowed lip;
  - a lit lip edge;
  - a shallow inner wall.
- Faint tension creases fan from the slit's ends. No blood, fluid or tearing.

**14.1–14.73 s: new.** A section across the finger at the wound shows the living covering around the rigid printed
core. The defect is a narrow, shallow notch in the covering only.

**14.73–15.3 s.** The same wound on the whole finger.

**15.3–17.07 s: graft.**
- The collagen sheet is fibrous and translucent: two crossing fibre sets and an irregular edge.
- Held tilted, it bends to the curved surface.
- On the patch-contact sound, contact sweeps across it from one edge, with a visible contact front and a wet sheen.
  It then settles in a small decaying ripple.
- The tweezers release and withdraw.
- Only after contact completes does a marker pick a point at the graft edge and the camera dives in.

**17.07–21.73 s: repair as a miniature story.**
- The same narrow cut sits under the graft. It is narrower and lighter than V1's dark wedge.
- DAY 0 appears on the time-jump sound.
- The camera pushes to one cell at the tissue/graft boundary, then follows it (DAY 1–4):
  - it adheres (adhesion points);
  - it extends a soft leading edge;
  - its rear follows, step by step.
  - It crawls along a path into the graft. No tumbling, no upright spinning, no fading in.
- The camera widens as neighbouring cells follow, new matrix fills the cut and its edges draw together.
- At DAY 7 the graft is integrated but still identifiable (dashed edge), with fibres crossing its boundary.

**21.73–22.8 s.**
- Pull back to the same surface wound: the slit, now faint under the integrated graft.
- The same finger flexes again on the second servo sound.

**22.8–24.13 s: "The machine isn't alive."**
- A closer cutaway of the covering shows the rigid link and joint pin.
- The camera follows one mechanical action: the joint pivots.
- It then tracks the skin/rigid boundary.

**24.13–27.2 s.**
- A matched material boundary cuts to the face's covering over its base, the sectioned face from the opening. It
  is not the V1 bordered inset.
- On "But the skin" the camera returns into the living tissue and its cells.
- On "is" the section closes on the existing closing tick.
- The face is already starting its mechanical tug as the camera arrives at the opening framing.
- **Loop.** Smile phase, camera position and velocity, view angle and lighting all match frame 0. The motor-tug
  sound spans the seam.
- **Seam measurement.** Last-to-first frame difference is 0.91, against 0.81–0.92 for normal frame steps; this
  measurement excludes the caption band, where the first caption reappearing is the only other change.

**Labels.** Kept, and enlarged where kept:
- "HUMAN SKIN CELL";
- "UNIV. OF TOKYO · 2024";
- "EARLIER EXPERIMENT · 2022";
- "COLLAGEN PATCH";
- the DAY 0 → DAY 7 counter.

Removed: the small "CROSS-SECTION · ILLUSTRATION" and "ROBOTIC FINGER · ILLUSTRATION" chips. The illustration
disclosure stays in the description and source notes.

**Captions.** Wording, timing and style are unchanged (the same `Captions` layer and timeline). None needed moving:
the blade, slit, graft, day counter and focal cells all sit above the caption band.

## Verification performed

**Automated, on the rendered V2 files.**
- Stream properties.
- Loudness.
- Black and freeze detection: none found.
- Keyframe spacing: at most 0.5 s.
- Audio sync and transcript.
- Per-caption speech windows: 19/21. The same two short-window recognition misses as V1; the full transcript is
  exact.
- Loop seam.

**Inspected by me as still frames of the render.**
- Every frame of the opening, at 0.5 scale and full resolution.
- Strips around all 17 V2 cuts.
- Full-resolution frames of:
  - blade contact (13.1 s);
  - the open slit (13.55 s);
  - patch contact (16.38 s);
  - cell migration (19.3 s);
  - the material reveal and the boundary match (23.3–24.6 s);
  - the loop boundary.
- V1-vs-V2 sheets at identical timestamps for 0–3, 7–10.4, 13–17, 17–22 and 23–27.2 s.
- Phone-size frames under a Shorts UI mask.

**Defects found and fixed during V2.**
- A highlight read as a white hook.
- Fibroblast processes read as limbs.
- Anchor columns read as bone-like pegs. The fix: gel continuous with the dermis, and no knobs.
- The blade wipe did not occlude the frame.
- A duplicate scalpel appeared on the wipe frame.
- The cross-section defect read as a dark wedge.
- The cell leading edge read as a dart, then as a hexagon.
- The cell pull-back was too fast to read (62 luma levels per frame); it now moves through intermediate stops.
- The opening framing was too loose.
- The ending did not reach cell level.

## Remaining limitations (please read)

1. **No real-time viewing.** I could not watch the film at normal speed or listen to it: this environment has no
   video or audio playback. Motion was judged from consecutive frames, strips and frame-difference measurements.
   Please watch it at normal speed on a phone before publishing.
2. **Fast transitions.** The two dives (2.57–3.0 s and 16.77–17.07 s) and the second pull-back (21.73 s) are fast by
   design, matched to the existing whoosh sounds. During the dives, 2–3 frames pass through the pink-to-teal palette
   change.
3. **Attachment illustration.** The perforation-anchor drawing follows the 2024 paper's concept as summarised in the
   sources I could reach. The press-release figures were not opened (the University of Tokyo hosts were blocked).
   The movable corner insert, link, lead screw and motor are illustrative, not the real actuator layout.
4. **Finger interior.** The cross-section's rigid core and joint are generic. The 2022 finger's internal design is
   not depicted from the paper.
5. **Partial grin in the section.** While the section plane is open (1.3–5.0 s and 24.1–26.4 s), the cut removes the
   right part of the covering, including part of the right mouth corner. This is a cutaway convention, not damage to
   the face.
