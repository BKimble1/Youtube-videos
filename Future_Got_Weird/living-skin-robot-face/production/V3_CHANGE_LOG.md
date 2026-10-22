# Living Skin V3: change log

V3 is a coherence and quality pass on V2. The priority was that it makes sense and looks good: more realistic only
where the quality holds. V1 and V2 files and source are untouched. V2 is composition `LivingSkinV2`, exported as
`exports/FGW_Living_Skin_V2_*`.

## Deliverables (measured on the files)

| File | Dimensions / runtime |
|---|---|
| `exports/FGW_Living_Skin_V3_REVIEW_1080x1920.mp4` | 1080×1920, 30 fps, 816 frames, **27.200 s**, H.264 High (CRF 12, keyframe every 0.5 s), BT.709, plus AAC 320 kb/s. SHA-256 `@@REVIEW_SHA@@` |
| `exports/FGW_Living_Skin_V3_MASTER_2160x3840.mp4` | 2160×3840 native, rendered at 2× from the vector source (not upscaled); 30 fps, 816 frames, 27.200 s, CRF 14. SHA-256 `@@MASTER_SHA@@` |

**Source.**
- `source/src/v3/`, composition `LivingSkinV3`: `LivingSkinV3.tsx`, `Face3.tsx`, `Anchor3.tsx`, `Finger3.tsx`,
  `Repair3.tsx` and the `ArtTest3` test still.
- It reuses V2's shared tissue renderer (`v2/Tissue2.tsx`), V2's cue tables (`v2/common2.tsx`) and V1's finger rig
  (`art/Finger.tsx`), all unchanged.

**QA.**
- `qa/v3/v3_review_qa.json` and `qa/v3/v3_master_qa.json`.
- `qa/v3/motion.json`: a frame-to-frame change scan of V2 and V3.
- `qa/v3/strips/`: frames around every V3 shot boundary and every V2 problem timestamp.
- `qa/v3/compare/`: V2 against V3 at identical timestamps.
- `qa/v3/contact_3fps.png`, `qa/v3/v3_review_phone_ui_sheet.png`, `qa/v3/native/` (full-resolution frames).
- Tools: `tools/qa.py`, `tools/qa_v3_sheets.py`, `tools/export_cues_v3.ts`. The cue list is in
  `production/v3_cues.json`.

## Approved audio: reused unchanged

- **Same file as V1 and V2.** The mix is `audio/mix/FGW_Living_Skin_mix_APPROVED.wav` (SHA-256 `de525e8e…3ac5`),
  copied to `source/public/audio/mix_approved.wav`. It was not regenerated, re-edited, re-mixed or stretched.
- **Byte-identical stream.** The AAC audio stream in the V3 review is byte-for-byte identical to V2's (and V1's).
  All three hash to SHA-256 `5ce784d1…`.
- **Sync.** Cross-correlation with the mix gives a **0.0 ms** offset and a correlation of 0.99972 (AAC).
- **Transcript.** A Whisper transcript of the V3 file matches the locked script word for word (match 1.0).
- **Captions.** 19 of 21 caption windows pass. The other two fail in exactly the same way on V2, because the
  audio is identical. Both are misreads by the speech recogniser of a cut-off window: "This robot skin is a-" and
  "Get stranger." Caption wording and timing are unchanged (the V1 `Captions` overlay, in screen space).
- **Loudness.** −14.5 LUFS integrated, −2.4 dBTP, LRA 6.0 (unchanged).
- **Picture events are still cut to the mix's own effect cues and measured word times.**
  - Cues: "alive" hit, slice, dive, arrive, pull-back, smile motor, three anchor ticks, motor pull, latch, second
    hook, flex, incision, tweezers, contact, dive 2, day ticks, pull-back 2, flex 2, clack, boundary, close.

## What changed, by timestamp

### 1. Camera continuity (whole film)

**Diagnosis.** In V2 the pops came from three things:
- **Separate shot components with independently keyed cameras.** Each new view started from its own camera with
  no carried state.
- **One overshoot-and-reverse.** The 4.97–5.03 s face camera went z 7.5 → 1.2 → 1.55. That is a pull-back past the
  composition and back again, while the yaw orbit and the section close started on the same frame.
- **Rolls used to hide resets.** These were at 10.4 s and 24.133 s.

**Fixes in V3.**
- **Single continuous moves.** These use one camera with tracked world points (`trackCam`: log-space zoom, the
  tracked point held on screen). Segment easings are chosen so the zoom velocity is continuous across keys, not the
  same ease everywhere.
- **Deliberate cuts.** These are matched on a physical point and on the direction of motion. None uses blur,
  flash or spin. No camera rolls anywhere in V3.

**Measured.** This is the mean luma change between consecutive frames at 270×480 (0–255 scale). V2 → V3 at the V2
problem frames:

| V2 problem | V2 | V3 | What V3 does there |
|---|---|---|---|
| 4.97–5.03 s scale pop | 70 | **8** | one monotonic pull-back, no reversal |
| 6.967 s anchor entry | 89 | 78 | deliberate matched cut (face → section); now followed by a slower descent |
| 9.467 s anchor return | 100 | 117 | deliberate cut, different material; matched point and continued pull-back (see 3) |
| 14.1 s ring view | 47 | 31 | ring removed; cut to a side cutaway of the same incision |
| 21.733 s micro → macro cut | 82 | **16–23** | continuous scale-matched pull-back with a 6-frame dissolve |
| 22.267 s cut | 49 | **0.1** | cut removed; same shot |
| 24.133 s face section and roll | 118 | 73 | no roll; covering-over-rigid boundary match |

Median frame change is about 4.8 in both versions.

### 2. 0–6.97 s: face, local section, cell and pull-back

- **Opening kept.** The frame-0 smile-corner close-up and its immediate movement are unchanged.
- **Rim contact (`Face3`).** Where the covering meets the white flange there is now:
  - a soft contact shadow;
  - a stretch sheen from the mouth corner toward the rim;
  - a compression crescent at the rim.

  All of these scale with the smile. They replace V2's strain lines, which read as whiskers.
- **1.27 s (slice).** The section is now a **local cutaway notch** at the mouth corner. It is masked out of the
  surface with tight strip hulls, so the face stays whole and upright; no half of the face is removed. Its exposed
  wall shows:
  - the hatched rigid base;
  - two short keyhole perforations (a V narrowing into an undercut, gel locked in it);
  - gel columns through the translucent silicone;
  - the living dermis, drawn by the same tissue renderer as every other tissue view.
- **Sequence.** Exterior → tissue section (1.3–2.6 s) → cell (3.0–3.8 s) → attachment (4.3–4.75 s) → exterior
  (5.77 s).
- **3.83–5.77 s: one pull-back.**
  - The camera pulls out of the cell along the tissue to the attachment, and the face's yaw eases back. This is a
    single path, still tracking the attachment, landing once on the smile composition (z 1.62) at 5.77 s.
  - No overshoot and no reversal; the notch closes during the pull-back.
  - The face relaxes during "to a mechanical face", then smiles on the motor cue.
  - The "UNIV. OF TOKYO · 2024" chip appears on landing.

### 3. 6.97–9.47 s: the attachment, rebuilt (`Anchor3`)

- **Entry (6.967 s).** The face shot pushes into the mouth corner. The cut lands on the covering's surface above
  the central perforation at the same screen region, still pushing in. The camera then descends the gel column into
  that one perforation and arrives as the second tick sounds. The descent was slowed after the first draft, which
  measured 33–35 per frame there.
- **One large attachment, with neighbours.** It is a **keyhole perforation in a rigid support**: a V narrowing
  into the support, then a rounded undercut. The gel fills it and locks in. A gel column with collagen fibres rises
  from each perforation through the translucent silicone into the dermis.
  - The three central perforations, on the movable insert, light in turn on the three anchor ticks.
  - The neighbouring perforations in the fixed support are drawn identically, for context.
  - There are no pink cones or tapered bundles.
- **Drive (illustrative).** A machined insert → link → carriage on a lead screw → motor. The motor glows on "motors";
  the screw turns and the insert travels.
- **Local tug.** The displacement is a Gaussian around the insert. The soft layers shear above it, the surface dips
  over the pull and bunches just ahead of it, and away from the insert nothing moves. There is no whole-slab wave.
- **Return (9.467 s).** The section camera pulls back while tracking the surface point above the insert. The grin
  shot starts with the mouth corner at that point's screen position and continues the pull-back to the grin.
- **10.4 s.** The grin → finger cut no longer uses a roll. It is a plain cut on "But", with the finger already
  framed.

### 4. 12.8–17.2 s: incision and patch

- **Blade wipe kept, sharper.** Foreground blur is σ 5 (V2: 16).
- **Contact, indent, separation and release are one action.** The cut sits on the incision cue, and the wound stays
  fixed in place (unchanged from V2).
- **14.1 s: ring removed.** The end-on circular cross-section is replaced by a **local side cutaway of the same
  incision**, in the side view of the same finger. It shows the covering in section on the rigid printed finger,
  with the shallow V defect where the blade went in. The cutaway closes as the camera pulls back to the whole finger.
- **Patch (`PatchView3`).**
  - A felt of collagen fibres: a dominant set along the finger and a sparser crossing set.
  - The tilted sheet bends as it nears the curved surface.
  - Contact sweeps from one edge to the other, with a wet sheen behind the contact front.
  - The V2 contact line, which read as a seam, is removed.
  - Settle ripple: amplitude 1.6, frequency halved, decay time-constant 0.11 s (V2: amplitude 5, 0.14 s). No hover, clipping or drift after
    contact.
- **16.77–17.07 s.** The dive now goes to the **graft's distal end on its centre line**: the same end the micro
  section opens on, with the graft to the left and tissue below in both. The marker ring sits on that end.

### 5. 17.07–21.73 s: cells (`Repair3`)

- **Day 0–7 kept.**
- **Migrating cells redrawn as fibroblasts.** Each has:
  - a thin trailing tail and a body around the nucleus;
  - a narrower neck;
  - a broad, fan-shaped leading lamella with a rounded, slightly ruffled edge, one side of the fan larger;
  - a short side protrusion growing out of the body on the other side.

  It is one continuous silhouette, so no part detaches.
- **Migration cycle per cell.** The front protrudes → adhesions form at the leading edge → the body and nucleus
  advance → the rear releases (brief retraction fibre) and follows.
  - Each cell has its own path, start, duration and number of cycles, so there is no lockstep.
  - Cells move only by this cycle: no swimming, paddling or spinning.
- **Collagen is stable.** The stationary tissue and graft fibres do not move.
- **Cells enter the graft's volume.** The graft is drawn in two layers: rear fibres behind the cells, front fibres
  over them.
- **Graft to tissue integration.** Tissue fibres grow across the boundary as the days pass.
- **Calmer start.** The warm-to-teal tone change at the micro entry takes 0.5 s (was 0.28 s).

### 6. 21.3–22.8 s: repair payoff, one continuous pull-back

- **One move.** A single log-zoom curve, shared by the micro view and the finger view, runs from the repaired graft
  (21.32 s) to the whole finger (22.283 s, on the flex cue).
- **Scale-matched.** The graft's width in the micro view equals the patch's width on the finger, and the graft's
  surface point is held on screen.
- **Matched dissolve.** The two views dissolve over 6 frames at 21.733 s, at the matched scale. The micro view warms
  from teal to tissue colour before it, so the dissolve is warm to warm.
- **Repaired surface.** No dark open slit. The finger shows the integrated graft region, faint fibres, a dashed
  boundary and a pale residual seam.
- **No cut at 22.267 s.** The finger flexes in the same shot.

### 7. 22.8–27.2 s: final reveal and loop

- **Joint reveal kept (clack, 22.84 s).** The covering opens over the joint. The rigid segments rotate about the
  same pin, and the covering stays attached (V1 rig). The repaired-patch overlay is hidden as the cutaway opens; the
  first V3 render showed it drawn over the exposed mechanism, which was fixed before the final render.
- **24.133 s: no sideways face section and no roll.**
  - The camera settles on the boundary between the finger's covering and its rigid support (horizontal, proximal
    segment).
  - It matches to the face's chin rim: the pink covering over the white flange, horizontal, upright, at the same
    screen height.
  - It then pulls back to the upright face for "But the skin".
- **Ending.** The camera travels to the mouth corner and finishes in the opening framing and smile phase.
  - It mirrors the start's velocity, so the loop continues with no reset hold.
  - V2's closing cutaway reprise was dropped; it was not asked for, and its block-like notch was the least
    convincing frame of the ending.
  - Loop seam: last-to-first frame change 2.05 (V2 2.07). The neighbouring steps are 0.8, the same as V2.

### 8. Material quality

- **Lighting.** One light direction and the same restrained highlights as V2.
- **Thickness.** Consistent covering thickness: one tissue renderer and one covering-point model across face,
  section and anchor.
- **Texture stability.** Pores and fibres are seeded and fixed to the material, so textures don't slide, boil or
  pulse.
- **Machinery.** Insert, link, carriage, screw, motor and finger segments are drawn as rigid shapes.
- **Readability.** Cells and fibres stay legible at phone size (see the phone sheet).

### 9. Captions, attribution and sources

- **Captions.** Unchanged (wording, timing, screen-space position).
- **On-screen attribution.**
  - "UNIV. OF TOKYO · 2024" on the face.
  - "EARLIER EXPERIMENT · 2022" on the finger, which keeps the earlier-experiment distinction.
  - "COLLAGEN PATCH" and the Day 0–7 counter.
- **Primary references.** Unchanged in `production/SOURCE_NOTES.md`:
  - https://www.u-tokyo.ac.jp/focus/en/press/z0508_00360.html
  - https://doi.org/10.1016/j.xcrp.2024.102066
  - https://www.hybrid.t.u-tokyo.ac.jp/en/highlight-research/956b0c88-e25d-42d3-9590-b6d82f61fe46/
- **Perforation design.** The rigid support, keyhole perforation, gel columns and silicone follow the 2024 paper's
  "perforation-type anchors" concept as summarised in secondary sources. The drive is illustrative.

## Verification performed

- **Normal-speed and frame-stepped review.**
  - 3 fps contact sheet of the whole film.
  - 6-frame strips at every V3 boundary and every V2 problem timestamp: t−3, −1, 0, +1, +3, +6 frames.
  - The motion scan above, for every frame.
- **Half speed.** Reviewed as frame-stepped strips (above) and as 0.1–0.2 s still sequences of every move during
  development: the 4.4–5.9 s pull-back, the anchor entry and descent, the graft dive, the micro → macro pull-back,
  the joint and the boundary match.
- **Native resolution.** 1080×1920 frames of the cutaway, anchor, wound cutaway, patch and cells are in
  `qa/v3/native/`. The 4K master was rendered from vectors at 2×.
- **Phone size, muted.** `qa/v3/v3_review_phone_ui_sheet.png`, with an approximate Shorts UI mask.
- **Audiovisual.** Stream identity, 0 ms offset, transcript and per-caption ASR on the file's own audio.
- **V2 against V3.** `qa/v3/compare/` at identical timestamps for 0–7, 7–10.4, 12.8–17.2, 17.2–22.8 and 22.8–27.2 s.

## Remaining issues (please read)

1. **Not watched in real time.** I can't play video or audio in real time here. Everything above was judged from
   rendered frames, strips, measurements and ASR. Please do one normal-speed watch with sound on a phone before
   publishing.
2. **Primary sources still blocked.** The network policy blocks the three primary sources (403). The anchor design
   follows the paper's concept from secondary summaries; the citations are kept as they were.
3. **Deliberate cuts remain.** These are 6.967, 9.467, 10.4, 12.83 (blade wipe), 14.1, 15.3, 17.07 and 24.133 s.
   They are matched on a point, boundary or action, but a change of material (skin to section, section to face)
   still makes a large frame change. That is inherent to a cut.
4. **Fast moves to watch.** The micro pull-back at 4.0–4.2 s (luma change 28–37 per frame) and the anchor
   pull-back to the drive at 8.1 s (29–30) are the fastest continuous moves. Both have a lot of fine fibre detail,
   which inflates the measure. Check them at normal speed.
5. **Cutaway notch and wound window.** These are illustration devices: they open and close. They read as local
   sections, but they are not physical events.
6. **Warm graft in the first micro frames (17.07–17.3 s).** The graft reads as a pale, nearly opaque block until
   the teal microscope tone takes over.
